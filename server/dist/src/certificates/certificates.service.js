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
exports.CertificatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const neo4j_service_1 = require("../neo4j/neo4j.service");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
let CertificatesService = class CertificatesService {
    prisma;
    neo4jService;
    constructor(prisma, neo4jService) {
        this.prisma = prisma;
        this.neo4jService = neo4jService;
    }
    async checkEligibility(studentId, courseId) {
        const topics = await this.prisma.topic.findMany({
            where: { course_id: courseId },
            include: { resources: true }
        });
        if (topics.length === 0)
            return { eligible: false, reason: 'Course has no topics' };
        const stateResult = await this.neo4jService.read(`
      MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic)<-[:HAS_TOPIC]-(c:Course {courseId: toInteger($courseId)})
      RETURN t.topicId AS topicId, k.proficiency AS proficiency
      `, { studentId: neo4j_driver_1.default.int(studentId), courseId: neo4j_driver_1.default.int(courseId) });
        const states = new Map();
        stateResult.records.forEach((rec) => {
            states.set(Number(rec.get('topicId')), rec.get('proficiency'));
        });
        const passingProficiencies = ['PROFICIENT', 'ADVANCED', 'MASTER'];
        const unmasteredTopics = topics.filter(t => !passingProficiencies.includes(states.get(t.topic_id) || ''));
        const hasMasteredViaNeo4j = unmasteredTopics.length === 0;
        const resourceProgresses = await this.prisma.learningProgress.findMany({
            where: {
                student_id: studentId,
                course_id: courseId
            }
        });
        let hasCompletedAllResources = true;
        let totalResources = 0;
        for (const t of topics) {
            for (const r of t.resources) {
                totalResources++;
                const p = resourceProgresses.find((rp) => rp.resource_id === r.resource_id);
                if (!p || p.progress_percent < 100) {
                    hasCompletedAllResources = false;
                    break;
                }
            }
            if (!hasCompletedAllResources)
                break;
        }
        if (totalResources === 0)
            hasCompletedAllResources = false;
        if (!hasMasteredViaNeo4j && !hasCompletedAllResources) {
            return { eligible: false, unmasteredCount: unmasteredTopics.length, unmasteredTopics };
        }
        return { eligible: true };
    }
    async issueCertificate(studentId, courseId) {
        const existing = await this.prisma.certificate.findUnique({
            where: { student_id_course_id: { student_id: studentId, course_id: courseId } }
        });
        if (existing)
            return existing;
        const eligibility = await this.checkEligibility(studentId, courseId);
        if (!eligibility.eligible) {
            throw new common_1.BadRequestException('Student has not mastered all topics in this course.');
        }
        return this.prisma.certificate.create({
            data: {
                student_id: studentId,
                course_id: courseId,
                grade_percentage: 100.00
            },
            include: { course: true }
        });
    }
    async getCertificates(studentId) {
        return this.prisma.certificate.findMany({
            where: { student_id: studentId },
            include: { course: true }
        });
    }
    async verifyCertificate(credentialId) {
        const cert = await this.prisma.certificate.findUnique({
            where: { credential_id: credentialId },
            include: {
                student: { select: { full_name: true, email: true } },
                course: { select: { title: true, course_admin: { select: { full_name: true } } } }
            }
        });
        if (!cert)
            throw new common_1.BadRequestException('Invalid certificate credential ID');
        return cert;
    }
};
exports.CertificatesService = CertificatesService;
exports.CertificatesService = CertificatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        neo4j_service_1.Neo4jService])
], CertificatesService);
//# sourceMappingURL=certificates.service.js.map