import { AuthRedisKeyService } from '../../../src/modules/redis/auth-redis-key.service';

describe('AuthRedisKeyService', () => {
  const service = new AuthRedisKeyService();

  it('builds namespaced keys for auth domains', () => {
    expect(service.verifyLookup('user-1')).toBe('auth:verify:user-1');
    expect(service.revokedAccessToken('fingerprint')).toBe(
      'auth:revoked:access:fingerprint',
    );
    expect(service.rateLimit('login:ip:127.0.0.1')).toBe(
      'auth:ratelimit:login:ip:127.0.0.1',
    );
    expect(service.sessionById('session-1')).toBe('auth:session:session-1');
  });
});
