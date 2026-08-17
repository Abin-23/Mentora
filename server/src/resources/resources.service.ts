import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ReorderResourcesDto } from './dto/reorder-resources.dto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class ResourcesService {
  private s3Client: S3Client;
  private bucketName = process.env.AWS_BUCKET_NAME || 'mentora-assets';
  private region = process.env.AWS_REGION || 'us-east-1';

  constructor(private readonly prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  private getS3Url(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private extractKeyFromUrl(url: string): string | null {
    const s3Domain = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/`;
    if (url.startsWith(s3Domain)) {
      return url.replace(s3Domain, '');
    }
    return null;
  }

  async getPresignedUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      // URL valid for 12 hours
      return await getSignedUrl(this.s3Client, command, { expiresIn: 43200 });
    } catch (err) {
      console.error(`Failed to generate presigned URL for ${key}`, err);
      return this.getS3Url(key);
    }
  }

  async signResources(resources: any[]) {
    return Promise.all(
      resources.map(async (res) => {
        if (res.resource_key) {
          const key = this.extractKeyFromUrl(res.resource_key);
          if (key) {
            const signedUrl = await this.getPresignedUrl(key);
            return { ...res, resource_key: signedUrl };
          }
        }
        return res;
      })
    );
  }

  private async deleteFromS3(url: string) {
    const key = this.extractKeyFromUrl(url);
    if (!key) return;
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }),
      );
    } catch (err) {
      console.error(`Failed to delete S3 object: ${key}`, err);
    }
  }

  async create(
    topicId: number,
    userId: number,
    createResourceDto: CreateResourceDto,
    resourceFile?: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ) {
    if (
      !resourceFile &&
      createResourceDto.resource_type !== 'LINK' &&
      !createResourceDto.link_url
    ) {
      throw new BadRequestException('Resource file or link URL is required.');
    }

    let finalResourceKey = createResourceDto.link_url || '';
    let fileSize = 0;

    if (resourceFile) {
      const ext = resourceFile.originalname.split('.').pop();
      const resourceKey = `course-resources/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      fileSize = resourceFile.size;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: resourceKey,
          Body: resourceFile.buffer,
          ContentType: resourceFile.mimetype,
        }),
      );
      finalResourceKey = this.getS3Url(resourceKey);
    }

    let finalThumbnailKey = null;
    if (thumbnailFile) {
      const ext = thumbnailFile.originalname.split('.').pop();
      const thumbnailKey = `course-thumbnails/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: thumbnailKey,
          Body: thumbnailFile.buffer,
          ContentType: thumbnailFile.mimetype,
        }),
      );
      finalThumbnailKey = this.getS3Url(thumbnailKey);
    }

    const maxSeq = await this.prisma.resource.aggregate({
      where: { topic_id: topicId },
      _max: { sequence_number: true },
    });
    const nextSeq = (maxSeq._max.sequence_number || 0) + 1;

    // We don't want to insert link_url directly into db as it's not a field,
    // it's mapped to resource_key. So we remove it from dto for prisma.
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

  async findAllByTopic(topicId: number) {
    return this.prisma.resource.findMany({
      where: { topic_id: topicId },
      orderBy: { sequence_number: 'asc' },
    });
  }

  async findOne(id: number) {
    const resource = await this.prisma.resource.findUnique({
      where: { resource_id: id },
    });
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    return resource;
  }

  async update(id: number, updateResourceDto: UpdateResourceDto) {
    await this.findOne(id);
    const { link_url, ...dataToUpdate } = updateResourceDto;

    // if link_url is provided, it replaces the resource_key
    if (link_url) {
      (dataToUpdate as any).resource_key = link_url;
    }

    return this.prisma.resource.update({
      where: { resource_id: id },
      data: dataToUpdate,
    });
  }

  async remove(id: number) {
    const resource = await this.findOne(id);

    // Delete files from S3 if they are stored there
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

  async reorder(topicId: number, reorderDto: ReorderResourcesDto) {
    const updates = reorderDto.resources.map((res) =>
      this.prisma.resource.update({
        where: { resource_id: res.resource_id },
        data: { sequence_number: res.sequence_number },
      }),
    );
    await this.prisma.$transaction(updates);
    return { success: true, message: 'Resources reordered successfully' };
  }
}
