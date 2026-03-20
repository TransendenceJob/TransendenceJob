import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LobbyModule } from './lobby.module';

@Module({
  imports: [LobbyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
