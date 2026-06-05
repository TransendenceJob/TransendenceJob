import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { SocialRedisKeyService } from './social-redis-key.service';
import { SocialRedisService } from './social-redis.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [SocialRedisKeyService, SocialRedisService],
  exports: [SocialRedisKeyService, SocialRedisService],
})
export class RedisModule {}
