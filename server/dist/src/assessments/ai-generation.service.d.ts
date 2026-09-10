import { PrismaService } from '../prisma/prisma.service';
export declare class AiGenerationService {
    private prisma;
    private readonly logger;
    private ai;
    constructor(prisma: PrismaService);
    generateInitialAssessment(courseId: number): Promise<void>;
    generateTopicAssessment(courseId: number, topicId: number, studentId: number): Promise<{
        course_id: number;
        status: import(".prisma/client").$Enums.AssessmentStatus;
        created_at: Date;
        updated_at: Date;
        description: string | null;
        assessment_id: number;
        title: string;
        assessment_type: import(".prisma/client").$Enums.AssessmentType;
        created_by: number | null;
        is_system_generated: boolean;
        duration_minutes: number | null;
        total_questions: number;
        passing_percentage: import("@prisma/client/runtime/library").Decimal | null;
        max_attempts: number;
    } | null>;
}
