import crypto from 'node:crypto'
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prisma } from '../../lib/prisma.js'
import { s3, buckets } from '../../lib/s3.js'
import { ApiError } from '../../middleware/error.js'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'application/pdf'])
const MAX_BYTES = 10 * 1024 * 1024

const safeName = (name) => (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
const publicDoc = (d) => ({ id: d.id, type: d.type, filename: d.filename, size: d.size, status: d.status, createdAt: d.createdAt })

export async function uploadDocument({ userId, type, file }) {
  if (!file) throw new ApiError(400, 'No file provided', 'NO_FILE')
  if (!ALLOWED.has(file.mimetype)) throw new ApiError(415, 'Only JPG, PNG or PDF files are allowed', 'BAD_FILE_TYPE')
  if (file.size > MAX_BYTES) throw new ApiError(413, 'File too large (max 10 MB)', 'FILE_TOO_LARGE')

  const key = `documents/${userId}/${crypto.randomUUID()}-${safeName(file.originalname)}`
  await s3.send(
    new PutObjectCommand({ Bucket: buckets.private, Key: key, Body: file.buffer, ContentType: file.mimetype }),
  )
  const doc = await prisma.document.create({
    data: {
      userId,
      type,
      bucket: buckets.private,
      key,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  })
  return publicDoc(doc)
}

export async function listMyDocuments(userId) {
  const docs = await prisma.document.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return Promise.all(
    docs.map(async (d) => ({
      ...publicDoc(d),
      mimeType: d.mimeType,
      url: await getSignedUrl(s3, new GetObjectCommand({ Bucket: d.bucket, Key: d.key }), { expiresIn: 300 }),
    })),
  )
}

// Signed, short-lived URL to view/download a private document (owner or admin only)
export async function getDocumentUrl({ id, requester }) {
  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) throw new ApiError(404, 'Document not found', 'NOT_FOUND')
  if (requester.role !== 'ADMIN' && doc.userId !== requester.id) {
    throw new ApiError(403, 'You cannot access this document', 'FORBIDDEN')
  }
  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: doc.bucket, Key: doc.key }), { expiresIn: 300 })
  return { url, filename: doc.filename, expiresIn: 300 }
}
