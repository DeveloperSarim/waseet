import crypto from 'node:crypto'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prisma } from '../../lib/prisma.js'
import { s3, buckets } from '../../lib/s3.js'
import { getSection } from '../../lib/settings.js'
import { ApiError } from '../../middleware/error.js'
import { imageUrl } from '../../lib/projectMedia.js'
import { raiseDispute, listMyDisputes } from '../../lib/disputes.js'
import { sendDealClosedEmail, sendCommissionPaidEmail, sendLeadStatusEmail } from '../../lib/mailer.js'
import { logger } from '../../utils/logger.js'

// ---- projects ----------------------------------------------------------------
// resolve any media keys inside the details blob into signed URLs for the client
const resolveDetails = async (details) => {
  if (!details || typeof details !== 'object') return details || {}
  const out = { ...details }
  if (Array.isArray(details.images)) out.images = await Promise.all(details.images.map(async (k) => ({ key: k, url: await imageUrl(k) })))
  if (details.masterPlanKey) out.masterPlanUrl = await imageUrl(details.masterPlanKey)
  if (details.documents && typeof details.documents === 'object') {
    out.documents = {}
    for (const [name, d] of Object.entries(details.documents)) {
      out.documents[name] = d ? { ...d, url: await imageUrl(d.key) } : null
    }
  }
  if (Array.isArray(details.floorPlans)) out.floorPlans = await Promise.all(details.floorPlans.map(async (f) => ({ ...f, url: await imageUrl(f.key) })))
  return out
}

const projectView = async (p) => ({
  id: p.id, title: p.title, city: p.city, country: p.country, type: p.type, bedrooms: p.bedrooms,
  priceFrom: p.priceFrom, priceTo: p.priceTo, commissionPct: p.commissionPct, status: p.status,
  location: p.location, mapLink: p.mapLink, description: p.description, image: await imageUrl(p.imageKey),
  latitude: p.latitude, longitude: p.longitude, address: p.address, details: await resolveDetails(p.details),
  leadCount: p._count?.leads, createdAt: p.createdAt,
})

export const projectFields = (data) => {
  const d = {}
  const strs = ['title', 'city', 'country', 'type', 'bedrooms', 'location', 'mapLink', 'description', 'address', 'imageKey']
  for (const f of strs) if (data[f] !== undefined) d[f] = data[f]
  if (data.priceFrom !== undefined) d.priceFrom = data.priceFrom != null && data.priceFrom !== '' ? Math.round(Number(data.priceFrom)) : null
  if (data.priceTo !== undefined) d.priceTo = data.priceTo != null && data.priceTo !== '' ? Math.round(Number(data.priceTo)) : null
  if (data.commissionPct !== undefined) d.commissionPct = data.commissionPct != null ? Number(data.commissionPct) : 3
  if (data.latitude !== undefined) d.latitude = data.latitude != null ? Number(data.latitude) : null
  if (data.longitude !== undefined) d.longitude = data.longitude != null ? Number(data.longitude) : null
  if (data.details !== undefined) d.details = data.details || {}
  return d
}

export async function listProjects(devId) {
  const projects = await prisma.project.findMany({ where: { developerId: devId }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { leads: true } } } })
  return Promise.all(projects.map(projectView))
}

export async function getProject(devId, id) {
  const p = await prisma.project.findUnique({ where: { id }, include: { _count: { select: { leads: true } } } })
  if (!p || p.developerId !== devId) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
  return projectView(p)
}

// status: 'DRAFT' (save as draft) or 'PENDING' (submit for admin review)
export async function createProject(devId, data) {
  const dev = await prisma.user.findUnique({ where: { id: devId } })
  if (!data.title?.trim()) throw new ApiError(400, 'Project title is required', 'BAD_INPUT')
  const status = data.status === 'DRAFT' ? 'DRAFT' : 'PENDING'
  const p = await prisma.project.create({
    data: {
      developerId: devId, developerName: dev.companyName || dev.fullName,
      ...projectFields(data),
      country: (data.country || dev.country || null),
      status,
    },
  })
  await prisma.auditLog.create({ data: { actorId: devId, action: 'developer.create_project', entity: 'Project', entityId: p.id, meta: { status } } })
  return getProject(devId, p.id)
}

export async function updateProject(devId, id, data) {
  const p = await prisma.project.findUnique({ where: { id } })
  if (!p || p.developerId !== devId) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
  const patch = projectFields(data)
  // allow submitting a draft for review, or re-saving as draft
  if (data.status === 'PENDING' || data.status === 'DRAFT') patch.status = data.status
  await prisma.project.update({ where: { id }, data: patch })
  await prisma.auditLog.create({ data: { actorId: devId, action: 'developer.update_project', entity: 'Project', entityId: id } })
  return getProject(devId, id)
}

