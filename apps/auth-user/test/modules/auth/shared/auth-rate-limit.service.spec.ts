import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthRateLimitService } from '../../../../src/modules/auth/shared/auth-rate-limit.service';

describe('AuthRateLimitService', () => {
  let redis: {
    incrementRateLimitCounter: jest.Mock;
  };

  let service: AuthRateLimitService;

  beforeEach(() => {
    redis = {
      incrementRateLimitCounter: jest.fn(),
    };

    service = new AuthRateLimitService(redis as never);
  });

  it('allows refresh attempts when the bucket is under the limit', async () => {
    redis.incrementRateLimitCounter.mockResolvedValueOnce(1);

    await expect(
      service.ensureRefreshAllowed({ ip: '127.0.0.1' }),
    ).resolves.toBeUndefined();

    expect(redis.incrementRateLimitCounter).toHaveBeenCalledWith(
      'refresh:ip:127.0.0.1',
      60,
    );
  });

  it('rejects refresh attempts that exceed the limit', async () => {
    redis.incrementRateLimitCounter.mockResolvedValueOnce(6);

    await expect(
      service.ensureRefreshAllowed({ ip: '127.0.0.1' }),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Too many refresh attempts',
    });
  });

  it('uses an unknown bucket when the ip is missing', async () => {
    redis.incrementRateLimitCounter.mockResolvedValueOnce(1);

    await service.ensureRefreshAllowed({});

    expect(redis.incrementRateLimitCounter).toHaveBeenCalledWith(
      'refresh:ip:unknown',
      60,
    );
  });
});
