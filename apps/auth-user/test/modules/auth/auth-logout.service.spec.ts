import { UnauthorizedException } from '@nestjs/common';
import { AuthLogoutService } from '../../../src/modules/auth/services/auth-logout.service';

describe('AuthLogoutService', () => {
  const db = {};

  let prisma: { $transaction: jest.Mock };
  let sessions: {
    findActiveByRefreshTokenHashWithUser: jest.Mock;
    findActiveSessionsByUserId: jest.Mock;
    revokeSession: jest.Mock;
    revokeAllSessionsForUser: jest.Mock;
  };
  let auditLogs: { createEvent: jest.Mock };
  let refreshTokens: {
    hashRefreshToken: jest.Mock;
    verifyRefreshToken: jest.Mock;
  };
  let sessionCache: { invalidateSession: jest.Mock };
  let rateLimit: { ensureLogoutAllowed: jest.Mock };
  let service: AuthLogoutService;

  beforeEach(() => {
    sessions = {
      findActiveByRefreshTokenHashWithUser: jest.fn(),
      findActiveSessionsByUserId: jest.fn(),
      revokeSession: jest.fn(),
      revokeAllSessionsForUser: jest.fn(),
    };
    auditLogs = {
      createEvent: jest.fn(),
    };
    refreshTokens = {
      hashRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    sessionCache = {
      invalidateSession: jest.fn(),
    };
    rateLimit = {
      ensureLogoutAllowed: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      $transaction: jest.fn(
        async (handler: (dbClient: typeof db) => Promise<unknown>) =>
          handler(db),
      ),
    };

    service = new AuthLogoutService(
      prisma as never,
      sessions as never,
      auditLogs as never,
      refreshTokens as never,
      sessionCache as never,
      rateLimit as never,
    );
  });

  describe('logout - single session', () => {
    it('revokes a single session and logs audit event', async () => {
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
          email: 'john@example.com',
          status: 'ACTIVE',
          disabledAt: null,
        },
      });
      sessions.revokeSession.mockResolvedValue({
        id: 'sess_1',
        revokedAt: new Date(),
      });

      const result = await service.logout(
        { refreshToken: 'refresh-token', logoutAll: false },
        {
          ip: '127.0.0.1',
          userAgent: 'jest',
          requestId: 'req-1',
          serviceName: 'bff',
        },
      );

      expect(rateLimit.ensureLogoutAllowed).toHaveBeenCalledWith({
        ip: '127.0.0.1',
      });
      expect(refreshTokens.hashRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
      );
      expect(
        sessions.findActiveByRefreshTokenHashWithUser,
      ).toHaveBeenCalledWith('incoming-hash', db);
      expect(refreshTokens.verifyRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
        'incoming-hash',
      );
      expect(sessions.revokeSession).toHaveBeenCalledWith(
        'sess_1',
        expect.any(Date),
        db,
      );
      expect(auditLogs.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGOUT',
          userId: 'user_1',
          actorUserId: 'user_1',
          ip: '127.0.0.1',
          userAgent: 'jest',
          metadataJson: expect.objectContaining({
            source: 'internal/auth/logout',
            logoutAll: false,
            sessionId: 'sess_1',
          }),
        }),
        db,
      );
      expect(sessionCache.invalidateSession).toHaveBeenCalledWith('sess_1');
      expect(result).toEqual({
        success: true,
        revokedSessionIds: ['sess_1'],
      });
    });

    it('throws UnauthorizedException for invalid refresh token', async () => {
      refreshTokens.hashRefreshToken.mockReturnValue('incoming-hash');
      sessions.findActiveByRefreshTokenHashWithUser.mockResolvedValue(null);

      await expect(
        service.logout(
          { refreshToken: 'invalid-token', logoutAll: false },
          {
            ip: '127.0.0.1',
            userAgent: 'jest',
            requestId: 'req-1',
            serviceName: 'bff',
          },
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(rateLimit.ensureLogoutAllowed).toHaveBeenCalled();
    });

    it('throws UnauthorizedException when token hash verification fails', async () => {
      refreshTokens.hashRefreshToken.mockReturnValue('incoming-hash');
      refreshTokens.verifyRefreshToken.mockReturnValue(false);
      sessions.findActiveByRefreshTokenHashWithUser.mockResolvedValue({
        id: 'sess_1',
        userId: 'user_1',
        refreshTokenHash: 'incoming-hash',
        revokedAt: null,
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        user: {
          id: 'user_1',
          email: 'john@example.com',
          status: 'ACTIVE',
          disabledAt: null,
        },
      });

      await expect(
        service.logout(
          { refreshToken: 'refresh-token', logoutAll: false },
          {
            ip: '127.0.0.1',
            userAgent: 'jest',
            requestId: 'req-1',
            serviceName: 'bff',
          },
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout - all sessions', () => {
    it('revokes all sessions for user and logs audit event', async () => {
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
          email: 'john@example.com',
          status: 'ACTIVE',
          disabledAt: null,
        },
      });
      sessions.findActiveSessionsByUserId.mockResolvedValue([
        { id: 'sess_1' },
        { id: 'sess_2' },
        { id: 'sess_3' },
      ]);
      sessions.revokeAllSessionsForUser.mockResolvedValue({ count: 3 });

      const result = await service.logout(
        { refreshToken: 'refresh-token', logoutAll: true },
        {
          ip: '127.0.0.1',
          userAgent: 'jest',
          requestId: 'req-1',
          serviceName: 'bff',
        },
      );

      expect(rateLimit.ensureLogoutAllowed).toHaveBeenCalledWith({
        ip: '127.0.0.1',
      });
      expect(sessions.findActiveSessionsByUserId).toHaveBeenCalledWith(
        'user_1',
        db,
      );
      expect(sessions.revokeAllSessionsForUser).toHaveBeenCalledWith(
        'user_1',
        expect.any(Date),
        db,
      );
      expect(auditLogs.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGOUT',
          userId: 'user_1',
          actorUserId: 'user_1',
          ip: '127.0.0.1',
          userAgent: 'jest',
          metadataJson: expect.objectContaining({
            source: 'internal/auth/logout',
            logoutAll: true,
            revokedCount: 3,
          }),
        }),
        db,
      );
      expect(sessionCache.invalidateSession).toHaveBeenCalledWith('sess_1');
      expect(sessionCache.invalidateSession).toHaveBeenCalledWith('sess_2');
      expect(sessionCache.invalidateSession).toHaveBeenCalledWith('sess_3');
      expect(result).toEqual({
        success: true,
        revokedSessionIds: ['sess_1', 'sess_2', 'sess_3'],
      });
    });

    it('handles logoutAll with single session', async () => {
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
          email: 'john@example.com',
          status: 'ACTIVE',
          disabledAt: null,
        },
      });
      sessions.findActiveSessionsByUserId.mockResolvedValue([{ id: 'sess_1' }]);
      sessions.revokeAllSessionsForUser.mockResolvedValue({ count: 1 });

      const result = await service.logout(
        { refreshToken: 'refresh-token', logoutAll: true },
        {
          ip: '127.0.0.1',
          userAgent: 'jest',
          requestId: 'req-1',
          serviceName: 'bff',
        },
      );

      expect(result).toEqual({
        success: true,
        revokedSessionIds: ['sess_1'],
      });
    });
  });

  describe('rate limiting', () => {
    it('enforces logout rate limit', async () => {
      const rateLimitError = new Error('Too many logout attempts');
      rateLimit.ensureLogoutAllowed.mockRejectedValueOnce(rateLimitError);

      await expect(
        service.logout(
          { refreshToken: 'refresh-token', logoutAll: false },
          {
            ip: '127.0.0.1',
            userAgent: 'jest',
            requestId: 'req-1',
            serviceName: 'bff',
          },
        ),
      ).rejects.toThrow(rateLimitError);

      // Should not proceed if rate limit is exceeded
      expect(
        sessions.findActiveByRefreshTokenHashWithUser,
      ).not.toHaveBeenCalled();
    });
  });

  describe('context handling', () => {
    it('handles missing context fields gracefully', async () => {
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
          email: 'john@example.com',
          status: 'ACTIVE',
          disabledAt: null,
        },
      });
      sessions.revokeSession.mockResolvedValue({
        id: 'sess_1',
        revokedAt: new Date(),
      });

      const result = await service.logout(
        { refreshToken: 'refresh-token', logoutAll: false },
        {
          ip: null,
          userAgent: null,
          requestId: undefined,
          serviceName: undefined,
        },
      );

      expect(auditLogs.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: null,
          userAgent: null,
          metadataJson: expect.objectContaining({
            requestId: null,
            serviceName: null,
          }),
        }),
        db,
      );
      expect(result.success).toBe(true);
    });
  });
});
