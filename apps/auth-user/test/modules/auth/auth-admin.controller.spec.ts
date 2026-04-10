import { AuthAdminController } from '../../../src/modules/auth/auth-admin.controller';
import { type AuthService } from '../../../src/modules/auth/services/auth.service';
import { UserRoleDto } from '../../../src/modules/auth/contracts/enums/user-role.enum';

describe('AuthAdminController.disableUser', () => {
  const authService = {
    disableUser: jest.fn(),
    setUserRoles: jest.fn(),
  } as unknown as AuthService;

  const controller = new AuthAdminController(authService);

  beforeEach(() => {
    jest.clearAllMocks();
    authService.disableUser = jest.fn().mockResolvedValue({
      userId: 'user-1',
      status: 'disabled',
      revokedSessions: 2,
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
});
