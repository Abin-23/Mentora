import { LearningProgressService } from './learning-progress.service';
import { StartProgressDto } from './dto/start-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
export declare class LearningProgressController {
    private readonly learningProgressService;
    constructor(learningProgressService: LearningProgressService);
    startProgress(req: any, dto: StartProgressDto): Promise<{
        status: import(".prisma/client").$Enums.ProgressStatus;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        topic_id: number;
        resource_id: number;
        completed_at: Date | null;
        student_id: number;
        started_at: Date;
        progress_percent: number;
        time_spent_seconds: number;
        progress_id: number;
        last_accessed_at: Date;
    }>;
    updateProgress(req: any, id: number, dto: UpdateProgressDto): Promise<{
        status: import(".prisma/client").$Enums.ProgressStatus;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        topic_id: number;
        resource_id: number;
        completed_at: Date | null;
        student_id: number;
        started_at: Date;
        progress_percent: number;
        time_spent_seconds: number;
        progress_id: number;
        last_accessed_at: Date;
    }>;
    completeProgress(req: any, id: number): Promise<{
        status: import(".prisma/client").$Enums.ProgressStatus;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        topic_id: number;
        resource_id: number;
        completed_at: Date | null;
        student_id: number;
        started_at: Date;
        progress_percent: number;
        time_spent_seconds: number;
        progress_id: number;
        last_accessed_at: Date;
    }>;
    getCourseProgress(req: any, courseId: number): Promise<number>;
    getTopicProgress(req: any, topicId: number): Promise<number>;
    getProgressByTopicResources(req: any, topicId: number): Promise<{
        status: import(".prisma/client").$Enums.ProgressStatus;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        topic_id: number;
        resource_id: number;
        completed_at: Date | null;
        student_id: number;
        started_at: Date;
        progress_percent: number;
        time_spent_seconds: number;
        progress_id: number;
        last_accessed_at: Date;
    }[]>;
    getMyActivities(req: any): Promise<({
        topic: {
            topic_title: string;
        };
        resource: {
            resource_title: string;
        };
    } & {
        created_at: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        course_id: number;
        topic_id: number;
        resource_id: number;
        student_id: number;
        activity_type: import(".prisma/client").$Enums.ActivityType;
        activity_id: number;
    })[]>;
}
