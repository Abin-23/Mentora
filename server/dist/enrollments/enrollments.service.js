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
exports.EnrollmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EnrollmentsService = class EnrollmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async freeEnrollment(userId, courseId) {
        const course = await this.prisma.course.findUnique({
            where: { course_id: courseId },
        });
        if (!course) {
            throw new common_1.BadRequestException('Course not found');
        }
        if (Number(course.price) > 0) {
            throw new common_1.BadRequestException('Course is not free');
        }
        const existingEnrollment = await this.prisma.enrollment.findFirst({
            where: { user_id: userId, course_id: courseId },
        });
        if (existingEnrollment) {
            throw new common_1.ConflictException('User is already enrolled in this course');
        }
        const enrollment = await this.prisma.enrollment.create({
            data: {
                user_id: userId,
                course_id: courseId,
                enrollment_status: 'ACTIVE',
            },
        });
        return { success: true, message: 'Enrolled successfully', enrollment };
    }
    async getMyEnrollments(userId) {
        return this.prisma.enrollment.findMany({
            where: { user_id: userId },
            include: {
                course: {
                    include: {
                        category: true,
                        course_admin: {
                            select: {
                                full_name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { enrolled_at: 'desc' },
        });
    }
};
exports.EnrollmentsService = EnrollmentsService;
exports.EnrollmentsService = EnrollmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EnrollmentsService);
//# sourceMappingURL=enrollments.service.js.map