import { IsInt, IsString, IsOptional, Min, IsArray } from 'class-validator';

export class EvaluatePracticeDto {
  @IsInt()
  courseId: number;

  @IsInt()
  topicId: number;

  @IsString()
  instruction: string;

  @IsString()
  studentAnswer: string;

  @IsString()
  @IsOptional()
  blockType?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  attemptNumber?: number;

  @IsString()
  @IsOptional()
  topicTitle?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  conceptTags?: string[];
}
