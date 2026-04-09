import { z } from 'zod';

const baseSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  AUTH_SERVICE_URL: z.string().url(),

  SERVICE_NAME: z.string().min(1).default('bff'),
});

export type ValidatedEnv = z.infer<typeof baseSchema>;

export function validateEnv(config: Record<string, unknown>): ValidatedEnv {
  const parsed = baseSchema.safeParse(config);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${errors}`);
  }

  return parsed.data;
}
