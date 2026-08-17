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
