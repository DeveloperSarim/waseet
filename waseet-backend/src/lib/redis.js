import Redis from 'ioredis'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
})

redis.on('connect', () => logger.info('✅ Redis connected'))
redis.on('error', (err) => logger.error({ err: err.message }, 'Redis error'))
