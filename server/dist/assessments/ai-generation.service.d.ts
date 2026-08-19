import { PrismaService } from '../prisma/prisma.service';
export declare class AiGenerationService {
    private prisma;
    private readonly logger;
    private ai;
    constructor(prisma: PrismaService);
    generateInitialAssessment(courseId: number): Promise<void>;
    generateTopicAssessment(courseId: number, topicId: number, studentId: number): Promise<{
        status: import(".prisma/client").$Enums.AssessmentStatus;
        created_at: Date;
        description: string | null;
        created_by: number | null;
        updated_at: Date;
        title: string;
        course_id: number;
        assessment_id: number;
        assessment_type: import(".prisma/client").$Enums.AssessmentType;
        is_system_generated: boolean;
        duration_minutes: number | null;
        total_questions: number;
        passing_percentage: import("@prisma/client/runtime/library").Decimal | null;
        max_attempts: number;
    } | null>;
}
