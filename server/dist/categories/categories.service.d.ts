import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCategoryDto: CreateCategoryDto, userId: number): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        category_id: number;
        description: string | null;
        updated_at: Date;
        category_name: string;
        icon: string | null;
        created_by: number;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        creator: {
            email: string;
            full_name: string;
        };
    } & {
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        category_id: number;
        description: string | null;
        updated_at: Date;
        category_name: string;
        icon: string | null;
        created_by: number;
    })[]>;
    findOne(idOrSlug: number | string): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        category_id: number;
        description: string | null;
        updated_at: Date;
        category_name: string;
        icon: string | null;
        created_by: number;
    }>;
    private generateSlug;
    update(id: number, updateCategoryDto: UpdateCategoryDto, user: any): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        category_id: number;
        description: string | null;
        updated_at: Date;
        category_name: string;
        icon: string | null;
        created_by: number;
    }>;
    remove(id: number, user: any): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        category_id: number;
        description: string | null;
        updated_at: Date;
        category_name: string;
        icon: string | null;
        created_by: number;
    }>;
}
