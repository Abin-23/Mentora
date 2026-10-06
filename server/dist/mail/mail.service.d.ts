export declare class MailService {
    private transporter;
    private readonly logger;
    constructor();
    sendPasswordResetEmail(to: string, token: string, expiresMs?: number): Promise<void>;
    sendAdminWelcomeEmail(to: string, name: string, token: string, expiresMs: number): Promise<void>;
}
