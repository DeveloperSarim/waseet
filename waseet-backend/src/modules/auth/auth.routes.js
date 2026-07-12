import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { validate } from '../../utils/validate.js'
import { requireAuth } from '../../middleware/auth.js'
import { registerSchema, loginSchema, forgotSchema, resetSchema, updateMeSchema, changePasswordSchema } from './auth.schemas.js'
import * as ctrl from './auth.controller.js'

export const authRouter = Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// stricter limit on auth endpoints (brute-force protection)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false })

authRouter.post('/register/realtor', authLimiter, validate(registerSchema), ctrl.registerHandler('REALTOR'))
authRouter.post('/register/developer', authLimiter, validate(registerSchema), ctrl.registerHandler('DEVELOPER'))
authRouter.post('/login', authLimiter, validate(loginSchema), ctrl.loginHandler)
authRouter.post('/forgot-password', authLimiter, validate(forgotSchema), ctrl.forgotPasswordHandler)
authRouter.post('/reset-password', authLimiter, validate(resetSchema), ctrl.resetPasswordHandler)
authRouter.post('/refresh', ctrl.refreshHandler)
authRouter.post('/logout', ctrl.logoutHandler)
authRouter.get('/me', requireAuth, ctrl.meHandler)
authRouter.patch('/me', requireAuth, validate(updateMeSchema), ctrl.updateMeHandler)
authRouter.post('/me/avatar', requireAuth, upload.single('file'), ctrl.avatarHandler)
// public logo upload used by the registration wizard (before the account exists)
authRouter.post('/upload-logo', authLimiter, upload.single('file'), ctrl.uploadLogoHandler)
authRouter.post('/change-password', requireAuth, validate(changePasswordSchema), ctrl.changePasswordHandler)
