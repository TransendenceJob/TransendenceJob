import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAchievementDto } from 'src/modules/achivements/dto/create-achivement.dto';
import { UpdateAchievementDto } from 'src/modules/achivements/dto/update-achivement.dto';

@Injectable()
export class AchievementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAchievementDto) {
    return this.prisma.achievement.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        xpReward: dto.xpReward ?? 0,
        points: dto.points ?? 0,
        progress: dto.progress ?? 0,
        progressTarget: dto.progressTarget,
        achieved: dto.achieved ?? false,
        achievedAt: dto.achievedAt ? new Date(dto.achievedAt) : null,
        meta: dto.meta,
      },
    });
  }

  async findAll() {
    return this.prisma.achievement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.achievement.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateAchievementDto) {
    return this.prisma.achievement.update({
      where: { id },
      data: {
        userId: dto.userId,
        type: dto.type,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        xpReward: dto.xpReward,
        points: dto.points,
        progress: dto.progress,
        progressTarget: dto.progressTarget,
        achieved: dto.achieved,
        achievedAt: dto.achievedAt ? new Date(dto.achievedAt) : undefined,
        meta: dto.meta,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.achievement.delete({
      where: { id },
    });
  }

  async upsertByUserAndType(dto: CreateAchievementDto) {
    return this.prisma.achievement.upsert({
      where: {
        userId_type: {
          userId: dto.userId,
          type: dto.type,
        },
      },
      update: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        xpReward: dto.xpReward,
        points: dto.points,
        progress: dto.progress,
        progressTarget: dto.progressTarget,
        achieved: dto.achieved,
        achievedAt: dto.achievedAt ? new Date(dto.achievedAt) : undefined,
        meta: dto.meta,
      },
      create: {
        userId: dto.userId,
        type: dto.type,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        xpReward: dto.xpReward ?? 0,
        points: dto.points ?? 0,
        progress: dto.progress ?? 0,
        progressTarget: dto.progressTarget,
        achieved: dto.achieved ?? false,
        achievedAt: dto.achievedAt ? new Date(dto.achievedAt) : null,
        meta: dto.meta,
      },
    });
  }
}
