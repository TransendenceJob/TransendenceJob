import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { bffConfig } from './bff.config';

@Injectable()
export class BffConfigService {
  constructor(
    @Inject(bffConfig.KEY)
    private readonly config: ConfigType<typeof bffConfig>,
  ) {}

  get app() {
    return this.config.app;
  }

  get auth() {
    return this.config.auth;
  }
}
