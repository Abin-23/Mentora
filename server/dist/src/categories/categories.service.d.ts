import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCategoryDto: CreateCategoryDto, userId: number): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        updated_at: Date;
        description: string | null;
        created_by: number;
        category_name: string;
        icon: string | null;
        category_id: number;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        creator: {
            email: string;
            full_name: string;
        };
    } & {
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        updated_at: Date;
        description: string | null;
        created_by: number;
        category_name: string;
        icon: string | null;
        category_id: number;
    })[]>;
    findOne(idOrSlug: number | string): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        updated_at: Date;
        description: string | null;
        created_by: number;
        category_name: string;
        icon: string | null;
        category_id: number;
    }>;
    private generateSlug;
    update(id: number, updateCategoryDto: UpdateCategoryDto, user: any): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        updated_at: Date;
        description: string | null;
        created_by: number;
        category_name: string;
        icon: string | null;
        category_id: number;
    }>;
    remove(id: number, user: any): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        updated_at: Date;
        description: string | null;
        created_by: number;
        category_name: string;
        icon: string | null;
        category_id: number;
    }>;
}
