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
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_generation_service_1 = require("../assessments/ai-generation.service");
const neo4j_service_1 = require("../neo4j/neo4j.service");
const resources_service_1 = require("../resources/resources.service");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
let CoursesService = class CoursesService {
    prisma;
    aiGeneration;
    neo4jService;
    resourcesService;
    constructor(prisma, aiGeneration, neo4jService, resourcesService) {
        this.prisma = prisma;
        this.aiGeneration = aiGeneration;
        this.neo4jService = neo4jService;
        this.resourcesService = resourcesService;
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
        const isId = typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug));
        const course = await this.prisma.course.findUnique({
            where: isId ? { course_id: Number(idOrSlug) } : { slug: String(idOrSlug) },
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
        const isId = typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug));
        const course = await this.prisma.course.findUnique({
            where: isId ? { course_id: Number(idOrSlug) } : { slug: String(idOrSlug) },
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
        const initialAssessment = await this.prisma.assessment.findFirst({
            where: { course_id: course.course_id, assessment_type: 'INITIAL', status: 'PUBLISHED' }
        });
        let initial_assessment_pending = false;
        let initial_assessment_data = null;
        if (initialAssessment) {
            initial_assessment_data = initialAssessment;
            const attempt = await this.prisma.assessmentAttempt.findFirst({
                where: { assessment_id: initialAssessment.assessment_id, student_id: userId, status: 'SUBMITTED' }
            });
            if (!attempt) {
                initial_assessment_pending = true;
            }
        }
        if (initial_assessment_pending) {
            return { ...course, topics: [], initial_assessment_pending, initial_assessment: initial_assessment_data };
        }
        for (const topic of course.topics) {
            if (topic.resources && topic.resources.length > 0) {
                topic.resources = await this.resourcesService.signResources(topic.resources);
            }
        }
        return { ...course, initial_assessment_pending: false };
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
        const updated = await this.prisma.course.update({
            where: { course_id: id },
            data: {
                ...updateCourseDto,
                slug,
            },
        });
        if (updateCourseDto.status === 'Published' && course.status !== 'Published') {
            this.aiGeneration.generateInitialAssessment(updated.course_id).catch(e => {
                console.error('Failed to generate initial assessment async', e);
            });
            this.syncCourseToNeo4j(updated.course_id).catch(e => {
                console.error('Failed to sync course to Neo4j async', e);
            });
        }
        return updated;
    }
    async syncCourseToNeo4j(courseId) {
        if (!this.neo4jService.isDatabaseConnected()) {
            console.warn('Neo4j is not connected. Skipping course sync.');
            return;
        }
        const course = await this.prisma.course.findUnique({
            where: { course_id: courseId },
            include: {
                topics: {
                    orderBy: { sequence_number: 'asc' },
                },
            },
        });
        if (!course)
            return;
        try {
            await this.neo4jService.write(`
        MERGE (c:Course {courseId: toInteger($courseId)})
        SET c.title = $title
        `, { courseId: neo4j_driver_1.default.int(course.course_id), title: course.title });
            for (const topic of course.topics) {
                await this.neo4jService.write(`
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
                await this.neo4jService.write(`
          MATCH (t1:Topic {topicId: toInteger($topic1Id)})
          MATCH (t2:Topic {topicId: toInteger($topic2Id)})
          MERGE (t1)-[:PREREQUISITE_FOR]->(t2)
          `, {
                    topic1Id: neo4j_driver_1.default.int(currentTopic.topic_id),
                    topic2Id: neo4j_driver_1.default.int(nextTopic.topic_id),
                });
            }
            console.log(`Successfully synced Course #${courseId} to Neo4j`);
        }
        catch (error) {
            console.error('Error syncing course to Neo4j:', error);
        }
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_generation_service_1.AiGenerationService,
        neo4j_service_1.Neo4jService,
        resources_service_1.ResourcesService])
], CoursesService);
//# sourceMappingURL=courses.service.js.map