import { IsInt, IsNotEmpty } from 'class-validator';

export class StartProgressDto {
  @IsInt()
  @IsNotEmpty()
  course_id: number;

  @IsInt()
  @IsNotEmpty()
  topic_id: number;

  @IsInt()
  @IsNotEmpty()
  resource_id: number;
}
