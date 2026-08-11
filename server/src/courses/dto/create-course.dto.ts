import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { DifficultyLevel, CourseStatus } from '@prisma/client';

export class CreateCourseDto {
  @IsNumber()
  @IsNotEmpty()
  category_id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  short_description!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  learning_objectives!: string;

  @IsString()
  @IsOptional()
  prerequisites?: string;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty_level?: DifficultyLevel;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  language?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  duration_hours?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  thumbnail_key?: string;

  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
}
