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

  /**
   * Returns application configuration (nodeEnv, port, service name, version).
   * @returns Application config object
   */
  get app(): AuthConfig['app'] {
    return this.config.app;
  }

  /**
   * Returns database configuration (host, port, credentials, connection URL).
   * @returns Database config object
   */
  get db(): AuthConfig['db'] {
    return this.config.db;
  }

  /**
   * Returns Redis configuration (host, port).
   * @returns Redis config object
   */
  get redis(): AuthConfig['redis'] {
    return this.config.redis;
  }

  /**
   * Returns JWT configuration (secrets, TTLs, issuer, audience).
   * @returns JWT config object
   */
  get jwt(): AuthConfig['jwt'] {
    return this.config.jwt;
  }

  /**
   * Returns refresh token configuration (bytes, TTL, pepper).
   * @returns Refresh token config object
   */
  get refreshToken(): AuthConfig['refreshToken'] {
    return this.config.refreshToken;
  }

  /**
   * Returns Google OAuth configuration (client ID, secret, redirect URI).
   * @returns Google config object
   */
  get google(): AuthConfig['google'] {
    return this.config.google;
  }

  /**
   * Returns password hashing configuration (algorithm, rounds or memory/time params).
   * @returns Password hashing config object
   */
  get passwordHashing(): AuthConfig['passwordHashing'] {
    return this.config.passwordHashing;
  }

  /**
   * Returns the configured application port.
   * Convenience shortcut for app.port.
   * @returns Port number
   */
  get appPort(): number {
    return this.config.app.port;
  }
}
