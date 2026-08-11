import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';
export declare class TopicsController {
    private readonly topicsService;
    constructor(topicsService: TopicsService);
    create(courseId: number, createTopicDto: CreateTopicDto): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        course_id: number;
        sequence_number: number;
        topic_id: number;
        topic_title: string;
        topic_description: string | null;
        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    findAllByCourse(courseId: number): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        course_id: number;
        sequence_number: number;
        topic_id: number;
        topic_title: string;
        topic_description: string | null;
        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    reorder(courseId: number, reorderTopicsDto: ReorderTopicsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    findOne(id: number): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        course_id: number;
        sequence_number: number;
        topic_id: number;
        topic_title: string;
        topic_description: string | null;
        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    update(id: number, updateTopicDto: UpdateTopicDto): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        course_id: number;
        sequence_number: number;
        topic_id: number;
        topic_title: string;
        topic_description: string | null;
        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    remove(id: number): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        course_id: number;
        sequence_number: number;
        topic_id: number;
        topic_title: string;
        topic_description: string | null;
        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
