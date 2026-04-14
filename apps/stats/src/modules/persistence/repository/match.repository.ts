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

  async findPlayers(userIds: string[]) {
    return this.prisma.playerStats.findMany({
      where: {
        userId: { in: userIds },
      },
    });
  }
}
