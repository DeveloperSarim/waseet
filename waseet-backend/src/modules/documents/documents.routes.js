import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../../middleware/auth.js'
import * as ctrl from './documents.controller.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const DOC_TYPES = ['PROFILE_PHOTO', 'FAL_LICENSE', 'NATIONAL_ID', 'TRADE_LICENSE', 'REGA_CERTIFICATE', 'OTHER']

export const documentsRouter = Router()
documentsRouter.use(requireAuth)

documentsRouter.post(
  '/',
  upload.single('file'),
  (req, res, next) => {
    if (!DOC_TYPES.includes(req.body?.type)) {
      return res.status(422).json({ error: { message: 'Invalid or missing document type', code: 'BAD_TYPE' } })
    }
    next()
  },
  ctrl.uploadHandler,
)
documentsRouter.get('/', ctrl.listHandler)
documentsRouter.get('/:id/url', ctrl.urlHandler)
