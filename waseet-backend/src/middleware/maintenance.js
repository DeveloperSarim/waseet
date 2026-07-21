import { isMaintenance, isMarketplaceMaintenance } from '../lib/settings.js'
import { redis } from '../lib/redis.js'
import { ApiError } from './error.js'

// Blocks gated routes (realtor/developer/marketplace data) while the platform is
// in maintenance mode. Admins always pass; auth (login) and admin routes are never
// mounted behind this guard, so logging in + the admin console keep working.
export async function maintenanceGuard(req, res, next) {
  try {
    if (req.user?.role === 'ADMIN') return next()
    if (await isMaintenance()) {
      throw new ApiError(503, 'The platform is under maintenance. Please try again shortly.', 'MAINTENANCE')
    }
    next()
  } catch (e) {
    next(e)
  }
}

// Blocks only the marketplace browsing endpoints while the marketplace is in
// maintenance (or the whole platform is). The rest of each portal stays online.
export async function marketplaceGuard(req, res, next) {
  try {
    if (req.user?.role === 'ADMIN') return next()
    if (await isMarketplaceMaintenance()) {
      throw new ApiError(503, 'The marketplace is under maintenance. Please try again shortly.', 'MARKETPLACE_MAINTENANCE')
    }
    next()
  } catch (e) {
    next(e)
  }
}

// Counts API requests per day in Redis (best-effort, fire-and-forget).
export function apiCounter(req, res, next) {
  const key = `api:calls:${new Date().toISOString().slice(0, 10)}`
  redis.multi().incr(key).expire(key, 60 * 60 * 48).exec().catch(() => {})
  next()
}
