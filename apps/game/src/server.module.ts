import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';
import { LobbyManager } from './lobbies/LobbyManager'

@Module({
  imports: [],
  controllers: [ServerController],
  providers: [LobbyManager],
})
export class ServerModule {}


