import { Module } from '@nestjs/common';
import { PlayerStatsController } from './player-stats.controller.js';
import { PlayerStatsService } from './player-stats.service.js';
import { PlayerStatsRepository } from './player-stats.repository.js';
// import { PlayerStatsController } from './player-stats.controller';
// import { PlayerStatsService } from './player-stats.service';
// import { PlayerStatsRepository } from './player-stats.repository';

@Module({
  controllers: [PlayerStatsController],
  providers: [PlayerStatsService, PlayerStatsRepository],
})
export class PlayerStatsModule {}
