"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentsController = void 0;
const common_1 = require("@nestjs/common");
const assessments_service_1 = require("./assessments.service");
const ai_generation_service_1 = require("./ai-generation.service");
const passport_1 = require("@nestjs/passport");
let AssessmentsController = class AssessmentsController {
    assessmentsService;
    aiGenerationService;
    constructor(assessmentsService, aiGenerationService) {
        this.assessmentsService = assessmentsService;
        this.aiGenerationService = aiGenerationService;
    }
    generateTopicAssessment(courseId, topicId) {
        return this.aiGenerationService.generateTopicAssessment(courseId, topicId);
    }
    getByCourse(courseId, req) {
        return this.assessmentsService.getAssessmentsByCourse(courseId, req.user);
    }
    getProfile(id, req) {
        return this.assessmentsService.getAssessmentProfileForStudent(id, req.user.user_id);
    }
    getOne(id) {
        return this.assessmentsService.getAssessmentForStudent(id);
    }
    startAttempt(id, req) {
        return this.assessmentsService.startAttempt(id, req.user.user_id);
    }
    submitAnswer(attemptId, body, req) {
        return this.assessmentsService.submitAnswer(attemptId, req.user.user_id, body.questionId, body.selectedOptionId, body.answerText);
    }
    logSecurityEvent(attemptId, body, req) {
        return this.assessmentsService.logSecurityEvent(attemptId, req.user.user_id, body.eventType, body.severity, body.metadata);
    }
    submitAttempt(attemptId, req) {
        return this.assessmentsService.submitAttempt(attemptId, req.user.user_id);
    }
};
exports.AssessmentsController = AssessmentsController;
__decorate([
    (0, common_1.Post)('course/:courseId/topic/:topicId/generate'),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('topicId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "generateTopicAssessment", null);
__decorate([
    (0, common_1.Get)('course/:courseId'),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "getByCourse", null);
__decorate([
    (0, common_1.Get)(':id/profile'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(':id/attempts'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "startAttempt", null);
__decorate([
    (0, common_1.Post)('attempts/:attemptId/answers'),
    __param(0, (0, common_1.Param)('attemptId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "submitAnswer", null);
__decorate([
    (0, common_1.Post)('attempts/:attemptId/events'),
    __param(0, (0, common_1.Param)('attemptId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "logSecurityEvent", null);
__decorate([
    (0, common_1.Post)('attempts/:attemptId/submit'),
    __param(0, (0, common_1.Param)('attemptId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "submitAttempt", null);
exports.AssessmentsController = AssessmentsController = __decorate([
    (0, common_1.Controller)('assessments'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [assessments_service_1.AssessmentsService,
        ai_generation_service_1.AiGenerationService])
], AssessmentsController);
//# sourceMappingURL=assessments.controller.js.map