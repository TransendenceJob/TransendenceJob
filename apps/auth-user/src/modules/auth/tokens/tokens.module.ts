import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/config.module';
import { AccessTokenService } from './access-token.service';
import { RefreshTokenService } from './refresh-token.service';
import { AuthPersistenceModule } from '../../persistence/auth-persistence.module';

// Keep JwtModule unconfigured here. AccessTokenService is the single place
// that provides secret/issuer/audience/ttl for sign and verify operations.
@Module({
  imports: [AppConfigModule, AuthPersistenceModule, JwtModule],
  providers: [AccessTokenService, RefreshTokenService],
  exports: [JwtModule, AccessTokenService, RefreshTokenService],
})
export class TokensModule {}
