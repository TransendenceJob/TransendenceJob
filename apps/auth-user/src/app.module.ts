import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TracingHeaderMiddleware } from './modules/common/middleware/tracing-header.middleware';
import { BearerTokenMiddleware } from './modules/common/middleware/bearer-token.middleware';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AppConfigModule } from './modules/config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthController } from './modules/auth/auth.controller';
import { RedisModule } from './modules/redis/redis.module';
import { AuthPersistenceModule } from './modules/persistence/auth-persistence.module';
import { UserAgentMiddleware } from './modules/common/middleware/user-agent.middleware';

@Module({
  imports: [
    HealthModule,

    PrismaModule,

    AppConfigModule,

    AuthPersistenceModule,
    AuthModule,
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingHeaderMiddleware).forRoutes('*');

    consumer.apply(UserAgentMiddleware).forRoutes(AuthController);

    consumer.apply(BearerTokenMiddleware).forRoutes({
      path: 'verify',
      method: RequestMethod.GET,
    });
  }
}
