// Import the Saudi cities/districts dataset ONLY if it hasn't been loaded yet.
// Runs on boot so a fresh deploy self-populates the geo tables; a no-op afterwards.
import { PrismaClient } from '@prisma/client'
import { importGeo } from '../prisma/importGeo.js'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.saCity.count()
  if (count > 0) {
    console.log(`🗺️  Geo data already present (${count} cities) — skipping import`)
    return
  }
  console.log('🗺️  No geo data — importing Saudi cities + districts…')
  await importGeo()
}

main()
  .catch((e) => { console.error('⚠️  ensure-geo failed (continuing):', e.message) })
  .finally(() => prisma.$disconnect())
