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
