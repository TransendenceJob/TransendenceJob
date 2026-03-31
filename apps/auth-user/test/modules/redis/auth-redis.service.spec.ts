import { AuthRedisService } from '../../../src/modules/redis/auth-redis.service';
import { AuthRedisKeyService } from '../../../src/modules/redis/auth-redis-key.service';
import { type AuthConfigService } from '../../../src/modules/config/auth-config.service';
import { createClient } from 'redis';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

type MockRedisClient = {
  on: jest.Mock;
  connect: jest.Mock;
  quit: jest.Mock;
  disconnect: jest.Mock;
  set: jest.Mock;
  get: jest.Mock;
  exists: jest.Mock;
  incr: jest.Mock;
  expire: jest.Mock;
  del: jest.Mock;
  isOpen: boolean;
  isReady: boolean;
};

describe('AuthRedisService', () => {
  const authConfig = {
    redis: {
      host: 'localhost',
      port: 6379,
    },
  } as AuthConfigService;

  let service: AuthRedisService;
  let client: MockRedisClient;

  beforeEach(() => {
    client = {
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      exists: jest.fn().mockResolvedValue(0),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(1),
      isOpen: true,
      isReady: true,
    };

    (createClient as jest.Mock).mockReturnValue(client);

    service = new AuthRedisService(authConfig, new AuthRedisKeyService());
  });

  it('caches and retrieves verify lookup payload', async () => {
    await service.cacheVerifyLookup('user-1', 'payload', 45);
    await service.getVerifyLookup('user-1');

    expect(client.set).toHaveBeenCalledWith('auth:verify:user-1', 'payload', {
      EX: 45,
    });
    expect(client.get).toHaveBeenCalledWith('auth:verify:user-1');
  });

  it('marks access token as revoked and checks it', async () => {
    client.exists.mockResolvedValue(1);

    await service.revokeAccessToken('access-token', 300);
    const revoked = await service.isAccessTokenRevoked('access-token');

    expect(client.set).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:revoked:access:[a-f0-9]{64}$/),
      '1',
      { EX: 300 },
    );
    expect(revoked).toBe(true);
  });

  it('increments rate limit counter and sets expiry on first increment', async () => {
    const count = await service.incrementRateLimitCounter('login:user-1', 60);

    expect(count).toBe(1);
    expect(client.incr).toHaveBeenCalledWith('auth:ratelimit:login:user-1');
    expect(client.expire).toHaveBeenCalledWith(
      'auth:ratelimit:login:user-1',
      60,
    );
  });

  it('degrades gracefully when redis is unavailable', async () => {
    client.isReady = false;

    const verifyLookup = await service.getVerifyLookup('user-1');
    const isRevoked = await service.isAccessTokenRevoked('access-token');
    const count = await service.incrementRateLimitCounter('login:user-1', 60);

    expect(verifyLookup).toBeNull();
    expect(isRevoked).toBe(false);
    expect(count).toBe(0);
    expect(client.get).not.toHaveBeenCalled();
    expect(client.exists).not.toHaveBeenCalled();
    expect(client.incr).not.toHaveBeenCalled();
  });
});
