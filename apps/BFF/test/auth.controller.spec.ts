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
});
