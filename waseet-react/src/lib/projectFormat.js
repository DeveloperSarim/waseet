// Shared formatting + filter/sort helpers for the real project shape returned by
// realtorApi.listProjects(). Used by the marketplace, listing (/browse) and the
// dedicated map-search page so every surface renders identical, honest data.
import { countryName } from './adminFormat'

const cur = (code) => (code === 'AE' ? 'AED' : code === 'PK' ? 'PKR' : 'SAR')

// "SAR 650,000 – 1,200,000" / "From SAR 650,000" / "—"
export const fmtPriceRange = (p) => {
  const c = cur(p.country)
  if (p.priceFrom != null && p.priceTo != null && p.priceTo > p.priceFrom) return `${c} ${p.priceFrom.toLocaleString()} – ${p.priceTo.toLocaleString()}`
  if (p.priceFrom != null && p.priceFrom > 0) return `From ${c} ${p.priceFrom.toLocaleString()}`
  if (p.priceTo != null && p.priceTo > 0) return `Up to ${c} ${p.priceTo.toLocaleString()}`
  return 'Price on request'
}

// The lowest price value (for "Price: Low to High" sorting).
export const priceValue = (p) => (p.priceFrom != null && p.priceFrom > 0 ? p.priceFrom : p.priceTo != null && p.priceTo > 0 ? p.priceTo : Number.MAX_SAFE_INTEGER)

// Bedroom range derived from the unit mix ("1BR, 2BR, 3BR" -> "1–3 BR").
export const bedText = (p) => {
  const units = Array.isArray(p.details?.units) ? p.details.units : []
  const nums = []
  const src = units.length ? units.map((u) => u.type).filter(Boolean) : String(p.bedrooms || '').split(',')
  for (const t of src) {
    if (/studio/i.test(t)) nums.push(0)
    const m = String(t).match(/\d+/)
    if (m) nums.push(Number(m[0]))
  }
  if (!nums.length) return null
  const lo = Math.min(...nums), hi = Math.max(...nums)
  const lbl = (n) => (n === 0 ? 'Studio' : `${n} BR`)
  return lo === hi ? lbl(lo) : `${lo === 0 ? 'Studio' : lo}–${hi} BR`
}

// Size range across unit types ("85–140 m²").
export const sizeText = (p) => {
  const units = Array.isArray(p.details?.units) ? p.details.units : []
  const sizes = []
  for (const u of units) {
    const a = Number(u.sizeMin), b = Number(u.sizeMax)
    if (a) sizes.push(a)
    if (b) sizes.push(b)
  }
  if (!sizes.length) return null
  const lo = Math.min(...sizes), hi = Math.max(...sizes)
  return lo === hi ? `${lo} m²` : `${lo}–${hi} m²`
}

// Number of distinct unit types (a useful "types" count for the sidebar).
export const unitTypeCount = (p) => (Array.isArray(p.details?.units) ? p.details.units.filter((u) => u.type).length : 0)

export const projLoc = (p) => {
  const parts = [p.location && p.location !== p.city ? p.location : null, p.city].filter(Boolean)
  const base = parts.length ? parts.join(', ') : p.city || '—'
  return p.country ? `${base} · ${countryName(p.country)}` : base
}

export const commissionLabel = (p) => (p.commissionPct != null ? `${p.commissionPct}% Commission` : null)

// ---- filtering ---------------------------------------------------------------
// Apply the marketplace filter params (from the URL) against a project.
export function matchesFilters(p, f) {
  if (f.city && f.city !== 'All cities' && p.city !== f.city) return false
  if (f.cat && f.cat !== 'All projects') {
    const needle = f.cat.toLowerCase().replace(/s$/, '')
    if (!(p.type && p.type.toLowerCase().includes(needle))) return false
  }
  if (f.commission) {
    const min = Number(f.commission)
    if (!(p.commissionPct != null && p.commissionPct >= min)) return false
  }
  if (f.price && f.price !== 'any') {
    const from = p.priceFrom
    if (from == null) return false
    if (f.price === 'u1' && !(from < 1000000)) return false
    if (f.price === '1-5' && !(from >= 1000000 && from <= 5000000)) return false
    if (f.price === '5p' && !(from > 5000000)) return false
  }
  if (f.q) {
    const q = f.q.toLowerCase()
    const hay = `${p.title || ''} ${p.developerName || ''} ${p.city || ''} ${p.location || ''}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

// ---- sorting -----------------------------------------------------------------
export const SORT_OPTS = ['Newest first', 'Commission: High to Low', 'Price: Low to High', 'Price: High to Low']

export function sortProjects(list, sort) {
  const arr = [...list]
  switch (sort) {
    case 'Commission: High to Low':
      return arr.sort((a, b) => (b.commissionPct || 0) - (a.commissionPct || 0))
    case 'Price: Low to High':
      return arr.sort((a, b) => priceValue(a) - priceValue(b))
    case 'Price: High to Low':
      return arr.sort((a, b) => priceValue(b) - priceValue(a))
    case 'Newest first':
    default:
      return arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }
}
