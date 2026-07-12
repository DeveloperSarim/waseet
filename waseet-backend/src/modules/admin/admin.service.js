import crypto from 'node:crypto'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prisma } from '../../lib/prisma.js'
import { s3 } from '../../lib/s3.js'
import { hashPassword } from '../../utils/password.js'
import { hashToken } from '../../utils/jwt.js'
import { config } from '../../config/env.js'
import { ApiError } from '../../middleware/error.js'
import { sendApprovalEmail, sendRejectionEmail, sendMail } from '../../lib/mailer.js'
import { logger } from '../../utils/logger.js'
import { getSection, setSection } from '../../lib/settings.js'
import { resolveProjectMedia, uploadProjectMedia, uploadAvatar, imageUrl } from '../../lib/projectMedia.js'
import { projectFields } from '../developer/developer.service.js'

const publicUser = (u) => ({
  id: u.id,
  role: u.role,
  status: u.status,
  email: u.email,
  fullName: u.fullName,
  phone: u.phone,
  country: u.country,
  city: u.city,
  agency: u.agency,
  specialization: u.specialization,
  languages: u.languages,
  experience: u.experience,
  licenseType: u.licenseType,
  licenseNumber: u.licenseNumber,
  licenseExpiry: u.licenseExpiry,
  idType: u.idType,
  idNumber: u.idNumber,
  companyName: u.companyName,
  contactName: u.contactName,
  website: u.website,
  bio: u.bio,
  createdAt: u.createdAt,
})

const genTempPassword = () => 'Wst-' + crypto.randomBytes(4).toString('hex') // e.g. Wst-9f3a2b1c

// Same tier rules used on the realtor badge page.
const badgeFor = (deals, leads) => {
  if (deals >= 10) return { emoji: '💎', name: 'Platinum' }
  if (deals >= 3) return { emoji: '🥇', name: 'Gold' }
  if (deals >= 1 || leads >= 5) return { emoji: '🥈', name: 'Silver' }
  return { emoji: '🥉', name: 'Bronze' }
}

export async function listUsers({ status, role }) {
  const where = {}
  if (status) where.status = status
  if (role) where.role = role
  const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
  const ids = users.map((u) => u.id)

  // per-realtor lead + closed-deal counts (badge + table columns) and per-developer project counts
  const [leadGroups, dealGroups, projectGroups] = await Promise.all([
    prisma.lead.groupBy({ by: ['realtorId'], where: { realtorId: { in: ids } }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ['realtorId'], where: { realtorId: { in: ids }, status: 'CLOSED' }, _count: { _all: true } }),
    prisma.project.groupBy({ by: ['developerId'], where: { developerId: { in: ids } }, _count: { _all: true } }),
  ])
  const leadsBy = Object.fromEntries(leadGroups.map((g) => [g.realtorId, g._count._all]))
  const dealsBy = Object.fromEntries(dealGroups.map((g) => [g.realtorId, g._count._all]))
  const projectsBy = Object.fromEntries(projectGroups.map((g) => [g.developerId, g._count._all]))

  return Promise.all(
    users.map(async (u) => {
      const leads = leadsBy[u.id] || 0
      const deals = dealsBy[u.id] || 0
      return {
        ...publicUser(u),
        licenseNumber: u.licenseNumber || null,
        agency: u.agency || null,
        avatar: u.avatarKey ? await imageUrl(u.avatarKey) : null,
        leads,
        deals,
        projectCount: u.role === 'DEVELOPER' ? projectsBy[u.id] || 0 : undefined,
        badge: u.role === 'REALTOR' ? badgeFor(deals, leads) : null,
      }
    }),
  )
}

