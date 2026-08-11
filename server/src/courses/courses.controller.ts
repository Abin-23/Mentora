import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SystemAdmin, Role.CourseAdmin)
  create(@Body() createCourseDto: CreateCourseDto, @Req() req: any) {
    return this.coursesService.create(createCourseDto, req.user.user_id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SystemAdmin, Role.CourseAdmin)
  findAll(@Req() req: any) {
    return this.coursesService.findAll(req.user);
  }

  @Get('category/:categoryIdOrSlug')
  @UseGuards(AuthGuard('jwt'))
  findByCategory(
    @Param('categoryIdOrSlug') categoryIdOrSlug: string,
    @Req() req: any,
  ) {
    return this.coursesService.findByCategory(categoryIdOrSlug, req.user.user_id);
  }

  @Get(':idOrSlug/player')
  @UseGuards(AuthGuard('jwt'))
  getCoursePlayerContent(
    @Param('idOrSlug') idOrSlug: string,
    @Req() req: any,
  ) {
    return this.coursesService.getCoursePlayerContent(idOrSlug, req.user.user_id);
  }

  @Get(':idOrSlug')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('idOrSlug') idOrSlug: string, @Req() req: any) {
    return this.coursesService.findOne(idOrSlug, req.user.user_id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SystemAdmin, Role.CourseAdmin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: any,
  ) {
    return this.coursesService.update(id, updateCourseDto, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SystemAdmin, Role.CourseAdmin)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.coursesService.remove(id, req.user);
  }
}
