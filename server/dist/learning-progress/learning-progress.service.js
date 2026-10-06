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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningProgressService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let LearningProgressService = class LearningProgressService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async startProgress(userId, dto) {
        const progress = await this.prisma.learningProgress.upsert({
            where: {
                student_id_resource_id: {
                    student_id: userId,
                    resource_id: dto.resource_id,
                },
            },
            update: {
                last_accessed_at: new Date(),
                status: client_1.ProgressStatus.IN_PROGRESS,
            },
            create: {
                student_id: userId,
                course_id: dto.course_id,
                topic_id: dto.topic_id,
                resource_id: dto.resource_id,
                status: client_1.ProgressStatus.IN_PROGRESS,
                progress_percent: 0,
            },
        });
        await this.prisma.learningActivity.create({
            data: {
                student_id: userId,
                course_id: dto.course_id,
                topic_id: dto.topic_id,
                resource_id: dto.resource_id,
                activity_type: client_1.ActivityType.RESOURCE_STARTED,
            },
        });
        return progress;
    }
    async updateProgress(userId, progressId, dto) {
        const progress = await this.prisma.learningProgress.findUnique({
            where: { progress_id: progressId },
        });
        if (!progress || progress.student_id !== userId) {
            throw new common_1.NotFoundException('Progress not found');
        }
        if (progress.status === client_1.ProgressStatus.COMPLETED) {
            return progress;
        }
        const updated = await this.prisma.learningProgress.update({
            where: { progress_id: progressId },
            data: {
                progress_percent: dto.progress_percent !== undefined ? dto.progress_percent : progress.progress_percent,
                time_spent_seconds: { increment: dto.time_spent_seconds || 0 },
                last_accessed_at: new Date(),
            },
        });
        await this.prisma.learningActivity.create({
            data: {
                student_id: userId,
                course_id: progress.course_id,
                topic_id: progress.topic_id,
                resource_id: progress.resource_id,
                activity_type: client_1.ActivityType.RESOURCE_PROGRESS,
                metadata: {
                    progress_percent: updated.progress_percent,
                    time_spent_added: dto.time_spent_seconds || 0
                }
            },
        });
        return updated;
    }
    async completeProgress(userId, progressId) {
        const progress = await this.prisma.learningProgress.findUnique({
            where: { progress_id: progressId },
        });
        if (!progress || progress.student_id !== userId) {
            throw new common_1.NotFoundException('Progress not found');
        }
        const updated = await this.prisma.learningProgress.update({
            where: { progress_id: progressId },
            data: {
                progress_percent: 100,
                status: client_1.ProgressStatus.COMPLETED,
                completed_at: new Date(),
                last_accessed_at: new Date(),
            },
        });
        await this.prisma.learningActivity.create({
            data: {
                student_id: userId,
                course_id: progress.course_id,
                topic_id: progress.topic_id,
                resource_id: progress.resource_id,
                activity_type: client_1.ActivityType.RESOURCE_COMPLETED,
            },
        });
        return updated;
    }
    async getTopicProgress(userId, topicId) {
        const resources = await this.prisma.resource.findMany({
            where: { topic_id: topicId }
        });
        if (resources.length === 0)
            return 0;
        const progressRecords = await this.prisma.learningProgress.findMany({
            where: { student_id: userId, topic_id: topicId }
        });
        let totalPercent = 0;
        resources.forEach(r => {
            const p = progressRecords.find(pr => pr.resource_id === r.resource_id);
            if (p)
                totalPercent += p.progress_percent;
        });
        return Math.round(totalPercent / resources.length);
    }
    async getCourseProgress(userId, courseId) {
        const resources = await this.prisma.resource.findMany({
            where: { topic: { course_id: courseId } }
        });
        if (resources.length === 0)
            return 0;
        const progressRecords = await this.prisma.learningProgress.findMany({
            where: { student_id: userId, course_id: courseId }
        });
        let totalPercent = 0;
        resources.forEach(r => {
            const p = progressRecords.find(pr => pr.resource_id === r.resource_id);
            if (p)
                totalPercent += p.progress_percent;
        });
        return Math.round(totalPercent / resources.length);
    }
    async getMyActivities(userId, limit = 20) {
        return this.prisma.learningActivity.findMany({
            where: { student_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
            include: {
                course: { select: { title: true } },
                topic: { select: { topic_title: true } },
                resource: { select: { resource_title: true } }
            }
        });
    }
    async logBlockInteraction(userId, dto) {
        const { courseId, topicId, blockType, isCorrect, attemptNumber, studentAnswer, blockId, lessonId, conceptTags } = dto;
        const topic = await this.prisma.topic.findFirst({
            where: { topic_id: topicId, course_id: courseId }
        });
        if (!topic) {
            throw new Error('Topic not found or does not belong to the given course.');
        }
        return this.prisma.learningActivity.create({
            data: {
                student_id: userId,
                course_id: courseId,
                topic_id: topicId,
                activity_type: 'AI_BLOCK_INTERACTION',
                metadata: {
                    blockType,
                    isCorrect,
                    attemptNumber,
                    studentAnswer,
                    blockId,
                    lessonId,
                    conceptTags
                }
            }
        });
    }
    async getConceptPerformance(userId, courseId, topicId) {
        const whereClause = {
            student_id: userId,
            activity_type: 'AI_BLOCK_INTERACTION',
        };
        if (courseId)
            whereClause.course_id = courseId;
        if (topicId)
            whereClause.topic_id = topicId;
        const activities = await this.prisma.learningActivity.findMany({
            where: whereClause
        });
        const conceptStats = {};
        for (const activity of activities) {
            if (!activity.metadata)
                continue;
            const meta = activity.metadata;
            if (!meta.conceptTags || !Array.isArray(meta.conceptTags))
                continue;
            if (meta.isCorrect === undefined || meta.isCorrect === null)
                continue;
            const isCorrect = Boolean(meta.isCorrect);
            for (const tag of meta.conceptTags) {
                if (!conceptStats[tag]) {
                    conceptStats[tag] = { attempts: 0, correct: 0 };
                }
                conceptStats[tag].attempts += 1;
                if (isCorrect) {
                    conceptStats[tag].correct += 1;
                }
            }
        }
        const results = Object.entries(conceptStats).map(([conceptTag, stats]) => {
            const accuracy = Math.round((stats.correct / stats.attempts) * 100);
            let performance = 'WEAK';
            if (accuracy >= 80)
                performance = 'STRONG';
            else if (accuracy >= 50)
                performance = 'DEVELOPING';
            return {
                conceptTag,
                attempts: stats.attempts,
                correct: stats.correct,
                accuracy,
                performance
            };
        });
        return { concepts: results };
    }
    async getAIJourneyState(userId, courseId, topicId) {
        const record = await this.prisma.learningActivity.findFirst({
            where: {
                student_id: userId,
                course_id: courseId,
                topic_id: topicId,
                activity_type: 'AI_BLOCK_INTERACTION',
                metadata: {
                    path: ['blockType'],
                    equals: 'JOURNEY_STATE'
                }
            },
            orderBy: { created_at: 'desc' }
        });
        if (!record || !record.metadata)
            return null;
        return record.metadata['state'] || null;
    }
    async saveAIJourneyState(userId, courseId, topicId, state) {
        return this.prisma.learningActivity.create({
            data: {
                student_id: userId,
                course_id: courseId,
                topic_id: topicId,
                activity_type: 'AI_BLOCK_INTERACTION',
                metadata: {
                    blockType: 'JOURNEY_STATE',
                    state
                }
            }
        });
    }
    async getProgressByTopicResources(userId, topicId) {
        return this.prisma.learningProgress.findMany({
            where: { student_id: userId, topic_id: topicId }
        });
    }
};
exports.LearningProgressService = LearningProgressService;
exports.LearningProgressService = LearningProgressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LearningProgressService);
//# sourceMappingURL=learning-progress.service.js.map