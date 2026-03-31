import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AccessTokenService } from '../../../../src/modules/auth/tokens/access-token.service';
import { type AuthConfigService } from '../../../../src/modules/config/auth-config.service';

describe('AccessTokenService', () => {
  const jwtService = new JwtService();
  const config = {
    jwt: {
      accessSecret: 'a-very-long-access-secret-for-tests-1234567890',
      refreshSecret: 'a-very-long-refresh-secret-for-tests-1234567890',
      accessTtl: '15m',
      refreshTtl: '7d',
      issuer: 'auth-service',
      audience: 'transcendence-internal',
    },
  } as AuthConfigService;

  it('generates and verifies access token with expected claims', async () => {
    const service = new AccessTokenService(jwtService, config);

    const token = await service.generateAccessToken({
      sub: 'user-id-1',
      email: 'user@example.com',
      roles: ['USER'],
      sessionId: 'session-1',
    });

    const claims = await service.verifyAccessToken(token);
    expect(claims.sub).toBe('user-id-1');
    expect(claims.email).toBe('user@example.com');
    expect(claims.roles).toEqual(['USER']);
    expect(claims.sessionId).toBe('session-1');
    expect(claims.iss).toBe('auth-service');
    expect(claims.aud).toBe('transcendence-internal');
  });

  it('rejects token verification with wrong audience', async () => {
    const service = new AccessTokenService(jwtService, config);

    const token = await service.generateAccessToken({
      sub: 'user-id-1',
      email: 'user@example.com',
      roles: ['USER'],
      sessionId: 'session-1',
    });

    const wrongConfig = {
      jwt: {
        ...config.jwt,
        audience: 'other-audience',
      },
    } as AuthConfigService;

    const wrongAudienceService = new AccessTokenService(
      jwtService,
      wrongConfig,
    );

    await expect(wrongAudienceService.verifyAccessToken(token)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
