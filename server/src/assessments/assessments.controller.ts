import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AiGenerationService } from './ai-generation.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('assessments')
@UseGuards(AuthGuard('jwt'))
export class AssessmentsController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly aiGenerationService: AiGenerationService,
  ) {}

  @Post('course/:courseId/topic/:topicId/generate')
  generateTopicAssessment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
  ) {
    return this.aiGenerationService.generateTopicAssessment(courseId, topicId);
  }

  @Get('course/:courseId')
  getByCourse(@Param('courseId', ParseIntPipe) courseId: number, @Req() req: any) {
    return this.assessmentsService.getAssessmentsByCourse(courseId, req.user);
  }

  @Get(':id/profile')
  getProfile(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.assessmentsService.getAssessmentProfileForStudent(id, req.user.user_id);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.assessmentsService.getAssessmentForStudent(id);
  }

  @Post(':id/attempts')
  startAttempt(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.assessmentsService.startAttempt(id, req.user.user_id);
  }

  @Post('attempts/:attemptId/answers')
  submitAnswer(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Body() body: { questionId: number; selectedOptionId?: number; answerText?: string },
    @Req() req: any,
  ) {
    return this.assessmentsService.submitAnswer(
      attemptId,
      req.user.user_id,
      body.questionId,
      body.selectedOptionId,
      body.answerText,
    );
  }

  @Post('attempts/:attemptId/events')
  logSecurityEvent(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Body() body: { eventType: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; metadata?: any },
    @Req() req: any,
  ) {
    return this.assessmentsService.logSecurityEvent(
      attemptId,
      req.user.user_id,
      body.eventType,
      body.severity,
      body.metadata,
    );
  }

  @Post('attempts/:attemptId/submit')
  submitAttempt(@Param('attemptId', ParseIntPipe) attemptId: number, @Req() req: any) {
    return this.assessmentsService.submitAttempt(attemptId, req.user.user_id);
  }
}
