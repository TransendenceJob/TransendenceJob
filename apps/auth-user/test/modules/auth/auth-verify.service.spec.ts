import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthVerifyService } from '../../../src/modules/auth/services/auth-verify.service';

describe('AuthVerifyService', () => {
  let sessions: {
    findActiveByIdWithUser: jest.Mock;
  };
  let users: {
    getRoleNamesForUser: jest.Mock;
    findByIdWithAuthProviders: jest.Mock;
  };
  let accessTokens: {
    verifyAccessToken: jest.Mock;
  };
  let service: AuthVerifyService;

  beforeEach(() => {
    sessions = {
      findActiveByIdWithUser: jest.fn(),
    };
    users = {
      getRoleNamesForUser: jest.fn(),
      findByIdWithAuthProviders: jest.fn(),
    };
    accessTokens = {
      verifyAccessToken: jest.fn(),
    };

    service = new AuthVerifyService(
      sessions as never,
      users as never,
      accessTokens as never,
    );
  });

  it('returns normalized auth context for a valid token', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'usr_1',
      email: 'john@example.com',
      roles: ['USER'],
      sessionId: 'sess_1',
      iss: 'auth-service',
      aud: 'transcendence-internal',
      iat: 1710000000,
      exp: 1710000900,
    });
    sessions.findActiveByIdWithUser.mockResolvedValue({
      id: 'sess_1',
      userId: 'usr_1',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 'usr_1',
        email: 'john@example.com',
        status: 'ACTIVE',
        createdAt: new Date('2026-04-03T13:00:00.000Z'),
        disabledAt: null,
      },
    });
    users.getRoleNamesForUser.mockResolvedValue(['USER', 'ADMIN']);
    users.findByIdWithAuthProviders.mockResolvedValue({
      authProviders: [{ provider: 'GOOGLE', providerUserId: 'google_abc' }],
    });

    const result = await service.verify({
      token: 'access-token',
      audience: 'transcendence-internal',
    });

    expect(result.valid).toBe(true);
    expect(result.user.id).toBe('usr_1');
    expect(result.user.roles).toHaveLength(2);
    expect(result.session.id).toBe('sess_1');
    expect(result.claims.sub).toBe('usr_1');
  });

  it('rejects invalid access tokens', async () => {
    accessTokens.verifyAccessToken.mockRejectedValue(
      new UnauthorizedException('Invalid access token'),
    );

    await expect(
      service.verify({ token: 'bad-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects disabled users', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'usr_1',
      email: 'john@example.com',
      roles: ['USER'],
      sessionId: 'sess_1',
      iss: 'auth-service',
      aud: 'transcendence-internal',
      iat: 1710000000,
      exp: 1710000900,
    });
    sessions.findActiveByIdWithUser.mockResolvedValue({
      id: 'sess_1',
      userId: 'usr_1',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 'usr_1',
        email: 'john@example.com',
        status: 'DISABLED',
        createdAt: new Date('2026-04-03T13:00:00.000Z'),
        disabledAt: new Date('2026-04-03T14:00:00.000Z'),
      },
    });

    await expect(
      service.verify({ token: 'access-token' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects audience mismatches when provided', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'usr_1',
      email: 'john@example.com',
      roles: ['USER'],
      sessionId: 'sess_1',
      iss: 'auth-service',
      aud: 'transcendence-internal',
      iat: 1710000000,
      exp: 1710000900,
    });

    await expect(
      service.verify({
        token: 'access-token',
        audience: 'other-audience',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});