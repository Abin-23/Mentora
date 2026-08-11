import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto, userId: number) {
    const existing = await this.prisma.category.findUnique({
      where: { category_name: createCategoryDto.category_name },
    });
    if (existing) {
      throw new ConflictException('Category name already exists');
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

  async findOne(idOrSlug: number | string) {
    if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
      const category = await this.prisma.category.findUnique({
        where: { category_id: Number(idOrSlug) },
      });
      if (!category) {
        throw new NotFoundException(`Category #${idOrSlug} not found`);
      }
      return category;
    } else {
      const categories = await this.prisma.category.findMany();
      const category = categories.find(c => this.generateSlug(c.category_name) === idOrSlug);
      
      if (!category) {
        throw new NotFoundException(`Category not found`);
      }
      return category;
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto, user: any) {
    const category = await this.findOne(id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user.role === 'CourseAdmin' && category.created_by !== user.user_id) {
      throw new ForbiddenException('You can only edit categories you created');
    }

    if (updateCategoryDto.category_name) {
      const existing = await this.prisma.category.findUnique({
        where: { category_name: updateCategoryDto.category_name },
      });
      if (existing && existing.category_id !== id) {
        throw new ConflictException('Category name already exists');
      }
    }
    return this.prisma.category.update({
      where: { category_id: id },
      data: updateCategoryDto,
    });
  }

  async remove(id: number, user: any) {
    const category = await this.findOne(id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user.role === 'CourseAdmin' && category.created_by !== user.user_id) {
      throw new ForbiddenException(
        'You can only delete categories you created',
      );
    }

    return this.prisma.category.delete({
      where: { category_id: id },
    });
  }
}
