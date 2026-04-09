import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { AuthConfigService } from '../../config/auth-config.service';
import { SessionRepository } from '../../persistence/repositories/session.repository';
import { type RefreshTokenPair } from './token-contracts';

type RefreshTokenRuntimeConfig = {
  bytes: number;
  ttl: string;
  hashPepper: string;
};

@Injectable()
export class RefreshTokenService {
  private readonly refreshTokenConfig: RefreshTokenRuntimeConfig;

  constructor(
    private readonly config: AuthConfigService,
    private readonly sessions: SessionRepository,
  ) {
    this.refreshTokenConfig = this.config
      .refreshToken as RefreshTokenRuntimeConfig;
  }

  /**
   * Generates a cryptographically random opaque refresh token.
   * The token is long and unguessable; the hash is stored in the database.
   * @returns A base64url-encoded random token string
   * @example
   * const token = refreshTokenService.generateOpaqueRefreshToken();
   * // Example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   */
  generateOpaqueRefreshToken(): string {
    return randomBytes(this.refreshTokenConfig.bytes).toString('base64url');
  }

  /**
   * Hashes a refresh token using SHA256 with a pepper for storage.
   * Never store plain tokens; always store hashes.
   * @param token - The opaque refresh token to hash
   * @returns SHA256 hash of token + pepper in hex format
   * @example
   * const hash = refreshTokenService.hashRefreshToken(token);
   * // Store hash in database session record
   */
  hashRefreshToken(token: string): string {
    return createHash('sha256')
      .update(`${token}:${this.refreshTokenConfig.hashPepper}`)
      .digest('hex');
  }

  /**
   * Verifies a refresh token against its stored hash using timing-safe comparison.
   * Prevents timing attacks on hash verification.
   * @param token - The plain refresh token from the client
   * @param tokenHash - The stored hash from the database
   * @returns true if token matches the hash; false otherwise
   * @example
   * const isValid = refreshTokenService.verifyRefreshToken(
   *   receivedToken,
   *   session.refreshTokenHash
   * );
   * if (!isValid) throw new UnauthorizedException();
   */
  verifyRefreshToken(token: string, tokenHash: string): boolean {
    const candidate = this.hashRefreshToken(token);
    const candidateBuffer = Buffer.from(candidate);
    const tokenHashBuffer = Buffer.from(tokenHash);

    if (candidateBuffer.length !== tokenHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(candidateBuffer, tokenHashBuffer);
  }

  /**
   * Creates a new refresh token and its hash, with expiration time.
   * Convenience method combining token generation, hashing, and expiry calculation.
   * @returns Object with refreshToken, refreshTokenHash, and expiresAt date
   * @example
   * const pair = refreshTokenService.createRefreshTokenPair();
   * await db.session.create({ refreshTokenHash: pair.refreshTokenHash });
   */
  createRefreshTokenPair(): RefreshTokenPair {
    const refreshToken = this.generateOpaqueRefreshToken();
    return {
      refreshToken,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: this.computeRefreshExpiresAt(),
    };
  }

  /**
   * Creates a new session with a refresh token stored in the database.
   * Called during login to establish a user session.
   * @param input - Object with userId, optional userAgent and ipAddress
   * @returns Promise with sessionId, refreshToken (plain), and expiresAt
   * @throws May throw if database operations fail
   * @example
   * const { sessionId, refreshToken } = await refreshTokenService
   *   .createSessionWithRefreshToken({
   *     userId: 'user-123',
   *     userAgent: req.get('user-agent'),
   *     ipAddress: req.ip
   *   });
   */
  async createSessionWithRefreshToken(input: {
    userId: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ sessionId: string; refreshToken: string; expiresAt: Date }> {
    const pair = this.createRefreshTokenPair();

    const session = await this.sessions.createSession({
      userId: input.userId,
      refreshTokenHash: pair.refreshTokenHash,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt: pair.expiresAt,
    });

    return {
      sessionId: session.id,
      refreshToken: pair.refreshToken,
      expiresAt: pair.expiresAt,
    };
  }

  /**
   * Rotates (refreshes) an existing refresh token by issuing a new one.
   * The old session record is updated with the new token hash.
   * Use when client submits a valid refresh token to get new tokens.
   * @param sessionId - Unique session identifier to update
   * @param currentRefreshToken - The refresh token being used to request rotation
   * @returns Promise with new refreshToken and updated expiresAt
   * @throws NotFoundException if session not found
   * @throws UnauthorizedException if session is revoked, expired, or token mismatch
   * @example
   * const { refreshToken } = await refreshTokenService.rotateRefreshToken(
   *   sessionId,
   *   oldRefreshToken
   * );
   */
  async rotateRefreshToken(
    sessionId: string,
    currentRefreshToken: string,
  ): Promise<{ refreshToken: string; expiresAt: Date }> {
    const session = await this.sessions.findById(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const normalizedSession = session as {
      revokedAt?: Date | null;
      refreshTokenHash: string | null;
      expiresAt: Date;
    };

    if (normalizedSession.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (normalizedSession.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session has expired');
    }

    if (
      !normalizedSession.refreshTokenHash ||
      !this.verifyRefreshToken(
        currentRefreshToken,
        normalizedSession.refreshTokenHash,
      )
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const pair = this.createRefreshTokenPair();

    await this.sessions.updateRefreshTokenHash(
      sessionId,
      pair.refreshTokenHash,
      pair.expiresAt,
    );

    return {
      refreshToken: pair.refreshToken,
      expiresAt: pair.expiresAt,
    };
  }

  /**
   * Revokes a session by marking it as revoked in the database.
   * After revocation, the refresh token can no longer be used.
   * Called during logout or forced sign-out.
   * @param sessionId - Session identifier to revoke
   * @returns Promise that resolves when revocation is stored
   * @throws May throw if database operations fail
   * @example
   * await refreshTokenService.revokeSession(sessionId);
   * // Now refresh token from this session is invalid
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.sessions.revokeSession(sessionId);
  }

  /**
   * Computes the expiration time for a refresh token based on configured TTL.
   * Parses TTL string (e.g., '7d', '30m') and returns future Date.
   * Private helper used internally by token creation methods.
   * @returns Date representing when the token will expire
   */
  private computeRefreshExpiresAt(): Date {
    const ttl = this.refreshTokenConfig.ttl;
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
