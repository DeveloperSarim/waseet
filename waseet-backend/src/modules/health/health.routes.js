import { Router } from 'express'
import { HeadBucketCommand } from '@aws-sdk/client-s3'
import { prisma } from '../../lib/prisma.js'
import { redis } from '../../lib/redis.js'
import { s3, buckets } from '../../lib/s3.js'

export const healthRouter = Router()

// GET /health — liveness + dependency checks (DB, Redis, S3)
healthRouter.get('/', async (req, res) => {
  const checks = {}

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'up'
  } catch {
    checks.database = 'down'
  }

  try {
    checks.redis = (await redis.ping()) === 'PONG' ? 'up' : 'down'
  } catch {
    checks.redis = 'down'
  }

  try {
    await s3.send(new HeadBucketCommand({ Bucket: buckets.private }))
    checks.storage = 'up'
  } catch {
    checks.storage = 'down'
  }

  const ok = Object.values(checks).every((v) => v === 'up')
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    uptime: Math.round(process.uptime()),
    checks,
  })
})
