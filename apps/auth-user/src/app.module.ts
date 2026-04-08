import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TracingHeaderMiddleware } from './modules/common/middleware/tracing-header.middleware';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AppConfigModule } from './modules/config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthPersistenceModule } from './modules/persistence/auth-persistence.module';

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
  }
}
