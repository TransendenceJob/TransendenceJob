import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthConfigService } from '../../config/auth-config.service';
import { AuditLogRepository } from '../../persistence/repositories/audit-log.repository';
import { AuthProviderRepository } from '../../persistence/repositories/auth-provider.repository';
import { RoleRepository } from '../../persistence/repositories/role.repository';
import { SessionRepository } from '../../persistence/repositories/session.repository';
import { UserRepository } from '../../persistence/repositories/user.repository';
import { GoogleExchangeRequestDto } from '../contracts/dto/google-exchange-request.dto';
import { AuthSuccessResponseDto } from '../contracts/dto/auth-success-response.dto';
import { AuthContractMapper } from '../contracts/mappers/auth-contract.mapper';
import { AuthSessionCacheService } from '../shared/auth-session-cache.service';
import { AuthTokenIssueService } from '../shared/auth-token-issue.service';

const DEFAULT_USER_ROLE = 'USER';

export type GoogleExchangeContext = {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string;
  serviceName?: string;
};

type GoogleIdentity = {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
};

type ExchangeResult = {
  user: {
    id: string;
    email: string;
    status: string;
    createdAt: Date;
  };
  roleNames: string[];
  authProviders: Array<{ provider: string; providerUserId: string }>;
  session: {
    id: string;
    expiresAt: Date;
    revokedAt: Date | null;
  };
  refreshToken: string;
};

