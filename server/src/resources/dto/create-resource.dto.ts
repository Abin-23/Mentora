import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ResourceType, CourseStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateResourceDto {
  @IsString()
  resource_title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ResourceType)
  resource_type: ResourceType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value === true;
  })
  @IsBoolean()
  is_preview?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  duration_seconds?: number;

  @IsString()
  @IsOptional()
  link_url?: string;

  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
}
