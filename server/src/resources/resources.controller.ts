import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ReorderResourcesDto } from './dto/reorder-resources.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Roles('SystemAdmin', 'CourseAdmin')
  @Post('topics/:topicId/resources')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'resourceFile', maxCount: 1 },
      { name: 'thumbnailFile', maxCount: 1 },
    ]),
  )
  create(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Req() req: any,
    @Body() createResourceDto: CreateResourceDto,
    @UploadedFiles()
    files: {
      resourceFile?: Express.Multer.File[];
      thumbnailFile?: Express.Multer.File[];
    },
  ) {
    const resourceFile = files?.resourceFile?.[0];
    const thumbnailFile = files?.thumbnailFile?.[0];
    return this.resourcesService.create(
      topicId,
      req.user.user_id,
      createResourceDto,
      resourceFile,
      thumbnailFile,
    );
  }

  @Get('topics/:topicId/resources')
  findAllByTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.resourcesService.findAllByTopic(topicId);
  }

  @Roles('SystemAdmin', 'CourseAdmin')
  @Patch('topics/:topicId/resources/reorder')
  reorder(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() reorderResourcesDto: ReorderResourcesDto,
  ) {
    return this.resourcesService.reorder(topicId, reorderResourcesDto);
  }

  @Get('resources/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.findOne(id);
  }

  @Roles('SystemAdmin', 'CourseAdmin')
  @Patch('resources/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Roles('SystemAdmin', 'CourseAdmin')
  @Delete('resources/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.remove(id);
  }
}
