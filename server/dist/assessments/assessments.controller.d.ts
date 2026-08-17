import { AssessmentsService } from './assessments.service';
import { AiGenerationService } from './ai-generation.service';
export declare class AssessmentsController {
    private readonly assessmentsService;
    private readonly aiGenerationService;
    constructor(assessmentsService: AssessmentsService, aiGenerationService: AiGenerationService);
    generateTopicAssessment(courseId: number, topicId: number): Promise<{
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
    getByCourse(courseId: number, req: any): Promise<({
        topics: ({
            topic: {
                topic_title: string;
            };
        } & {
            topic_id: number;
            assessment_id: number;
            question_count: number;
        })[];
        attempts: {
            status: import(".prisma/client").$Enums.AttemptStatus;
            attempt_number: number;
            score: import("@prisma/client/runtime/library").Decimal | null;
            percentage: import("@prisma/client/runtime/library").Decimal | null;
        }[];
    } & {
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
    })[]>;
    getProfile(id: number, req: any): Promise<{
        assessment: {
            course: {
                title: string;
            };
        } & {
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
        };
        student: {
            full_name: string;
        };
        topic_results: ({
            topic: {
                topic_title: string;
            };
        } & {
            topic_id: number;
            attempt_id: number;
            percentage: import("@prisma/client/runtime/library").Decimal;
            marks_obtained: import("@prisma/client/runtime/library").Decimal;
            questions_attempted: number;
            correct_answers: number;
            proficiency_level: import(".prisma/client").$Enums.ProficiencyLevel;
            topic_result_id: number;
        })[];
    } & {
        status: import(".prisma/client").$Enums.AttemptStatus;
        created_at: Date;
        assessment_id: number;
        attempt_id: number;
        student_id: number;
        attempt_number: number;
        started_at: Date;
        expires_at: Date | null;
        submitted_at: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    getOne(id: number): Promise<{
        questions: ({
            question: {
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
                question_text: string;
                question_type: import(".prisma/client").$Enums.QuestionType;
                explanation: string | null;
                generation_method: import(".prisma/client").$Enums.GenerationMethod;
                question_id: number;
                source_resource_id: number | null;
            };
        } & {
            sequence_number: number;
            assessment_id: number;
            question_id: number;
            marks: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
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
    }>;
    startAttempt(id: number, req: any): Promise<{
        status: import(".prisma/client").$Enums.AttemptStatus;
        created_at: Date;
        assessment_id: number;
        attempt_id: number;
        student_id: number;
        attempt_number: number;
        started_at: Date;
        expires_at: Date | null;
        submitted_at: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    submitAnswer(attemptId: number, body: {
        questionId: number;
        selectedOptionId?: number;
        answerText?: string;
    }, req: any): Promise<{
        question_id: number;
        is_correct: boolean | null;
        attempt_id: number;
        answer_id: number;
        selected_option_id: number | null;
        answer_text: string | null;
        marks_obtained: import("@prisma/client/runtime/library").Decimal;
        answered_at: Date;
    }>;
    logSecurityEvent(attemptId: number, body: {
        eventType: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        metadata?: any;
    }, req: any): Promise<{
        attempt_id: number;
        event_type: string;
        severity: import(".prisma/client").$Enums.EventSeverity;
        event_time: Date;
        event_metadata: import("@prisma/client/runtime/library").JsonValue | null;
        event_id: number;
    }>;
    submitAttempt(attemptId: number, req: any): Promise<{
        status: import(".prisma/client").$Enums.AttemptStatus;
        created_at: Date;
        assessment_id: number;
        attempt_id: number;
        student_id: number;
        attempt_number: number;
        started_at: Date;
        expires_at: Date | null;
        submitted_at: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
