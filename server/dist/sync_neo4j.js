"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const prisma = new client_1.PrismaClient();
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
    const driver = neo4j_driver_1.default.driver(uri, neo4j_driver_1.default.auth.basic(username, password));
    try {
        await driver.verifyConnectivity();
        console.log('✅ Successfully connected to Neo4j!');
    }
    catch (err) {
        console.error('❌ Failed to connect to Neo4j:', err.message);
        await driver.close();
        await prisma.$disconnect();
        process.exit(1);
    }
    const session = driver.session({ database, defaultAccessMode: neo4j_driver_1.default.session.WRITE });
    try {
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
            await session.run(`
        MERGE (c:Course {courseId: toInteger($courseId)})
        SET c.title = $title
        `, { courseId: neo4j_driver_1.default.int(course.course_id), title: course.title });
            for (const topic of course.topics) {
                await session.run(`
          MERGE (t:Topic {topicId: toInteger($topicId)})
          SET t.courseId = toInteger($courseId),
              t.title = $title,
              t.difficulty = $difficulty,
              t.sequenceNumber = toInteger($sequenceNumber)
          WITH t
          MATCH (c:Course {courseId: toInteger($courseId)})
          MERGE (c)-[:HAS_TOPIC]->(t)
          `, {
                    topicId: neo4j_driver_1.default.int(topic.topic_id),
                    courseId: neo4j_driver_1.default.int(course.course_id),
                    title: topic.topic_title,
                    difficulty: topic.difficulty_level,
                    sequenceNumber: neo4j_driver_1.default.int(topic.sequence_number),
                });
            }
            for (let i = 0; i < course.topics.length - 1; i++) {
                const currentTopic = course.topics[i];
                const nextTopic = course.topics[i + 1];
                await session.run(`
          MATCH (t1:Topic {topicId: toInteger($topic1Id)})
          MATCH (t2:Topic {topicId: toInteger($topic2Id)})
          MERGE (t1)-[:PREREQUISITE_FOR]->(t2)
          `, {
                    topic1Id: neo4j_driver_1.default.int(currentTopic.topic_id),
                    topic2Id: neo4j_driver_1.default.int(nextTopic.topic_id),
                });
            }
        }
        const students = await prisma.user.findMany({
            where: { role: 'Student' },
        });
        console.log(`Syncing ${students.length} Students and their Knowledge States...`);
        for (const student of students) {
            await session.run(`MERGE (s:Student {studentId: toInteger($studentId)})`, { studentId: neo4j_driver_1.default.int(student.user_id) });
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
            const latestTopicMap = new Map();
            for (const tr of topicResults) {
                latestTopicMap.set(tr.topic_id, tr);
            }
            for (const [topicId, tr] of latestTopicMap.entries()) {
                const score = tr.percentage ? Number(tr.percentage) / 100 : 0;
                await session.run(`
          MATCH (s:Student {studentId: toInteger($studentId)})
          MATCH (t:Topic {topicId: toInteger($topicId)})
          MERGE (s)-[k:KNOWLEDGE_STATE]->(t)
          SET k.score = $score,
              k.proficiency = $proficiency,
              k.confidence = 0.9,
              k.source = 'DATABASE_SYNC',
              k.lastAssessmentAt = datetime(),
              k.updatedAt = datetime()
          `, {
                    studentId: neo4j_driver_1.default.int(student.user_id),
                    topicId: neo4j_driver_1.default.int(topicId),
                    score: score,
                    proficiency: tr.proficiency_level,
                });
            }
        }
        console.log('🎉 Neo4j Knowledge Graph sync complete!');
    }
    finally {
        await session.close();
        await driver.close();
        await prisma.$disconnect();
    }
}
main().catch((e) => {
    console.error('Fatal error during sync:', e);
    process.exit(1);
});
//# sourceMappingURL=sync_neo4j.js.map