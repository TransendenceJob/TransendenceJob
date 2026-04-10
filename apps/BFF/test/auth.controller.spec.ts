import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthController', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    googleExchange: jest.fn(),
    googleStart: jest.fn(),
    googleCallback: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    verify: jest.fn(),
    me: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer() as Parameters<typeof request>[0];
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns typed register shape', async () => {
    authServiceMock.register.mockResolvedValue({
      success: true,
      user: { id: 'u1', email: 'john@example.com', status: 'ACTIVE' },
      tokens: {
        accessToken: 'at',
        refreshToken: 'rt',
        expiresIn: 900,
        tokenType: 'Bearer',
      },
      session: { id: 's1', expiresAt: '2030-01-01T00:00:00.000Z' },
    });

    const response = await request(server)
      .post('/auth/register')
      .send({ email: 'john@example.com', password: 'StrongPassword123!' });

    const body = response.body as {
      success: boolean;
      user: { id: string };
      tokens: { tokenType: string };
    };

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.user.id).toBe('u1');
    expect(body.tokens.tokenType).toBe('Bearer');
  });

  it('returns typed verify shape', async () => {
    authServiceMock.verify.mockResolvedValue({
      success: true,
      valid: true,
      user: { id: 'u1', email: 'john@example.com', status: 'ACTIVE' },
      session: { id: 's1', expiresAt: '2030-01-01T00:00:00.000Z' },
      claims: { sub: 'u1', iat: 1, exp: 2, iss: 'auth_service' },
    });

    const response = await request(server)
      .get('/auth/verify')
      .set('authorization', 'Bearer token');

    const body = response.body as {
      success: boolean;
      valid: boolean;
      claims: { iss: string };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.valid).toBe(true);
    expect(body.claims.iss).toBe('auth_service');
  });

  it('returns typed google exchange shape', async () => {
    authServiceMock.googleExchange.mockResolvedValue({
      success: true,
      user: {
        id: 'u1',
        email: 'john@example.com',
        status: 'ACTIVE',
        providers: [{ provider: 'google', providerUserId: 'google-uid' }],
      },
      tokens: {
        accessToken: 'at',
        refreshToken: 'rt',
        expiresIn: 900,
        tokenType: 'Bearer',
      },
      session: { id: 's1', expiresAt: '2030-01-01T00:00:00.000Z' },
    });

    const response = await request(server)
      .post('/auth/google/exchange')
      .send({ provider: 'google', idToken: 'id-token' });

    const body = response.body as {
      success: boolean;
      user: { id: string; providers?: Array<{ provider: string }> };
      tokens: { tokenType: string };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.id).toBe('u1');
    expect(body.user.providers?.[0]?.provider).toBe('google');
    expect(body.tokens.tokenType).toBe('Bearer');
  });

  it('redirects to Google OAuth authorize URL from start endpoint', async () => {
    authServiceMock.googleStart.mockReturnValue(
      'https://accounts.google.com/o/oauth2/v2/auth?state=abc',
    );

    const response = await request(server).get('/auth/google/start');

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
  });

  it('redirects to frontend callback from Google callback endpoint', async () => {
    authServiceMock.googleCallback.mockResolvedValue(
      'http://localhost:3005/auth/google/callback#accessToken=at&refreshToken=rt',
    );

    const response = await request(server)
      .get('/auth/google/callback')
      .query({
        code: 'google-auth-code',
        state: 'signed-state',
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(
      '/auth/google/callback',
    );
    expect(authServiceMock.googleCallback).toHaveBeenCalledWith(
      {
        code: 'google-auth-code',
        state: 'signed-state',
        error: undefined,
        errorDescription: undefined,
      },
      {
        requestId: undefined,
      },
    );
  });
});
