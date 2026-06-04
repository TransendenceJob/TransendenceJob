import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AppConfigModule } from '../config/config.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { UpdateProfileService } from './updateProfile.service';

@Module({
  imports: [AppConfigModule, AuthModule],
  controllers: [SocialController],
  providers: [SocialService, UpdateProfileService],
})
export class SocialModule {}
