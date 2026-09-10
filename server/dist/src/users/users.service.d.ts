import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Role } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { CreateAdminDto } from './dto/create-admin.dto';
export declare class UsersService {
    private prisma;
    private mailService;
    private s3Client;
    constructor(prisma: PrismaService, mailService: MailService);
    getProfile(userId: number): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        provider: string | null;
        provider_id: string | null;
    }>;
    updateProfile(userId: number, updateDto: UpdateProfileDto): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        provider: string | null;
        provider_id: string | null;
    }>;
    changePassword(userId: number, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    private deleteS3ObjectIfMatches;
    uploadProfilePicture(userId: number, file: Express.Multer.File): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        provider: string | null;
        provider_id: string | null;
    }>;
    removeProfilePicture(userId: number): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        provider: string | null;
        provider_id: string | null;
    }>;
    getAllUsers(role?: Role): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        provider: string | null;
        provider_id: string | null;
    }[]>;
    updateUserStatus(userId: number, dto: UpdateStatusDto): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        provider: string | null;
        provider_id: string | null;
    }>;
    createCourseAdmin(dto: CreateAdminDto): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        provider: string | null;
        provider_id: string | null;
    }>;
}
