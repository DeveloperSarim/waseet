import crypto from 'node:crypto'
import { prisma } from '../../lib/prisma.js'
import { hashPassword, verifyPassword } from '../../utils/password.js'
import { signAccessToken, generateRefreshToken, hashToken } from '../../utils/jwt.js'
import { parseDuration } from '../../utils/duration.js'
import { config } from '../../config/env.js'
import { ApiError } from '../../middleware/error.js'
import { imageUrl, uploadAvatar } from '../../lib/projectMedia.js'

const publicUser = async (u) => ({
  id: u.id,
  avatar: u.avatarKey ? await imageUrl(u.avatarKey) : null,
  role: u.role,
  status: u.status,
  email: u.email,
  fullName: u.fullName,
  phone: u.phone,
  country: u.country,
  city: u.city,
  companyName: u.companyName,
  contactName: u.contactName,
  website: u.website,
  bio: u.bio,
  agency: u.agency,
  specialization: u.specialization,
  languages: u.languages,
  experience: u.experience,
  licenseType: u.licenseType,
  licenseNumber: u.licenseNumber,
  licenseExpiry: u.licenseExpiry,
  idType: u.idType,
  idNumber: u.idNumber,
  bankName: u.bankName,
  iban: u.iban,
  bankCountry: u.bankCountry,
  notificationPrefs: u.notificationPrefs || {},
  emailVerified: u.emailVerified,
  mustChangePassword: u.mustChangePassword,
  lastLoginAt: u.lastLoginAt,
  createdAt: u.createdAt,
})

export async function register({ role, email, fullName, phone, country, city, avatarKey, userAgent, ip,
  contactName, website, agency, specialization, languages, experience, licenseType, licenseNumber, licenseExpiry, idType, idNumber }) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ApiError(409, 'This email is already registered', 'EMAIL_TAKEN')

  // No password yet — set an unguessable placeholder. Admin approval issues a temp password.
  const passwordHash = await hashPassword(crypto.randomBytes(24).toString('hex'))
  const user = await prisma.user.create({
    data: {
      role, email, passwordHash, fullName, phone, country, city, status: 'PENDING',
      avatarKey: avatarKey || null,
      // for developers the display name IS the company name
      companyName: role === 'DEVELOPER' ? fullName : undefined,
      // developer company details
      contactName, website,
      // realtor professional details captured at sign-up
      agency, specialization, languages, experience,
      licenseType, licenseNumber, licenseExpiry, idType, idNumber,
    },
  })
  await prisma.auditLog.create({
    data: { actorId: user.id, action: 'auth.register', entity: 'User', entityId: user.id, meta: { role } },
  })
  // log them in so the wizard can immediately upload documents (still PENDING → portal gated)
  const tokens = await issueTokens(user, { userAgent, ip })
  return { user: await publicUser(user), ...tokens }
}

async function issueTokens(user, { userAgent, ip }) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, status: user.status })
  const refreshToken = generateRefreshToken()
  const expiresAt = new Date(Date.now() + parseDuration(config.JWT_REFRESH_TTL))
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), userAgent, ip, expiresAt },
  })
  return { accessToken, refreshToken }
}

export async function login({ email, password, userAgent, ip }) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new ApiError(401, 'Invalid email or password', 'BAD_CREDENTIALS')
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw new ApiError(401, 'Invalid email or password', 'BAD_CREDENTIALS')

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  const tokens = await issueTokens(user, { userAgent, ip })
  await prisma.auditLog.create({ data: { actorId: user.id, action: 'auth.login', entity: 'User', entityId: user.id, ip } })
  return { user: await publicUser(user), ...tokens }
}

export async function refresh({ rawToken, userAgent, ip }) {
  if (!rawToken) throw new ApiError(401, 'No refresh token', 'NO_REFRESH')
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true },
  })
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Session expired, please sign in again', 'BAD_REFRESH')
  }
  // rotate: revoke old, issue new (refresh-token rotation)
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } })
  const tokens = await issueTokens(stored.user, { userAgent, ip })
  return { user: await publicUser(stored.user), ...tokens }
}

