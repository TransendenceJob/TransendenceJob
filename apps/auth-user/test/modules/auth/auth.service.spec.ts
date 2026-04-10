import { Test } from '@nestjs/testing';
import { AuthRegisterService } from '../../../src/modules/auth/services/auth-register.service';
import { AuthRefreshService } from '../../../src/modules/auth/services/auth-refresh.service';
import { AuthLogoutService } from '../../../src/modules/auth/services/auth-logout.service';
import { AuthVerifyService } from '../../../src/modules/auth/services/auth-verify.service';
import { AuthLoginService } from '../../../src/modules/auth/services/auth-login.service';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { UsersAuthService } from '../../../src/modules/users-auth/users-auth.service';
import { PasswordHashService } from '../../../src/modules/auth/hashing/password-hash.service';
import { AccessTokenService } from '../../../src/modules/auth/tokens/access-token.service';
import { RefreshTokenService } from '../../../src/modules/auth/tokens/refresh-token.service';
import { AuditLogRepository } from '../../../src/modules/persistence/repositories/audit-log.repository';

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
        {
          provide: AuthVerifyService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: AuthLoginService,
          useValue: {
            login: jest.fn(),
          },
        },
        {
          provide: UsersAuthService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: PasswordHashService,
          useValue: {
            compare: jest.fn(),
          },
        },
        {
          provide: AccessTokenService,
          useValue: {
            generateAccessToken: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            createSessionWithRefreshToken: jest.fn(),
          },
        },
        {
          provide: AuditLogRepository,
          useValue: {
            createEvent: jest.fn(),
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
        {
          provide: AuthVerifyService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: AuthLoginService,
          useValue: {
            login: jest.fn(),
          },
        },
        {
          provide: UsersAuthService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: PasswordHashService,
          useValue: {
            compare: jest.fn(),
          },
        },
        {
          provide: AccessTokenService,
          useValue: {
            generateAccessToken: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            createSessionWithRefreshToken: jest.fn(),
          },
        },
        {
          provide: AuditLogRepository,
          useValue: {
            createEvent: jest.fn(),
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

  it('delegates verify to AuthVerifyService', async () => {
    const verify = jest.fn().mockResolvedValue({ valid: true });

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
            logout: jest.fn(),
          },
        },
        {
          provide: AuthVerifyService,
          useValue: {
            verify,
          },
        },
        {
          provide: AuthLoginService,
          useValue: {
            login: jest.fn(),
          },
        },
        {
          provide: UsersAuthService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: PasswordHashService,
          useValue: {
            compare: jest.fn(),
          },
        },
        {
          provide: AccessTokenService,
          useValue: {
            generateAccessToken: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            createSessionWithRefreshToken: jest.fn(),
          },
        },
        {
          provide: AuditLogRepository,
          useValue: {
            createEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    const authService = moduleRef.get(AuthService);

    await expect(
      authService.verify({ token: 'token', audience: 'audience' }),
    ).resolves.toEqual({ valid: true });

    expect(verify).toHaveBeenCalledWith({
      token: 'token',
      audience: 'audience',
    });
  });
});
