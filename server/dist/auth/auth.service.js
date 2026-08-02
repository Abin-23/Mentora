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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    mailService;
    constructor(prisma, jwtService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }
    async register(registerDto) {
        const { full_name, email, password } = registerDto;
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
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
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async forgotPassword(forgotPasswordDto) {
        const { email } = forgotPasswordDto;
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user) {
            if (!user.password || user.provider !== 'local') {
                let providerName = 'social login';
                if (user.provider === 'google')
                    providerName = 'Google';
                else if (user.provider === 'github')
                    providerName = 'GitHub';
                else if (user.provider && user.provider !== 'local') {
                    providerName =
                        user.provider.charAt(0).toUpperCase() + user.provider.slice(1);
                }
                throw new common_1.BadRequestException(`This account was created using ${providerName}. Please sign in using ${providerName}.`);
            }
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpires = new Date(Date.now() + 3600000);
            await this.prisma.user.update({
                where: { email },
                data: {
                    reset_token: resetToken,
                    reset_token_expires: resetTokenExpires,
                },
            });
            await this.mailService.sendPasswordResetEmail(email, resetToken, resetTokenExpires.getTime());
        }
        return {
            message: 'If that email exists, a password reset link has been sent.',
        };
    }
    async resetPassword(resetPasswordDto) {
        const { token, newPassword } = resetPasswordDto;
        const user = await this.prisma.user.findFirst({
            where: {
                reset_token: token,
                reset_token_expires: { gt: new Date() },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid or expired password reset token');
        }
        if (!user.password || user.provider !== 'local') {
            throw new common_1.BadRequestException('Password reset is not supported for social login accounts.');
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
    async validateOAuthLogin(profile, provider) {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email)
                throw new common_1.UnauthorizedException('No email found in OAuth profile');
            const full_name = profile.displayName ||
                profile.name?.givenName ||
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
            }
            else if (!user.provider_id) {
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
        }
        catch (error) {
            console.error('OAuth validation error:', error);
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map