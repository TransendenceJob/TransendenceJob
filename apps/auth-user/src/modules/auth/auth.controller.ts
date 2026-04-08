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

type IncomingHeaders = Request['headers'] & {
  'user-agent'?: string | string[] | undefined;
  authorization?: string | string[] | undefined;
};

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() body: RegisterRequestDto,
    @Req() req: Request,
  ): Promise<AuthSuccessResponseDto> {
    const requestHeaders = req.headers as IncomingHeaders;

    return this.authService.register(body, {
      ip: req.ip ?? null,
      userAgent: this.readUserAgent(requestHeaders),
      requestId: req.requestId,
      serviceName: req.serviceName,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(
    @Body() body: RefreshRequestDto,
    @Req() req: Request,
  ): Promise<RefreshResponseDto> {
    const requestHeaders = req.headers as IncomingHeaders;

    return this.authService.refresh(body, {
      ip: req.ip ?? null,
      userAgent: this.readUserAgent(requestHeaders),
      requestId: req.requestId,
      serviceName: req.serviceName,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(
    @Body() body: LogoutRequestDto,
    @Req() req: Request,
  ): Promise<LogoutResponseDto> {
    const requestHeaders = req.headers as IncomingHeaders;

    return this.authService.logout(body, {
      ip: req.ip ?? null,
      userAgent: this.readUserAgent(requestHeaders),
      requestId: req.requestId,
      serviceName: req.serviceName,
    });
  }

  @Get('verify')
  verify(
    @Query() query: VerifyQueryDto,
    @Req() req: Request,
  ): Promise<VerifyResponseDto> {
    const requestHeaders = req.headers as IncomingHeaders;

    return this.authService.verify({
      token: this.readBearerToken(requestHeaders),
      audience: query.audience,
    });
  }

  private readUserAgent(headers: IncomingHeaders): string | null {
    const userAgentHeader = headers['user-agent'];
    if (Array.isArray(userAgentHeader)) {
      return userAgentHeader[0] ?? null;
    }

    return typeof userAgentHeader === 'string' ? userAgentHeader : null;
  }

  private readBearerToken(headers: IncomingHeaders): string {
    const authorizationHeader = headers.authorization;
    const rawAuthorization = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;

    if (!rawAuthorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [scheme, token, ...rest] = rawAuthorization.trim().split(/\s+/);
    if (rest.length > 0 || scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    return token;
  }
}
