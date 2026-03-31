import { z } from 'zod';

const ttlRegex = /^\d+[smhd]$/;

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().int().min(1).max(65535),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().regex(ttlRegex, 'JWT_ACCESS_TTL must look like 15m, 1h, 7d'),
  JWT_REFRESH_TTL: z.string().regex(ttlRegex, 'JWT_REFRESH_TTL must look like 15m, 1h, 7d'),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),

  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).optional(),

  ARGON2_MEMORY_COST: z.coerce.number().int().positive().optional(),
  ARGON2_TIME_COST: z.coerce.number().int().positive().optional(),
  ARGON2_PARALLELISM: z.coerce.number().int().positive().optional(),

  SERVICE_NAME: z.string().min(1).default('auth-service'),
  SERVICE_VERSION: z.string().min(1).default('1.0.0'),
});

export type ValidatedEnv = z.infer<typeof baseSchema>;

export function validateEnv(config: Record<string, unknown>): ValidatedEnv {
  const parsed = baseSchema.superRefine((env, ctx) => {
    const hasBcrypt = env.BCRYPT_ROUNDS !== undefined;
    const hasArgon =
      env.ARGON2_MEMORY_COST !== undefined ||
      env.ARGON2_TIME_COST !== undefined ||
      env.ARGON2_PARALLELISM !== undefined;

    if (!hasBcrypt && !hasArgon) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BCRYPT_ROUNDS'],
        message:
          'Provide either BCRYPT_ROUNDS or the full ARGON2_* set.',
      });
    }

    if (hasArgon) {
      if (env.ARGON2_MEMORY_COST === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ARGON2_MEMORY_COST'],
          message: 'ARGON2_MEMORY_COST is required when using argon2.',
        });
      }
      if (env.ARGON2_TIME_COST === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ARGON2_TIME_COST'],
          message: 'ARGON2_TIME_COST is required when using argon2.',
        });
      }
      if (env.ARGON2_PARALLELISM === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ARGON2_PARALLELISM'],
          message: 'ARGON2_PARALLELISM is required when using argon2.',
        });
      }
    }
  }).safeParse(config);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${errors}`);
  }

  return parsed.data;
}