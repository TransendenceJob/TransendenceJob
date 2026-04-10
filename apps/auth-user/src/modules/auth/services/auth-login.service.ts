import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogRepository } from '../../persistence/repositories/audit-log.repository';
import { SessionRepository } from '../../persistence/repositories/session.repository';
import { UserRepository } from '../../persistence/repositories/user.repository';
import { LoginRequestDto } from '../contracts/dto/login-request.dto';
import { AuthSuccessResponseDto } from '../contracts/dto/auth-success-response.dto';
import { AuthContractMapper } from '../contracts/mappers/auth-contract.mapper';
import { PasswordHashService } from '../hashing/password-hash.service';
import { AuthRateLimitService } from '../shared/auth-rate-limit.service';
import { AuthSessionCacheService } from '../shared/auth-session-cache.service';
import { AuthTokenIssueService } from '../shared/auth-token-issue.service';

export type LoginContext = {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string;
  serviceName?: string;
};

type LoginResult = {
  user: {
    id: string;
    email: string;
    status: string;
    createdAt: Date;
    roles: string[];
  };
  session: {
    id: string;
    expiresAt: Date;
    revokedAt: Date | null;
  };
  refreshToken: string;
};

@Injectable()
export class AuthLoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly passwordHash: PasswordHashService,
    private readonly rateLimit: AuthRateLimitService,
    private readonly sessionCache: AuthSessionCacheService,
    private readonly tokenIssue: AuthTokenIssueService,
  ) {}

  async login(
    input: LoginRequestDto,
    context: LoginContext,
  ): Promise<AuthSuccessResponseDto> {
    try {
      const loginRateLimitInput = {
        email: input.email,
        ip: context.ip,
      } satisfies Parameters<AuthRateLimitService['ensureLoginAllowed']>[0];

      await this.rateLimit.ensureLoginAllowed(loginRateLimitInput);

      const user = await this.users.findByEmailWithRoles(input.email);
      const userId = user?.id ?? null;

      if (!user || !user.passwordHash) {
        await this.auditLoginFailed(userId, input.email, context, 'NOT_FOUND');
        throw new UnauthorizedException('Invalid email or password');
      }

      const passwordMatches = await this.passwordHash.compare(
        input.password,
        user.passwordHash,
      );

      if (!passwordMatches) {
        await this.auditLoginFailed(
          user.id,
          input.email,
          context,
          'BAD_PASSWORD',
        );
        throw new UnauthorizedException('Invalid email or password');
      }

      if (user.status !== 'ACTIVE' || user.disabledAt) {
        await this.auditLoginFailed(user.id, input.email, context, 'DISABLED');
        throw new UnauthorizedException('Invalid email or password');
      }

      const loggedIn = await this.prisma.$transaction(
        async (db): Promise<LoginResult> => {
          const roles = user.roles.map((item) => item.role.name);
          const refreshPair = this.tokenIssue.createRefreshTokenPair();

          const createSessionInput = {
            userId: user.id,
            refreshTokenHash: refreshPair.refreshTokenHash,
            userAgent: context.userAgent ?? null,
            ipAddress: context.ip ?? null,
            expiresAt: refreshPair.expiresAt,
          } satisfies Parameters<SessionRepository['createSession']>[0];

          const session = await this.sessions.createSession(
            createSessionInput,
            db,
          );

          const loginSucceededAudit = {
            action: 'LOGIN_SUCCEEDED',
            userId: user.id,
            actorUserId: user.id,
            ip: context.ip ?? null,
            userAgent: context.userAgent ?? null,
            metadataJson: {
              source: 'internal/auth/login',
              requestId: context.requestId ?? null,
              serviceName: context.serviceName ?? null,
              sessionId: session.id,
            },
          } satisfies Parameters<AuditLogRepository['createEvent']>[0];

          await this.auditLogs.createEvent(loginSucceededAudit, db);

          const result = {
            user: {
              id: user.id,
              email: user.email,
              status: user.status,
              createdAt: user.createdAt,
              roles,
            },
            session: {
              id: session.id,
              expiresAt: session.expiresAt,
              revokedAt: session.revokedAt,
            },
            refreshToken: refreshPair.refreshToken,
          } satisfies LoginResult;

          return result;
        },
      );

      const cacheSessionInput = {
        session: {
          id: loggedIn.session.id,
          expiresAt: loggedIn.session.expiresAt,
        },
        user: {
          id: loggedIn.user.id,
          status: loggedIn.user.status,
        },
        roles: loggedIn.user.roles,
        requestId: context.requestId,
        serviceName: context.serviceName,
      } satisfies Parameters<AuthSessionCacheService['cacheSession']>[0];

      await this.sessionCache.cacheSession(cacheSessionInput);

      const issueAccessTokenInput = {
        userId: loggedIn.user.id,
        email: loggedIn.user.email,
        roles: loggedIn.user.roles,
        sessionId: loggedIn.session.id,
      } satisfies Parameters<AuthTokenIssueService['issueAccessToken']>[0];

      const accessToken = await this.tokenIssue.issueAccessToken(
        issueAccessTokenInput,
      );

      const authSuccessInput = {
        user: {
          id: loggedIn.user.id,
          email: loggedIn.user.email,
          status: loggedIn.user.status,
          createdAt: loggedIn.user.createdAt,
          roles: loggedIn.user.roles.map((roleName) => ({
            role: {
              name: roleName,
            },
          })),
          authProviders: [],
        },
        session: loggedIn.session,
        tokens: {
          accessToken,
          refreshToken: loggedIn.refreshToken,
          expiresIn: this.tokenIssue.accessTokenExpiresInSeconds(),
          tokenType: 'Bearer',
        },
      } satisfies Parameters<
        typeof AuthContractMapper.toAuthSuccessResponse
      >[0];

      return AuthContractMapper.toAuthSuccessResponse(authSuccessInput);
    } catch (error) {
      if (this.isTooManyRequests(error)) {
        const rateLimitedAudit = {
          action: 'LOGIN_FAILED',
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
          metadataJson: {
            source: 'internal/auth/login',
            requestId: context.requestId ?? null,
            serviceName: context.serviceName ?? null,
            reason: 'rate_limited',
            email: input.email,
          },
        } satisfies Parameters<AuditLogRepository['createEvent']>[0];

        await this.auditLogs.createEvent(rateLimitedAudit);
      }

      throw error;
    }
  }

  private async auditLoginFailed(
    userId: string | null,
    email: string,
    context: LoginContext,
    reason: string,
  ): Promise<void> {
    const loginFailedAudit = {
      action: 'LOGIN_FAILED',
      userId,
      actorUserId: userId,
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
      metadataJson: {
        source: 'internal/auth/login',
        requestId: context.requestId ?? null,
        serviceName: context.serviceName ?? null,
        email,
        reason,
      },
    } satisfies Parameters<AuditLogRepository['createEvent']>[0];

    await this.auditLogs.createEvent(loginFailedAudit);
  }

  private isTooManyRequests(error: unknown): error is HttpException {
    return error instanceof HttpException && error.getStatus() === 429;
  }
}
