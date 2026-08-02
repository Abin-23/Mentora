import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { full_name, email, password } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        full_name,
        email,
        password: hashedPassword,
        provider: 'local',
      },
    });

    const payload = { sub: user.user_id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.user_id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.password || user.provider !== 'local') {
        let providerName = 'social login';
        if (user.provider === 'google') providerName = 'Google';
        else if (user.provider === 'github') providerName = 'GitHub';
        else if (user.provider && user.provider !== 'local') {
          providerName =
            user.provider.charAt(0).toUpperCase() + user.provider.slice(1);
        }

        throw new BadRequestException(
          `This account was created using ${providerName}. Please sign in using ${providerName}.`,
        );
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

      await this.prisma.user.update({
        where: { email },
        data: {
          reset_token: resetToken,
          reset_token_expires: resetTokenExpires,
        },
      });

      // Send the actual email
      await this.mailService.sendPasswordResetEmail(
        email,
        resetToken,
        resetTokenExpires.getTime(),
      );
    }

    return {
      message: 'If that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    if (!user.password || user.provider !== 'local') {
      throw new BadRequestException(
        'Password reset is not supported for social login accounts.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    return { message: 'Password has been successfully reset' };
  }

  /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

  async validateOAuthLogin(profile: any, provider: string) {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email)
        throw new UnauthorizedException('No email found in OAuth profile');

      const full_name =
        (profile.displayName as string) ||
        (profile.name?.givenName as string) ||
        String(email).split('@')[0];
      const provider_id = profile.id;

      let user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            full_name,
            provider,
            provider_id,
          },
        });
      } else if (!user.provider_id) {
        user = await this.prisma.user.update({
          where: { email },
          data: { provider, provider_id },
        });
      }

      const payload = { sub: user.user_id, email: user.email };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.user_id,
          name: user.full_name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('OAuth validation error:', error);
      throw error;
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
}
