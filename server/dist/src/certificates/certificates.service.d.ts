import { PrismaService } from '../prisma/prisma.service';
import { Neo4jService } from '../neo4j/neo4j.service';
export declare class CertificatesService {
    private prisma;
    private neo4jService;
    constructor(prisma: PrismaService, neo4jService: Neo4jService);
    checkEligibility(studentId: number, courseId: number): Promise<{
        eligible: boolean;
        reason: string;
        unmasteredCount?: undefined;
        unmasteredTopics?: undefined;
    } | {
        eligible: boolean;
        unmasteredCount: number;
        unmasteredTopics: ({
            resources: {
                topic_id: number;
                resource_id: number;
                status: import(".prisma/client").$Enums.CourseStatus;
                created_at: Date;
                updated_at: Date;
                resource_title: string;
                description: string | null;
                resource_type: import(".prisma/client").$Enums.ResourceType;
                resource_key: string;
                thumbnail_key: string | null;
                file_size: bigint | null;
                duration_seconds: number | null;
                sequence_number: number;
                is_preview: boolean;
                is_ai_source: boolean;
                uploaded_by: number;
            }[];
        } & {
            course_id: number;
            topic_id: number;
            status: import(".prisma/client").$Enums.CourseStatus;
            created_at: Date;
            updated_at: Date;
            sequence_number: number;
            topic_title: string;
            topic_description: string | null;
            learning_objectives: string;
            difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
            estimated_duration: import("@prisma/client/runtime/library").Decimal | null;
        })[];
        reason?: undefined;
    } | {
        eligible: boolean;
        reason?: undefined;
        unmasteredCount?: undefined;
        unmasteredTopics?: undefined;
    }>;
    issueCertificate(studentId: number, courseId: number): Promise<{
        student_id: number;
        course_id: number;
        certificate_id: number;
        credential_id: string;
        issued_at: Date;
        grade_percentage: import("@prisma/client/runtime/library").Decimal | null;
        certificate_url: string | null;
    }>;
    getCertificates(studentId: number): Promise<({
        course: {
            course_id: number;
            status: import(".prisma/client").$Enums.CourseStatus;
            created_at: Date;
            updated_at: Date;
            description: string;
            thumbnail_key: string | null;
            learning_objectives: string;
            difficulty_level: import(".prisma/client").$Enums.DifficultyLevel;
            title: string;
            category_id: number;
            short_description: string;
            prerequisites: string | null;
            language: string;
            duration_hours: import("@prisma/client/runtime/library").Decimal | null;
            price: import("@prisma/client/runtime/library").Decimal;
            slug: string;
            course_admin_id: number;
        };
    } & {
        student_id: number;
        course_id: number;
        certificate_id: number;
        credential_id: string;
        issued_at: Date;
        grade_percentage: import("@prisma/client/runtime/library").Decimal | null;
        certificate_url: string | null;
    })[]>;
    verifyCertificate(credentialId: string): Promise<{
        student: {
            email: string;
            full_name: string;
        };
        course: {
            title: string;
            course_admin: {
                full_name: string;
            };
        };
    } & {
        student_id: number;
        course_id: number;
        certificate_id: number;
        credential_id: string;
        issued_at: Date;
        grade_percentage: import("@prisma/client/runtime/library").Decimal | null;
        certificate_url: string | null;
    }>;
}
