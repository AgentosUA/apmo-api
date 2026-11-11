import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UserService } from './user.service';
import { parseGetProfilePlansQuery } from './user.dto';
import { AuthGuard } from '../auth/auth.guard';
import {
  FILE_MAX_SIZE,
  FileValidation,
} from 'src/shared/utils/file-validation';
import { readString } from 'src/shared/utils/validation';

@Controller('/profile')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  async getProfile(@Req() req) {
    return this.userService.getProfile(req.user.userId as string);
  }

  /**
   * `GET /profile/plans?search=&world=&sort=createdAt|updatedAt|missionName|world&order=asc|desc`
   */
  @Get('/plans')
  async getPlans(@Req() req, @Query() query: Record<string, unknown>) {
    return this.userService.getPlans(
      req.user.userId as string,
      parseGetProfilePlansQuery(query),
    );
  }

  /** Sets an external image URL as the avatar. */
  @Post('/change-avatar')
  async changeAvatar(@Req() req, @Body() body) {
    return this.userService.changeAvatar(
      req.user.userId as string,
      typeof body?.avatar === 'string' ? body.avatar : '',
    );
  }

  /**
   * `multipart/form-data` with an image (JPEG/PNG/GIF/WebP, ≤ 5 MB) in the
   * `avatar` field. Stored in MinIO, static images are converted to webp.
   */
  @Post('/avatar')
  @UseInterceptors(
    // Hard limit for multer; the precise check with a clear message is in FileValidation.
    FileInterceptor('avatar', {
      limits: { fileSize: FILE_MAX_SIZE + 1024, files: 1 },
    }),
  )
  async uploadAvatar(@Req() req, @FileValidation() file: Express.Multer.File) {
    return this.userService.uploadAvatar(req.user.userId as string, file);
  }

  @Delete('/avatar')
  async removeAvatar(@Req() req) {
    return this.userService.removeAvatar(req.user.userId as string);
  }
}

/** Public user lookups (authorized users only). */
@Controller('/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly userService: UserService) {}

  /** `GET /users/search?q=` — by username, excludes the requester. */
  @Get('/search')
  async search(@Req() req, @Query('q') q: unknown) {
    return this.userService.searchUsers(
      readString(q, 'q') ?? '',
      req.user.userId as string,
    );
  }
}
