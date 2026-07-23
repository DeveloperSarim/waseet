import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import pinoHttp from 'pino-http'
import { config } from './config/env.js'
import { logger } from './utils/logger.js'
import { healthRouter } from './modules/health/health.routes.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { documentsRouter } from './modules/documents/documents.routes.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { realtorRouter } from './modules/realtor/realtor.routes.js'
import { developerRouter } from './modules/developer/developer.routes.js'
import { settingsRouter } from './modules/settings/settings.routes.js'
import { landingRouter } from './modules/landing/landing.routes.js'
import { geoRouter } from './modules/geo/geo.routes.js'
import { maintenanceGuard, apiCounter } from './middleware/maintenance.js'
import { requireAuth } from './middleware/auth.js'
import { isMaintenance, getSection } from './lib/settings.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/error.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1) // behind nginx/caddy on the VPS — correct req.ip

  // security + parsing
  app.use(helmet())
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }))

  // rate limit + per-day API counter on the API surface
  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }),
    apiCounter,
  )

  // routes
  app.get('/', (req, res) => res.json({ name: 'Waseet API', version: '0.1.0', health: '/health' }))
  app.use('/health', healthRouter)
  // public status (no auth) — used by the client to detect maintenance mode
  app.get('/api/v1/status', async (req, res) => {
    const buildInfo = (m) => ({
      message: m.message,
      startedAt: m.startedAt,
      etaMinutes: m.etaMinutes,
      expectedBack: m.startedAt ? new Date(new Date(m.startedAt).getTime() + (m.etaMinutes || 30) * 60000).toISOString() : null,
      items: m.items || [],
    })
    try {
      const [m, mp] = await Promise.all([getSection('maintenance'), getSection('marketplaceMaintenance')])
      res.json({
        maintenance: !!m.enabled,
        info: m.enabled ? buildInfo(m) : undefined,
        // full-platform maintenance implies the marketplace is down too
        marketplaceMaintenance: !!m.enabled || !!mp.enabled,
        marketplaceInfo: m.enabled ? buildInfo(m) : mp.enabled ? buildInfo(mp) : undefined,
      })
    } catch {
      res.json({ maintenance: false, marketplaceMaintenance: false })
    }
  })
  app.use('/api/v1/auth', authRouter)
  // public landing-page content + SEO prerender (no auth) — powers the homepage
  app.use('/api/v1/landing', landingRouter)
  // public Saudi geography reference data (city/area dropdowns)
  app.use('/api/v1/geo', geoRouter)
  app.use('/api/v1/documents', documentsRouter)
  app.use('/api/v1/admin/settings', settingsRouter)
  app.use('/api/v1/admin', adminRouter)
  // realtor/developer/marketplace data is gated behind maintenance mode (admins bypass)
  app.use('/api/v1/realtor', requireAuth, maintenanceGuard, realtorRouter)
  app.use('/api/v1/developer', requireAuth, maintenanceGuard, developerRouter)

  // ---- domain routes (agle steps me) ----
  // app.use('/api/v1/projects', projectsRouter)
  // app.use('/api/v1/leads', leadsRouter)
  // app.use('/api/v1/commissions', commissionsRouter)
  // ...

  app.use(notFound)
  app.use(errorHandler)
  return app
}
