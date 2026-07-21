import fs from 'node:fs/promises'
import path from 'node:path'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { prisma } from '../../lib/prisma.js'
import { redis } from '../../lib/redis.js'
import { s3, buckets } from '../../lib/s3.js'
import { sendMail } from '../../lib/mailer.js'
import { getAllSettings, getSection, setSection, DB_REGIONS } from '../../lib/settings.js'
import { ApiError } from '../../middleware/error.js'
import { logger } from '../../utils/logger.js'

const SERVER_START = Date.now()
const BACKUP_DIR = path.resolve(process.cwd(), 'backups')
const todayKey = () => `api:calls:${new Date().toISOString().slice(0, 10)}`

// ---- settings CRUD ------------------------------------------------------------
export async function getSettings() {
  const settings = await getAllSettings()
  return { settings, dbRegions: DB_REGIONS }
}

const SECTION_KEYS = ['commission', 'emails', 'security', 'platform', 'maintenance', 'marketplaceMaintenance']
export async function updateSection(section, patch) {
  if (!SECTION_KEYS.includes(section)) throw new ApiError(400, 'Unknown settings section', 'BAD_SECTION')
  if (section === 'maintenance' || section === 'marketplaceMaintenance') {
    const cur = await getSection(section)
    // stamp the start time when maintenance is switched ON; clear it when OFF
    if (patch.enabled === true && !cur.enabled) patch.startedAt = patch.startedAt || new Date().toISOString()
    if (patch.enabled === false) patch.startedAt = null
  }
  return setSection(section, patch)
}

// ---- commission overrides -----------------------------------------------------
export async function addOverride(adminId, { developerId, name, pct }) {
  const p = Number(pct)
  if (!Number.isFinite(p) || p < 0 || p > 100) throw new ApiError(400, 'Override must be 0–100%', 'BAD_PCT')
  let devName = name
  if (developerId) {
    const dev = await prisma.user.findUnique({ where: { id: developerId } })
    if (dev) devName = dev.companyName || dev.fullName
  }
  if (!devName) throw new ApiError(400, 'Developer is required', 'BAD_INPUT')
  const cur = await getSection('commission')
  const overrides = (cur.overrides || []).filter((o) => o.name !== devName && (!developerId || o.developerId !== developerId))
  overrides.push({ developerId: developerId || null, name: devName, pct: p, since: new Date().toISOString() })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'settings.add_override', entity: 'Setting', meta: { name: devName, pct: p } } })
  return setSection('commission', { overrides })
}

export async function removeOverride(adminId, name) {
  const cur = await getSection('commission')
  const overrides = (cur.overrides || []).filter((o) => o.name !== name)
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'settings.remove_override', entity: 'Setting', meta: { name } } })
  return setSection('commission', { overrides })
}

export async function resetOverrides(adminId) {
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'settings.reset_overrides', entity: 'Setting' } })
  return setSection('commission', { overrides: [] })
}

// developers list for the override picker
export async function listDevelopers() {
  const devs = await prisma.user.findMany({ where: { role: 'DEVELOPER' }, select: { id: true, fullName: true, companyName: true }, orderBy: { createdAt: 'desc' }, take: 200 })
  return devs.map((d) => ({ id: d.id, name: d.companyName || d.fullName }))
}

// ---- live platform stats ------------------------------------------------------
async function bucketSize(bucket) {
  let total = 0
  let token
  try {
    do {
      const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }))
      for (const o of res.Contents || []) total += o.Size || 0
      token = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (token)
  } catch { /* bucket may be empty/unavailable */ }
  return total
}

