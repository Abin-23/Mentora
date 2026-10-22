import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private getTransporter(port?: number) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const targetPort = port || Number(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER?.replace(/["']/g, '').trim();
    const pass = process.env.SMTP_PASS?.replace(/["']/g, '').trim();

    return nodemailer.createTransport({
      host,
      port: targetPort,
      secure: targetPort === 465,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  private resolveFrontendUrl(customUrl?: string): string {
    let url = customUrl || process.env.FRONTEND_URL;
    if (!url || (url.includes('localhost') && process.env.NODE_ENV === 'production')) {
      url = 'https://mentora-six-bice.vercel.app';
    }
    return (url || 'https://mentora-six-bice.vercel.app').replace(/\/+$/, '');
  }

  private async sendMailWithFallback(mailOptions: nodemailer.SendMailOptions) {
    const configuredPort = Number(process.env.SMTP_PORT) || 465;
    const primaryTransporter = this.getTransporter(configuredPort);

    try {
      return await primaryTransporter.sendMail(mailOptions);
    } catch (primaryErr: any) {
      this.logger.warn(
        `Primary SMTP attempt on port ${configuredPort} failed: ${primaryErr.message}. Trying port 465 SSL fallback...`,
      );
      if (configuredPort !== 465) {
        const fallbackTransporter = this.getTransporter(465);
        return await fallbackTransporter.sendMail(mailOptions);
      }
      throw primaryErr;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
    expiresMs?: number,
    customFrontendUrl?: string,
  ) {
    const frontendUrl = this.resolveFrontendUrl(customFrontendUrl);
    const expiresParam = expiresMs ? `&expires=${expiresMs}` : '';
    const resetLink = `${frontendUrl}/reset-password?token=${token}${expiresParam}`;
    const user = process.env.SMTP_USER?.replace(/["']/g, '').trim();

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Mentora" <${user}>`,
      replyTo: user,
      to,
      subject: 'Reset your Mentora password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1c1917; background-color: #fafaf9; border-radius: 16px; border: 1px solid #e7e5e4;">
          <div style="margin-bottom: 24px;">
            <h1 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 800;">Mentora</h1>
            <p style="color: #78716c; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Adaptive Learning Platform</p>
          </div>
          <div style="background-color: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e7e5e4;">
            <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">Hello,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">We received a request to reset the password for your Mentora account.</p>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">Click the button below to choose a new password. For security, this link expires in 1 hour.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 9999px; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 12px; line-height: 1.5; color: #78716c;">If you did not request a password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #f5f5f4; margin: 24px 0;" />
            <p style="font-size: 11px; color: #a8a29e; word-break: break-all;">Direct link: <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a></p>
          </div>
        </div>
      `,
      text: `Mentora Password Reset\n\nHello,\nWe received a request to reset your password.\n\nPlease copy and paste this link into your browser to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.\nIf you didn't request a password reset, you can safely ignore this email.`,
    };

    try {
      if (!user || user === 'your_email@gmail.com') {
        this.logger.warn(
          'SMTP credentials not configured. Email not sent. Please update .env.',
        );
        this.logger.log(`Generated Link (Simulated): ${resetLink}`);
        return;
      }

      const info: any = await this.sendMailWithFallback(mailOptions);
      this.logger.log(`Password reset email sent to ${to}: ${info?.messageId || 'OK'}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${to}`, error);
      throw error;
    }
  }

  async sendAdminWelcomeEmail(
    to: string,
    name: string,
    token: string,
    expiresMs: number,
    customFrontendUrl?: string,
  ) {
    const frontendUrl = this.resolveFrontendUrl(customFrontendUrl);
    const expiresParam = expiresMs ? `&expires=${expiresMs}` : '';
    const resetLink = `${frontendUrl}/reset-password?token=${token}${expiresParam}`;
    const user = process.env.SMTP_USER?.replace(/["']/g, '').trim();

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Mentora" <${user}>`,
      replyTo: user,
      to,
      subject: 'Welcome to Mentora - Action Required',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1c1917; background-color: #fafaf9; border-radius: 16px; border: 1px solid #e7e5e4;">
          <div style="margin-bottom: 24px;">
            <h1 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 800;">Mentora</h1>
            <p style="color: #78716c; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Instructor Management</p>
          </div>
          <div style="background-color: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e7e5e4;">
            <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Welcome to Mentora, ${name}!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">A new Course Administrator account has been provisioned for you by the System Admin.</p>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">To activate your administrative privileges and set up your password, please click the button below. This activation link expires in 24 hours.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 9999px; display: inline-block;">Set Your Password</a>
            </div>
            <hr style="border: none; border-top: 1px solid #f5f5f4; margin: 24px 0;" />
            <p style="font-size: 11px; color: #a8a29e; word-break: break-all;">Direct link: <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a></p>
          </div>
        </div>
      `,
      text: `Welcome to Mentora, ${name}!\n\nA new Course Admin account has been created for you by the System Administrator.\n\nTo securely set up your account and choose your password, please copy and paste this link into your browser:\n${resetLink}\n\nThis link will expire in 24 hours.`,
    };

    try {
      if (!user || user === 'your_email@gmail.com') {
        this.logger.warn(
          'SMTP credentials not configured. Email not sent. Please update .env.',
        );
        this.logger.log(`Generated Setup Link (Simulated) for ${to}: ${resetLink}`);
        return;
      }

      const info: any = await this.sendMailWithFallback(mailOptions);
      this.logger.log(`Admin welcome email sent to ${to}: ${info?.messageId || 'OK'}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${to}`, error);
      throw error;
    }
  }
}
