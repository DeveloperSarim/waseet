import { prisma } from '../../lib/prisma.js'
import { s3, buckets } from '../../lib/s3.js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ApiError } from '../../middleware/error.js'
import { resolveProjectMedia, imageUrl } from '../../lib/projectMedia.js'

const projectView = async (p, savedIds) => ({
  id: p.id,
  title: p.title,
  developerName: p.developerName,
  city: p.city,
  country: p.country,
  type: p.type,
  bedrooms: p.bedrooms,
  priceFrom: p.priceFrom,
  priceTo: p.priceTo,
  commissionPct: p.commissionPct,
  status: p.status,
  location: p.location,
  mapLink: p.mapLink,
  description: p.description,
  latitude: p.latitude,
  longitude: p.longitude,
  address: p.address,
  details: p.details || null,
  image: await imageUrl(p.imageKey),
  saved: savedIds ? savedIds.has(p.id) : undefined,
  createdAt: p.createdAt,
})

// ---- projects (marketplace, gated to approved users) --------------------------
export async function listProjects(userId, { city, type } = {}) {
  const where = { status: 'LIVE' }
  if (city) where.city = city
  if (type) where.type = type
  const [projects, saved] = await Promise.all([
    prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.savedProject.findMany({ where: { userId }, select: { projectId: true } }),
  ])
  const savedIds = new Set(saved.map((s) => s.projectId))
  return Promise.all(projects.map((p) => projectView(p, savedIds)))
}

// public-ish marketplace headline stats (realtor is logged in to view marketplace)
export async function marketplaceStats() {
  const [liveProjects, realtors, developers, liveForCities, paid] = await Promise.all([
    prisma.project.count({ where: { status: 'LIVE' } }),
    prisma.user.count({ where: { role: 'REALTOR', status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'DEVELOPER', status: 'ACTIVE' } }),
    prisma.project.findMany({ where: { status: 'LIVE' }, select: { city: true } }),
    prisma.commission.findMany({ where: { status: 'PAID' }, select: { net: true } }),
  ])
  const cities = new Set(liveForCities.map((p) => p.city).filter(Boolean)).size
  const commissionPaid = paid.reduce((s, c) => s + c.net, 0)
  // per-city live counts (for the "browse by city" cards)
  const byCity = {}
  for (const p of liveForCities) if (p.city) byCity[p.city] = (byCity[p.city] || 0) + 1
  return { liveProjects, activeListings: liveProjects, realtors, developers, cities, commissionPaid, cityCounts: byCity }
}

// A single project for the detail page: resolves the full media gallery, the
// downloadable documents and a little live developer context. Signed public-bucket
// URLs are short-lived so links stay valid without exposing the raw store.
export async function getProject(userId, id) {
  const p = await prisma.project.findUnique({ where: { id } })
  if (!p) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
  const saved = await prisma.savedProject.findUnique({ where: { userId_projectId: { userId, projectId: id } } })
  const view = await projectView(p, null)
  view.saved = !!saved

  // Gallery + master plan + documents + floor plans (all resolved to signed URLs).
  Object.assign(view, await resolveProjectMedia(p))

  // Live developer context for the sidebar (real counts, no fabricated stats).
  if (p.developerId) {
    const [dev, projectCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: p.developerId }, select: { fullName: true, companyName: true, city: true, country: true, website: true, bio: true, createdAt: true } }),
      prisma.project.count({ where: { developerId: p.developerId, status: 'LIVE' } }),
    ])
    if (dev) {
      view.developer = {
        name: dev.companyName || dev.fullName || p.developerName,
        city: dev.city,
        country: dev.country,
        website: dev.website,
        bio: dev.bio,
        verified: true,
        projectCount,
        since: dev.createdAt,
      }
    }
  }
  return view
}

export async function listSaved(userId) {
  const rows = await prisma.savedProject.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { project: true },
  })
  const savedIds = new Set(rows.map((r) => r.projectId))
  return Promise.all(rows.map((r) => projectView(r.project, savedIds)))
}

export async function saveProject(userId, projectId) {
  const p = await prisma.project.findUnique({ where: { id: projectId } })
  if (!p) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
  await prisma.savedProject.upsert({
    where: { userId_projectId: { userId, projectId } },
    update: {},
    create: { userId, projectId },
  })
  return { saved: true }
}

