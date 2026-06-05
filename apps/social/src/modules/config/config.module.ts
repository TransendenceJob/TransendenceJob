import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, type ConfigModuleOptions } from '@nestjs/config';
import { socialConfig } from './social.config';
import { SocialConfigService } from './social-config.service';

type ConfigModuleStatic = {
  forRoot: (options?: ConfigModuleOptions) => DynamicModule;
};

const SafeConfigModule = ConfigModule as unknown as ConfigModuleStatic;

@Module({
  imports: [
    SafeConfigModule.forRoot({
      isGlobal: true,
      load: [socialConfig],
      expandVariables: true,
      cache: true,
    }),
  ],
  providers: [SocialConfigService],
  exports: [SocialConfigService],
})
export class AppConfigModule {}
