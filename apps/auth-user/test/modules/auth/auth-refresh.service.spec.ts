import { UnauthorizedException } from '@nestjs/common';
import { AuthRefreshService } from '../../../src/modules/auth/services/auth-refresh.service';

describe('AuthRefreshService', () => {
  const db = {};

  let prisma: { $transaction: jest.Mock };
  let users: { getRoleNamesForUser: jest.Mock };
  let sessions: {
    findActiveByRefreshTokenHashWithUser: jest.Mock;
    updateRefreshTokenHashIfCurrent: jest.Mock;
  };
  let auditLogs: { createEvent: jest.Mock };
  let tokenIssue: {
    createRefreshTokenPair: jest.Mock;
    issueAccessToken: jest.Mock;
    accessTokenExpiresInSeconds: jest.Mock;
  };
  let refreshTokens: {
    hashRefreshToken: jest.Mock;
    verifyRefreshToken: jest.Mock;
  };
  let sessionCache: { cacheSession: jest.Mock };
  let service: AuthRefreshService;

  beforeEach(() => {
    users = {
      getRoleNamesForUser: jest.fn(),
    };
    sessions = {
      findActiveByRefreshTokenHashWithUser: jest.fn(),
      updateRefreshTokenHashIfCurrent: jest.fn(),
    };
    auditLogs = {
      createEvent: jest.fn(),
    };
    tokenIssue = {
      createRefreshTokenPair: jest.fn(),
      issueAccessToken: jest.fn(),
      accessTokenExpiresInSeconds: jest.fn().mockReturnValue(900),
    };
    refreshTokens = {
      hashRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    sessionCache = {
      cacheSession: jest.fn(),
    };
    prisma = {
      $transaction: jest.fn(
        async (handler: (dbClient: typeof db) => Promise<unknown>) =>
          handler(db),
      ),
    };

    service = new AuthRefreshService(
      prisma as never,
      users as never,
      sessions as never,
      auditLogs as never,
      tokenIssue as never,
      refreshTokens as never,
      sessionCache as never,
    );
  });

  it('rotates the refresh token and returns the new token pair', async () => {
    refreshTokens.hashRefreshToken.mockReturnValue('incoming-hash');
    refreshTokens.verifyRefreshToken.mockReturnValue(true);
    sessions.findActiveByRefreshTokenHashWithUser.mockResolvedValue({
      id: 'sess_1',
      userId: 'user_1',
      refreshTokenHash: 'incoming-hash',
      revokedAt: null,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      user: {
        id: 'user_1',
        email: 'stefan@example.com',
        status: 'ACTIVE',
        disabledAt: null,
      },
    });
    users.getRoleNamesForUser.mockResolvedValue(['USER']);
    tokenIssue.createRefreshTokenPair.mockReturnValue({
      refreshToken: 'new-refresh',
      refreshTokenHash: 'new-refresh-hash',
      expiresAt: new Date('2030-02-01T00:00:00.000Z'),
    });
    sessions.updateRefreshTokenHashIfCurrent.mockResolvedValue({ count: 1 });
    tokenIssue.issueAccessToken.mockResolvedValue('new-access');

    const result = await service.refresh(
      { refreshToken: 'old-refresh' },
      {
        ip: '127.0.0.1',
        userAgent: 'jest',
        requestId: 'req-1',
        serviceName: 'bff',
      },
    );

    expect(refreshTokens.hashRefreshToken).toHaveBeenCalledWith('old-refresh');
    expect(sessions.findActiveByRefreshTokenHashWithUser).toHaveBeenCalledWith(
      'incoming-hash',
      db,
    );
    expect(sessions.updateRefreshTokenHashIfCurrent).toHaveBeenCalledWith(
      'sess_1',
      'incoming-hash',
      'new-refresh-hash',
      new Date('2030-02-01T00:00:00.000Z'),
      db,
    );
    expect(auditLogs.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REFRESH_SUCCEEDED',
        userId: 'user_1',
        actorUserId: 'user_1',
        ip: '127.0.0.1',
        userAgent: 'jest',
      }),
      db,
    );
    expect(sessionCache.cacheSession).toHaveBeenCalledWith({
      session: {
        id: 'sess_1',
        expiresAt: new Date('2030-02-01T00:00:00.000Z'),
      },
      user: {
        id: 'user_1',
        status: 'ACTIVE',
      },
      roles: ['USER'],
      requestId: 'req-1',
      serviceName: 'bff',
    });
    expect(tokenIssue.issueAccessToken).toHaveBeenCalledWith({
      userId: 'user_1',
      email: 'stefan@example.com',
      roles: ['USER'],
      sessionId: 'sess_1',
    });
    expect(result.tokens.accessToken).toBe('new-access');
    expect(result.tokens.refreshToken).toBe('new-refresh');
    expect(result.session.id).toBe('sess_1');
    expect(result.session.revoked).toBe(false);
  });

  it('rejects a refresh token when the session is no longer active', async () => {
    refreshTokens.hashRefreshToken.mockReturnValue('incoming-hash');
    sessions.findActiveByRefreshTokenHashWithUser.mockResolvedValue(null);

    await expect(
      service.refresh({ refreshToken: 'old-refresh' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessions.updateRefreshTokenHashIfCurrent).not.toHaveBeenCalled();
    expect(auditLogs.createEvent).not.toHaveBeenCalled();
  });

  it('rejects replayed refresh tokens when the stored hash already changed', async () => {
    refreshTokens.hashRefreshToken.mockReturnValue('incoming-hash');
    refreshTokens.verifyRefreshToken.mockReturnValue(true);
    sessions.findActiveByRefreshTokenHashWithUser.mockResolvedValue({
      id: 'sess_1',
      userId: 'user_1',
      refreshTokenHash: 'incoming-hash',
      revokedAt: null,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      user: {
        id: 'user_1',
        email: 'stefan@example.com',
        status: 'ACTIVE',
        disabledAt: null,
      },
    });
    users.getRoleNamesForUser.mockResolvedValue(['USER']);
    tokenIssue.createRefreshTokenPair.mockReturnValue({
      refreshToken: 'new-refresh',
      refreshTokenHash: 'new-refresh-hash',
      expiresAt: new Date('2030-02-01T00:00:00.000Z'),
    });
    sessions.updateRefreshTokenHashIfCurrent.mockResolvedValue({ count: 0 });

    await expect(
      service.refresh({ refreshToken: 'old-refresh' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(auditLogs.createEvent).not.toHaveBeenCalled();
    expect(sessionCache.cacheSession).not.toHaveBeenCalled();
    expect(tokenIssue.issueAccessToken).not.toHaveBeenCalled();
  });
});
