import { verifyAccessToken } from '../utils/jwt.js'

// Requires a valid access token; attaches req.user = { id, role, status }
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required', code: 'NO_TOKEN' } })
  }
  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, role: payload.role, status: payload.status }
    next()
  } catch {
    return res.status(401).json({ error: { message: 'Invalid or expired token', code: 'BAD_TOKEN' } })
  }
}

// Restrict to one or more roles: requireRole('ADMIN'), requireRole('REALTOR','DEVELOPER')
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: { message: 'You do not have access to this resource', code: 'FORBIDDEN' } })
  }
  next()
}

// Gate the portal/marketplace behind admin approval (status must be ACTIVE)
export function requireActive(req, res, next) {
  if (!req.user || req.user.status !== 'ACTIVE') {
    return res.status(403).json({ error: { message: 'Your account is pending admin approval', code: 'NOT_ACTIVE' } })
  }
  next()
}
