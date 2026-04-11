import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Controller('health/db')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private prisma: PrismaService
	) {}

	@Get()
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
			}
		]);
	}
}

