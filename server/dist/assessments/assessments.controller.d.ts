import { AssessmentsService } from './assessments.service';
import { AiGenerationService } from './ai-generation.service';
export declare class AssessmentsController {
    private readonly assessmentsService;
    private readonly aiGenerationService;
    constructor(assessmentsService: AssessmentsService, aiGenerationService: AiGenerationService);
    generateTopicAssessment(courseId: number, topicId: number, req: any): Promise<{
        assessment_id: number;
        course_id: number;
        title: string;
        description: string | null;
        assessment_type: import(".prisma/client").$Enums.AssessmentType;
        created_by: number | null;
        is_system_generated: boolean;
        duration_minutes: number | null;
        total_questions: number;
        passing_percentage: import("@prisma/client/runtime/library").Decimal | null;
        max_attempts: number;
        status: import(".prisma/client").$Enums.AssessmentStatus;
        created_at: Date;
        updated_at: Date;
    } | null>;
    getByCourse(courseId: number, req: any): Promise<({
        topics: ({
            topic: {
                topic_title: string;
            };
        } & {
            assessment_id: number;
            topic_id: number;
            question_count: number;
        })[];
        attempts: {
            status: import(".prisma/client").$Enums.AttemptStatus;
            attempt_number: number;
            score: import("@prisma/client/runtime/library").Decimal | null;
            percentage: import("@prisma/client/runtime/library").Decimal | null;
        }[];
    } & {
        assessment_id: number;
        course_id: number;
        title: string;
        description: string | null;
        assessment_type: import(".prisma/client").$Enums.AssessmentType;
        created_by: number | null;
        is_system_generated: boolean;
        duration_minutes: number | null;
        total_questions: number;
        passing_percentage: import("@prisma/client/runtime/library").Decimal | null;
        max_attempts: number;
        status: import(".prisma/client").$Enums.AssessmentStatus;
        created_at: Date;
        updated_at: Date;
    })[]>;
    getProfile(id: number, req: any): Promise<{
        assessment: {
            course: {
                title: string;
            };
        } & {
            assessment_id: number;
            course_id: number;
            title: string;
            description: string | null;
            assessment_type: import(".prisma/client").$Enums.AssessmentType;
            created_by: number | null;
            is_system_generated: boolean;
            duration_minutes: number | null;
            total_questions: number;
            passing_percentage: import("@prisma/client/runtime/library").Decimal | null;
            max_attempts: number;
            status: import(".prisma/client").$Enums.AssessmentStatus;
            created_at: Date;
            updated_at: Date;
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
            topic_result_id: number;
            questions_attempted: number;
            correct_answers: number;
            proficiency_level: import(".prisma/client").$Enums.ProficiencyLevel;
        })[];
    } & {
        assessment_id: number;
        status: import(".prisma/client").$Enums.AttemptStatus;
        created_at: Date;
        student_id: number;
        attempt_id: number;
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
                created_by: number | null;
                status: import(".prisma/client").$Enums.QuestionStatus;
                created_at: Date;
                updated_at: Date;
                topic_id: number;
                question_id: number;
                question_text: string;
                question_type: import(".prisma/client").$Enums.QuestionType;
                difficulty_level: import(".prisma/client").$Enums.QuestionDifficulty;
                explanation: string | null;
                source_resource_id: number | null;
                generation_method: import(".prisma/client").$Enums.GenerationMethod;
            };
        } & {
            assessment_id: number;
            question_id: number;
            sequence_number: number;
            marks: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        assessment_id: number;
        course_id: number;
        title: string;
        description: string | null;
        assessment_type: import(".prisma/client").$Enums.AssessmentType;
        created_by: number | null;
        is_system_generated: boolean;
        duration_minutes: number | null;
        total_questions: number;
        passing_percentage: import("@prisma/client/runtime/library").Decimal | null;
        max_attempts: number;
        status: import(".prisma/client").$Enums.AssessmentStatus;
        created_at: Date;
        updated_at: Date;
    }>;
    getCurrentAttempt(id: number, req: any): Promise<{
        warningCount: number;
        security_events: {
            attempt_id: number;
            event_id: number;
            event_type: string;
            severity: import(".prisma/client").$Enums.EventSeverity;
            event_time: Date;
            event_metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        assessment_id: number;
        status: import(".prisma/client").$Enums.AttemptStatus;
        created_at: Date;
        student_id: number;
        attempt_id: number;
        attempt_number: number;
        started_at: Date;
        expires_at: Date | null;
        submitted_at: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    } | null>;
    startAttempt(id: number, req: any): Promise<{
        assessment_id: number;
        status: import(".prisma/client").$Enums.AttemptStatus;
        created_at: Date;
        student_id: number;
        attempt_id: number;
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
        attempt_id: number;
        answered_at: Date;
        answer_id: number;
        selected_option_id: number | null;
        answer_text: string | null;
        is_correct: boolean | null;
        marks_obtained: import("@prisma/client/runtime/library").Decimal;
    }>;
    getNextQuestion(attemptId: number, req: any): Promise<{
        options: {
            sequence_number: number;
            option_text: string;
            option_id: number;
        }[];
    } & {
        created_by: number | null;
        status: import(".prisma/client").$Enums.QuestionStatus;
        created_at: Date;
        updated_at: Date;
        topic_id: number;
        question_id: number;
        question_text: string;
        question_type: import(".prisma/client").$Enums.QuestionType;
        difficulty_level: import(".prisma/client").$Enums.QuestionDifficulty;
        explanation: string | null;
        source_resource_id: number | null;
        generation_method: import(".prisma/client").$Enums.GenerationMethod;
    }>;
    logSecurityEvent(attemptId: number, body: {
        eventType: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        metadata?: any;
    }, req: any): Promise<{
        warningCount: number;
        event: {
            attempt_id: number;
            event_id: number;
            event_type: string;
            severity: import(".prisma/client").$Enums.EventSeverity;
            event_time: Date;
            event_metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
        terminated: boolean;
    }>;
    submitAttempt(attemptId: number, req: any): Promise<({
        assessment: {
            questions: ({
                question: {
                    topic: {
                        course_id: number;
                        status: import(".prisma/client").$Enums.CourseStatus;
                        created_at: Date;
                        updated_at: Date;
                        topic_id: number;
                        sequence_number: number;
                        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
                        learning_objectives: string;
                        topic_title: string;
                        topic_description: string | null;
                        estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
                    };
                } & {
                    created_by: number | null;
                    status: import(".prisma/client").$Enums.QuestionStatus;
                    created_at: Date;
                    updated_at: Date;
                    topic_id: number;
                    question_id: number;
                    question_text: string;
                    question_type: import(".prisma/client").$Enums.QuestionType;
                    difficulty_level: import(".prisma/client").$Enums.QuestionDifficulty;
                    explanation: string | null;
                    source_resource_id: number | null;
                    generation_method: import(".prisma/client").$Enums.GenerationMethod;
                };
            } & {
                assessment_id: number;
                question_id: number;
                sequence_number: number;
                marks: import("@prisma/client/runtime/library").Decimal;
            })[];
        } & {
            assessment_id: number;
            course_id: number;
            title: string;
            description: string | null;
            assessment_type: import(".prisma/client").$Enums.AssessmentType;
            created_by: number | null;
            is_system_generated: boolean;
            duration_minutes: number | null;
            total_questions: number;
            passing_percentage: import("@prisma/client/runtime/library").Decimal | null;
            max_attempts: number;
            status: import(".prisma/client").$Enums.AssessmentStatus;
            created_at: Date;
            updated_at: Date;
        };
        answers: ({
            question: {
                options: {
                    created_at: Date;
                    question_id: number;
                    sequence_number: number;
                    is_correct: boolean;
                    option_text: string;
                    option_id: number;
                }[];
            } & {
                created_by: number | null;
                status: import(".prisma/client").$Enums.QuestionStatus;
                created_at: Date;
                updated_at: Date;
                topic_id: number;
                question_id: number;
                question_text: string;
                question_type: import(".prisma/client").$Enums.QuestionType;
                difficulty_level: import(".prisma/client").$Enums.QuestionDifficulty;
                explanation: string | null;
                source_resource_id: number | null;
                generation_method: import(".prisma/client").$Enums.GenerationMethod;
            };
        } & {
            question_id: number;
            attempt_id: number;
            answered_at: Date;
            answer_id: number;
            selected_option_id: number | null;
            answer_text: string | null;
            is_correct: boolean | null;
            marks_obtained: import("@prisma/client/runtime/library").Decimal;
        })[];
        security_events: {
            attempt_id: number;
            event_id: number;
            event_type: string;
            severity: import(".prisma/client").$Enums.EventSeverity;
            event_time: Date;
            event_metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    } & {
        assessment_id: number;
        status: import(".prisma/client").$Enums.AttemptStatus;
        created_at: Date;
        student_id: number;
        attempt_id: number;
        attempt_number: number;
        started_at: Date;
        expires_at: Date | null;
        submitted_at: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    }) | {
        attempt: {
            assessment_id: number;
            status: import(".prisma/client").$Enums.AttemptStatus;
            created_at: Date;
            student_id: number;
            attempt_id: number;
            attempt_number: number;
            started_at: Date;
            expires_at: Date | null;
            submitted_at: Date | null;
            score: import("@prisma/client/runtime/library").Decimal | null;
            percentage: import("@prisma/client/runtime/library").Decimal | null;
        };
        analysis: {
            overallScore: number;
            neo4jSyncSuccess: boolean;
            topicPerformance: {
                attempted: number;
                correct: number;
                marks: number;
                max: number;
            }[];
            strengths: {
                topic_id: number;
                title: string;
                percentage: number;
                proficiency: string;
            }[];
            weaknesses: {
                topic_id: number;
                title: string;
                percentage: number;
                proficiency: string;
            }[];
        };
    }>;
}
