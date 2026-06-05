import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './services/auth.service';
import { DisableUserRequestDto } from './contracts/dto/disable-user-request.dto';
import { EnableUserRequestDto } from './contracts/dto/enable-user-request.dto';
import { SetUserRolesRequestDto } from './contracts/dto/set-user-roles-request.dto';
import { UserIdParamDto } from './contracts/dto/user-id-param.dto';
import { RevokeSessionsRequestDto } from './contracts/dto/revoke-sessions-request.dto';
import { RevokeSessionsResponseDto } from './contracts/dto/revoke-sessions-response.dto';
import { UserDisabledResponseDto } from './contracts/dto/user-disabled-response.dto';
import { UserEnabledResponseDto } from './contracts/dto/user-enabled-response.dto';
import { UserRolesResponseDto } from './contracts/dto/user-roles-response.dto';
import { UserDetailResponseDto } from './contracts/dto/user-detail-response.dto';
import { UserSearchQueryDto } from './contracts/dto/user-search-query.dto';
import { UserSearchResponseDto } from './contracts/dto/user-search-response.dto';
import { type DisableUserContext } from './services/auth-admin.service';
import {
  Roles,
  AllowTrustedService,
} from './security/decorators/roles.decorator';
import { BearerAuthGuard } from './security/guards/bearer-auth.guard';
import { RolesGuard } from './security/guards/roles.guard';
import { CurrentUser } from './security/decorators/current-user.decorator';
import type { AuthPrincipal } from './security/auth-principal';

@Controller('users')
@Roles('ADMIN')
@AllowTrustedService()
@UseGuards(BearerAuthGuard, RolesGuard)
export class AuthAdminController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  searchUsers(
    @Query() query: UserSearchQueryDto,
    @Req() req: Request,
    @CurrentUser() principal?: AuthPrincipal,
  ): Promise<UserSearchResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: principal?.token ?? req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.searchUsers(query, context);
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  getUser(
    @Param() params: UserIdParamDto,
    @Req() req: Request,
    @CurrentUser() principal?: AuthPrincipal,
  ): Promise<UserDetailResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: principal?.token ?? req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.getUser(params.userId, context);
  }

  @Post(':userId/disable')
  @HttpCode(HttpStatus.OK)
  disableUser(
    @Param() params: UserIdParamDto,
    @Body() body: DisableUserRequestDto,
    @Req() req: Request,
    @CurrentUser() principal?: AuthPrincipal,
  ): Promise<UserDisabledResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: principal?.token ?? req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.disableUser(params.userId, body, context);
  }

  @Post(':userId/enable')
  @HttpCode(HttpStatus.OK)
  enableUser(
    @Param() params: UserIdParamDto,
    @Body() body: EnableUserRequestDto,
    @Req() req: Request,
    @CurrentUser() principal?: AuthPrincipal,
  ): Promise<UserEnabledResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: principal?.token ?? req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.enableUser(params.userId, body, context);
  }

  @Post(':userId/role')
  @HttpCode(HttpStatus.OK)
  setUserRoles(
    @Param() params: UserIdParamDto,
    @Body() body: SetUserRolesRequestDto,
    @Req() req: Request,
    @CurrentUser() principal?: AuthPrincipal,
  ): Promise<UserRolesResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: principal?.token ?? req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.setUserRoles(params.userId, body, context);
  }

  @Post(':userId/sessions/revoke')
  @HttpCode(HttpStatus.OK)
  revokeUserSessions(
    @Param() params: UserIdParamDto,
    @Body() body: RevokeSessionsRequestDto,
    @Req() req: Request,
    @CurrentUser() principal?: AuthPrincipal,
  ): Promise<RevokeSessionsResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: principal?.token ?? req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.revokeUserSessions(params.userId, body, context);
  }
}
