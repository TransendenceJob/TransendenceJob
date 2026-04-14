import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchStatsRepository } from '../persistence/repository/match.repository';

@Module({
  controllers: [MatchesController],
  providers: [MatchesService, MatchStatsRepository],
})
export class MatchesModule {}
