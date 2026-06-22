import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ActiveSessionService } from '../auth/active-session.service';
import { AuthDirectoryService } from '../auth/auth-directory.service';
import { AccessTokenService } from '../auth/tokens/access-token.service';
import { BearerAuthGuard } from '../auth/bearer-auth.guard';
import { AppConfigModule } from '../config/config.module';
import { SocialController, UploadsController } from './social.controller';
import { SocialService } from './social.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [AppConfigModule, JwtModule],
  controllers: [SocialController, UploadsController],
  providers: [
    AccessTokenService,
    ActiveSessionService,
    AuthDirectoryService,
    BearerAuthGuard,
    SocialService,
    ChatGateway,
  ],
  exports: [SocialService],
})
export class SocialModule {}
