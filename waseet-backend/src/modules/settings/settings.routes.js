import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as svc from './settings.service.js'

export const settingsRouter = Router()
settingsRouter.use(requireAuth, requireRole('ADMIN'))

const h = (fn) => async (req, res, next) => { try { res.json(await fn(req)) } catch (e) { next(e) } }

// settings
settingsRouter.get('/', h((req) => svc.getSettings()))
settingsRouter.patch('/:section', h((req) => svc.updateSection(req.params.section, req.body || {}).then((value) => ({ value }))))
settingsRouter.get('/stats', h((req) => svc.getStats().then((stats) => ({ stats }))))
settingsRouter.get('/developers', h((req) => svc.listDevelopers().then((developers) => ({ developers }))))

// commission overrides
settingsRouter.post('/overrides', h((req) => svc.addOverride(req.user.id, req.body || {}).then((value) => ({ value }))))
settingsRouter.delete('/overrides', h((req) => svc.removeOverride(req.user.id, req.body?.name).then((value) => ({ value }))))
settingsRouter.post('/reset-overrides', h((req) => svc.resetOverrides(req.user.id).then((value) => ({ value }))))

// test email
settingsRouter.post('/test-email', h((req) => svc.sendTestEmail(req.user.id, req.body?.to)))

// backups
settingsRouter.get('/backups', h((req) => svc.listBackups().then((backups) => ({ backups }))))
settingsRouter.post('/backups', h((req) => svc.createBackup(req.user.id, req.body?.note).then((backup) => ({ backup }))))
settingsRouter.post('/backups/:id/restore', h((req) => svc.restoreBackup(req.user.id, req.params.id)))
settingsRouter.delete('/backups/:id', h((req) => svc.deleteBackup(req.user.id, req.params.id)))
settingsRouter.get('/backups/:id/download', async (req, res, next) => {
  try {
    const { path: filePath, filename } = await svc.getBackupPath(req.params.id)
    res.download(filePath, filename)
  } catch (e) { next(e) }
})

// danger zone: export everything
settingsRouter.get('/export', async (req, res, next) => {
  try {
    const data = await svc.exportAll()
    res.setHeader('Content-Disposition', `attachment; filename="waseet-export-${Date.now()}.json"`)
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(data, null, 2))
  } catch (e) { next(e) }
})
