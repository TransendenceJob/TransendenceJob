import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { UserRepository } from '../persistence/repositories/user.repository';
import { RoleRepository } from '../persistence/repositories/role.repository';
import { SessionRepository } from '../persistence/repositories/session.repository';
import { AuditLogRepository } from '../persistence/repositories/audit-log.repository';
import { PasswordHashService } from './hashing/password-hash.service';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';
import { RegisterRequestDto } from './contracts/dto/register-request.dto';
import { AuthSuccessResponseDto } from './contracts/dto/auth-success-response.dto';
import { AuthContractMapper } from './contracts/mappers/auth-contract.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { AuthConfigService } from '../config/auth-config.service';
import { AuthRedisService } from '../redis/auth-redis.service';

const DEFAULT_USER_ROLE = 'USER';
const REGISTER_ATTEMPT_LIMIT = 5;
const REGISTER_ATTEMPT_WINDOW_SECONDS = 60;

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
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly authConfig: AuthConfigService,
    private readonly redis: AuthRedisService,
  ) {}

  async register(
    input: RegisterRequestDto,
    context: RegisterContext,
  ): Promise<AuthSuccessResponseDto> {
    await this.ensureRegisterRateLimit(input.email, context);
    await this.ensureEmailAvailable(input.email);
    const passwordHash = await this.passwordHashService.hashPassword(
      input.password,
    );
    const refreshPair = this.refreshTokens.createRefreshTokenPair();

    try {
      const created = await this.createRegisteredUser(
        input,
        passwordHash,
        refreshPair,
        context,
      );

      await this.cacheRegisteredSession(created, context);

      const accessToken = await this.accessTokens.generateAccessToken({
        sub: created.user.id,
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

  private async ensureRegisterRateLimit(
    email: string,
    context: RegisterContext,
  ): Promise<void> {
    const ipBucket = context.ip
      ? `register:ip:${context.ip}`
      : 'register:ip:unknown';
    const emailBucket = `register:email:${email.toLowerCase()}`;

    const [ipAttempts, emailAttempts] = await Promise.all([
      this.redis.incrementRateLimitCounter(
        ipBucket,
        REGISTER_ATTEMPT_WINDOW_SECONDS,
      ),
      this.redis.incrementRateLimitCounter(
        emailBucket,
        REGISTER_ATTEMPT_WINDOW_SECONDS,
      ),
    ]);

    if (
      ipAttempts > REGISTER_ATTEMPT_LIMIT ||
      emailAttempts > REGISTER_ATTEMPT_LIMIT
    ) {
      throw new HttpException(
        'Too many register attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
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
      };
    });
  }

  private async cacheRegisteredSession(
    created: CreatedRegisterData,
    context: RegisterContext,
  ): Promise<void> {
    const sessionCacheTtl = Math.max(
      1,
      Math.floor((created.session.expiresAt.getTime() - Date.now()) / 1000),
    );

    await this.redis.cacheSessionById(
      created.session.id,
      JSON.stringify({
        userId: created.user.id,
        status: created.user.status,
        roles: [DEFAULT_USER_ROLE],
        requestId: context.requestId ?? null,
        serviceName: context.serviceName ?? null,
      }),
      sessionCacheTtl,
    );
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
        status: created.user.status,
        createdAt: created.user.createdAt,
        roles: [{ role: { name: DEFAULT_USER_ROLE } }],
        authProviders: [],
      },
      session: created.session,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: this.toSeconds(this.authConfig.jwt.accessTtl),
        tokenType: 'Bearer',
      },
    });
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

  private toSeconds(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 0;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 24 * 60 * 60;
      default:
        return 0;
    }
  }
}
