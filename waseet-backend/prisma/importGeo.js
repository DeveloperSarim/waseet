// One-off importer: pulls the open Saudi "Regions / Cities / Districts" dataset
// and loads every city + district into our DB (sa_cities / sa_districts) so the
// marketplace city/area dropdowns are served from our own database.
//
//   Source: github.com/homaily/Saudi-Arabia-Regions-Cities-and-Districts (MIT)
//   Run:    node --max-old-space-size=4096 --env-file=.env prisma/importGeo.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE = 'https://raw.githubusercontent.com/homaily/Saudi-Arabia-Regions-Cities-and-Districts/master/json'

async function getJson(name) {
  const res = await fetch(`${BASE}/${name}`, { signal: AbortSignal.timeout(120000) })
  if (!res.ok) throw new Error(`${name} → HTTP ${res.status}`)
  return res.json()
}

async function chunkInsert(model, rows, size = 2000) {
  for (let i = 0; i < rows.length; i += size) {
    await model.createMany({ data: rows.slice(i, i + size), skipDuplicates: true })
  }
}

async function main() {
  console.log('⬇️  Downloading Saudi cities + districts…')
  const [cities, districts] = await Promise.all([getJson('cities.json'), getJson('districts.json')])
  console.log(`   cities: ${cities.length}, districts: ${districts.length}`)

  // wipe + reload (idempotent)
  await prisma.saDistrict.deleteMany()
  await prisma.saCity.deleteMany()

  const cityIdsWithDistricts = new Set(districts.map((d) => d.city_id))
  const cityRows = cities.map((c) => ({
    id: c.city_id,
    regionId: c.region_id,
    nameEn: (c.name_en || '').trim() || c.name_ar,
    nameAr: c.name_ar,
    lat: Array.isArray(c.center) ? c.center[0] : null,
    lng: Array.isArray(c.center) ? c.center[1] : null,
    hasDistricts: cityIdsWithDistricts.has(c.city_id),
  }))
  await chunkInsert(prisma.saCity, cityRows)
  console.log(`✅ Imported ${cityRows.length} cities`)

  // keep only districts whose city exists (they all should)
  const validCityIds = new Set(cityRows.map((c) => c.id))
  const distRows = districts
    .filter((d) => validCityIds.has(d.city_id))
    .map((d) => ({ cityId: d.city_id, nameEn: (d.name_en || '').trim() || d.name_ar, nameAr: d.name_ar }))
  await chunkInsert(prisma.saDistrict, distRows)
  console.log(`✅ Imported ${distRows.length} districts (across ${cityIdsWithDistricts.size} cities)`)
}

export { main as importGeo }

// Run standalone only when invoked directly (not when imported by ensure-geo).
if (process.argv[1] && process.argv[1].endsWith('importGeo.js')) {
  main()
    .catch((e) => { console.error('❌ Geo import failed:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}
