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
exports.ResourcesController = void 0;
const common_1 = require("@nestjs/common");
const resources_service_1 = require("./resources.service");
const create_resource_dto_1 = require("./dto/create-resource.dto");
const update_resource_dto_1 = require("./dto/update-resource.dto");
const reorder_resources_dto_1 = require("./dto/reorder-resources.dto");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const platform_express_1 = require("@nestjs/platform-express");
let ResourcesController = class ResourcesController {
    resourcesService;
    constructor(resourcesService) {
        this.resourcesService = resourcesService;
    }
    create(topicId, req, createResourceDto, files) {
        const resourceFile = files?.resourceFile?.[0];
        const thumbnailFile = files?.thumbnailFile?.[0];
        return this.resourcesService.create(topicId, req.user.user_id, createResourceDto, resourceFile, thumbnailFile);
    }
    findAllByTopic(topicId) {
        return this.resourcesService.findAllByTopic(topicId);
    }
    reorder(topicId, reorderResourcesDto) {
        return this.resourcesService.reorder(topicId, reorderResourcesDto);
    }
    async proxyResource(url, res) {
        if (!url) {
            return res.status(400).send('URL is required');
        }
        try {
            const response = await fetch(url);
            if (!response.ok) {
                return res.status(response.status).send(`Failed to fetch from S3: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (contentType) {
                res.setHeader('Content-Type', contentType);
            }
            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        }
        catch (error) {
            return res.status(500).send('Proxy error');
        }
    }
    findOne(id) {
        return this.resourcesService.findOne(id);
    }
    update(id, updateResourceDto) {
        return this.resourcesService.update(id, updateResourceDto);
    }
    remove(id) {
        return this.resourcesService.remove(id);
    }
};
exports.ResourcesController = ResourcesController;
__decorate([
    (0, roles_decorator_1.Roles)('SystemAdmin', 'CourseAdmin'),
    (0, common_1.Post)('topics/:topicId/resources'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'resourceFile', maxCount: 1 },
        { name: 'thumbnailFile', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Param)('topicId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, create_resource_dto_1.CreateResourceDto, Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('topics/:topicId/resources'),
    __param(0, (0, common_1.Param)('topicId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "findAllByTopic", null);
__decorate([
    (0, roles_decorator_1.Roles)('SystemAdmin', 'CourseAdmin'),
    (0, common_1.Patch)('topics/:topicId/resources/reorder'),
    __param(0, (0, common_1.Param)('topicId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, reorder_resources_dto_1.ReorderResourcesDto]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "reorder", null);
__decorate([
    (0, common_1.Get)('resources/proxy'),
    __param(0, (0, common_1.Query)('url')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "proxyResource", null);
__decorate([
    (0, common_1.Get)('resources/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)('SystemAdmin', 'CourseAdmin'),
    (0, common_1.Patch)('resources/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_resource_dto_1.UpdateResourceDto]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)('SystemAdmin', 'CourseAdmin'),
    (0, common_1.Delete)('resources/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "remove", null);
exports.ResourcesController = ResourcesController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [resources_service_1.ResourcesService])
], ResourcesController);
//# sourceMappingURL=resources.controller.js.map