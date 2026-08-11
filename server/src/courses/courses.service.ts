import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

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

  async findOne(idOrSlug: number | string, userId?: number) {
    let whereClause: any;
    if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
      whereClause = { course_id: Number(idOrSlug) };
    } else {
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

  async getCoursePlayerContent(idOrSlug: number | string, userId: number) {
    let whereClause: any;
    if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
      whereClause = { course_id: Number(idOrSlug) };
    } else {
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

    return course;
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

    return this.prisma.course.update({
      where: { course_id: id },
      data: {
        ...updateCourseDto,
        slug,
      },
    });
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
