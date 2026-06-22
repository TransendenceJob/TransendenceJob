import { UnauthorizedException } from '@nestjs/common';
import { BearerAuthGuard } from '../../../../src/modules/auth/security/guards/bearer-auth.guard';
import type { AccessTokenService } from '../../../../src/modules/auth/tokens/access-token.service';

describe('BearerAuthGuard', () => {
  const accessTokens = {
    verifyAccessToken: jest.fn(),
  } as unknown as AccessTokenService;

  const guard = new BearerAuthGuard(accessTokens);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('attaches auth principal when bearer token is valid', async () => {
    const request = {
      bearerToken: 'access-token',
    } as any;

    (accessTokens.verifyAccessToken as jest.Mock).mockResolvedValue({
      sub: 'usr_1',
      email: 'john@example.com',
      roles: ['ADMIN'],
      sessionId: 'sess_1',
      iss: 'auth-service',
      aud: 'transcendence-internal',
      iat: 1,
      exp: 2,
    });

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(accessTokens.verifyAccessToken).toHaveBeenCalledWith('access-token');
    expect(request.authPrincipal?.token).toBe('access-token');
    expect(request.authPrincipal?.roleSet.has('ADMIN')).toBe(true);
  });

  it('rejects when bearer token is missing', async () => {
    const request = {} as any;
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
