import { Router } from 'express'
import * as svc from './landing.service.js'

// Public (no auth) — serves the landing config to the SPA and a prerendered,
// SEO-complete HTML document to social/no-JS crawlers (routed here by nginx).
export const landingRouter = Router()

const reqOrigin = (req) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return host ? `${proto}://${host}` : ''
}

// Config for the client — same-origin relative image URLs.
landingRouter.get('/', async (req, res, next) => {
  try {
    res.json({ landing: await svc.getLandingConfig({ origin: '' }) })
  } catch (e) {
    next(e)
  }
})

// Crawler-facing prerendered HTML with full meta (absolute URLs for OG/Twitter).
landingRouter.get('/prerender', async (req, res, next) => {
  try {
    const html = await svc.renderPrerender({ origin: reqOrigin(req) })
    res.set('Content-Type', 'text/html; charset=utf-8')
    // short cache so link-preview edits show up quickly but repeat crawls are cheap
    res.set('Cache-Control', 'public, max-age=120')
    res.send(html)
  } catch (e) {
    next(e)
  }
})
