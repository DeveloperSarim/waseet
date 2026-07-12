import { Router } from 'express'
import { requireAuth, requireActive } from '../../middleware/auth.js'
import * as svc from './realtor.service.js'

export const realtorRouter = Router()
// all realtor data requires an authenticated, ACTIVE (admin-approved) account
realtorRouter.use(requireAuth, requireActive)

const h = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)) } catch (e) { next(e) }
}

// projects / marketplace
realtorRouter.get('/projects', h((req) => svc.listProjects(req.user.id, req.query).then((projects) => ({ projects }))))
realtorRouter.get('/projects/:id', h((req) => svc.getProject(req.user.id, req.params.id).then((project) => ({ project }))))
realtorRouter.post('/projects/:id/save', h((req) => svc.saveProject(req.user.id, req.params.id)))
realtorRouter.delete('/projects/:id/save', h((req) => svc.unsaveProject(req.user.id, req.params.id)))
realtorRouter.get('/saved', h((req) => svc.listSaved(req.user.id).then((projects) => ({ projects }))))
realtorRouter.get('/marketplace-stats', h((req) => svc.marketplaceStats().then((stats) => ({ stats }))))

// leads
realtorRouter.get('/leads', h((req) => svc.listLeads(req.user.id, req.query).then((leads) => ({ leads }))))
realtorRouter.post('/leads', h((req) => svc.createLead(req.user.id, req.body || {}).then((lead) => ({ lead }))))
realtorRouter.get('/leads/:id', h((req) => svc.getLead(req.user.id, req.params.id).then((lead) => ({ lead }))))

// commissions
realtorRouter.get('/commissions', h((req) => svc.listCommissions(req.user.id, req.query)))
realtorRouter.get('/commissions/:id', h((req) => svc.getCommission(req.user.id, req.params.id).then((commission) => ({ commission }))))

// wallet + withdrawals
realtorRouter.get('/wallet', h((req) => svc.getWallet(req.user.id)))
realtorRouter.post('/withdrawals', h((req) => svc.requestWithdrawal(req.user.id, req.body || {}).then((withdrawal) => ({ withdrawal }))))

// notifications
realtorRouter.get('/notifications', h((req) => svc.listNotifications(req.user.id)))
realtorRouter.post('/notifications/read-all', h((req) => svc.markAllRead(req.user.id)))
realtorRouter.post('/notifications/:id/read', h((req) => svc.markRead(req.user.id, req.params.id)))

// dashboard
realtorRouter.get('/dashboard', h((req) => svc.dashboardSummary(req.user.id)))
