import { Module } from '@nestjs/common';
import { LobbyController } from './lobby.controller';
import { LobbyManager } from './LobbyManager';
import { EventSocket } from '../ws/event.socket';

@Module({
  imports: [],
  controllers: [LobbyController],
  providers: [LobbyManager, EventSocket],
})
export class LobbyModule {}
