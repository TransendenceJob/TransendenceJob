import { Module } from '@nestjs/common';
import { TokensModule } from './tokens/tokens.module';
import { PasswordHashService } from './hashing/password-hash.service';
import { AppConfigModule } from '../config/config.module';
import { UsersAuthModule } from '../users-auth/users-auth.module';
import { AuthController } from './auth.controller';
import { AuthAdminController } from './auth-admin.controller';
import { AuthService } from './services/auth.service';
import { AuthRegisterService } from './services/auth-register.service';
import { AuthRefreshService } from './services/auth-refresh.service';
import { AuthLogoutService } from './services/auth-logout.service';
import { AuthVerifyService } from './services/auth-verify.service';
import { AuthLoginService } from './services/auth-login.service';
import { AuthGoogleExchangeService } from './services/auth-google-exchange.service';
import { AuthAdminService } from './services/auth-admin.service';
import { AuthRateLimitService } from './shared/auth-rate-limit.service';
import { AuthTokenIssueService } from './shared/auth-token-issue.service';
import { AuthSessionCacheService } from './shared/auth-session-cache.service';

@Module({
  imports: [AppConfigModule, TokensModule, UsersAuthModule],
  controllers: [AuthController, AuthAdminController],
  providers: [
    PasswordHashService,
    AuthRateLimitService,
    AuthTokenIssueService,
    AuthSessionCacheService,
    AuthRegisterService,
    AuthRefreshService,
    AuthLogoutService,
    AuthVerifyService,
    AuthLoginService,
    AuthGoogleExchangeService,
    AuthAdminService,
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
    AuthLogoutService,
    AuthVerifyService,
    AuthLoginService,
    AuthGoogleExchangeService,
    AuthAdminService,
  ],
})
export class AuthModule {}
