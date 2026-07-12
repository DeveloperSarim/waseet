import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { config } from '../config/env.js'

// Access token = short-lived JWT (carries id/role/status)
export function signAccessToken(payload) {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: config.JWT_ACCESS_TTL })
}
export function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_ACCESS_SECRET)
}

// Refresh token = opaque random string; only its SHA-256 hash is stored in DB (revocable)
export function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex')
}
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
