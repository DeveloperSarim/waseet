// Idempotent admin bootstrap — runs on every deploy/boot.
// Upserts the super-admin account from env (ADMIN_EMAIL / ADMIN_PASSWORD).
// Safe to run repeatedly; never touches any other data.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@waseet.com').toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'admin1234'
  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // keep it active; only reset the password when ADMIN_PASSWORD was explicitly provided
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', status: 'ACTIVE', ...(process.env.ADMIN_PASSWORD ? { passwordHash, mustChangePassword: false } : {}) },
    })
    console.log(`✅ Admin ensured: ${email} (existing)`)
  } else {
    await prisma.user.create({
      data: { email, passwordHash, role: 'ADMIN', status: 'ACTIVE', fullName: 'Super Admin', emailVerified: true, mustChangePassword: false },
    })
    console.log(`✅ Admin created: ${email}`)
  }
}

main()
  .catch((e) => { console.error('❌ ensure-admin failed:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
