import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { SocialConfigService } from '../config/social-config.service';
import { SocialRedisKeyService } from './social-redis-key.service';

@Injectable()
export class SocialRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocialRedisService.name);
  private readonly client: RedisClientType;
  private connected = false;

  constructor(
    private readonly config: SocialConfigService,
    private readonly keys: SocialRedisKeyService,
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
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Redis unavailable: ${reason}`);
    });
  }

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

  isHealthy(): boolean {
    return (this.connected || this.client.isOpen) && this.client.isReady;
  }

  async markConnection(userId: string, socketId: string): Promise<void> {
    const ttl = this.config.redis.presenceTtlSeconds;
    await this.safeExecute(async () => {
      await this.client.set(this.keys.connection(userId, socketId), '1', {
        EX: ttl,
      });
      await this.client.sAdd(this.keys.connections(userId), socketId);
      await this.client.expire(this.keys.connections(userId), ttl);
    });
    await this.touchPresence(userId);
  }

  async touchPresence(userId: string): Promise<void> {
    await this.safeExecute(() =>
      this.client.set(this.keys.presence(userId), '1', {
        EX: this.config.redis.presenceTtlSeconds,
      }),
    );
  }

  async removeConnection(userId: string, socketId: string): Promise<void> {
    await this.safeExecute(async () => {
      await this.client.del(this.keys.connection(userId, socketId));
      await this.client.sRem(this.keys.connections(userId), socketId);
    });
  }

  async hasActiveConnections(userId: string): Promise<boolean> {
    const socketIds = await this.safeExecute(
      () => this.client.sMembers(this.keys.connections(userId)),
      [] as string[],
    );
    if (socketIds.length === 0) {
      return false;
    }

    let activeConnections = 0;
    for (const socketId of socketIds) {
      const exists = await this.safeExecute(
        () => this.client.exists(this.keys.connection(userId, socketId)),
        0,
      );
      if (exists > 0) {
        activeConnections += 1;
        continue;
      }

      await this.safeExecute(() =>
        this.client.sRem(this.keys.connections(userId), socketId),
      );
    }

    if (activeConnections > 0) {
      await this.safeExecute(() =>
        this.client.expire(
          this.keys.connections(userId),
          this.config.redis.presenceTtlSeconds,
        ),
      );
    }

    return activeConnections > 0;
  }

  async isOnline(userId: string): Promise<boolean> {
    const exists = await this.safeExecute(
      () => this.client.exists(this.keys.presence(userId)),
      0,
    );
    return exists > 0;
  }

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
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Redis operation skipped: ${reason}`);

      if (fallback !== undefined) {
        return fallback;
      }

      return undefined as T;
    }
  }
}
