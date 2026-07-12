import { createApp } from './app.js'
import { config } from './config/env.js'
import { logger } from './utils/logger.js'
import { prisma } from './lib/prisma.js'
import { redis } from './lib/redis.js'
import { ensureBuckets } from './lib/s3.js'
import { startCronJobs } from './lib/cron.js'

const app = createApp()

const server = app.listen(config.PORT, async () => {
  logger.info(`🚀 Waseet API on http://localhost:${config.PORT}  [${config.NODE_ENV}]`)
  // self-provision storage buckets + start scheduled jobs (best-effort)
  await ensureBuckets().catch((e) => logger.warn(`ensureBuckets: ${e.message}`))
  startCronJobs()
})

async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`)
  server.close(async () => {
    await prisma.$disconnect().catch(() => {})
    redis.disconnect()
    logger.info('bye 👋')
    process.exit(0)
  })
  // force-exit if it hangs
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', (err) => logger.error({ err }, 'unhandledRejection'))
