import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaClient } from '@prisma/client';
import { AppModule } from './../src/app.module';

describe('Auth flows (e2e)', () => {
  let app: INestApplication<App> | undefined;
  let prisma: PrismaClient | undefined;

  const unique = `${Date.now()}`;
  const email = `e2e.${unique}@example.com`;
  const password = 'StrongPassword123!';

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
    process.env.GOOGLE_REDIRECT_URI ??= 'http://localhost:3000/auth/google/callback';
    process.env.REFRESH_TOKEN_BYTES ??= '48';
    process.env.REFRESH_TOKEN_TTL ??= '7d';
    process.env.REFRESH_TOKEN_HASH_PEPPER ??= '';
    process.env.BCRYPT_ROUNDS ??= '10';
    process.env.SERVICE_NAME ??= 'auth-service';
    process.env.SERVICE_VERSION ??= '1.0.0';

    prisma = new PrismaClient();

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
    expect(logoutAllResponse.body.revokedSessionIds.length).toBeGreaterThanOrEqual(
      2,
    );

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
});
