import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        provider: string | null;
        provider_id: string | null;
        teaching_preference: import(".prisma/client").$Enums.TeachingPreference;
    }>;
    getAdminStats(req: any): Promise<{
        isSystemAdmin: boolean;
        totalUsers: number;
        totalStudents: number;
        totalAdmins: number;
        totalCourses: number;
        publishedCourses: number;
        totalCategories: number;
        totalEnrollments: number;
        totalRevenue: number;
        totalCertificates: number;
        recentEnrollments: ({
            user: {
                email: string;
                full_name: string;
                profile_image: string | null;
            };
            course: {
                title: string;
                slug: string;
            };
        } & {
            user_id: number;
            created_at: Date;
            course_id: number;
            updated_at: Date;
            enrollment_id: number;
            purchase_id: number | null;
            enrollment_status: import(".prisma/client").$Enums.EnrollmentStatus;
            enrolled_at: Date;
            completed_at: Date | null;
        })[];
        recentCourses: ({
            category: {
                category_name: string;
            };
            course_admin: {
                full_name: string;
            };
        } & {
            status: import(".prisma/client").$Enums.CourseStatus;
            created_at: Date;
            course_admin_id: number;
            course_id: number;
            category_id: number;
            title: string;
            slug: string;
            short_description: string;
            description: string;
            learning_objectives: string;
            prerequisites: string | null;
            difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
            language: string;
            duration_hours: import("@prisma/client/runtime/library").Decimal | null;
            price: import("@prisma/client/runtime/library").Decimal;
            thumbnail_key: string | null;
            updated_at: Date;
        })[];
        recentUsers: never[] | {
            email: string;
            full_name: string;
            user_id: number;
            role: import(".prisma/client").$Enums.Role;
            status: import(".prisma/client").$Enums.Status;
            created_at: Date;
        }[];
    }>;
    updateProfile(req: any, updateDto: UpdateProfileDto): Promise<{
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        provider: string | null;
        provider_id: string | null;
        teaching_preference: import(".prisma/client").$Enums.TeachingPreference;
    }>;
    changePassword(req: any, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    uploadProfilePicture(req: any, file: Express.Multer.File): Promise<{
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        provider: string | null;
        provider_id: string | null;
        teaching_preference: import(".prisma/client").$Enums.TeachingPreference;
    }>;
    removeProfilePicture(req: any): Promise<{
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        provider: string | null;
        provider_id: string | null;
        teaching_preference: import(".prisma/client").$Enums.TeachingPreference;
    }>;
    getAllUsers(role?: Role): Promise<{
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        provider: string | null;
        provider_id: string | null;
        teaching_preference: import(".prisma/client").$Enums.TeachingPreference;
    }[]>;
    updateUserStatus(id: number, dto: UpdateStatusDto): Promise<{
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        provider: string | null;
        provider_id: string | null;
        teaching_preference: import(".prisma/client").$Enums.TeachingPreference;
    }>;
    createCourseAdmin(dto: CreateAdminDto, req: any): Promise<{
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        provider: string | null;
        provider_id: string | null;
        teaching_preference: import(".prisma/client").$Enums.TeachingPreference;
    }>;
}
