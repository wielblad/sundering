import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),

  // JWT
  JWT_SECRET: z.string().default('punch-dev-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Database
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5433/punch'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6380'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
  },
  database: {
    url: parsed.data.DATABASE_URL,
  },
  redis: {
    url: parsed.data.REDIS_URL,
  },
  cors: {
    origin: parsed.data.CORS_ORIGIN,
  },
};
