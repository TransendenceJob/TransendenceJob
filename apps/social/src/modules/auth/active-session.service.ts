import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SocialConfigService } from '../config/social-config.service';
import type { AuthPrincipal } from './auth-principal';
import { AccessTokenService } from './tokens/access-token.service';

type AuthVerifyResponse = {
  valid?: boolean;
  user?: {
    id?: string;
    email?: string;
    status?: string;
    roles?: string[];
  };
  session?: {
    id?: string;
    revoked?: boolean | null;
  };
};

@Injectable()
export class ActiveSessionService {
  constructor(
    private readonly accessTokens: AccessTokenService,
    private readonly config: SocialConfigService,
  ) {}

  async verifyActivePrincipal(token: string): Promise<AuthPrincipal> {
    const claims = await this.accessTokens.verifyAccessToken(token);
    const active = await this.verifyWithAuthService(token);
    const sessionId = active.session?.id;

    if (
      !active.valid ||
      active.user?.id !== claims.sub ||
      active.user?.email !== claims.email ||
      sessionId !== claims.sessionId ||
      active.session?.revoked
    ) {
      throw new UnauthorizedException('Invalid active session');
    }

    if (active.user?.status?.toUpperCase() !== 'ACTIVE') {
      throw new ForbiddenException('User session is not active');
    }

    const roles =
      active.user.roles && active.user.roles.length > 0
        ? active.user.roles
        : claims.roles;
    const verifiedClaims = {
      ...claims,
      roles,
      sessionId,
    };

    return {
      token,
      claims: verifiedClaims,
      roleSet: new Set(roles.map((role) => role.toUpperCase())),
    };
  }

  private async verifyWithAuthService(
    token: string,
  ): Promise<AuthVerifyResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
      const response = await fetch(
        `${this.config.auth.serviceUrl}/internal/auth/verify`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
            'x-service-name': this.config.app.serviceName,
          },
          signal: controller.signal,
        },
      );

      if (response.status === 401) {
        throw new UnauthorizedException('Invalid active session');
      }
      if (response.status === 403) {
        throw new ForbiddenException('User session is not active');
      }
      if (!response.ok) {
        throw new ServiceUnavailableException('Auth service verify failed');
      }

      return (await response.json()) as AuthVerifyResponse;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      throw new ServiceUnavailableException('Unable to verify active session');
    } finally {
      clearTimeout(timeout);
    }
  }
}
