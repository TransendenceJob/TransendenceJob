import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
	imports: [TerminusModule],
	controllers: [HealthController]
})
export class HealthModule {}
