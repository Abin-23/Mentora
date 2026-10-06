import { Injectable, NotFoundException, HttpException, BadRequestException } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import { LearningProgressService } from '../learning-progress/learning-progress.service';
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

import { VisualResourcesService } from '../visual-resources/visual-resources.service';

@Injectable()
export class AdaptiveLearningService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly prisma: PrismaService,
    private readonly resourcesService: ResourcesService,
    private readonly learningProgressService: LearningProgressService,
    private readonly visualResourcesService: VisualResourcesService,
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
      knowledgeStates: Object.fromEntries(knowledgeStates)
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
    const aiSources = await this.prisma.resource.findMany({
      where: { topic_id: topicId, is_ai_source: true }
    });

    if (aiSources.length === 0) {
      return {
        lesson: "AI learning content is not available for this topic because no AI Knowledge Source has been approved yet.",
        sources: [],
        noAiSources: true
      };
    }

    const aiSourceIds = aiSources.map(r => r.resource_id);

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

    // Check concept performance
    let targetedConcepts: string[] = [];
    try {
      const performance = await this.learningProgressService.getConceptPerformance(studentId, courseId, topicId);
      const weak = performance.concepts.filter(c => c.performance === 'WEAK').map(c => c.conceptTag);
      const developing = performance.concepts.filter(c => c.performance === 'DEVELOPING').map(c => c.conceptTag);
      targetedConcepts = [...weak, ...developing];
      if (targetedConcepts.length > 0) {
        console.log(`[Targeted Retrieval] Using concepts for topic ${topicId}:`, targetedConcepts);
      }
    } catch (err) {
      console.warn("Failed to retrieve concept performance", err);
    }

    // 5. Call RAG service if not cached
    let responseData;
    try {
      const axios = require('axios');
      const response = await axios.post('http://localhost:8000/api/generate_lesson', {
        course_id: courseId,
        topic_id: topicId,
        topic_title: topic.topic_title,
        proficiency_level: proficiencyLevel,
        teaching_preference: teachingPreference,
        targeted_concepts: targetedConcepts,
        valid_resource_ids: aiSourceIds
      });
      responseData = response.data;
    } catch (err: any) {
      console.error('Error calling RAG service for personalized lesson:', err.message);
      throw new Error('Failed to generate personalized lesson from AI service');
    }

    let { lesson, sources } = responseData;

    // 6. Process Visual Resources
    try {
      const parsedLesson = JSON.parse(lesson);
      if (parsedLesson && Array.isArray(parsedLesson.blocks)) {
        for (const block of parsedLesson.blocks) {
          if (block.visual && block.visual.query && !block.visual.url) {
            try {
              const result = await this.visualResourcesService.search(block.visual.query);
              if (result) {
                block.visual = { ...block.visual, ...result };
              } else {
                 delete block.visual;
              }
            } catch (err) {
               console.warn("Visual search failed, removing visual", err);
               delete block.visual;
            }
          }
        }
        lesson = JSON.stringify(parsedLesson);
      }
    } catch (err) {
       console.warn("Failed to process visual resources for lesson", err);
    }

    // 7. Save to cache ONLY if it's not an error block
    try {
      const isError = (() => {
        try {
          return JSON.parse(lesson).is_error === true;
        } catch {
          return false;
        }
      })();

      if (!isError) {
        await this.prisma.topicAILesson.create({
          data: {
            topic_id: topicId,
            proficiency_level: proficiencyLevel,
            teaching_preference: teachingPreference,
            content: lesson,
            sources: sources
          }
        });
      } else {
        console.warn(`Lesson generation failed for topic ${topicId}, skipping cache.`);
      }
    } catch (err: any) {
      console.error('Error saving cached lesson to database:', err.message);
      // We still return the generated lesson even if caching fails
    }

    return { lesson, sources };
  }

  async getDiagnostics(studentId: number, courseId: number, topicId: number) {
    // 1. Topic Proficiency
    let proficiencyLevel = 'BEGINNER';
    let knowledgeScore = 0;
    try {
      const stateResult = await this.neo4jService.read(
        `
        MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic {topicId: toInteger($topicId)})
        RETURN k.proficiency AS proficiency, k.score AS score
        `,
        { studentId: neo4j.int(studentId), topicId: neo4j.int(topicId) }
      );
      if (stateResult.records.length > 0) {
        proficiencyLevel = stateResult.records[0].get('proficiency') || 'BEGINNER';
        knowledgeScore = toNumberSafe(stateResult.records[0].get('score'));
      }
    } catch (e) {}

    // 2. Concept Performance
    let conceptPerformance: any = null;
    let weakConcepts: string[] = [];
    let developingConcepts: string[] = [];
    let targetedConcepts: string[] = [];
    
    try {
      conceptPerformance = await this.learningProgressService.getConceptPerformance(studentId, courseId, topicId);
      weakConcepts = conceptPerformance.concepts.filter((c: any) => c.performance === 'WEAK').map((c: any) => c.conceptTag);
      developingConcepts = conceptPerformance.concepts.filter((c: any) => c.performance === 'DEVELOPING').map((c: any) => c.conceptTag);
      targetedConcepts = [...weakConcepts, ...developingConcepts];
    } catch (e) {}

    // 3. Recent Learning Interactions
    let recentInteractions: any[] = [];
    try {
      const activities = await this.prisma.learningActivity.findMany({
        where: { student_id: studentId, topic_id: topicId, activity_type: 'AI_BLOCK_INTERACTION' },
        orderBy: { created_at: 'desc' },
        take: 10
      });
      recentInteractions = activities.map(a => {
        let meta: any = {};
        if (a.metadata) {
          meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
        }
        return {
          id: a.activity_id,
          timestamp: a.created_at,
          blockType: meta.blockType,
          isCorrect: meta.isCorrect,
          attemptNumber: meta.attemptNumber,
          conceptTags: meta.conceptTags || []
        };
      });
    } catch (e) {}

    // 4. Inferred Adaptive Routing
    let currentStage = 'LEARN';
    const hasTried = recentInteractions.some(i => i.blockType === 'TRY');
    const hasPracticed = recentInteractions.some(i => i.blockType === 'PRACTICE');
    const hasChallenge = recentInteractions.some(i => i.blockType === 'CHALLENGE');
    
    if (proficiencyLevel === 'MASTER' || proficiencyLevel === 'ADVANCED') currentStage = 'MASTER';
    else if (proficiencyLevel === 'PROFICIENT') currentStage = 'CHECK';
    else if (hasChallenge) currentStage = 'CHECK';
    else if (hasPracticed) currentStage = 'PRACTICE';
    else if (hasTried) currentStage = 'TRY';
    else if (recentInteractions.length > 0) currentStage = 'UNDERSTAND';

    return {
      studentId,
      courseId,
      topicId,
      diagnostics: {
        topicProficiency: {
          level: proficiencyLevel,
          score: knowledgeScore
        },
        conceptPerformance: conceptPerformance ? conceptPerformance.concepts : [],
        targetedRetrieval: {
          used: targetedConcepts.length > 0,
          priorityConceptsPassedToLLM: targetedConcepts,
          weakConcepts,
          developingConcepts
        },
        recentInteractions,
        adaptiveRouting: {
          inferredCurrentStage: currentStage,
          lastInteractionResult: recentInteractions.length > 0 ? (recentInteractions[0].isCorrect ? 'SUCCESS' : 'FAILURE') : 'NONE',
          retryRequired: recentInteractions.length > 0 && recentInteractions[0].isCorrect === false
        }
      }
    };
  }

  async getStudentDashboard(studentId: number, courseId: number) {
    // 1. Validate Enrollment
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { user_id: studentId, course_id: courseId }
    });
    if (!enrollment) {
      throw new NotFoundException('Course must belong to an enrollment for that student');
    }

    // 2. Fetch Topic Mastery from Neo4j
    const stateResult = await this.neo4jService.read(
      `
      MATCH (c:Course {courseId: toInteger($courseId)})-[:HAS_TOPIC]->(t:Topic)
      OPTIONAL MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t)
      RETURN t.topicId AS topicId, t.title AS title, 
             k.proficiency AS proficiency, k.score AS score, 
             k.attemptCount AS attemptCount, k.lastAssessmentAt AS lastAssessmentAt
      ORDER BY t.sequenceNumber
      `,
      { studentId: neo4j.int(studentId), courseId: neo4j.int(courseId) }
    );

    const topicMastery = stateResult.records.map(rec => ({
      topic_id: toNumberSafe(rec.get('topicId')),
      title: rec.get('title'),
      proficiency: rec.get('proficiency') || 'UNASSESSED',
      score: rec.get('score') != null ? Math.round(Number(rec.get('score')) * 100) : null,
      attemptCount: toNumberSafe(rec.get('attemptCount')),
      lastAssessmentAt: rec.get('lastAssessmentAt') ? new Date(rec.get('lastAssessmentAt').toString()) : null
    }));

    const totalTopics = topicMastery.length;
    const completedTopics = topicMastery.filter(t => ['PROFICIENT', 'ADVANCED'].includes(t.proficiency)).length;
    const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    const courseProgress = {
      enrolled: true,
      completedTopics,
      totalTopics,
      progressPercentage
    };

    // 3. Current Recommendation (PLP)
    const plp = await this.generatePath(studentId, courseId, { limit: 1 });
    const currentRecommendation = plp.recommendedTopics.length > 0 ? plp.recommendedTopics[0] : null;

    // 4. Strengths & Areas to Improve
    const strengths: any[] = [];
    const areasToImprove: any[] = [];
    
    // Add Topics
    topicMastery.forEach(t => {
      if (['PROFICIENT', 'ADVANCED'].includes(t.proficiency)) {
        strengths.push({ name: t.title, type: 'TOPIC', proficiency: t.proficiency });
      } else if (['DEVELOPING', 'BEGINNER'].includes(t.proficiency)) {
        // Find if this is recommended right now
        let reason = '';
        if (currentRecommendation && currentRecommendation.topicId === t.topic_id) {
           reason = currentRecommendation.reason;
        }
        areasToImprove.push({ name: t.title, type: 'TOPIC', proficiency: t.proficiency, reason });
      }
    });

    // Add Concepts
    try {
      const perfMap = await this.learningProgressService.getConceptPerformance(studentId, courseId);
      if (perfMap && perfMap.concepts) {
        perfMap.concepts.forEach((c: any) => {
          if (c.performance === 'STRONG') strengths.push({ name: c.conceptTag, type: 'CONCEPT', proficiency: c.performance });
          else if (c.performance === 'WEAK' || c.performance === 'DEVELOPING') areasToImprove.push({ name: c.conceptTag, type: 'CONCEPT', proficiency: c.performance });
        });
      }
    } catch (e) {
      console.warn("Failed to get concept performance for dashboard", e);
    }

    // 5. Assessment History
    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { student_id: studentId, assessment: { course_id: courseId }, status: 'SUBMITTED' },
      include: { assessment: true },
      orderBy: { submitted_at: 'asc' }
    });

    const assessmentHistory = attempts.map(a => ({
      date: a.submitted_at,
      score: a.percentage ? Number(a.percentage) : null,
      title: a.assessment.title || `Assessment ${a.assessment.assessment_id}`,
      type: a.assessment.assessment_type
    }));

    // 6. Learning Activity
    const activities = await this.prisma.learningActivity.findMany({
      where: { student_id: studentId, course_id: courseId },
      orderBy: { created_at: 'desc' },
      take: 20,
      include: { topic: true }
    });

    const learningActivity = activities.map(a => ({
      date: a.created_at,
      type: a.activity_type,
      description: `${a.activity_type.replace(/_/g, ' ')} ${a.topic ? 'in ' + a.topic.topic_title : ''}`
    }));

    // 7. Knowledge Growth (Track assessment topic results over time)
    const topicResults = await this.prisma.assessmentTopicResult.findMany({
       where: { attempt: { student_id: studentId, assessment: { course_id: courseId } } },
       include: { attempt: true, topic: true },
       orderBy: { attempt: { submitted_at: 'asc' } }
    });
    const knowledgeGrowth = topicResults.map(tr => ({
       date: tr.attempt.submitted_at,
       score: tr.percentage ? Number(tr.percentage) : 0,
       topic: tr.topic.topic_title
    }));

    // 8. Recent Learning Insights
    const recentInsights: any[] = [];
    const topicTrends = new Map<number, any[]>();
    topicResults.forEach(tr => {
       if (!topicTrends.has(tr.topic_id)) topicTrends.set(tr.topic_id, []);
       topicTrends.get(tr.topic_id)!.push(tr);
    });

    const profOrder: Record<string, number> = { 'UNASSESSED': 0, 'BEGINNER': 1, 'DEVELOPING': 2, 'PROFICIENT': 3, 'ADVANCED': 4 };
    
    for (const [topicId, results] of topicTrends.entries()) {
       if (results.length >= 2) {
          const prev = results[results.length - 2];
          const curr = results[results.length - 1];
          const prevProf = prev.proficiency_level;
          const currProf = curr.proficiency_level;
          
          if (profOrder[currProf] > profOrder[prevProf]) {
             recentInsights.push({
               type: 'PROFICIENCY_IMPROVED',
               title: 'Proficiency Improved',
               message: `You improved from ${prevProf} to ${currProf} in ${curr.topic.topic_title}.`,
               evidence: { topicId, proficiency: currProf, score: Number(curr.percentage) },
               date: curr.attempt.submitted_at
             });
          } else if (profOrder[currProf] < profOrder[prevProf]) {
             recentInsights.push({
               type: 'PROFICIENCY_DECLINED',
               title: 'Needs Review',
               message: `Your proficiency in ${curr.topic.topic_title} dropped to ${currProf}.`,
               evidence: { topicId, proficiency: currProf, score: Number(curr.percentage) },
               date: curr.attempt.submitted_at
             });
          }
       }
    }

    try {
      const perfMap = await this.learningProgressService.getConceptPerformance(studentId, courseId);
      if (perfMap && perfMap.concepts) {
        const weakConcepts = perfMap.concepts.filter((c: any) => c.performance === 'WEAK');
        weakConcepts.forEach((c: any) => {
          recentInsights.push({
             type: 'CONCEPT_NEEDS_REVIEW',
             title: 'Concept Needs Review',
             message: `Recent activity shows the concept "${c.conceptTag}" needs more practice.`,
             evidence: { conceptTag: c.conceptTag, performance: c.performance },
             date: new Date()
          });
        });
      }
    } catch(e) {}

    // Sort insights by date descending and take top 5
    recentInsights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const topInsights = recentInsights.slice(0, 5);

    if (currentRecommendation) {
      let insightType = 'NEW_TOPIC_AVAILABLE';
      if (currentRecommendation.proficiency === 'BEGINNER') insightType = 'PREREQUISITE';
      else if (currentRecommendation.proficiency === 'DEVELOPING') insightType = 'NEEDS_PRACTICE';
      
      (currentRecommendation as any).insight = {
         type: insightType,
         title: currentRecommendation.reason,
         message: currentRecommendation.extendedReason,
         evidence: {
            topicId: currentRecommendation.topicId,
            proficiency: currentRecommendation.proficiency,
            score: currentRecommendation.knowledgeScore != null ? Math.round(currentRecommendation.knowledgeScore * 100) : 0
         }
      };
    }

    return {
      courseProgress,
      topicMastery,
      strengths,
      areasToImprove,
      assessmentHistory,
      learningActivity,
      knowledgeGrowth,
      currentRecommendation,
      recentInsights: topInsights
    };
  }

  async getStudentGoals(studentId: number, courseId: number) {
    const goals = await this.prisma.studentCourseGoal.findMany({
      where: { student_id: studentId, course_id: courseId },
      include: { target_topic: true },
      orderBy: { created_at: 'desc' }
    });

    if (goals.length === 0) return [];

    // Fetch authoritative data needed for calculations
    const stateResult = await this.neo4jService.read(
      `
      MATCH (c:Course {courseId: toInteger($courseId)})-[:HAS_TOPIC]->(t:Topic)
      OPTIONAL MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t)
      RETURN t.topicId AS topicId, k.proficiency AS proficiency
      `,
      { studentId: neo4j.int(studentId), courseId: neo4j.int(courseId) }
    );

    let completedTopicsCount = 0;
    const topicProficiency = new Map<number, string>();
    
    stateResult.records.forEach(rec => {
      const topicId = toNumberSafe(rec.get('topicId'));
      const proficiency = rec.get('proficiency') || 'UNASSESSED';
      topicProficiency.set(topicId, proficiency);
      if (['PROFICIENT', 'ADVANCED'].includes(proficiency)) {
        completedTopicsCount++;
      }
    });

    const totalTopics = stateResult.records.length;

    const attemptsCount = await this.prisma.assessmentAttempt.count({
      where: { student_id: studentId, assessment: { course_id: courseId }, status: 'SUBMITTED' }
    });

    const profOrder: Record<string, number> = { 'UNASSESSED': 0, 'BEGINNER': 1, 'DEVELOPING': 2, 'PROFICIENT': 3, 'ADVANCED': 4 };

    const enrichedGoals = [];

    for (const goal of goals) {
      let currentValue: any = 0;
      let targetValue: any = goal.target_value;
      let isCompleted = goal.status === 'COMPLETED';
      let progressMessage = '';
      let progressPercentage = 0;

      switch (goal.goal_type) {
        case 'COMPLETE_COURSE':
          currentValue = completedTopicsCount;
          targetValue = totalTopics;
          if (currentValue >= targetValue && targetValue > 0) isCompleted = true;
          progressMessage = `${currentValue} / ${targetValue} topics mastered`;
          progressPercentage = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
          break;
        case 'MASTER_TOPICS':
          currentValue = completedTopicsCount;
          if (currentValue >= targetValue) isCompleted = true;
          progressMessage = `${currentValue} / ${targetValue} topics mastered`;
          progressPercentage = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
          break;
        case 'IMPROVE_TOPIC':
          if (goal.target_topic_id) {
             const currProf = topicProficiency.get(goal.target_topic_id) || 'UNASSESSED';
             currentValue = currProf;
             targetValue = goal.target_proficiency;
             if (profOrder[currProf] >= profOrder[targetValue]) isCompleted = true;
             progressMessage = `${currProf} → target ${targetValue}`;
             progressPercentage = profOrder[currProf] >= profOrder[targetValue] ? 100 : Math.round((profOrder[currProf] / profOrder[targetValue]) * 100);
          }
          break;
        case 'COMPLETE_ASSESSMENTS':
          currentValue = attemptsCount;
          if (currentValue >= targetValue) isCompleted = true;
          progressMessage = `${currentValue} / ${targetValue} completed`;
          progressPercentage = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
          break;
      }

      if (isCompleted && goal.status !== 'COMPLETED') {
         await this.prisma.studentCourseGoal.update({
            where: { goal_id: goal.goal_id },
            data: { status: 'COMPLETED' }
         });
         goal.status = 'COMPLETED';
      }

      enrichedGoals.push({
        ...goal,
        currentValue,
        targetValue,
        progressMessage,
        progressPercentage,
        isCompleted
      });
    }

    return enrichedGoals;
  }

  async createStudentGoal(studentId: number, courseId: number, body: any) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { user_id: studentId, course_id: courseId }
    });
    if (!enrollment) {
      throw new NotFoundException('Student is not enrolled in this course.');
    }

    if (body.target_topic_id) {
      const topic = await this.prisma.topic.findFirst({
        where: { topic_id: body.target_topic_id, course_id: courseId }
      });
      if (!topic) throw new NotFoundException('Topic does not belong to this course.');
    }

    return this.prisma.studentCourseGoal.create({
      data: {
        student_id: studentId,
        course_id: courseId,
        goal_type: body.goal_type,
        target_value: body.target_value,
        target_topic_id: body.target_topic_id,
        target_proficiency: body.target_proficiency,
        status: 'ACTIVE'
      }
    });
  }

  async askTutor(studentId: number, courseId: number, body: any) {
    const { topic_id, query } = body;
    
    if (!query) throw new Error('Query is required');

    // 1. Verify enrollment
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { user_id: studentId, course_id: courseId }
    });
    if (!enrollment) throw new NotFoundException('Student is not enrolled in this course.');

    // 2. Verify topic
    if (topic_id) {
      const topic = await this.prisma.topic.findFirst({
        where: { topic_id: topic_id, course_id: courseId }
      });
      if (!topic) throw new NotFoundException('Topic does not belong to this course.');
    }

    // 3. Get Student info
    const student = await this.prisma.user.findUnique({
      where: { user_id: studentId },
      select: { teaching_preference: true }
    });

    // 4. Get Knowledge State
    let proficiency = 'UNASSESSED';
    if (topic_id) {
       const stateResult = await this.neo4jService.read(
         `
         MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic {topicId: toInteger($topicId)})
         RETURN k.proficiency AS proficiency
         `,
         { studentId: neo4j.int(studentId), topicId: neo4j.int(topic_id) }
       );
       if (stateResult.records.length > 0) {
         proficiency = stateResult.records[0].get('proficiency');
       }
    }

    // 5. Get Weak Concepts
    let weakConcepts: string[] = [];
    try {
      const perfMap = await this.learningProgressService.getConceptPerformance(studentId, courseId);
      if (perfMap && perfMap.concepts) {
        weakConcepts = perfMap.concepts
          .filter((c: any) => c.performance === 'WEAK' || c.performance === 'DEVELOPING')
          .map((c: any) => c.conceptTag);
      }
    } catch(e) {}

    // 6. Send to RAG
    let tutorResult: any;
    try {
      const ragUrl = process.env.RAG_SERVICE_URL || 'http://localhost:8000';
      const ragResponse = await fetch(`${ragUrl}/api/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           query,
           course_id: courseId,
           topic_id: topic_id || null,
           proficiency,
           teaching_preference: student?.teaching_preference || 'DIRECT',
           weak_concepts: weakConcepts
        })
      });

      if (!ragResponse.ok) {
         throw new Error(`RAG service unavailable: ${ragResponse.status} ${ragResponse.statusText}`);
      }

      tutorResult = await ragResponse.json();
    } catch (e: any) {
      throw new HttpException(`Tutor error: ${e.message}`, 500);
    }

    // 7. Log interaction (only if topic_id is available or fetch first topic)
    const validTopicId = topic_id || (await this.prisma.topic.findFirst({ where: { course_id: courseId } }))?.topic_id;

    if (validTopicId) {
      await this.prisma.learningActivity.create({
        data: {
          student_id: studentId,
          course_id: courseId,
          topic_id: validTopicId,
          activity_type: 'RESOURCE_PROGRESS',
          metadata: {
             type: 'TUTOR_INTERACTION',
             query: query,
             sources: tutorResult.sources?.length || 0
          }
        }
      });
    }
    return tutorResult;
  }
}
