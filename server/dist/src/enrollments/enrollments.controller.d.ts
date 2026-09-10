import { EnrollmentsService } from './enrollments.service';
export declare class EnrollmentsController {
    private readonly enrollmentsService;
    constructor(enrollmentsService: EnrollmentsService);
    freeEnrollment(req: any, courseId: number): Promise<{
        success: boolean;
        message: string;
        enrollment: {
            course_id: number;
            completed_at: Date | null;
            created_at: Date;
            updated_at: Date;
            user_id: number;
            enrollment_id: number;
            purchase_id: number | null;
            enrollment_status: import(".prisma/client").$Enums.EnrollmentStatus;
            enrolled_at: Date;
        };
    }>;
    getMyEnrollments(req: any): Promise<({
        course: {
            category: {
                status: import(".prisma/client").$Enums.Status;
                created_at: Date;
                updated_at: Date;
                description: string | null;
                created_by: number;
                category_name: string;
                icon: string | null;
                category_id: number;
            };
            course_admin: {
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
        };
    } & {
        course_id: number;
        completed_at: Date | null;
        created_at: Date;
        updated_at: Date;
        user_id: number;
        enrollment_id: number;
        purchase_id: number | null;
        enrollment_status: import(".prisma/client").$Enums.EnrollmentStatus;
        enrolled_at: Date;
    })[]>;
}
