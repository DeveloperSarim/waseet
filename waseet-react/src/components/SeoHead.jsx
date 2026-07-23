import { useEffect } from 'react'

// Runtime <head> manager for the landing page: sets title, meta description,
// Open Graph / Twitter tags, favicon + apple-touch-icon, theme-color and JSON-LD
// from the admin-managed SEO config — and injects the admin's custom CSS / head
// HTML / JS. This covers browsers and JS-rendering crawlers (Google/Bing).
// No-JS social crawlers are served the backend prerender by nginx.
//
// Anything this component *creates* is tagged data-wa-seo and removed on unmount so
// it doesn't leak into other SPA routes; existing icon links are updated in place.
const abs = (u) => {
  if (!u) return u
  if (/^https?:\/\//i.test(u)) return u
  try { return `${window.location.origin}${u.startsWith('/') ? '' : '/'}${u}` } catch { return u }
}

export function SeoHead({ seo = {}, custom = {} }) {
  useEffect(() => {
    const created = []
    const prevTitle = document.title

    const meta = (attr, key, content) => {
      if (content == null || content === '') return
      // update a baseline tag from index.html in place (avoids duplicate meta tags);
      // only create + track a new one when none exists
      let el = document.head.querySelector(`meta[${attr}="${key}"]`)
      if (el) { el.setAttribute('content', content); return }
      el = document.createElement('meta')
      el.setAttribute(attr, key)
      el.setAttribute('content', content)
      el.setAttribute('data-wa-seo', '1')
      document.head.appendChild(el)
      created.push(el)
    }
    const icon = (rel, href) => {
      if (!href) return
      let el = document.head.querySelector(`link[rel="${rel}"]`)
      if (el) { el.setAttribute('href', href); return } // update baseline in place
      el = document.createElement('link')
      el.setAttribute('rel', rel)
      el.setAttribute('href', href)
      el.setAttribute('data-wa-seo', '1')
      document.head.appendChild(el)
      created.push(el)
    }

    // clear any stale tags we previously created (hot updates / re-render)
    document.head.querySelectorAll('[data-wa-seo]').forEach((e) => e.remove())

    const title = seo.title || 'Waseet · وسيط'
    const desc = seo.description || ''
    const ogImg = abs(seo.ogImageUrl)
    const canonical = seo.canonicalUrl || (typeof window !== 'undefined' ? `${window.location.origin}/` : '')

    document.title = title
    meta('name', 'description', desc)
    meta('name', 'keywords', seo.keywords)
    meta('name', 'theme-color', seo.themeColor)
    icon('icon', abs(seo.faviconUrl))
    icon('apple-touch-icon', abs(seo.appleIconUrl))

    // canonical
    if (canonical) {
      const link = document.createElement('link')
      link.setAttribute('rel', 'canonical'); link.setAttribute('href', canonical); link.setAttribute('data-wa-seo', '1')
      document.head.appendChild(link); created.push(link)
    }

    // Open Graph
    meta('property', 'og:type', 'website')
    meta('property', 'og:site_name', 'Waseet')
    meta('property', 'og:title', seo.ogTitle || title)
    meta('property', 'og:description', seo.ogDescription || desc)
    meta('property', 'og:url', canonical)
    meta('property', 'og:image', ogImg)
    // Twitter
    meta('name', 'twitter:card', seo.twitterCard || 'summary_large_image')
    meta('name', 'twitter:title', seo.ogTitle || title)
    meta('name', 'twitter:description', seo.ogDescription || desc)
    meta('name', 'twitter:image', ogImg)

    // JSON-LD structured data
    if (seo.structuredData !== false) {
      const s = document.createElement('script')
      s.type = 'application/ld+json'
      s.setAttribute('data-wa-seo', '1')
      s.textContent = JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Organization',
        name: 'Waseet', url: canonical, description: desc, ...(ogImg ? { logo: ogImg } : {}),
      })
      document.head.appendChild(s); created.push(s)
    }

    // ---- custom code (admin-authored, injected as-is) ----
    if (custom.css) {
      const st = document.createElement('style')
      st.setAttribute('data-wa-seo', '1'); st.textContent = custom.css
      document.head.appendChild(st); created.push(st)
    }
    if (custom.headHtml) {
      const wrap = document.createElement('div')
      wrap.innerHTML = custom.headHtml
      Array.from(wrap.childNodes).forEach((n) => {
        // recreate <script> nodes so they execute
        if (n.tagName === 'SCRIPT') {
          const sc = document.createElement('script')
          for (const a of n.attributes) sc.setAttribute(a.name, a.value)
          sc.textContent = n.textContent
          sc.setAttribute('data-wa-seo', '1')
          document.head.appendChild(sc); created.push(sc)
        } else {
          if (n.setAttribute) n.setAttribute('data-wa-seo', '1')
          document.head.appendChild(n); created.push(n)
        }
      })
    }
    if (custom.js) {
      const sc = document.createElement('script')
      sc.setAttribute('data-wa-seo', '1'); sc.textContent = custom.js
      document.body.appendChild(sc); created.push(sc)
    }

    return () => {
      document.title = prevTitle
      created.forEach((e) => { try { e.remove() } catch { /* ignore */ } })
    }
  }, [JSON.stringify(seo), JSON.stringify(custom)])

  return null
}

export default SeoHead
