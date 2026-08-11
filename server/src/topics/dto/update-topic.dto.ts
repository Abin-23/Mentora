import { PartialType } from '@nestjs/mapped-types';
import { CreateTopicDto } from './create-topic.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseStatus } from '@prisma/client';

export class UpdateTopicDto extends PartialType(CreateTopicDto) {
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
}
