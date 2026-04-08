import { Injectable } from '@nestjs/common';
import { AuthRedisService } from '../../redis/auth-redis.service';

@Injectable()
export class AuthSessionCacheService {
  constructor(private readonly redis: AuthRedisService) {}

  async cacheSession(input: {
    session: {
      id: string;
      expiresAt: Date;
    };
    user: {
      id: string;
      status: string;
    };
    roles: string[];
    requestId?: string;
    serviceName?: string;
  }): Promise<void> {
    const sessionCacheTtl = Math.max(
      1,
      Math.floor((input.session.expiresAt.getTime() - Date.now()) / 1000),
    );

    await this.redis.cacheSessionById(
      input.session.id,
      JSON.stringify({
        userId: input.user.id,
        status: input.user.status,
        roles: input.roles,
        requestId: input.requestId ?? null,
        serviceName: input.serviceName ?? null,
      }),
      sessionCacheTtl,
    );
  }
}
