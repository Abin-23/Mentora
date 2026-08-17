import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartProgressDto } from './dto/start-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ProgressStatus, ActivityType } from '@prisma/client';

@Injectable()
export class LearningProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async startProgress(userId: number, dto: StartProgressDto) {
    // Upsert the learning progress
    const progress = await this.prisma.learningProgress.upsert({
      where: {
        student_id_resource_id: {
          student_id: userId,
          resource_id: dto.resource_id,
        },
      },
      update: {
        last_accessed_at: new Date(),
        status: ProgressStatus.IN_PROGRESS,
      },
      create: {
        student_id: userId,
        course_id: dto.course_id,
        topic_id: dto.topic_id,
        resource_id: dto.resource_id,
        status: ProgressStatus.IN_PROGRESS,
        progress_percent: 0,
      },
    });

    // Log the activity
    await this.prisma.learningActivity.create({
      data: {
        student_id: userId,
        course_id: dto.course_id,
        topic_id: dto.topic_id,
        resource_id: dto.resource_id,
        activity_type: ActivityType.RESOURCE_STARTED,
      },
    });

    return progress;
  }

  async updateProgress(userId: number, progressId: number, dto: UpdateProgressDto) {
    const progress = await this.prisma.learningProgress.findUnique({
      where: { progress_id: progressId },
    });

    if (!progress || progress.student_id !== userId) {
      throw new NotFoundException('Progress not found');
    }

    if (progress.status === ProgressStatus.COMPLETED) {
       // If already completed, just return
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
        activity_type: ActivityType.RESOURCE_PROGRESS,
        metadata: {
           progress_percent: updated.progress_percent,
           time_spent_added: dto.time_spent_seconds || 0
        }
      },
    });

    return updated;
  }

  async completeProgress(userId: number, progressId: number) {
    const progress = await this.prisma.learningProgress.findUnique({
      where: { progress_id: progressId },
    });

    if (!progress || progress.student_id !== userId) {
      throw new NotFoundException('Progress not found');
    }

    const updated = await this.prisma.learningProgress.update({
      where: { progress_id: progressId },
      data: {
        progress_percent: 100,
        status: ProgressStatus.COMPLETED,
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
        activity_type: ActivityType.RESOURCE_COMPLETED,
      },
    });

    return updated;
  }

  async getTopicProgress(userId: number, topicId: number) {
    const resources = await this.prisma.resource.findMany({
       where: { topic_id: topicId }
    });

    if (resources.length === 0) return 0;

    const progressRecords = await this.prisma.learningProgress.findMany({
       where: { student_id: userId, topic_id: topicId }
    });

    let totalPercent = 0;
    resources.forEach(r => {
       const p = progressRecords.find(pr => pr.resource_id === r.resource_id);
       if (p) totalPercent += p.progress_percent;
    });

    return Math.round(totalPercent / resources.length);
  }

  async getCourseProgress(userId: number, courseId: number) {
    const resources = await this.prisma.resource.findMany({
       where: { topic: { course_id: courseId } }
    });

    if (resources.length === 0) return 0;

    const progressRecords = await this.prisma.learningProgress.findMany({
       where: { student_id: userId, course_id: courseId }
    });

    let totalPercent = 0;
    resources.forEach(r => {
       const p = progressRecords.find(pr => pr.resource_id === r.resource_id);
       if (p) totalPercent += p.progress_percent;
    });

    return Math.round(totalPercent / resources.length);
  }

  async getMyActivities(userId: number, limit = 20) {
    return this.prisma.learningActivity.findMany({
      where: { student_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
         resource: { select: { resource_title: true } },
         topic: { select: { topic_title: true } }
      }
    });
  }

  async getProgressByTopicResources(userId: number, topicId: number) {
     return this.prisma.learningProgress.findMany({
        where: { student_id: userId, topic_id: topicId }
     });
  }
}
