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
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { RegisterRequestDto } from './contracts/dto/register-request.dto';
import { AuthSuccessResponseDto } from './contracts/dto/auth-success-response.dto';
import { RefreshRequestDto } from './contracts/dto/refresh-request.dto';
import { RefreshResponseDto } from './contracts/dto/refresh-response.dto';
import { LogoutRequestDto } from './contracts/dto/logout-request.dto';
import { LogoutResponseDto } from './contracts/dto/logout-response.dto';
import { SetPasswordRequestDto } from './contracts/dto/set-password-request.dto';
import { SetPasswordResponseDto } from './contracts/dto/set-password-response.dto';
import { VerifyQueryDto } from './contracts/dto/verify-query.dto';
import { VerifyResponseDto } from './contracts/dto/verify-response.dto';
import { AuthService } from './services/auth.service';
import { LoginRequestDto } from './contracts/dto/login-request.dto';
import { AuditQueryDto } from './contracts/dto/audit-query.dto';
import { AuditListResponseDto } from './contracts/dto/audit-list-response.dto';
import { GoogleExchangeRequestDto } from './contracts/dto/google-exchange-request.dto';
import { type LoginContext } from './services/auth-login.service';
import { type LogoutContext } from './services/auth-logout.service';
import { type RefreshContext } from './services/auth-refresh.service';
import { type RegisterContext } from './services/auth-register.service';
import { type DisableUserContext } from './services/auth-admin.service';
import { type GoogleExchangeContext } from './services/auth-google-exchange.service';
import { BearerAuthGuard } from './security/guards/bearer-auth.guard';
import { CurrentUser } from './security/decorators/current-user.decorator';
import type { AuthPrincipal } from './security/auth-principal';
import {
  AllowTrustedService,
  Roles,
} from './security/decorators/roles.decorator';
import { RolesGuard } from './security/guards/roles.guard';

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
  @UseGuards(BearerAuthGuard)
  async verify(
    @Query() query: VerifyQueryDto,
    @Req() req: Request,
    @CurrentUser() principal?: AuthPrincipal,
  ): Promise<VerifyResponseDto> {
    const token = principal?.token ?? req.bearerToken;
    if (!token) {
      throw new UnauthorizedException('Missing authorization header');
    }

    return await this.authService.verify({
      token,
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

  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  googleExchange(
    @Body() body: GoogleExchangeRequestDto,
    @Req() req: Request,
  ): Promise<AuthSuccessResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
    } satisfies GoogleExchangeContext;

    return this.authService.googleExchange(body, context);
  }

  @Post('password/set')
  @HttpCode(HttpStatus.OK)
  @UseGuards(BearerAuthGuard)
  setPassword(
    @Body() body: SetPasswordRequestDto,
    @Req() req: Request,
    @CurrentUser() principal?: AuthPrincipal,
  ): Promise<SetPasswordResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: principal?.token ?? req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.setPassword(body, context);
  }

  @Get('audit')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @AllowTrustedService()
  @UseGuards(BearerAuthGuard, RolesGuard)
  listAuditLogs(
    @Query() query: AuditQueryDto,
    @Req() req: Request,
    @CurrentUser() principal?: AuthPrincipal,
  ): Promise<AuditListResponseDto> {
    const context = {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
      bearerToken: principal?.token ?? req.bearerToken,
    } satisfies DisableUserContext;

    return this.authService.listAuditLogs(query, context);
  }
}