// Full profile for the admin review page: the user + their uploaded documents,
// each with a short-lived signed URL so the admin can view the KYC files inline.
export async function getUserDetail(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  })
  if (!user) throw new ApiError(404, 'User not found', 'NOT_FOUND')

  const documents = await Promise.all(
    user.documents.map(async (d) => ({
      id: d.id,
      type: d.type,
      filename: d.filename,
      mimeType: d.mimeType,
      size: d.size,
      status: d.status,
      createdAt: d.createdAt,
      url: await getSignedUrl(s3, new GetObjectCommand({ Bucket: d.bucket, Key: d.key }), { expiresIn: 300 }),
    })),
  )

  return {
    ...publicUser(user),
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    bannedUntil: user.bannedUntil,
    avatar: user.avatarKey ? await imageUrl(user.avatarKey) : null,
    projectCount: user.role === 'DEVELOPER' ? await prisma.project.count({ where: { developerId: user.id } }) : undefined,
    documents,
  }
}

export async function approveUser(id, adminId) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new ApiError(404, 'User not found', 'NOT_FOUND')
  if (user.role === 'ADMIN') throw new ApiError(400, 'Admins do not need approval', 'BAD_TARGET')

  const tempPassword = genTempPassword()
  const passwordHash = await hashPassword(tempPassword)
  const rawToken = crypto.randomBytes(32).toString('hex')
  const setLink = `${config.APP_URL}/reset-password?token=${rawToken}`

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { status: 'ACTIVE', mustChangePassword: true, passwordHash } }),
    prisma.passwordReset.deleteMany({ where: { userId: id, usedAt: null } }),
    prisma.passwordReset.create({
      data: { userId: id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    }),
    prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.approve_user', entity: 'User', entityId: id } }),
  ])
  // email is best-effort — approval must still succeed if SMTP is unreachable
  await sendApprovalEmail(user, { tempPassword, setLink }).catch((e) => logger.warn({ err: e?.message }, 'approval email failed'))
  return {
    id,
    status: 'ACTIVE',
    // dev-only: surfaced so the flow is testable without a real inbox
    ...(config.NODE_ENV === 'development' ? { devSetLink: setLink, devTempPassword: tempPassword } : {}),
  }
}

export async function rejectUser(id, adminId, reason) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new ApiError(404, 'User not found', 'NOT_FOUND')
  await prisma.user.update({ where: { id }, data: { status: 'REJECTED' } })
  await prisma.auditLog.create({
    data: { actorId: adminId, action: 'admin.reject_user', entity: 'User', entityId: id, meta: reason ? { reason } : undefined },
  })
  await sendRejectionEmail(user, { reason }).catch((e) => logger.warn({ err: e?.message }, 'rejection email failed'))
  return { id, status: 'REJECTED' }
}

// fields an admin may edit on any user
const ADMIN_EDITABLE = ['fullName', 'phone', 'country', 'city', 'agency', 'specialization', 'languages', 'experience', 'licenseNumber', 'licenseType', 'companyName', 'contactName', 'website', 'bio', 'idType', 'idNumber', 'bankName', 'iban', 'avatarKey']

async function loadTarget(id) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new ApiError(404, 'User not found', 'NOT_FOUND')
  if (user.role === 'ADMIN') throw new ApiError(400, 'This action is not allowed on admin accounts', 'BAD_TARGET')
  return user
}

export async function adminUpdateUser(id, adminId, patch) {
  await loadTarget(id)
  const data = {}
  for (const k of ADMIN_EDITABLE) if (patch[k] !== undefined) data[k] = patch[k]
  if (Object.keys(data).length === 0) throw new ApiError(400, 'Nothing to update', 'NO_CHANGES')
  await prisma.user.update({ where: { id }, data })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.update_user', entity: 'User', entityId: id, meta: { fields: Object.keys(data) } } })
  return getUserDetail(id)
}

export async function suspendUser(id, adminId, reason) {
  const user = await loadTarget(id)
  await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } })
  // suspending signs them out everywhere
  await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.suspend_user', entity: 'User', entityId: id, meta: reason ? { reason } : undefined } })
  await sendMail({ to: user.email, subject: 'Your Waseet account has been suspended', text: `Hello ${user.fullName},\n\nYour Waseet account has been suspended.${reason ? `\n\nReason: ${reason}` : ''}\n\nPlease contact support if you believe this is a mistake.\n\n— Waseet` }).catch(() => {})
  return { id, status: 'SUSPENDED' }
}

