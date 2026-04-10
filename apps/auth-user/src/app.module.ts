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
import { AuthController } from './modules/auth/auth.controller';
import { AuthAdminController } from './modules/auth/auth-admin.controller';
import { RedisModule } from './modules/redis/redis.module';
import { AuthPersistenceModule } from './modules/persistence/auth-persistence.module';
import { UserAgentMiddleware } from './modules/common/middleware/user-agent.middleware';
import { UsersAuthModule } from './modules/users-auth/users-auth.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    HealthModule,

    PrismaModule,

    AppConfigModule,

    AuthPersistenceModule,
    UsersAuthModule,
    AuthModule,
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingHeaderMiddleware).forRoutes('*');

    consumer
      .apply(UserAgentMiddleware)
      .forRoutes(AuthController, AuthAdminController);

    consumer.apply(BearerTokenMiddleware).forRoutes({
      path: 'verify',
      method: RequestMethod.GET,
    });

    consumer.apply(BearerTokenMiddleware).forRoutes({
      path: 'users/:userId/disable',
      method: RequestMethod.POST,
    });

    consumer.apply(BearerTokenMiddleware).forRoutes({
      path: 'users/:userId/role',
      method: RequestMethod.POST,
    });

    consumer.apply(BearerTokenMiddleware).forRoutes({
      path: 'users/:userId/sessions/revoke',
      method: RequestMethod.POST,
    });

    consumer.apply(BearerTokenMiddleware).forRoutes({
      path: 'audit',
      method: RequestMethod.GET,
    });
  }
}
