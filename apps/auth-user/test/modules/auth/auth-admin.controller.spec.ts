import { AuthAdminController } from '../../../src/modules/auth/auth-admin.controller';
import { type AuthService } from '../../../src/modules/auth/services/auth.service';
import { UserRoleDto } from '../../../src/modules/auth/contracts/enums/user-role.enum';

describe('AuthAdminController', () => {
  const authService = {
    searchUsers: jest.fn(),
    getUser: jest.fn(),
    disableUser: jest.fn(),
    enableUser: jest.fn(),
    setUserRoles: jest.fn(),
    revokeUserSessions: jest.fn(),
  } as unknown as AuthService;

  const controller = new AuthAdminController(authService);

  beforeEach(() => {
    jest.clearAllMocks();
    authService.disableUser = jest.fn().mockResolvedValue({
      userId: 'user-1',
      status: 'disabled',
      revokedSessions: 2,
    });
    authService.enableUser = jest.fn().mockResolvedValue({
      userId: 'user-1',
      status: 'active',
    });
    authService.searchUsers = jest.fn().mockResolvedValue({
      items: [],
      pageInfo: {
        nextCursor: null,
        hasNextPage: false,
      },
    });
    authService.getUser = jest.fn().mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        status: 'active',
        roles: [UserRoleDto.USER],
      },
    });
  });

  it('delegates user search request with normalized context', async () => {
    const req = {
      ip: '10.0.0.5',
      userAgent: 'Mozilla/5.0',
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
      bearerToken: 'access-token',
    } as any;

    await controller.searchUsers({ query: 'stefan', limit: 10 }, req);

    expect(authService.searchUsers).toHaveBeenCalledWith(
      { query: 'stefan', limit: 10 },
      {
        ip: '10.0.0.5',
        userAgent: 'Mozilla/5.0',
        requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
        serviceName: 'bff',
        bearerToken: 'access-token',
      },
    );
  });

  it('delegates get user request with normalized context', async () => {
    const req = {
      ip: '10.0.0.5',
      userAgent: 'Mozilla/5.0',
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
      bearerToken: 'access-token',
    } as any;

    await controller.getUser({ userId: 'user-1' }, req);

    expect(authService.getUser).toHaveBeenCalledWith('user-1', {
      ip: '10.0.0.5',
      userAgent: 'Mozilla/5.0',
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
      bearerToken: 'access-token',
    });
  });

  it('delegates disable user request with normalized context', async () => {
    const req = {
      ip: '10.0.0.5',
      userAgent: 'Mozilla/5.0',
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
      bearerToken: 'access-token',
    } as any;

    await controller.disableUser(
      { userId: 'user-1' },
      { reason: 'fraud', revokeSessions: true },
      req,
    );

    expect(authService.disableUser).toHaveBeenCalledWith(
      'user-1',
      { reason: 'fraud', revokeSessions: true },
      {
        ip: '10.0.0.5',
        userAgent: 'Mozilla/5.0',
        requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
        serviceName: 'bff',
        bearerToken: 'access-token',
      },
    );
  });

  it('delegates set user roles request with normalized context', async () => {
    authService.setUserRoles = jest.fn().mockResolvedValue({
      userId: 'user-1',
      roles: [UserRoleDto.USER, UserRoleDto.ADMIN],
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const req = {
      ip: '10.0.0.5',
      userAgent: 'Mozilla/5.0',
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
      bearerToken: 'access-token',
    } as any;

    await controller.setUserRoles(
      { userId: 'user-1' },
      { roles: [UserRoleDto.USER, UserRoleDto.ADMIN] },
      req,
    );

    expect(authService.setUserRoles).toHaveBeenCalledWith(
      'user-1',
      { roles: [UserRoleDto.USER, UserRoleDto.ADMIN] },
      {
        ip: '10.0.0.5',
        userAgent: 'Mozilla/5.0',
        requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
        serviceName: 'bff',
        bearerToken: 'access-token',
      },
    );
  });

  it('delegates enable user request with normalized context', async () => {
    const req = {
      ip: '10.0.0.5',
      userAgent: 'Mozilla/5.0',
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
      bearerToken: 'access-token',
    } as any;

    await controller.enableUser(
      { userId: 'user-1' },
      { reason: 'appeal' },
      req,
    );

    expect(authService.enableUser).toHaveBeenCalledWith(
      'user-1',
      { reason: 'appeal' },
      {
        ip: '10.0.0.5',
        userAgent: 'Mozilla/5.0',
        requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
        serviceName: 'bff',
        bearerToken: 'access-token',
      },
    );
  });

  it('delegates revoke sessions request with normalized context', async () => {
    authService.revokeUserSessions = jest.fn().mockResolvedValue({
      userId: 'user-1',
      revokedSessions: 3,
    });

    const req = {
      ip: '10.0.0.5',
      userAgent: 'Mozilla/5.0',
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
      bearerToken: 'access-token',
    } as any;

    await controller.revokeUserSessions(
      { userId: 'user-1' },
      { reason: 'security-remediation' },
      req,
    );

    expect(authService.revokeUserSessions).toHaveBeenCalledWith(
      'user-1',
      { reason: 'security-remediation' },
      {
        ip: '10.0.0.5',
        userAgent: 'Mozilla/5.0',
        requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
        serviceName: 'bff',
        bearerToken: 'access-token',
      },
    );
  });
});
