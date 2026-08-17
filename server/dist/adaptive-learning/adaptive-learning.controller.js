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
exports.AdaptiveLearningController = AdaptiveLearningController = __decorate([
    (0, common_1.Controller)('adaptive-learning/students/:studentId/courses/:courseId'),
    __metadata("design:paramtypes", [adaptive_learning_service_1.AdaptiveLearningService])
], AdaptiveLearningController);
//# sourceMappingURL=adaptive-learning.controller.js.map