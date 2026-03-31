/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { authConfig, type AuthConfig } from './auth.config';

@Injectable()
export class AuthConfigService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  get app(): AuthConfig['app'] {
    return this.config.app;
  }

  get db(): AuthConfig['db'] {
    return this.config.db;
  }

  get redis(): AuthConfig['redis'] {
    return this.config.redis;
  }

  get jwt(): AuthConfig['jwt'] {
    return this.config.jwt;
  }

  get google(): AuthConfig['google'] {
    return this.config.google;
  }

  get passwordHashing(): AuthConfig['passwordHashing'] {
    return this.config.passwordHashing;
  }

  get appPort(): number {
    return this.config.app.port;
  }
}
