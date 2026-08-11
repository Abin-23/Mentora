import { DifficultyLevel, CourseStatus } from '@prisma/client';
export declare class CreateCourseDto {
    category_id: number;
    title: string;
    short_description: string;
    description: string;
    learning_objectives: string;
    prerequisites?: string;
    difficulty_level?: DifficultyLevel;
    language?: string;
    duration_hours?: number;
    price?: number;
    thumbnail_key?: string;
    status?: CourseStatus;
}
