import { z } from 'zod';

const ttlRegex = /^\d+[smhd]$/;

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DATABASE_URL: z.string().min(1).optional(),

  REDIS_HOST: z.string().min(1).default('redis'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

  RABBITMQ_HOST: z.string().min(1).default('rabbitmq'),
  RABBITMQ_PORT: z.coerce.number().int().min(1).max(65535).default(5672),
  RABBITMQ_USER: z.string().default('guest'),
  RABBITMQ_PASSWORD: z.string().default('guest'),
  RABBITMQ_VHOST: z.string().default('/'),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().min(1).default('auth-service'),
  JWT_AUDIENCE: z.string().min(1).default('transcendence-internal'),
  AUTH_SERVICE_URL: z.string().url().default('http://auth_service:3000'),

  SERVICE_NAME: z.string().min(1).default('social-service'),
  SERVICE_VERSION: z.string().min(1).default('1.0.0'),
  UPLOAD_ROOT: z.string().min(1).default('/app/uploads'),
  PUBLIC_UPLOAD_BASE_PATH: z.string().min(1).default('/api/uploads'),
  AVATAR_MAX_BYTES: z.coerce.number().int().positive().default(2_000_000),
  PRESENCE_TTL_SECONDS: z.coerce.number().int().positive().default(75),
  WEBSOCKET_SESSION_CHECK_INTERVAL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60),
  JWT_ACCESS_TTL: z.string().regex(ttlRegex).default('15m'),
});

export type ValidatedEnv = z.infer<typeof schema>;

export function validateEnv(config: Record<string, unknown>): ValidatedEnv {
  const parsed = schema.safeParse(config);
  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${errors}`);
  }

  return parsed.data;
}
