import { EnrollmentsService } from './enrollments.service';
export declare class EnrollmentsController {
    private readonly enrollmentsService;
    constructor(enrollmentsService: EnrollmentsService);
    freeEnrollment(req: any, courseId: number): Promise<{
        success: boolean;
        message: string;
        enrollment: {
            user_id: number;
            created_at: Date;
            updated_at: Date;
            course_id: number;
            enrollment_id: number;
            purchase_id: number | null;
            enrollment_status: import(".prisma/client").$Enums.EnrollmentStatus;
            enrolled_at: Date;
            completed_at: Date | null;
        };
    }>;
    getMyEnrollments(req: any): Promise<({
        course: {
            category: {
                status: import(".prisma/client").$Enums.Status;
                created_at: Date;
                category_name: string;
                description: string | null;
                icon: string | null;
                category_id: number;
                created_by: number;
                updated_at: Date;
            };
            course_admin: {
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
        };
    } & {
        user_id: number;
        created_at: Date;
        updated_at: Date;
        course_id: number;
        enrollment_id: number;
        purchase_id: number | null;
        enrollment_status: import(".prisma/client").$Enums.EnrollmentStatus;
        enrolled_at: Date;
        completed_at: Date | null;
    })[]>;
}
