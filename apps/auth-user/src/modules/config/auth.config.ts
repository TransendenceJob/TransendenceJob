import { registerAs, type ConfigType } from '@nestjs/config';
import { validateEnv } from './env.validation';

type PasswordHashingConfig =
  | {
      algorithm: 'bcrypt';
      bcryptRounds: number;
    }
  | {
      algorithm: 'argon2';
      memoryCost: number;
      timeCost: number;
      parallelism: number;
    };

type AuthConfigShape = {
  app: {
    nodeEnv: string;
    port: number;
    serviceName: string;
    serviceVersion: string;
  };
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    url: string;
  };
  redis: {
    host: string;
    port: number;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
    issuer: string;
    audience: string;
  };
  refreshToken: {
    bytes: number;
    ttl: string;
    hashPepper: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  passwordHashing: PasswordHashingConfig;
};

export const authConfig = registerAs<AuthConfigShape>(
  'auth',
  (): AuthConfigShape => {
    const env = validateEnv(process.env);

    const databaseUrl = `postgresql://${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(
      env.DB_PASSWORD,
    )}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?schema=public`;

    return {
      app: {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        serviceName: env.SERVICE_NAME,
        serviceVersion: env.SERVICE_VERSION,
      },
      db: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        name: env.DB_NAME,
        url: databaseUrl,
      },
      redis: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
      },
      jwt: {
        accessSecret: env.JWT_ACCESS_SECRET,
        refreshSecret: env.JWT_REFRESH_SECRET,
        accessTtl: env.JWT_ACCESS_TTL,
        refreshTtl: env.JWT_REFRESH_TTL,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      },
      refreshToken: {
        bytes: env.REFRESH_TOKEN_BYTES,
        ttl: env.REFRESH_TOKEN_TTL,
        hashPepper: env.REFRESH_TOKEN_HASH_PEPPER,
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        redirectUri: env.GOOGLE_REDIRECT_URI,
      },
      passwordHashing: env.BCRYPT_ROUNDS
        ? {
            algorithm: 'bcrypt',
            bcryptRounds: env.BCRYPT_ROUNDS,
          }
        : {
            algorithm: 'argon2',
            memoryCost: env.ARGON2_MEMORY_COST!,
            timeCost: env.ARGON2_TIME_COST!,
            parallelism: env.ARGON2_PARALLELISM!,
          },
    };
  },
);

export type AuthConfig = ConfigType<typeof authConfig>;