export async function unsaveProject(userId, projectId) {
  await prisma.savedProject.deleteMany({ where: { userId, projectId } })
  return { saved: false }
}

// ---- leads --------------------------------------------------------------------
const leadView = (l) => ({
  id: l.id,
  projectName: l.projectName,
  developerName: l.developerName,
  unit: l.unit,
  clientName: l.clientName,
  clientPhone: l.clientPhone,
  status: l.status,
  notes: l.notes,
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
})

export async function listLeads(realtorId, { status } = {}) {
  const where = { realtorId }
  if (status) where.status = status
  const leads = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
  return leads.map(leadView)
}

export async function getLead(realtorId, id) {
  const l = await prisma.lead.findUnique({ where: { id } })
  if (!l || l.realtorId !== realtorId) throw new ApiError(404, 'Lead not found', 'NOT_FOUND')
  return leadView(l)
}

// realtor submits a lead on a marketplace project → notifies the developer
export async function createLead(realtorId, { projectId, clientName, clientPhone, clientEmail, unit, budget, notes }) {
  if (!clientName?.trim()) throw new ApiError(400, 'Client name is required', 'BAD_INPUT')
  const project = projectId ? await prisma.project.findUnique({ where: { id: projectId } }) : null
  if (projectId && !project) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
  const realtor = await prisma.user.findUnique({ where: { id: realtorId } })
  const lead = await prisma.lead.create({
    data: {
      realtorId, developerId: project?.developerId || null, projectId: project?.id || null,
      projectName: project?.title || 'Direct enquiry', developerName: project?.developerName || null,
      realtorName: realtor.fullName, unit: unit || null, clientName: clientName.trim(),
      clientPhone: clientPhone || null, clientEmail: clientEmail || null, budget: budget || null, notes: notes || null,
      status: 'NEW',
    },
  })
  if (project?.developerId) {
    await prisma.notification.create({ data: { userId: project.developerId, type: 'lead', title: 'New lead received', body: `${realtor.fullName} submitted a lead for ${project.title}.`, link: '/developer/leads', read: false } })
  }
  return leadView(lead)
}

// ---- commissions --------------------------------------------------------------
const commissionView = (c) => ({
  id: c.id,
  dealRef: c.dealRef,
  projectName: c.projectName,
  developerName: c.developerName,
  unit: c.unit,
  closedAt: c.closedAt,
  gross: c.gross,
  platformPct: c.platformPct,
  net: c.net,
  status: c.status,
  failureReason: c.failureReason,
  createdAt: c.createdAt,
})

export async function listCommissions(realtorId, { status } = {}) {
  const where = { realtorId }
  if (status) where.status = status
  const rows = await prisma.commission.findMany({ where, orderBy: { closedAt: 'desc' }, take: 200 })
  const all = await prisma.commission.findMany({ where: { realtorId }, select: { status: true, net: true } })
  const totalEarned = all.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.net, 0)
  const failed = await prisma.commission.findFirst({ where: { realtorId, status: 'FAILED' }, orderBy: { closedAt: 'desc' } })
  return {
    commissions: rows.map(commissionView),
    totalEarned,
    counts: {
      all: all.length,
      pending: all.filter((c) => c.status === 'PENDING').length,
      processing: all.filter((c) => c.status === 'PROCESSING').length,
      paid: all.filter((c) => c.status === 'PAID').length,
      failed: all.filter((c) => c.status === 'FAILED').length,
    },
    failedPayment: failed ? commissionView(failed) : null,
  }
}

export async function getCommission(realtorId, id) {
  const c = await prisma.commission.findUnique({ where: { id } })
  if (!c || c.realtorId !== realtorId) throw new ApiError(404, 'Commission not found', 'NOT_FOUND')
  return commissionView(c)
}

// ---- wallet + withdrawals -----------------------------------------------------
// Commission status → wallet meaning:
//   PENDING    = deal closed, waiting for the DEVELOPER to pay (not withdrawable)
//   PROCESSING = developer has PAID (via the gateway) → funds available to withdraw
//   PAID       = already settled/withdrawn to the realtor
const withdrawalView = (w) => ({
  id: w.id,
  reference: w.reference,
  amount: w.amount,
  method: w.method,
  status: w.status,
  note: w.note,
  paidAt: w.paidAt,
  createdAt: w.createdAt,
})

