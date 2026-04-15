import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateMatchParticipantDto } from 'src/modules/matches/dto/create.match.dto';

type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED';

@Injectable()
export class MatchStatsRepository {
  constructor(private prisma: PrismaService) {}

  async createMatch(
    participants: CreateMatchParticipantDto[],
    status?: MatchStatus,
    duration?: number,
  ) {
    return this.prisma.match.create({
      data: {
        ...(status ? { status } : {}),
        ...(duration !== undefined ? { duration } : {}),
        matchParticipants: {
          create: participants.map((participant) => ({
            userId: participant.userId,
            ...(participant.isWinner !== undefined
              ? { isWinner: participant.isWinner }
              : {}),
            ...(participant.kills !== undefined
              ? { kills: participant.kills }
              : {}),
            ...(participant.deaths !== undefined
              ? { deaths: participant.deaths }
              : {}),
          })),
        },
      },
      include: {
        matchParticipants: true,
      },
    });
  }
  /* find a user by id=> upload user first time to profile */
  async findPlayers(userIds: string[]) {
    return this.prisma.playerStats.findMany({
      where: {
        userId: { in: userIds },
      },
    });
  }

  // from match just get the participants
  async getMembers(matchId: string) {
    return await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchParticipants: true,
      },
    });
  }

  /* get all matches */
  async getMatches() {
    return await this.prisma.match.findMany({});
  }

  // update match
  async update(matchId: string, dto: any) {
    return await this.prisma.match.update({
      where: { id: matchId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      },
      include: {
        matchParticipants: true,
      },
    });
  }
  // add participant to match
  async addParticipant(matchId: string, userId: string, participantData?: any) {
    const existingParticipant = await this.prisma.matchParticipant.findUnique({
      where: {
        matchId_userId: { matchId, userId },
      },
    });

    if (existingParticipant) {
      throw new Error('Participant already exists in this match');
    }

    return await this.prisma.matchParticipant.create({
      data: {
        matchId,
        userId,
        ...(participantData?.isWinner !== undefined ? { isWinner: participantData.isWinner } : {}),
        ...(participantData?.kills !== undefined ? { kills: participantData.kills } : {}),
        ...(participantData?.deaths !== undefined ? { deaths: participantData.deaths } : {}),
      },
    });
  }

  // update participant stats in match
  async updateParticipant(matchId: string, userId: string, dto: any) {
    return await this.prisma.matchParticipant.update({
      where: {
        matchId_userId: { matchId, userId },
      },
      data: {
        ...(dto.isWinner !== undefined ? { isWinner: dto.isWinner } : {}),
        ...(dto.kills !== undefined ? { kills: dto.kills } : {}),
        ...(dto.deaths !== undefined ? { deaths: dto.deaths } : {}),
      },
    });
  }

  // remove participant from match
  async removeParticipant(matchId: string, userId: string) {
    return await this.prisma.matchParticipant.delete({
      where: {
        matchId_userId: { matchId, userId },
      },
    });
  }

  // delete all match table
  async deleteAll() {
    await this.prisma.matchParticipant.deleteMany({});
    return await this.prisma.match.deleteMany({});
  }
}
