import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AiGenerationService } from '../assessments/ai-generation.service';
import { Neo4jService } from '../neo4j/neo4j.service';
import { ResourcesService } from '../resources/resources.service';
import neo4j from 'neo4j-driver';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private aiGeneration: AiGenerationService,
    private neo4jService: Neo4jService,
    private resourcesService: ResourcesService,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async create(createCourseDto: CreateCourseDto, userId: number) {
    let slug = this.generateSlug(createCourseDto.title);

    // Ensure uniqueness
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

  findAll(user: { user_id: number; role: string }) {
    const whereClause =
      user.role === 'CourseAdmin' ? { course_admin_id: user.user_id } : {};

    return this.prisma.course.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        category: { select: { category_name: true } },
        course_admin: { select: { full_name: true, email: true } },
      },
    });
  }

  async findByCategory(categorySlugOrId: string | number, userId?: number) {
    let categoryId: number;
    if (typeof categorySlugOrId === 'number' || !isNaN(Number(categorySlugOrId))) {
      categoryId = Number(categorySlugOrId);
    } else {
      const categories = await this.prisma.category.findMany();
      const category = categories.find(c => this.generateSlug(c.category_name) === categorySlugOrId);
      if (!category) throw new NotFoundException('Category not found');
      categoryId = category.category_id;
    }

    const courses = await this.prisma.course.findMany({
      where: {
        category_id: categoryId,
        status: 'Published', // Students only see Published courses
      },
      orderBy: { created_at: 'desc' },
      include: {
        course_admin: {
          select: { full_name: true, email: true, profile_image: true },
        },
      },
    });

    if (!userId) return courses.map((c) => ({ ...c, is_enrolled: false }));

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

  async findOne(idOrSlug: string | number, userId?: number) {
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
      throw new NotFoundException(`Course not found`);
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

  async getCoursePlayerContent(idOrSlug: string | number, userId: number) {
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
      throw new NotFoundException(`Course not found`);
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { user_id: userId, course_id: course.course_id },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled to access course content',
      );
    }

    // Check for INITIAL assessment
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

    // Sign resources
    for (const topic of course.topics) {
      if (topic.resources && topic.resources.length > 0) {
        topic.resources = await this.resourcesService.signResources(topic.resources) as any;
      }
    }

    return { ...course, initial_assessment_pending: false };
  }

  async update(id: number, updateCourseDto: UpdateCourseDto, user: { user_id: number; role: string }) {
    const course = await this.findOne(id);

    // Permission check
    if (
      user.role === 'CourseAdmin' &&
      course.course_admin_id !== user.user_id
    ) {
      throw new ForbiddenException('You can only edit your own courses');
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
      // Fire and forget AI generation
      this.aiGeneration.generateInitialAssessment(updated.course_id).catch(e => {
        console.error('Failed to generate initial assessment async', e);
      });
      // Fire and forget Knowledge Graph sync
      this.syncCourseToNeo4j(updated.course_id).catch(e => {
        console.error('Failed to sync course to Neo4j async', e);
      });
    }

    return updated;
  }

  private async syncCourseToNeo4j(courseId: number) {
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

    if (!course) return;

    try {
      // 1. Sync the Course node
      await this.neo4jService.write(
        `
        MERGE (c:Course {courseId: toInteger($courseId)})
        SET c.title = $title
        `,
        { courseId: neo4j.int(course.course_id), title: course.title }
      );

      // 2. Sync Topics and HAS_TOPIC relationships
      for (const topic of course.topics) {
        await this.neo4jService.write(
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

      // 3. Sync PREREQUISITE_FOR relationships (Sequential ordering)
      for (let i = 0; i < course.topics.length - 1; i++) {
        const currentTopic = course.topics[i];
        const nextTopic = course.topics[i + 1];

        await this.neo4jService.write(
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

      console.log(`Successfully synced Course #${courseId} to Neo4j`);
    } catch (error) {
      console.error('Error syncing course to Neo4j:', error);
    }
  }

  async remove(id: number, user: { user_id: number; role: string }) {
    const course = await this.findOne(id);

    // Permission check
    if (
      user.role === 'CourseAdmin' &&
      course.course_admin_id !== user.user_id
    ) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    return this.prisma.course.delete({
      where: { course_id: id },
    });
  }
}
