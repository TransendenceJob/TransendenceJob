import { Injectable } from '@nestjs/common';
import { RegisterRequestDto } from '../contracts/dto/register-request.dto';
import { AuthSuccessResponseDto } from '../contracts/dto/auth-success-response.dto';
import { RefreshRequestDto } from '../contracts/dto/refresh-request.dto';
import { RefreshResponseDto } from '../contracts/dto/refresh-response.dto';
import {
  AuthRegisterService,
  type RegisterContext,
} from './auth-register.service';
import {
  AuthRefreshService,
  type RefreshContext,
} from './auth-refresh.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRegisterService: AuthRegisterService,
    private readonly authRefreshService: AuthRefreshService,
  ) {}

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
}
