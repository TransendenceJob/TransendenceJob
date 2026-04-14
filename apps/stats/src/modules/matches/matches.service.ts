import { BadRequestException, Injectable } from '@nestjs/common';
import { MatchStatsRepository } from '../persistence/repository/match.repository';
import { CreateMatchDto } from './dto/create.match.dto';

@Injectable()
export class MatchesService {
  constructor(private repo: MatchStatsRepository) {}

  async createMatch(dto: CreateMatchDto) {
    const userIds = dto.participants.map((participant) => participant.userId);

    if (new Set(userIds).size !== userIds.length) {
      throw new BadRequestException('Duplicate participants are not allowed');
    }

    const players = await this.repo.findPlayers(userIds);
    if (players.length !== userIds.length) {
      throw new BadRequestException('One or more participants do not exist');
    }

    return this.repo.createMatch(dto.participants, dto.status, dto.duration);
  }
}
