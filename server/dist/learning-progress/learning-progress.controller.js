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
exports.LearningProgressController = void 0;
const common_1 = require("@nestjs/common");
const learning_progress_service_1 = require("./learning-progress.service");
const start_progress_dto_1 = require("./dto/start-progress.dto");
const update_progress_dto_1 = require("./dto/update-progress.dto");
const passport_1 = require("@nestjs/passport");
let LearningProgressController = class LearningProgressController {
    learningProgressService;
    constructor(learningProgressService) {
        this.learningProgressService = learningProgressService;
    }
    startProgress(req, dto) {
        return this.learningProgressService.startProgress(req.user.user_id, dto);
    }
    updateProgress(req, id, dto) {
        return this.learningProgressService.updateProgress(req.user.user_id, id, dto);
    }
    completeProgress(req, id) {
        return this.learningProgressService.completeProgress(req.user.user_id, id);
    }
    getCourseProgress(req, courseId) {
        return this.learningProgressService.getCourseProgress(req.user.user_id, courseId);
    }
    getTopicProgress(req, topicId) {
        return this.learningProgressService.getTopicProgress(req.user.user_id, topicId);
    }
    getProgressByTopicResources(req, topicId) {
        return this.learningProgressService.getProgressByTopicResources(req.user.user_id, topicId);
    }
    getMyActivities(req) {
        return this.learningProgressService.getMyActivities(req.user.user_id);
    }
};
exports.LearningProgressController = LearningProgressController;
__decorate([
    (0, common_1.Post)('start'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_progress_dto_1.StartProgressDto]),
    __metadata("design:returntype", void 0)
], LearningProgressController.prototype, "startProgress", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_progress_dto_1.UpdateProgressDto]),
    __metadata("design:returntype", void 0)
], LearningProgressController.prototype, "updateProgress", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], LearningProgressController.prototype, "completeProgress", null);
__decorate([
    (0, common_1.Get)('courses/:courseId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], LearningProgressController.prototype, "getCourseProgress", null);
__decorate([
    (0, common_1.Get)('topics/:topicId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('topicId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], LearningProgressController.prototype, "getTopicProgress", null);
__decorate([
    (0, common_1.Get)('topics/:topicId/resources'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('topicId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], LearningProgressController.prototype, "getProgressByTopicResources", null);
__decorate([
    (0, common_1.Get)('../learning-activities/me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LearningProgressController.prototype, "getMyActivities", null);
exports.LearningProgressController = LearningProgressController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('learning-progress'),
    __metadata("design:paramtypes", [learning_progress_service_1.LearningProgressService])
], LearningProgressController);
//# sourceMappingURL=learning-progress.controller.js.map