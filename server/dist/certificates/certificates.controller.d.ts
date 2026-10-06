import { CertificatesService } from './certificates.service';
export declare class CertificatesController {
    private readonly certificatesService;
    constructor(certificatesService: CertificatesService);
    getMyCertificates(req: any): Promise<({
        course: {
            status: import(".prisma/client").$Enums.CourseStatus;
            created_at: Date;
            description: string;
            category_id: number;
            updated_at: Date;
            title: string;
            short_description: string;
            learning_objectives: string;
            prerequisites: string | null;
            difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
            language: string;
            duration_hours: import("@prisma/client/runtime/library").Decimal | null;
            price: import("@prisma/client/runtime/library").Decimal;
            thumbnail_key: string | null;
            course_id: number;
            slug: string;
            course_admin_id: number;
        };
    } & {
        course_id: number;
        student_id: number;
        certificate_id: number;
        credential_id: string;
        issued_at: Date;
        grade_percentage: import("@prisma/client/runtime/library").Decimal | null;
        certificate_url: string | null;
    })[]>;
    checkEligibility(req: any, courseId: number): Promise<{
        eligible: boolean;
        reason: string;
        unmasteredCount?: undefined;
        unmasteredTopics?: undefined;
    } | {
        eligible: boolean;
        unmasteredCount: number;
        unmasteredTopics: ({
            resources: {
                status: import(".prisma/client").$Enums.CourseStatus;
                created_at: Date;
                description: string | null;
                updated_at: Date;
                thumbnail_key: string | null;
                topic_id: number;
                sequence_number: number;
                resource_id: number;
                resource_title: string;
                resource_type: import(".prisma/client").$Enums.ResourceType;
                resource_key: string;
                file_size: bigint | null;
                duration_seconds: number | null;
                is_preview: boolean;
                is_ai_source: boolean;
                uploaded_by: number;
            }[];
        } & {
            status: import(".prisma/client").$Enums.CourseStatus;
            created_at: Date;
            updated_at: Date;
            learning_objectives: string;
            difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
            course_id: number;
            topic_id: number;
            topic_title: string;
            topic_description: string | null;
            estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
            sequence_number: number;
        })[];
        reason?: undefined;
    } | {
        eligible: boolean;
        reason?: undefined;
        unmasteredCount?: undefined;
        unmasteredTopics?: undefined;
    }>;
    issueCertificate(req: any, courseId: number): Promise<{
        course_id: number;
        student_id: number;
        certificate_id: number;
        credential_id: string;
        issued_at: Date;
        grade_percentage: import("@prisma/client/runtime/library").Decimal | null;
        certificate_url: string | null;
    }>;
    verifyCertificate(credentialId: string): Promise<{
        course: {
            title: string;
            course_admin: {
                full_name: string;
            };
        };
        student: {
            email: string;
            full_name: string;
        };
    } & {
        course_id: number;
        student_id: number;
        certificate_id: number;
        credential_id: string;
        issued_at: Date;
        grade_percentage: import("@prisma/client/runtime/library").Decimal | null;
        certificate_url: string | null;
    }>;
}
