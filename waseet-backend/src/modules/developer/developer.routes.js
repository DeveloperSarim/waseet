import { Router } from 'express'
import multer from 'multer'
import { requireAuth, requireActive, requireRole } from '../../middleware/auth.js'
import * as svc from './developer.service.js'

export const developerRouter = Router()
developerRouter.use(requireAuth, requireActive, requireRole('DEVELOPER'))

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
const h = (fn) => async (req, res, next) => { try { res.json(await fn(req)) } catch (e) { next(e) } }

// projects
developerRouter.get('/projects', h((req) => svc.listProjects(req.user.id).then((projects) => ({ projects }))))
developerRouter.post('/projects', h((req) => svc.createProject(req.user.id, req.body || {}).then((project) => ({ project }))))
developerRouter.post('/projects/image', upload.single('file'), h((req) => svc.uploadProjectFile(req.user.id, req.file)))
developerRouter.post('/projects/file', upload.single('file'), h((req) => svc.uploadProjectFile(req.user.id, req.file)))
developerRouter.get('/projects/:id', h((req) => svc.getProject(req.user.id, req.params.id).then((project) => ({ project }))))
developerRouter.patch('/projects/:id', h((req) => svc.updateProject(req.user.id, req.params.id, req.body || {}).then((project) => ({ project }))))
developerRouter.delete('/projects/:id', h((req) => svc.deleteProject(req.user.id, req.params.id)))

// leads
developerRouter.get('/leads', h((req) => svc.listLeads(req.user.id, req.query).then((leads) => ({ leads }))))
developerRouter.get('/leads/:id', h((req) => svc.getLead(req.user.id, req.params.id).then((lead) => ({ lead }))))
developerRouter.patch('/leads/:id', h((req) => svc.updateLeadStatus(req.user.id, req.params.id, req.body?.status).then((lead) => ({ lead }))))
developerRouter.post('/leads/:id/close', h((req) => svc.closeDeal(req.user.id, req.params.id, req.body || {})))

// commissions
developerRouter.get('/commissions', h((req) => svc.listCommissions(req.user.id, req.query)))
developerRouter.post('/commissions/:id/pay', h((req) => svc.payCommission(req.user.id, req.params.id)))
developerRouter.post('/commissions/:id/mark-failed', h((req) => svc.markCommissionFailed(req.user.id, req.params.id, req.body?.reason)))

// disputes
developerRouter.get('/disputes', h((req) => svc.listDisputes(req.user.id).then((disputes) => ({ disputes }))))
developerRouter.post('/disputes', h((req) => svc.createDispute(req.user.id, req.body || {}).then((dispute) => ({ dispute }))))

// network / analytics / dashboard
developerRouter.get('/network', h((req) => svc.network(req.user.id).then((realtors) => ({ realtors }))))
developerRouter.get('/analytics', h((req) => svc.analytics(req.user.id)))
developerRouter.get('/dashboard', h((req) => svc.dashboard(req.user.id)))

// notifications
developerRouter.get('/notifications', h((req) => svc.listNotifications(req.user.id)))
developerRouter.post('/notifications/read-all', h((req) => svc.markAllRead(req.user.id)))
developerRouter.post('/notifications/:id/read', h((req) => svc.markRead(req.user.id, req.params.id)))
