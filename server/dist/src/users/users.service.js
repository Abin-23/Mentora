"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const path = __importStar(require("path"));
const mail_service_1 = require("../mail/mail.service");
let UsersService = class UsersService {
    prisma;
    mailService;
    s3Client;
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'ap-south-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { user_id: userId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const { password, reset_token, reset_token_expires, ...result } = user;
        return result;
    }
    async updateProfile(userId, updateDto) {
        try {
            const user = await this.prisma.user.update({
                where: { user_id: userId },
                data: updateDto,
            });
            const { password, reset_token, reset_token_expires, ...result } = user;
            return result;
        }
        catch (error) {
            if (error.code === 'P2002' && error.meta?.target?.includes('phone')) {
                throw new common_1.ConflictException('Phone number is already associated with another account');
            }
            throw error;
        }
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { user_id: userId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.provider !== 'local' || !user.password) {
            throw new common_1.BadRequestException('Cannot change password for OAuth accounts.');
        }
        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid current password');
        }
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { user_id: userId },
            data: { password: hashedPassword },
        });
        return { message: 'Password updated successfully' };
    }
    async deleteS3ObjectIfMatches(fileUrl) {
        const bucketName = process.env.AWS_BUCKET_NAME;
        const region = process.env.AWS_REGION || 'ap-south-1';
        if (!bucketName)
            return;
        const s3Domain = `https://${bucketName}.s3.${region}.amazonaws.com/`;
        if (fileUrl.startsWith(s3Domain)) {
            const key = fileUrl.replace(s3Domain, '');
            try {
                await this.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: bucketName, Key: key }));
            }
            catch (err) {
                console.error('Failed to delete old profile picture from S3', err);
            }
        }
    }
    async uploadProfilePicture(userId, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const user = await this.prisma.user.findUnique({
            where: { user_id: userId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.profile_image) {
            await this.deleteS3ObjectIfMatches(user.profile_image);
        }
        const ext = path.extname(file.originalname);
        const filename = `profiles/${userId}-${crypto.randomUUID()}${ext}`;
        const bucketName = process.env.AWS_BUCKET_NAME;
        if (!bucketName) {
            throw new Error('AWS_BUCKET_NAME is not configured');
        }
        await this.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
        const updatedUser = await this.prisma.user.update({
            where: { user_id: userId },
            data: { profile_image: fileUrl },
        });
        const { password, reset_token, reset_token_expires, ...result } = updatedUser;
        return result;
    }
    async removeProfilePicture(userId) {
        const user = await this.prisma.user.findUnique({
            where: { user_id: userId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.profile_image) {
            await this.deleteS3ObjectIfMatches(user.profile_image);
            const updatedUser = await this.prisma.user.update({
                where: { user_id: userId },
                data: { profile_image: null },
            });
            const { password, reset_token, reset_token_expires, ...result } = updatedUser;
            return result;
        }
        const { password, reset_token, reset_token_expires, ...result } = user;
        return result;
    }
    async getAllUsers(role) {
        const users = await this.prisma.user.findMany({
            where: role ? { role } : undefined,
            orderBy: { created_at: 'desc' },
        });
        return users.map((user) => {
            const { password, reset_token, reset_token_expires, ...result } = user;
            return result;
        });
    }
    async updateUserStatus(userId, dto) {
        const user = await this.prisma.user.update({
            where: { user_id: userId },
            data: { status: dto.status },
        });
        const { password, reset_token, reset_token_expires, ...result } = user;
        return result;
    }
    async createCourseAdmin(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const user = await this.prisma.user.create({
            data: {
                full_name: dto.full_name,
                email: dto.email,
                role: client_1.Role.CourseAdmin,
                provider: 'local',
                reset_token: resetToken,
                reset_token_expires: resetTokenExpires,
            },
        });
        await this.mailService.sendAdminWelcomeEmail(user.email, user.full_name, resetToken, resetTokenExpires.getTime());
        const { password, reset_token, reset_token_expires, ...result } = user;
        return result;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], UsersService);
//# sourceMappingURL=users.service.js.map