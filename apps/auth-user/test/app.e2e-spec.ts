import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from 'redis';
import { AppModule } from './../src/app.module';

describe('Auth flows (e2e)', () => {
  let app: INestApplication<App> | undefined;
  let prisma: PrismaClient | undefined;

  const unique = `${Date.now()}`;
  const email = `e2e.${unique}@example.com`;
  const password = 'StrongPassword123!';

  const authHeader = (accessToken: string): Record<string, string> => ({
    Authorization: `Bearer ${accessToken}`,
  });

  const clearAuthRateLimitKeys = async (): Promise<void> => {
    const client = createClient({
      socket: {
        host: process.env.REDIS_HOST ?? 'redis',
        port: Number(process.env.REDIS_PORT ?? '6379'),
      },
    });

    await client.connect();

    const keyPatterns = [
      'register:*',
      'refresh:*',
      'login:*',
      'logout:*',
    ] as const;

    for (const pattern of keyPatterns) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    }

    await client.disconnect();
  };

  const promoteToAdmin = async (userId: string): Promise<void> => {
    const adminRole = await prisma!.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN' },
    });

    await prisma!.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: adminRole.id,
      },
    });
  };

  beforeAll(async () => {
    process.env.NODE_ENV ??= 'test';
    process.env.PORT ??= '3000';
    process.env.DB_HOST = process.env.E2E_DB_HOST ?? 'postgres_auth_test';
    process.env.DB_PORT = process.env.E2E_DB_PORT ?? '5432';
    process.env.DB_USER = process.env.E2E_DB_USER ?? 'auth_test';
    process.env.DB_PASSWORD = process.env.E2E_DB_PASSWORD ?? 'auth_test';
    process.env.DB_NAME = process.env.E2E_DB_NAME ?? 'auth_test_db';
    process.env.REDIS_HOST ??= 'redis';
    process.env.REDIS_PORT ??= '6379';
    process.env.JWT_ACCESS_SECRET ??=
      'test_access_secret_abcdefghijklmnopqrstuvwxyz';
    process.env.JWT_REFRESH_SECRET ??=
      'test_refresh_secret_abcdefghijklmnopqrstuvwxyz';
    process.env.JWT_ACCESS_TTL ??= '15m';
    process.env.JWT_REFRESH_TTL ??= '7d';
    process.env.JWT_ISSUER ??= 'auth-service';
    process.env.JWT_AUDIENCE ??= 'transcendence-internal';
    process.env.GOOGLE_CLIENT_ID ??= 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET ??= 'test-google-client-secret';
    process.env.GOOGLE_REDIRECT_URI ??=
      'http://localhost:3000/auth/google/callback';
    process.env.REFRESH_TOKEN_BYTES ??= '48';
    process.env.REFRESH_TOKEN_TTL ??= '7d';
    process.env.REFRESH_TOKEN_HASH_PEPPER ??= '';
    process.env.BCRYPT_ROUNDS ??= '10';
    process.env.SERVICE_NAME ??= 'auth-service';
    process.env.SERVICE_VERSION ??= '1.0.0';

    const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`;
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });

    await clearAuthRateLimitKeys();

    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "audit_logs", "password_reset_tokens", "auth_providers", "sessions", "user_roles", "roles", "users" RESTART IDENTITY CASCADE',
    );
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/internal/auth');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (prisma) {
      await prisma.$executeRawUnsafe(
        'TRUNCATE TABLE "audit_logs", "password_reset_tokens", "auth_providers", "sessions", "user_roles", "roles", "users" RESTART IDENTITY CASCADE',
      );
      await prisma.$disconnect();
    }

    await clearAuthRateLimitKeys();
  });

  it('register/login/logoutAll revokes all active sessions', async () => {
    expect(app).toBeDefined();
    expect(prisma).toBeDefined();

    const registerResponse = await request(app!.getHttpServer())
      .post('/internal/auth/register')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app!.getHttpServer())
      .post('/internal/auth/login')
      .send({ email, password })
      .expect(200);

    const logoutAllResponse = await request(app!.getHttpServer())
      .post('/internal/auth/logout')
      .send({
        refreshToken: loginResponse.body.tokens.refreshToken,
        logoutAll: true,
      })
      .expect(200);

    expect(logoutAllResponse.body.success).toBe(true);
    expect(
      logoutAllResponse.body.revokedSessionIds.length,
    ).toBeGreaterThanOrEqual(2);

    await request(app!.getHttpServer())
      .post('/internal/auth/refresh')
      .send({ refreshToken: registerResponse.body.tokens.refreshToken })
      .expect(401);

    await request(app!.getHttpServer())
      .post('/internal/auth/refresh')
      .send({ refreshToken: loginResponse.body.tokens.refreshToken })
      .expect(401);

    const user = await prisma!.user.findUnique({ where: { email } });
    expect(user).toBeTruthy();

    const activeSessions = await prisma!.session.count({
      where: {
        userId: user!.id,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    expect(activeSessions).toBe(0);
  });

  it('google exchange creates once and logs in repeatedly', async () => {
    expect(app).toBeDefined();
    expect(prisma).toBeDefined();

    const googleEmail = `e2e.google.${unique}@example.com`;
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'google-sub-e2e',
        email: googleEmail,
        email_verified: true,
        aud: process.env.GOOGLE_CLIENT_ID,
        iss: 'https://accounts.google.com',
      }),
    } as Response);

    const firstExchange = await request(app!.getHttpServer())
      .post('/internal/auth/google/exchange')
      .send({ provider: 'google', idToken: 'test-id-token' })
      .expect(200);

    const secondExchange = await request(app!.getHttpServer())
      .post('/internal/auth/google/exchange')
      .send({ provider: 'google', idToken: 'test-id-token' })
      .expect(200);

    fetchSpy.mockRestore();

    expect(firstExchange.body.user.id).toEqual(secondExchange.body.user.id);

    const userId = firstExchange.body.user.id as string;
    const registeredCount = await prisma!.auditLog.count({
      where: {
        userId,
        action: 'USER_REGISTERED',
      },
    });
    const exchangeCount = await prisma!.auditLog.count({
      where: {
        userId,
        action: 'GOOGLE_EXCHANGE',
      },
    });
    const loginSucceededCount = await prisma!.auditLog.count({
      where: {
        userId,
        action: 'LOGIN_SUCCEEDED',
      },
    });

    expect(registeredCount).toBe(1);
    expect(exchangeCount).toBeGreaterThanOrEqual(2);
    expect(loginSucceededCount).toBeGreaterThanOrEqual(2);
  });

  it('refresh rotates token and invalidates old refresh token', async () => {
    const rotateEmail = `e2e.rotate.${unique}@example.com`;

    const registerResponse = await request(app!.getHttpServer())
      .post('/internal/auth/register')
      .send({ email: rotateEmail, password })
      .expect(201);

    const firstRefreshToken = registerResponse.body.tokens
      .refreshToken as string;

    const refreshResponse = await request(app!.getHttpServer())
      .post('/internal/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(200);

    const secondRefreshToken = refreshResponse.body.tokens
      .refreshToken as string;
    expect(secondRefreshToken).toBeTruthy();
    expect(secondRefreshToken).not.toEqual(firstRefreshToken);

    await request(app!.getHttpServer())
      .post('/internal/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(401);

    await request(app!.getHttpServer())
      .post('/internal/auth/refresh')
      .send({ refreshToken: secondRefreshToken })
      .expect(200);
  });

  it('records LOGIN_FAILED audit on bad password', async () => {
    const loginFailEmail = `e2e.badpass.${unique}@example.com`;

    await request(app!.getHttpServer())
      .post('/internal/auth/register')
      .send({ email: loginFailEmail, password })
      .expect(201);

    await request(app!.getHttpServer())
      .post('/internal/auth/login')
      .send({ email: loginFailEmail, password: 'totally-wrong-password' })
      .expect(401);

    const user = await prisma!.user.findUnique({
      where: { email: loginFailEmail },
    });
    expect(user).toBeTruthy();

    const failedLoginCount = await prisma!.auditLog.count({
      where: {
        userId: user!.id,
        action: 'LOGIN_FAILED',
      },
    });

    expect(failedLoginCount).toBeGreaterThanOrEqual(1);
  });

  it('enforces admin authorization on audit listing endpoint', async () => {
    await request(app!.getHttpServer()).get('/internal/auth/audit').expect(401);

    const nonAdminEmail = `e2e.nonadmin.${unique}@example.com`;
    const registerResponse = await request(app!.getHttpServer())
      .post('/internal/auth/register')
      .send({ email: nonAdminEmail, password })
      .expect(201);

    const userToken = registerResponse.body.tokens.accessToken as string;

    await request(app!.getHttpServer())
      .get('/internal/auth/audit')
      .set(authHeader(userToken))
      .expect(403);
  });

  it('admin can filter and paginate SESSION_REVOKED audit events', async () => {
    const adminEmail = `e2e.admin.${unique}@example.com`;
    const targetOneEmail = `e2e.target1.${unique}@example.com`;
    const targetTwoEmail = `e2e.target2.${unique}@example.com`;

    const adminFetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'google-sub-admin-e2e',
        email: adminEmail,
        email_verified: true,
        aud: process.env.GOOGLE_CLIENT_ID,
        iss: 'https://accounts.google.com',
      }),
    } as Response);

    const adminExchange = await request(app!.getHttpServer())
      .post('/internal/auth/google/exchange')
      .send({ provider: 'google', idToken: 'test-id-token' })
      .expect(200);

    const adminUserId = adminExchange.body.user.id as string;
    await promoteToAdmin(adminUserId);

    const adminLogin = await request(app!.getHttpServer())
      .post('/internal/auth/google/exchange')
      .send({ provider: 'google', idToken: 'test-id-token' })
      .expect(200);

    adminFetchSpy.mockRestore();

    const adminAccessToken = adminLogin.body.tokens.accessToken as string;

    const targetOne = await prisma!.user.create({
      data: {
        email: targetOneEmail,
        status: 'ACTIVE',
      },
    });
    const targetOneId = targetOne.id;

    await request(app!.getHttpServer())
      .post(`/internal/auth/users/${targetOneId}/sessions/revoke`)
      .set(authHeader(adminAccessToken))
      .send({ reason: 'e2e pagination test one' })
      .expect(200);

    const targetTwo = await prisma!.user.create({
      data: {
        email: targetTwoEmail,
        status: 'ACTIVE',
      },
    });
    const targetTwoId = targetTwo.id;

    await request(app!.getHttpServer())
      .post(`/internal/auth/users/${targetTwoId}/sessions/revoke`)
      .set(authHeader(adminAccessToken))
      .send({ reason: 'e2e pagination test two' })
      .expect(200);

    const firstPage = await request(app!.getHttpServer())
      .get('/internal/auth/audit')
      .query({ action: 'SESSIONS_REVOKED', limit: 1 })
      .set(authHeader(adminAccessToken))
      .expect(200);

    expect(firstPage.body.items).toHaveLength(1);
    expect(firstPage.body.items[0].action).toEqual('SESSIONS_REVOKED');
    expect(firstPage.body.pageInfo?.nextCursor).toBeTruthy();

    const secondPage = await request(app!.getHttpServer())
      .get('/internal/auth/audit')
      .query({
        action: 'SESSIONS_REVOKED',
        limit: 1,
        cursor: firstPage.body.pageInfo.nextCursor,
      })
      .set(authHeader(adminAccessToken))
      .expect(200);

    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.items[0].action).toEqual('SESSIONS_REVOKED');
  });

  it('google-authenticated user can set password then login normally with same account', async () => {
    const googleEmail = `e2e.hybrid.${unique}@example.com`;
    const normalPassword = 'HybridPassword123!';

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'google-sub-hybrid-e2e',
        email: googleEmail,
        email_verified: true,
        aud: process.env.GOOGLE_CLIENT_ID,
        iss: 'https://accounts.google.com',
      }),
    } as Response);

    const googleExchange = await request(app!.getHttpServer())
      .post('/internal/auth/google/exchange')
      .send({ provider: 'google', idToken: 'test-id-token' })
      .expect(200);

    fetchSpy.mockRestore();

    const userId = googleExchange.body.user.id as string;
    const accessToken = googleExchange.body.tokens.accessToken as string;
    const refreshToken = googleExchange.body.tokens.refreshToken as string;

    await request(app!.getHttpServer())
      .post('/internal/auth/password/set')
      .set(authHeader(accessToken))
      .send({ password: normalPassword })
      .expect(200);

    await request(app!.getHttpServer())
      .post('/internal/auth/logout')
      .send({
        refreshToken,
        logoutAll: false,
      })
      .expect(200);

    const loginResponse = await request(app!.getHttpServer())
      .post('/internal/auth/login')
      .send({ email: googleEmail, password: normalPassword })
      .expect(200);

    expect(loginResponse.body.user.id).toEqual(userId);
  });
});
