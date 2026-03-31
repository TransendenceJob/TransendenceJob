import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { AuthConfigService } from '../../config/auth-config.service';
import { AppConfigModule } from '../../config/config.module';

@Module({
  imports: [
    AppConfigModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AuthConfigService],
      useFactory: (config: AuthConfigService) => {
        const jwt = config.jwt!;
        return {
          secret: jwt.accessSecret,
          signOptions: {
            expiresIn:
              typeof jwt.accessTtl === 'string'
                ? Number(jwt.accessTtl)
                : jwt.accessTtl,
          },
        };
      },
    }),
  ],
  exports: [JwtModule],
})
export class TokensModule {}
