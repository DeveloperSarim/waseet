// One-shot migration: import a landing settings value + its image assets into
// THIS environment's DB + object storage. Run inside the target (e.g. prod)
// backend container so it uses that container's DB + S3 credentials.
//
//   node scripts/import-landing.mjs <landing.json> <assetsDir> <manifest.json>
//
// - <landing.json>  : the raw `landing` settings value (object keys, no resolved URLs)
// - <assetsDir>     : folder of image files named by their object-key basename (uuid)
// - <manifest.json> : { "<basename>": "<contentType>", ... }
//
// Idempotent: re-running upserts the same setting and re-puts the same objects.
import fs from 'node:fs'
import path from 'node:path'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '../src/lib/prisma.js'
import { s3, buckets } from '../src/lib/s3.js'

const [landingPath, assetsDir, manifestPath] = process.argv.slice(2)
if (!landingPath || !assetsDir) {
  console.error('usage: node scripts/import-landing.mjs <landing.json> <assetsDir> [manifest.json]')
  process.exit(1)
}

const value = JSON.parse(fs.readFileSync(landingPath, 'utf8'))
const manifest = manifestPath && fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {}

// 1) upsert the landing setting
await prisma.setting.upsert({ where: { key: 'landing' }, update: { value }, create: { key: 'landing', value } })
console.log('✔ landing setting upserted')

// 2) upload the image assets to the public bucket under landing/<basename>
let files = []
try { files = fs.readdirSync(assetsDir).filter((f) => !f.startsWith('.')) } catch { /* no assets dir */ }
for (const f of files) {
  const body = fs.readFileSync(path.join(assetsDir, f))
  const ContentType = manifest[f] || 'application/octet-stream'
  const Key = `landing/${f}`
  await s3.send(new PutObjectCommand({ Bucket: buckets.public, Key, Body: body, ContentType }))
  console.log(`✔ uploaded ${Key} (${ContentType}, ${body.length} bytes)`)
}
console.log(`Done — ${files.length} asset(s) imported.`)
await prisma.$disconnect()
process.exit(0)
