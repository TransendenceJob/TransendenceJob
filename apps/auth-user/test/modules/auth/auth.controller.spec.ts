import { AuthController } from '../../../src/modules/auth/auth.controller';
import { type AuthService } from '../../../src/modules/auth/services/auth.service';
import { AuditActionDto } from '../../../src/modules/auth/contracts/enums/audit-action.enum';

describe('AuthController.register', () => {
  const authService = {
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    verify: jest.fn(),
    listAuditLogs: jest.fn(),
  } as unknown as AuthService;

  const controller = new AuthController(authService);

  beforeEach(() => {
    jest.clearAllMocks();
    authService.register = jest.fn().mockResolvedValue({
      user: {
        id: 'usr_1',
        email: 'john@example.com',
        status: 'pending',
        roles: ['user'],
      },
      tokens: {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
        tokenType: 'Bearer',
      },
      session: {
        id: 'sess_1',
        expiresAt: '2026-04-03T13:00:00.000Z',
        revoked: false,
      },
    });
  });

  it('delegates register request with normalized request context', async () => {
    const req = {
      ip: '10.0.0.5',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
      userAgent: 'Mozilla/5.0',
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
    } as any;

    await controller.register(
      {
        email: 'john@example.com',
        password: 'VeryStrong123!',
      },
      req,
    );

    expect(authService.register).toHaveBeenCalledWith(
      {
        email: 'john@example.com',
        password: 'VeryStrong123!',
      },
      {
        ip: '10.0.0.5',
        userAgent: 'Mozilla/5.0',
        requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
        serviceName: 'bff',
      },
    );
  });
});

describe('AuthController.logout', () => {
  const authService = {
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    verify: jest.fn(),
    listAuditLogs: jest.fn(),
  } as unknown as AuthService;

  const controller = new AuthController(authService);

  beforeEach(() => {
    jest.clearAllMocks();
    authService.logout = jest.fn().mockResolvedValue({
      success: true,
      revokedSessionIds: ['sess_1'],
    });
  });

  it('delegates logout request with normalized request context', async () => {
    const req = {
      ip: '10.0.0.5',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
      userAgent: 'Mozilla/5.0',
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
    } as any;

    await controller.logout(
      {
        refreshToken: 'refresh-token-value',
        logoutAll: false,
      },
      req,
    );

    expect(authService.logout).toHaveBeenCalledWith(
      {
        refreshToken: 'refresh-token-value',
        logoutAll: false,
      },
      {
        ip: '10.0.0.5',
        userAgent: 'Mozilla/5.0',
        requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
        serviceName: 'bff',
      },
    );
  });

  it('delegates logout all request with normalized request context', async () => {
    authService.logout.mockResolvedValueOnce({
      success: true,
      revokedSessionIds: ['sess_1', 'sess_2', 'sess_3'],
    });

    const req = {
      ip: '10.0.0.5',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
      userAgent: 'Mozilla/5.0',
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
    } as any;

    const response = await controller.logout(
      {
        refreshToken: 'refresh-token-value',
        logoutAll: true,
      },
      req,
    );

    expect(authService.logout).toHaveBeenCalledWith(
      {
        refreshToken: 'refresh-token-value',
        logoutAll: true,
      },
      {
        ip: '10.0.0.5',
        userAgent: 'Mozilla/5.0',
        requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
        serviceName: 'bff',
      },
    );
    expect(response.revokedSessionIds).toHaveLength(3);
  });

  it('handles missing user-agent header', async () => {
    const req = {
      ip: '10.0.0.5',
      headers: {},
      requestId: 'd79023c7-f5e5-49d9-a8c8-6df8f7c6386d',
      serviceName: 'bff',
    } as any;

    await controller.logout(
      {
        refreshToken: 'refresh-token-value',
        logoutAll: false,
      },
      req,
    );

    expect(authService.logout).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userAgent: null,
      }),
    );
  });
});

describe('AuthController.verify', () => {
  const authService = {
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    verify: jest.fn(),
    listAuditLogs: jest.fn(),
  } as unknown as AuthService;

  const controller = new AuthController(authService);

  beforeEach(() => {
    jest.clearAllMocks();
    authService.verify = jest.fn().mockResolvedValue({
      valid: true,
      user: {
        id: 'usr_1',
        email: 'john@example.com',
        displayName: null,
        username: null,
        status: 'active',
        roles: ['user'],
        createdAt: '2026-04-03T13:00:00.000Z',
        providers: [],
      },
      session: {
        id: 'sess_1',
        expiresAt: '2026-04-03T13:00:00.000Z',
        revoked: false,
      },
      claims: {
        sub: 'usr_1',
        iat: 1,
        exp: 2,
        iss: 'auth-service',
        aud: 'transcendence-internal',
      },
    });
  });

  it('extracts bearer token and delegates verify request', async () => {
    const req = {
      headers: {},
      bearerToken: 'access-token-value',
    } as any;

    await controller.verify(
      {
        audience: 'transcendence-internal',
      },
      req,
    );

    expect(authService.verify).toHaveBeenCalledWith({
      token: 'access-token-value',
      audience: 'transcendence-internal',
    });
  });

  it('rejects missing authorization header', async () => {
    const req = {
      headers: {},
    } as any;

    await expect(
      controller.verify(
        {
          audience: 'transcendence-internal',
        },
        req,
      ),
    ).rejects.toThrow('Missing authorization header');
  });
});

describe('AuthController.audit', () => {
  const authService = {
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    verify: jest.fn(),
    listAuditLogs: jest.fn(),
  } as unknown as AuthService;

  const controller = new AuthController(authService);

  beforeEach(() => {
    jest.clearAllMocks();
    authService.listAuditLogs = jest.fn().mockResolvedValue({
      items: [],
      pageInfo: {
        nextCursor: null,
        hasNextPage: false,
      },
    });
  });

  it('delegates audit query with context and auth token', async () => {
    const req = {
      ip: '10.0.0.5',
      userAgent: 'Mozilla/5.0',
      requestId: 'req-audit-1',
      serviceName: 'bff',
      bearerToken: 'access-token',
    } as any;

    await controller.listAuditLogs(
      {
        userId: 'user-1',
        action: AuditActionDto.LOGIN_SUCCESS,
        cursor: 'audit-1',
        limit: 10,
      },
      req,
    );

    expect(authService.listAuditLogs).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        action: AuditActionDto.LOGIN_SUCCESS,
        cursor: 'audit-1',
        limit: 10,
      },
      {
        ip: '10.0.0.5',
        userAgent: 'Mozilla/5.0',
        requestId: 'req-audit-1',
        serviceName: 'bff',
        bearerToken: 'access-token',
      },
    );
  });
});
