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
                status: import(".prisma/client").$Enums.CourseStatus;
                created_at: Date;
                description: string | null;
                updated_at: Date;
                thumbnail_key: string | null;
                topic_id: number;
                sequence_number: number;
                resource_title: string;
                resource_type: import(".prisma/client").$Enums.ResourceType;
                is_preview: boolean;
                duration_seconds: number | null;
                resource_id: number;
                resource_key: string;
                file_size: bigint | null;
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
                status: import(".prisma/client").$Enums.CourseStatus;
                created_at: Date;
                description: string | null;
                updated_at: Date;
                thumbnail_key: string | null;
                topic_id: number;
                sequence_number: number;
                resource_title: string;
                resource_type: import(".prisma/client").$Enums.ResourceType;
                is_preview: boolean;
                duration_seconds: number | null;
                resource_id: number;
                resource_key: string;
                file_size: bigint | null;
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
}