export async function getWallet(realtorId) {
  const [commissions, withdrawals] = await Promise.all([
    prisma.commission.findMany({ where: { realtorId }, select: { status: true, net: true } }),
    prisma.withdrawal.findMany({ where: { realtorId }, orderBy: { createdAt: 'desc' } }),
  ])
  const sum = (arr) => arr.reduce((s, c) => s + c.net, 0)
  const developerPaid = sum(commissions.filter((c) => c.status === 'PROCESSING'))
  const pending = sum(commissions.filter((c) => c.status === 'PENDING'))
  const paidOut = sum(commissions.filter((c) => c.status === 'PAID'))
  // funds locked in open withdrawal requests
  const locked = withdrawals.filter((w) => w.status === 'REQUESTED' || w.status === 'PROCESSING').reduce((s, w) => s + w.amount, 0)
  const available = Math.max(0, developerPaid - locked)
  return {
    currency: 'SAR',
    available, // developer-paid, ready to withdraw
    pending, // still awaiting developer payment
    paidOut, // already settled to the realtor
    inProgress: locked, // withdrawal requests being processed
    withdrawals: withdrawals.map(withdrawalView),
  }
}

export async function requestWithdrawal(realtorId, { amount, method } = {}) {
  const wallet = await getWallet(realtorId)
  const amt = amount == null ? wallet.available : Math.floor(Number(amount))
  if (!amt || amt <= 0) throw new ApiError(400, 'Enter a valid amount', 'BAD_AMOUNT')
  if (amt > wallet.available) throw new ApiError(400, 'Amount exceeds your available balance', 'INSUFFICIENT_FUNDS')

  const count = await prisma.withdrawal.count({ where: { realtorId } })
  const reference = `WD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`
  const w = await prisma.withdrawal.create({
    data: { realtorId, amount: amt, method: method || 'bank', status: 'REQUESTED', reference },
  })
  await prisma.notification.create({
    data: { userId: realtorId, type: 'commission', title: 'Withdrawal requested', body: `Your withdrawal of SAR ${amt.toLocaleString()} (${reference}) is being processed.`, link: '/realtor/commissions', read: false },
  })
  await prisma.auditLog.create({ data: { actorId: realtorId, action: 'wallet.withdraw_request', entity: 'Withdrawal', entityId: w.id, meta: { amount: amt } } })
  return withdrawalView(w)
}

// ---- notifications ------------------------------------------------------------
const notifView = (n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, read: n.read, createdAt: n.createdAt })

export async function listNotifications(userId) {
  const rows = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 })
  const unread = rows.filter((n) => !n.read).length
  return { notifications: rows.map(notifView), unread }
}

export async function markRead(userId, id) {
  const n = await prisma.notification.findUnique({ where: { id } })
  if (!n || n.userId !== userId) throw new ApiError(404, 'Notification not found', 'NOT_FOUND')
  await prisma.notification.update({ where: { id }, data: { read: true } })
  return { ok: true }
}

export async function markAllRead(userId) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
  return { ok: true }
}

// ---- dashboard summary --------------------------------------------------------
export async function dashboardSummary(realtorId) {
  const [leads, commissions, recentLeads, recentCommissions] = await Promise.all([
    prisma.lead.findMany({ where: { realtorId }, select: { status: true } }),
    prisma.commission.findMany({ where: { realtorId }, select: { status: true, net: true } }),
    prisma.lead.findMany({ where: { realtorId }, orderBy: { updatedAt: 'desc' }, take: 5 }),
    prisma.commission.findMany({ where: { realtorId }, orderBy: { updatedAt: 'desc' }, take: 5 }),
  ])
  const deals = leads.filter((l) => l.status === 'CLOSED').length
  const totalEarned = commissions.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.net, 0)
  const pending = commissions.filter((c) => c.status !== 'PAID').reduce((s, c) => s + c.net, 0)

  // build a simple recent-activity feed from leads + commissions
  const activity = [
    ...recentLeads.map((l) => ({ kind: 'lead', title: `Lead · ${l.clientName}`, sub: `${l.projectName} — ${l.status}`, at: l.updatedAt })),
    ...recentCommissions.map((c) => ({ kind: 'commission', title: `Commission · ${c.dealRef}`, sub: `${c.projectName} — ${c.status}`, at: c.updatedAt })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6)

  return {
    stats: { leads: leads.length, deals, totalEarned, pending },
    activity,
  }
}
