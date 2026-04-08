import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthRegisterService } from '../../../src/modules/auth/services/auth-register.service';
import { AuthRateLimitService } from '../../../src/modules/auth/shared/auth-rate-limit.service';
import { AuthSessionCacheService } from '../../../src/modules/auth/shared/auth-session-cache.service';
import { AuthTokenIssueService } from '../../../src/modules/auth/shared/auth-token-issue.service';
import { PrismaService } from '../../../src/modules/prisma/prisma.service';
import { UserRepository } from '../../../src/modules/persistence/repositories/user.repository';
import { RoleRepository } from '../../../src/modules/persistence/repositories/role.repository';
import { SessionRepository } from '../../../src/modules/persistence/repositories/session.repository';
import { AuditLogRepository } from '../../../src/modules/persistence/repositories/audit-log.repository';
import { PasswordHashService } from '../../../src/modules/auth/hashing/password-hash.service';

describe('AuthRegisterService', () => {
  const baseInput = {
    email: 'user@example.com',
    password: 'password-123',
  };

  const baseContext = {
    ip: '127.0.0.1',
    userAgent: 'Jest',
    requestId: 'req-1',
    serviceName: 'auth-user',
  };

  async function createModule() {
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: PrismaService) => Promise<unknown>) =>
          callback(prisma),
      ),
    } as unknown as PrismaService;

    const users = {
      findByEmail: jest.fn().mockResolvedValue(null),
      createLocalUser: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: baseInput.email,
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      }),
    };

    const rateLimit = {
      ensureRegisterAllowed: jest.fn().mockResolvedValue(undefined),
    };

    const tokenIssue = {
      createRefreshTokenPair: jest.fn().mockReturnValue({
        refreshToken: 'refresh-token',
        refreshTokenHash: 'refresh-token-hash',
        expiresAt: new Date(Date.now() + 60_000),
      }),
      issueAccessToken: jest.fn().mockResolvedValue('access-token'),
      accessTokenExpiresInSeconds: jest.fn().mockReturnValue(900),
    };

    const sessionCache = {
      cacheSession: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthRegisterService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: UserRepository,
          useValue: users,
        },
        {
          provide: RoleRepository,
          useValue: {
            assignRoleToUser: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            createSession: jest.fn().mockResolvedValue({
              id: 'session-1',
              expiresAt: new Date(Date.now() + 60_000),
              revokedAt: null,
            }),
          },
        },
        {
          provide: AuditLogRepository,
          useValue: {
            createEvent: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: PasswordHashService,
          useValue: {
            hashPassword: jest.fn().mockResolvedValue('hashed-password'),
          },
        },
        {
          provide: AuthRateLimitService,
          useValue: rateLimit,
        },
        {
          provide: AuthTokenIssueService,
          useValue: tokenIssue,
        },
        {
          provide: AuthSessionCacheService,
          useValue: sessionCache,
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    return {
      moduleRef,
      users,
      rateLimit,
      tokenIssue,
      sessionCache,
    };
  }

  it('registers a user and caches the session', async () => {
    const { moduleRef, sessionCache, tokenIssue } = await createModule();
    const service = moduleRef.get(AuthRegisterService);
    const response = await service.register(baseInput, baseContext);

    expect(response.user.email).toBe(baseInput.email);
    expect(response.session.id).toBe('session-1');
    expect(response.tokens.refreshToken).toBe('refresh-token');
    expect(tokenIssue.issueAccessToken).toHaveBeenCalled();
    expect(sessionCache.cacheSession).toHaveBeenCalled();
  });

  it('rejects duplicate emails', async () => {
    const { moduleRef, users } = await createModule();
    users.findByEmail.mockResolvedValueOnce({ id: 'existing' });

    const service = moduleRef.get(AuthRegisterService);

    await expect(
      service.register(baseInput, baseContext),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects too many register attempts', async () => {
    const { moduleRef, rateLimit, users } = await createModule();

    rateLimit.ensureRegisterAllowed.mockRejectedValueOnce(
      new HttpException(
        'Too many register attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );

    const service = moduleRef.get(AuthRegisterService);

    await expect(
      service.register(baseInput, baseContext),
    ).rejects.toMatchObject({
      name: 'HttpException',
      status: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Too many register attempts',
    });

    expect(users.createLocalUser).not.toHaveBeenCalled();
  });
});
