import { Module } from '@nestjs/common';
import { LobbyModule } from './lobbies/lobby.module';
import { MainController } from './main.controller';

@Module({
  imports: [LobbyModule],
  controllers: [MainController],
  providers: [],
})
export class MainModule {}
