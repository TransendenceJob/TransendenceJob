import { Module } from '@nestjs/common';
import { LobbyController } from './lobby.controller';

@Module({
  imports: [],
  controllers: [LobbyController],
  providers: [],
})
export class LobbyModule {}
