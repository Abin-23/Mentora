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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTopicDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateTopicDto {
    topic_title;
    topic_description;
    learning_objectives;
    difficulty_level;
    estimated_duration;
    status;
}
exports.CreateTopicDto = CreateTopicDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTopicDto.prototype, "topic_title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTopicDto.prototype, "topic_description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTopicDto.prototype, "learning_objectives", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DifficultyLevel),
    __metadata("design:type", String)
], CreateTopicDto.prototype, "difficulty_level", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTopicDto.prototype, "estimated_duration", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CourseStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTopicDto.prototype, "status", void 0);
//# sourceMappingURL=create-topic.dto.js.map