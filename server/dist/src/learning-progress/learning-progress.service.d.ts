import { PrismaService } from '../prisma/prisma.service';
import { StartProgressDto } from './dto/start-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
export declare class LearningProgressService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    startProgress(userId: number, dto: StartProgressDto): Promise<{
        progress_id: number;
        student_id: number;
        course_id: number;
        topic_id: number;
        resource_id: number;
        status: import(".prisma/client").$Enums.ProgressStatus;
        progress_percent: number;
        time_spent_seconds: number;
        started_at: Date;
        completed_at: Date | null;
        last_accessed_at: Date;
        created_at: Date;
        updated_at: Date;
    }>;
    updateProgress(userId: number, progressId: number, dto: UpdateProgressDto): Promise<{
        progress_id: number;
        student_id: number;
        course_id: number;
        topic_id: number;
        resource_id: number;
        status: import(".prisma/client").$Enums.ProgressStatus;
        progress_percent: number;
        time_spent_seconds: number;
        started_at: Date;
        completed_at: Date | null;
        last_accessed_at: Date;
        created_at: Date;
        updated_at: Date;
    }>;
    completeProgress(userId: number, progressId: number): Promise<{
        progress_id: number;
        student_id: number;
        course_id: number;
        topic_id: number;
        resource_id: number;
        status: import(".prisma/client").$Enums.ProgressStatus;
        progress_percent: number;
        time_spent_seconds: number;
        started_at: Date;
        completed_at: Date | null;
        last_accessed_at: Date;
        created_at: Date;
        updated_at: Date;
    }>;
    getTopicProgress(userId: number, topicId: number): Promise<number>;
    getCourseProgress(userId: number, courseId: number): Promise<number>;
    getMyActivities(userId: number, limit?: number): Promise<({
        topic: {
            topic_title: string;
        };
        resource: {
            resource_title: string;
        };
    } & {
        student_id: number;
        course_id: number;
        topic_id: number;
        resource_id: number;
        created_at: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        activity_type: import(".prisma/client").$Enums.ActivityType;
        activity_id: number;
    })[]>;
    getProgressByTopicResources(userId: number, topicId: number): Promise<{
        progress_id: number;
        student_id: number;
        course_id: number;
        topic_id: number;
        resource_id: number;
        status: import(".prisma/client").$Enums.ProgressStatus;
        progress_percent: number;
        time_spent_seconds: number;
        started_at: Date;
        completed_at: Date | null;
        last_accessed_at: Date;
        created_at: Date;
        updated_at: Date;
    }[]>;
}
