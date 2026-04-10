import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  type ApiErrorDto,
  type AuthMeResponseDto,
  type AuthSuccessResponseDto,
  type GoogleCallbackQueryDto,
  type GoogleExchangeRequestDto,
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

type StatePayload = {
  nonce: string;
  iat: number;
};

const GOOGLE_STATE_TTL_SECONDS = 300;

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

  googleStart(): string {
    const state = this.createSignedState();

    const params = new URLSearchParams({
      client_id: this.config.auth.google.clientId,
      redirect_uri: this.config.auth.google.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async googleCallback(
    input: GoogleCallbackQueryDto,
    context: RequestContext,
  ): Promise<string> {
    if (input.error) {
      return this.buildFrontendCallbackUrl({
        error: input.error,
        errorDescription:
          input.errorDescription ?? 'Google OAuth flow was cancelled or denied',
      });
    }

    if (!input.code || !input.state) {
      throw new BadRequestException({
        code: 'invalid_google_callback_payload',
        message: 'Missing authorization code or state',
      } satisfies ApiErrorDto);
    }

    const isValidState = this.verifySignedState(input.state);
    if (!isValidState) {
      return this.buildFrontendCallbackUrl({
        error: 'invalid_state',
        errorDescription: 'Google OAuth state validation failed',
      });
    }

    try {
      const authSuccess = await this.googleExchange(
        {
          provider: 'google',
          authorizationCode: input.code,
          redirectUri: this.config.auth.google.redirectUri,
        },
        context,
      );

      return this.buildFrontendCallbackUrl({
        accessToken: authSuccess.tokens.accessToken,
        refreshToken: authSuccess.tokens.refreshToken,
        expiresIn: String(authSuccess.tokens.expiresIn),
        tokenType: authSuccess.tokens.tokenType,
      });
    } catch (error) {
      const message =
        error instanceof HttpException
          ? (error.getResponse() as { message?: unknown })?.message
          : undefined;

      return this.buildFrontendCallbackUrl({
        error: 'exchange_failed',
        errorDescription:
          typeof message === 'string'
            ? message
            : 'Unable to complete Google OAuth exchange',
      });
    }
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

  private createSignedState(): string {
    const payload: StatePayload = {
      nonce: randomBytes(16).toString('base64url'),
      iat: Math.floor(Date.now() / 1000),
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = this.signState(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  private verifySignedState(state: string): boolean {
    const [encodedPayload, receivedSignature] = state.split('.');

    if (!encodedPayload || !receivedSignature) {
      return false;
    }

    const expectedSignature = this.signState(encodedPayload);

    const receivedBuffer = Buffer.from(receivedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    if (!timingSafeEqual(receivedBuffer, expectedBuffer)) {
      return false;
    }

    let payload: StatePayload;
    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as StatePayload;
    } catch {
      return false;
    }

    if (typeof payload.iat !== 'number') {
      return false;
    }

    const ageSeconds = Math.floor(Date.now() / 1000) - payload.iat;
    return ageSeconds >= 0 && ageSeconds <= GOOGLE_STATE_TTL_SECONDS;
  }

  private signState(payload: string): string {
    return createHmac('sha256', this.config.auth.google.stateSecret)
      .update(payload)
      .digest('base64url');
  }

  private buildFrontendCallbackUrl(input: {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: string;
    tokenType?: string;
    error?: string;
    errorDescription?: string;
  }): string {
    const callbackUrl = new URL(this.config.auth.google.frontendCallbackUrl);

    if (input.error) {
      callbackUrl.searchParams.set('error', input.error);
      if (input.errorDescription) {
        callbackUrl.searchParams.set('error_description', input.errorDescription);
      }

      return callbackUrl.toString();
    }

    const hashParams = new URLSearchParams();
    if (input.accessToken) {
      hashParams.set('accessToken', input.accessToken);
    }
    if (input.refreshToken) {
      hashParams.set('refreshToken', input.refreshToken);
    }
    if (input.expiresIn) {
      hashParams.set('expiresIn', input.expiresIn);
    }
    if (input.tokenType) {
      hashParams.set('tokenType', input.tokenType);
    }

    callbackUrl.hash = hashParams.toString();
    return callbackUrl.toString();
  }
}
