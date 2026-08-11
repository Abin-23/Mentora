import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: {
        sub: number;
        email: string;
    }): Promise<{
        email: string;
        full_name: string;
        user_id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        profile_image: string | null;
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        provider: string | null;
        provider_id: string | null;
        reset_token: string | null;
        reset_token_expires: Date | null;
    }>;
}
export {};
