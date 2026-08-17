import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { DifficultyLevel, CourseStatus } from '@prisma/client';

export class CreateTopicDto {
  @IsString()
  topic_title: string;

  @IsString()
  @IsOptional()
  topic_description?: string;

  @IsString()
  learning_objectives: string;

  @IsEnum(DifficultyLevel)
  difficulty_level: DifficultyLevel;

  @IsNumber()
  @IsOptional()
  estimated_duration?: number;

  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
}
