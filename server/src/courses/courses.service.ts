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

    if (updateCourseDto.status === 'Published' || course.status === 'Published') {
      // Fire and forget Knowledge Graph sync
      this.syncCourseToNeo4j(updated.course_id).catch(e => {
        console.error('Failed to sync course to Neo4j async', e);
      });
    }

    if (updateCourseDto.status === 'Published' && course.status !== 'Published') {
      // Fire and forget AI generation
      this.aiGeneration.generateInitialAssessment(updated.course_id).catch(e => {
        console.error('Failed to generate initial assessment async', e);
      });
    }

    return updated;
  }

  async syncAllCoursesToNeo4j() {
    const courses = await this.prisma.course.findMany({
      select: { course_id: true }
    });
    for (const c of courses) {
      await this.syncCourseToNeo4j(c.course_id);
    }
    return { success: true, count: courses.length };
  }

  async syncCourseToNeo4j(courseId: number) {
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

    // Execute comprehensive deletion inside a transaction to cleanly delete all dependents
    // This resolves database errors when existing foreign keys on Postgres/Render have ON DELETE RESTRICT
    const deletedCourse = await this.prisma.$transaction(async (tx) => {
      // 1. Delete certificates
      await tx.certificate.deleteMany({
        where: { course_id: id },
      });

      // 2. Delete student course goals
      await tx.studentCourseGoal.deleteMany({
        where: { course_id: id },
      });

      // 3. Delete learning activities
      await tx.learningActivity.deleteMany({
        where: { course_id: id },
      });

      // 4. Delete learning progress
      await tx.learningProgress.deleteMany({
        where: { course_id: id },
      });

      // 5. Delete enrollments (resolves "enrollments_course_id_fkey" RESTRICT error)
      await tx.enrollment.deleteMany({
        where: { course_id: id },
      });

      // 6. Delete purchases
      await tx.purchase.deleteMany({
        where: { course_id: id },
      });

      // 7. Find topics and assessments for this course
      const topics = await tx.topic.findMany({
        where: { course_id: id },
        select: { topic_id: true },
      });
      const topicIds = topics.map((t) => t.topic_id);

      const assessments = await tx.assessment.findMany({
        where: { course_id: id },
        select: { assessment_id: true },
      });
      const assessmentIds = assessments.map((a) => a.assessment_id);

      // Clean up assessment attempts, security events, and reports
      if (assessmentIds.length > 0) {
        const attempts = await tx.assessmentAttempt.findMany({
          where: { assessment_id: { in: assessmentIds } },
          select: { attempt_id: true },
        });
        const attemptIds = attempts.map((att) => att.attempt_id);

        if (attemptIds.length > 0) {
          await tx.assessmentIntegrityReport.deleteMany({
            where: { attempt_id: { in: attemptIds } },
          });
          await tx.assessmentSecurityEvent.deleteMany({
            where: { attempt_id: { in: attemptIds } },
          });
          await tx.studentAnswer.deleteMany({
            where: { attempt_id: { in: attemptIds } },
          });
          await tx.assessmentTopicResult.deleteMany({
            where: { attempt_id: { in: attemptIds } },
          });
          await tx.assessmentAttempt.deleteMany({
            where: { attempt_id: { in: attemptIds } },
          });
        }

        await tx.assessmentQuestionMap.deleteMany({
          where: { assessment_id: { in: assessmentIds } },
        });
        await tx.assessmentTopic.deleteMany({
          where: { assessment_id: { in: assessmentIds } },
        });
        await tx.assessment.deleteMany({
          where: { course_id: id },
        });
      }

      // Clean up topic-level relationships
      if (topicIds.length > 0) {
        await tx.topicAILesson.deleteMany({
          where: { topic_id: { in: topicIds } },
        });

        await tx.assessmentTopicResult.deleteMany({
          where: { topic_id: { in: topicIds } },
        });

        await tx.assessmentTopic.deleteMany({
          where: { topic_id: { in: topicIds } },
        });

        const questions = await tx.question.findMany({
          where: { topic_id: { in: topicIds } },
          select: { question_id: true },
        });
        const questionIds = questions.map((q) => q.question_id);

        if (questionIds.length > 0) {
          await tx.studentAnswer.deleteMany({
            where: { question_id: { in: questionIds } },
          });
          await tx.assessmentQuestionMap.deleteMany({
            where: { question_id: { in: questionIds } },
          });
          await tx.questionOption.deleteMany({
            where: { question_id: { in: questionIds } },
          });
          await tx.question.deleteMany({
            where: { topic_id: { in: topicIds } },
          });
        }

        await tx.resource.deleteMany({
          where: { topic_id: { in: topicIds } },
        });

        await tx.topic.deleteMany({
          where: { course_id: id },
        });
      }

      // 8. Finally delete the course
      return tx.course.delete({
        where: { course_id: id },
      });
    });

    // Clean up Neo4j graph nodes
    try {
      await this.neo4jService.write(
        `
        MATCH (c:Course {courseId: toInteger($courseId)})
        OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)
        DETACH DELETE c, t
        `,
        { courseId: neo4j.int(id) }
      );
      console.log(`Successfully removed Course #${id} from Neo4j`);
    } catch (neoErr) {
      console.error(`Error deleting Course #${id} from Neo4j:`, neoErr);
    }

    return deletedCourse;
  }
}
