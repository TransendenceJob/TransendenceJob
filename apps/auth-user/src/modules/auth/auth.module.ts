import { Module } from '@nestjs/common';
import { TokensModule } from './tokens/tokens.module';
import { PasswordHashService } from './hashing/password-hash.service';
import { AppConfigModule } from '../config/config.module';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AuthRegisterService } from './services/auth-register.service';
import { AuthRefreshService } from './services/auth-refresh.service';
import { AuthRateLimitService } from './shared/auth-rate-limit.service';
import { AuthTokenIssueService } from './shared/auth-token-issue.service';
import { AuthSessionCacheService } from './shared/auth-session-cache.service';

@Module({
  imports: [AppConfigModule, TokensModule],
  controllers: [AuthController],
  providers: [
    PasswordHashService,
    AuthRateLimitService,
    AuthTokenIssueService,
    AuthSessionCacheService,
    AuthRegisterService,
    AuthRefreshService,
    AuthService,
  ],
  exports: [
    PasswordHashService,
    TokensModule,
    AuthRateLimitService,
    AuthTokenIssueService,
    AuthSessionCacheService,
    AuthService,
    AuthRegisterService,
    AuthRefreshService,
  ],
})
export class AuthModule {}
