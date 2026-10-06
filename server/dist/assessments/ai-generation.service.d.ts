import { PrismaService } from '../prisma/prisma.service';
import { Neo4jService } from '../neo4j/neo4j.service';
export declare class AiGenerationService {
    private prisma;
    private neo4jService;
    private readonly logger;
    private ai;
    constructor(prisma: PrismaService, neo4jService: Neo4jService);
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
    generateSingleAdaptiveQuestion(courseId: number, topicId: number, difficulty: string, existingQuestionTexts: string[]): Promise<any>;
    generateNextAdaptiveQuestion(attemptId: number, studentId: number): Promise<{
        options: {
            sequence_number: number;
            option_text: string;
            option_id: number;
        }[];
    } & {
        status: import(".prisma/client").$Enums.QuestionStatus;
        created_at: Date;
        created_by: number | null;
        updated_at: Date;
        difficulty_level: import(".prisma/client").$Enums.QuestionDifficulty;
        topic_id: number;
        question_id: number;
        question_text: string;
        question_type: import(".prisma/client").$Enums.QuestionType;
        explanation: string | null;
        source_resource_id: number | null;
        generation_method: import(".prisma/client").$Enums.GenerationMethod;
    }>;
}
