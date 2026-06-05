import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { socialConfig } from './social.config';

@Injectable()
export class SocialConfigService {
  constructor(
    @Inject(socialConfig.KEY)
    private readonly config: ConfigType<typeof socialConfig>,
  ) {}

  get app() {
    return this.config.app;
  }

  get appPort() {
    return this.config.app.port;
  }

  get db() {
    return this.config.db;
  }

  get redis() {
    return this.config.redis;
  }

  get rabbitmq() {
    return this.config.rabbitmq;
  }

  get jwt() {
    return this.config.jwt;
  }

  get auth() {
    return this.config.auth;
  }

  get websocket() {
    return this.config.websocket;
  }

  get uploads() {
    return this.config.uploads;
  }
}
