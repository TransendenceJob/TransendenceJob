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

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() body: RegisterRequestDto,
    @Req() req: Request,
  ): Promise<AuthSuccessResponseDto> {
    return this.authService.register(body, {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
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
    return this.authService.refresh(body, {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
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
    return this.authService.logout(body, {
      ip: req.ip ?? null,
      userAgent: req.userAgent ?? null,
      requestId: req.requestId,
      serviceName: req.serviceName,
    });
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
  async login(@Body() loginDto: LoginRequestDto) {
    return this.authService.login(loginDto.email, LoginDto.password);
  }
}
