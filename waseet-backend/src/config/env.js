import { z } from 'zod'

// Parse env booleans correctly — z.coerce.boolean() treats ANY non-empty string
// (incl. "false") as true, so we interpret the literal string instead.
const envBool = (def) =>
  z.preprocess((v) => {
    if (typeof v === 'boolean') return v
    if (v == null) return def
    return String(v).trim().toLowerCase() === 'true'
  }, z.boolean())

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET_PUBLIC: z.string().min(1),
  S3_BUCKET_PRIVATE: z.string().min(1),
  S3_FORCE_PATH_STYLE: envBool(true),

  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  ENCRYPTION_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  APP_URL: z.string().default('http://localhost:5173'),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: envBool(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().default('Waseet <no-reply@waseet.io>'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
export const isDev = config.NODE_ENV === 'development'
