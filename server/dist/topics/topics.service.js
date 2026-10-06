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
exports.TopicsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TopicsService = class TopicsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(courseId, createTopicDto) {
        const maxSeq = await this.prisma.topic.aggregate({
            where: { course_id: courseId },
            _max: { sequence_number: true },
        });
        const nextSeq = (maxSeq._max.sequence_number || 0) + 1;
        return this.prisma.topic.create({
            data: {
                ...createTopicDto,
                course_id: courseId,
                sequence_number: nextSeq,
            },
        });
    }
    async findAllByCourse(courseId) {
        return this.prisma.topic.findMany({
            where: { course_id: courseId },
            orderBy: { sequence_number: 'asc' },
        });
    }
    async findOne(id) {
        const topic = await this.prisma.topic.findUnique({
            where: { topic_id: id },
        });
        if (!topic) {
            throw new common_1.NotFoundException(`Topic with ID ${id} not found`);
        }
        return topic;
    }
    async update(id, updateTopicDto) {
        await this.findOne(id);
        return this.prisma.topic.update({
            where: { topic_id: id },
            data: updateTopicDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.topic.delete({
            where: { topic_id: id },
        });
    }
    async reorder(courseId, reorderDto) {
        const updates = reorderDto.topics.map((topic) => this.prisma.topic.update({
            where: { topic_id: topic.topic_id },
            data: { sequence_number: topic.sequence_number },
        }));
        await this.prisma.$transaction(updates);
        return { success: true, message: 'Topics reordered successfully' };
    }
};
exports.TopicsService = TopicsService;
exports.TopicsService = TopicsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TopicsService);
//# sourceMappingURL=topics.service.js.map