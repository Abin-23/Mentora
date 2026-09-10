import { Neo4jService } from '../neo4j/neo4j.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import { GeneratePathDto } from './dto/adaptive-learning.dto';
export declare class AdaptiveLearningService {
    private readonly neo4jService;
    private readonly prisma;
    private readonly resourcesService;
    constructor(neo4jService: Neo4jService, prisma: PrismaService, resourcesService: ResourcesService);
    generatePath(studentId: number, courseId: number, dto?: GeneratePathDto): Promise<{
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
    generatePersonalizedLesson(studentId: number, courseId: number, topicId: number): Promise<any>;
}
