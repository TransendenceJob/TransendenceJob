import { z } from 'zod';

export const ConfigSchema = z.object({
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
});

export const config = ConfigSchema.parse(process.env);
