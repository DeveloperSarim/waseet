import crypto from 'node:crypto'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prisma } from '../../lib/prisma.js'
import { s3 } from '../../lib/s3.js'
import { hashPassword } from '../../utils/password.js'
import { hashToken } from '../../utils/jwt.js'
import { config } from '../../config/env.js'
import { ApiError } from '../../middleware/error.js'
import { sendApprovalEmail, sendRejectionEmail, sendMail, sendCommissionDisbursedEmail, sendAnnouncementEmail } from '../../lib/mailer.js'
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
    // approving the account also clears the KYC docs it was based on
    prisma.document.updateMany({ where: { userId: id, status: 'PENDING' }, data: { status: 'VERIFIED' } }),
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

// friendly document names for notifications
const DOC_LABELS = { PROFILE_PHOTO: 'profile photo', FAL_LICENSE: 'FAL license', NATIONAL_ID: 'Iqama / National ID', TRADE_LICENSE: 'trade license', REGA_CERTIFICATE: 'REGA certificate', OTHER: 'document' }

// Admin verifies / rejects a KYC document. Rejecting a document on an ACTIVE
// realtor suspends their access until they re-verify — only an admin can
// reactivate them afterwards.
export async function setDocumentStatus(docId, adminId, status, reason) {
  const valid = ['VERIFIED', 'REJECTED', 'PENDING']
  if (!valid.includes(status)) throw new ApiError(400, 'Invalid document status', 'BAD_STATUS')
  const doc = await prisma.document.findUnique({ where: { id: docId }, include: { user: true } })
  if (!doc) throw new ApiError(404, 'Document not found', 'NOT_FOUND')

  await prisma.document.update({ where: { id: docId }, data: { status } })

  // rejecting a KYC doc revokes an active realtor's access until re-verified
  if (status === 'REJECTED' && doc.user.role !== 'ADMIN' && doc.user.status === 'ACTIVE') {
    await prisma.user.update({ where: { id: doc.userId }, data: { status: 'SUSPENDED' } })
  }

  const label = DOC_LABELS[doc.type] || 'document'
  const body = status === 'REJECTED'
    ? `Your ${label} was rejected${reason ? `: ${reason}` : ''}. Your account access is paused until it's re-verified by Waseet.`
    : status === 'VERIFIED'
      ? `Your ${label} has been verified. ✓`
      : `Your ${label} is under review.`
  await prisma.notification.create({ data: { userId: doc.userId, type: 'account', title: status === 'REJECTED' ? 'Document rejected' : status === 'VERIFIED' ? 'Document verified' : 'Document under review', body, link: '/realtor/profile', read: false } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.document_status', entity: 'Document', entityId: docId, meta: { status, reason } } })
  return getUserDetail(doc.userId)
}

// fields an admin may edit on any user
const ADMIN_EDITABLE = ['fullName', 'phone', 'country', 'city', 'agency', 'specialization', 'languages', 'experience', 'licenseNumber', 'licenseType', 'licenseExpiry', 'companyName', 'contactName', 'website', 'bio', 'idType', 'idNumber', 'bankName', 'iban', 'avatarKey']

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
    projects: await Promise.all(rows.map(async (p) => ({ id: p.id, title: p.title, developerName: p.developerName, developerId: p.developerId, city: p.city, country: p.country, type: p.type, bedrooms: p.bedrooms, priceFrom: p.priceFrom, priceTo: p.priceTo, commissionPct: p.commissionPct, status: p.status, featured: p.featured, image: await imageUrl(p.imageKey), leadCount: p._count.leads, createdAt: p.createdAt }))),
    counts,
    developers: developers.map((d) => ({ id: d.id, name: d.companyName || d.fullName })),
  }
}

