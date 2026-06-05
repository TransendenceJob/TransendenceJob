import { Module } from '@nestjs/common';
import { WeaponsService } from './weapons.service';
import { WeaponsController } from './weapons.controller';

@Module({
  controllers: [WeaponsController],
  providers: [WeaponsService],
})
export class WeaponsModule {}
