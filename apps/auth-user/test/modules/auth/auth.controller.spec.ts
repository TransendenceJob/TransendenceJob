import { AuthController } from '../../../src/modules/auth/auth.controller';
import { type AuthService } from '../../../src/modules/auth/services/auth.service';

describe('AuthController.register', () => {
  const authService = {
    register: jest.fn(),
    refresh: jest.fn(),
  } satisfies Pick<AuthService, 'register' | 'refresh'>;

  const controller = new AuthController(authService as unknown as AuthService);

  beforeEach(() => {
    jest.clearAllMocks();
    authService.register = jest.fn().mockResolvedValue({
      user: {
        id: 'usr_1',
        email: 'john@example.com',
        status: 'pending',
        roles: ['user'],
      },
      tokens: {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
        tokenType: 'Bearer',
      },
      session: {
        id: 'sess_1',
        expiresAt: '2026-04-03T13:00:00.000Z',
        revoked: false,
      },
    });
  });

  it('delegates register request with normalized request context', async () => {
    const req = {
      ip: '10.0.0.5',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
    } as any;

    await controller.register(
      {
        email: 'john@example.com',
        password: 'VeryStrong123!',
      },
      req,
    );

    expect(authService.register).toHaveBeenCalledWith(
      {
        email: 'john@example.com',
        password: 'VeryStrong123!',
      },
      {
        ip: '10.0.0.5',
        userAgent: 'Mozilla/5.0',
        requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
        serviceName: 'bff',
      },
    );
  });
});
