import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

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