export async function deleteProject(devId, id) {
  const p = await prisma.project.findUnique({ where: { id } })
  if (!p || p.developerId !== devId) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
  await prisma.project.delete({ where: { id } })
  return { id, deleted: true }
}

// upload any project media (cover image, gallery photo, master plan, brochure PDF) → public bucket
export async function uploadProjectFile(devId, file) {
  if (!file) throw new ApiError(400, 'No file provided', 'NO_FILE')
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!ok.includes(file.mimetype)) throw new ApiError(415, 'Only JPG, PNG, WEBP or PDF files', 'BAD_TYPE')
  const key = `projects/${devId}/${crypto.randomUUID()}`
  await s3.send(new PutObjectCommand({ Bucket: buckets.public, Key: key, Body: file.buffer, ContentType: file.mimetype }))
  return { key, imageKey: key, url: await imageUrl(key), filename: file.originalname, mimeType: file.mimetype, size: file.size }
}

// ---- leads (on my projects) ---------------------------------------------------
const leadView = (l) => ({
  id: l.id, projectName: l.projectName, realtorName: l.realtorName, unit: l.unit,
  clientName: l.clientName, clientPhone: l.clientPhone, clientEmail: l.clientEmail, budget: l.budget,
  status: l.status, statusHistory: l.statusHistory || null, notes: l.notes, createdAt: l.createdAt, updatedAt: l.updatedAt,
})

// append a status transition to a lead's history (backfilling NEW@createdAt for
// leads created before history tracking existed)
function appendHistory(lead, status) {
  const base = Array.isArray(lead.statusHistory) && lead.statusHistory.length
    ? lead.statusHistory
    : [{ status: 'NEW', at: new Date(lead.createdAt).toISOString() }]
  return [...base, { status, at: new Date().toISOString() }]
}

export async function listLeads(devId, { status } = {}) {
  const where = { developerId: devId }
  if (status) where.status = status
  const leads = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300 })
  return leads.map(leadView)
}

export async function getLead(devId, id) {
  const l = await prisma.lead.findUnique({ where: { id } })
  if (!l || l.developerId !== devId) throw new ApiError(404, 'Lead not found', 'NOT_FOUND')
  // include the commission (if the deal is closed) so the UI can drive the
  // payment state instead of a client-side placeholder
  const c = await prisma.commission.findUnique({
    where: { leadId: id },
    select: { id: true, status: true, gross: true, net: true, platformPct: true, dealRef: true, paidByDevAt: true },
  })
  const proj = l.projectId ? await prisma.project.findUnique({ where: { id: l.projectId }, select: { imageKey: true } }) : null
  return { ...leadView(l), commission: c || null, projectImage: proj?.imageKey ? await imageUrl(proj.imageKey) : null }
}

export async function updateLeadStatus(devId, id, status) {
  const l = await prisma.lead.findUnique({ where: { id } })
  if (!l || l.developerId !== devId) throw new ApiError(404, 'Lead not found', 'NOT_FOUND')
  const valid = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATING', 'CLOSED', 'LOST']
  if (!valid.includes(status)) throw new ApiError(400, 'Invalid status', 'BAD_STATUS')
  await prisma.lead.update({ where: { id }, data: { status, statusHistory: appendHistory(l, status) } })
  await prisma.notification.create({ data: { userId: l.realtorId, type: 'lead', title: 'Lead status updated', body: `${l.clientName} — ${l.projectName} is now ${status[0] + status.slice(1).toLowerCase()}.`, link: '/realtor/leads', read: false } })
  const rl = await prisma.user.findUnique({ where: { id: l.realtorId }, select: { email: true, fullName: true } })
  sendLeadStatusEmail(rl?.email, { fullName: rl?.fullName, clientName: l.clientName, projectName: l.projectName, status }).catch((e) => logger.warn({ err: e?.message }, 'lead status email failed'))
  return getLead(devId, id)
}

