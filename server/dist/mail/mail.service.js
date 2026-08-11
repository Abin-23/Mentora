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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    transporter;
    logger = new common_1.Logger(MailService_1.name);
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async sendPasswordResetEmail(to, token, expiresMs) {
        const expiresParam = expiresMs ? `&expires=${expiresMs}` : '';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${token}${expiresParam}`;
        const mailOptions = {
            from: process.env.SMTP_FROM || `"Mentora" <${process.env.SMTP_USER}>`,
            replyTo: process.env.SMTP_USER,
            to: to,
            subject: 'Reset your Mentora password',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4CAF50;">Mentora Password Reset</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your Mentora account associated with this email address.</p>
          <p>Click the button below to securely reset your password. This link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #E8FF66; color: #333; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">If the button above doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #4CAF50;">${resetLink}</a></p>
        </div>
      `,
            text: `Mentora Password Reset\n\nHello,\nWe received a request to reset the password for your Mentora account associated with this email address.\n\nPlease copy and paste this link into your browser to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.\nIf you didn't request a password reset, you can safely ignore this email.`,
        };
        try {
            if (!process.env.SMTP_USER ||
                process.env.SMTP_USER === 'your_email@gmail.com') {
                this.logger.warn('SMTP credentials not configured. Email not sent. Please update .env.');
                this.logger.log(`Generated Link (Simulated): ${resetLink}`);
                return;
            }
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Password reset email sent to ${to}: ${info.messageId}`);
        }
        catch (error) {
            this.logger.error(`Error sending email to ${to}`, error);
            throw error;
        }
    }
    async sendAdminWelcomeEmail(to, name, token, expiresMs) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const expiresParam = expiresMs ? `&expires=${expiresMs}` : '';
        const resetLink = `${frontendUrl}/reset-password?token=${token}${expiresParam}`;
        const mailOptions = {
            from: process.env.SMTP_FROM || `"Mentora" <${process.env.SMTP_USER}>`,
            replyTo: process.env.SMTP_USER,
            to: to,
            subject: 'Welcome to Mentora - Action Required',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4CAF50;">Welcome to Mentora, ${name}!</h2>
          <p>A new Course Admin account has been created for you by the System Administrator.</p>
          <p>To securely set up your account and choose your password, please click the link below. This link will expire in 24 hours.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #E8FF66; color: #333; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Set Your Password</a>
          </div>
        </div>
      `,
            text: `Welcome to Mentora, ${name}!\n\nA new Course Admin account has been created for you by the System Administrator.\n\nTo securely set up your account and choose your password, please copy and paste this link into your browser:\n${resetLink}\n\nThis link will expire in 24 hours.`,
        };
        try {
            if (!process.env.SMTP_USER ||
                process.env.SMTP_USER === 'your_email@gmail.com') {
                this.logger.warn('SMTP credentials not configured. Email not sent. Please update .env.');
                this.logger.log(`Generated Setup Link (Simulated) for ${to}: ${resetLink}`);
                return;
            }
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Admin welcome email sent to ${to}: ${info.messageId}`);
        }
        catch (error) {
            this.logger.error(`Error sending email to ${to}`, error);
            throw error;
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map