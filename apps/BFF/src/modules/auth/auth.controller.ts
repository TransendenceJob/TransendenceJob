import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import {
  type AuthMeResponseDto,
  type AuthSuccessResponseDto,
  type GoogleCallbackQueryDto,
  type GoogleExchangeRequestDto,
  type LoginRequestDto,
  type LogoutRequestDto,
  type RefreshRequestDto,
  type RefreshResponseDto,
  type RegisterRequestDto,
  type VerifyResponseDto,
} from './contracts/dto/auth-contracts.dto';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

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

  @Post('google/exchange')
  @HttpCode(200)
  googleExchange(
    @Body() input: GoogleExchangeRequestDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<AuthSuccessResponseDto> {
    return this.authService.googleExchange(input, { requestId });
  }

  @Get('google/start')
  @Redirect()
  googleStart() {
    const url = this.googleAuthService.googleStart();
    return {
      url,
      statusCode: 302,
    };
  }

  @Get('google/callback')
  @Redirect('http://localhost:8080/error', 302)
  async googleCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    const input = {
      code,
      state,
      error,
      errorDescription,
    } satisfies GoogleCallbackQueryDto;

    const url = await this.googleAuthService.googleCallback(input, {
      requestId,
    });

    return {
      url,
      statusCode: 302,
    };
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
