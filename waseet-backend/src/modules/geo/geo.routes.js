import { Router } from 'express'
import { prisma } from '../../lib/prisma.js'

// Public Saudi geography reference API (cities + districts) powering the
// marketplace city/area search dropdowns. Read-only reference data, so it is
// cached in memory for the process lifetime.
export const geoRouter = Router()

let citiesCache = null

// Small transliteration corrections for the open dataset's English names.
const fixEn = (s) => String(s || '').replace(/\bAbhur\b/g, 'Obhur')

async function loadCities() {
  if (citiesCache) return citiesCache
  const rows = await prisma.saCity.findMany({
    orderBy: [{ hasDistricts: 'desc' }, { nameEn: 'asc' }],
    select: { id: true, nameEn: true, nameAr: true, regionId: true, hasDistricts: true },
  })
  // collapse duplicate English city names (keep the first — cities-with-districts rank first)
  const seen = new Set()
  citiesCache = []
  for (const c of rows) {
    const name = fixEn(c.nameEn)
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    citiesCache.push({ id: c.id, name, nameAr: c.nameAr, regionId: c.regionId, hasDistricts: c.hasDistricts })
  }
  return citiesCache
}

// GET /api/v1/geo/cities?q=&limit=  → all Saudi cities (optionally filtered)
geoRouter.get('/cities', async (req, res, next) => {
  try {
    const all = await loadCities()
    const q = String(req.query.q || '').trim().toLowerCase()
    let list = q ? all.filter((c) => c.name.toLowerCase().includes(q) || (c.nameAr || '').includes(q)) : all
    const limit = Math.min(Number(req.query.limit) || list.length, 5000)
    res.json({ cities: list.slice(0, limit), total: list.length })
  } catch (e) { next(e) }
})

// GET /api/v1/geo/cities/:id/districts → districts of a city (deduped by name)
geoRouter.get('/cities/:id/districts', async (req, res, next) => {
  try {
    const cityId = Number(req.params.id)
    if (!Number.isInteger(cityId)) return res.json({ districts: [] })
    const rows = await prisma.saDistrict.findMany({
      where: { cityId },
      orderBy: { nameEn: 'asc' },
      select: { id: true, nameEn: true, nameAr: true },
    })
    // collapse duplicate English names (the dataset has a few) so the dropdown is clean
    const seen = new Set()
    const districts = []
    for (const d of rows) {
      const name = fixEn(d.nameEn)
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      districts.push({ id: d.id, name, nameAr: d.nameAr })
    }
    res.json({ districts })
  } catch (e) { next(e) }
})
