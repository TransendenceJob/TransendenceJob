import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { AuthService } from './auth.service';
import {
  type ApiErrorDto,
  type GoogleCallbackQueryDto,
} from './contracts/dto/auth-contracts.dto';
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
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly config: BffConfigService,
  ) {}

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

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    this.logger.log(
      `Google start URL generated with redirectUri=${this.config.auth.google.redirectUri}`,
    );

    return url;
  }

  async googleCallback(
    input: GoogleCallbackQueryDto,
    context: RequestContext,
  ): Promise<string> {
    this.logger.log(
      `Google callback received: hasCode=${Boolean(input.code)}, hasState=${Boolean(input.state)}, hasError=${Boolean(input.error)}`,
    );

    if (input.error) {
      this.logger.warn(
        `Google callback returned error=${input.error}, description=${input.errorDescription ?? 'n/a'}`,
      );

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
      this.logger.log(
        `Google callback exchanging authorization code using redirectUri=${this.config.auth.google.redirectUri}`,
      );

      const authSuccess = await this.authService.googleExchange(
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

      this.logger.error(
        `Google callback exchange failed: redirectUri=${this.config.auth.google.redirectUri}, message=${typeof message === 'string' ? message : 'Unable to complete Google OAuth exchange'}`,
      );

      return this.buildFrontendCallbackUrl({
        error: 'exchange_failed',
        errorDescription:
          typeof message === 'string'
            ? message
            : 'Unable to complete Google OAuth exchange',
      });
    }
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
        callbackUrl.searchParams.set(
          'error_description',
          input.errorDescription,
        );
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