@Injectable()
export class AuthGoogleExchangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AuthConfigService,
    private readonly users: UserRepository,
    private readonly roles: RoleRepository,
    private readonly sessions: SessionRepository,
    private readonly authProviders: AuthProviderRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly sessionCache: AuthSessionCacheService,
    private readonly tokenIssue: AuthTokenIssueService,
  ) {}

  async exchange(
    input: GoogleExchangeRequestDto,
    context: GoogleExchangeContext,
  ): Promise<AuthSuccessResponseDto> {
    if (input.provider !== 'google') {
      throw new BadRequestException('Unsupported auth provider');
    }

    const identity = await this.resolveGoogleIdentity(input);

    if (!identity.emailVerified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    const refreshPair = this.tokenIssue.createRefreshTokenPair();

    const exchanged = await this.prisma.$transaction(async (db) => {
      const linked = await this.authProviders.findUserByProviderIdentity(
        'GOOGLE',
        identity.providerUserId,
        db,
      );

      let user = linked?.user ?? null;
      let isFirstLogin = false;
      let linkMode: 'provider_linked' | 'email_linked' | 'new_user_created' =
        'provider_linked';

      if (!user) {
        const existingByEmail = await this.users.findByEmail(
          identity.email,
          db,
        );

        if (existingByEmail) {
          user = existingByEmail;
          linkMode = 'email_linked';
        } else {
          user = await this.users.createOAuthUser(
            {
              email: identity.email,
              status: 'ACTIVE',
            },
            db,
          );

          await this.roles.assignRoleToUser(user.id, DEFAULT_USER_ROLE, db);
          isFirstLogin = true;
          linkMode = 'new_user_created';
        }

        const providerLink = await this.authProviders.linkProviderToUser(
          {
            userId: user.id,
            provider: 'GOOGLE',
            providerUserId: identity.providerUserId,
          },
          db,
        );

        if (providerLink.userId !== user.id) {
          throw new ConflictException('Google account already linked');
        }
      }

      if (user.status !== 'ACTIVE' || user.disabledAt) {
        throw new UnauthorizedException('User is disabled');
      }

      const roleNames = await this.users.getRoleNamesForUser(user.id, db);
      const finalRoleNames =
        roleNames.length > 0 ? roleNames : [DEFAULT_USER_ROLE];

      if (roleNames.length === 0) {
        await this.roles.assignRoleToUser(user.id, DEFAULT_USER_ROLE, db);
      }

      const session = await this.sessions.createSession(
        {
          userId: user.id,
          refreshTokenHash: refreshPair.refreshTokenHash,
          expiresAt: refreshPair.expiresAt,
          ipAddress: context.ip ?? undefined,
          userAgent: context.userAgent ?? undefined,
        },
        db,
      );

      if (isFirstLogin) {
        await this.auditLogs.createEvent(
          {
            action: 'USER_REGISTERED',
            userId: user.id,
            actorUserId: user.id,
            ip: context.ip ?? null,
            userAgent: context.userAgent ?? null,
            metadataJson: {
              source: 'internal/auth/google/exchange',
              requestId: context.requestId ?? null,
              serviceName: context.serviceName ?? null,
              provider: 'google',
              mode: linkMode,
            },
          },
          db,
        );
      }

      await this.auditLogs.createEvent(
        {
          action: 'GOOGLE_EXCHANGE',
          userId: user.id,
          actorUserId: user.id,
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
          metadataJson: {
            source: 'internal/auth/google/exchange',
            requestId: context.requestId ?? null,
            serviceName: context.serviceName ?? null,
            provider: 'google',
            mode: linkMode,
            firstLogin: isFirstLogin,
          },
        },
        db,
      );

      await this.auditLogs.createEvent(
        {
          action: 'LOGIN_SUCCEEDED',
          userId: user.id,
          actorUserId: user.id,
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
          metadataJson: {
            source: 'internal/auth/google/exchange',
            requestId: context.requestId ?? null,
            serviceName: context.serviceName ?? null,
            sessionId: session.id,
            provider: 'google',
          },
        },
        db,
      );

      const providers = await this.authProviders.findByUserId(user.id, db);

      return {
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          createdAt: user.createdAt,
        },
        roleNames: finalRoleNames,
        authProviders: providers.map((provider) => ({
          provider: provider.provider,
          providerUserId: provider.providerUserId,
        })),
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt,
        },
        refreshToken: refreshPair.refreshToken,
      } satisfies ExchangeResult;
    });

    const accessToken = await this.tokenIssue.issueAccessToken({
      userId: exchanged.user.id,
      email: exchanged.user.email,
      roles: exchanged.roleNames,
      sessionId: exchanged.session.id,
    });

    await this.sessionCache.cacheSession({
      session: {
        id: exchanged.session.id,
        expiresAt: exchanged.session.expiresAt,
      },
      user: {
        id: exchanged.user.id,
        status: exchanged.user.status,
      },
      roles: exchanged.roleNames,
      requestId: context.requestId,
      serviceName: context.serviceName,
    });

    return AuthContractMapper.toAuthSuccessResponse({
      user: {
        id: exchanged.user.id,
        email: exchanged.user.email,
        status: exchanged.user.status,
        createdAt: exchanged.user.createdAt,
        roles: exchanged.roleNames.map((roleName) => ({
          role: {
            name: roleName,
          },
        })),
        authProviders: exchanged.authProviders,
      },
      session: exchanged.session,
      tokens: {
        accessToken,
        refreshToken: exchanged.refreshToken,
        expiresIn: this.tokenIssue.accessTokenExpiresInSeconds(),
        tokenType: 'Bearer',
      },
    });
  }

  private async resolveGoogleIdentity(
    input: GoogleExchangeRequestDto,
  ): Promise<GoogleIdentity> {
    if (input.idToken) {
      return this.verifyIdToken(input.idToken);
    }

    if (!input.authorizationCode || !input.redirectUri) {
      throw new UnauthorizedException('Invalid Google exchange payload');
    }

    if (input.redirectUri !== this.config.google.redirectUri) {
      throw new UnauthorizedException('Invalid Google redirect URI');
    }

    const idToken = await this.exchangeAuthCodeForIdToken(
      input.authorizationCode,
      this.config.google.redirectUri,
    );

    return this.verifyIdToken(idToken);
  }

  private async exchangeAuthCodeForIdToken(
    authorizationCode: string,
    redirectUri: string,
  ): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: authorizationCode,
        client_id: this.config.google.clientId,
        client_secret: this.config.google.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Google token exchange failed');
    }

    const payload = (await response.json()) as {
      id_token?: string;
    };

    if (!payload.id_token) {
      throw new UnauthorizedException('Google token exchange failed');
    }

    return payload.id_token;
  }

  private async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = (await response.json()) as {
      sub?: string;
      email?: string;
      email_verified?: string | boolean;
      aud?: string;
      iss?: string;
    };

    const isValidIssuer =
      payload.iss === 'https://accounts.google.com' ||
      payload.iss === 'accounts.google.com';

    if (!isValidIssuer || payload.aud !== this.config.google.clientId) {
      throw new UnauthorizedException('Invalid Google token audience');
    }

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token claims');
    }

    return {
      providerUserId: payload.sub,
      email: payload.email,
      emailVerified:
        payload.email_verified === true || payload.email_verified === 'true',
    };
  }
}
