import { Controller, Get } from '@nestjs/common';
import { AuthRedisService } from '../redis/auth-redis.service';

@Controller('health')
export class HealthController {
  constructor(private readonly authRedis: AuthRedisService) {}

  /**
   * Health check endpoint that reports service status.
   * Returns 'ok' if all dependencies are healthy, 'degraded' otherwise.
   * @returns Object with status and dependency health information
   * @example
   * // GET /internal/auth/health
   * // Response: { status: 'ok', dependencies: { redis: 'up' } }
   */
  @Get()
  getHealth() {
    const redisHealthy = this.authRedis.isHealthy();

    return {
      status: redisHealthy ? 'ok' : 'degraded',
      dependencies: {
        redis: redisHealthy ? 'up' : 'down',
      },
    };
  }
}
