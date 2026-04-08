import { Test } from '@nestjs/testing';
import { AuthRegisterService } from '../../../src/modules/auth/services/auth-register.service';
import { AuthRefreshService } from '../../../src/modules/auth/services/auth-refresh.service';
import { AuthLogoutService } from '../../../src/modules/auth/services/auth-logout.service';
import { AuthService } from '../../../src/modules/auth/services/auth.service';

describe('AuthService', () => {
  it('delegates register to AuthRegisterService', async () => {
    const register = jest.fn().mockResolvedValue({ ok: true });

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRegisterService,
          useValue: {
            register,
          },
        },
        {
          provide: AuthRefreshService,
          useValue: {
            refresh: jest.fn(),
          },
        },
        {
          provide: AuthLogoutService,
          useValue: {
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    const authService = moduleRef.get(AuthService);

    await expect(
      authService.register({} as never, { requestId: 'req-1' }),
    ).resolves.toEqual({ ok: true });

    expect(register).toHaveBeenCalledWith({} as never, {
      requestId: 'req-1',
    });
  });

  it('delegates logout to AuthLogoutService', async () => {
    const logout = jest.fn().mockResolvedValue({
      success: true,
      revokedSessionIds: ['sess_1'],
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRegisterService,
          useValue: {
            register: jest.fn(),
          },
        },
        {
          provide: AuthRefreshService,
          useValue: {
            refresh: jest.fn(),
          },
        },
        {
          provide: AuthLogoutService,
          useValue: {
            logout,
          },
        },
      ],
    }).compile();

    const authService = moduleRef.get(AuthService);

    await expect(
      authService.logout(
        { refreshToken: 'token', logoutAll: false },
        { requestId: 'req-1' },
      ),
    ).resolves.toEqual({
      success: true,
      revokedSessionIds: ['sess_1'],
    });

    expect(logout).toHaveBeenCalledWith(
      { refreshToken: 'token', logoutAll: false },
      {
        requestId: 'req-1',
      },
    );
  });
});
