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
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        description: string;
        thumbnail_key: string | null;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        title: string;
        category_id: number;
        short_description: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        course_admin_id: number;
    }>;
    findAll(user: {
        user_id: number;
        role: string;
    }): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            category_name: string;
        };
        course_admin: {
            email: string;
            full_name: string;
        };
    } & {
        course_id: number;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        description: string;
        thumbnail_key: string | null;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        title: string;
        category_id: number;
        short_description: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        course_admin_id: number;
    })[]>;
    findByCategory(categorySlugOrId: string | number, userId?: number): Promise<{
        is_enrolled: boolean;
        course_admin: {
            email: string;
            full_name: string;
            profile_image: string | null;
        };
        course_id: number;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        description: string;
        thumbnail_key: string | null;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        title: string;
        category_id: number;
        short_description: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        course_admin_id: number;
    }[]>;
    findOne(idOrSlug: string | number, userId?: number): Promise<{
        is_enrolled: boolean;
        category: {
            category_name: string;
        };
        course_admin: {
            email: string;
            full_name: string;
            profile_image: string | null;
        };
        course_id: number;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        description: string;
        thumbnail_key: string | null;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        title: string;
        category_id: number;
        short_description: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        course_admin_id: number;
    }>;
    getCoursePlayerContent(idOrSlug: string | number, userId: number): Promise<{
        topics: never[];
        initial_assessment_pending: boolean;
        initial_assessment: {
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
        } | null;
        course_admin: {
            full_name: string;
            profile_image: string | null;
        };
        course_id: number;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        description: string;
        thumbnail_key: string | null;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        title: string;
        category_id: number;
        short_description: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        course_admin_id: number;
    } | {
        initial_assessment_pending: boolean;
        topics: ({
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
        } & {
            course_id: number;
            topic_id: number;
            status: import(".prisma/client").$Enums.CourseStatus;
            created_at: Date;
            updated_at: Date;
            sequence_number: number;
            topic_title: string;
            topic_description: string | null;
            learning_objectives: string;
            difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
            estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
        })[];
        course_admin: {
            full_name: string;
            profile_image: string | null;
        };
        course_id: number;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        description: string;
        thumbnail_key: string | null;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        title: string;
        category_id: number;
        short_description: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        course_admin_id: number;
    }>;
    update(id: number, updateCourseDto: UpdateCourseDto, user: {
        user_id: number;
        role: string;
    }): Promise<{
        course_id: number;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        description: string;
        thumbnail_key: string | null;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        title: string;
        category_id: number;
        short_description: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        course_admin_id: number;
    }>;
    private syncCourseToNeo4j;
    remove(id: number, user: {
        user_id: number;
        role: string;
    }): Promise<{
        course_id: number;
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        updated_at: Date;
        description: string;
        thumbnail_key: string | null;
        learning_objectives: string;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        title: string;
        category_id: number;
        short_description: string;
        prerequisites: string | null;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        course_admin_id: number;
    }>;
}
