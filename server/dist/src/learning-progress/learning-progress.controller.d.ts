import { LearningProgressService } from './learning-progress.service';
import { StartProgressDto } from './dto/start-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { LogBlockInteractionDto } from './dto/log-block-interaction.dto';
export declare class LearningProgressController {
    private readonly learningProgressService;
    constructor(learningProgressService: LearningProgressService);
    logBlockInteraction(req: any, dto: LogBlockInteractionDto): Promise<{
        student_id: number;
        course_id: number;
        topic_id: number;
        resource_id: number | null;
        created_at: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        activity_type: import(".prisma/client").$Enums.ActivityType;
        activity_id: number;
    }>;
    getAIJourneyState(req: any, courseId: number, topicId: number): Promise<any>;
    saveAIJourneyState(req: any, courseId: number, topicId: number, state: any): Promise<{
        student_id: number;
        course_id: number;
        topic_id: number;
        resource_id: number | null;
        created_at: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        activity_type: import(".prisma/client").$Enums.ActivityType;
        activity_id: number;
    }>;
    getConceptPerformance(req: any, courseId?: string, topicId?: string): Promise<{
        concepts: {
            conceptTag: string;
            attempts: number;
            correct: number;
            accuracy: number;
            performance: string;
        }[];
    }>;
    startProgress(req: any, dto: StartProgressDto): Promise<{
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
    updateProgress(req: any, id: number, dto: UpdateProgressDto): Promise<{
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
    completeProgress(req: any, id: number): Promise<{
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
    getCourseProgress(req: any, courseId: number): Promise<number>;
    getTopicProgress(req: any, topicId: number): Promise<number>;
    getProgressByTopicResources(req: any, topicId: number): Promise<{
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
    getMyActivities(req: any): Promise<({
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
        student_id: number;
        course_id: number;
        topic_id: number;
        resource_id: number | null;
        created_at: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        activity_type: import(".prisma/client").$Enums.ActivityType;
        activity_id: number;
    })[]>;
}
