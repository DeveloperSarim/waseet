import * as authService from './auth.service.js'
import { config } from '../../config/env.js'
import { parseDuration } from '../../utils/duration.js'

const COOKIE = 'waseet_rt'
const cookieOptions = () => ({
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
  maxAge: parseDuration(config.JWT_REFRESH_TTL),
})
const setRefreshCookie = (res, token) => res.cookie(COOKIE, token, cookieOptions())
const clearRefreshCookie = (res) => res.clearCookie(COOKIE, { path: '/api/v1/auth' })

// role is bound per-route: registerHandler('REALTOR') / ('DEVELOPER')
export const registerHandler = (role) => async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register({
      role,
      ...req.body,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    })
    setRefreshCookie(res, refreshToken)
    res.status(201).json({ user, accessToken, message: 'Registered successfully. Your account is pending admin approval.' })
  } catch (err) {
    next(err)
  }
}

export async function forgotPasswordHandler(req, res, next) {
  try {
    const result = await authService.requestPasswordReset({ email: req.body.email })
    res.json({
      message: 'If that email is registered, a password reset link has been sent.',
      ...(result.devToken ? { devToken: result.devToken } : {}),
    })
  } catch (err) {
    next(err)
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    await authService.resetPassword(req.body)
    res.json({ message: 'Password reset successfully. You can now sign in.' })
  } catch (err) {
    next(err)
  }
}

export async function loginHandler(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.login({
      ...req.body,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    })
    setRefreshCookie(res, refreshToken)
    res.json({ user, accessToken })
  } catch (err) {
    next(err)
  }
}

export async function refreshHandler(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.refresh({
      rawToken: req.cookies?.[COOKIE],
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    })
    setRefreshCookie(res, refreshToken)
    res.json({ user, accessToken })
  } catch (err) {
    next(err)
  }
}

export async function logoutHandler(req, res, next) {
  try {
    await authService.logout({ rawToken: req.cookies?.[COOKIE] })
    clearRefreshCookie(res)
    res.json({ message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}

export async function meHandler(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id)
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export async function updateMeHandler(req, res, next) {
  try {
    const user = await authService.updateMe(req.user.id, req.body)
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

// authed: upload/replace own profile photo (logo)
export async function avatarHandler(req, res, next) {
  try {
    const user = await authService.setAvatar(req.user.id, req.file)
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

// public: upload a logo during registration (before the account exists)
export async function uploadLogoHandler(req, res, next) {
  try {
    res.json({ result: await authService.uploadRegistrationLogo(req.file) })
  } catch (err) {
    next(err)
  }
}

export async function changePasswordHandler(req, res, next) {
  try {
    await authService.changePassword(req.user.id, req.body)
    res.json({ message: 'Password changed successfully' })
  } catch (err) {
    next(err)
  }
}
