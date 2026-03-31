import { HealthController } from '../../../src/modules/health/health.controller';
import { type AuthRedisService } from '../../../src/modules/redis/auth-redis.service';

describe('HealthController', () => {
  it('returns ok when redis is healthy', () => {
    const redis = {
      isHealthy: jest.fn().mockReturnValue(true),
    } as unknown as AuthRedisService;

    const controller = new HealthController(redis);

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
    } as unknown as AuthRedisService;

    const controller = new HealthController(redis);

    expect(controller.getHealth()).toEqual({
      status: 'degraded',
      dependencies: {
        redis: 'down',
      },
    });
  });
});
