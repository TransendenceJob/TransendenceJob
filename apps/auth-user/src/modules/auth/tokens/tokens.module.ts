import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { AuthConfigService } from 'src/modules/config/auth-config.service';

@Module({
  imports: [
    JwtModule.registerAsync({
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
