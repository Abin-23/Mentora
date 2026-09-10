import { AdaptiveLearningService } from './adaptive-learning.service';
import { GeneratePathDto } from './dto/adaptive-learning.dto';
export declare class AdaptiveLearningController {
    private readonly adaptiveLearningService;
    constructor(adaptiveLearningService: AdaptiveLearningService);
    generatePath(studentId: number, courseId: number, dto: GeneratePathDto): Promise<{
        studentId: number;
        courseId: number;
        generatedAt: Date;
        recommendedTopics: {
            resources: {
                topic_id: number;
                resource_id: number;
                status: import(".prisma/client").$Enums.CourseStatus;
                created_at: Date;
                updated_at: Date;
                resource_title: string;
                description: string | null;
                resource_type: import(".prisma/client").$Enums.ResourceType;
                resource_key: string;
                thumbnail_key: string | null;
                file_size: bigint | null;
                duration_seconds: number | null;
                sequence_number: number;
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
    }>;
    getPath(studentId: number, courseId: number): Promise<{
        studentId: number;
        courseId: number;
        generatedAt: Date;
        recommendedTopics: {
            resources: {
                topic_id: number;
                resource_id: number;
                status: import(".prisma/client").$Enums.CourseStatus;
                created_at: Date;
                updated_at: Date;
                resource_title: string;
                description: string | null;
                resource_type: import(".prisma/client").$Enums.ResourceType;
                resource_key: string;
                thumbnail_key: string | null;
                file_size: bigint | null;
                duration_seconds: number | null;
                sequence_number: number;
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
    }>;
    getPersonalizedLesson(studentId: number, courseId: number, topicId: number): Promise<any>;
}
