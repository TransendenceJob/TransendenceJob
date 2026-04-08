import { Test } from '@nestjs/testing';
import { AuthRegisterService } from '../../../src/modules/auth/services/auth-register.service';
import { AuthRefreshService } from '../../../src/modules/auth/services/auth-refresh.service';
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
});
