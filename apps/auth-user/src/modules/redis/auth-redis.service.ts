import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createClient, type RedisClientType } from 'redis';
import { AuthConfigService } from '../config/auth-config.service';
import { AuthRedisKeyService } from './auth-redis-key.service';

@Injectable()
export class AuthRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthRedisService.name);
  private readonly client: RedisClientType;
  private connected = false;

  constructor(
    private readonly config: AuthConfigService,
    private readonly keys: AuthRedisKeyService,
  ) {
    this.client = createClient({
      socket: {
        host: this.config.redis.host,
        port: this.config.redis.port,
      },
    });

    this.client.on('ready', () => {
      this.connected = true;
      this.logger.log('Redis connection ready');
    });

    this.client.on('end', () => {
      this.connected = false;
      this.logger.warn('Redis connection closed');
    });

    this.client.on('error', (error: unknown) => {
      this.connected = false;
      const reason =
        error instanceof Error ? error.message : 'unknown Redis error';
      this.logger.warn(`Redis unavailable: ${reason}`);
    });
  }

  /**
   * Connects to Redis on module initialization. Fails gracefully if connection fails.
   * Framework lifecycle hook; do not call directly.
   * @returns Promise that resolves when connection is attempted.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error: unknown) {
      this.connected = false;
      const reason =
        error instanceof Error ? error.message : 'unable to connect';
      this.logger.warn(`Redis startup skipped: ${reason}`);
    }
  }

  /**
   * Closes Redis connection on module shutdown.
   * Framework lifecycle hook; do not call directly.
   * @returns Promise that resolves when connection is closed.
   */
  async onModuleDestroy(): Promise<void> {
    if (!this.client.isOpen) {
      return;
    }

    try {
      await this.client.quit();
    } catch {
      await this.client.disconnect();
    }
  }

  /**
   * Checks if Redis is connected and ready for operations.
   * @returns true if Redis is connected and ready; false otherwise or if unavailable.
   * @example
   * if (authRedisService.isHealthy()) {
   *   // Redis is available
   * }
   */
  isHealthy(): boolean {
    return (this.connected || this.client.isOpen) && this.client.isReady;
  }

  /**
   * Caches a verification payload with a TTL.
   * Use for email verification, OTP codes, magic link validation, etc.
   * @param identifier - Unique verification identifier (e.g., 'email:user@example.com')
   * @param payload - The data to cache (typically JSON stringified)
   * @param ttlSeconds - Time to live in seconds (default: 60)
   * @returns Promise that resolves when cache write is complete (or fails gracefully).
   * @example
   * await authRedisService.cacheVerifyLookup(
   *   'email:user@example.com',
   *   JSON.stringify({ userId: '123', verified: true }),
   *   90
   * );
   */
  async cacheVerifyLookup(
    identifier: string,
    payload: string,
    ttlSeconds = 60,
  ): Promise<void> {
    const key = this.keys.verifyLookup(identifier);
    await this.safeExecute(() =>
      this.client.set(key, payload, {
        EX: ttlSeconds,
      }),
    );
  }

  /**
   * Retrieves cached verification payload.
   * @param identifier - Unique verification identifier (must match cacheVerifyLookup call)
   * @returns Cached payload string or null if not found or Redis unavailable.
   * @example
   * const cached = await authRedisService.getVerifyLookup('email:user@example.com');
   * if (cached) {
   *   const data = JSON.parse(cached);
   * }
   */
  async getVerifyLookup(identifier: string): Promise<string | null> {
    const key = this.keys.verifyLookup(identifier);
    return await this.safeExecute(() => this.client.get(key), null);
  }

  /**
   * Marks an access token as revoked in the blacklist.
   * Use for logout, session termination, or forced sign-out scenarios.
   * @param token - The full access token string (will be hashed internally)
   * @param ttlSeconds - How long to keep the revocation marker (should match token TTL)
   * @returns Promise that resolves when revocation is stored.
   * @example
   * await authRedisService.revokeAccessToken(accessToken, 15 * 60); // 15 minutes
   */
  async revokeAccessToken(token: string, ttlSeconds: number): Promise<void> {
    const fingerprint = this.tokenFingerprint(token);
    const key = this.keys.revokedAccessToken(fingerprint);

    await this.safeExecute(() =>
      this.client.set(key, '1', {
        EX: ttlSeconds,
      }),
    );
  }

  /**
   * Checks if an access token has been revoked.
   * Use in middleware/guards before accepting a JWT.
   * @param token - The full access token string to check
   * @returns true if token is revoked; false if valid or Redis unavailable.
   * @example
   * const revoked = await authRedisService.isAccessTokenRevoked(accessToken);
   * if (revoked) throw new UnauthorizedException('Token has been revoked');
   */
  async isAccessTokenRevoked(token: string): Promise<boolean> {
    const fingerprint = this.tokenFingerprint(token);
    const key = this.keys.revokedAccessToken(fingerprint);

    const exists = await this.safeExecute(() => this.client.exists(key), 0);
    return exists > 0;
  }

  /**
   * Increments a rate-limit counter within a fixed time window.
   * Sets expiry on first increment to ensure window cleanup.
   * Use for login attempts, OTP requests, brute-force protection.
   * @param bucket - The rate-limit bucket identifier (e.g., 'login:ip:1.2.3.4')
   * @param windowSeconds - Length of the rate-limit window in seconds
   * @returns The current count after increment (0 if Redis unavailable).
   * @example
   * const count = await authRedisService.incrementRateLimitCounter(
   *   `login:ip:${ipAddress}`,
   *   60
   * );
   * if (count > 5) throw new TooManyRequestsException('Too many login attempts');
   */
  async incrementRateLimitCounter(
    bucket: string,
    windowSeconds: number,
  ): Promise<number> {
    const key = this.keys.rateLimit(bucket);

    const count = await this.safeExecute(() => this.client.incr(key), 0);
    if (count === 1) {
      await this.safeExecute(() => this.client.expire(key, windowSeconds));
    }

    return count;
  }

  /**
   * Caches a session payload for fast access.
   * Use to reduce DB pressure on hot session reads.
   * @param sessionId - Unique session identifier
   * @param payload - Session data to cache (typically JSON stringified)
   * @param ttlSeconds - Time to live in seconds
   * @returns Promise that resolves when cache write is complete.
   * @example
   * await authRedisService.cacheSessionById(
   *   sessionId,
   *   JSON.stringify({ userId, roles, device }),
   *   300
   * );
   */
  async cacheSessionById(
    sessionId: string,
    payload: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.keys.sessionById(sessionId);
    await this.safeExecute(() =>
      this.client.set(key, payload, {
        EX: ttlSeconds,
      }),
    );
  }

  /**
   * Retrieves cached session payload.
   * @param sessionId - Unique session identifier
   * @returns Cached session string or null if not found or Redis unavailable.
   * @example
   * const cached = await authRedisService.getSessionById(sessionId);
   * const session = cached
   *   ? JSON.parse(cached)
   *   : await loadSessionFromDatabase(sessionId);
   */
  async getSessionById(sessionId: string): Promise<string | null> {
    const key = this.keys.sessionById(sessionId);
    return await this.safeExecute(() => this.client.get(key), null);
  }

  /**
   * Deletes a cached session entry.
   * Use for logout, session revocation, or cache invalidation after update.
   * @param sessionId - Unique session identifier to delete
   * @returns Promise that resolves when deletion is complete.
   * @example
   * await authRedisService.deleteSessionById(sessionId);
   */
  async deleteSessionById(sessionId: string): Promise<void> {
    const key = this.keys.sessionById(sessionId);
    await this.safeExecute(() => this.client.del(key));
  }

  /**
   * Generates a SHA256 fingerprint of an access token.
   * Used internally for safe token storage in the revocation blacklist.
   * @param token - The full access token string
   * @returns SHA256 hash of the token in hex format.
   */
  private tokenFingerprint(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Executes a Redis operation with automatic error handling and fallback.
   * Ensures Redis failures do not crash auth flow.
   * @param operation - Async function that performs the Redis operation
   * @param fallback - Optional fallback value if Redis is unavailable or operation fails
   * @returns The operation result, fallback value, or undefined.
   */
  private async safeExecute<T>(
    operation: () => Promise<T>,
    fallback?: T,
  ): Promise<T> {
    if (!this.client.isOpen || !this.client.isReady) {
      if (fallback !== undefined) {
        return fallback;
      }

      return undefined as T;
    }

    try {
      return await operation();
    } catch (error: unknown) {
      const reason =
        error instanceof Error
          ? error.message
          : 'unknown Redis operation error';
      this.logger.warn(`Redis operation skipped: ${reason}`);

      if (fallback !== undefined) {
        return fallback;
      }

      return undefined as T;
    }
  }
}
