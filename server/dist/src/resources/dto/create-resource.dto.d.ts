import { ResourceType, CourseStatus } from '@prisma/client';
export declare class CreateResourceDto {
    resource_title: string;
    description?: string;
    resource_type: ResourceType;
    is_preview?: boolean;
    is_ai_source?: boolean;
    duration_seconds?: number;
    link_url?: string;
    status?: CourseStatus;
}
