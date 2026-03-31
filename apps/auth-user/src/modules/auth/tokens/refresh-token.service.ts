import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { AuthConfigService } from '../../config/auth-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { type RefreshTokenPair } from './token-contracts';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly config: AuthConfigService,
    private readonly prisma: PrismaService,
  ) {}

  generateOpaqueRefreshToken(): string {
    return randomBytes(this.config.refreshToken.bytes).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256')
      .update(`${token}:${this.config.refreshToken.hashPepper}`)
      .digest('hex');
  }

  verifyRefreshToken(token: string, tokenHash: string): boolean {
    const candidate = this.hashRefreshToken(token);
    return timingSafeEqual(Buffer.from(candidate), Buffer.from(tokenHash));
  }

  createRefreshTokenPair(): RefreshTokenPair {
    const refreshToken = this.generateOpaqueRefreshToken();
    return {
      refreshToken,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: this.computeRefreshExpiresAt(),
    };
  }

  async createSessionWithRefreshToken(input: {
    userId: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ sessionId: string; refreshToken: string; expiresAt: Date }> {
    const pair = this.createRefreshTokenPair();

    const session = await this.prisma.session.create({
      data: {
        userId: input.userId,
        refreshTokenHash: pair.refreshTokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: pair.expiresAt,
      },
    });

    return {
      sessionId: session.id,
      refreshToken: pair.refreshToken,
      expiresAt: pair.expiresAt,
    };
  }

  async rotateRefreshToken(
    sessionId: string,
    currentRefreshToken: string,
  ): Promise<{ refreshToken: string; expiresAt: Date }> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session has expired');
    }

    if (
      !this.verifyRefreshToken(currentRefreshToken, session.refreshTokenHash)
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const pair = this.createRefreshTokenPair();

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: pair.refreshTokenHash,
        expiresAt: pair.expiresAt,
      },
    });

    return {
      refreshToken: pair.refreshToken,
      expiresAt: pair.expiresAt,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private computeRefreshExpiresAt(): Date {
    const ttl = this.config.refreshToken.ttl;
    const amount = Number(ttl.slice(0, -1));
    const unit = ttl.at(-1);

    let multiplier = 1000;
    if (unit === 'm') {
      multiplier = 60 * 1000;
    } else if (unit === 'h') {
      multiplier = 60 * 60 * 1000;
    } else if (unit === 'd') {
      multiplier = 24 * 60 * 60 * 1000;
    }

    return new Date(Date.now() + amount * multiplier);
  }
}
