import { Module } from '@nestjs/common';
import { LobbyController } from './lobby.controller';
import { LobbyManager } from './LobbyManager'
import { EventsGateway } from '../ws/events.gateway'

@Module({
  imports: [],
  controllers: [LobbyController],
  providers: [LobbyManager, EventsGateway],
})
export class LobbyModule {}


