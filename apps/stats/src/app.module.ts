import { MiddlewareConsumer, Module } from '@nestjs/common';
import { PlayerStatsModule } from './modules/player-stats/player-stats.module.js';
import { MatchesModule } from './modules/matches/matches.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { RequestIdMiddleware } from './modules/common/middleware/request-id.middleware.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuditModule } from './modules/audit/audit.module.js';

@Module({
  imports: [PlayerStatsModule,
    MatchesModule,
    PrismaModule,
     HealthModule,
      AuditModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
      consumer.apply(RequestIdMiddleware).forRoutes('*'); // apply to ALL routes
    }
  
}
