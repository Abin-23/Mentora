export declare class MailService {
    private readonly logger;
    private getTransporter;
    private resolveFrontendUrl;
    private sendMailWithFallback;
    private dispatchEmail;
    sendPasswordResetEmail(to: string, token: string, expiresMs?: number, customFrontendUrl?: string): Promise<{
        success: boolean;
        resetLink: string;
    }>;
    sendAdminWelcomeEmail(to: string, name: string, token: string, expiresMs: number, customFrontendUrl?: string): Promise<{
        success: boolean;
        resetLink: string;
    }>;
}
