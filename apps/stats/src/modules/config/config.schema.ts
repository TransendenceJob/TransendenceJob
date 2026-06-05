import { z } from 'zod';

export const ConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().min(1).max(65535), // Valid port number
  NODE_ENV: z.enum(['development', 'production', 'test']), // Environment must be one of these values
  DATABASE_URL: z.string().url(), // Valid URL for database connection
  // JWT_SECRET: z.string().min(32), // Minimum length for security
  // REDIS_PORT: z.coerce.number().int().positive().min(1).max(65535), // Valid Redis port
  RABBITMQ_PORT: z.coerce.number().int().positive().min(1).max(65535), // Valid RabbitMQ port
  RABBITMQ_HOST: z.string().nonempty(), // Non-empty string
  DB_PASSWORD: z.string().nonempty(), // Non-empty string
  DB_HOST: z.string().nonempty(), // Non-empty string
  DB_USER: z.string().nonempty(), // Non-empty string
  // GRAFANA_PORT: z.coerce.number().int().positive().min(1).max(65535), // Valid Grafana port
  // PROMETHEUS_PORT: z.coerce.number().int().positive().min(1).max(65535), // Valid Prometheus port
  // AUTH_GOOGLE_ID: z.string().optional(), // Optional Google Auth ID
  // AUTH_GOOGLE_SECRET: z.string().optional(), // Optional Google Auth Secret
  // AUTH_URL: z.string().url().optional(), // Optional URL
  // SERVICE_NAME: z.string().nonempty(), // Non-empty string
  // SERVICE_VERSION: z.string().regex(/^\d+\.\d+\.\d+$/), // Semantic versioning
});

// Do NOT parse at module load time. This prevents errors during module import.

