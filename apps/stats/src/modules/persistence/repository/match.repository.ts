import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateMatchDto } from 'src/modules/matches/dto/create.match.dto';
import { UpdateMatchDto } from 'src/modules/matches/dto/update.match.dto';
import { UpdateMatchParticipantDto } from 'src/modules/matches/dto/update.match.participant.dto';

type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED';

@Injectable()
export class MatchStatsRepository {
  constructor(private prisma: PrismaService) {}

  private normalizeEndedAt(endedAt?: string | Date | null) {
    if (!endedAt) return undefined;
    return endedAt instanceof Date ? endedAt : new Date(endedAt);
  }

  async createMatch(
    dto: CreateMatchDto,
  ) {
    return this.prisma.match.create({
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
        ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
        ...(dto.mapName !== undefined ? { mapName: dto.mapName } : {}),
        ...(dto.score !== undefined ? { score: dto.score } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.endedAt ? { endedAt: this.normalizeEndedAt(dto.endedAt) } : {}),
        matchParticipants: {
          create: dto.participants.map((participant) => ({
            userId: participant.userId,
            ...(participant.displayName !== undefined
              ? { displayName: participant.displayName }
              : {}),
            ...(participant.avatarUrl !== undefined
              ? { avatarUrl: participant.avatarUrl }
              : {}),
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
        matchParticipants: {
          include: {
            player: true,
          },
        },
      },
    });
  }

  /* get all matches */
  async getMatches() {
    return await this.prisma.match.findMany({
      include: {
        matchParticipants: {
          include: {
            player: true,
          },
        },
      },
    });
  }

  // update match
  async update(matchId: string, dto: UpdateMatchDto) {
    return await this.prisma.match.update({
      where: { id: matchId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
        ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
        ...(dto.mapName !== undefined ? { mapName: dto.mapName } : {}),
        ...(dto.score !== undefined ? { score: dto.score } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.endedAt !== undefined
          ? { endedAt: this.normalizeEndedAt(dto.endedAt) }
          : {}),
      },
      include: {
        matchParticipants: {
          include: {
            player: true,
          },
        },
      },
    });
  }
  // add participant to match
  async addParticipant(
    matchId: string,
    userId: string,
    participantData?: UpdateMatchParticipantDto,
  ) {
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
        ...(participantData?.displayName !== undefined
          ? { displayName: participantData.displayName }
          : {}),
        ...(participantData?.avatarUrl !== undefined
          ? { avatarUrl: participantData.avatarUrl }
          : {}),
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
    const findMatch = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchParticipants: {
          include: {
            player: true,
          },
        },
      },
    });
    if (!findMatch)
      throw new NotFoundException(`math with ${matchId} not found`);
    return findMatch;
  }

  // update participant stats in match
  async updateParticipant(
    matchId: string,
    userId: string,
    dto: UpdateMatchParticipantDto,
  ) {
    return await this.prisma.matchParticipant.update({
      where: {
        matchId_userId: { matchId, userId },
      },
      data: {
        ...(dto.displayName !== undefined
          ? { displayName: dto.displayName }
          : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
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
