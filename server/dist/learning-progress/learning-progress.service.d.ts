import { PrismaService } from '../prisma/prisma.service';
import { StartProgressDto } from './dto/start-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
export declare class LearningProgressService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    startProgress(userId: number, dto: StartProgressDto): Promise<{
        status: import(".prisma/client").$Enums.ProgressStatus;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        topic_id: number;
        resource_id: number;
        student_id: number;
        started_at: Date;
        completed_at: Date | null;
        progress_id: number;
        progress_percent: number;
        time_spent_seconds: number;
        last_accessed_at: Date;
    }>;
    updateProgress(userId: number, progressId: number, dto: UpdateProgressDto): Promise<{
        status: import(".prisma/client").$Enums.ProgressStatus;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        topic_id: number;
        resource_id: number;
        student_id: number;
        started_at: Date;
        completed_at: Date | null;
        progress_id: number;
        progress_percent: number;
        time_spent_seconds: number;
        last_accessed_at: Date;
    }>;
    completeProgress(userId: number, progressId: number): Promise<{
        status: import(".prisma/client").$Enums.ProgressStatus;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        topic_id: number;
        resource_id: number;
        student_id: number;
        started_at: Date;
        completed_at: Date | null;
        progress_id: number;
        progress_percent: number;
        time_spent_seconds: number;
        last_accessed_at: Date;
    }>;
    getTopicProgress(userId: number, topicId: number): Promise<number>;
    getCourseProgress(userId: number, courseId: number): Promise<number>;
    getMyActivities(userId: number, limit?: number): Promise<({
        course: {
            title: string;
        };
        topic: {
            topic_title: string;
        };
        resource: {
            resource_title: string;
        } | null;
    } & {
        created_at: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        course_id: number;
        topic_id: number;
        resource_id: number | null;
        student_id: number;
        activity_type: import(".prisma/client").$Enums.ActivityType;
        activity_id: number;
    })[]>;
    logBlockInteraction(userId: number, dto: any): Promise<{
        created_at: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        course_id: number;
        topic_id: number;
        resource_id: number | null;
        student_id: number;
        activity_type: import(".prisma/client").$Enums.ActivityType;
        activity_id: number;
    }>;
    getConceptPerformance(userId: number, courseId?: number, topicId?: number): Promise<{
        concepts: {
            conceptTag: string;
            attempts: number;
            correct: number;
            accuracy: number;
            performance: string;
        }[];
    }>;
    getAIJourneyState(userId: number, courseId: number, topicId: number): Promise<any>;
    saveAIJourneyState(userId: number, courseId: number, topicId: number, state: any): Promise<{
        created_at: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        course_id: number;
        topic_id: number;
        resource_id: number | null;
        student_id: number;
        activity_type: import(".prisma/client").$Enums.ActivityType;
        activity_id: number;
    }>;
    getProgressByTopicResources(userId: number, topicId: number): Promise<{
        status: import(".prisma/client").$Enums.ProgressStatus;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        topic_id: number;
        resource_id: number;
        student_id: number;
        started_at: Date;
        completed_at: Date | null;
        progress_id: number;
        progress_percent: number;
        time_spent_seconds: number;
        last_accessed_at: Date;
    }[]>;
}
