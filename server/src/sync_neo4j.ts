import { PrismaClient } from '@prisma/client';
import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;
  const database = process.env.NEO4J_DATABASE || 'neo4j';

  console.log(`Connecting to Neo4j at: ${uri} (Database: ${database})`);

  if (!uri || !username || !password) {
    console.error('Error: NEO4J_URI, NEO4J_USERNAME, or NEO4J_PASSWORD missing in server/.env');
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

  try {
    await driver.verifyConnectivity();
    console.log('✅ Successfully connected to Neo4j!');
  } catch (err: any) {
    console.error('❌ Failed to connect to Neo4j:', err.message);
    await driver.close();
    await prisma.$disconnect();
    process.exit(1);
  }

  const session = driver.session({ database, defaultAccessMode: neo4j.session.WRITE });

  try {
    // 1. Fetch all courses with topics
    const courses = await prisma.course.findMany({
      include: {
        topics: {
          orderBy: { sequence_number: 'asc' },
        },
      },
    });

    console.log(`Found ${courses.length} courses in PostgreSQL.`);

    for (const course of courses) {
      console.log(`Syncing Course #${course.course_id}: "${course.title}" (${course.topics.length} topics)...`);

      // 1. Merge Course Node
      await session.run(
        `
        MERGE (c:Course {courseId: toInteger($courseId)})
        SET c.title = $title
        `,
        { courseId: neo4j.int(course.course_id), title: course.title }
      );

      // 2. Merge Topics and HAS_TOPIC relationships
      for (const topic of course.topics) {
        await session.run(
          `
          MERGE (t:Topic {topicId: toInteger($topicId)})
          SET t.courseId = toInteger($courseId),
              t.title = $title,
              t.difficulty = $difficulty,
              t.sequenceNumber = toInteger($sequenceNumber)
          WITH t
          MATCH (c:Course {courseId: toInteger($courseId)})
          MERGE (c)-[:HAS_TOPIC]->(t)
          `,
          {
            topicId: neo4j.int(topic.topic_id),
            courseId: neo4j.int(course.course_id),
            title: topic.topic_title,
            difficulty: topic.difficulty_level,
            sequenceNumber: neo4j.int(topic.sequence_number),
          }
        );
      }

      // 3. Merge Sequential PREREQUISITE_FOR relationships
      for (let i = 0; i < course.topics.length - 1; i++) {
        const currentTopic = course.topics[i];
        const nextTopic = course.topics[i + 1];

        await session.run(
          `
          MATCH (t1:Topic {topicId: toInteger($topic1Id)})
          MATCH (t2:Topic {topicId: toInteger($topic2Id)})
          MERGE (t1)-[:PREREQUISITE_FOR]->(t2)
          `,
          {
            topic1Id: neo4j.int(currentTopic.topic_id),
            topic2Id: neo4j.int(nextTopic.topic_id),
          }
        );
      }
    }

    // 2. Sync all Students and their latest Assessment Knowledge States
    const students = await prisma.user.findMany({
      where: { role: 'Student' },
    });

    console.log(`Syncing ${students.length} Students and their Knowledge States...`);

    for (const student of students) {
      // Ensure Student Node exists
      await session.run(
        `MERGE (s:Student {studentId: toInteger($studentId)})`,
        { studentId: neo4j.int(student.user_id) }
      );

      // Fetch all topic results for this student
      const topicResults = await prisma.assessmentTopicResult.findMany({
        where: {
          attempt: {
            student_id: student.user_id,
            status: 'SUBMITTED',
          },
        },
        orderBy: { attempt: { submitted_at: 'asc' } },
        include: { attempt: true },
      });

      // Group by topic to get latest score
      const latestTopicMap = new Map<number, typeof topicResults[0]>();
      for (const tr of topicResults) {
        latestTopicMap.set(tr.topic_id, tr);
      }

      for (const [topicId, tr] of latestTopicMap.entries()) {
        const score = tr.percentage ? Number(tr.percentage) / 100 : 0;
        await session.run(
          `
          MATCH (s:Student {studentId: toInteger($studentId)})
          MATCH (t:Topic {topicId: toInteger($topicId)})
          MERGE (s)-[k:KNOWLEDGE_STATE]->(t)
          SET k.score = $score,
              k.proficiency = $proficiency,
              k.confidence = 0.9,
              k.source = 'DATABASE_SYNC',
              k.lastAssessmentAt = datetime(),
              k.updatedAt = datetime()
          `,
          {
            studentId: neo4j.int(student.user_id),
            topicId: neo4j.int(topicId),
            score: score,
            proficiency: tr.proficiency_level,
          }
        );
      }
    }

    console.log('🎉 Neo4j Knowledge Graph sync complete!');
  } finally {
    await session.close();
    await driver.close();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Fatal error during sync:', e);
  process.exit(1);
});
