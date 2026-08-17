"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveLearningService = void 0;
const common_1 = require("@nestjs/common");
const neo4j_service_1 = require("../neo4j/neo4j.service");
const prisma_service_1 = require("../prisma/prisma.service");
const resources_service_1 = require("../resources/resources.service");
const engine_1 = require("./engine");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
function toNumberSafe(val) {
    if (val == null)
        return 0;
    if (typeof val.toNumber === 'function') {
        return val.toNumber();
    }
    return Number(val);
}
let AdaptiveLearningService = class AdaptiveLearningService {
    neo4jService;
    prisma;
    resourcesService;
    constructor(neo4jService, prisma, resourcesService) {
        this.neo4jService = neo4jService;
        this.prisma = prisma;
        this.resourcesService = resourcesService;
    }
    async generatePath(studentId, courseId, dto) {
        const limit = dto?.limit || 5;
        const topicsResult = await this.neo4jService.read(`
      MATCH (c:Course {courseId: toInteger($courseId)})-[:HAS_TOPIC]->(t:Topic)
      RETURN t.topicId AS topicId, t.title AS title, t.sequenceNumber AS sequenceNumber, t.difficulty AS difficulty
      ORDER BY t.sequenceNumber
      `, { courseId: neo4j_driver_1.default.int(courseId) });
        const topics = topicsResult.records.map((rec) => ({
            topicId: toNumberSafe(rec.get('topicId')),
            title: rec.get('title'),
            sequenceNumber: toNumberSafe(rec.get('sequenceNumber')),
            difficulty: rec.get('difficulty'),
        }));
        if (topics.length === 0) {
            throw new common_1.NotFoundException(`No topics found for course ${courseId}`);
        }
        const prereqResult = await this.neo4jService.read(`
      MATCH (c:Course {courseId: toInteger($courseId)})-[:HAS_TOPIC]->(t1:Topic)
      MATCH (t1)-[:PREREQUISITE_FOR]->(t2:Topic)<-[:HAS_TOPIC]-(c)
      RETURN t1.topicId AS prereqId, t2.topicId AS topicId
      `, { courseId: neo4j_driver_1.default.int(courseId) });
        const prerequisites = new Map();
        prereqResult.records.forEach((rec) => {
            const pId = toNumberSafe(rec.get('prereqId'));
            const tId = toNumberSafe(rec.get('topicId'));
            if (!prerequisites.has(tId))
                prerequisites.set(tId, []);
            prerequisites.get(tId).push(pId);
        });
        const stateResult = await this.neo4jService.read(`
      MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic)<-[:HAS_TOPIC]-(c:Course {courseId: toInteger($courseId)})
      RETURN t.topicId AS topicId, k.score AS score, k.proficiency AS proficiency
      `, { studentId: neo4j_driver_1.default.int(studentId), courseId: neo4j_driver_1.default.int(courseId) });
        const knowledgeStates = new Map();
        stateResult.records.forEach((rec) => {
            knowledgeStates.set(toNumberSafe(rec.get('topicId')), {
                score: rec.get('score'),
                proficiency: rec.get('proficiency'),
            });
        });
        const recommendedTopics = engine_1.AdaptiveLearningEngine.generatePath(topics, knowledgeStates, prerequisites, limit);
        console.log(`Adaptive Engine Debug:
Course: ${courseId}, Student: ${studentId}
Total Topics fetched: ${topics.length}
Knowledge States Count: ${knowledgeStates.size}
Prerequisites Count: ${prerequisites.size}
Recommended Topics Count: ${recommendedTopics.length}`);
        const hydratedTopics = await Promise.all(recommendedTopics.map(async (topic) => {
            const resources = await this.prisma.resource.findMany({
                where: { topic_id: topic.topicId, status: 'Published' },
                orderBy: { sequence_number: 'asc' },
            });
            let finalResources = resources.length > 0 ? resources : await this.prisma.resource.findMany({
                where: { topic_id: topic.topicId },
                orderBy: { sequence_number: 'asc' },
            });
            if (finalResources.length > 0) {
                finalResources = await this.resourcesService.signResources(finalResources);
            }
            return {
                ...topic,
                resources: finalResources,
            };
        }));
        return {
            studentId,
            courseId,
            generatedAt: new Date(),
            recommendedTopics: hydratedTopics,
        };
    }
};
exports.AdaptiveLearningService = AdaptiveLearningService;
exports.AdaptiveLearningService = AdaptiveLearningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService,
        prisma_service_1.PrismaService,
        resources_service_1.ResourcesService])
], AdaptiveLearningService);
//# sourceMappingURL=adaptive-learning.service.js.map