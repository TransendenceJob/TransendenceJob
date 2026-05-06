import { ConflictException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { UserRepository } from '../../persistence/repositories/user.repository';
import { RoleRepository } from '../../persistence/repositories/role.repository';
import { SessionRepository } from '../../persistence/repositories/session.repository';
import { AuditLogRepository } from '../../persistence/repositories/audit-log.repository';
import { PasswordHashService } from '../hashing/password-hash.service';
import { RegisterRequestDto } from '../contracts/dto/register-request.dto';
import { AuthSuccessResponseDto } from '../contracts/dto/auth-success-response.dto';
import { AuthContractMapper } from '../contracts/mappers/auth-contract.mapper';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthRateLimitService } from '../shared/auth-rate-limit.service';
import { AuthTokenIssueService } from '../shared/auth-token-issue.service';
import { AuthSessionCacheService } from '../shared/auth-session-cache.service';

const DEFAULT_USER_ROLE = 'USER';

export type RegisterContext = {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string;
  serviceName?: string;
};

type CreatedRegisterData = {
  user: {
    id: string;
    email: string;
    username: string | null;
    status: string;
    createdAt: Date;
  };
  session: {
    id: string;
    expiresAt: Date;
    revokedAt: Date | null;
  };
};

@Injectable()
export class AuthRegisterService {
  private readonly logger = new Logger(AuthRegisterService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserRepository,
    private readonly roles: RoleRepository,
    private readonly sessions: SessionRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly rateLimit: AuthRateLimitService,
    private readonly tokenIssue: AuthTokenIssueService,
    private readonly sessionCache: AuthSessionCacheService,
  ) {}

  async register(
    input: RegisterRequestDto,
    context: RegisterContext,
  ): Promise<AuthSuccessResponseDto> {
    const registerRateLimitInput = {
      email: input.email,
      ip: context.ip,
    } satisfies Parameters<AuthRateLimitService['ensureRegisterAllowed']>[0];

    await this.rateLimit.ensureRegisterAllowed(registerRateLimitInput);
    await this.ensureEmailAvailable(input.email);
    await this.ensureUsernameAvailable(input.username);
    const passwordHash = await this.passwordHashService.hashPassword(
      input.password,
    );
    const refreshPair = this.tokenIssue.createRefreshTokenPair();

    try {
      const created = await this.createRegisteredUser(
        input,
        passwordHash,
        refreshPair,
        context,
      );

      await this.cacheRegisteredSession(created, context);

      // Initialize player stats in stats service (best-effort)
      try {
        await this.initPlayerStats(created.user, input);
      } catch (err) {
        this.logger.warn(
          `Failed to initialize stats for user=${created.user.id}: ${err?.message ?? err}`,
        );
      }

      const accessToken = await this.tokenIssue.issueAccessToken({
        userId: created.user.id,
        email: created.user.email,
        roles: [DEFAULT_USER_ROLE],
        sessionId: created.session.id,
      });

      return this.buildRegisterResponse(
        created,
        refreshPair.refreshToken,
        accessToken,
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const target = this.getUniqueViolationTarget(error);
        if (target === 'username') {
          throw new ConflictException('Username already exists');
        }

        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
  }

  private async ensureUsernameAvailable(username?: string): Promise<void> {
    if (!username) {
      return;
    }

    const existingUser = await this.users.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }
  }

  private async createRegisteredUser(
    input: RegisterRequestDto,
    passwordHash: string,
    refreshPair: { refreshTokenHash: string; expiresAt: Date },
    context: RegisterContext,
  ): Promise<CreatedRegisterData> {
    return this.prisma.$transaction(async (db) => {
      const user = await this.users.createLocalUser(
        {
          email: input.email,
          username: input.username ?? null,
          passwordHash,
        },
        db,
      );

      await this.roles.assignRoleToUser(user.id, DEFAULT_USER_ROLE, db);

      const activeUser = await this.users.enableUser(user.id, db);

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

      await this.auditLogs.createEvent(
        {
          action: 'USER_REGISTERED',
          userId: user.id,
          actorUserId: user.id,
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
          metadataJson: {
            source: 'internal/register',
            requestId: context.requestId ?? null,
            serviceName: context.serviceName ?? null,
          },
        },
        db,
      );

      return {
        user: {
          id: activeUser.id,
          email: activeUser.email,
          username: activeUser.username ?? null,
          status: activeUser.status,
          createdAt: activeUser.createdAt,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          revokedAt: null,
        },
      } satisfies CreatedRegisterData;
    });
  }

  private async cacheRegisteredSession(
    created: CreatedRegisterData,
    context: RegisterContext,
  ): Promise<void> {
    await this.sessionCache.cacheSession({
      session: {
        id: created.session.id,
        expiresAt: created.session.expiresAt,
      },
      user: {
        id: created.user.id,
        status: created.user.status,
      },
      roles: [DEFAULT_USER_ROLE],
      requestId: context.requestId,
      serviceName: context.serviceName,
    });
  }

  private buildRegisterResponse(
    created: CreatedRegisterData,
    refreshToken: string,
    accessToken: string,
  ): AuthSuccessResponseDto {
    return AuthContractMapper.toAuthSuccessResponse({
      user: {
        id: created.user.id,
        email: created.user.email,
        username: created.user.username,
        status: created.user.status,
        createdAt: created.user.createdAt,
        roles: [{ role: { name: DEFAULT_USER_ROLE } }],
        authProviders: [],
      },
      session: created.session,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: this.tokenIssue.accessTokenExpiresInSeconds(),
        tokenType: 'Bearer',
      },
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const maybeError = error as { code?: unknown; meta?: { target?: unknown } };
    if (maybeError.code !== 'P2002') {
      return false;
    }

    const target = maybeError.meta?.target;
    return Array.isArray(target)
      ? target.some(
          (entry) => String(entry) === 'email' || String(entry) === 'username',
        )
      : false;
  }

  private getUniqueViolationTarget(error: unknown): string | null {
    if (typeof error !== 'object' || error === null) {
      return null;
    }

    const target = (error as { meta?: { target?: unknown } }).meta?.target;
    if (!Array.isArray(target)) {
      return null;
    }

    const normalizedTarget = target.map((entry) => String(entry));
    if (normalizedTarget.includes('username')) {
      return 'username';
    }

    if (normalizedTarget.includes('email')) {
      return 'email';
    }

    return null;
  }

  private async initPlayerStats(
    user: CreatedRegisterData['user'],
    input: RegisterRequestDto,
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      userId: user.id,
      xp: 50,
      level: 1,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      email: user.email,
      username: user.username ?? input.username ?? null,
      displayName: (input as { displayName?: string })?.displayName ?? null,
    };

    const url = 'http://stats_service:3000/internal/stats/user';

    await axios.post(url, payload, {
      headers: { 'x-service-name': 'auth_service' },
      timeout: 2000,
    });
  }
}
