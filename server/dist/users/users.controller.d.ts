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
    createCourseAdmin(dto: CreateAdminDto): Promise<{
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
