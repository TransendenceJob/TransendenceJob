import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { RegisterRequestDto } from './contracts/dto/register-request.dto';
import { AuthSuccessResponseDto } from './contracts/dto/auth-success-response.dto';
import { RefreshRequestDto } from './contracts/dto/refresh-request.dto';
import { RefreshResponseDto } from './contracts/dto/refresh-response.dto';
import { LogoutRequestDto } from './contracts/dto/logout-request.dto';
import { LogoutResponseDto } from './contracts/dto/logout-response.dto';
import { VerifyQueryDto } from './contracts/dto/verify-query.dto';
import { VerifyResponseDto } from './contracts/dto/verify-response.dto';
import { AuthService } from './services/auth.service';
import { LoginRequestDto } from './contracts/dto/login-request.dto';
import { AuditQueryDto } from './contracts/dto/audit-query.dto';
import { AuditListResponseDto } from './contracts/dto/audit-list-response.dto';
import { type LoginContext } from './services/auth-login.service';
import { type LogoutContext } from './services/auth-logout.service';
import { type RefreshContext } from './services/auth-refresh.service';
import { type RegisterContext } from './services/auth-register.service';
import { type DisableUserContext } from './services/auth-admin.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() body: RegisterRequestDto,
    @Req() req: Request,
  ): Promise<AuthSuccessResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
    } satisfies RegisterContext;

    return this.authService.register(body, context);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(
    @Body() body: RefreshRequestDto,
    @Req() req: Request,
  ): Promise<RefreshResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
    } satisfies RefreshContext;

    return this.authService.refresh(body, context);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(
    @Body() body: LogoutRequestDto,
    @Req() req: Request,
  ): Promise<LogoutResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
    } satisfies LogoutContext;

    return this.authService.logout(body, context);
  }

  @Get('verify')
  async verify(
    @Query() query: VerifyQueryDto,
    @Req() req: Request,
  ): Promise<VerifyResponseDto> {
    if (!req.bearerToken) {
      throw new UnauthorizedException('Missing authorization header');
    }

    return await this.authService.verify({
      token: req.bearerToken,
      audience: query.audience,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() body: LoginRequestDto,
    @Req() req: Request,
  ): Promise<AuthSuccessResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
    } satisfies LoginContext;

    return this.authService.login(body, context);
  }

  @Get('audit')
  @HttpCode(HttpStatus.OK)
  listAuditLogs(
    @Query() query: AuditQueryDto,
    @Req() req: Request,
  ): Promise<AuditListResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.listAuditLogs(query, context);
  }
}
