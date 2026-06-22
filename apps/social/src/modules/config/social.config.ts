import { registerAs, type ConfigType } from '@nestjs/config';
import { validateEnv } from './env.validation';

type SocialConfigShape = {
  app: {
    nodeEnv: string;
    port: number;
    serviceName: string;
    serviceVersion: string;
  };
  db: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    presenceTtlSeconds: number;
  };
  rabbitmq: {
    url: string;
    exchange: string;
  };
  jwt: {
    accessSecret: string;
    issuer: string;
    audience: string;
  };
  auth: {
    serviceUrl: string;
  };
  websocket: {
    sessionCheckIntervalSeconds: number;
  };
  uploads: {
    root: string;
    publicBasePath: string;
    avatarMaxBytes: number;
  };
};

export const socialConfig = registerAs<SocialConfigShape>(
  'social',
  (): SocialConfigShape => {
    const env = validateEnv(process.env);
    const dbUrl =
      env.DATABASE_URL ??
      `postgresql://${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(
        env.DB_PASSWORD,
      )}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?schema=public`;

    const encodedVhost =
      env.RABBITMQ_VHOST === '/'
        ? '%2F'
        : encodeURIComponent(env.RABBITMQ_VHOST);

    return {
      app: {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        serviceName: env.SERVICE_NAME,
        serviceVersion: env.SERVICE_VERSION,
      },
      db: {
        url: dbUrl,
      },
      redis: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        presenceTtlSeconds: env.PRESENCE_TTL_SECONDS,
      },
      rabbitmq: {
        url: `amqp://${encodeURIComponent(env.RABBITMQ_USER)}:${encodeURIComponent(
          env.RABBITMQ_PASSWORD,
        )}@${env.RABBITMQ_HOST}:${env.RABBITMQ_PORT}/${encodedVhost}`,
        exchange: 'social.events',
      },
      jwt: {
        accessSecret: env.JWT_ACCESS_SECRET,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      },
      auth: {
        serviceUrl: env.AUTH_SERVICE_URL.replace(/\/+$/, ''),
      },
      websocket: {
        sessionCheckIntervalSeconds:
          env.WEBSOCKET_SESSION_CHECK_INTERVAL_SECONDS,
      },
      uploads: {
        root: env.UPLOAD_ROOT,
        publicBasePath: env.PUBLIC_UPLOAD_BASE_PATH,
        avatarMaxBytes: env.AVATAR_MAX_BYTES,
      },
    };
  },
);

export type SocialConfig = ConfigType<typeof socialConfig>;
