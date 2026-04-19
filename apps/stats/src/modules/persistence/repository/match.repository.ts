import { Injectable, NotFoundException } from '@nestjs/common';
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
  /* Check if a match with the same participants already exists */
  async findDuplicateMatch(userIds: string[]) {
    const matches = await this.prisma.match.findMany({
      include: {
        matchParticipants: true,
      },
    });

    // Filter matches that have the same participant count
    const matchingByCount = matches.filter(
      (match) => match.matchParticipants.length === userIds.length,
    );

    // Check if any match has the exact same set of participants
    for (const match of matchingByCount) {
      const matchUserIds = match.matchParticipants.map((p) => p.userId).sort();
      const inputUserIds = userIds.sort();

      if (JSON.stringify(matchUserIds) === JSON.stringify(inputUserIds)) {
        return match;
      }
    }

    return null;
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
    return await this.prisma.match.findMany({
      include: {
        matchParticipants: true,
      },
    });
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
        ...(participantData?.isWinner !== undefined
          ? { isWinner: participantData.isWinner }
          : {}),
        ...(participantData?.kills !== undefined
          ? { kills: participantData.kills }
          : {}),
        ...(participantData?.deaths !== undefined
          ? { deaths: participantData.deaths }
          : {}),
      },
    });
  }

  /* Get match by ID */
  async getMatchById(matchId: string) {
    const findMatch = this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!findMatch)
      throw new NotFoundException(`math with ${matchId} not found`);
    return findMatch;
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

  // remove a match by Id
  async removeMatchById(matchId: string) {
    // First delete all participants of this match
    await this.prisma.matchParticipant.deleteMany({
      where: { matchId },
    });
    // Then delete the match
    return await this.prisma.match.delete({
      where: { id: matchId },
    });
  }
  // delete all match table
  async deleteAll() {
    await this.prisma.matchParticipant.deleteMany({});
    return await this.prisma.match.deleteMany({});
  }
}
