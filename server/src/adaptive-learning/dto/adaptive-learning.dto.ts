import { IsInt, IsOptional, Min } from 'class-validator';

export class GeneratePathDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 5;
}

export class LearningPathTopicDto {
  topicId: number;
  title: string;
  sequenceNumber: number;
  reason: string;
  knowledgeScore: number;
  proficiency: string;
  resources?: any[]; // To be populated with Prisma resources
}

export class LearningPathResponseDto {
  studentId: number;
  courseId: number;
  recommendedTopics: LearningPathTopicDto[];
  generatedAt: Date;
}
