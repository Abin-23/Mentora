const fs = require('fs');
const controllerPath = 'server/src/assessments/assessments.controller.ts';
let ctrl = fs.readFileSync(controllerPath, 'utf8');
ctrl = ctrl.replace(
  `  @Post(':id/attempts')`,
  `  @Get(':id/attempts/current')\n  getCurrentAttempt(@Param('id', ParseIntPipe) id: number, @Req() req: any) {\n    return this.assessmentsService.getCurrentAttempt(id, req.user.user_id);\n  }\n\n  @Post(':id/attempts')`
);
fs.writeFileSync(controllerPath, ctrl);

const servicePath = 'server/src/assessments/assessments.service.ts';
let svc = fs.readFileSync(servicePath, 'utf8');
svc = svc.replace(
  `  async startAttempt(assessmentId: number, studentId: number) {`,
  `  async getCurrentAttempt(assessmentId: number, studentId: number) {\n    const attempt = await this.prisma.assessmentAttempt.findFirst({\n      where: { assessment_id: assessmentId, student_id: studentId },\n      orderBy: { attempt_number: 'desc' },\n      include: { security_events: true }\n    });\n    if (!attempt) return null;\n    const violationTypes = ['TAB_SWITCH', 'WINDOW_FOCUS_LOSS', 'FULLSCREEN_EXIT', 'FACE_NOT_DETECTED', 'MULTIPLE_FACES', 'CAMERA_DISCONNECTED', 'MICROPHONE_DISCONNECTED'];\n    const warningCount = attempt.security_events.filter(e => violationTypes.includes(e.event_type)).length;\n    return { ...attempt, warningCount };\n  }\n\n  async startAttempt(assessmentId: number, studentId: number) {`
);
fs.writeFileSync(servicePath, svc);
