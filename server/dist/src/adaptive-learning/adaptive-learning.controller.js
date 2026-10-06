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
exports.AdaptiveLearningController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const adaptive_learning_service_1 = require("./adaptive-learning.service");
const adaptive_learning_dto_1 = require("./dto/adaptive-learning.dto");
let AdaptiveLearningController = class AdaptiveLearningController {
    adaptiveLearningService;
    constructor(adaptiveLearningService) {
        this.adaptiveLearningService = adaptiveLearningService;
    }
    async generatePath(studentId, courseId, dto) {
        return this.adaptiveLearningService.generatePath(studentId, courseId, dto);
    }
    async getPath(studentId, courseId) {
        return this.adaptiveLearningService.generatePath(studentId, courseId, { limit: 5 });
    }
    async getStudentDashboard(req, courseId) {
        return this.adaptiveLearningService.getStudentDashboard(req.user.user_id, courseId);
    }
    async getPersonalizedLesson(studentId, courseId, topicId) {
        return this.adaptiveLearningService.generatePersonalizedLesson(studentId, courseId, topicId);
    }
    async getDiagnostics(req, studentId, courseId, topicId) {
        if (req.user.role !== 'SystemAdmin' && req.user.role !== 'CourseAdmin') {
            throw new common_1.UnauthorizedException('Only administrators can access diagnostic data.');
        }
        return this.adaptiveLearningService.getDiagnostics(studentId, courseId, topicId);
    }
    async getStudentGoals(req, courseId) {
        return this.adaptiveLearningService.getStudentGoals(req.user.user_id, courseId);
    }
    async createStudentGoal(req, courseId, body) {
        return this.adaptiveLearningService.createStudentGoal(req.user.user_id, courseId, body);
    }
    async askTutor(req, courseId, body) {
        const studentId = typeof req.user.user_id === 'string' ? parseInt(req.user.user_id, 10) : req.user.user_id;
        return this.adaptiveLearningService.askTutor(studentId, courseId, body);
    }
};
exports.AdaptiveLearningController = AdaptiveLearningController;
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Param)('studentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, adaptive_learning_dto_1.GeneratePathDto]),
    __metadata("design:returntype", Promise)
], AdaptiveLearningController.prototype, "generatePath", null);
__decorate([
    (0, common_1.Get)('path'),
    __param(0, (0, common_1.Param)('studentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdaptiveLearningController.prototype, "getPath", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AdaptiveLearningController.prototype, "getStudentDashboard", null);
__decorate([
    (0, common_1.Get)('topics/:topicId/lesson'),
    __param(0, (0, common_1.Param)('studentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('topicId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], AdaptiveLearningController.prototype, "getPersonalizedLesson", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('topics/:topicId/diagnostics'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('studentId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Param)('topicId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], AdaptiveLearningController.prototype, "getDiagnostics", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('goals'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AdaptiveLearningController.prototype, "getStudentGoals", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('goals'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], AdaptiveLearningController.prototype, "createStudentGoal", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('tutor'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], AdaptiveLearningController.prototype, "askTutor", null);
exports.AdaptiveLearningController = AdaptiveLearningController = __decorate([
    (0, common_1.Controller)('adaptive-learning/students/:studentId/courses/:courseId'),
    __metadata("design:paramtypes", [adaptive_learning_service_1.AdaptiveLearningService])
], AdaptiveLearningController);
//# sourceMappingURL=adaptive-learning.controller.js.map