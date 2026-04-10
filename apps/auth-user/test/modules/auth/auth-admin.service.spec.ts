import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthAdminService } from '../../../src/modules/auth/services/auth-admin.service';
import { AuditActionDto } from '../../../src/modules/auth/contracts/enums/audit-action.enum';
import { UserRoleDto } from '../../../src/modules/auth/contracts/enums/user-role.enum';

describe('AuthAdminService', () => {
  const db = {};

  let prisma: { $transaction: jest.Mock };
  let users: {
    findById: jest.Mock;
    disableUser: jest.Mock;
  };
  let roles: {
    replaceUserRoles: jest.Mock;
  };
  let sessions: {
    revokeAllSessionsForUser: jest.Mock;
  };
  let auditLogs: { createEvent: jest.Mock; searchAuditLogs: jest.Mock };
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

    roles = {
      replaceUserRoles: jest.fn(),
    };

    sessions = {
      revokeAllSessionsForUser: jest.fn(),
    };

    auditLogs = {
      createEvent: jest.fn(),
      searchAuditLogs: jest.fn(),
    };

    accessTokens = {
      verifyAccessToken: jest.fn(),
    };

    service = new AuthAdminService(
      prisma as never,
      users as never,
      roles as never,
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

  it('allows trusted service actor with service token and allowlisted serviceName', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'svc-auth',
      roles: ['SERVICE'],
    });
    users.findById.mockResolvedValue({ id: 'user-1' });
    users.disableUser.mockResolvedValue({ id: 'user-1' });

    const response = await service.disableUser(
      'user-1',
      { reason: 'system action', revokeSessions: false },
      {
        bearerToken: 'service-token',
        serviceName: 'system',
      },
    );

    expect(accessTokens.verifyAccessToken).toHaveBeenCalledWith(
      'service-token',
    );
    expect(sessions.revokeAllSessionsForUser).not.toHaveBeenCalled();
    expect(auditLogs.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_DISABLED',
        actorUserId: 'svc-auth',
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

  it('replaces user roles transactionally and records role audit', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'admin-1',
      roles: ['ADMIN'],
    });
    users.findById.mockResolvedValue({ id: 'user-1' });
    roles.replaceUserRoles.mockResolvedValue(['USER', 'MODERATOR']);

    const response = await service.setUserRoles(
      'user-1',
      { roles: [UserRoleDto.USER, UserRoleDto.MODERATOR] },
      {
        bearerToken: 'token',
        requestId: 'req-role',
        serviceName: 'bff',
      },
    );

    expect(roles.replaceUserRoles).toHaveBeenCalledWith(
      'user-1',
      ['USER', 'MODERATOR'],
      db,
    );
    expect(auditLogs.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ROLE_CHANGED',
        userId: 'user-1',
        actorUserId: 'admin-1',
        metadataJson: expect.objectContaining({
          source: 'internal/auth/users/role',
          roles: ['USER', 'MODERATOR'],
          authMode: 'admin',
        }),
      }),
      db,
    );
    expect(response.userId).toBe('user-1');
    expect(response.roles).toEqual(['user', 'moderator']);
    expect(typeof response.updatedAt).toBe('string');
  });

  it('rejects unsupported roles', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'admin-1',
      roles: ['ADMIN'],
    });

    await expect(
      service.setUserRoles(
        'user-1',
        { roles: ['superadmin'] as never },
        {
          bearerToken: 'token',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('revokes all active sessions for a user and records audit event', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'admin-1',
      roles: ['ADMIN'],
    });
    users.findById.mockResolvedValue({ id: 'user-1' });
    sessions.revokeAllSessionsForUser.mockResolvedValue({ count: 4 });

    const response = await service.revokeUserSessions(
      'user-1',
      { reason: 'security remediation' },
      {
        bearerToken: 'token',
        ip: '127.0.0.1',
        userAgent: 'jest',
        requestId: 'req-revoke',
        serviceName: 'system',
      },
    );

    expect(accessTokens.verifyAccessToken).toHaveBeenCalledWith('token');
    expect(sessions.revokeAllSessionsForUser).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      db,
    );
    expect(auditLogs.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SESSION_REVOKED',
        userId: 'user-1',
        actorUserId: 'admin-1',
        metadataJson: expect.objectContaining({
          source: 'internal/auth/users/sessions/revoke',
          reason: 'security remediation',
          revokedSessions: 4,
          authMode: 'admin',
        }),
      }),
      db,
    );
    expect(response).toEqual({
      userId: 'user-1',
      revokedSessions: 4,
    });
  });

  it('lists audit logs with action filter and cursor pagination', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'admin-1',
      roles: ['ADMIN'],
    });
    auditLogs.searchAuditLogs.mockResolvedValue([
      {
        id: 'audit-3',
        userId: 'user-1',
        actorUserId: 'admin-1',
        action: 'LOGIN_SUCCEEDED',
        ip: '127.0.0.1',
        userAgent: 'jest',
        metadataJson: { key: 'value' },
        createdAt: new Date('2026-04-10T10:00:00.000Z'),
      },
      {
        id: 'audit-2',
        userId: 'user-1',
        actorUserId: 'admin-1',
        action: 'LOGIN_SUCCEEDED',
        ip: '127.0.0.1',
        userAgent: 'jest',
        metadataJson: 'unsafe-string',
        createdAt: new Date('2026-04-10T09:59:00.000Z'),
      },
      {
        id: 'audit-1',
        userId: 'user-1',
        actorUserId: 'admin-1',
        action: 'LOGIN_SUCCEEDED',
        ip: '127.0.0.1',
        userAgent: 'jest',
        metadataJson: null,
        createdAt: new Date('2026-04-10T09:58:00.000Z'),
      },
    ]);

    const response = await service.listAuditLogs(
      {
        userId: 'user-1',
        action: AuditActionDto.LOGIN_SUCCESS,
        cursor: 'audit-4',
        limit: 2,
      },
      {
        bearerToken: 'token',
      },
    );

    expect(auditLogs.searchAuditLogs).toHaveBeenCalledWith({
      userId: 'user-1',
      action: ['LOGIN_SUCCEEDED'],
      cursor: 'audit-4',
      take: 3,
    });
    expect(response.items).toHaveLength(2);
    expect(response.items[0].id).toBe('audit-3');
    expect(response.items[0].metadata).toEqual({ key: 'value' });
    expect(response.items[1].metadata).toEqual({});
    expect(response.pageInfo).toEqual({
      nextCursor: 'audit-2',
      hasNextPage: true,
    });
  });

  it('rejects audit listing for non-admin and non-service actors', async () => {
    accessTokens.verifyAccessToken.mockResolvedValue({
      sub: 'user-2',
      roles: ['USER'],
    });

    await expect(
      service.listAuditLogs(
        {
          limit: 10,
        },
        {
          bearerToken: 'token',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
