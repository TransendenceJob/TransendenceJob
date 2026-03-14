import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';
import { LobbyManager } from './lobbies/LobbyManager'
import { EventsGateway } from './ws/events.gateway'

@Module({
  imports: [],
  controllers: [ServerController],
  providers: [LobbyManager, EventsGateway],
})
export class ServerModule {}


