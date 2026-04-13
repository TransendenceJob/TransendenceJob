import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PlayerStatsRepository } from 'src/modules/persistence/repository/player-stats.repository';
import { CreateStatsDto } from './dto/statsRegister.dto';
import { UUID } from 'node:crypto';
import { UpdatePlayerDto } from './dto/updatePlayer.dto';
import { ErrorHandler } from '@nestjs/common/interfaces';

@Injectable()
export class PlayerStatsService {
  constructor(private repo: PlayerStatsRepository) {}

  async getAll(){
    return await this.repo.getAll();
  }

  async getStatsById(id : UUID){
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

    const updatd =  await this.repo.updateStats(id, dto);
        if (!updatd)
          throw new NotFoundException(`user with ${id} does not exit`)
        return updatd;
    }

    

}