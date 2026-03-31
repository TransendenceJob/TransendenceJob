import { Module } from '@nestjs/common';
import { TokensModule } from './tokens/tokens.module';
import { PasswordHashService } from './hashing/password-hash.service';

@Module({
  imports: [TokensModule],
  providers: [PasswordHashService],
  exports: [PasswordHashService, TokensModule],
})
export class AuthModule {}