const fmtBytes = (b) => {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(0)} KB`
  return `${b} B`
}
const fmtUptime = (sec) => {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60)
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  return `${m}m`
}

export async function getStats() {
  const [platform, apiCallsRaw, pubSize, privSize, lastBackup, counts] = await Promise.all([
    getSection('platform'),
    redis.get(todayKey()).catch(() => '0'),
    bucketSize(buckets.public),
    bucketSize(buckets.private),
    prisma.backup.findFirst({ orderBy: { createdAt: 'desc' } }),
    Promise.all([prisma.user.count(), prisma.project.count(), prisma.lead.count(), prisma.commission.count()]),
  ])
  const usedBytes = pubSize + privSize
  const quotaGb = platform.storageQuotaGb || 100
  const uptimeSec = Math.floor((Date.now() - SERVER_START) / 1000)
  return {
    platformName: platform.name,
    environment: platform.environment,
    version: platform.version,
    dbRegion: platform.dbRegion,
    storage: { usedBytes, used: fmtBytes(usedBytes), quotaGb, usedPct: Math.min(100, (usedBytes / (quotaGb * 1e9)) * 100) },
    apiCallsToday: Number(apiCallsRaw || 0),
    uptime: fmtUptime(uptimeSec),
    uptimeSeconds: uptimeSec,
    lastBackup: lastBackup ? lastBackup.createdAt : null,
    dbCounts: { users: counts[0], projects: counts[1], leads: counts[2], commissions: counts[3] },
  }
}

// ---- test email ---------------------------------------------------------------
export async function sendTestEmail(adminId, to) {
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new ApiError(400, 'Enter a valid email', 'BAD_EMAIL')
  try {
    await sendMail({ to, subject: 'Waseet — test email', text: 'This is a test email from your Waseet platform settings. If you received this, SMTP is working.', html: '<p>This is a <b>test email</b> from your Waseet platform settings.</p><p>If you received this, SMTP is working. ✅</p>' })
  } catch (e) {
    logger.warn({ err: e?.message }, 'test email failed')
    throw new ApiError(502, 'Test email could not be sent — check SMTP settings', 'EMAIL_FAILED')
  }
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'settings.test_email', entity: 'Setting', meta: { to } } })
  return { ok: true, to }
}

// ---- backups (JSON snapshot on disk) ------------------------------------------
const BACKUP_TABLES = ['user', 'project', 'savedProject', 'lead', 'commission', 'withdrawal', 'document', 'notification', 'setting']

export async function createBackup(adminId, note) {
  await fs.mkdir(BACKUP_DIR, { recursive: true })
  const data = {}
  const counts = {}
  for (const t of BACKUP_TABLES) {
    const rows = await prisma[t].findMany()
    data[t] = rows
    counts[t] = rows.length
  }
  const payload = { meta: { createdAt: new Date().toISOString(), version: 1 }, counts, data }
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const json = JSON.stringify(payload)
  await fs.writeFile(path.join(BACKUP_DIR, filename), json)
  const rec = await prisma.backup.create({ data: { filename, sizeBytes: Buffer.byteLength(json), counts, note: note || null } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'settings.create_backup', entity: 'Backup', entityId: rec.id } })
  return { id: rec.id, filename: rec.filename, sizeBytes: rec.sizeBytes, counts, createdAt: rec.createdAt }
}

export async function listBackups() {
  const rows = await prisma.backup.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  return rows.map((b) => ({ id: b.id, filename: b.filename, sizeBytes: b.sizeBytes, counts: b.counts, note: b.note, createdAt: b.createdAt }))
}

export async function getBackupPath(id) {
  const b = await prisma.backup.findUnique({ where: { id } })
  if (!b) throw new ApiError(404, 'Backup not found', 'NOT_FOUND')
  return { path: path.join(BACKUP_DIR, b.filename), filename: b.filename }
}

export async function deleteBackup(adminId, id) {
  const b = await prisma.backup.findUnique({ where: { id } })
  if (!b) throw new ApiError(404, 'Backup not found', 'NOT_FOUND')
  await fs.unlink(path.join(BACKUP_DIR, b.filename)).catch(() => {})
  await prisma.backup.delete({ where: { id } })
  return { id, deleted: true }
}

// Restore replaces the domain tables with the backup snapshot (admins preserved).
export async function restoreBackup(adminId, id) {
  const b = await prisma.backup.findUnique({ where: { id } })
  if (!b) throw new ApiError(404, 'Backup not found', 'NOT_FOUND')
  const raw = await fs.readFile(path.join(BACKUP_DIR, b.filename), 'utf8').catch(() => null)
  if (!raw) throw new ApiError(404, 'Backup file is missing on disk', 'NO_FILE')
  const { data } = JSON.parse(raw)

  const keep = (arr) => (Array.isArray(arr) ? arr : [])
  await prisma.$transaction(async (tx) => {
    // clear domain data (order respects FKs)
    await tx.withdrawal.deleteMany({})
    await tx.commission.deleteMany({})
    await tx.lead.deleteMany({})
    await tx.savedProject.deleteMany({})
    await tx.notification.deleteMany({})
    await tx.document.deleteMany({})
    await tx.project.deleteMany({})
    // remove non-admin users not present in the backup? Simpler: delete all non-admin users, then re-insert from backup
    await tx.user.deleteMany({ where: { role: { not: 'ADMIN' } } })

    // re-insert users (skip admins already present)
    for (const u of keep(data.user)) {
      if (u.role === 'ADMIN') { await tx.user.upsert({ where: { id: u.id }, update: {}, create: u }); continue }
      await tx.user.create({ data: u })
    }
    for (const p of keep(data.project)) await tx.project.create({ data: p })
    for (const s of keep(data.savedProject)) await tx.savedProject.create({ data: s })
    for (const l of keep(data.lead)) await tx.lead.create({ data: l })
    for (const c of keep(data.commission)) await tx.commission.create({ data: c })
    for (const w of keep(data.withdrawal)) await tx.withdrawal.create({ data: w })
    for (const d of keep(data.document)) await tx.document.create({ data: d })
    for (const n of keep(data.notification)) await tx.notification.create({ data: n })
  }, { timeout: 30000 })

  await prisma.auditLog.create({ data: { actorId: adminId, action: 'settings.restore_backup', entity: 'Backup', entityId: id } })
  return { ok: true, restoredFrom: b.filename }
}

// ---- danger zone: export everything as a downloadable snapshot -----------------
export async function exportAll() {
  const data = {}
  for (const t of BACKUP_TABLES) data[t] = await prisma[t].findMany()
  return { meta: { exportedAt: new Date().toISOString() }, data }
}
