import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { RabbitmqEventService } from './rabbitmq-event.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [RabbitmqEventService],
  exports: [RabbitmqEventService],
})
export class EventsModule {}
