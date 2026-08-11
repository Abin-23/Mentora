import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async freeEnrollment(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { course_id: courseId },
    });
    if (!course) {
      throw new BadRequestException('Course not found');
    }

    if (Number(course.price) > 0) {
      throw new BadRequestException('Course is not free');
    }

    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: { user_id: userId, course_id: courseId },
    });

    if (existingEnrollment) {
      throw new ConflictException('User is already enrolled in this course');
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

  async getMyEnrollments(userId: number) {
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
}
