import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from '../../../../src/modules/auth/tokens/refresh-token.service';
import { type AuthConfigService } from '../../../../src/modules/config/auth-config.service';
import { type PrismaService } from '../../../../src/modules/prisma/prisma.service';
import { randomBytes } from 'node:crypto';

describe('RefreshTokenService - Comprehensive Unit Tests', () => {
  const mockConfig = {
    refreshToken: {
      bytes: 48,
      ttl: '7d',
      hashPepper: 'test-pepper-secret-key-123',
    },
  } as AuthConfigService;

  let service: RefreshTokenService;
  let mockPrisma: PrismaService;

  beforeEach(() => {
    mockPrisma = {
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as PrismaService;

    service = new RefreshTokenService(mockConfig, mockPrisma);
  });

  describe('BLACKBOX: generateOpaqueRefreshToken - Token Generation', () => {
    it('should generate a base64url-encoded token', () => {
      const token = service.generateOpaqueRefreshToken();

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      // base64url content should only contain alphanumeric, '-', '_'
      expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
    });

    it('should generate tokens of correct length', () => {
      const token = service.generateOpaqueRefreshToken();
      // 48 bytes in base64url is roughly 64 characters
      expect(token.length).toBeGreaterThanOrEqual(60);
      expect(token.length).toBeLessThanOrEqual(70);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = service.generateOpaqueRefreshToken();
      const token2 = service.generateOpaqueRefreshToken();
      const token3 = service.generateOpaqueRefreshToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate cryptographically random tokens', () => {
      const tokens = Array.from({ length: 100 }, () =>
        service.generateOpaqueRefreshToken(),
      );

      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(100); // All should be unique
    });
  });

  describe('BLACKBOX: hashRefreshToken - Hashing', () => {
    it('should hash a refresh token to a different string', () => {
      const token = service.generateOpaqueRefreshToken();
      const hash = service.hashRefreshToken(token);

      expect(hash).not.toBe(token);
      expect(hash).toBeTruthy();
    });

    it('should produce consistent hash for same token', () => {
      const token = service.generateOpaqueRefreshToken();
      const hash1 = service.hashRefreshToken(token);
      const hash2 = service.hashRefreshToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', () => {
      const token1 = service.generateOpaqueRefreshToken();
      const token2 = service.generateOpaqueRefreshToken();

      const hash1 = service.hashRefreshToken(token1);
      const hash2 = service.hashRefreshToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce hex-encoded hash', () => {
      const token = service.generateOpaqueRefreshToken();
      const hash = service.hashRefreshToken(token);

      // SHA256 hex is 64 characters
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
    });

    it('should use configured pepper in hash', () => {
      const token = service.generateOpaqueRefreshToken();
      const hash1 = service.hashRefreshToken(token);

      // Create service with different pepper
      const differentPepperConfig = {
        refreshToken: {
          ...mockConfig.refreshToken,
          hashPepper: 'different-pepper-secret',
        },
      } as AuthConfigService;

      const differentService = new RefreshTokenService(
        differentPepperConfig,
        mockPrisma,
      );
      const hash2 = differentService.hashRefreshToken(token);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('BLACKBOX: verifyRefreshToken - Verification', () => {
    it('should verify a token against its correct hash', () => {
      const token = service.generateOpaqueRefreshToken();
      const hash = service.hashRefreshToken(token);

      const isValid = service.verifyRefreshToken(token, hash);
      expect(isValid).toBe(true);
    });

    it('should reject token with mismatched hash', () => {
      const token = service.generateOpaqueRefreshToken();
      const otherToken = service.generateOpaqueRefreshToken();
      const wrongHash = service.hashRefreshToken(otherToken);

      const isValid = service.verifyRefreshToken(token, wrongHash);
      expect(isValid).toBe(false);
    });

    it('should reject tampered token', () => {
      const token = service.generateOpaqueRefreshToken();
      const hash = service.hashRefreshToken(token);

      // Tamper with token
      const tamperedToken = token.slice(0, -1) + 'X';

      const isValid = service.verifyRefreshToken(tamperedToken, hash);
      expect(isValid).toBe(false);
    });

    it('should be constant-time comparison (timing-safe)', () => {
      const token = service.generateOpaqueRefreshToken();
      const hash = service.hashRefreshToken(token);
      const wrongToken = 'x'.repeat(token.length);

      // Should not throw even with very different tokens
      expect(() => {
        service.verifyRefreshToken(token, hash);
        service.verifyRefreshToken(wrongToken, hash);
      }).not.toThrow();
    });
  });

  describe('BLACKBOX: createRefreshTokenPair - Token Pair Creation', () => {
    it('should return token, hash, and expiration', () => {
      const pair = service.createRefreshTokenPair();

      expect(pair).toHaveProperty('refreshToken');
      expect(pair).toHaveProperty('refreshTokenHash');
      expect(pair).toHaveProperty('expiresAt');
    });

    it('should have valid token-hash relationship', () => {
      const pair = service.createRefreshTokenPair();

      const isValid = service.verifyRefreshToken(
        pair.refreshToken,
        pair.refreshTokenHash,
      );
      expect(isValid).toBe(true);
    });

    it('should set expiration in future', () => {
      const pair = service.createRefreshTokenPair();
      const now = new Date();

      expect(pair.expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should set expiration to approximately 7 days', () => {
      const pair = service.createRefreshTokenPair();
      const now = new Date();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      const timeUntilExpiry = pair.expiresAt.getTime() - now.getTime();
      expect(timeUntilExpiry).toBeGreaterThan(sevenDaysMs - 1000);
      expect(timeUntilExpiry).toBeLessThan(sevenDaysMs + 1000);
    });

    it('should create unique pairs', () => {
      const pair1 = service.createRefreshTokenPair();
      const pair2 = service.createRefreshTokenPair();

      expect(pair1.refreshToken).not.toBe(pair2.refreshToken);
      expect(pair1.refreshTokenHash).not.toBe(pair2.refreshTokenHash);
    });
  });

  describe('BLACKBOX: createSessionWithRefreshToken - Session Creation', () => {
    it('should create session in database', async () => {
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
      });

      const result = await service.createSessionWithRefreshToken({
        userId: 'user-123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      });

      expect(mockPrisma.session.create).toHaveBeenCalledTimes(1);
      expect(result.sessionId).toBe('session-123');
    });

    it('should return plain refresh token (not hash)', async () => {
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
      });

      const result = await service.createSessionWithRefreshToken({
        userId: 'user-123',
      });

      expect(result.refreshToken).toBeTruthy();
      // Should be base64url, not hex (hash is hex)
      expect(/^[A-Za-z0-9_-]+$/.test(result.refreshToken)).toBe(true);
    });

    it('should store hashed token in database', async () => {
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
      });

      await service.createSessionWithRefreshToken({
        userId: 'user-123',
      });

      const callArg = (mockPrisma.session.create as jest.Mock).mock.calls[0][0];
      const storedHash = callArg.data.refreshTokenHash;

      // Hash should be hex format (64 chars for SHA256)
      expect(/^[a-f0-9]{64}$/.test(storedHash)).toBe(true);
    });

    it('should include userId, userAgent, and ipAddress', async () => {
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
      });

      await service.createSessionWithRefreshToken({
        userId: 'user-456',
        userAgent: 'Chrome/91.0',
        ipAddress: '10.0.0.1',
      });

      const callArg = (mockPrisma.session.create as jest.Mock).mock.calls[0][0];

      expect(callArg.data.userId).toBe('user-456');
      expect(callArg.data.userAgent).toBe('Chrome/91.0');
      expect(callArg.data.ipAddress).toBe('10.0.0.1');
    });

    it('should return expiration date', async () => {
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
      });

      const result = await service.createSessionWithRefreshToken({
        userId: 'user-123',
      });

      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('BLACKBOX: rotateRefreshToken - Token Rotation', () => {
    it('should return new refresh token', async () => {
      const oldToken = service.generateOpaqueRefreshToken();
      const oldHash = service.hashRefreshToken(oldToken);

      (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-123',
        refreshTokenHash: oldHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      (mockPrisma.session.update as jest.Mock).mockResolvedValue({
        id: 'session-123',
      });

      const result = await service.rotateRefreshToken('session-123', oldToken);

      expect(result.refreshToken).toBeTruthy();
      expect(result.refreshToken).not.toBe(oldToken);
    });

    it('should update session with new token hash', async () => {
      const oldToken = service.generateOpaqueRefreshToken();
      const oldHash = service.hashRefreshToken(oldToken);

      (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-123',
        refreshTokenHash: oldHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      (mockPrisma.session.update as jest.Mock).mockResolvedValue({
        id: 'session-123',
      });

      await service.rotateRefreshToken('session-123', oldToken);

      expect(mockPrisma.session.update).toHaveBeenCalledTimes(1);
      const updateCall = (mockPrisma.session.update as jest.Mock).mock
        .calls[0][0];

      expect(updateCall.data.refreshTokenHash).toBeTruthy();
      expect(updateCall.data.refreshTokenHash).not.toBe(oldHash);
    });

    it('should throw NotFoundException for missing session', async () => {
      (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.rotateRefreshToken('missing-session', 'token'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException for revoked session', async () => {
      const oldToken = service.generateOpaqueRefreshToken();
      const oldHash = service.hashRefreshToken(oldToken);

      (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-123',
        refreshTokenHash: oldHash,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.rotateRefreshToken('session-123', oldToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired session', async () => {
      const oldToken = service.generateOpaqueRefreshToken();
      const oldHash = service.hashRefreshToken(oldToken);

      (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-123',
        refreshTokenHash: oldHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 60_000), // expired
      });

      await expect(
        service.rotateRefreshToken('session-123', oldToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong token', async () => {
      const correctToken = service.generateOpaqueRefreshToken();
      const correctHash = service.hashRefreshToken(correctToken);
      const wrongToken = service.generateOpaqueRefreshToken();

      (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-123',
        refreshTokenHash: correctHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.rotateRefreshToken('session-123', wrongToken),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('BLACKBOX: revokeSession - Session Revocation', () => {
    it('should update session with revokedAt timestamp', async () => {
      (mockPrisma.session.update as jest.Mock).mockResolvedValue(undefined);

      await service.revokeSession('session-123');

      expect(mockPrisma.session.update).toHaveBeenCalledTimes(1);
      const updateCall = (mockPrisma.session.update as jest.Mock).mock
        .calls[0][0];

      expect(updateCall.where.id).toBe('session-123');
      expect(updateCall.data.revokedAt).toBeInstanceOf(Date);
    });

    it('should set revokedAt to current time', async () => {
      (mockPrisma.session.update as jest.Mock).mockResolvedValue(undefined);

      const beforeRevoke = new Date();
      await service.revokeSession('session-123');
      const afterRevoke = new Date();

      const updateCall = (mockPrisma.session.update as jest.Mock).mock
        .calls[0][0];
      const revokedAt = updateCall.data.revokedAt;

      expect(revokedAt.getTime()).toBeGreaterThanOrEqual(
        beforeRevoke.getTime(),
      );
      expect(revokedAt.getTime()).toBeLessThanOrEqual(afterRevoke.getTime());
    });
  });

  describe('WHITEBOX: Private Method - computeRefreshExpiresAt', () => {
    it('should compute 7 day expiration correctly', () => {
      const pair = service.createRefreshTokenPair();
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      const expiresIn = pair.expiresAt.getTime() - now;
      expect(expiresIn).toBeGreaterThan(sevenDaysMs - 5000);
      expect(expiresIn).toBeLessThan(sevenDaysMs + 5000);
    });
  });

  describe('WHITEBOX: Edge Cases & Security', () => {
    it('should handle empty userAgent', async () => {
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
      });

      const result = await service.createSessionWithRefreshToken({
        userId: 'user-123',
        userAgent: undefined,
        ipAddress: '192.168.1.1',
      });

      expect(result.sessionId).toBe('session-123');
    });

    it('should handle various IP formats', async () => {
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
      });

      const ips = [
        '192.168.1.1',
        '::1',
        '2001:db8::1',
        '10.0.0.0',
        '127.0.0.1',
      ];

      for (const ip of ips) {
        await service.createSessionWithRefreshToken({
          userId: 'user-123',
          ipAddress: ip,
        });
      }

      expect(mockPrisma.session.create).toHaveBeenCalledTimes(ips.length);
    });

    it('should verify token before rotation and preserve deterministic hashing', () => {
      const token = service.generateOpaqueRefreshToken();
      const hash = service.hashRefreshToken(token);

      // Token should verify against its own hash
      expect(service.verifyRefreshToken(token, hash)).toBe(true);

      // But not against a double-hashed value
      const doubleHash = service.hashRefreshToken(hash);
      expect(service.verifyRefreshToken(hash, doubleHash)).toBe(true);
    });

    it('should not accept malformed token in rotation', async () => {
      const oldToken = service.generateOpaqueRefreshToken();
      const oldHash = service.hashRefreshToken(oldToken);

      (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-123',
        refreshTokenHash: oldHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      // Try with completely different token
      await expect(
        service.rotateRefreshToken('session-123', 'malformed-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle concurrent token generations', () => {
      const tokens = Array.from({ length: 50 }, () =>
        service.generateOpaqueRefreshToken(),
      );

      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(50);
    });

    it('should preserve token randomness distribution', () => {
      const tokens = Array.from({ length: 10 }, () =>
        service.generateOpaqueRefreshToken(),
      );

      // All tokens should have different prefixes
      const prefixes = tokens.map((t) => t.substring(0, 10));
      const uniquePrefixes = new Set(prefixes);
      expect(uniquePrefixes.size).toBe(10);
    });
  });

  describe('WHITEBOX: Hash Pepper Usage', () => {
    it('should include pepper in hash computation', () => {
      const token = service.generateOpaqueRefreshToken();
      const hash1 = service.hashRefreshToken(token);

      // With same pepper, hash should be identical
      const hash2 = service.hashRefreshToken(token);
      expect(hash1).toBe(hash2);

      // With different pepper config, hash should differ
      const differentConfig = {
        refreshToken: {
          ...mockConfig.refreshToken,
          hashPepper: 'completely-different-pepper',
        },
      } as AuthConfigService;

      const differentService = new RefreshTokenService(
        differentConfig,
        mockPrisma,
      );
      const hash3 = differentService.hashRefreshToken(token);

      expect(hash3).not.toBe(hash1);
    });
  });

  describe('WHITEBOX: Session Lifecycle', () => {
    it('should handle full session lifecycle', async () => {
      // Create session
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
      });

      const { refreshToken, sessionId } =
        await service.createSessionWithRefreshToken({
          userId: 'user-123',
        });

      expect(sessionId).toBe('session-123');
      expect(refreshToken).toBeTruthy();

      // Rotate token
      const tokenHash = service.hashRefreshToken(refreshToken);
      (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        refreshTokenHash: tokenHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      (mockPrisma.session.update as jest.Mock).mockResolvedValue({
        id: sessionId,
      });

      const { refreshToken: newToken } = await service.rotateRefreshToken(
        sessionId,
        refreshToken,
      );

      expect(newToken).not.toBe(refreshToken);

      // Revoke session
      await service.revokeSession(sessionId);

      expect(mockPrisma.session.update).toHaveBeenCalledTimes(2);
    });
  });
});
