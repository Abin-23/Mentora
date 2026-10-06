"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCategoryDto, userId) {
        const existing = await this.prisma.category.findUnique({
            where: { category_name: createCategoryDto.category_name },
        });
        if (existing) {
            throw new common_1.ConflictException('Category name already exists');
        }
        return this.prisma.category.create({
            data: {
                ...createCategoryDto,
                created_by: userId,
            },
        });
    }
    findAll() {
        return this.prisma.category.findMany({
            orderBy: { category_name: 'asc' },
            include: {
                creator: {
                    select: { full_name: true, email: true },
                },
            },
        });
    }
    async findOne(idOrSlug) {
        if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
            const category = await this.prisma.category.findUnique({
                where: { category_id: Number(idOrSlug) },
            });
            if (!category) {
                throw new common_1.NotFoundException(`Category #${idOrSlug} not found`);
            }
            return category;
        }
        else {
            const categories = await this.prisma.category.findMany();
            const category = categories.find(c => this.generateSlug(c.category_name) === idOrSlug);
            if (!category) {
                throw new common_1.NotFoundException(`Category not found`);
            }
            return category;
        }
    }
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
    async update(id, updateCategoryDto, user) {
        const category = await this.findOne(id);
        if (user.role === 'CourseAdmin' && category.created_by !== user.user_id) {
            throw new common_1.ForbiddenException('You can only edit categories you created');
        }
        if (updateCategoryDto.category_name) {
            const existing = await this.prisma.category.findUnique({
                where: { category_name: updateCategoryDto.category_name },
            });
            if (existing && existing.category_id !== id) {
                throw new common_1.ConflictException('Category name already exists');
            }
        }
        return this.prisma.category.update({
            where: { category_id: id },
            data: updateCategoryDto,
        });
    }
    async remove(id, user) {
        const category = await this.findOne(id);
        if (user.role === 'CourseAdmin' && category.created_by !== user.user_id) {
            throw new common_1.ForbiddenException('You can only delete categories you created');
        }
        return this.prisma.category.delete({
            where: { category_id: id },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map