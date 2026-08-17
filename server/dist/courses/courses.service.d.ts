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
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        description: string;
        category_id: number;
        updated_at: Date;
        title: string;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
        course_id: number;
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
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        description: string;
        category_id: number;
        updated_at: Date;
        title: string;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
        course_id: number;
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
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        description: string;
        category_id: number;
        updated_at: Date;
        title: string;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
        course_id: number;
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
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        description: string;
        category_id: number;
        updated_at: Date;
        title: string;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
        course_id: number;
        slug: string;
        course_admin_id: number;
    }>;
    getCoursePlayerContent(idOrSlug: string | number, userId: number): Promise<{
        topics: never[];
        initial_assessment_pending: boolean;
        initial_assessment: {
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
        } | null;
        course_admin: {
            full_name: string;
            profile_image: string | null;
        };
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        description: string;
        category_id: number;
        updated_at: Date;
        title: string;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
        course_id: number;
        slug: string;
        course_admin_id: number;
    } | {
        initial_assessment_pending: boolean;
        course_admin: {
            full_name: string;
            profile_image: string | null;
        };
        topics: ({
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
        } & {
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
        })[];
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        description: string;
        category_id: number;
        updated_at: Date;
        title: string;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
        course_id: number;
        slug: string;
        course_admin_id: number;
    }>;
    update(id: number, updateCourseDto: UpdateCourseDto, user: {
        user_id: number;
        role: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        description: string;
        category_id: number;
        updated_at: Date;
        title: string;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
        course_id: number;
        slug: string;
        course_admin_id: number;
    }>;
    private syncCourseToNeo4j;
    remove(id: number, user: {
        user_id: number;
        role: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.CourseStatus;
        created_at: Date;
        description: string;
        category_id: number;
        updated_at: Date;
        title: string;
        short_description: string;
        learning_objectives: string;
        prerequisites: string | null;
        difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
        language: string;
        duration_hours: import("@prisma/client/runtime/library").Decimal | null;
        price: import("@prisma/client/runtime/library").Decimal;
        thumbnail_key: string | null;
        course_id: number;
        slug: string;
        course_admin_id: number;
    }>;
}
