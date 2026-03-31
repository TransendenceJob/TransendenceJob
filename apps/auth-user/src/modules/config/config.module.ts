import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, type ConfigModuleOptions } from '@nestjs/config';
import { authConfig } from './auth.config';
import { AuthConfigService } from './auth-config.service';

type ConfigModuleStatic = {
  forRoot: (options?: ConfigModuleOptions) => DynamicModule;
};

const SafeConfigModule = ConfigModule as unknown as ConfigModuleStatic;

@Module({
  imports: [
    SafeConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
      expandVariables: true,
      cache: true,
    }),
  ],
  providers: [AuthConfigService],
  exports: [AuthConfigService],
})
export class AppConfigModule {}
