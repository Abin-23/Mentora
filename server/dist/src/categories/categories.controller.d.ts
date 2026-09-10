import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(createCategoryDto: CreateCategoryDto, req: any): Promise<{
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
    findOne(idOrSlug: string): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        updated_at: Date;
        description: string | null;
        created_by: number;
        category_name: string;
        icon: string | null;
        category_id: number;
    }>;
    update(id: number, updateCategoryDto: UpdateCategoryDto, req: any): Promise<{
        status: import(".prisma/client").$Enums.Status;
        created_at: Date;
        updated_at: Date;
        description: string | null;
        created_by: number;
        category_name: string;
        icon: string | null;
        category_id: number;
    }>;
    remove(id: number, req: any): Promise<{
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
