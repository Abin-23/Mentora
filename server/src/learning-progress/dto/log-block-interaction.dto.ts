import { IsInt, IsString, IsBoolean, IsOptional, Min, IsArray } from 'class-validator';

export class LogBlockInteractionDto {
  @IsInt()
  courseId: number;

  @IsInt()
  topicId: number;

  @IsString()
  blockType: string;

  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;

  @IsInt()
  @Min(1)
  attemptNumber: number;

  @IsOptional()
  studentAnswer?: any;

  @IsInt()
  @IsOptional()
  blockId?: number;

  @IsInt()
  @IsOptional()
  lessonId?: number;
  
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  conceptTags?: string[];
}