export async function logout({ rawToken }) {
  if (!rawToken) return
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError(404, 'User not found', 'NOT_FOUND')
  return await publicUser(user)
}

// A user uploads / replaces their own profile photo (logo).
export async function setAvatar(userId, file) {
  const { key } = await uploadAvatar(userId, file)
  const user = await prisma.user.update({ where: { id: userId }, data: { avatarKey: key } })
  return await publicUser(user)
}

// Public logo upload used during registration (before the account exists).
export async function uploadRegistrationLogo(file) {
  return uploadAvatar('registration', file)
}

// Whitelisted profile fields a user may edit about themselves. Email/role/status
// are intentionally NOT here — those are identity/admin-controlled.
const EDITABLE = ['fullName', 'phone', 'country', 'city', 'companyName', 'contactName', 'website', 'bio', 'agency', 'specialization', 'languages', 'experience', 'licenseType', 'licenseNumber', 'licenseExpiry', 'idType', 'idNumber', 'bankName', 'iban', 'bankCountry']

// license / ID changes invalidate the prior verification → docs go back to review
const KYC_FIELDS = ['licenseType', 'licenseNumber', 'licenseExpiry', 'idType', 'idNumber']

export async function updateMe(userId, patch) {
  const before = await prisma.user.findUnique({ where: { id: userId } })
  const data = {}
  for (const k of EDITABLE) {
    if (patch[k] !== undefined) data[k] = patch[k]
  }
  if (patch.notificationPrefs !== undefined) {
    data.notificationPrefs = { ...(before?.notificationPrefs || {}), ...patch.notificationPrefs }
  }
  if (Object.keys(data).length === 0) throw new ApiError(400, 'Nothing to update', 'NO_CHANGES')
  const user = await prisma.user.update({ where: { id: userId }, data })
  await prisma.auditLog.create({ data: { actorId: userId, action: 'auth.update_profile', entity: 'User', entityId: userId } })

  // if a KYC field actually changed, send the verified documents back for re-review
  const kycChanged = before && before.role === 'REALTOR' && KYC_FIELDS.some((k) => data[k] !== undefined && data[k] !== before[k])
  if (kycChanged) {
    const { count } = await prisma.document.updateMany({ where: { userId, type: { not: 'PROFILE_PHOTO' }, status: 'VERIFIED' }, data: { status: 'PENDING' } })
    if (count > 0) await prisma.auditLog.create({ data: { actorId: userId, action: 'auth.kyc_changed', entity: 'User', entityId: userId, meta: { docs: count } } })
  }
  return await publicUser(user)
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError(404, 'User not found', 'NOT_FOUND')
  const ok = await verifyPassword(currentPassword, user.passwordHash)
  if (!ok) throw new ApiError(400, 'Current password is incorrect', 'BAD_PASSWORD')
  const passwordHash = await hashPassword(newPassword)
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: false } }),
    // sign out other sessions for safety (current one keeps its short-lived access token)
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.auditLog.create({ data: { actorId: userId, action: 'auth.change_password', entity: 'User', entityId: userId } }),
  ])
  return { ok: true }
}

export async function requestPasswordReset({ email }) {
  const user = await prisma.user.findUnique({ where: { email } })
  // Always respond the same way — don't reveal whether the email exists.
  if (!user) return { ok: true }

  const rawToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } })
  await prisma.passwordReset.create({ data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt } })
  await prisma.auditLog.create({ data: { actorId: user.id, action: 'auth.forgot_password', entity: 'User', entityId: user.id } })

  // TODO(prod): email the reset link. In dev we return the token so it can be tested.
  return { ok: true, devToken: config.NODE_ENV === 'development' ? rawToken : undefined }
}

export async function resetPassword({ token, password }) {
  const record = await prisma.passwordReset.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new ApiError(400, 'This reset link is invalid or has expired', 'BAD_RESET')
  }
  const passwordHash = await hashPassword(password)
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash, mustChangePassword: false } }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // sign out everywhere
    prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.auditLog.create({ data: { actorId: record.userId, action: 'auth.reset_password', entity: 'User', entityId: record.userId } }),
  ])
  return { ok: true }
}
