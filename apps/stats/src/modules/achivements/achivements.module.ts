import { Module } from '@nestjs/common';
import { AchievementsService } from './achivements.service';
import { AchievementsController } from './achivements.controller';
import { AchievementRepository } from '../persistence/repository/achievement.repository';

@Module({
	controllers: [AchievementsController],
	providers: [AchievementsService, AchievementRepository],
	exports: [AchievementsService],
})
export class AchievementsModule {}
