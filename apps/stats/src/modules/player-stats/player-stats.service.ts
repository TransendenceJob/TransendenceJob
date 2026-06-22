import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlayerStatsRepository } from 'src/modules/persistence/repository/player-stats.repository';
import { CreateStatsDto } from './dto/statsRegister.dto';
import { UUID } from 'node:crypto';
import { UpdatePlayerDto } from './dto/updatePlayer.dto';
import { ErrorHandler } from '@nestjs/common/interfaces';

@Injectable()
export class PlayerStatsService {
  constructor(private repo: PlayerStatsRepository) {}

  async getAll() {
    return await this.repo.getAll();
  }

  async getStatsById(id: UUID) {
    const playerStats = await this.repo.getStatsById(id);
    if (!playerStats)
      throw new NotFoundException(`user with ${id} does not exit`);
    return playerStats;
  }

  async createStatsForUser(dto: CreateStatsDto) {
    return await this.repo.createStats(dto);
  }

  // update the stats of player
  async update(id: string, dto: UpdatePlayerDto) {
    const existing = await this.repo.getStatsById(id as any);

    // If the user doesn't exist in the stats database yet, create them first
    if (!existing) {
      await this.repo.createStats({
        userId: id,
        xp: dto.xp ?? 0,
        level: dto.level ?? 1,
        wins: dto.wins ?? 0,
        losses: dto.losses ?? 0,
        kills: dto.kills ?? 0,
        deaths: dto.deaths ?? 0,
      });
    }

    const updated = await this.repo.updateStats(id, dto);

    return updated;
  }

  /* get match history of a user */
  async getMatchHistory(id: UUID) {
    const playerStats = await this.repo.getStatsById(id);
    if (!playerStats)
      throw new NotFoundException(`user with ${id} does not exit`);

    return await this.repo.getMatchHistory(id);
  }
}
