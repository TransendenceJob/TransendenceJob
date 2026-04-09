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

describe('AuthRedisService - Comprehensive Unit Tests', () => {
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

  describe('BLACKBOX: onModuleInit - Connection Lifecycle', () => {
    it('should attempt to connect on module init', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      await service.onModuleInit();

      expect(client.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection failure gracefully', async () => {
      client.connect.mockRejectedValueOnce(new Error('Connection refused'));

      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      // Should not throw
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('BLACKBOX: onModuleDestroy - Disconnect Lifecycle', () => {
    it('should close Redis connection on module destroy', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(client.quit).toHaveBeenCalled();
    });

    it('should fallback to disconnect if quit fails', async () => {
      client.quit.mockRejectedValueOnce(new Error('Quit failed'));

      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should handle already closed connection', async () => {
      client.isOpen = false;

      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      await service.onModuleInit();

      // Should not attempt to quit
      await service.onModuleDestroy();

      expect(client.quit).not.toHaveBeenCalled();
    });
  });

  describe('BLACKBOX: isHealthy - Health Check', () => {
    it('should return true when Redis is connected and ready', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      const readyHandler = [...client.on.mock.calls]
        .reverse()
        .find((call) => call[0] === 'ready')?.[1];
      readyHandler?.();
      client.isOpen = true;
      client.isReady = true;

      expect(service.isHealthy()).toBe(true);
    });

    it('should return false when Redis is not connected', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.isOpen = false;
      client.isReady = true;

      expect(service.isHealthy()).toBe(false);
    });

    it('should return false when Redis is not ready', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.isOpen = true;
      client.isReady = false;

      expect(service.isHealthy()).toBe(false);
    });

    it('should return false when both conditions are false', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.isOpen = false;
      client.isReady = false;

      expect(service.isHealthy()).toBe(false);
    });
  });

  describe('BLACKBOX: cacheVerifyLookup & getVerifyLookup - Verification Cache', () => {
    it('should cache verification payload with TTL', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      await service.cacheVerifyLookup(
        'email:user@example.com',
        'payload-data',
        90,
      );

      expect(client.set).toHaveBeenCalledWith(
        'auth:verify:email:user@example.com',
        'payload-data',
        { EX: 90 },
      );
    });

    it('should use default TTL of 60 seconds', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      await service.cacheVerifyLookup('email:user@example.com', 'payload-data');

      expect(client.set).toHaveBeenCalledWith(
        'auth:verify:email:user@example.com',
        'payload-data',
        { EX: 60 },
      );
    });

    it('should retrieve cached verification payload', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.get.mockResolvedValueOnce(JSON.stringify({ userId: '123' }));

      const result = await service.getVerifyLookup('email:user@example.com');

      expect(result).toBe(JSON.stringify({ userId: '123' }));
      expect(client.get).toHaveBeenCalledWith(
        'auth:verify:email:user@example.com',
      );
    });

    it('should return null for missing verification entry', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.get.mockResolvedValueOnce(null);

      const result = await service.getVerifyLookup('email:missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('BLACKBOX: revokeAccessToken & isAccessTokenRevoked - Token Revocation', () => {
    it('should revoke access token with TTL', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';

      await service.revokeAccessToken(token, 300);

      expect(client.set).toHaveBeenCalledWith(
        expect.stringMatching(/^auth:revoked:access:[a-f0-9]{64}$/),
        '1',
        { EX: 300 },
      );
    });

    it('should check if access token is revoked', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.exists.mockResolvedValueOnce(1);

      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';

      const isRevoked = await service.isAccessTokenRevoked(token);

      expect(isRevoked).toBe(true);
      expect(client.exists).toHaveBeenCalledWith(
        expect.stringMatching(/^auth:revoked:access:[a-f0-9]{64}$/),
      );
    });

    it('should return false for non-revoked token', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.exists.mockResolvedValueOnce(0);

      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';

      const isRevoked = await service.isAccessTokenRevoked(token);

      expect(isRevoked).toBe(false);
    });

    it('should assign fingerprint to revoked tokens deterministically', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';

      await service.revokeAccessToken(token, 300);
      const firstCall = client.set.mock.calls[0];

      await service.revokeAccessToken(token, 600);
      const secondCall = client.set.mock.calls[1];

      // Same token should produce same fingerprint
      expect(firstCall[0]).toBe(secondCall[0]);
    });

    it('should use different fingerprints for different tokens', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      const token1 = 'token1-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const token2 = 'token2-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      await service.revokeAccessToken(token1, 300);
      const firstCall = client.set.mock.calls[0];

      await service.revokeAccessToken(token2, 300);
      const secondCall = client.set.mock.calls[1];

      expect(firstCall[0]).not.toBe(secondCall[0]);
    });
  });

  describe('BLACKBOX: incrementRateLimitCounter - Rate Limiting', () => {
    it('should increment rate limit counter', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.incr.mockResolvedValueOnce(1);

      const count = await service.incrementRateLimitCounter(
        'login:ip:127.0.0.1',
        60,
      );

      expect(count).toBe(1);
      expect(client.incr).toHaveBeenCalledWith(
        'auth:ratelimit:login:ip:127.0.0.1',
      );
    });

    it('should set expiry only on first increment', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.incr.mockResolvedValueOnce(1);

      await service.incrementRateLimitCounter('login:ip:127.0.0.1', 60);

      expect(client.expire).toHaveBeenCalledWith(
        'auth:ratelimit:login:ip:127.0.0.1',
        60,
      );
    });

    it('should not set expiry on subsequent increments', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      // First increment (returns 1, should set expiry)
      client.incr.mockResolvedValueOnce(1);
      await service.incrementRateLimitCounter('login:ip:127.0.0.1', 60);

      // Second increment (returns 2, should not set expiry)
      client.incr.mockResolvedValueOnce(2);
      await service.incrementRateLimitCounter('login:ip:127.0.0.1', 60);

      // Expire should only be called once
      expect(client.expire).toHaveBeenCalledTimes(1);
    });

    it('should return counter value after increment', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.incr.mockResolvedValueOnce(5);

      const count = await service.incrementRateLimitCounter(
        'login:ip:127.0.0.1',
        60,
      );

      expect(count).toBe(5);
    });

    it('should support different rate limit buckets', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.incr.mockResolvedValue(1);

      const buckets = [
        'login:ip:192.168.1.1',
        'otp:phone:+1234567890',
        'signup:email:user@example.com',
      ];

      for (const bucket of buckets) {
        await service.incrementRateLimitCounter(bucket, 60);
      }

      expect(client.incr).toHaveBeenCalledWith(
        expect.stringMatching(/^auth:ratelimit:/),
      );
      expect(client.incr).toHaveBeenCalledTimes(3);
    });
  });

  describe('BLACKBOX: cacheSessionById & getSessionById - Session Caching', () => {
    it('should cache session payload with TTL', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      const sessionData = JSON.stringify({
        userId: 'user-123',
        roles: ['USER'],
      });

      await service.cacheSessionById('session-456', sessionData, 300);

      expect(client.set).toHaveBeenCalledWith(
        'auth:session:session-456',
        sessionData,
        { EX: 300 },
      );
    });

    it('should retrieve cached session', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      const sessionData = JSON.stringify({ userId: 'user-123' });
      client.get.mockResolvedValueOnce(sessionData);

      const result = await service.getSessionById('session-456');

      expect(result).toBe(sessionData);
      expect(client.get).toHaveBeenCalledWith('auth:session:session-456');
    });

    it('should return null for missing session', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.get.mockResolvedValueOnce(null);

      const result = await service.getSessionById('missing-session');

      expect(result).toBeNull();
    });

    it('should delete cached session', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      await service.deleteSessionById('session-456');

      expect(client.del).toHaveBeenCalledWith('auth:session:session-456');
    });
  });

  describe('WHITEBOX: Connection Event Handlers', () => {
    it('should register connection event listeners', () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      expect(client.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(client.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should mark as connected on ready event', () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      // Verify isHealthy returns false initially
      client.isOpen = false;
      client.isReady = false;
      expect(service.isHealthy()).toBe(false);

      // Trigger ready event
      const readyHandler = [...client.on.mock.calls]
        .reverse()
        .find((call) => call[0] === 'ready')?.[1];
      readyHandler?.();

      // After ready, should be healthy if client is open
      client.isOpen = true;
      client.isReady = true;
      expect(service.isHealthy()).toBe(true);
    });
  });

  describe('WHITEBOX: Error Handling & Graceful Degradation', () => {
    it('should degrade gracefully when Redis is unavailable', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.isReady = false;

      const verifyLookup = await service.getVerifyLookup('user-1');
      const isRevoked = await service.isAccessTokenRevoked('access-token');
      const count = await service.incrementRateLimitCounter('login:user-1', 60);
      const session = await service.getSessionById('session-1');

      expect(verifyLookup).toBeNull();
      expect(isRevoked).toBe(false);
      expect(count).toBe(0);
      expect(session).toBeNull();

      // Redis methods should not be called
      expect(client.get).not.toHaveBeenCalled();
      expect(client.exists).not.toHaveBeenCalled();
      expect(client.incr).not.toHaveBeenCalled();
    });

    it('should handle Redis operation errors', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await service.getVerifyLookup('user-1');

      expect(result).toBeNull();
    });

    it('should return fallback value on error', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.exists.mockRejectedValueOnce(new Error('Redis error'));

      const result = await service.isAccessTokenRevoked('token');

      expect(result).toBe(false); // Fallback value
    });

    it('should handle partial connection states', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.isOpen = true;
      client.isReady = false;

      const result = await service.getVerifyLookup('user-1');

      expect(result).toBeNull();
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('WHITEBOX: Safe Execution Pattern', () => {
    it('should handle successful operations', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.get.mockResolvedValueOnce('cached-value');

      const result = await service.getVerifyLookup('key');

      expect(result).toBe('cached-value');
    });

    it('should handle operations with no fallback', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());
      client.isReady = false;

      const result = await service.cacheVerifyLookup('key', 'value', 60);

      expect(result).toBeUndefined();
    });
  });

  describe('WHITEBOX: Token Fingerprinting', () => {
    it('should create SHA256 fingerprint of token', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      const token = 'test-token-123';
      await service.revokeAccessToken(token, 300);

      const setCall = client.set.mock.calls[0];
      const keyUsed = setCall[0];

      // Key should contain SHA256 hash
      expect(keyUsed).toMatch(/^auth:revoked:access:[a-f0-9]{64}$/);
    });

    it('should produce consistent fingerprints', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      const token = 'consistent-token';

      // First revocation
      await service.revokeAccessToken(token, 300);
      const firstKey = client.set.mock.calls[0][0];

      // Second revocation of same token
      await service.revokeAccessToken(token, 600);
      const secondKey = client.set.mock.calls[1][0];

      expect(firstKey).toBe(secondKey);
    });

    it('should use same fingerprint for verification checks', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      const token = 'test-token';
      client.exists.mockResolvedValueOnce(1);

      await service.revokeAccessToken(token, 300);
      const revokeKey = client.set.mock.calls[0][0];

      await service.isAccessTokenRevoked(token);
      const checkKey = client.exists.mock.calls[0][0];

      expect(revokeKey).toBe(checkKey);
    });
  });

  describe('BLACKBOX: Integration Scenarios', () => {
    it('should handle full verification flow', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      const identifier = 'email:user@example.com';
      const payload = JSON.stringify({ code: '123456' });

      // Cache
      await service.cacheVerifyLookup(identifier, payload, 300);
      expect(client.set).toHaveBeenNthCalledWith(
        1,
        `auth:verify:${identifier}`,
        payload,
        {
          EX: 300,
        },
      );

      // Retrieve
      client.get.mockResolvedValueOnce(payload);
      const cached = await service.getVerifyLookup(identifier);

      expect(cached).toBe(payload);
    });

    it('should handle full token revocation flow', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      const token = 'access-token-xyz';

      // Revoke
      await service.revokeAccessToken(token, 900);
      const revokeCallArg = client.set.mock.calls[0];

      expect(revokeCallArg[2]).toEqual({ EX: 900 });

      // Check revocation status
      client.exists.mockResolvedValueOnce(1);
      const isRevoked = await service.isAccessTokenRevoked(token);

      expect(isRevoked).toBe(true);
    });

    it('should handle rate limit flow', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      const bucket = 'login:ip:192.168.1.1';

      // First request
      client.incr.mockResolvedValueOnce(1);
      let count = await service.incrementRateLimitCounter(bucket, 60);
      expect(count).toBe(1);
      expect(client.expire).toHaveBeenCalledWith(
        `auth:ratelimit:${bucket}`,
        60,
      );

      // Second request
      client.incr.mockResolvedValueOnce(2);
      count = await service.incrementRateLimitCounter(bucket, 60);
      expect(count).toBe(2);

      // Third request
      client.incr.mockResolvedValueOnce(3);
      count = await service.incrementRateLimitCounter(bucket, 60);
      expect(count).toBe(3);

      // Should only set expiry once
      expect(client.expire).toHaveBeenCalledTimes(1);
    });

    it('should handle session cache lifecycle', async () => {
      service = new AuthRedisService(authConfig, new AuthRedisKeyService());

      const sessionId = 'session-123';
      const sessionData = JSON.stringify({ userId: 'user-1', roles: ['USER'] });

      // Cache session
      await service.cacheSessionById(sessionId, sessionData, 300);
      expect(client.set).toHaveBeenCalledWith(
        `auth:session:${sessionId}`,
        sessionData,
        { EX: 300 },
      );

      // Retrieve session
      client.get.mockResolvedValueOnce(sessionData);
      const cached = await service.getSessionById(sessionId);
      expect(cached).toBe(sessionData);

      // Delete session
      await service.deleteSessionById(sessionId);
      expect(client.del).toHaveBeenCalledWith(`auth:session:${sessionId}`);
    });
  });
});
