import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [AppConfigModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleAuthService],
  exports: [AuthService],
})
export class AuthModule {}
