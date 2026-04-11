import { Module } from '@nestjs/common';
import { ConfigSchema } from './config.schema';
// import { config } from './config.schema';
// import { config } from './config.js';?

@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useValue: ConfigSchema,
    },
  ],
  exports: ['APP_CONFIG'],
})
export class ConfigModule {}

/* this is a custome provider it can be applied in a service */