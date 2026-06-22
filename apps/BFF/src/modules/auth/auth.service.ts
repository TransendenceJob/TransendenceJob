import {
  BadGatewayException,
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import {
  type ApiErrorDto,
  type AuthMeResponseDto,
  type AuthSuccessResponseDto,
  type GoogleExchangeRequestDto,
  type InternalAuthSuccessResponse,
  type InternalLogoutResponse,
  type InternalSetPasswordResponse,
  type InternalRefreshResponse,
  type InternalVerifyResponse,
  type LoginRequestDto,
  type LogoutRequestDto,
  type RefreshRequestDto,
  type RefreshResponseDto,
  type RegisterRequestDto,
  type SetPasswordRequestDto,
  type SetPasswordResponseDto,
  type VerifyResponseDto,
  type DisableUserRequestDto,
  type SetUserRolesRequestDto,
  type RevokeSessionsRequestDto,
  type EnableUserRequestDto,
  type UserDisabledResponseDto,
  type UserEnabledResponseDto,
  type UserRolesResponseDto,
  type RevokeSessionsResponseDto,
  type UserSearchQueryDto,
  type UserSearchResponseDto,
  type UserDetailResponseDto,
  type AuditQueryDto,
  type AuditListResponseDto,
  type UpdatePlayerStatsDto,
  type PlayerStatsDto,
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

  async googleExchange(
    input: GoogleExchangeRequestDto,
    context: RequestContext,
  ): Promise<AuthSuccessResponseDto> {
    const response = await this.callAuthService<InternalAuthSuccessResponse>({
      method: 'POST',
      path: '/internal/auth/google/exchange',
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

  async setPassword(
    input: SetPasswordRequestDto,
    context: RequestContext,
  ): Promise<SetPasswordResponseDto> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<InternalSetPasswordResponse>({
      method: 'POST',
      path: '/internal/auth/password/set',
      data: input,
      context,
    });

    return {
      success: true,
    } satisfies SetPasswordResponseDto;
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

  async disableUser(
    userId: string,
    input: DisableUserRequestDto,
    context: RequestContext,
  ): Promise<UserDisabledResponseDto> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<UserDisabledResponseDto>({
      method: 'POST',
      path: `/internal/auth/users/${encodeURIComponent(userId)}/disable`,
      data: input,
      context,
    });

    return response;
  }

  async enableUser(
    userId: string,
    input: EnableUserRequestDto,
    context: RequestContext,
  ): Promise<UserEnabledResponseDto> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<UserEnabledResponseDto>({
      method: 'POST',
      path: `/internal/auth/users/${encodeURIComponent(userId)}/enable`,
      data: input,
      context,
    });

    return response;
  }

  async searchUsers(
    input: UserSearchQueryDto,
    context: RequestContext,
  ): Promise<UserSearchResponseDto> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<UserSearchResponseDto>({
      method: 'GET',
      path: '/internal/auth/users',
      params: input,
      context,
    });

    return response;
  }

  async getUser(
    userId: string,
    context: RequestContext,
  ): Promise<UserDetailResponseDto> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<UserDetailResponseDto>({
      method: 'GET',
      path: `/internal/auth/users/${encodeURIComponent(userId)}`,
      context,
    });

    return response;
  }

  async setUserRoles(
    userId: string,
    input: SetUserRolesRequestDto,
    context: RequestContext,
  ): Promise<UserRolesResponseDto> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<UserRolesResponseDto>({
      method: 'POST',
      path: `/internal/auth/users/${encodeURIComponent(userId)}/role`,
      data: input,
      context,
    });

    return response;
  }

  async revokeUserSessions(
    userId: string,
    input: RevokeSessionsRequestDto,
    context: RequestContext,
  ): Promise<RevokeSessionsResponseDto> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<RevokeSessionsResponseDto>({
      method: 'POST',
      path: `/internal/auth/users/${encodeURIComponent(userId)}/sessions/revoke`,
      data: input,
      context,
    });

    return response;
  }

  async listAuditLogs(
    input: AuditQueryDto,
    context: RequestContext,
  ): Promise<AuditListResponseDto> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<AuditListResponseDto>({
      method: 'GET',
      path: '/internal/auth/audit',
      params: input,
      context,
    });

    return response;
  }

  async getPlayerStats(
    userId: string,
    context: RequestContext,
  ): Promise<PlayerStatsDto> {
    await this.ensureAdmin(context);

    return this.callStatsService<PlayerStatsDto>({
      method: 'GET',
      path: `/internal/stats/user/${encodeURIComponent(userId)}`,
      context,
    });
  }

  async updatePlayerStats(
    userId: string,
    input: UpdatePlayerStatsDto,
    context: RequestContext,
  ): Promise<PlayerStatsDto> {
    await this.ensureAdmin(context);

    return this.callStatsService<PlayerStatsDto>({
      method: 'PUT',
      path: `/internal/stats/user/${encodeURIComponent(userId)}`,
      data: input,
      context,
    });
  }

  private async ensureAdmin(context: RequestContext): Promise<void> {
    this.ensureAuthorization(context.authorization);

    const response = await this.callAuthService<InternalVerifyResponse>({
      method: 'GET',
      path: '/internal/auth/verify',
      context,
    });

    const roles = response.user.roles ?? [];
    const isAdmin = roles.some((role) => role.toLowerCase() === 'admin');
    if (!isAdmin) {
      throw new ForbiddenException({
        code: 'admin_role_required',
        message: 'Admin role is required.',
      } satisfies ApiErrorDto);
    }
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
    params?: Record<string, unknown>;
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
        params: input.params,
      });
      return response.data;
    } catch (error) {
      this.throwNormalizedError(error, 'auth_service');
    }
  }

  private async callStatsService<T>(input: {
    method: 'GET' | 'PUT';
    path: string;
    context: RequestContext;
    data?: unknown;
    params?: Record<string, unknown>;
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
        url: `${this.config.stats.serviceUrl}${input.path}`,
        headers,
        data: input.data,
        params: input.params,
      });
      return response.data;
    } catch (error) {
      this.throwNormalizedError(error, 'stats_service');
    }
  }

  private throwNormalizedError(error: unknown, serviceCode: string): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data: unknown = error.response?.data;
      const message = this.extractErrorMessage(data) ?? error.message;

      throw new HttpException(
        {
          code: `${serviceCode}_${status ?? 'error'}`,
          message,
          details: data,
        } satisfies ApiErrorDto,
        status ?? 502,
      );
    }

    throw new BadGatewayException({
      code: `${serviceCode}_unreachable`,
      message: `Unable to reach ${serviceCode.replace('_', ' ')}.`,
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
