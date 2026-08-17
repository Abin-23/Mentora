import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { LearningProgressService } from './learning-progress.service';
import { StartProgressDto } from './dto/start-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('learning-progress')
export class LearningProgressController {
  constructor(private readonly learningProgressService: LearningProgressService) {}

  @Post('start')
  startProgress(@Req() req: any, @Body() dto: StartProgressDto) {
    return this.learningProgressService.startProgress(req.user.user_id, dto);
  }

  @Patch(':id')
  updateProgress(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.learningProgressService.updateProgress(req.user.user_id, id, dto);
  }

  @Post(':id/complete')
  completeProgress(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.learningProgressService.completeProgress(req.user.user_id, id);
  }

  @Get('courses/:courseId')
  getCourseProgress(@Req() req: any, @Param('courseId', ParseIntPipe) courseId: number) {
    return this.learningProgressService.getCourseProgress(req.user.user_id, courseId);
  }

  @Get('topics/:topicId')
  getTopicProgress(@Req() req: any, @Param('topicId', ParseIntPipe) topicId: number) {
    return this.learningProgressService.getTopicProgress(req.user.user_id, topicId);
  }

  @Get('topics/:topicId/resources')
  getProgressByTopicResources(@Req() req: any, @Param('topicId', ParseIntPipe) topicId: number) {
    return this.learningProgressService.getProgressByTopicResources(req.user.user_id, topicId);
  }

  @Get('../learning-activities/me')
  getMyActivities(@Req() req: any) {
    return this.learningProgressService.getMyActivities(req.user.user_id);
  }
}
