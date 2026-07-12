import * as svc from './documents.service.js'

export async function uploadHandler(req, res, next) {
  try {
    const document = await svc.uploadDocument({ userId: req.user.id, type: req.body.type, file: req.file })
    res.status(201).json({ document })
  } catch (err) {
    next(err)
  }
}

export async function listHandler(req, res, next) {
  try {
    res.json({ documents: await svc.listMyDocuments(req.user.id) })
  } catch (err) {
    next(err)
  }
}

export async function urlHandler(req, res, next) {
  try {
    res.json(await svc.getDocumentUrl({ id: req.params.id, requester: req.user }))
  } catch (err) {
    next(err)
  }
}
