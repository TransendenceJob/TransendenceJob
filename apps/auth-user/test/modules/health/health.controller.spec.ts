import { HealthController } from '../../../src/modules/health/health.controller';
import { type AuthRedisService } from '../../../src/modules/redis/auth-redis.service';

describe('HealthController', () => {
  it('returns ok when redis is healthy', () => {
    const redis = {
      isHealthy: jest.fn().mockReturnValue(true),
    } satisfies Pick<AuthRedisService, 'isHealthy'>;

    const controller = new HealthController(redis as AuthRedisService);

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      dependencies: {
        redis: 'up',
      },
    });
  });

  it('returns degraded when redis is unhealthy', () => {
    const redis = {
      isHealthy: jest.fn().mockReturnValue(false),
    } satisfies Pick<AuthRedisService, 'isHealthy'>;

    const controller = new HealthController(redis as AuthRedisService);

    expect(controller.getHealth()).toEqual({
      status: 'degraded',
      dependencies: {
        redis: 'down',
      },
    });
  });
});
