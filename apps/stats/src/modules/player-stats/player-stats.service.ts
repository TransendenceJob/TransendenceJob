import { Injectable } from '@nestjs/common';
import { PlayerStatsRepository } from 'src/modules/persistence/repository/player-stats.repository';
import { CreateStatsDto } from './dto/statsRegister.dto';
// import { PlayerStatsRepository } from './player-stats.repository.js';
// import { PlayerStatsRepository } from './player-stats.repository';

@Injectable()
export class PlayerStatsService {
  constructor(private repo: PlayerStatsRepository) {}

  async createStatsForUser(createStatsDto: CreateStatsDto) {
    return this.repo.createStats(createStatsDto);
  }

  async getStats(userId: number) {
    return this.repo.findByUserId(userId);
  }
}
