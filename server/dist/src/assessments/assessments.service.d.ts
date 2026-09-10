import { PrismaService } from '../prisma/prisma.service';
import { Neo4jService } from '../neo4j/neo4j.service';
export declare class AssessmentsService {
    private prisma;
    private neo4jService;
    constructor(prisma: PrismaService, neo4jService: Neo4jService);
    getAssessmentsByCourse(courseId: number, user: any): Promise<({
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
    })[]>;
    getAssessmentForStudent(assessmentId: number): Promise<{
        questions: ({
            question: {
                options: {
                    sequence_number: number;
                    option_text: string;
                    option_id: number;
                }[];
            } & {
                topic_id: number;
                status: import(".prisma/client").$Enums.QuestionStatus;
                created_at: Date;
                updated_at: Date;
                difficulty_level: import(".prisma/client").$Enums.QuestionDifficulty;
                created_by: number | null;
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
    }>;
    startAttempt(assessmentId: number, studentId: number): Promise<{
        student_id: number;
        status: import(".prisma/client").$Enums.AttemptStatus;
        started_at: Date;
        created_at: Date;
        assessment_id: number;
        attempt_id: number;
        attempt_number: number;
        expires_at: Date | null;
        submitted_at: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    submitAnswer(attemptId: number, studentId: number, questionId: number, selectedOptionId?: number, answerText?: string): Promise<{
        attempt_id: number;
        question_id: number;
        is_correct: boolean | null;
        answer_id: number;
        selected_option_id: number | null;
        answer_text: string | null;
        marks_obtained: import("@prisma/client/runtime/library").Decimal;
        answered_at: Date;
    }>;
    logSecurityEvent(attemptId: number, studentId: number, eventType: string, severity: 'LOW' | 'MEDIUM' | 'HIGH', metadata?: any): Promise<{
        attempt_id: number;
        event_type: string;
        severity: import(".prisma/client").$Enums.EventSeverity;
        event_time: Date;
        event_metadata: import("@prisma/client/runtime/library").JsonValue | null;
        event_id: number;
    }>;
    getAssessmentProfileForStudent(assessmentId: number, studentId: number): Promise<{
        student: {
            full_name: string;
        };
        assessment: {
            course: {
                title: string;
            };
        } & {
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
        student_id: number;
        status: import(".prisma/client").$Enums.AttemptStatus;
        started_at: Date;
        created_at: Date;
        assessment_id: number;
        attempt_id: number;
        attempt_number: number;
        expires_at: Date | null;
        submitted_at: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    submitAttempt(attemptId: number, studentId: number): Promise<{
        student_id: number;
        status: import(".prisma/client").$Enums.AttemptStatus;
        started_at: Date;
        created_at: Date;
        assessment_id: number;
        attempt_id: number;
        attempt_number: number;
        expires_at: Date | null;
        submitted_at: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    private syncStudentKnowledgeToNeo4j;
}
