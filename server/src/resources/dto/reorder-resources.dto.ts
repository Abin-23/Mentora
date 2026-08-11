import { IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ResourceOrderDto {
  @IsInt()
  resource_id: number;

  @IsInt()
  sequence_number: number;
}

export class ReorderResourcesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceOrderDto)
  resources: ResourceOrderDto[];
}
