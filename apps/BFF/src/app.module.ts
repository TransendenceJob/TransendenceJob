import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LobbyController } from "./lobby.controller"; 

@Module({
  imports: [],
  controllers: [AppController, LobbyController],
  providers: [AppService],
})
export class AppModule {}
