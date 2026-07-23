# Landing Page Customize — Admin CMS + SEO

**Date:** 2026-07-23
**Status:** Approved (design)

## Goal
Give the admin a **"Landing Page"** screen to manage the homepage (`/`, `Landing.jsx`):
content, images (with alt text), per-section show/hide, per-button show/hide, SEO meta
(title/description/favicon/app-icon/social-banner/link-preview), and custom JS/HTML/CSS —
all SEO-safe and functional. Scope = **homepage only**; "Core content + toggles" granularity;
**crawler-safe** SEO; live cards driven by **real featured projects**.

## Data model — one `landing` settings section
Added to `SETTINGS_DEFAULTS` in `waseet-backend/src/lib/settings.js`, stored per-key in the
`settings` table (no migration). **Defaults mirror the current landing content**, so the page
is visually identical until the admin edits. Shape:

```
landing: {
  seo: { title, description, keywords, canonicalUrl, themeColor,
         faviconKey, appleIconKey,
         ogTitle, ogDescription, ogImageKey,      // link-preview banner
         twitterCard, structuredData: true },
  sections: {                                       // EVERY section has `visible: true`
    hero:      { visible, badgeText, title, highlight, subtitle, citiesLine,
                 checkLines[], primaryBtn{label,href,visible}, secondaryBtn{label,href,visible} },
    stats:     { visible, items:[{value,label}] },
    forWho:    { visible, eyebrow, heading, developer{tag,title,body,points[],cta,href},
                 realtor{...} },
    liveProjects:  { visible, eyebrow, heading, source:'featured' },
    howItWorksSticky: { visible, eyebrow, steps:[{n,title,body,rail}] },
    darkBand:  { visible, badge, heading, body, primaryBtn{...}, secondaryBtn{...} },
    howItWorks3:  { visible, eyebrow, heading, steps:[{title,body}], primaryBtn, secondaryBtn },
    saudiMarket:  { visible, badge, heading, body, stats:[{value,label}], primaryBtn, secondaryBtn },
    whyWaseet: { visible, eyebrow, heading, cards:[{title,body}] },
    browseType:{ visible, heading, types:[{name,count}] },
    badges:    { visible, eyebrow, heading, body, cta, href, items:[{icon,name,req,perk}] },
    reviews:   { visible, heading, items:[{quote,name,role,initials}] },
    trust:     { visible, eyebrow, heading, cards:[{title,body}] },
    faq:       { visible, heading, items:[{q,a}] },
    finalCta:  { visible, heading, subtitle, primaryBtn, secondaryBtn, footnote }
  },
  custom: { css, headHtml, bodyHtml, js }           // admin-only, injected as-is
}
```
Image fields are `{ key, alt }`. Icon SVG `d` paths stay in code (keyed by section), not editable.

## Backend
- `settings.js`: add `landing` default (above). `getSection('landing')` merges over defaults.
- `settings.service.js`: add `'landing'` to `SECTION_KEYS` → existing `PATCH /admin/settings/landing` works.
- **New module** `modules/landing/` (`landing.service.js`, `landing.routes.js`):
  - `GET /api/v1/landing` (public, no auth) → resolved config: image `key`s → `/storage` URLs via
    `imageUrl()`, and `liveProjects.items` populated from
    `prisma.project.findMany({ where:{ featured:true, status:'LIVE' }, take:6 })`, each shaped
    `{ id, name, loc, price, comm, image, badge }`.
  - `GET /api/v1/landing/prerender` (public) → minimal HTML doc with all `<meta>` (title,
    description, canonical, OG, Twitter, favicon) + JSON-LD baked from `seo`, plus `custom.headHtml`.
    Served to social crawlers (see nginx).
- **Admin asset upload**: `adminRouter.post('/landing/asset', upload.single('file'), …)` reusing the
  `uploadProjectMedia` helper (public bucket, `landing/` namespace) → `{ key, url }`.
- Register `app.use('/api/v1/landing', landingRouter)` in `app.js` (public, no maintenance guard).

## Crawler-safe SEO
SPA JS can't feed link-preview crawlers (they don't run JS). Two layers:
- **Browsers + Google:** a `SeoHead` helper on `Landing.jsx` sets `document.title`, meta description,
  OG/Twitter tags, favicon, apple-touch-icon, theme-color, and injects JSON-LD at runtime from `seo`.
- **Social/no-JS crawlers:** `nginx.conf` gets `map $http_user_agent $wa_is_bot` (facebookexternalhit,
  Twitterbot, WhatsApp, LinkedInBot, Slackbot, TelegramBot, Discordbot, Googlebot, bingbot, …). In
  `location = /`, bots `proxy_pass` to `backend:19000/api/v1/landing/prerender`; humans get the SPA
  untouched. Fully dynamic — admin edits reflect immediately, no rebuild.
- `index.html` gains sane baseline `<meta>` (description, OG defaults, theme-color) as a static floor.

## Admin page `/admin/landing` — `AdminLanding.jsx`
Three tabs, matching existing admin styling (dark theme tokens, cards):
- **Sections** — each section = collapsible card with a **show/hide** switch, its text fields,
  add/remove **repeaters** (stats, cards, FAQ, reviews, badges), image upload + **alt text**, and
  per-**button** `label + link + show/hide`.
- **SEO & Social** — title, description, keywords, canonical, favicon + app-icon upload, **OG banner
  upload with a live "how the shared link looks" preview card**, OG/Twitter title/description, theme
  color, structured-data toggle. Live character counters for title/description.
- **Custom Code** — 4 editors (CSS, head HTML, body HTML, JS) with an "admin-only, injected as-is"
  warning. Save via `PATCH /admin/settings/landing`.

Nav: add `{ label: 'Landing Page', to: '/admin/landing', d: D.layout }` under **Platform** in
`config/nav.js` (+ new `layout` icon path). Route in `App.jsx` under the admin `PortalLayout`.
`api.js`: `landingApi.get()` (public) + `adminApi.getLanding()/saveLanding(patch)/uploadLandingAsset(file)`.

## Landing.jsx — config-driven, safe
Fetch `GET /api/v1/landing` on mount; render each section from config, honoring `visible` and button
toggles; decorative sub-components (floating cards, laptop mockup, marquee visuals) stay, but the live
cards render **real featured projects**. **On fetch failure, fall back to the current hardcoded
content** so the page can never break. Custom code injected on mount: CSS→`<style>`, head/body HTML→raw
containers, JS→a real `<script>` node (innerHTML won't execute) with cleanup on unmount.

## Security
Custom JS/HTML/CSS is an intentional injection surface — **admin-only** (write path behind
`requireRole('ADMIN')`). The public `GET /api/v1/landing` returns the same custom code for rendering;
that is by design (it's the admin's own site chrome), documented here.

## Out of scope
Editing decorative animations/icons; multiple/other marketing pages (only `/` for now); A/B testing;
draft-vs-publish workflow (saves are live).
