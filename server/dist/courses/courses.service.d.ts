import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class CoursesService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findOne(idOrSlug: number | string, userId?: number): Promise<{
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
    getCoursePlayerContent(idOrSlug: number | string, userId: number): Promise<{
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
                sequence_number: number;
                topic_id: number;
                resource_id: number;
                resource_title: string;
                resource_type: import(".prisma/client").$Enums.ResourceType;
                resource_key: string;
                file_size: bigint | null;
                duration_seconds: number | null;
                is_preview: boolean;
                uploaded_by: number;
            }[];
        } & {
            status: import(".prisma/client").$Enums.CourseStatus;
            created_at: Date;
            updated_at: Date;
            learning_objectives: string;
            difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
            course_id: number;
            sequence_number: number;
            topic_id: number;
            topic_title: string;
            topic_description: string | null;
            estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
        })[];
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
