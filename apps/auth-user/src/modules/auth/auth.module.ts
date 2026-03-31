import { Module } from '@nestjs/common';
import { TokensModule } from './tokens/tokens.module';
import { PasswordHashService } from './hashing/password-hash.service';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [AppConfigModule, TokensModule],
  providers: [PasswordHashService],
  exports: [PasswordHashService, TokensModule],
})
export class AuthModule {}
