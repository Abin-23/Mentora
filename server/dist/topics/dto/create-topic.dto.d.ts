import { DifficultyLevel } from '@prisma/client';
export declare class CreateTopicDto {
    topic_title: string;
    topic_description?: string;
    learning_objectives: string;
    difficulty_level: DifficultyLevel;
    estimated_duration?: number;
}
