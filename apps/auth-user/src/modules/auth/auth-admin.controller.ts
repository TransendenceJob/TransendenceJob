import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './services/auth.service';
import { DisableUserRequestDto } from './contracts/dto/disable-user-request.dto';
import { SetUserRolesRequestDto } from './contracts/dto/set-user-roles-request.dto';
import { UserIdParamDto } from './contracts/dto/user-id-param.dto';
import { UserDisabledResponseDto } from './contracts/dto/user-disabled-response.dto';
import { UserRolesResponseDto } from './contracts/dto/user-roles-response.dto';
import { type DisableUserContext } from './services/auth-admin.service';

@Controller('users')
export class AuthAdminController {
  constructor(private readonly authService: AuthService) {}

  @Post(':userId/disable')
  @HttpCode(HttpStatus.OK)
  disableUser(
    @Param() params: UserIdParamDto,
    @Body() body: DisableUserRequestDto,
    @Req() req: Request,
  ): Promise<UserDisabledResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.disableUser(params.userId, body, context);
  }

  @Post(':userId/role')
  @HttpCode(HttpStatus.OK)
  setUserRoles(
    @Param() params: UserIdParamDto,
    @Body() body: SetUserRolesRequestDto,
    @Req() req: Request,
  ): Promise<UserRolesResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.setUserRoles(params.userId, body, context);
  }
}
