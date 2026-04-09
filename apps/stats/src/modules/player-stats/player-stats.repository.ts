import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service.js';
// import { PrismaService } from 'src/infra/prisma/prisma.service.ts';

@Injectable()
export class PlayerStatsRepository {
  constructor(private prisma: PrismaService) {}

  createInitialStats(userId: number) {
    return this.prisma.playerStats.create({
      data: { userId },
    });
  }

  findByUserId(userId: number) {
    return this.prisma.playerStats.findUnique({
      where: { userId },
    });
  }
}
