import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(courseId: number, createTopicDto: CreateTopicDto) {
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

  async findAllByCourse(courseId: number) {
    return this.prisma.topic.findMany({
      where: { course_id: courseId },
      orderBy: { sequence_number: 'asc' },
    });
  }

  async findOne(id: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { topic_id: id },
    });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }
    return topic;
  }

  async update(id: number, updateTopicDto: UpdateTopicDto) {
    await this.findOne(id);
    return this.prisma.topic.update({
      where: { topic_id: id },
      data: updateTopicDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.topic.delete({
      where: { topic_id: id },
    });
  }

  async reorder(courseId: number, reorderDto: ReorderTopicsDto) {
    const updates = reorderDto.topics.map((topic) =>
      this.prisma.topic.update({
        where: { topic_id: topic.topic_id },
        data: { sequence_number: topic.sequence_number },
      }),
    );
    await this.prisma.$transaction(updates);
    return { success: true, message: 'Topics reordered successfully' };
  }
}
