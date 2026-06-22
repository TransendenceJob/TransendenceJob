import { Controller, Get } from '@nestjs/common';
import { SocialRedisService } from '../redis/social-redis.service';

@Controller('health')
export class HealthController {
  constructor(private readonly redis: SocialRedisService) {}

  @Get()
  getHealth() {
    return {
      status: this.redis.isHealthy() ? 'ok' : 'degraded',
      dependencies: {
        redis: this.redis.isHealthy() ? 'up' : 'down',
      },
    };
  }
}
