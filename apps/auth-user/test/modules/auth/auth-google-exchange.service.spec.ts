import { UnauthorizedException } from '@nestjs/common';
import { AuthGoogleExchangeService } from '../../../src/modules/auth/services/auth-google-exchange.service';

describe('AuthGoogleExchangeService', () => {
  const db = {};

  let prisma: { $transaction: jest.Mock };
  let config: { google: { clientId: string; clientSecret: string } };
  let users: {
    findByEmail: jest.Mock;
    createOAuthUser: jest.Mock;
    getRoleNamesForUser: jest.Mock;
  };
  let roles: { assignRoleToUser: jest.Mock };
  let sessions: { createSession: jest.Mock };
  let authProviders: {
    findUserByProviderIdentity: jest.Mock;
    linkProviderToUser: jest.Mock;
    findByUserId: jest.Mock;
  };
  let auditLogs: { createEvent: jest.Mock };
  let sessionCache: { cacheSession: jest.Mock };
  let tokenIssue: {
    createRefreshTokenPair: jest.Mock;
    issueAccessToken: jest.Mock;
    accessTokenExpiresInSeconds: jest.Mock;
  };
  let service: AuthGoogleExchangeService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(
        async (handler: (dbClient: typeof db) => Promise<unknown>) =>
          handler(db),
      ),
    };

    config = {
      google: {
        clientId: 'google-client-id',
        clientSecret: 'google-client-secret',
      },
    };

    users = {
      findByEmail: jest.fn(),
      createOAuthUser: jest.fn(),
      getRoleNamesForUser: jest.fn(),
    };

    roles = {
      assignRoleToUser: jest.fn(),
    };

    sessions = {
      createSession: jest.fn().mockResolvedValue({
        id: 'session-1',
        expiresAt: new Date('2026-04-12T00:00:00.000Z'),
        revokedAt: null,
      }),
    };

    authProviders = {
      findUserByProviderIdentity: jest.fn(),
      linkProviderToUser: jest.fn(),
      findByUserId: jest.fn(),
    };

    auditLogs = {
      createEvent: jest.fn(),
    };

    sessionCache = {
      cacheSession: jest.fn(),
    };

    tokenIssue = {
      createRefreshTokenPair: jest.fn().mockReturnValue({
        refreshToken: 'refresh-token',
        refreshTokenHash: 'refresh-token-hash',
        expiresAt: new Date('2026-04-12T00:00:00.000Z'),
      }),
      issueAccessToken: jest.fn().mockResolvedValue('access-token'),
      accessTokenExpiresInSeconds: jest.fn().mockReturnValue(900),
    };

    service = new AuthGoogleExchangeService(
      prisma as never,
      config as never,
      users as never,
      roles as never,
      sessions as never,
      authProviders as never,
      auditLogs as never,
      sessionCache as never,
      tokenIssue as never,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs in an already linked google account', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google-uid',
        email: 'user@example.com',
        email_verified: 'true',
        aud: 'google-client-id',
        iss: 'https://accounts.google.com',
      }),
    } as Response);

    authProviders.findUserByProviderIdentity.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        status: 'ACTIVE',
        disabledAt: null,
        createdAt: new Date('2026-04-10T00:00:00.000Z'),
      },
    });
    users.getRoleNamesForUser.mockResolvedValue(['USER']);
    authProviders.findByUserId.mockResolvedValue([
      {
        provider: 'GOOGLE',
        providerUserId: 'google-uid',
      },
    ]);

    const response = await service.exchange(
      {
        provider: 'google' as never,
        idToken: 'id-token',
      },
      { requestId: 'req-1', serviceName: 'bff' },
    );

    expect(response.user.id).toBe('user-1');
    expect(response.tokens.accessToken).toBe('access-token');
    expect(authProviders.linkProviderToUser).not.toHaveBeenCalled();
    expect(auditLogs.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'GOOGLE_EXCHANGE' }),
      db,
    );
    expect(auditLogs.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_SUCCEEDED' }),
      db,
    );
  });

  it('creates and links user for first-time google login', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google-uid',
        email: 'new@example.com',
        email_verified: true,
        aud: 'google-client-id',
        iss: 'accounts.google.com',
      }),
    } as Response);

    authProviders.findUserByProviderIdentity.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue(null);
    users.createOAuthUser.mockResolvedValue({
      id: 'user-new',
      email: 'new@example.com',
      status: 'ACTIVE',
      disabledAt: null,
      createdAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    authProviders.linkProviderToUser.mockResolvedValue({
      userId: 'user-new',
    });
    users.getRoleNamesForUser.mockResolvedValue(['USER']);
    authProviders.findByUserId.mockResolvedValue([
      {
        provider: 'GOOGLE',
        providerUserId: 'google-uid',
      },
    ]);

    const response = await service.exchange(
      {
        provider: 'google' as never,
        idToken: 'id-token',
      },
      { requestId: 'req-2', serviceName: 'bff' },
    );

    expect(users.createOAuthUser).toHaveBeenCalled();
    expect(roles.assignRoleToUser).toHaveBeenCalledWith('user-new', 'USER', db);
    expect(response.user.email).toBe('new@example.com');
    expect(auditLogs.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_REGISTERED' }),
      db,
    );
  });

  it('rejects unverified google email', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google-uid',
        email: 'user@example.com',
        email_verified: 'false',
        aud: 'google-client-id',
        iss: 'https://accounts.google.com',
      }),
    } as Response);

    await expect(
      service.exchange(
        {
          provider: 'google' as never,
          idToken: 'id-token',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