export async function reactivateUser(id, adminId) {
  await loadTarget(id)
  await prisma.user.update({ where: { id }, data: { status: 'ACTIVE', bannedUntil: null } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.reactivate_user', entity: 'User', entityId: id } })
  return { id, status: 'ACTIVE' }
}

// Ban an account for a number of days (days omitted / 0 = permanent). Sets SUSPENDED + bannedUntil.
export async function banUser(id, adminId, { days, reason } = {}) {
  const user = await loadTarget(id)
  const n = Number(days)
  const bannedUntil = n && n > 0 ? new Date(Date.now() + n * 24 * 60 * 60 * 1000) : null
  await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED', bannedUntil } })
  await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.ban_user', entity: 'User', entityId: id, meta: { days: n || null, reason: reason || null } } })
  const until = bannedUntil ? bannedUntil.toDateString() : 'further notice'
  await sendMail({ to: user.email, subject: 'Your Waseet account has been banned', text: `Hello ${user.fullName},\n\nYour Waseet account has been banned until ${until}.${reason ? `\n\nReason: ${reason}` : ''}\n\nContact support if you believe this is a mistake.\n\n— Waseet` }).catch(() => {})
  return { id, status: 'SUSPENDED', bannedUntil }
}

// Issue a fresh temporary password and email it to the user (admin-triggered reset).
export async function sendPasswordReset(id, adminId) {
  const user = await loadTarget(id)
  const tempPassword = genTempPassword()
  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(tempPassword), mustChangePassword: true } })
  await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })
  await prisma.passwordReset.deleteMany({ where: { userId: id, usedAt: null } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.password_reset', entity: 'User', entityId: id } })
  await sendMail({ to: user.email, subject: 'Your Waseet password has been reset', text: `Hello ${user.fullName},\n\nAn administrator has reset your Waseet password.\n\nTemporary password: ${tempPassword}\n\nPlease sign in and change it immediately.\n\n— Waseet` }).catch(() => {})
  return { id, sent: true }
}

// Admin uploads / replaces a user's profile photo (logo).
export async function uploadUserAvatar(id, adminId, file) {
  await loadTarget(id)
  const { key, url } = await uploadAvatar(id, file)
  await prisma.user.update({ where: { id }, data: { avatarKey: key } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.update_avatar', entity: 'User', entityId: id } })
  return { id, avatar: url, avatarKey: key }
}

export async function deleteUser(id, adminId) {
  const user = await loadTarget(id)
  // cascade deletes their documents/leads/commissions/etc. via schema onDelete: Cascade
  await prisma.user.delete({ where: { id } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.delete_user', entity: 'User', entityId: id, meta: { email: user.email } } })
  return { id, deleted: true }
}

export async function emailUser(id, adminId, { subject, message }) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new ApiError(404, 'User not found', 'NOT_FOUND')
  if (!subject || !subject.trim()) throw new ApiError(400, 'Subject is required', 'BAD_INPUT')
  if (!message || !message.trim()) throw new ApiError(400, 'Message is required', 'BAD_INPUT')
  const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.7;color:#111">${message.replace(/\n/g, '<br>')}<hr style="border:none;border-top:1px solid #eee;margin:20px 0"><div style="font-size:12px;color:#888">Sent by the Waseet team · وسيط</div></div>`
  try {
    await sendMail({ to: user.email, subject: subject.trim(), text: message, html })
  } catch (e) {
    logger.warn({ err: e?.message }, 'admin email failed')
    throw new ApiError(502, 'Email could not be sent — check the SMTP settings in the server .env', 'EMAIL_FAILED')
  }
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.email_user', entity: 'User', entityId: id, meta: { subject: subject.trim() } } })
  return { ok: true, to: user.email }
}

// =====================================================================
// Admin dashboard + domain screens
// =====================================================================
const SAR = (n) => n

export async function adminDashboard() {
  const [devs, realtors, pendingUsers, projects, pendingProjects, leads, commissions, disputes] = await Promise.all([
    prisma.user.count({ where: { role: 'DEVELOPER' } }),
    prisma.user.count({ where: { role: 'REALTOR' } }),
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: 'PENDING' } }),
    prisma.lead.count(),
    prisma.commission.findMany({ select: { status: true, gross: true, net: true, createdAt: true } }),
    prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
  ])
  const platformRevenue = commissions.filter((c) => c.status === 'PAID' || c.status === 'PROCESSING').reduce((s, c) => s + (c.gross - c.net), 0)
  const commissionVolume = commissions.reduce((s, c) => s + c.gross, 0)
  const deals = commissions.length
  // recent activity: latest registrations + leads
  const [recentUsers, recentLeads] = await Promise.all([
    prisma.user.findMany({ where: { role: { not: 'ADMIN' } }, orderBy: { createdAt: 'desc' }, take: 5, select: { fullName: true, role: true, status: true, createdAt: true } }),
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { clientName: true, projectName: true, realtorName: true, createdAt: true } }),
  ])
  const activity = [
    ...recentUsers.map((u) => ({ kind: 'user', title: `${u.fullName} joined`, sub: `${u.role} · ${u.status}`, at: u.createdAt })),
    ...recentLeads.map((l) => ({ kind: 'lead', title: `Lead · ${l.clientName}`, sub: `${l.projectName} — ${l.realtorName || 'Realtor'}`, at: l.createdAt })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8)
  return {
    stats: { developers: devs, realtors, pendingApprovals: pendingUsers, projects, pendingProjects, leads, deals, disputes, platformRevenue, commissionVolume },
    activity,
  }
}

