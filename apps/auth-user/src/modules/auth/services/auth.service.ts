import { Injectable } from '@nestjs/common';
import { RegisterRequestDto } from '../contracts/dto/register-request.dto';
import { AuthSuccessResponseDto } from '../contracts/dto/auth-success-response.dto';
import {
  AuthRegisterService,
  type RegisterContext,
} from './auth-register.service';

@Injectable()
export class AuthService {
  constructor(private readonly authRegisterService: AuthRegisterService) {}

  register(
    input: RegisterRequestDto,
    context: RegisterContext,
  ): Promise<AuthSuccessResponseDto> {
    return this.authRegisterService.register(input, context);
  }
}
