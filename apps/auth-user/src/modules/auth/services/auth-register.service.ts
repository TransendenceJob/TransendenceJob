import { ConflictException, Injectable } from '@nestjs/common';
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

      const issueAccessTokenInput = {
        userId: created.user.id,
        email: created.user.email,
        roles: [DEFAULT_USER_ROLE],
        sessionId: created.session.id,
      } satisfies Parameters<AuthTokenIssueService['issueAccessToken']>[0];

      const accessToken = await this.tokenIssue.issueAccessToken(
        issueAccessTokenInput,
      );

      return this.buildRegisterResponse(
        created,
        refreshPair.refreshToken,
        accessToken,
      );
    } catch (error) {
      if (this.isEmailUniqueViolation(error)) {
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

  private async createRegisteredUser(
    input: RegisterRequestDto,
    passwordHash: string,
    refreshPair: { refreshTokenHash: string; expiresAt: Date },
    context: RegisterContext,
  ): Promise<CreatedRegisterData> {
    return await this.prisma.$transaction(async (db) => {
      const user = await this.users.createLocalUser(
        {
          email: input.email,
          passwordHash,
        },
        db,
      );

      await this.roles.assignRoleToUser(user.id, DEFAULT_USER_ROLE, db);

      const session = await this.sessions.createSession(
        {
          userId: user.id,
          refreshTokenHash: refreshPair.refreshTokenHash,
          expiresAt: refreshPair.expiresAt,
          ipAddress: context.ip ?? undefined,
          userAgent: context.userAgent ?? undefined,
        } satisfies Parameters<SessionRepository['createSession']>[0],
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
        } satisfies Parameters<AuditLogRepository['createEvent']>[0],
        db,
      );

      const createdRegisterData = {
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          createdAt: user.createdAt,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          revokedAt: null,
        },
      } satisfies CreatedRegisterData;

      return createdRegisterData;
    });
  }

  private async cacheRegisteredSession(
    created: CreatedRegisterData,
    context: RegisterContext,
  ): Promise<void> {
    const cacheSessionInput = {
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
    } satisfies Parameters<AuthSessionCacheService['cacheSession']>[0];

    await this.sessionCache.cacheSession(cacheSessionInput);
  }

  private buildRegisterResponse(
    created: CreatedRegisterData,
    refreshToken: string,
    accessToken: string,
  ): AuthSuccessResponseDto {
    const authSuccessInput = {
      user: {
        id: created.user.id,
        email: created.user.email,
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
    } satisfies Parameters<typeof AuthContractMapper.toAuthSuccessResponse>[0];

    return AuthContractMapper.toAuthSuccessResponse(authSuccessInput);
  }

  private isEmailUniqueViolation(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const maybeError = error as { code?: unknown; meta?: { target?: unknown } };
    if (maybeError.code !== 'P2002') {
      return false;
    }

    const target = maybeError.meta?.target;
    if (Array.isArray(target)) {
      return target.some((entry) => String(entry) === 'email');
    }

    return false;
  }
}
