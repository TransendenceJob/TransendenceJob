import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
  ) {}

  @Get()
  checkStatus() {
    return { status: 'ok' };
  }

  @Get('db')
  @HealthCheck()
  async check() {
    return this.health.check([
      async () => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { prismadb: { status: 'up' } };
        } catch (error) {
          throw new Error('Prisma connection failed');
        }
      },
    ]);
  }
}
