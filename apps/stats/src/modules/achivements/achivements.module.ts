import { Module } from '@nestjs/common';
import { AchivementsService } from './achivements.service';
import { AchivementsController } from './achivements.controller';

@Module({
  controllers: [AchivementsController],
  providers: [AchivementsService],
})
export class AchivementsModule {}