// admin toggles a project's featured flag (max 6 featured in the marketplace rail)
export async function setProjectFeatured(adminId, id, featured) {
  const p = await prisma.project.findUnique({ where: { id } })
  if (!p) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
  if (featured) {
    const cnt = await prisma.project.count({ where: { featured: true } })
    if (!p.featured && cnt >= 6) throw new ApiError(400, 'You can feature up to 6 projects. Unfeature one first.', 'FEATURED_LIMIT')
  }
  await prisma.project.update({ where: { id }, data: { featured: !!featured } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.set_featured', entity: 'Project', entityId: id, meta: { featured: !!featured } } })
  return { id, featured: !!featured }
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

export async function getLeadDetail(id) {
  const l = await prisma.lead.findUnique({ where: { id }, include: { commission: true, project: { select: { imageKey: true } } } })
  if (!l) throw new ApiError(404, 'Lead not found', 'NOT_FOUND')
  return {
    id: l.id, projectName: l.projectName, developerName: l.developerName, realtorName: l.realtorName,
    unit: l.unit, clientName: l.clientName, clientPhone: l.clientPhone, clientEmail: l.clientEmail, budget: l.budget,
    status: l.status, statusHistory: l.statusHistory || null, notes: l.notes, createdAt: l.createdAt, updatedAt: l.updatedAt,
    projectImage: l.project?.imageKey ? await imageUrl(l.project.imageKey) : null,
    commission: l.commission ? { id: l.commission.id, status: l.commission.status, gross: l.commission.gross, net: l.commission.net, platformPct: l.commission.platformPct, dealRef: l.commission.dealRef } : null,
  }
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
  const c = await prisma.commission.findUnique({ where: { id }, include: { realtor: { select: { fullName: true, email: true, bankName: true, iban: true } }, lead: true } })
  if (!c) throw new ApiError(404, 'Commission not found', 'NOT_FOUND')
  const proj = c.projectId ? await prisma.project.findUnique({ where: { id: c.projectId }, select: { imageKey: true } }) : null
  return {
    id: c.id, dealRef: c.dealRef, projectName: c.projectName, developerName: c.developerName, realtorName: c.realtorName,
    realtorEmail: c.realtor?.email, realtorBank: c.realtor?.bankName, realtorIban: c.realtor?.iban,
    unit: c.unit, gross: c.gross, net: c.net, platformPct: c.platformPct, platformFee: c.gross - c.net,
    status: c.status, failureReason: c.failureReason, closedAt: c.closedAt, createdAt: c.createdAt,
    leadId: c.leadId, clientName: c.lead?.clientName || null, clientPhone: c.lead?.clientPhone || null,
    salePrice: c.gross ? Math.round(c.gross / 0.03) : null, leadSubmittedAt: c.lead?.createdAt || null,
    projectImage: proj?.imageKey ? await imageUrl(proj.imageKey) : null,
  }
}

// admin disburses a paid-by-developer commission to the realtor's bank → PAID
export async function disburseCommission(id, adminId) {
  const c = await prisma.commission.findUnique({ where: { id }, include: { realtor: { select: { email: true, fullName: true } } } })
  if (!c) throw new ApiError(404, 'Commission not found', 'NOT_FOUND')
  if (c.status !== 'PROCESSING') throw new ApiError(400, 'Only developer-paid (processing) commissions can be disbursed', 'BAD_STATE')
  await prisma.commission.update({ where: { id }, data: { status: 'PAID' } })
  await prisma.notification.create({ data: { userId: c.realtorId, type: 'commission', title: 'Commission disbursed', body: `${c.dealRef}: SAR ${c.net.toLocaleString()} has been sent to your bank account.`, link: '/realtor/commissions', read: false } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.disburse_commission', entity: 'Commission', entityId: id } })
  sendCommissionDisbursedEmail(c.realtor?.email, { fullName: c.realtor?.fullName, dealRef: c.dealRef, net: c.net }).catch((e) => logger.warn({ err: e?.message }, 'disburse email failed'))
  return getCommissionDetail(id)
}

// ---- withdrawals (admin) ------------------------------------------------------
export async function listWithdrawals({ status } = {}) {
  const where = {}
  if (status) where.status = status
  const rows = await prisma.withdrawal.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300, include: { realtor: { select: { fullName: true, email: true, bankName: true, iban: true } } } })
  const all = await prisma.withdrawal.findMany({ select: { status: true, amount: true } })
  return {
    withdrawals: rows.map((w) => ({ id: w.id, reference: w.reference, amount: w.amount, method: w.method, status: w.status, note: w.note, paidAt: w.paidAt, createdAt: w.createdAt, realtorName: w.realtor?.fullName, realtorEmail: w.realtor?.email, realtorBank: w.realtor?.bankName, realtorIban: w.realtor?.iban })),
    counts: { all: all.length, requested: all.filter((w) => w.status === 'REQUESTED').length, processing: all.filter((w) => w.status === 'PROCESSING').length, paid: all.filter((w) => w.status === 'PAID').length },
    pendingTotal: all.filter((w) => w.status === 'REQUESTED' || w.status === 'PROCESSING').reduce((s, w) => s + w.amount, 0),
  }
}

// admin marks a withdrawal paid → settles it and moves the realtor's developer-paid
// commissions to PAID (they were the source of the available balance)
export async function markWithdrawalPaid(id, adminId) {
  const w = await prisma.withdrawal.findUnique({ where: { id }, include: { realtor: { select: { email: true, fullName: true } } } })
  if (!w) throw new ApiError(404, 'Withdrawal not found', 'NOT_FOUND')
  if (w.status === 'PAID') throw new ApiError(400, 'This withdrawal is already paid', 'ALREADY_PAID')
  await prisma.$transaction([
    prisma.withdrawal.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } }),
    prisma.commission.updateMany({ where: { realtorId: w.realtorId, status: 'PROCESSING' }, data: { status: 'PAID' } }),
  ])
  await prisma.notification.create({ data: { userId: w.realtorId, type: 'commission', title: 'Withdrawal paid', body: `Your withdrawal ${w.reference} of SAR ${w.amount.toLocaleString()} has been paid to your bank.`, link: '/realtor/commissions', read: false } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.withdrawal_paid', entity: 'Withdrawal', entityId: id } })
  sendCommissionDisbursedEmail(w.realtor?.email, { fullName: w.realtor?.fullName, dealRef: w.reference, net: w.amount }).catch((e) => logger.warn({ err: e?.message }, 'withdrawal paid email failed'))
  return { id, status: 'PAID' }
}

export async function rejectWithdrawal(id, adminId, reason) {
  const w = await prisma.withdrawal.findUnique({ where: { id } })
  if (!w) throw new ApiError(404, 'Withdrawal not found', 'NOT_FOUND')
  await prisma.withdrawal.update({ where: { id }, data: { status: 'REJECTED', note: reason || null } })
  await prisma.notification.create({ data: { userId: w.realtorId, type: 'commission', title: 'Withdrawal rejected', body: `Your withdrawal ${w.reference} was not processed${reason ? `: ${reason}` : ''}. The funds remain available in your wallet.`, link: '/realtor/commissions', read: false } })
  await prisma.auditLog.create({ data: { actorId: adminId, action: 'admin.withdrawal_rejected', entity: 'Withdrawal', entityId: id, meta: reason ? { reason } : undefined } })
  return { id, status: 'REJECTED' }
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

export async function createAnnouncement(adminId, { title, body, audience, link }) {
  if (!title?.trim() || !body?.trim()) throw new ApiError(400, 'Title and body are required', 'BAD_INPUT')
  const aud = ['ALL', 'REALTORS', 'DEVELOPERS'].includes(audience) ? audience : 'ALL'
  const roleFilter = aud === 'REALTORS' ? { role: 'REALTOR' } : aud === 'DEVELOPERS' ? { role: 'DEVELOPER' } : { role: { in: ['REALTOR', 'DEVELOPER'] } }
  const recipients = await prisma.user.findMany({ where: { ...roleFilter, status: 'ACTIVE' }, select: { id: true, email: true, fullName: true } })
  const ann = await prisma.announcement.create({ data: { title: title.trim(), body: body.trim(), audience: aud, sentById: adminId, recipients: recipients.length } })
  if (recipients.length) {
    // in-app (browser) notifications
    await prisma.notification.createMany({ data: recipients.map((u) => ({ userId: u.id, type: 'announcement', title: title.trim(), body: body.trim(), link: link?.trim() || '#', read: false })) })
    // emails (best-effort, don't fail the send if SMTP hiccups)
    Promise.allSettled(recipients.map((u) => sendAnnouncementEmail(u.email, { fullName: u.fullName, title: title.trim(), body: body.trim(), link: link?.trim() || null })))
      .then((res) => logger.info({ sent: res.filter((r) => r.status === 'fulfilled').length, total: recipients.length }, '📣 announcement emails dispatched'))
      .catch(() => {})
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
