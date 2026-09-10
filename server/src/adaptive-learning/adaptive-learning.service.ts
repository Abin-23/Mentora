import { Injectable, NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import { AdaptiveLearningEngine, KnowledgeState, TopicData } from './engine';
import { GeneratePathDto } from './dto/adaptive-learning.dto';
import neo4j from 'neo4j-driver';

function toNumberSafe(val: any): number {
  if (val == null) return 0;
  if (typeof val.toNumber === 'function') {
    return val.toNumber();
  }
  return Number(val);
}

@Injectable()
export class AdaptiveLearningService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly prisma: PrismaService,
    private readonly resourcesService: ResourcesService,
  ) {}

  async generatePath(studentId: number, courseId: number, dto?: GeneratePathDto) {
    const limit = dto?.limit || 5;

    // 1. Fetch Topics
    const topicsResult = await this.neo4jService.read(
      `
      MATCH (c:Course {courseId: toInteger($courseId)})-[:HAS_TOPIC]->(t:Topic)
      RETURN t.topicId AS topicId, t.title AS title, t.sequenceNumber AS sequenceNumber, t.difficulty AS difficulty
      ORDER BY t.sequenceNumber
      `,
      { courseId: neo4j.int(courseId) }
    );
    const topics: TopicData[] = topicsResult.records.map((rec) => ({
      topicId: toNumberSafe(rec.get('topicId')),
      title: rec.get('title'),
      sequenceNumber: toNumberSafe(rec.get('sequenceNumber')),
      difficulty: rec.get('difficulty'),
    }));

    if (topics.length === 0) {
      throw new NotFoundException(`No topics found for course ${courseId}`);
    }

    // 2. Fetch Prerequisites
    const prereqResult = await this.neo4jService.read(
      `
      MATCH (c:Course {courseId: toInteger($courseId)})-[:HAS_TOPIC]->(t1:Topic)
      MATCH (t1)-[:PREREQUISITE_FOR]->(t2:Topic)<-[:HAS_TOPIC]-(c)
      RETURN t1.topicId AS prereqId, t2.topicId AS topicId
      `,
      { courseId: neo4j.int(courseId) }
    );
    
    const prerequisites = new Map<number, number[]>();
    prereqResult.records.forEach((rec) => {
      const pId = toNumberSafe(rec.get('prereqId'));
      const tId = toNumberSafe(rec.get('topicId'));
      if (!prerequisites.has(tId)) prerequisites.set(tId, []);
      prerequisites.get(tId)!.push(pId);
    });

    // 3. Fetch Student Knowledge State
    const stateResult = await this.neo4jService.read(
      `
      MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic)<-[:HAS_TOPIC]-(c:Course {courseId: toInteger($courseId)})
      RETURN t.topicId AS topicId, k.score AS score, k.proficiency AS proficiency
      `,
      { studentId: neo4j.int(studentId), courseId: neo4j.int(courseId) }
    );
    
    const knowledgeStates = new Map<number, KnowledgeState>();
    stateResult.records.forEach((rec) => {
      knowledgeStates.set(toNumberSafe(rec.get('topicId')), {
        score: rec.get('score'),
        proficiency: rec.get('proficiency'),
      });
    });

    // 4. Generate Path using Engine
    const recommendedTopics = AdaptiveLearningEngine.generatePath(
      topics,
      knowledgeStates,
      prerequisites,
      limit
    );

    console.log(`Adaptive Engine Debug:
Course: ${courseId}, Student: ${studentId}
Total Topics fetched: ${topics.length}
Knowledge States Count: ${knowledgeStates.size}
Prerequisites Count: ${prerequisites.size}
Recommended Topics Count: ${recommendedTopics.length}`);

    // 5. Hydrate with PostgreSQL Resources
    const hydratedTopics = await Promise.all(
      recommendedTopics.map(async (topic) => {
        const resources = await this.prisma.resource.findMany({
          where: { topic_id: topic.topicId, status: 'Published' },
          orderBy: { sequence_number: 'asc' },
        });

        let finalResources = resources.length > 0 ? resources : await this.prisma.resource.findMany({
          where: { topic_id: topic.topicId },
          orderBy: { sequence_number: 'asc' },
        });

        if (finalResources.length > 0) {
          finalResources = await this.resourcesService.signResources(finalResources) as any;
        }

        return {
          ...topic,
          resources: finalResources,
        };
      })
    );

    return {
      studentId,
      courseId,
      generatedAt: new Date(),
      recommendedTopics: hydratedTopics,
    };
  }

  async generatePersonalizedLesson(studentId: number, courseId: number, topicId: number) {
    // 1. Fetch student's knowledge state for this topic
    const stateResult = await this.neo4jService.read(
      `
      MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic {topicId: toInteger($topicId)})
      RETURN k.proficiency AS proficiency
      `,
      { studentId: neo4j.int(studentId), topicId: neo4j.int(topicId) }
    );
    
    let proficiencyLevel = 'BEGINNER'; // Default
    if (stateResult.records.length > 0) {
      proficiencyLevel = stateResult.records[0].get('proficiency') || 'BEGINNER';
    }

    // 2. Fetch topic title and student teaching preference from postgres
    const [topic, student] = await Promise.all([
      this.prisma.topic.findUnique({ where: { topic_id: topicId } }),
      this.prisma.user.findUnique({ where: { user_id: studentId } })
    ]);

    if (!topic || !student) {
      throw new NotFoundException(`Topic or Student not found`);
    }

    const teachingPreference = student.teaching_preference;

    // 3. Check if topic has any approved AI Knowledge Sources
    const hasAiSource = await this.prisma.resource.findFirst({
      where: { topic_id: topicId, is_ai_source: true }
    });

    if (!hasAiSource) {
      return {
        lesson: "AI learning content is not available for this topic because no AI Knowledge Source has been approved yet.",
        sources: [],
        noAiSources: true
      };
    }

    // 4. Check PostgreSQL cache
    const cachedLesson = await this.prisma.topicAILesson.findUnique({
      where: {
        topic_id_proficiency_level_teaching_preference: {
          topic_id: topicId,
          proficiency_level: proficiencyLevel,
          teaching_preference: teachingPreference
        }
      }
    });

    if (cachedLesson) {
      return {
        lesson: cachedLesson.content,
        sources: cachedLesson.sources
      };
    }

    // 5. Call RAG service if not cached
    try {
      const axios = require('axios');
      const response = await axios.post('http://localhost:8000/api/generate_lesson', {
        course_id: courseId,
        topic_id: topicId,
        topic_title: topic.topic_title,
        proficiency_level: proficiencyLevel,
        teaching_preference: teachingPreference
      });
      
      const { lesson, sources } = response.data;

      // 6. Save to cache
      await this.prisma.topicAILesson.create({
        data: {
          topic_id: topicId,
          proficiency_level: proficiencyLevel,
          teaching_preference: teachingPreference,
          content: lesson,
          sources: sources
        }
      });

      return { lesson, sources };
    } catch (err: any) {
      console.error('Error calling RAG service for personalized lesson:', err.message);
      throw new Error('Failed to generate personalized lesson');
    }
  }
}
