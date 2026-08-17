import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';
export declare class TopicsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(courseId: number, createTopicDto: CreateTopicDto): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        course_id: number;
        topic_id: number;
        topic_title: string;
        topic_description: string | null;
        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
        sequence_number: number;
    }>;
    findAllByCourse(courseId: number): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        course_id: number;
        topic_id: number;
        topic_title: string;
        topic_description: string | null;
        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
        sequence_number: number;
    }[]>;
    findOne(id: number): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        course_id: number;
        topic_id: number;
        topic_title: string;
        topic_description: string | null;
        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
        sequence_number: number;
    }>;
    update(id: number, updateTopicDto: UpdateTopicDto): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        course_id: number;
        topic_id: number;
        topic_title: string;
        topic_description: string | null;
        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
        sequence_number: number;
    }>;
    remove(id: number): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        course_id: number;
        topic_id: number;
        topic_title: string;
        topic_description: string | null;
        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
        sequence_number: number;
    }>;
    reorder(courseId: number, reorderDto: ReorderTopicsDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
