/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { authConfig } from './auth.config';

@Injectable()
export class AuthConfigService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  get app() {
    return this.config.app;
  }

  get db() {
    return this.config.db;
  }

  get redis() {
    return this.config.redis;
  }

  get jwt() {
    return this.config.jwt;
  }

  get google() {
    return this.config.google;
  }

  get passwordHashing() {
    return this.config.passwordHashing;
  }
}
