import { MiddlewareConsumer, Module } from '@nestjs/common';
import { PlayerStatsModule } from './modules/player-stats/player-stats.module.js';
import { MatchesModule } from './modules/matches/matches.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { RequestIdMiddleware } from './modules/common/middleware/request-id.middleware.js';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { PlayerStatsModule } from './modules/player-stats/player-stats.module';
// import { MatchesModule } from './modules/matches/matches.module';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [PlayerStatsModule, MatchesModule,PrismaModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
      consumer.apply(RequestIdMiddleware).forRoutes('*'); // apply to ALL routes
    }
  
}
