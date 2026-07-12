import cron from 'node-cron'
import { prisma } from './prisma.js'
import { logger } from '../utils/logger.js'

// Auto-lift expired bans: any SUSPENDED account whose bannedUntil has passed is
// reactivated. Runs hourly.
async function liftExpiredBans() {
  try {
    const res = await prisma.user.updateMany({
      where: { status: 'SUSPENDED', bannedUntil: { not: null, lte: new Date() } },
      data: { status: 'ACTIVE', bannedUntil: null },
    })
    if (res.count > 0) logger.info(`⏱️  Auto-reactivated ${res.count} account(s) with expired bans`)
  } catch (e) {
    logger.warn(`ban-expiry job failed: ${e.message}`)
  }
}

// Start all scheduled background jobs. Called once on server boot.
export function startCronJobs() {
  // every hour, on the hour
  cron.schedule('0 * * * *', liftExpiredBans)
  // also run once shortly after boot so restarts catch up immediately
  setTimeout(liftExpiredBans, 15_000).unref()
  logger.info('⏰ Cron jobs scheduled (ban-expiry hourly)')
}
