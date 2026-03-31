import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from '../../../../src/modules/auth/tokens/refresh-token.service';
import { type AuthConfigService } from '../../../../src/modules/config/auth-config.service';
import { type PrismaService } from '../../../../src/modules/prisma/prisma.service';

describe('RefreshTokenService', () => {
  const config = {
    refreshToken: {
      bytes: 48,
      ttl: '7d',
      hashPepper: 'pepper',
    },
  } as AuthConfigService;

  it('generates and verifies refresh token hash', () => {
    const prisma = {} as PrismaService;
    const service = new RefreshTokenService(config, prisma);

    const token = service.generateOpaqueRefreshToken();
    const hash = service.hashRefreshToken(token);

    expect(service.verifyRefreshToken(token, hash)).toBe(true);
    expect(service.verifyRefreshToken('wrong-token', hash)).toBe(false);
  });

  it('creates session with hashed refresh token', async () => {
    const prisma = {
      session: {
        create: jest.fn().mockResolvedValue({ id: 'session-1' }),
      },
    } as unknown as PrismaService;

    const service = new RefreshTokenService(config, prisma);
    const session = await service.createSessionWithRefreshToken({
      userId: 'user-1',
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
    });

    expect(session.sessionId).toBe('session-1');
    expect(session.refreshToken).toBeDefined();
    expect(session.expiresAt).toBeInstanceOf(Date);
    expect(prisma.session.create).toHaveBeenCalledTimes(1);
  });

  it('rotates refresh token for valid session', async () => {
    const prisma = {
      session: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as PrismaService;

    const service = new RefreshTokenService(config, prisma);
    const currentToken = service.generateOpaqueRefreshToken();
    const currentHash = service.hashRefreshToken(currentToken);

    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      refreshTokenHash: currentHash,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const rotated = await service.rotateRefreshToken('session-1', currentToken);

    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.expiresAt).toBeInstanceOf(Date);
    expect(prisma.session.update).toHaveBeenCalledTimes(1);
  });

  it('fails rotation for missing session', async () => {
    const prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const service = new RefreshTokenService(config, prisma);

    await expect(
      service.rotateRefreshToken('missing-session', 'token'),
    ).rejects.toThrow(NotFoundException);
  });

  it('fails rotation for revoked session', async () => {
    const prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'session-1',
          refreshTokenHash: 'hash',
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        }),
      },
    } as unknown as PrismaService;

    const service = new RefreshTokenService(config, prisma);

    await expect(
      service.rotateRefreshToken('session-1', 'token'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
