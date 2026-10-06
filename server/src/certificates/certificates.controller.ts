import { Controller, Get, Post, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('my-certificates')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
  async getMyCertificates(@Req() req: any) {
    const studentId = parseInt(req.user.user_id, 10);
    return this.certificatesService.getCertificates(studentId);
  }

  @Get('eligibility/:courseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
  async checkEligibility(
    @Req() req: any,
    @Param('courseId', ParseIntPipe) courseId: number
  ) {
    const studentId = parseInt(req.user.user_id, 10);
    return this.certificatesService.checkEligibility(studentId, courseId);
  }

  @Post('issue/:courseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
  async issueCertificate(
    @Req() req: any,
    @Param('courseId', ParseIntPipe) courseId: number
  ) {
    const studentId = parseInt(req.user.user_id, 10);
    return this.certificatesService.issueCertificate(studentId, courseId);
  }

  @Get('verify/:credentialId')
  async verifyCertificate(@Param('credentialId') credentialId: string) {
    return this.certificatesService.verifyCertificate(credentialId);
  }
}
