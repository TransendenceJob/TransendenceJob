import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { SocialConfigService } from '../config/social-config.service';

@Injectable()
export class RabbitmqEventService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqEventService.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  constructor(private readonly config: SocialConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.rabbitmq.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(
        this.config.rabbitmq.exchange,
        'topic',
        {
          durable: true,
        },
      );
      this.logger.log('RabbitMQ connection ready');
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`RabbitMQ startup skipped: ${reason}`);
      this.channel = undefined;
      this.connection = undefined;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // Shutdown should not mask application termination.
    }
  }

  publish(routingKey: string, payload: Record<string, unknown>): void {
    if (!this.channel) {
      return;
    }

    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        emittedAt: new Date().toISOString(),
      }),
    );

    try {
      this.channel.publish(this.config.rabbitmq.exchange, routingKey, body, {
        contentType: 'application/json',
        persistent: true,
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`RabbitMQ publish skipped: ${reason}`);
    }
  }
}
