import { prisma } from './prisma.js'
import { config } from '../config/env.js'

// Default values for each settings section. Stored per-key in the `settings` table;
// getSection merges the stored value over these defaults so new keys appear safely.
export const SETTINGS_DEFAULTS = {
  commission: {
    defaultPct: 15, // platform takes % of developer commission
    overrides: [], // [{ developerId, name, pct, since }]
  },
  emails: {
    from: config.SMTP_FROM || 'noreply@waseet.io',
    support: 'support@waseet.io',
    admin: 'admin@waseet.io',
    backup: 'backup@waseet.io',
  },
  security: {
    maxFailedLogins: 5,
    lockoutMinutes: 30,
    sessionTimeoutHours: 24,
    require2fa: true,
    phoneRevealLogging: true,
  },
  platform: {
    name: 'Waseet',
    environment: config.NODE_ENV === 'production' ? 'Production' : 'Development',
    version: '1.0.0',
    dbRegion: 'Bahrain (Middle East)',
    storageQuotaGb: 100,
  },
  maintenance: {
    enabled: false,
    message: "We're performing scheduled maintenance to improve your experience. The platform will be back shortly.",
    etaMinutes: 30,
    startedAt: null,
    items: [
      { label: 'Database performance optimizations', status: 'done' },
      { label: 'New commission tracking features', status: 'active' },
      { label: 'Improved notification system', status: 'pending' },
      { label: 'Final testing and verification', status: 'pending' },
    ],
  },
}

export const DB_REGIONS = [
  'Bahrain (Middle East)',
  'UAE (Dubai)',
  'Saudi Arabia (Riyadh)',
  'Europe (Frankfurt)',
  'US East (Virginia)',
  'Asia (Singapore)',
  'Local / Docker',
]

export async function getSection(key) {
  const row = await prisma.setting.findUnique({ where: { key } })
  return { ...(SETTINGS_DEFAULTS[key] || {}), ...(row?.value || {}) }
}

export async function getAllSettings() {
  const out = {}
  for (const key of Object.keys(SETTINGS_DEFAULTS)) out[key] = await getSection(key)
  return out
}

export async function setSection(key, patch) {
  const current = await getSection(key)
  const value = { ...current, ...patch }
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
  return value
}

// convenience: is the platform currently in maintenance mode?
export async function isMaintenance() {
  const m = await getSection('maintenance')
  return !!m.enabled
}