// ---- projects ----
export async function listProjects({ status, developerId } = {}) {
  const where = {}
  if (status) where.status = status
  if (developerId) where.developerId = developerId
  const rows = await prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, include: { _count: { select: { leads: true } } } })
  const counts = { all: await prisma.project.count(), live: 0, pending: 0, draft: 0, soldOut: 0 }
  const all = await prisma.project.findMany({ select: { status: true } })
  for (const p of all) { if (p.status === 'LIVE') counts.live++; else if (p.status === 'PENDING') counts.pending++; else if (p.status === 'DRAFT') counts.draft++; else if (p.status === 'SOLD_OUT') counts.soldOut++ }
  // developer options for the filter dropdown
  const developers = await prisma.user.findMany({ where: { role: 'DEVELOPER' }, orderBy: { companyName: 'asc' }, select: { id: true, companyName: true, fullName: true } })
  return {
    projects: rows.map((p) => ({ id: p.id, title: p.title, developerName: p.developerName, developerId: p.developerId, city: p.city, country: p.country, type: p.type, bedrooms: p.bedrooms, priceFrom: p.priceFrom, priceTo: p.priceTo, commissionPct: p.commissionPct, status: p.status, leadCount: p._count.leads, createdAt: p.createdAt })),
    counts,
    developers: developers.map((d) => ({ id: d.id, name: d.companyName || d.fullName })),
  }
}

export async function getProjectDetail(id) {
  const p = await prisma.project.findUnique({ where: { id }, include: { _count: { select: { leads: true } }, developer: { select: { id: true, fullName: true, companyName: true, email: true } } } })
  if (!p) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
  const media = await resolveProjectMedia(p)
  return {
    id: p.id, title: p.title, developerName: p.developerName, developerId: p.developerId, developerEmail: p.developer?.email,
    city: p.city, country: p.country, type: p.type, bedrooms: p.bedrooms, priceFrom: p.priceFrom, priceTo: p.priceTo,
    commissionPct: p.commissionPct, status: p.status, location: p.location, mapLink: p.mapLink, description: p.description,
    latitude: p.latitude, longitude: p.longitude, address: p.address,
    details: p.details || {},
    ...media, // image, images[], masterPlanUrl, documents[], floorPlans[]
    leadCount: p._count.leads, createdAt: p.createdAt,
  }
}

// Admin can edit any project's fields (reuses the same field mapping developers use).
export async function updateProject(adminId, id, data) {
  const p = await prisma.project.findUnique({ where: { id } })
  if (!p) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
  const fields = projectFields(data)
  if (data.status !== undefined) {
    const valid = ['LIVE', 'PENDING', 'DRAFT', 'SOLD_OUT']
    if (valid.includes(data.status)) fields.status = data.status
  }
  await prisma.project.update({ where: { id }, data: fields })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.project_update', entity: 'Project', entityId: id, meta: { fields: Object.keys(fields) } } })
  return getProjectDetail(id)
}

