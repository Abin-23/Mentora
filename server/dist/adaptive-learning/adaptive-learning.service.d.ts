import { Neo4jService } from '../neo4j/neo4j.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import { LearningProgressService } from '../learning-progress/learning-progress.service';
import { KnowledgeState } from './engine';
import { GeneratePathDto } from './dto/adaptive-learning.dto';
import { VisualResourcesService } from '../visual-resources/visual-resources.service';
export declare class AdaptiveLearningService {
    private readonly neo4jService;
    private readonly prisma;
    private readonly resourcesService;
    private readonly learningProgressService;
    private readonly visualResourcesService;
    constructor(neo4jService: Neo4jService, prisma: PrismaService, resourcesService: ResourcesService, learningProgressService: LearningProgressService, visualResourcesService: VisualResourcesService);
    generatePath(studentId: number, courseId: number, dto?: GeneratePathDto): Promise<{
        studentId: number;
        courseId: number;
        generatedAt: Date;
        recommendedTopics: {
            resources: {
                status: import(".prisma/client").$Enums.CourseStatus;
                created_at: Date;
                description: string | null;
                updated_at: Date;
                thumbnail_key: string | null;
                topic_id: number;
                sequence_number: number;
                resource_id: number;
                resource_title: string;
                resource_type: import(".prisma/client").$Enums.ResourceType;
                resource_key: string;
                file_size: bigint | null;
                duration_seconds: number | null;
                is_preview: boolean;
                is_ai_source: boolean;
                uploaded_by: number;
            }[];
            reason: string;
            extendedReason?: string;
            knowledgeScore: number;
            proficiency: string;
            priorityScore: number;
            topicId: number;
            title: string;
            sequenceNumber: number;
            difficulty?: string;
        }[];
        knowledgeStates: {
            [k: string]: KnowledgeState;
        };
    }>;
    generatePersonalizedLesson(studentId: number, courseId: number, topicId: number): Promise<{
        lesson: string;
        sources: never[];
        noAiSources: boolean;
    } | {
        lesson: any;
        sources: any;
        noAiSources?: undefined;
    }>;
    getDiagnostics(studentId: number, courseId: number, topicId: number): Promise<{
        studentId: number;
        courseId: number;
        topicId: number;
        diagnostics: {
            topicProficiency: {
                level: string;
                score: number;
            };
            conceptPerformance: any;
            targetedRetrieval: {
                used: boolean;
                priorityConceptsPassedToLLM: string[];
                weakConcepts: string[];
                developingConcepts: string[];
            };
            recentInteractions: any[];
            adaptiveRouting: {
                inferredCurrentStage: string;
                lastInteractionResult: string;
                retryRequired: boolean;
            };
        };
    }>;
    getStudentDashboard(studentId: number, courseId: number): Promise<{
        courseProgress: {
            enrolled: boolean;
            completedTopics: number;
            totalTopics: number;
            progressPercentage: number;
        };
        topicMastery: {
            topic_id: number;
            title: any;
            proficiency: any;
            score: number | null;
            attemptCount: number;
            lastAssessmentAt: Date | null;
        }[];
        strengths: any[];
        areasToImprove: any[];
        assessmentHistory: {
            date: Date | null;
            score: number | null;
            title: string;
            type: import(".prisma/client").$Enums.AssessmentType;
        }[];
        learningActivity: {
            date: Date;
            type: import(".prisma/client").$Enums.ActivityType;
            description: string;
        }[];
        knowledgeGrowth: {
            date: Date | null;
            score: number;
            topic: string;
        }[];
        currentRecommendation: {
            resources: {
                status: import(".prisma/client").$Enums.CourseStatus;
                created_at: Date;
                description: string | null;
                updated_at: Date;
                thumbnail_key: string | null;
                topic_id: number;
                sequence_number: number;
                resource_id: number;
                resource_title: string;
                resource_type: import(".prisma/client").$Enums.ResourceType;
                resource_key: string;
                file_size: bigint | null;
                duration_seconds: number | null;
                is_preview: boolean;
                is_ai_source: boolean;
                uploaded_by: number;
            }[];
            reason: string;
            extendedReason?: string;
            knowledgeScore: number;
            proficiency: string;
            priorityScore: number;
            topicId: number;
            title: string;
            sequenceNumber: number;
            difficulty?: string;
        } | null;
        recentInsights: any[];
    }>;
    getStudentGoals(studentId: number, courseId: number): Promise<{
        currentValue: any;
        targetValue: any;
        progressMessage: string;
        progressPercentage: number;
        isCompleted: boolean;
        target_topic: {
            status: import(".prisma/client").$Enums.CourseStatus;
            created_at: Date;
            updated_at: Date;
            learning_objectives: string;
            difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
            course_id: number;
            topic_id: number;
            topic_title: string;
            topic_description: string | null;
            estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
            sequence_number: number;
        } | null;
        status: import(".prisma/client").$Enums.GoalStatus;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        student_id: number;
        goal_id: number;
        goal_type: import(".prisma/client").$Enums.GoalType;
        target_value: number | null;
        target_topic_id: number | null;
        target_proficiency: import(".prisma/client").$Enums.ProficiencyLevel | null;
    }[]>;
    createStudentGoal(studentId: number, courseId: number, body: any): Promise<{
        status: import(".prisma/client").$Enums.GoalStatus;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        student_id: number;
        goal_id: number;
        goal_type: import(".prisma/client").$Enums.GoalType;
        target_value: number | null;
        target_topic_id: number | null;
        target_proficiency: import(".prisma/client").$Enums.ProficiencyLevel | null;
    }>;
    askTutor(studentId: number, courseId: number, body: any): Promise<any>;
}
