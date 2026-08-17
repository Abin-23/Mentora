import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress_percent?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  time_spent_seconds?: number; // Delta to add
}
