import { Module } from '@nestjs/common';
import { PlayerStatsModule } from './modules/player-stats/player-stats.module.js';
import { MatchesModule } from './modules/matches/matches.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { PlayerStatsModule } from './modules/player-stats/player-stats.module';
// import { MatchesModule } from './modules/matches/matches.module';

@Module({
  imports: [PlayerStatsModule, MatchesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
