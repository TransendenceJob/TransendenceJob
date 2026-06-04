import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/infra/prisma/prisma.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStatsDto } from 'src/modules/player-stats/dto/statsRegister.dto';
import { UUID } from 'node:crypto';
import { UpdatePlayerDto } from 'src/modules/player-stats/dto/updatePlayer.dto';

@Injectable()
export class PlayerStatsRepository {
  constructor(private prisma: PrismaService) {}

  /* get all */
  async getAll() {
    return this.prisma.playerStats.findMany();
  }

  async getStatsById(id: UUID) {
    return this.prisma.playerStats.findUnique({
      where: { userId: id },
      include: {
        matchHistory: {
          include: {
            match: true,
          },
        },
        weapons: true,
        achievements: true,
      },
    });
  }

  /* get match history */
  async getMatchHistory(userId: UUID) {
    const userIdStr = userId as string;
    const matchParticipants = await this.prisma.matchParticipant.findMany({
  where: {
    userId: userIdStr,
  },
  select: {
    userId: true,
    displayName: true,
    avatarUrl: true,
    isWinner: true,
    kills: true,
    deaths: true,

    match: {
      select: {
        id: true,
        status: true,
        duration: true,
        createdAt: true,
        endedAt: true,
        mode: true,
        mapName: true,
        score: true,
        summary: true,

        matchParticipants: {
          select: {
            userId: true,
            displayName: true,
            avatarUrl: true,
            isWinner: true,
            kills: true,
            deaths: true,
          },
        },
      },
    },
  },
  orderBy: {
    match: {
      createdAt: 'desc',
    },
  },
});

    return matchParticipants.map((mp) => ({
      id: mp.match.id,
      status: mp.match.status,
      duration: mp.match.duration,
      createdAt: mp.match.createdAt,
      endedAt: mp.match.endedAt,
      mode: mp.match.mode,
      mapName: mp.match.mapName,
      score: mp.match.score,
      summary: mp.match.summary,
      player: {
        userId: mp.userId,
        displayName: mp.displayName,
        //// prefer the participant-level avatar if present, otherwise fall back to the current player avatar
        //avatarUrl: mp.avatarUrl ?? mp.player?.avatarUrl ?? null,
        isWinner: mp.isWinner,
        kills: mp.kills,
        deaths: mp.deaths,
      },
      participants: mp.match.matchParticipants.map((p) => ({
		userId: p.userId,
		displayName: p.displayName,
		avatarUrl: p.avatarUrl,
		isWinner: p.isWinner,
		kills: p.kills,
		deaths: p.deaths,
		})),
    }));
  }

  /* create stats for the new user*/
  async createStats(dto: CreateStatsDto) {
    return this.prisma.playerStats.create({
      data: {
        userId: dto.userId,
        xp: dto.xp ?? 0,
        level: dto.level ?? 1,
        wins: dto.wins ?? 0,
        losses: dto.losses ?? 0,
        kills: dto.kills ?? 0,
        deaths: dto.deaths ?? 0,
        damageDealt: dto.damageDealt ?? 0,
        damageTaken: dto.damageTaken ?? 0,
      },
    });
  }

  async findByUserId(_id: string) {
    return await this.prisma.playerStats.findUnique({
      where: { id: _id },
    });
  }

  async updateStats(_id: string, dto: UpdatePlayerDto) {
    const { userId: _, ...data } = dto as any;

    return this.prisma.playerStats.update({
      where: { userId: _id },
      data,
    });
  }
}
