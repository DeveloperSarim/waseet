import { s3, buckets } from './s3.js'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'node:crypto'
import { ApiError } from '../middleware/error.js'
import { config } from '../config/env.js'

// Browser-reachable URL for an object in the PUBLIC bucket (project images, logos,
// brochures, floor plans…). In production the S3 endpoint (`rustfs:9000`) is only
// reachable inside the docker network, so we build a same-origin URL that nginx
// proxies to storage (`STORAGE_PUBLIC_BASE=/storage`). The public bucket is
// anonymous-read, so no signature is needed. In dev (no STORAGE_PUBLIC_BASE) we
// fall back to a short-lived signed URL against the directly-reachable endpoint.
export async function imageUrl(key) {
  if (!key) return null
  if (config.STORAGE_PUBLIC_BASE) {
    return `${config.STORAGE_PUBLIC_BASE.replace(/\/$/, '')}/${buckets.public}/${key}`
  }
  try {
    return await getSignedUrl(s3, new GetObjectCommand({ Bucket: buckets.public, Key: key }), { expiresIn: 3600 })
  } catch {
    return null
  }
}

const mimeFor = (filename) =>
  /\.pdf$/i.test(filename || '') ? 'application/pdf' : /\.(png|jpe?g|webp|gif)$/i.test(filename || '') ? 'image/*' : 'application/octet-stream'

// Resolve a project's gallery, master plan, documents and floor plans (stored as
// object keys inside `details`) into signed URLs — the shape the client renders.
export async function resolveProjectMedia(p) {
  const det = p.details && typeof p.details === 'object' ? p.details : {}

  const galleryKeys = Array.isArray(det.images) && det.images.length ? det.images : p.imageKey ? [p.imageKey] : []
  const images = (await Promise.all(galleryKeys.map(imageUrl))).filter(Boolean)

  const masterPlanUrl = det.masterPlanKey ? await imageUrl(det.masterPlanKey) : null

  const documents =
    det.documents && typeof det.documents === 'object'
      ? (
          await Promise.all(
            Object.entries(det.documents).map(async ([name, d]) => {
              const filename = d?.filename || name
              return { name, filename, size: d?.size ?? null, mimeType: mimeFor(filename), url: d?.key ? await imageUrl(d.key) : null }
            }),
          )
        ).filter((d) => d.url)
      : []

  const floorPlans = Array.isArray(det.floorPlans)
    ? (
        await Promise.all(
          det.floorPlans.map(async (f) => ({
            label: f.label || f.filename || 'Floor Plan',
            filename: f.filename || null,
            size: f.size ?? null,
            mimeType: mimeFor(f.filename),
            url: f.key ? await imageUrl(f.key) : null,
          })),
        )
      ).filter((f) => f.url)
    : []

  return { image: images[0] || null, images, masterPlanUrl, documents, floorPlans }
}

// Upload a project media file (image/PDF) to the public bucket. Shared by the
// developer and admin routes. `owner` is only used to namespace the object key.
export async function uploadProjectMedia(owner, file) {
  if (!file) throw new ApiError(400, 'No file provided', 'NO_FILE')
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']
  if (!ok.includes(file.mimetype)) throw new ApiError(415, 'Only JPG, PNG, WEBP, AVIF or PDF files', 'BAD_TYPE')
  const key = `projects/${owner}/${crypto.randomUUID()}`
  await s3.send(new PutObjectCommand({ Bucket: buckets.public, Key: key, Body: file.buffer, ContentType: file.mimetype }))
  return { key, imageKey: key, url: await imageUrl(key), filename: file.originalname, mimeType: file.mimetype, size: file.size }
}

// Upload a landing-page asset (favicon / app icon / social banner / section image)
// to the public bucket under the `landing/` namespace. Allows icon formats too.
export async function uploadLandingAsset(file) {
  if (!file) throw new ApiError(400, 'No file provided', 'NO_FILE')
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
  if (!ok.includes(file.mimetype)) throw new ApiError(415, 'Only JPG, PNG, WEBP, AVIF, GIF, SVG or ICO images', 'BAD_TYPE')
  const key = `landing/${crypto.randomUUID()}`
  await s3.send(new PutObjectCommand({ Bucket: buckets.public, Key: key, Body: file.buffer, ContentType: file.mimetype }))
  return { key, url: await imageUrl(key), filename: file.originalname, mimeType: file.mimetype, size: file.size }
}

// Upload a profile photo / company logo (image only) to the public bucket.
export async function uploadAvatar(owner, file) {
  if (!file) throw new ApiError(400, 'No file provided', 'NO_FILE')
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  if (!ok.includes(file.mimetype)) throw new ApiError(415, 'Only JPG, PNG, WEBP or AVIF images', 'BAD_TYPE')
  const key = `avatars/${owner}/${crypto.randomUUID()}`
  await s3.send(new PutObjectCommand({ Bucket: buckets.public, Key: key, Body: file.buffer, ContentType: file.mimetype }))
  return { key, url: await imageUrl(key) }
}
