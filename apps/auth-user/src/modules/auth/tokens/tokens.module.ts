import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { AuthConfigService } from '../../config/auth-config.service';
import { AppConfigModule } from '../../config/config.module';
import { AccessTokenService } from './access-token.service';
import { RefreshTokenService } from './refresh-token.service';
import { AuthPersistenceModule } from '../../persistence/auth-persistence.module';
import type { StringValue } from 'ms';

@Module({
  imports: [
    AppConfigModule,
    AuthPersistenceModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AuthConfigService],
      useFactory: (config: AuthConfigService) => {
        const jwt = config.jwt;
        return {
          secret: jwt.accessSecret,
          signOptions: {
            expiresIn: jwt.accessTtl as StringValue,
            issuer: jwt.issuer,
            audience: jwt.audience,
          },
        };
      },
    }),
  ],
  providers: [AccessTokenService, RefreshTokenService],
  exports: [JwtModule, AccessTokenService, RefreshTokenService],
})
export class TokensModule {}
