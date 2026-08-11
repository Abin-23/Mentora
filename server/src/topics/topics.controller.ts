import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Roles('SystemAdmin', 'CourseAdmin')
  @Post('courses/:courseId/topics')
  create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() createTopicDto: CreateTopicDto,
  ) {
    return this.topicsService.create(courseId, createTopicDto);
  }

  @Get('courses/:courseId/topics')
  findAllByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.topicsService.findAllByCourse(courseId);
  }

  @Roles('SystemAdmin', 'CourseAdmin')
  @Patch('courses/:courseId/topics/reorder')
  reorder(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() reorderTopicsDto: ReorderTopicsDto,
  ) {
    return this.topicsService.reorder(courseId, reorderTopicsDto);
  }

  @Get('topics/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.topicsService.findOne(id);
  }

  @Roles('SystemAdmin', 'CourseAdmin')
  @Patch('topics/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTopicDto: UpdateTopicDto,
  ) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Roles('SystemAdmin', 'CourseAdmin')
  @Delete('topics/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.topicsService.remove(id);
  }
}