// Admin project-media upload (image / floor plan / document) → public bucket.
export async function uploadProjectFile(adminId, file) {
  return uploadProjectMedia(`admin-${adminId}`, file)
}

export async function setProjectStatus(adminId, id, status) {
  const valid = ['LIVE', 'PENDING', 'DRAFT', 'SOLD_OUT']
  if (!valid.includes(status)) throw new ApiError(400, 'Invalid status', 'BAD_STATUS')
  const p = await prisma.project.findUnique({ where: { id } })
  if (!p) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
  await prisma.project.update({ where: { id }, data: { status } })
  if (p.developerId) {
    const msg = status === 'LIVE' ? `Your project "${p.title}" is now live on the marketplace.` : status === 'DRAFT' ? `Your project "${p.title}" was not approved.` : `Your project "${p.title}" status is now ${status}.`
    await prisma.notification.create({ data: { userId: p.developerId, type: 'announcement', title: 'Project update', body: msg, link: '/developer/projects', read: false } })
  }
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.project_status', entity: 'Project', entityId: id, meta: { status } } })
  return { id, status }
}

// ---- leads (all) ----
export async function listLeads({ status } = {}) {
  const where = {}
  if (status) where.status = status
  const rows = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300 })
  return rows.map((l) => ({ id: l.id, projectName: l.projectName, developerName: l.developerName, realtorName: l.realtorName, unit: l.unit, clientName: l.clientName, clientPhone: l.clientPhone, status: l.status, createdAt: l.createdAt }))
}

// ---- commissions (all) ----
export async function listCommissions({ status } = {}) {
  const where = {}
  if (status) where.status = status
  const rows = await prisma.commission.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300 })
  const all = await prisma.commission.findMany({ select: { status: true, gross: true, net: true } })
  return {
    commissions: rows.map((c) => ({ id: c.id, dealRef: c.dealRef, projectName: c.projectName, developerName: c.developerName, realtorName: c.realtorName, unit: c.unit, gross: c.gross, net: c.net, platformPct: c.platformPct, status: c.status, closedAt: c.closedAt, createdAt: c.createdAt })),
    counts: { all: all.length, pending: all.filter((c) => c.status === 'PENDING').length, processing: all.filter((c) => c.status === 'PROCESSING').length, paid: all.filter((c) => c.status === 'PAID').length, failed: all.filter((c) => c.status === 'FAILED').length },
    platformRevenue: all.filter((c) => c.status === 'PAID' || c.status === 'PROCESSING').reduce((s, c) => s + (c.gross - c.net), 0),
  }
}

export async function getCommissionDetail(id) {
  const c = await prisma.commission.findUnique({ where: { id }, include: { realtor: { select: { fullName: true, email: true, bankName: true, iban: true } } } })
  if (!c) throw new ApiError(404, 'Commission not found', 'NOT_FOUND')
  return { id: c.id, dealRef: c.dealRef, projectName: c.projectName, developerName: c.developerName, realtorName: c.realtorName, realtorEmail: c.realtor?.email, realtorBank: c.realtor?.bankName, realtorIban: c.realtor?.iban, unit: c.unit, gross: c.gross, net: c.net, platformPct: c.platformPct, platformFee: c.gross - c.net, status: c.status, failureReason: c.failureReason, closedAt: c.closedAt, createdAt: c.createdAt }
}

// ---- disputes ----
export async function listDisputes({ status } = {}) {
  const where = {}
  if (status) where.status = status
  const rows = await prisma.dispute.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
  const all = await prisma.dispute.findMany({ select: { status: true } })
  return {
    disputes: rows.map((d) => ({ id: d.id, ref: d.ref, subject: d.subject, raisedByName: d.raisedByName, raisedByRole: d.raisedByRole, amount: d.amount, status: d.status, createdAt: d.createdAt })),
    counts: { all: all.length, open: all.filter((d) => d.status === 'OPEN').length, review: all.filter((d) => d.status === 'UNDER_REVIEW').length, resolved: all.filter((d) => d.status === 'RESOLVED').length, rejected: all.filter((d) => d.status === 'REJECTED').length },
  }
}

