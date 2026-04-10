import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthAdminService } from '../../../src/modules/auth/services/auth-admin.service';

describe('AuthAdminService', () => {
  const db = {};

  let prisma: { $transaction: jest.Mock };
  let users: {
    findById: jest.Mock;
    disableUser: jest.Mock;
  };
  let sessions: {
    revokeAllSessionsForUser: jest.Mock;
  };
  let auditLogs: { createEvent: jest.Mock };
  let accessTokens: { verifyAccessToken: jest.Mock };
  let service: AuthAdminService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(
        async (handler: (dbClient: typeof db) => Promise<unknown>) =>
          handler(db),
      ),
    };

    users = {
      findById: jest.fn(),
      disableUser: jest.fn(),
    };

    sessions = {
      revokeAllSessionsForUser: jest.fn(),
    };

    auditLogs = {
      createEvent: jest.fn(),
    };

    accessTokens = {
      verifyAccessToken: jest.fn(),
    };

    service = new AuthAdminService(
      prisma as never,
      users as never,
      sessions as never,
      auditLogs as never,
      accessTokens as never,
    );
  });

  it('disables a user with admin token and revokes sessions', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'admin-1',
      roles: ['ADMIN'],
    });
    users.findById.mockResolvedValue({ id: 'user-1' });
    users.disableUser.mockResolvedValue({ id: 'user-1' });
    sessions.revokeAllSessionsForUser.mockResolvedValue({ count: 2 });

    const response = await service.disableUser(
      'user-1',
      { reason: 'fraud', revokeSessions: true },
      {
        bearerToken: 'token',
        ip: '127.0.0.1',
        userAgent: 'jest',
        requestId: 'req-1',
        serviceName: 'bff',
      },
    );

    expect(accessTokens.verifyAccessToken).toHaveBeenCalledWith('token');
    expect(users.disableUser).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      db,
    );
    expect(sessions.revokeAllSessionsForUser).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      db,
    );
    expect(auditLogs.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_DISABLED',
        userId: 'user-1',
        actorUserId: 'admin-1',
        metadataJson: expect.objectContaining({
          reason: 'fraud',
          revokedSessions: 2,
          authMode: 'admin',
        }),
      }),
      db,
    );
    expect(response).toEqual({
      userId: 'user-1',
      status: 'disabled',
      revokedSessions: 2,
    });
  });

  it('allows system service actor without bearer token', async () => {
    users.findById.mockResolvedValue({ id: 'user-1' });
    users.disableUser.mockResolvedValue({ id: 'user-1' });

    const response = await service.disableUser(
      'user-1',
      { reason: 'system action', revokeSessions: false },
      {
        serviceName: 'system',
      },
    );

    expect(accessTokens.verifyAccessToken).not.toHaveBeenCalled();
    expect(sessions.revokeAllSessionsForUser).not.toHaveBeenCalled();
    expect(auditLogs.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_DISABLED',
        actorUserId: null,
        metadataJson: expect.objectContaining({
          authMode: 'service',
          revokeSessions: false,
          revokedSessions: 0,
        }),
      }),
      db,
    );
    expect(response.revokedSessions).toBe(0);
  });

  it('rejects missing token for non-service actors', async () => {
    await expect(
      service.disableUser(
        'user-1',
        { reason: 'x', revokeSessions: true },
        {
          serviceName: 'bff',
        },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects non-admin user token', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'user-2',
      roles: ['USER'],
    });

    await expect(
      service.disableUser(
        'user-1',
        { reason: 'x', revokeSessions: true },
        {
          bearerToken: 'token',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundException for unknown user', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'admin-1',
      roles: ['ADMIN'],
    });
    users.findById.mockResolvedValue(null);

    await expect(
      service.disableUser(
        'missing-user',
        { reason: 'x', revokeSessions: true },
        {
          bearerToken: 'token',
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
