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
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CoursesService = class CoursesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
    async create(createCourseDto, userId) {
        let slug = this.generateSlug(createCourseDto.title);
        let existing = await this.prisma.course.findUnique({ where: { slug } });
        let counter = 1;
        while (existing) {
            slug = `${this.generateSlug(createCourseDto.title)}-${counter}`;
            existing = await this.prisma.course.findUnique({ where: { slug } });
            counter++;
        }
        return this.prisma.course.create({
            data: {
                ...createCourseDto,
                slug,
                course_admin_id: userId,
            },
        });
    }
    findAll(user) {
        const whereClause = user.role === 'CourseAdmin' ? { course_admin_id: user.user_id } : {};
        return this.prisma.course.findMany({
            where: whereClause,
            orderBy: { created_at: 'desc' },
            include: {
                category: { select: { category_name: true } },
                course_admin: { select: { full_name: true, email: true } },
            },
        });
    }
    async findByCategory(categorySlugOrId, userId) {
        let categoryId;
        if (typeof categorySlugOrId === 'number' || !isNaN(Number(categorySlugOrId))) {
            categoryId = Number(categorySlugOrId);
        }
        else {
            const categories = await this.prisma.category.findMany();
            const category = categories.find(c => this.generateSlug(c.category_name) === categorySlugOrId);
            if (!category)
                throw new common_1.NotFoundException('Category not found');
            categoryId = category.category_id;
        }
        const courses = await this.prisma.course.findMany({
            where: {
                category_id: categoryId,
                status: 'Published',
            },
            orderBy: { created_at: 'desc' },
            include: {
                course_admin: {
                    select: { full_name: true, email: true, profile_image: true },
                },
            },
        });
        if (!userId)
            return courses.map((c) => ({ ...c, is_enrolled: false }));
        const enrollments = await this.prisma.enrollment.findMany({
            where: {
                user_id: userId,
                course_id: { in: courses.map((c) => c.course_id) },
            },
        });
        const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));
        return courses.map((c) => ({
            ...c,
            is_enrolled: enrolledCourseIds.has(c.course_id),
        }));
    }
    async findOne(idOrSlug, userId) {
        let whereClause;
        if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
            whereClause = { course_id: Number(idOrSlug) };
        }
        else {
            whereClause = { slug: idOrSlug };
        }
        const course = await this.prisma.course.findUnique({
            where: whereClause,
            include: {
                category: { select: { category_name: true } },
                course_admin: {
                    select: { full_name: true, email: true, profile_image: true },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException(`Course not found`);
        }
        let is_enrolled = false;
        if (userId) {
            const enrollment = await this.prisma.enrollment.findFirst({
                where: { user_id: userId, course_id: course.course_id },
            });
            is_enrolled = !!enrollment;
        }
        return { ...course, is_enrolled };
    }
    async getCoursePlayerContent(idOrSlug, userId) {
        let whereClause;
        if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
            whereClause = { course_id: Number(idOrSlug) };
        }
        else {
            whereClause = { slug: idOrSlug };
        }
        const course = await this.prisma.course.findUnique({
            where: whereClause,
            include: {
                topics: {
                    orderBy: { sequence_number: 'asc' },
                    include: {
                        resources: {
                            orderBy: { sequence_number: 'asc' },
                        },
                    },
                },
                course_admin: { select: { full_name: true, profile_image: true } },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException(`Course not found`);
        }
        const enrollment = await this.prisma.enrollment.findFirst({
            where: { user_id: userId, course_id: course.course_id },
        });
        if (!enrollment) {
            throw new common_1.ForbiddenException('You must be enrolled to access course content');
        }
        return course;
    }
    async update(id, updateCourseDto, user) {
        const course = await this.findOne(id);
        if (user.role === 'CourseAdmin' &&
            course.course_admin_id !== user.user_id) {
            throw new common_1.ForbiddenException('You can only edit your own courses');
        }
        let slug = course.slug;
        if (updateCourseDto.title && updateCourseDto.title !== course.title) {
            slug = this.generateSlug(updateCourseDto.title);
            let existing = await this.prisma.course.findUnique({ where: { slug } });
            let counter = 1;
            while (existing && existing.course_id !== id) {
                slug = `${this.generateSlug(updateCourseDto.title)}-${counter}`;
                existing = await this.prisma.course.findUnique({ where: { slug } });
                counter++;
            }
        }
        return this.prisma.course.update({
            where: { course_id: id },
            data: {
                ...updateCourseDto,
                slug,
            },
        });
    }
    async remove(id, user) {
        const course = await this.findOne(id);
        if (user.role === 'CourseAdmin' &&
            course.course_admin_id !== user.user_id) {
            throw new common_1.ForbiddenException('You can only delete your own courses');
        }
        return this.prisma.course.delete({
            where: { course_id: id },
        });
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoursesService);
//# sourceMappingURL=courses.service.js.map