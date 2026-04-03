import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthRedisService } from '../../redis/auth-redis.service';

const REGISTER_ATTEMPT_LIMIT = 5;
const REGISTER_ATTEMPT_WINDOW_SECONDS = 60;

@Injectable()
export class AuthRateLimitService {
  constructor(private readonly redis: AuthRedisService) {}

  async ensureRegisterAllowed(input: {
    email: string;
    ip?: string | null;
  }): Promise<void> {
    const ipBucket = input.ip
      ? `register:ip:${input.ip}`
      : 'register:ip:unknown';
    const emailBucket = `register:email:${input.email.toLowerCase()}`;

    const [ipAttempts, emailAttempts] = await Promise.all([
      this.redis.incrementRateLimitCounter(
        ipBucket,
        REGISTER_ATTEMPT_WINDOW_SECONDS,
      ),
      this.redis.incrementRateLimitCounter(
        emailBucket,
        REGISTER_ATTEMPT_WINDOW_SECONDS,
      ),
    ]);

    if (
      ipAttempts > REGISTER_ATTEMPT_LIMIT ||
      emailAttempts > REGISTER_ATTEMPT_LIMIT
    ) {
      throw new HttpException(
        'Too many register attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
