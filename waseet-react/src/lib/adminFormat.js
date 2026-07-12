// Shared helpers for turning a backend User (from GET /admin/users) into the
// shapes the admin tables/detail pages expect. Keeps the mapping honest:
// fields the DB doesn't have yet (license, badge, leads, deals…) render as "—".

export const STATUS_CAT = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  REJECTED: 'Rejected',
}

const COUNTRY = {
  SA: { flag: '🇸🇦', code: 'SA', name: 'Saudi Arabia' },
  AE: { flag: '🇦🇪', code: 'UAE', name: 'UAE' },
  PK: { flag: '🇵🇰', code: 'PK', name: 'Pakistan' },
}

export const countryFlag = (c) => (c && COUNTRY[c] ? `${COUNTRY[c].flag} ${COUNTRY[c].code}` : '—')
export const countryName = (c) => (c && COUNTRY[c] ? `${COUNTRY[c].flag} ${COUNTRY[c].name}` : '—')

export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function joinedLabel(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const day = Math.floor(diff / 86400000)
  if (day <= 0) return 'Today'
  if (day === 1) return '1 day ago'
  if (day < 30) return `${day} days ago`
  const mo = Math.floor(day / 30)
  if (mo === 1) return '1 month ago'
  if (mo < 12) return `${mo} months ago`
  const yr = Math.floor(mo / 12)
  return yr === 1 ? '1 year ago' : `${yr} years ago`
}

// count how many users fall in each status bucket (+ All)
export function statusCounts(users) {
  const c = { All: users.length, Pending: 0, Active: 0, Suspended: 0, Rejected: 0 }
  for (const u of users) {
    const cat = STATUS_CAT[u.status]
    if (cat) c[cat] += 1
  }
  return c
}
