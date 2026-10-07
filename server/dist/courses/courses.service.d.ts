import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AiGenerationService } from '../assessments/ai-generation.service';
import { Neo4jService } from '../neo4j/neo4j.service';
import { ResourcesService } from '../resources/resources.service';
export declare class CoursesService {
    private prisma;
    private aiGeneration;
    private neo4jService;
    private resourcesService;
    constructor(prisma: PrismaService, aiGeneration: AiGenerationService, neo4jService: Neo4jService, resourcesService: ResourcesService);
    private generateSlug;
    create(createCourseDto: CreateCourseDto, userId: number): Promise<{
        course_id: number;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        slug: string;
        category_id: number;
        course_admin_id: number;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
    }>;
    findAll(user: {
        user_id: number;
        role: string;
    }): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            category_name: string;
        };
        course_admin: {
            full_name: string;
            email: string;
        };
    } & {
        course_id: number;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        slug: string;
        category_id: number;
        course_admin_id: number;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
    })[]>;
    findByCategory(categorySlugOrId: string | number, userId?: number): Promise<{
        is_enrolled: boolean;
        course_admin: {
            full_name: string;
            email: string;
            profile_image: string | null;
        };
        course_id: number;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        slug: string;
        category_id: number;
        course_admin_id: number;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
    }[]>;
    findOne(idOrSlug: string | number, userId?: number): Promise<{
        is_enrolled: boolean;
        category: {
            category_name: string;
        };
        course_admin: {
            full_name: string;
            email: string;
            profile_image: string | null;
        };
        course_id: number;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        slug: string;
        category_id: number;
        course_admin_id: number;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
    }>;
    getCoursePlayerContent(idOrSlug: string | number, userId: number): Promise<{
        topics: never[];
        initial_assessment_pending: boolean;
        initial_assessment: {
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
        } | null;
        course_admin: {
            full_name: string;
            profile_image: string | null;
        };
        course_id: number;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        slug: string;
        category_id: number;
        course_admin_id: number;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
    } | {
        initial_assessment_pending: boolean;
        topics: ({
            resources: {
                description: string | null;
                status: import(".prisma/client").$Enums.CourseStatus;
                created_at: Date;
                updated_at: Date;
                topic_id: number;
                sequence_number: number;
                thumbnail_key: string | null;
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
        } & {
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
        })[];
        course_admin: {
            full_name: string;
            profile_image: string | null;
        };
        course_id: number;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        slug: string;
        category_id: number;
        course_admin_id: number;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
    }>;
    update(id: number, updateCourseDto: UpdateCourseDto, user: {
        user_id: number;
        role: string;
    }): Promise<{
        course_id: number;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        slug: string;
        category_id: number;
        course_admin_id: number;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
    }>;
    private syncCourseToNeo4j;
    remove(id: number, user: {
        user_id: number;
        role: string;
    }): Promise<{
        course_id: number;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        slug: string;
        category_id: number;
        course_admin_id: number;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
    }>;
}
