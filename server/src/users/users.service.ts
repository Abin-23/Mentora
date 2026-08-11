import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as path from 'path';
import { MailService } from '../mail/mail.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class UsersService {
  private s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, reset_token, reset_token_expires, ...result } = user;
    return result;
  }

  async updateProfile(userId: number, updateDto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { user_id: userId },
        data: updateDto,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, reset_token, reset_token_expires, ...result } = user;
      return result;
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('phone')) {
        throw new ConflictException(
          'Phone number is already associated with another account',
        );
      }
      throw error;
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.provider !== 'local' || !user.password) {
      throw new BadRequestException(
        'Cannot change password for OAuth accounts.',
      );
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid current password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { user_id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  private async deleteS3ObjectIfMatches(fileUrl: string) {
    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION || 'ap-south-1';
    if (!bucketName) return;

    const s3Domain = `https://${bucketName}.s3.${region}.amazonaws.com/`;
    if (fileUrl.startsWith(s3Domain)) {
      const key = fileUrl.replace(s3Domain, '');
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({ Bucket: bucketName, Key: key }),
        );
      } catch (err) {
        console.error('Failed to delete old profile picture from S3', err);
      }
    }
  }

  async uploadProfilePicture(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.profile_image) {
      await this.deleteS3ObjectIfMatches(user.profile_image);
    }

    const ext = path.extname(file.originalname);
    const filename = `profiles/${userId}-${crypto.randomUUID()}${ext}`;
    const bucketName = process.env.AWS_BUCKET_NAME;

    if (!bucketName) {
      throw new Error('AWS_BUCKET_NAME is not configured');
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;

    const updatedUser = await this.prisma.user.update({
      where: { user_id: userId },
      data: { profile_image: fileUrl },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, reset_token, reset_token_expires, ...result } =
      updatedUser;
    return result;
  }

  async removeProfilePicture(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.profile_image) {
      await this.deleteS3ObjectIfMatches(user.profile_image);
      const updatedUser = await this.prisma.user.update({
        where: { user_id: userId },
        data: { profile_image: null },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, reset_token, reset_token_expires, ...result } =
        updatedUser;
      return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, reset_token, reset_token_expires, ...result } = user;
    return result;
  }

  async getAllUsers(role?: Role) {
    const users = await this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { created_at: 'desc' },
    });
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, reset_token, reset_token_expires, ...result } = user;
      return result;
    });
  }

  async updateUserStatus(userId: number, dto: UpdateStatusDto) {
    const user = await this.prisma.user.update({
      where: { user_id: userId },
      data: { status: dto.status },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, reset_token, reset_token_expires, ...result } = user;
    return result;
  }

  async createCourseAdmin(dto: CreateAdminDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        full_name: dto.full_name,
        email: dto.email,
        role: Role.CourseAdmin,
        provider: 'local',
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
      },
    });

    await this.mailService.sendAdminWelcomeEmail(
      user.email,
      user.full_name,
      resetToken,
      resetTokenExpires.getTime(),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, reset_token, reset_token_expires, ...result } = user;
    return result;
  }
}
