export declare class MailService {
    private readonly logger;
    private getTransporter;
    private resolveFrontendUrl;
    private sendMailWithFallback;
    sendPasswordResetEmail(to: string, token: string, expiresMs?: number, customFrontendUrl?: string): Promise<void>;
    sendAdminWelcomeEmail(to: string, name: string, token: string, expiresMs: number, customFrontendUrl?: string): Promise<void>;
}
