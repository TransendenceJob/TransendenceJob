import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppConfigModule } from './modules/config/config.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { EventsModule } from './modules/events/events.module';
import { SocialModule } from './modules/social/social.module';
import { HealthModule } from './modules/health/health.module';
import { TracingHeaderMiddleware } from './modules/common/middleware/tracing-header.middleware';
import { BearerTokenMiddleware } from './modules/common/middleware/bearer-token.middleware';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    EventsModule,
    HealthModule,
    SocialModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const allRoutes = { path: '*path', method: RequestMethod.ALL };

    consumer.apply(TracingHeaderMiddleware).forRoutes(allRoutes);
    consumer
      .apply(BearerTokenMiddleware)
      .exclude({
        path: 'uploads/avatars/:fileName',
        method: RequestMethod.GET,
      })
      .forRoutes(allRoutes);
  }
}
