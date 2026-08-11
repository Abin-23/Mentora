import { IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class TopicOrderDto {
  @IsInt()
  topic_id: number;

  @IsInt()
  sequence_number: number;
}

export class ReorderTopicsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicOrderDto)
  topics: TopicOrderDto[];
}
