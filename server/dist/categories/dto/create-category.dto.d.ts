import { Status } from '@prisma/client';
export declare class CreateCategoryDto {
    category_name: string;
    description?: string;
    icon?: string;
    status?: Status;
}
