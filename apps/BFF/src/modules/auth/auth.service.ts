import {
  BadGatewayException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import {
  type ApiErrorDto,
  type AuthMeResponseDto,
  type AuthSuccessResponseDto,
  type InternalAuthSuccessResponse,
  type InternalLogoutResponse,
  type InternalRefreshResponse,
  type InternalVerifyResponse,
  type LoginRequestDto,
  type LogoutRequestDto,
  type RefreshRequestDto,
  type RefreshResponseDto,
  type RegisterRequestDto,
  type VerifyResponseDto,
} from './contracts/dto/auth-contracts.dto';
import { AuthContractMapper } from './contracts/mappers/auth-contract.mapper';
import { BffConfigService } from '../config/bff-config.service';

type RequestContext = {
  requestId?: string;
  authorization?: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly config: BffConfigService) {}

  async register(
    input: RegisterRequestDto,
    context: RequestContext,
  ): Promise<AuthSuccessResponseDto> {
    const response = await this.callAuthService<InternalAuthSuccessResponse>({
      method: 'POST',
      path: '/internal/auth/register',
      data: input,
      context,
    });

    return AuthContractMapper.toAuthSuccess(response);
  }

  async login(
    input: LoginRequestDto,
    context: RequestContext,
  ): Promise<AuthSuccessResponseDto> {
    const response = await this.callAuthService<InternalAuthSuccessResponse>({
      method: 'POST',
      path: '/internal/auth/login',
      data: input,
      context,
    });

    return AuthContractMapper.toAuthSuccess(response);
  }

  async logout(
    input: LogoutRequestDto,
    context: RequestContext,
  ): Promise<ReturnType<typeof AuthContractMapper.toLogoutResponse>> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<InternalLogoutResponse>({
      method: 'POST',
      path: '/internal/auth/logout',
      data: input,
      context,
    });

    return AuthContractMapper.toLogoutResponse(response);
  }

  async refresh(
    input: RefreshRequestDto,
    context: RequestContext,
  ): Promise<RefreshResponseDto> {
    const response = await this.callAuthService<InternalRefreshResponse>({
      method: 'POST',
      path: '/internal/auth/refresh',
      data: input,
      context,
    });

    return AuthContractMapper.toRefreshResponse(response);
  }

  async verify(context: RequestContext): Promise<VerifyResponseDto> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<InternalVerifyResponse>({
      method: 'GET',
      path: '/internal/auth/verify',
      context,
    });

    return AuthContractMapper.toVerifyResponse(response);
  }

  async me(context: RequestContext): Promise<AuthMeResponseDto> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<InternalVerifyResponse>({
      method: 'GET',
      path: '/internal/auth/verify',
      context,
    });

    return AuthContractMapper.toMeResponse(response);
  }

  private ensureAuthorization(authorization?: string): void {
    if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException({
        code: 'missing_bearer_token',
        message: 'Authorization header with Bearer token is required.',
      } satisfies ApiErrorDto);
    }
  }

  private async callAuthService<T>(input: {
    method: 'GET' | 'POST';
    path: string;
    context: RequestContext;
    data?: unknown;
  }): Promise<T> {
    const headers: Record<string, string> = {
      'x-service-name': 'bff',
    };

    if (input.context.requestId) {
      headers['x-request-id'] = input.context.requestId;
    }

    if (input.context.authorization) {
      headers.authorization = input.context.authorization;
    }

    try {
      const response = await axios.request<T>({
        method: input.method,
        url: `${this.config.auth.serviceUrl}${input.path}`,
        headers,
        data: input.data,
      });
      return response.data;
    } catch (error) {
      this.throwNormalizedError(error);
    }
  }

  private throwNormalizedError(error: unknown): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data: unknown = error.response?.data;
      const message = this.extractErrorMessage(data) ?? error.message;

      throw new HttpException(
        {
          code: `auth_service_${status ?? 'error'}`,
          message,
          details: data,
        } satisfies ApiErrorDto,
        status ?? 502,
      );
    }

    throw new BadGatewayException({
      code: 'auth_service_unreachable',
      message: 'Unable to reach auth service.',
      details: error,
    } satisfies ApiErrorDto);
  }

  private extractErrorMessage(data: unknown): string | null {
    if (!data || typeof data !== 'object' || !('message' in data)) {
      return null;
    }

    const message = (data as { message?: unknown }).message;
    return typeof message === 'string' ? message : null;
  }
}
