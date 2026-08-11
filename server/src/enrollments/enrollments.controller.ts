import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('free')
  freeEnrollment(@Req() req: any, @Body('courseId') courseId: number) {
    return this.enrollmentsService.freeEnrollment(req.user.user_id, courseId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-learning')
  getMyEnrollments(@Req() req: any) {
    return this.enrollmentsService.getMyEnrollments(req.user.user_id);
  }
}
