import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, type ConfigModuleOptions } from '@nestjs/config';
import { bffConfig } from './bff.config';
import { BffConfigService } from './bff-config.service';

type ConfigModuleStatic = {
  forRoot: (options?: ConfigModuleOptions) => DynamicModule;
};

const SafeConfigModule = ConfigModule as unknown as ConfigModuleStatic;

@Module({
  imports: [
    SafeConfigModule.forRoot({
      isGlobal: true,
      load: [bffConfig],
      expandVariables: true,
      cache: true,
    }),
  ],
  providers: [BffConfigService],
  exports: [BffConfigService],
})
export class AppConfigModule {}
