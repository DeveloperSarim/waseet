import { Router } from 'express'
import multer from 'multer'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as svc from './admin.service.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireRole('ADMIN'))

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// GET /api/v1/admin/users?status=PENDING&role=REALTOR
adminRouter.get('/users', async (req, res, next) => {
  try {
    res.json({ users: await svc.listUsers({ status: req.query.status, role: req.query.role }) })
  } catch (e) {
    next(e)
  }
})

// GET /api/v1/admin/users/:id — full profile + documents (signed URLs)
adminRouter.get('/users/:id', async (req, res, next) => {
  try {
    res.json({ user: await svc.getUserDetail(req.params.id) })
  } catch (e) {
    next(e)
  }
})

adminRouter.post('/users/:id/approve', async (req, res, next) => {
  try {
    res.json({ result: await svc.approveUser(req.params.id, req.user.id) })
  } catch (e) {
    next(e)
  }
})

adminRouter.post('/users/:id/reject', async (req, res, next) => {
  try {
    res.json({ result: await svc.rejectUser(req.params.id, req.user.id, req.body?.reason) })
  } catch (e) {
    next(e)
  }
})

// edit a user's profile (admin)
adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    res.json({ user: await svc.adminUpdateUser(req.params.id, req.user.id, req.body || {}) })
  } catch (e) { next(e) }
})

// deactivate / reactivate / delete
adminRouter.post('/users/:id/suspend', async (req, res, next) => {
  try { res.json({ result: await svc.suspendUser(req.params.id, req.user.id, req.body?.reason) }) } catch (e) { next(e) }
})
adminRouter.post('/users/:id/reactivate', async (req, res, next) => {
  try { res.json({ result: await svc.reactivateUser(req.params.id, req.user.id) }) } catch (e) { next(e) }
})
// ban (with optional duration in days), admin-triggered password reset, avatar upload
adminRouter.post('/users/:id/ban', async (req, res, next) => {
  try { res.json({ result: await svc.banUser(req.params.id, req.user.id, req.body || {}) }) } catch (e) { next(e) }
})
adminRouter.post('/users/:id/password-reset', async (req, res, next) => {
  try { res.json({ result: await svc.sendPasswordReset(req.params.id, req.user.id) }) } catch (e) { next(e) }
})
adminRouter.post('/users/:id/avatar', upload.single('file'), async (req, res, next) => {
  try { res.json({ result: await svc.uploadUserAvatar(req.params.id, req.user.id, req.file) }) } catch (e) { next(e) }
})
adminRouter.delete('/users/:id', async (req, res, next) => {
  try { res.json({ result: await svc.deleteUser(req.params.id, req.user.id) }) } catch (e) { next(e) }
})

// send a direct email to a user
adminRouter.post('/users/:id/email', async (req, res, next) => {
  try { res.json({ result: await svc.emailUser(req.params.id, req.user.id, req.body || {}) }) } catch (e) { next(e) }
})

// verify / reject a KYC document (reject suspends an active realtor)
adminRouter.post('/documents/:id/status', async (req, res, next) => {
  try { res.json({ user: await svc.setDocumentStatus(req.params.id, req.user.id, req.body?.status, req.body?.reason) }) } catch (e) { next(e) }
})

// ---- dashboard + domain screens ----
const H = (fn) => async (req, res, next) => { try { res.json(await fn(req)) } catch (e) { next(e) } }

adminRouter.get('/dashboard', H((req) => svc.adminDashboard()))

adminRouter.get('/projects', H((req) => svc.listProjects(req.query)))
adminRouter.post('/projects/image', upload.single('file'), H((req) => svc.uploadProjectFile(req.user.id, req.file)))
// landing-page asset upload (favicon / app icon / social banner / section image) → { key, url }
adminRouter.post('/landing/asset', upload.single('file'), H((req) => svc.uploadLandingFile(req.user.id, req.file)))
adminRouter.get('/projects/:id', H((req) => svc.getProjectDetail(req.params.id).then((project) => ({ project }))))
adminRouter.patch('/projects/:id', H((req) => svc.updateProject(req.user.id, req.params.id, req.body || {}).then((project) => ({ project }))))
adminRouter.post('/projects/:id/status', H((req) => svc.setProjectStatus(req.user.id, req.params.id, req.body?.status).then((r) => ({ result: r }))))
adminRouter.post('/projects/:id/feature', H((req) => svc.setProjectFeatured(req.user.id, req.params.id, req.body?.featured).then((r) => ({ result: r }))))

adminRouter.get('/leads', H((req) => svc.listLeads(req.query).then((leads) => ({ leads }))))
adminRouter.get('/leads/:id', H((req) => svc.getLeadDetail(req.params.id).then((lead) => ({ lead }))))

adminRouter.get('/commissions', H((req) => svc.listCommissions(req.query)))
adminRouter.get('/commissions/:id', H((req) => svc.getCommissionDetail(req.params.id).then((commission) => ({ commission }))))
adminRouter.post('/commissions/:id/disburse', H((req) => svc.disburseCommission(req.params.id, req.user.id).then((commission) => ({ commission }))))

// withdrawals
adminRouter.get('/withdrawals', H((req) => svc.listWithdrawals(req.query)))
adminRouter.post('/withdrawals/:id/mark-paid', H((req) => svc.markWithdrawalPaid(req.params.id, req.user.id).then((result) => ({ result }))))
adminRouter.post('/withdrawals/:id/reject', H((req) => svc.rejectWithdrawal(req.params.id, req.user.id, req.body?.reason).then((result) => ({ result }))))

adminRouter.get('/disputes', H((req) => svc.listDisputes(req.query)))
adminRouter.get('/disputes/:id', H((req) => svc.getDisputeDetail(req.params.id).then((dispute) => ({ dispute }))))
adminRouter.post('/disputes/:id/resolve', H((req) => svc.resolveDispute(req.user.id, req.params.id, req.body || {}).then((r) => ({ result: r }))))

adminRouter.get('/announcements', H((req) => svc.listAnnouncements().then((announcements) => ({ announcements }))))
adminRouter.post('/announcements', H((req) => svc.createAnnouncement(req.user.id, req.body || {}).then((r) => ({ result: r }))))
adminRouter.delete('/announcements', H((req) => svc.clearAnnouncements(req.user.id)))

adminRouter.get('/email-templates', H((req) => svc.getEmailTemplates().then((templates) => ({ templates }))))
adminRouter.patch('/email-templates/:key', H((req) => svc.updateEmailTemplate(req.user.id, req.params.key, req.body || {}).then((templates) => ({ templates }))))
