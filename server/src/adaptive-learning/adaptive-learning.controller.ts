import { Controller, Post, Get, Param, ParseIntPipe, Body } from '@nestjs/common';
import { AdaptiveLearningService } from './adaptive-learning.service';
import { GeneratePathDto } from './dto/adaptive-learning.dto';

@Controller('adaptive-learning/students/:studentId/courses/:courseId')
export class AdaptiveLearningController {
  constructor(private readonly adaptiveLearningService: AdaptiveLearningService) {}

  @Post('generate')
  async generatePath(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: GeneratePathDto,
  ) {
    return this.adaptiveLearningService.generatePath(studentId, courseId, dto);
  }

  @Get('path')
  async getPath(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    // For now, since recommendations are dynamically generated, GET just triggers generation.
    // In the future, this could read a persisted path from the database.
    return this.adaptiveLearningService.generatePath(studentId, courseId, { limit: 5 });
  }
}
