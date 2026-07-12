import { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'

// S3-compatible client (works with RustFS / MinIO / AWS S3).
export const s3 = new S3Client({
  endpoint: config.S3_ENDPOINT,
  region: config.S3_REGION,
  forcePathStyle: config.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY,
    secretAccessKey: config.S3_SECRET_KEY,
  },
})

export const buckets = {
  public: config.S3_BUCKET_PUBLIC, // project images — public read
  private: config.S3_BUCKET_PRIVATE, // licenses, IDs, bank proofs — signed URLs only
}

// Create the object-storage buckets if they don't exist yet (idempotent, best-effort).
// Runs on boot so a fresh deploy self-provisions storage. The public bucket also gets
// an anonymous read policy so project images load directly in the browser.
export async function ensureBuckets() {
  for (const [kind, name] of [['public', buckets.public], ['private', buckets.private]]) {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: name }))
    } catch {
      try {
        await s3.send(new CreateBucketCommand({ Bucket: name }))
        logger.info(`🪣  Created ${kind} bucket: ${name}`)
      } catch (e) {
        logger.warn(`Could not create ${kind} bucket ${name}: ${e.message}`)
      }
    }
    if (kind === 'public') {
      const policy = {
        Version: '2012-10-17',
        Statement: [{ Sid: 'PublicRead', Effect: 'Allow', Principal: '*', Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${name}/*`] }],
      }
      try { await s3.send(new PutBucketPolicyCommand({ Bucket: name, Policy: JSON.stringify(policy) })) } catch { /* not all backends support policies */ }
    }
  }
}
