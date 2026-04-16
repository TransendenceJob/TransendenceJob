import { BadRequestException, Injectable } from '@nestjs/common';
import { MatchStatsRepository } from '../persistence/repository/match.repository';
import { CreateMatchDto } from './dto/create.match.dto';
import { UpdateMatchDto } from './dto/update.match.dto';
import { UpdateMatchParticipantDto } from './dto/update.match.participant.dto';

@Injectable()
export class MatchesService {
  constructor(private repo: MatchStatsRepository) {}

  /* create a match */
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

  /* Get match by id */
  async getMatchById(matchId: string) {
    return await this.repo.getMatchById(matchId);
  }

  /* update a mathc */
  async updateMatch(matchId: string, dto: UpdateMatchDto) {
    return await this.repo.update(matchId, dto);
  }

  /* add aprticipant to a match */
  async addParticipant(
    matchId: string,
    userId: string,
    participantData?: UpdateMatchParticipantDto,
  ) {
    const player = await this.repo.findPlayers([userId]);
    if (player.length === 0) {
      throw new BadRequestException('User does not exist');
    }
    return await this.repo.addParticipant(matchId, userId, participantData);
  }

  /* update a participant */
  async updateParticipant(
    matchId: string,
    userId: string,
    dto: UpdateMatchParticipantDto,
  ) {
    return await this.repo.updateParticipant(matchId, userId, dto);
  }

  /* remove the participant from a mathc */
  async removeParticipant(matchId: string, userId: string) {
    return await this.repo.removeParticipant(matchId, userId);
  }

  /* get all matches */
  async getMatches() {
    return await this.repo.getMatches();
  }

  /* get participants from a match */
  async getParicipants(matchId: string) {
    return await this.repo.getMembers(matchId);
  }

  /* Remove a match by Id */
  async removeMatchById(id: string) {
    return await this.repo.removeMatchById(id);
  }
  /* DELETE ALL MATCHES : DANGERS */
  async deleteAll() {
    return await this.repo.deleteAll();
  }
}
