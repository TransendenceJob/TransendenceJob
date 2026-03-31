import { AuthRedisKeyService } from '../../../src/modules/redis/auth-redis-key.service';

describe('AuthRedisKeyService - Comprehensive Unit Tests', () => {
  let service: AuthRedisKeyService;

  beforeEach(() => {
    service = new AuthRedisKeyService();
  });

  describe('BLACKBOX: build - Key Building', () => {
    it('should build properly formatted Redis key', () => {
      const key = service.build('verify', 'user-123');

      expect(key).toBe('auth:verify:user-123');
      expect(typeof key).toBe('string');
    });

    it('should construct key with auth prefix', () => {
      const key = service.build('custom', 'identifier');

      expect(key).toMatch(/^auth:/);
    });

    it('should use colon as separator', () => {
      const key = service.build('namespace', 'id');

      expect(key.split(':')).toHaveLength(3);
      expect(key).toBe('auth:namespace:id');
    });

    it('should support special characters in identifier', () => {
      const identifiers = [
        'email:user@example.com',
        'ip:192.168.1.1',
        'phone:+1234567890',
        'uuid:550e8400-e29b-41d4-a716-446655440000',
        'hash:abc123def456',
      ];

      for (const id of identifiers) {
        const key = service.build('test', id);
        expect(key).toContain(id);
      }
    });

    it('should preserve exact namespace and identifier', () => {
      const namespace = 'custom-namespace_123';
      const identifier = 'special-id_456';

      const key = service.build(namespace, identifier);

      expect(key).toContain(namespace);
      expect(key).toContain(identifier);
    });

    it('should create unique keys for different identifiers', () => {
      const key1 = service.build('ns', 'id1');
      const key2 = service.build('ns', 'id2');

      expect(key1).not.toBe(key2);
    });

    it('should create unique keys for different namespaces', () => {
      const key1 = service.build('ns1', 'id');
      const key2 = service.build('ns2', 'id');

      expect(key1).not.toBe(key2);
    });
  });

  describe('BLACKBOX: verifyLookup - Verification Key', () => {
    it('should build verification lookup key', () => {
      const key = service.verifyLookup('email:user@example.com');

      expect(key).toBe('auth:verify:email:user@example.com');
    });

    it('should use verify namespace', () => {
      const key = service.verifyLookup('any-identifier');

      expect(key).toMatch(/^auth:verify:/);
    });

    it('should preserve complex identifiers', () => {
      const identifiers = [
        'email:user+tag@domain.co.uk',
        'code:123456-abc',
        'token:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      ];

      for (const id of identifiers) {
        const key = service.verifyLookup(id);
        expect(key).toContain(id);
      }
    });

    it('should create unique keys for different identifiers', () => {
      const key1 = service.verifyLookup('id1');
      const key2 = service.verifyLookup('id2');

      expect(key1).not.toBe(key2);
    });
  });

  describe('BLACKBOX: revokedAccessToken - Token Revocation Key', () => {
    it('should build revoked access token key', () => {
      const fingerprint =
        'abc123def456abc123def456abc123def456abc123def456abc123def456ab12';
      const key = service.revokedAccessToken(fingerprint);

      expect(key).toBe(`auth:revoked:access:${fingerprint}`);
    });

    it('should use revoked:access namespace', () => {
      const key = service.revokedAccessToken('some-hash');

      expect(key).toMatch(/^auth:revoked:access:/);
    });

    it('should support SHA256 hex hashes', () => {
      const sha256Hashes = [
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        '2c26b46911185131006ba6b75f3dbc1c8d6951a0532e79f826d6436fcd9e12de',
      ];

      for (const hash of sha256Hashes) {
        const key = service.revokedAccessToken(hash);
        expect(key).toMatch(/^auth:revoked:access:[a-f0-9]{64}$/);
      }
    });

    it('should support different fingerprint formats', () => {
      const formats = [
        'abc123',
        'fingerprint-with-dashes',
        'fingerprint_with_underscores',
      ];

      for (const format of formats) {
        const key = service.revokedAccessToken(format);
        expect(key).toContain(format);
      }
    });
  });

  describe('BLACKBOX: rateLimit - Rate Limit Key', () => {
    it('should build rate limit key', () => {
      const key = service.rateLimit('login:ip:127.0.0.1');

      expect(key).toBe('auth:ratelimit:login:ip:127.0.0.1');
    });

    it('should use ratelimit namespace', () => {
      const key = service.rateLimit('bucket-id');

      expect(key).toMatch(/^auth:ratelimit:/);
    });

    it('should support various rate limit bucket formats', () => {
      const buckets = [
        'login:ip:192.168.1.1',
        'otp:phone:+1234567890',
        'signup:email:user@example.com',
        'password_reset:user:user-id-123',
        'api:key:api-key-abc123',
      ];

      for (const bucket of buckets) {
        const key = service.rateLimit(bucket);
        expect(key).toContain(bucket);
      }
    });

    it('should handle complex bucket identifiers', () => {
      const bucket = 'action:identifier:with:multiple:colons';
      const key = service.rateLimit(bucket);

      expect(key).toBe(`auth:ratelimit:${bucket}`);
    });

    it('should support IPv4 addresses', () => {
      const ips = ['127.0.0.1', '192.168.1.1', '10.0.0.0', '255.255.255.255'];

      for (const ip of ips) {
        const key = service.rateLimit(`login:ip:${ip}`);
        expect(key).toContain(ip);
      }
    });

    it('should support IPv6 addresses', () => {
      const ips = ['::1', '2001:db8::1', 'fe80::1'];

      for (const ip of ips) {
        const key = service.rateLimit(`login:ip:${ip}`);
        expect(key).toContain(ip);
      }
    });
  });

  describe('BLACKBOX: sessionById - Session Cache Key', () => {
    it('should build session cache key', () => {
      const key = service.sessionById('550e8400-e29b-41d4-a716-446655440000');

      expect(key).toBe('auth:session:550e8400-e29b-41d4-a716-446655440000');
    });

    it('should use session namespace', () => {
      const key = service.sessionById('any-id');

      expect(key).toMatch(/^auth:session:/);
    });

    it('should support UUID format session IDs', () => {
      const sessionIds = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];

      for (const sessionId of sessionIds) {
        const key = service.sessionById(sessionId);
        expect(key).toContain(sessionId);
      }
    });

    it('should support non-UUID session IDs', () => {
      const sessionIds = [
        'session-123',
        'sess-abc-456',
        'long-session-identifier-with-many-parts-123',
      ];

      for (const sessionId of sessionIds) {
        const key = service.sessionById(sessionId);
        expect(key).toContain(sessionId);
      }
    });

    it('should create unique keys for different sessions', () => {
      const key1 = service.sessionById('session-1');
      const key2 = service.sessionById('session-2');

      expect(key1).not.toBe(key2);
    });
  });

  describe('WHITEBOX: Namespace Consistency', () => {
    it('should maintain prefix consistency across all methods', () => {
      const prefix = 'auth';

      expect(service.build('ns', 'id')).toMatch(new RegExp(`^${prefix}:`));
      expect(service.verifyLookup('id')).toMatch(new RegExp(`^${prefix}:`));
      expect(service.revokedAccessToken('hash')).toMatch(
        new RegExp(`^${prefix}:`),
      );
      expect(service.rateLimit('bucket')).toMatch(new RegExp(`^${prefix}:`));
      expect(service.sessionById('id')).toMatch(new RegExp(`^${prefix}:`));
    });

    it('should use consistent separator', () => {
      const keys = [
        service.build('ns', 'id'),
        service.verifyLookup('id'),
        service.revokedAccessToken('hash'),
        service.rateLimit('bucket'),
        service.sessionById('id'),
      ];

      for (const key of keys) {
        expect(key).toContain(':');
        expect(key.split(':').length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should never have leading or trailing colons', () => {
      const keys = [
        service.build('ns', 'id'),
        service.verifyLookup('id'),
        service.revokedAccessToken('hash'),
        service.rateLimit('bucket'),
        service.sessionById('id'),
      ];

      for (const key of keys) {
        expect(key).not.toMatch(/^:/);
        expect(key).not.toMatch(/:$/);
      }
    });
  });

  describe('WHITEBOX: Key Safety & Edge Cases', () => {
    it('should handle empty identifier in build', () => {
      const key = service.build('ns', '');

      expect(key).toBe('auth:ns:');
    });

    it('should handle long identifiers', () => {
      const longId = 'id'.repeat(1000);
      const key = service.verifyLookup(longId);

      expect(key).toContain(longId);
    });

    it('should handle special Redis characters safely', () => {
      const specialIds = [
        'id*with*asterisks',
        'id?with?question',
        'id[with]brackets',
        'id{with}braces',
      ];

      for (const id of specialIds) {
        const key = service.build('ns', id);
        // Keys should be built as-is (Redis lib handles escaping)
        expect(key).toContain(id);
      }
    });

    it('should handle numeric identifiers', () => {
      const numericIds = ['123', '456789', '0'];

      for (const id of numericIds) {
        const key = service.build('ns', id);
        expect(key).toContain(id);
      }
    });

    it('should handle unicode characters', () => {
      const unicodeIds = ['id-üser', 'id-中文', 'id-emoji-😀'];

      for (const id of unicodeIds) {
        const key = service.build('ns', id);
        // Should preserve unicode characters
        expect(key).toContain(id);
      }
    });
  });

  describe('WHITEBOX: Method Independence', () => {
    it('should be independent of method call order', () => {
      const id1 = service.verifyLookup('test1');
      const id2 = service.ratedLimit?.call
        ? undefined
        : service.rateLimit('test2');
      const id3 = service.sessionById('test3');

      // Call in different order
      const id3b = service.sessionById('test3');
      const id1b = service.verifyLookup('test1');
      const id2b = service.rateLimit('test2');

      expect(id1).toBe(id1b);
      expect(id3).toBe(id3b);
    });

    it('should have no side effects', () => {
      // Just verify methods don't throw or have side effects
      expect(() => {
        service.build('a', 'b');
        service.verifyLookup('c');
        service.revokedAccessToken('d');
        service.rateLimit('e');
        service.sessionById('f');
      }).not.toThrow();
    });

    it('should be deterministic', () => {
      for (let i = 0; i < 10; i++) {
        const key1 = service.build('ns', 'id');
        const key2 = service.build('ns', 'id');

        expect(key1).toBe(key2);
      }
    });
  });

  describe('INTEGRATION: Key Format Validation', () => {
    it('should produce valid Redis key format', () => {
      const keys = [
        service.verifyLookup('user@example.com'),
        service.revokedAccessToken('abc123def456'),
        service.rateLimit('login:ip:127.0.0.1'),
        service.sessionById('session-123'),
        service.build('custom', 'identifier'),
      ];

      for (const key of keys) {
        // Redis keys are typically alphanumeric with colons, dashes, underscores
        expect(key).toMatch(/^[a-zA-Z0-9:\-_@.+]+$/);
      }
    });

    it('should create lexicographically sortable keys for same namespace', () => {
      const keys = [
        service.verifyLookup('id-1'),
        service.verifyLookup('id-2'),
        service.verifyLookup('id-3'),
      ];

      const sorted = [...keys].sort();
      expect(keys).toEqual(sorted);
    });

    it('should support typical Redis usage patterns', () => {
      // Pattern: match all verify lookups
      const verifyPattern = service.verifyLookup('*');
      expect(verifyPattern).toBe('auth:verify:*');

      // Pattern: match rate limits
      const rateLimitPattern = service.rateLimit('login:*');
      expect(rateLimitPattern).toBe('auth:ratelimit:login:*');
    });
  });
});
