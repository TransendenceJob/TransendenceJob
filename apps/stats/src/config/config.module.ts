import { Module } from '@nestjs/common';
import { config } from './config.schema';
// import { config } from './config.js';?

@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useValue: config,
    },
  ],
  exports: ['APP_CONFIG'],
})
export class ConfigModule {}