// close a deal → generate the commission the developer owes the realtor
export async function closeDeal(devId, id, { gross, closedAt }) {
  const l = await prisma.lead.findUnique({ where: { id }, include: { commission: true } })
  if (!l || l.developerId !== devId) throw new ApiError(404, 'Lead not found', 'NOT_FOUND')
  if (l.commission) throw new ApiError(409, 'A commission already exists for this deal', 'ALREADY_CLOSED')
  const amount = Math.round(Number(gross))
  if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, 'Enter the commission amount', 'BAD_AMOUNT')
  // use the chosen closing date if valid, otherwise stamp "now"
  const closedDate = closedAt ? new Date(closedAt) : new Date()
  const closedOn = Number.isNaN(closedDate.getTime()) ? new Date() : closedDate
  const commissionCfg = await getSection('commission')
  const platformPct = commissionCfg.defaultPct ?? 15
  const net = Math.round(amount * (1 - platformPct / 100))
  const dev = await prisma.user.findUnique({ where: { id: devId } })
  const count = await prisma.commission.count()
  const dealRef = `WS-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

  const [, commission] = await prisma.$transaction([
    prisma.lead.update({ where: { id }, data: { status: 'CLOSED', statusHistory: appendHistory(l, 'CLOSED') } }),
    prisma.commission.create({
      data: {
        realtorId: l.realtorId, developerId: devId, leadId: l.id, projectId: l.projectId,
        dealRef, projectName: l.projectName, developerName: dev.companyName || dev.fullName, realtorName: l.realtorName,
        unit: l.unit, closedAt: closedOn, gross: amount, platformPct, net, status: 'PENDING',
      },
    }),
  ])
  await prisma.notification.create({ data: { userId: l.realtorId, type: 'commission', title: 'Deal closed — commission created', body: `${dealRef}: SAR ${net.toLocaleString()} pending developer payment.`, link: '/realtor/commissions', read: false } })
  const rl = await prisma.user.findUnique({ where: { id: l.realtorId }, select: { email: true, fullName: true } })
  sendDealClosedEmail(rl?.email, { fullName: rl?.fullName, dealRef, projectName: l.projectName, net }).catch((e) => logger.warn({ err: e?.message }, 'deal closed email failed'))
  return { lead: leadView(await prisma.lead.findUnique({ where: { id } })), commission: { id: commission.id, dealRef, net } }
}

// ---- commissions the developer owes ------------------------------------------
const commissionView = (c) => ({
  id: c.id, dealRef: c.dealRef, projectName: c.projectName, realtorName: c.realtorName, unit: c.unit,
  closedAt: c.closedAt, gross: c.gross, platformPct: c.platformPct, net: c.net, status: c.status, createdAt: c.createdAt,
})

export async function listCommissions(devId, { status } = {}) {
  const where = { developerId: devId }
  if (status) where.status = status
  const rows = await prisma.commission.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300 })
  const all = await prisma.commission.findMany({ where: { developerId: devId }, select: { status: true, gross: true } })
  const owed = all.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.gross, 0)
  const paid = all.filter((c) => c.status === 'PROCESSING' || c.status === 'PAID').reduce((s, c) => s + c.gross, 0)
  return {
    commissions: rows.map(commissionView),
    totalOwed: owed,
    totalPaid: paid,
    counts: {
      all: all.length,
      pending: all.filter((c) => c.status === 'PENDING').length,
      processing: all.filter((c) => c.status === 'PROCESSING').length,
      paid: all.filter((c) => c.status === 'PAID').length,
      failed: all.filter((c) => c.status === 'FAILED').length,
    },
  }
}

// developer pays a commission (through the platform / gateway simulation)
export async function payCommission(devId, id) {
  const c = await prisma.commission.findUnique({ where: { id } })
  if (!c || c.developerId !== devId) throw new ApiError(404, 'Commission not found', 'NOT_FOUND')
  if (c.status !== 'PENDING') throw new ApiError(400, 'This commission is not awaiting payment', 'BAD_STATE')
  await prisma.commission.update({ where: { id }, data: { status: 'PROCESSING', paidByDevAt: new Date() } })
  await prisma.notification.create({ data: { userId: c.realtorId, type: 'commission', title: 'Commission paid by developer', body: `${c.dealRef}: SAR ${c.net.toLocaleString()} is now available to withdraw.`, link: '/realtor/commissions', read: false } })
  await prisma.auditLog.create({ data: { actorId: devId, action: 'developer.pay_commission', entity: 'Commission', entityId: id } })
  const rl = await prisma.user.findUnique({ where: { id: c.realtorId }, select: { email: true, fullName: true } })
  sendCommissionPaidEmail(rl?.email, { fullName: rl?.fullName, dealRef: c.dealRef, net: c.net }).catch((e) => logger.warn({ err: e?.message }, 'commission paid email failed'))
  return { id, status: 'PROCESSING' }
}

// developer marks that a payment attempt failed (their side)
export async function markCommissionFailed(devId, id, reason) {
  const c = await prisma.commission.findUnique({ where: { id } })
  if (!c || c.developerId !== devId) throw new ApiError(404, 'Commission not found', 'NOT_FOUND')
  await prisma.commission.update({ where: { id }, data: { status: 'FAILED', failureReason: reason || 'Payment could not be processed by the developer.' } })
  await prisma.notification.create({ data: { userId: c.realtorId, type: 'commission', title: 'Commission payment failed', body: `${c.dealRef}: the developer reported a payment issue.`, link: '/realtor/commissions', read: false } })
  return { id, status: 'FAILED' }
}

// ---- network (realtors who work with me) -------------------------------------
export async function network(devId) {
  const leads = await prisma.lead.findMany({ where: { developerId: devId }, select: { realtorId: true, realtorName: true, status: true } })
  const byId = {}
  for (const l of leads) {
    const k = l.realtorId
    if (!byId[k]) byId[k] = { realtorId: k, name: l.realtorName || '—', leads: 0, deals: 0 }
    byId[k].leads += 1
    if (l.status === 'CLOSED') byId[k].deals += 1
  }
  const ids = Object.keys(byId)
  if (ids.length) {
    const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true, city: true, country: true, agency: true, licenseNumber: true } })
    for (const u of users) if (byId[u.id]) Object.assign(byId[u.id], { name: u.fullName, city: u.city, country: u.country, agency: u.agency, license: u.licenseNumber })
  }
  return Object.values(byId).sort((a, b) => b.deals - a.deals || b.leads - a.leads)
}

// ---- analytics (per-project) --------------------------------------------------
export async function analytics(devId) {
  const projects = await prisma.project.findMany({ where: { developerId: devId }, select: { id: true, title: true } })
  const leads = await prisma.lead.findMany({ where: { developerId: devId }, select: { projectId: true, status: true } })
  const rows = projects.map((p) => {
    const pl = leads.filter((l) => l.projectId === p.id)
    const deals = pl.filter((l) => l.status === 'CLOSED').length
    return { project: p.title, leads: pl.length, deals, conversion: pl.length ? Math.round((deals / pl.length) * 100) : 0 }
  })
  const totalLeads = leads.length
  const totalDeals = leads.filter((l) => l.status === 'CLOSED').length
  return { rows, totals: { leads: totalLeads, deals: totalDeals, conversion: totalLeads ? Math.round((totalDeals / totalLeads) * 100) : 0 } }
}

// ---- dashboard ----------------------------------------------------------------
export async function dashboard(devId) {
  const [projects, live, leads, commissions, recentLeads] = await Promise.all([
    prisma.project.count({ where: { developerId: devId } }),
    prisma.project.count({ where: { developerId: devId, status: 'LIVE' } }),
    prisma.lead.findMany({ where: { developerId: devId }, select: { status: true } }),
    prisma.commission.findMany({ where: { developerId: devId }, select: { status: true, gross: true } }),
    prisma.lead.findMany({ where: { developerId: devId }, orderBy: { updatedAt: 'desc' }, take: 6 }),
  ])
  const deals = leads.filter((l) => l.status === 'CLOSED').length
  const owed = commissions.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.gross, 0)
  const paid = commissions.filter((c) => c.status === 'PROCESSING' || c.status === 'PAID').reduce((s, c) => s + c.gross, 0)
  const net = await network(devId)
  return {
    stats: { projects, live, leads: leads.length, deals, commissionOwed: owed, commissionPaid: paid, realtors: net.length },
    activity: recentLeads.map((l) => ({ kind: 'lead', title: `${l.clientName} · ${l.projectName}`, sub: `${l.realtorName || 'Realtor'} — ${l.status}`, at: l.updatedAt })),
  }
}

// ---- notifications (reuse the shared model) ----------------------------------
export async function listNotifications(userId) {
  const rows = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 })
  return { notifications: rows.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, read: n.read, createdAt: n.createdAt })), unread: rows.filter((n) => !n.read).length }
}
export async function markRead(userId, id) {
  const n = await prisma.notification.findUnique({ where: { id } })
  if (!n || n.userId !== userId) throw new ApiError(404, 'Not found', 'NOT_FOUND')
  await prisma.notification.update({ where: { id }, data: { read: true } })
  return { ok: true }
}
export async function markAllRead(userId) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
  return { ok: true }
}

// ---- disputes -----------------------------------------------------------------
export function createDispute(devId, body) {
  return raiseDispute({ userId: devId, role: 'DEVELOPER', ...body })
}
export function listDisputes(devId) {
  return listMyDisputes(devId)
}
