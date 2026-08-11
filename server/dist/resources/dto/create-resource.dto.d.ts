import { ResourceType, CourseStatus } from '@prisma/client';
export declare class CreateResourceDto {
    resource_title: string;
    description?: string;
    resource_type: ResourceType;
    is_preview?: boolean;
    duration_seconds?: number;
    link_url?: string;
    status?: CourseStatus;
}
