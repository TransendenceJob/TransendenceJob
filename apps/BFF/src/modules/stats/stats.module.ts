import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module.js';
import { StatsController } from './stats.controller.js';
import { StatsService } from './stats.service.js';

@Module({
	imports: [AppConfigModule],
	controllers: [StatsController],
	providers: [StatsService],
})
export class StatsModule {}