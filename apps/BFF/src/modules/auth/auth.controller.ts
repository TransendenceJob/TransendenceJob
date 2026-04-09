import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import {
  type AuthMeResponseDto,
  type AuthSuccessResponseDto,
  type LoginRequestDto,
  type LogoutRequestDto,
  type RefreshRequestDto,
  type RefreshResponseDto,
  type RegisterRequestDto,
  type VerifyResponseDto,
} from './contracts/dto/auth-contracts.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() input: RegisterRequestDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<AuthSuccessResponseDto> {
    return this.authService.register(input, { requestId });
  }

  @Post('login')
  @HttpCode(200)
  login(
    @Body() input: LoginRequestDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<AuthSuccessResponseDto> {
    return this.authService.login(input, { requestId });
  }

  @Post('logout')
  @HttpCode(200)
  logout(
    @Body() input: LogoutRequestDto,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.logout(input, { requestId, authorization });
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(
    @Body() input: RefreshRequestDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<RefreshResponseDto> {
    return this.authService.refresh(input, { requestId });
  }

  @Get('verify')
  verify(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ): Promise<VerifyResponseDto> {
    return this.authService.verify({ requestId, authorization });
  }

  @Get('me')
  me(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ): Promise<AuthMeResponseDto> {
    return this.authService.me({ requestId, authorization });
  }
}
