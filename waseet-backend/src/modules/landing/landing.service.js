import { prisma } from '../../lib/prisma.js'
import { getSection } from '../../lib/settings.js'
import { LANDING_DEFAULTS } from '../../lib/landingDefaults.js'
import { imageUrl } from '../../lib/projectMedia.js'

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

// Deep-merge stored config over the defaults so newly-added default keys always
// appear even if the admin saved an older shape. Arrays are replaced wholesale.
function deepMerge(base, over) {
  if (!isObj(over)) return over === undefined ? base : over
  const out = { ...base }
  for (const k of Object.keys(over)) {
    out[k] = isObj(base?.[k]) && isObj(over[k]) ? deepMerge(base[k], over[k]) : over[k]
  }
  return out
}

// SAR 890K / SAR 1.6M style short money
function shortMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return null
  const v = Number(n)
  if (v >= 1e6) return `${(v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1)}M`
  if (v >= 1e3) { const k = Math.round(v / 1e3); return k >= 1000 ? '1M' : `${k}K` }
  return `${v}`
}
function priceRange(from, to) {
  const a = shortMoney(from)
  const b = shortMoney(to)
  if (a && b) return `SAR ${a} – ${b}`
  if (a) return `SAR ${a}`
  if (b) return `SAR ${b}`
  return null
}

// The merged, image-resolved landing config. `origin` (e.g. https://waseet.sarimtools.com)
// makes image URLs absolute for social/OG use; omit for same-origin relative URLs.
export async function getLandingConfig({ origin = '' } = {}) {
  const stored = await getSection('landing') // shallow-merged defaults+stored
  // clone defaults so per-request in-place resolution can never mutate the shared
  // module-global (which would leak data between concurrent requests)
  const cfg = deepMerge(structuredClone(LANDING_DEFAULTS), stored)

  const abs = (u) => (u && origin && !/^https?:\/\//i.test(u) ? `${origin}${u.startsWith('/') ? '' : '/'}${u}` : u)
  const resolveKey = async (key) => (key ? abs(await imageUrl(key)) : null)
  const resolveImg = async (img) => (isObj(img) && img.key ? { key: img.key, alt: img.alt || '', url: abs(await imageUrl(img.key)) } : { key: '', alt: isObj(img) ? img.alt || '' : '', url: null })

  // resolve SEO image keys → urls
  const seo = cfg.seo || {}
  const [faviconUrl, appleIconUrl, ogImageUrl] = await Promise.all([
    resolveKey(seo.faviconKey),
    resolveKey(seo.appleIconKey),
    resolveKey(seo.ogImageKey),
  ])
  cfg.seo = { ...seo, faviconUrl, appleIconUrl, ogImageUrl }

  // resolve the hero showcase cards' images
  if (Array.isArray(cfg.sections?.hero?.cards)) {
    cfg.sections.hero.cards = await Promise.all(
      cfg.sections.hero.cards.map(async (c) => ({ ...c, image: await resolveImg(c.image) })),
    )
  }
  // resolve the dark-band showcase cards' images
  if (Array.isArray(cfg.sections?.darkBand?.cards)) {
    cfg.sections.darkBand.cards = await Promise.all(
      cfg.sections.darkBand.cards.map(async (c) => ({ ...c, image: await resolveImg(c.image) })),
    )
  }
  // resolve navbar / footer logo images
  if (cfg.navbar) cfg.navbar.logoImage = await resolveImg(cfg.navbar.logoImage)
  if (cfg.footer) cfg.footer.logoImage = await resolveImg(cfg.footer.logoImage)
  // resolve marketplace browse-by-city images
  if (Array.isArray(cfg.marketplace?.cities)) {
    cfg.marketplace.cities = await Promise.all(
      cfg.marketplace.cities.map(async (c) => ({ ...c, image: await resolveImg(c.image) })),
    )
  }

  // populate live/featured project cards from real featured projects
  if (cfg.sections?.liveProjects) {
    cfg.sections.liveProjects.items = await getFeaturedCards({ origin })
  }

  return cfg
}

// Real featured projects (same set as the marketplace "Featured" rail, capped at 6),
// shaped for the landing cards.
export async function getFeaturedCards({ origin = '' } = {}) {
  const rows = await prisma.project.findMany({
    where: { featured: true, status: 'LIVE' },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })
  const abs = (u) => (u && origin && !/^https?:\/\//i.test(u) ? `${origin}${u.startsWith('/') ? '' : '/'}${u}` : u)
  return Promise.all(
    rows.map(async (p) => ({
      id: p.id,
      name: p.title,
      loc: p.location || [p.city, p.country].filter(Boolean).join(', ') || p.city || '',
      price: priceRange(p.priceFrom, p.priceTo),
      comm: `${p.commissionPct}%`,
      image: p.imageKey ? abs(await imageUrl(p.imageKey)) : null,
      badge: 'FEATURED',
    })),
  )
}

// ---- prerender (crawler-safe SEO) --------------------------------------------
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export async function renderPrerender({ origin = '' } = {}) {
  const cfg = await getLandingConfig({ origin })
  const s = cfg.seo || {}
  const hero = cfg.sections?.hero || {}
  const canonical = s.canonicalUrl || `${origin || ''}/`
  const ogImage = s.ogImageUrl || ''
  const title = s.title || 'Waseet'
  const desc = s.description || ''

  const jsonLd = s.structuredData
    ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Waseet',
        url: canonical,
        description: desc,
        ...(ogImage ? { logo: ogImage } : {}),
      })}</script>`
    : ''

  const tags = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(title)}</title>`,
    desc && `<meta name="description" content="${esc(desc)}">`,
    s.keywords && `<meta name="keywords" content="${esc(s.keywords)}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    s.themeColor && `<meta name="theme-color" content="${esc(s.themeColor)}">`,
    s.faviconUrl && `<link rel="icon" href="${esc(s.faviconUrl)}">`,
    s.appleIconUrl && `<link rel="apple-touch-icon" href="${esc(s.appleIconUrl)}">`,
    // Open Graph
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Waseet">`,
    `<meta property="og:title" content="${esc(s.ogTitle || title)}">`,
    `<meta property="og:description" content="${esc(s.ogDescription || desc)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    ogImage && `<meta property="og:image" content="${esc(ogImage)}">`,
    // Twitter
    `<meta name="twitter:card" content="${esc(s.twitterCard || 'summary_large_image')}">`,
    `<meta name="twitter:title" content="${esc(s.ogTitle || title)}">`,
    `<meta name="twitter:description" content="${esc(s.ogDescription || desc)}">`,
    ogImage && `<meta name="twitter:image" content="${esc(ogImage)}">`,
    jsonLd,
    cfg.custom?.headHtml || '',
  ]
    .filter(Boolean)
    .join('\n    ')

  const h1 = `${esc(hero.title || '')} ${esc(hero.highlight || '')}`.trim()
  return `<!doctype html>
<html lang="en">
  <head>
    ${tags}
  </head>
  <body>
    <main>
      <h1>${h1}</h1>
      <p>${esc(hero.subtitle || desc)}</p>
      <p><a href="${esc(hero.primaryBtn?.href || '/register/developer')}">${esc(hero.primaryBtn?.label || 'List your project')}</a>
         <a href="${esc(hero.secondaryBtn?.href || '/register/realtor')}">${esc(hero.secondaryBtn?.label || 'Join as realtor')}</a></p>
    </main>
  </body>
</html>`
}