export async function getDisputeDetail(id) {
  const d = await prisma.dispute.findUnique({ where: { id } })
  if (!d) throw new ApiError(404, 'Dispute not found', 'NOT_FOUND')
  return d
}

export async function resolveDispute(adminId, id, { status, resolution }) {
  const valid = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED']
  if (!valid.includes(status)) throw new ApiError(400, 'Invalid status', 'BAD_STATUS')
  const d = await prisma.dispute.findUnique({ where: { id } })
  if (!d) throw new ApiError(404, 'Dispute not found', 'NOT_FOUND')
  await prisma.dispute.update({ where: { id }, data: { status, resolution: resolution || d.resolution } })
  if (d.raisedById) await prisma.notification.create({ data: { userId: d.raisedById, type: 'announcement', title: 'Dispute update', body: `${d.ref} is now ${status.replace('_', ' ').toLowerCase()}.`, link: '#', read: false } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.resolve_dispute', entity: 'Dispute', entityId: id, meta: { status } } })
  return { id, status }
}

// ---- announcements ----
export async function listAnnouncements() {
  const rows = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  return rows.map((a) => ({ id: a.id, title: a.title, body: a.body, audience: a.audience, recipients: a.recipients, createdAt: a.createdAt }))
}

export async function createAnnouncement(adminId, { title, body, audience }) {
  if (!title?.trim() || !body?.trim()) throw new ApiError(400, 'Title and body are required', 'BAD_INPUT')
  const aud = ['ALL', 'REALTORS', 'DEVELOPERS'].includes(audience) ? audience : 'ALL'
  const roleFilter = aud === 'REALTORS' ? { role: 'REALTOR' } : aud === 'DEVELOPERS' ? { role: 'DEVELOPER' } : { role: { in: ['REALTOR', 'DEVELOPER'] } }
  const recipients = await prisma.user.findMany({ where: { ...roleFilter, status: 'ACTIVE' }, select: { id: true } })
  const ann = await prisma.announcement.create({ data: { title: title.trim(), body: body.trim(), audience: aud, sentById: adminId, recipients: recipients.length } })
  if (recipients.length) {
    await prisma.notification.createMany({ data: recipients.map((u) => ({ userId: u.id, type: 'announcement', title: title.trim(), body: body.trim(), link: '#', read: false })) })
  }
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.create_announcement', entity: 'Announcement', entityId: ann.id } })
  return { id: ann.id, recipients: ann.recipients }
}

export async function clearAnnouncements(adminId) {
  const { count } = await prisma.announcement.deleteMany({})
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.clear_announcements', entity: 'Announcement', meta: { count } } })
  return { cleared: count }
}

// ---- email templates (stored in settings) ----
const DEFAULT_TEMPLATES = {
  approval: { name: 'Account approved', subject: 'Your Waseet account is approved', body: 'Welcome {{name}}! Your account has been approved. Set your password to get started.' },
  rejection: { name: 'Application rejected', subject: 'Update on your Waseet application', body: 'Hi {{name}}, after review your application was not approved at this time.' },
  lead: { name: 'New lead', subject: 'You have a new lead', body: 'A new lead was submitted on your project.' },
  commission: { name: 'Commission paid', subject: 'Your commission has been paid', body: 'Good news {{name}} — a commission has been paid to your account.' },
}
export async function getEmailTemplates() {
  const stored = await getSection('emailTemplates')
  return { ...DEFAULT_TEMPLATES, ...(stored || {}) }
}
export async function updateEmailTemplate(adminId, key, patch) {
  const current = await getEmailTemplates()
  if (!current[key]) throw new ApiError(404, 'Template not found', 'NOT_FOUND')
  const next = { ...current, [key]: { ...current[key], ...patch } }
  await setSection('emailTemplates', next)
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.update_template', entity: 'Setting', meta: { key } } })
  return next
}
