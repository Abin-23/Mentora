import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.usersService.getProfile(req.user.user_id);
  }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() updateDto: UpdateProfileDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.usersService.updateProfile(req.user.user_id, updateDto);
  }

  @Patch('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.usersService.changePassword(req.user.user_id, dto);
  }

  @Post('profile/picture')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePicture(
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'File is too large. Max size is 5MB.',
          }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.usersService.uploadProfilePicture(req.user.user_id, file);
  }

  @Delete('profile/picture')
  removeProfilePicture(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.usersService.removeProfilePicture(req.user.user_id);
  }

  @Get()
  @Roles(Role.SystemAdmin, Role.CourseAdmin)
  getAllUsers(@Query('role') role?: Role) {
    return this.usersService.getAllUsers(role);
  }

  @Patch(':id/status')
  @Roles(Role.SystemAdmin)
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.usersService.updateUserStatus(id, dto);
  }

  @Post('admin')
  @Roles(Role.SystemAdmin)
  createCourseAdmin(@Body() dto: CreateAdminDto) {
    return this.usersService.createCourseAdmin(dto);
  }
}
