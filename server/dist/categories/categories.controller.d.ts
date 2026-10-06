import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(createCategoryDto: CreateCategoryDto, req: any): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        category_name: string;
        description: string | null;
        icon: string | null;
        category_id: number;
        created_by: number;
        updated_at: Date;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        creator: {
            email: string;
            full_name: string;
        };
    } & {
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        category_name: string;
        description: string | null;
        icon: string | null;
        category_id: number;
        created_by: number;
        updated_at: Date;
    })[]>;
    findOne(idOrSlug: string): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        category_name: string;
        description: string | null;
        icon: string | null;
        category_id: number;
        created_by: number;
        updated_at: Date;
    }>;
    update(id: number, updateCategoryDto: UpdateCategoryDto, req: any): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        category_name: string;
        description: string | null;
        icon: string | null;
        category_id: number;
        created_by: number;
        updated_at: Date;
    }>;
    remove(id: number, req: any): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        category_name: string;
        description: string | null;
        icon: string | null;
        category_id: number;
        created_by: number;
        updated_at: Date;
    }>;
}
