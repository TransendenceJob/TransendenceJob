import { Injectable } from '@nestjs/common';
import { RegisterRequestDto } from '../contracts/dto/register-request.dto';
import { AuthSuccessResponseDto } from '../contracts/dto/auth-success-response.dto';
import { RefreshRequestDto } from '../contracts/dto/refresh-request.dto';
import { RefreshResponseDto } from '../contracts/dto/refresh-response.dto';
import { LogoutRequestDto } from '../contracts/dto/logout-request.dto';
import { LogoutResponseDto } from '../contracts/dto/logout-response.dto';
import { VerifyResponseDto } from '../contracts/dto/verify-response.dto';
import { LoginRequestDto } from '../contracts/dto/login-request.dto';
import { DisableUserRequestDto } from '../contracts/dto/disable-user-request.dto';
import { UserDisabledResponseDto } from '../contracts/dto/user-disabled-response.dto';
import {
  AuthRegisterService,
  type RegisterContext,
} from './auth-register.service';
import {
  AuthRefreshService,
  type RefreshContext,
} from './auth-refresh.service';
import { AuthLogoutService, type LogoutContext } from './auth-logout.service';
import { AuthVerifyService, type VerifyInput } from './auth-verify.service';
import { AuthLoginService, type LoginContext } from './auth-login.service';
import {
  AuthAdminService,
  type DisableUserContext,
} from './auth-admin.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRegisterService: AuthRegisterService,
    private readonly authRefreshService: AuthRefreshService,
    private readonly authLogoutService: AuthLogoutService,
    private readonly authVerifyService: AuthVerifyService,
    private readonly authLoginService: AuthLoginService,
    private readonly authAdminService: AuthAdminService,
  ) {}

  login(
    input: LoginRequestDto,
    context: LoginContext,
  ): Promise<AuthSuccessResponseDto> {
    return this.authLoginService.login(input, context);
  }

  register(
    input: RegisterRequestDto,
    context: RegisterContext,
  ): Promise<AuthSuccessResponseDto> {
    return this.authRegisterService.register(input, context);
  }

  refresh(
    input: RefreshRequestDto,
    context: RefreshContext,
  ): Promise<RefreshResponseDto> {
    return this.authRefreshService.refresh(input, context);
  }

  logout(
    input: LogoutRequestDto,
    context: LogoutContext,
  ): Promise<LogoutResponseDto> {
    return this.authLogoutService.logout(input, context);
  }

  verify(input: VerifyInput): Promise<VerifyResponseDto> {
    return this.authVerifyService.verify(input);
  }

  disableUser(
    userId: string,
    input: DisableUserRequestDto,
    context: DisableUserContext,
  ): Promise<UserDisabledResponseDto> {
    return this.authAdminService.disableUser(userId, input, context);
  }
}
