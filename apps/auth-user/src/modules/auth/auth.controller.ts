import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { RegisterRequestDto } from './contracts/dto/register-request.dto';
import { AuthSuccessResponseDto } from './contracts/dto/auth-success-response.dto';
import { RefreshRequestDto } from './contracts/dto/refresh-request.dto';
import { RefreshResponseDto } from './contracts/dto/refresh-response.dto';
import { AuthService } from './services/auth.service';

type IncomingHeaders = Request['headers'] & {
  'user-agent'?: string | string[] | undefined;
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

  private readUserAgent(headers: IncomingHeaders): string | null {
    const userAgentHeader = headers['user-agent'];
    if (Array.isArray(userAgentHeader)) {
      return userAgentHeader[0] ?? null;
    }

    return typeof userAgentHeader === 'string' ? userAgentHeader : null;
  }
}
