import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { AuthRedisService } from './auth-redis.service';
import { AuthRedisKeyService } from './auth-redis-key.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [AuthRedisKeyService, AuthRedisService],
  exports: [AuthRedisKeyService, AuthRedisService],
})
export class RedisModule {}
