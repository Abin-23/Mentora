"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveLearningModule = void 0;
const common_1 = require("@nestjs/common");
const adaptive_learning_controller_1 = require("./adaptive-learning.controller");
const adaptive_learning_service_1 = require("./adaptive-learning.service");
const neo4j_module_1 = require("../neo4j/neo4j.module");
const prisma_module_1 = require("../prisma/prisma.module");
const resources_module_1 = require("../resources/resources.module");
let AdaptiveLearningModule = class AdaptiveLearningModule {
};
exports.AdaptiveLearningModule = AdaptiveLearningModule;
exports.AdaptiveLearningModule = AdaptiveLearningModule = __decorate([
    (0, common_1.Module)({
        imports: [neo4j_module_1.Neo4jModule, prisma_module_1.PrismaModule, resources_module_1.ResourcesModule],
        controllers: [adaptive_learning_controller_1.AdaptiveLearningController],
        providers: [adaptive_learning_service_1.AdaptiveLearningService],
        exports: [adaptive_learning_service_1.AdaptiveLearningService],
    })
], AdaptiveLearningModule);
//# sourceMappingURL=adaptive-learning.module.js.map