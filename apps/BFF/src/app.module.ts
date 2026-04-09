import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LobbyModule } from './lobby.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppConfigModule } from './modules/config/config.module';

@Module({
  imports: [AppConfigModule, LobbyModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
