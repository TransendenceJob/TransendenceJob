import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/infra/prisma/prisma.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStatsDto } from 'src/modules/player-stats/dto/statsRegister.dto';

@Injectable()
export class PlayerStatsRepository {
  constructor(private prisma: PrismaService) {}

  /* create stats for the new user*/
  createStats(dto: CreateStatsDto) {
    return this.prisma.playerStats.create({
      data: {
        userId: Number(dto.userId),
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


  findByUserId(userId: number) {
    return this.prisma.playerStats.findUnique({
      where: { userId },
    });
  }
}
