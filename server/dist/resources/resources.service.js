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
exports.ResourcesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_s3_1 = require("@aws-sdk/client-s3");
let ResourcesService = class ResourcesService {
    prisma;
    s3Client;
    bucketName = process.env.AWS_BUCKET_NAME || 'mentora-assets';
    region = process.env.AWS_REGION || 'us-east-1';
    constructor(prisma) {
        this.prisma = prisma;
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }
    getS3Url(key) {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
    extractKeyFromUrl(url) {
        const s3Domain = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/`;
        if (url.startsWith(s3Domain)) {
            return url.replace(s3Domain, '');
        }
        return null;
    }
    async deleteFromS3(url) {
        const key = this.extractKeyFromUrl(url);
        if (!key)
            return;
        try {
            await this.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
        }
        catch (err) {
            console.error(`Failed to delete S3 object: ${key}`, err);
        }
    }
    async create(topicId, userId, createResourceDto, resourceFile, thumbnailFile) {
        if (!resourceFile &&
            createResourceDto.resource_type !== 'LINK' &&
            !createResourceDto.link_url) {
            throw new common_1.BadRequestException('Resource file or link URL is required.');
        }
        let finalResourceKey = createResourceDto.link_url || '';
        let fileSize = 0;
        if (resourceFile) {
            const ext = resourceFile.originalname.split('.').pop();
            const resourceKey = `course-resources/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            fileSize = resourceFile.size;
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: resourceKey,
                Body: resourceFile.buffer,
                ContentType: resourceFile.mimetype,
            }));
            finalResourceKey = this.getS3Url(resourceKey);
        }
        let finalThumbnailKey = null;
        if (thumbnailFile) {
            const ext = thumbnailFile.originalname.split('.').pop();
            const thumbnailKey = `course-thumbnails/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: thumbnailKey,
                Body: thumbnailFile.buffer,
                ContentType: thumbnailFile.mimetype,
            }));
            finalThumbnailKey = this.getS3Url(thumbnailKey);
        }
        const maxSeq = await this.prisma.resource.aggregate({
            where: { topic_id: topicId },
            _max: { sequence_number: true },
        });
        const nextSeq = (maxSeq._max.sequence_number || 0) + 1;
        const { link_url, ...dataToInsert } = createResourceDto;
        return this.prisma.resource.create({
            data: {
                ...dataToInsert,
                topic_id: topicId,
                uploaded_by: userId,
                sequence_number: nextSeq,
                resource_key: finalResourceKey,
                thumbnail_key: finalThumbnailKey,
                file_size: fileSize > 0 ? fileSize : null,
            },
        });
    }
    async findAllByTopic(topicId) {
        return this.prisma.resource.findMany({
            where: { topic_id: topicId },
            orderBy: { sequence_number: 'asc' },
        });
    }
    async findOne(id) {
        const resource = await this.prisma.resource.findUnique({
            where: { resource_id: id },
        });
        if (!resource) {
            throw new common_1.NotFoundException(`Resource with ID ${id} not found`);
        }
        return resource;
    }
    async update(id, updateResourceDto) {
        await this.findOne(id);
        const { link_url, ...dataToUpdate } = updateResourceDto;
        if (link_url) {
            dataToUpdate.resource_key = link_url;
        }
        return this.prisma.resource.update({
            where: { resource_id: id },
            data: dataToUpdate,
        });
    }
    async remove(id) {
        const resource = await this.findOne(id);
        if (resource.resource_key) {
            await this.deleteFromS3(resource.resource_key);
        }
        if (resource.thumbnail_key) {
            await this.deleteFromS3(resource.thumbnail_key);
        }
        return this.prisma.resource.delete({
            where: { resource_id: id },
        });
    }
    async reorder(topicId, reorderDto) {
        const updates = reorderDto.resources.map((res) => this.prisma.resource.update({
            where: { resource_id: res.resource_id },
            data: { sequence_number: res.sequence_number },
        }));
        await this.prisma.$transaction(updates);
        return { success: true, message: 'Resources reordered successfully' };
    }
};
exports.ResourcesService = ResourcesService;
exports.ResourcesService = ResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResourcesService);
//# sourceMappingURL=resources.service.js.map