import { Controller, Post, Get, Param, ParseIntPipe, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard')
  async getStudentDashboard(
    @Req() req: any,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.adaptiveLearningService.getStudentDashboard(req.user.user_id, courseId);
  }

  @Get('topics/:topicId/lesson')
  async getPersonalizedLesson(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
  ) {
    return this.adaptiveLearningService.generatePersonalizedLesson(studentId, courseId, topicId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('topics/:topicId/diagnostics')
  async getDiagnostics(
    @Req() req: any,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
  ) {
    if (req.user.role !== 'SystemAdmin' && req.user.role !== 'CourseAdmin') {
      throw new UnauthorizedException('Only administrators can access diagnostic data.');
    }
    return this.adaptiveLearningService.getDiagnostics(studentId, courseId, topicId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('goals')
  async getStudentGoals(
    @Req() req: any,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.adaptiveLearningService.getStudentGoals(req.user.user_id, courseId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('goals')
  async createStudentGoal(
    @Req() req: any,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: any
  ) {
    return this.adaptiveLearningService.createStudentGoal(req.user.user_id, courseId, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tutor')
  async askTutor(
    @Req() req: any,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: any
  ) {
    const studentId = typeof req.user.user_id === 'string' ? parseInt(req.user.user_id, 10) : req.user.user_id;
    return this.adaptiveLearningService.askTutor(studentId, courseId, body);
  }
}
