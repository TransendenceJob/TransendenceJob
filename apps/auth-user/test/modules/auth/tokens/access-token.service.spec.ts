import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AccessTokenService } from '../../../../src/modules/auth/tokens/access-token.service';
import { type AuthConfigService } from '../../../../src/modules/config/auth-config.service';

describe('AccessTokenService - Comprehensive Unit Tests', () => {
  const mockConfig = {
    jwt: {
      accessSecret: 'a-very-long-access-secret-for-tests-1234567890abcdefghijk',
      refreshSecret:
        'a-very-long-refresh-secret-for-tests-1234567890abcdefghijk',
      accessTtl: '15m',
      refreshTtl: '7d',
      issuer: 'auth-service',
      audience: 'transcendence-internal',
    },
  } as AuthConfigService;

  let jwtService: JwtService;
  let service: AccessTokenService;

  beforeEach(() => {
    jwtService = new JwtService();
    service = new AccessTokenService(jwtService, mockConfig);
  });

  describe('BLACKBOX: generateAccessToken - Public API', () => {
    it('should generate a valid JWT token with three parts', async () => {
      const payload = {
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER', 'ADMIN'],
        sessionId: 'session-456',
      };

      const token = await service.generateAccessToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should preserve all user claims in the token', async () => {
      const payload = {
        sub: 'user-999',
        email: 'admin@example.com',
        roles: ['USER', 'ADMIN', 'MODERATOR'],
        sessionId: 'session-xyz',
      };

      const token = await service.generateAccessToken(payload);
      const decoded = await jwtService.verifyAsync(token, {
        secret: mockConfig.jwt.accessSecret,
      });

      expect(decoded.sub).toBe('user-999');
      expect(decoded.email).toBe('admin@example.com');
      expect(decoded.roles).toEqual(['USER', 'ADMIN', 'MODERATOR']);
      expect(decoded.sessionId).toBe('session-xyz');
    });

    it('should include correct issuer and audience in token', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });
      const decoded = await jwtService.verifyAsync(token, {
        secret: mockConfig.jwt.accessSecret,
      });

      expect(decoded.iss).toBe('auth-service');
      expect(decoded.aud).toBe('transcendence-internal');
    });

    it('should generate tokens with correct expiration time', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const decoded = await jwtService.verifyAsync(token, {
        secret: mockConfig.jwt.accessSecret,
      });

      const expiresIn = (decoded.exp as number) - (decoded.iat as number);
      expect(expiresIn).toBeGreaterThan(14 * 60);
      expect(expiresIn).toBeLessThanOrEqual(15 * 60);
    });

    it('should create unique tokens for different payloads', async () => {
      const token1 = await service.generateAccessToken({
        sub: 'user-1',
        email: 'user1@example.com',
        roles: ['USER'],
        sessionId: 'session-1',
      });

      const token2 = await service.generateAccessToken({
        sub: 'user-2',
        email: 'user2@example.com',
        roles: ['USER'],
        sessionId: 'session-2',
      });

      expect(token1).not.toBe(token2);
    });

    it('should handle special characters in email', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user+tag@example.co.uk',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const decoded = await jwtService.verifyAsync(token, {
        secret: mockConfig.jwt.accessSecret,
      });
      expect(decoded.email).toBe('user+tag@example.co.uk');
    });

    it('should handle special characters in roles', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER:ADMIN', 'ROLE-SPECIAL', 'role_underscore'],
        sessionId: 'session-456',
      });

      const decoded = await jwtService.verifyAsync(token, {
        secret: mockConfig.jwt.accessSecret,
      });
      expect(decoded.roles).toEqual([
        'USER:ADMIN',
        'ROLE-SPECIAL',
        'role_underscore',
      ]);
    });
  });

  describe('BLACKBOX: verifyAccessToken - Public API', () => {
    it('should verify and decode a valid token', async () => {
      const payload = {
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      };

      const token = await service.generateAccessToken(payload);
      const claims = await service.verifyAccessToken(token);

      expect(claims.sub).toBe('user-123');
      expect(claims.email).toBe('user@example.com');
      expect(claims.roles).toEqual(['USER']);
      expect(claims.sessionId).toBe('session-456');
    });

    it('should reject invalid token format', async () => {
      await expect(service.verifyAccessToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.verifyAccessToken('')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.verifyAccessToken('a.b.c.d.e')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject token with tampered signature', async () => {
      const validToken = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const parts = validToken.split('.');
      const tamperedToken =
        parts[0] + '.' + parts[1] + '.' + 'invalidsignature123';

      await expect(service.verifyAccessToken(tamperedToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject token with wrong audience', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const wrongConfig = {
        jwt: {
          ...mockConfig.jwt,
          audience: 'other-service',
        },
      } as AuthConfigService;

      const wrongService = new AccessTokenService(jwtService, wrongConfig);
      await expect(wrongService.verifyAccessToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject token with wrong issuer', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const wrongConfig = {
        jwt: {
          ...mockConfig.jwt,
          issuer: 'wrong-issuer',
        },
      } as AuthConfigService;

      const wrongService = new AccessTokenService(jwtService, wrongConfig);
      await expect(wrongService.verifyAccessToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject expired token', async () => {
      const expiredConfig = {
        jwt: {
          ...mockConfig.jwt,
          accessTtl: '1ms',
        },
      } as AuthConfigService;

      const expiredService = new AccessTokenService(jwtService, expiredConfig);
      const token = await expiredService.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      await expect(service.verifyAccessToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('WHITEBOX: Payload Validation', () => {
    it('should reject token missing sub claim', async () => {
      const malformedToken = await jwtService.signAsync(
        {
          email: 'user@example.com',
          roles: ['USER'],
          sessionId: 'session-456',
        },
        {
          secret: mockConfig.jwt.accessSecret,
          issuer: mockConfig.jwt.issuer,
          audience: mockConfig.jwt.audience,
        },
      );

      await expect(service.verifyAccessToken(malformedToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject token missing email claim', async () => {
      const malformedToken = await jwtService.signAsync(
        {
          sub: 'user-123',
          roles: ['USER'],
          sessionId: 'session-456',
        },
        {
          secret: mockConfig.jwt.accessSecret,
          issuer: mockConfig.jwt.issuer,
          audience: mockConfig.jwt.audience,
        },
      );

      await expect(service.verifyAccessToken(malformedToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject token with non-array roles', async () => {
      const malformedToken = await jwtService.signAsync(
        {
          sub: 'user-123',
          email: 'user@example.com',
          roles: 'USER',
          sessionId: 'session-456',
        },
        {
          secret: mockConfig.jwt.accessSecret,
          issuer: mockConfig.jwt.issuer,
          audience: mockConfig.jwt.audience,
        },
      );

      await expect(service.verifyAccessToken(malformedToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject token missing sessionId', async () => {
      const malformedToken = await jwtService.signAsync(
        {
          sub: 'user-123',
          email: 'user@example.com',
          roles: ['USER'],
        },
        {
          secret: mockConfig.jwt.accessSecret,
          issuer: mockConfig.jwt.issuer,
          audience: mockConfig.jwt.audience,
        },
      );

      await expect(service.verifyAccessToken(malformedToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should accept token with empty roles array', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: [],
        sessionId: 'session-456',
      });

      const claims = await service.verifyAccessToken(token);
      expect(claims.roles).toEqual([]);
    });

    it('should reject token missing issuer claim', async () => {
      const malformedToken = await jwtService.signAsync(
        {
          sub: 'user-123',
          email: 'user@example.com',
          roles: ['USER'],
          sessionId: 'session-456',
        },
        {
          secret: mockConfig.jwt.accessSecret,
          audience: mockConfig.jwt.audience,
        },
      );

      await expect(service.verifyAccessToken(malformedToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject token missing audience claim', async () => {
      const malformedToken = await jwtService.signAsync(
        {
          sub: 'user-123',
          email: 'user@example.com',
          roles: ['USER'],
          sessionId: 'session-456',
        },
        {
          secret: mockConfig.jwt.accessSecret,
          issuer: mockConfig.jwt.issuer,
        },
      );

      await expect(service.verifyAccessToken(malformedToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject token with null sub claim', async () => {
      const malformedToken = await jwtService.signAsync(
        {
          sub: null,
          email: 'user@example.com',
          roles: ['USER'],
          sessionId: 'session-456',
        },
        {
          secret: mockConfig.jwt.accessSecret,
          issuer: mockConfig.jwt.issuer,
          audience: mockConfig.jwt.audience,
        },
      );

      await expect(service.verifyAccessToken(malformedToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('WHITEBOX: Edge Cases & Security', () => {
    it('should handle very long user IDs (1000 chars)', async () => {
      const veryLongId = 'u'.repeat(1000);
      const token = await service.generateAccessToken({
        sub: veryLongId,
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const claims = await service.verifyAccessToken(token);
      expect(claims.sub).toBe(veryLongId);
    });

    it('should handle many roles (100 roles)', async () => {
      const roles = Array.from({ length: 100 }, (_, i) => `ROLE_${i}`);
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles,
        sessionId: 'session-456',
      });

      const claims = await service.verifyAccessToken(token);
      expect(claims.roles).toHaveLength(100);
      expect(claims.roles).toEqual(roles);
    });

    it('should handle unicode characters in email', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'üser@例え.jp',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const claims = await service.verifyAccessToken(token);
      expect(claims.email).toBe('üser@例え.jp');
    });

    it('should reject tokens signed with different secret', async () => {
      const token = await jwtService.signAsync(
        {
          sub: 'user-123',
          email: 'user@example.com',
          roles: ['USER'],
          sessionId: 'session-456',
        },
        {
          secret: 'wrong-secret-123456789',
          issuer: mockConfig.jwt.issuer,
          audience: mockConfig.jwt.audience,
        },
      );

      await expect(service.verifyAccessToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should maintain claim integrity across multiple generations', async () => {
      const payloads = [
        {
          sub: 'user-1',
          email: 'a@b.com',
          roles: ['USER'],
          sessionId: 'sess-1',
        },
        {
          sub: 'user-2',
          email: 'c@d.com',
          roles: ['ADMIN'],
          sessionId: 'sess-2',
        },
        {
          sub: 'user-3',
          email: 'e@f.com',
          roles: [],
          sessionId: 'sess-3',
        },
      ];

      for (const payload of payloads) {
        const token = await service.generateAccessToken(payload);
        const claims = await service.verifyAccessToken(token);

        expect(claims.sub).toBe(payload.sub);
        expect(claims.email).toBe(payload.email);
        expect(claims.roles).toEqual(payload.roles);
        expect(claims.sessionId).toBe(payload.sessionId);
      }
    });

    it('should treat template strings as literal values', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-${process.exit(1)}',
        email: 'user@${hostname}.com',
        roles: ['${USER}', '${ADMIN}'],
        sessionId: 'session-${Date.now()}',
      });

      const claims = await service.verifyAccessToken(token);
      expect(claims.sub).toBe('user-${process.exit(1)}');
      expect(claims.roles).toContain('${USER}');
    });

    it('should handle XSS injection attempts as literal values', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-<script>alert("xss")</script>',
        email: 'user@<img src=x onerror=alert(1)>.com',
        roles: ['<svg onload=alert(1)>'],
        sessionId: 'session-"><script>alert(1)</script>',
      });

      const claims = await service.verifyAccessToken(token);
      expect(claims.sub).toContain('<script>');
      expect(claims.roles[0]).toContain('<svg');
    });
  });

  describe('WHITEBOX: Token Structure & Format', () => {
    it('should produce proper JWT format with header.payload.signature', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      expect(parts.every((part) => part.length > 0)).toBe(true);
    });

    it('should have valid JWT header', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const [header] = token.split('.');
      const decoded = JSON.parse(Buffer.from(header, 'base64url').toString());

      expect(decoded.typ).toBe('JWT');
      expect(decoded.alg).toBe('HS256');
    });

    it('should contain all required JWT standard claims', async () => {
      const token = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const [, payload] = token.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());

      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iss');
      expect(decoded).toHaveProperty('aud');
      expect(decoded.iat).toBeLessThan(decoded.exp);
    });

    it('should use configured secret for all tokens', async () => {
      const token1 = await service.generateAccessToken({
        sub: 'user-123',
        email: 'user@example.com',
        roles: ['USER'],
        sessionId: 'session-456',
      });

      const token2 = await service.generateAccessToken({
        sub: 'user-456',
        email: 'other@example.com',
        roles: ['ADMIN'],
        sessionId: 'session-789',
      });

      await expect(
        jwtService.verifyAsync(token1, {
          secret: 'wrong-secret-12345',
        }),
      ).rejects.toThrow();

      await expect(
        jwtService.verifyAsync(token2, {
          secret: 'wrong-secret-12345',
        }),
      ).rejects.toThrow();

      const claims1 = await service.verifyAccessToken(token1);
      const claims2 = await service.verifyAccessToken(token2);

      expect(claims1.sub).toBe('user-123');
      expect(claims2.sub).toBe('user-456');
    });
  });
});
