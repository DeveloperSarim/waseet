import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { useHover } from '../../hooks/useHover'
import { Icon } from '../../components/icons/Icon'
import { SeoHead } from '../../components/SeoHead'
import { landingApi } from '../../lib/api'

/* ============================================================================
 * The landing page is admin-editable (Admin → Landing Page). Content, section
 * visibility, buttons, SEO and custom code all come from GET /api/v1/landing.
 * FALLBACK below mirrors the backend defaults so the page renders instantly and
 * still works if the API is unavailable. Icons/animations stay in code.
 * ========================================================================== */

const FALLBACK = {
  seo: {
    title: 'Waseet · وسيط — Private Real-Estate Marketplace for Saudi Arabia',
    description: 'Waseet connects verified property developers with licensed realtors across Saudi Arabia, with every commission shown upfront.',
    keywords: 'Saudi real estate, off-plan projects, realtor commission, property developers, Riyadh, Jeddah',
    themeColor: '#16A34A', structuredData: true, twitterCard: 'summary_large_image',
    ogTitle: 'Waseet — The Private Marketplace Where Developers Meet Their Best Realtors',
    ogDescription: 'Verified developers, licensed realtors, commission shown upfront. Real estate across Saudi Arabia.',
  },
  sections: {
    hero: {
      visible: true, badgeText: 'Private · Verified · Commission-first',
      title: 'The Private Marketplace Where Developers Meet Their Best', highlight: 'Realtors.',
      subtitle: 'Waseet connects verified property developers with licensed realtors across Saudi Arabia, with every commission shown upfront.',
      citiesLine: 'Jeddah · Riyadh · Dammam · Mecca · Medina · Khobar',
      checkLines: ['Verified developers only', 'Licensed realtors', 'Commission protected', '24hr approval'],
      cards: [
        { name: 'Olaya Park Towers', loc: 'Al Olaya, Riyadh', price: 'SAR 890K – 5.6M', comm: '4% Commission', badge: 'NEW', image: { key: '', alt: '', url: null } },
        { name: 'Marsa Heights', loc: 'Al Shati, Jeddah', price: 'SAR 980,000 – 1.6M', comm: '3% Commission', badge: 'FEATURED', image: { key: '', alt: '', url: null } },
        { name: 'Hittin Garden Villas', loc: 'Hittin, Riyadh', price: 'SAR 3.1M – 8.2M', comm: '2.5% Commission', badge: 'FEATURED', image: { key: '', alt: '', url: null } },
      ],
      primaryBtn: { label: "List your project — I'm a Developer", href: '/register/developer', visible: true },
      secondaryBtn: { label: 'Join as Realtor — Start Earning', href: '/register/realtor', visible: true },
    },
    stats: { visible: true, items: [{ value: '200+', label: 'Verified realtors' }, { value: '50+', label: 'Developer projects' }, { value: 'SAR 2M+', label: 'Commission paid' }, { value: '13', label: 'Cities covered' }] },
    forWho: {
      visible: true, eyebrow: 'Who is Waseet for?', heading: 'Built for two sides of every deal.',
      developer: { tag: 'Developers', title: 'List your projects. Get qualified leads.', body: 'Upload your development, set commission rates per unit type, and connect with 200+ verified licensed realtors across the region.', points: ['List unlimited projects after approval', 'Commission rates shown upfront to realtors', 'Full lead tracking dashboard', 'Know exactly what you owe — transparent billing', 'Realtor performance analytics per project'], cta: 'List Your Project →', href: '/register/developer' },
      realtor: { tag: 'Realtors', title: 'Browse projects. Submit leads. Get paid.', body: 'Browse exclusive developer projects with commissions shown upfront. Submit client leads and track every deal from submission to commission.', points: ['Browse projects not listed anywhere else', 'Commission % shown before you submit any lead', 'Real-time lead status tracking', 'Bronze → Silver → Gold → Platinum badge system', 'Commission paid directly to your bank account'], cta: 'Join as Realtor →', href: '/register/realtor' },
    },
    liveProjects: { visible: true, eyebrow: 'Live on Waseet', heading: 'Projects realtors are closing right now', browseLabel: 'Browse the marketplace →', browseHref: '/marketplace', items: [] },
    howItWorksSticky: {
      visible: true, eyebrow: 'How Waseet works',
      steps: [
        { n: '01', rail: 'Browse projects', title: 'Every developer project, in one private feed.', body: 'Realtors browse exclusive off-plan and ready projects with the commission rate shown upfront on every unit — no portals, no noise.' },
        { n: '02', rail: 'Submit & track leads', title: 'Submit a lead, then watch it move to close.', body: 'Send a client lead in seconds and follow it live — New, Viewing, Negotiating, Closed — with every status update in one dashboard.' },
        { n: '03', rail: 'Get paid commission', title: 'Your commission, tracked and paid on time.', body: 'When a deal closes, Waseet verifies the commission and disburses your share straight to your bank — usually within 5–7 business days.' },
      ],
    },
    darkBand: {
      visible: true, badge: 'New developments live now', heading: "Exclusive access to Saudi Arabia's finest off-plan projects.", body: 'Every verified project shows commission rates upfront — no chasing developers, no surprises.',
      primaryBtn: { label: 'Explore projects', href: '/marketplace', visible: true }, secondaryBtn: { label: 'View on map', href: '/marketplace', visible: true },
      cards: [
        { name: 'Olaya Park Towers', loc: 'Al Olaya, Riyadh', price: 'SAR 890K – 5.6M', comm: '4% Commission', badge: 'NEW', image: { key: '', alt: '', url: null } },
        { name: 'Marsa Heights', loc: 'Al Shati, Jeddah', price: 'SAR 980,000 – 1.6M', comm: '3% Commission', badge: 'FEATURED', image: { key: '', alt: '', url: null } },
      ],
    },
    howItWorks3: {
      visible: true, eyebrow: 'How it works', heading: 'Three steps to your first closed deal.',
      steps: [
        { title: 'Register & get verified', body: 'Apply as a developer or realtor. Our team reviews your documents within 24 hours.' },
        { title: 'Browse projects & submit leads', body: 'Realtors browse exclusive projects with commissions shown upfront. Submit client leads instantly.' },
        { title: 'Deal closes — commission paid', body: 'When the deal closes, Waseet tracks payment and disburses your commission to your bank.' },
      ],
      ctaText: 'Ready to get started?', primaryBtn: { label: 'List Your Project', href: '/register/developer', visible: true }, secondaryBtn: { label: 'Join as Realtor', href: '/register/realtor', visible: true },
    },
    saudiMarket: {
      visible: true, badge: 'Saudi Arabia', heading: "Private real estate in the world's fastest-growing market.",
      body: "Vision 2030 is reshaping the Kingdom's skyline. Waseet gives verified realtors first access to the developers building it — with commission locked upfront on every unit.",
      stats: [{ value: 'SAR 1T+', label: 'in active giga-projects' }, { value: '1.2M+', label: 'new homes planned by 2030' }, { value: '+9.6%', label: 'annual real-estate growth' }],
      primaryBtn: { label: 'Explore projects', href: '/marketplace', visible: true }, secondaryBtn: { label: 'Watch how it works', href: '/register/realtor', visible: true },
    },
    whyWaseet: {
      visible: true, eyebrow: 'Why Waseet', heading: "Everything you need. Nothing you don't.",
      cards: [
        { title: 'One private marketplace', body: 'Every approved developer project in one place, with commission shown upfront on every unit type.' },
        { title: 'Verified partners only', body: 'Every developer and realtor is reviewed by our admin team before accessing the platform.' },
        { title: 'Commission always shown upfront', body: 'No negotiating after the deal. Commission rates are locked per unit type before you submit a lead.' },
        { title: 'Full tracking dashboard', body: 'Track every lead from submission to close. Know exactly where every deal stands in real time.' },
        { title: 'Badge & reward system', body: 'Realtors earn Bronze, Silver, Gold, and Platinum badges as they close more deals — unlocking more perks.' },
        { title: '24-hour approval', body: 'Apply today. Our team reviews applications within 24 hours — you could be submitting leads tomorrow.' },
      ],
    },
    browseType: { visible: true, heading: 'Browse by property type', href: '/marketplace', types: [{ name: 'Apartments', count: '18,420 projects' }, { name: 'Villas', count: '9,210 projects' }, { name: 'Townhouses', count: '4,860 projects' }, { name: 'Offices', count: '3,140 projects' }, { name: 'Land', count: '2,705 plots' }] },
    badges: {
      visible: true, eyebrow: 'Realtor rewards', heading: 'The more you close, the more you unlock.',
      body: "Waseet's badge system rewards realtors who consistently deliver. Move from Bronze to Platinum and unlock exclusive benefits with each tier.",
      cta: 'Join as Realtor', href: '/register/realtor',
      items: [
        { icon: '🥉', name: 'Bronze', req: 'New approved realtor', perk: 'Access to all projects' },
        { icon: '🥈', name: 'Silver', req: '5 leads OR 1 closed deal', perk: 'Priority project alerts' },
        { icon: '🥇', name: 'Gold', req: '3 closed deals', perk: 'Analytics + higher priority listing' },
        { icon: '💎', name: 'Platinum', req: '10 closed deals', perk: 'Direct developer contact + fast disbursement' },
      ],
    },
    reviews: {
      visible: true, heading: 'Trusted by realtors & developers',
      items: [
        { quote: '"Waseet got me two closed deals in my first week. The commission was shown upfront, tracked clearly, and paid on time. No chasing anyone."', initials: 'AR', name: 'Ahmed Al-Rashid', role: 'Gold Realtor, Jeddah' },
        { quote: '"Every project shows the commission rate before I even submit a lead. No surprises, no back-and-forth with developers."', initials: 'SO', name: 'Sara Al-Otaibi', role: 'Realtor, Riyadh' },
        { quote: '"As a developer, the verified realtor network brings serious, qualified leads. Not time-wasters — actual buyers."', initials: 'MF', name: 'Mohammed Al-Faisal', role: 'Al Faisal Development, Jeddah' },
      ],
    },
    trust: {
      visible: true, eyebrow: 'Built on trust', heading: 'Verified, protected, and Shariah-compliant.',
      cards: [
        { title: 'Verified partners only', body: 'Every developer and realtor is reviewed and licence-checked by our team before they can list or submit a single lead.' },
        { title: 'Commission protected', body: 'Rates are locked per unit before you submit. Waseet holds and verifies every payment, then disburses your share to your bank.' },
        { title: 'Shariah-compliant', body: 'Every deal and commission structure adheres to Islamic Sharia principles — invest and earn without compromising your values.' },
      ],
    },
    faq: {
      visible: true, heading: 'Frequently asked questions',
      items: [
        { q: 'Who can join Waseet?', a: 'Verified property developers and licensed real estate agents across Saudi Arabia. All applicants are reviewed by our admin team within 24 hours of applying.' },
        { q: 'How is commission paid?', a: 'When a deal closes, the developer pays the agreed commission to Waseet. After verification, we disburse your realtor share directly to your registered bank account within 5–7 business days.' },
        { q: 'What does it cost to join?', a: 'Joining Waseet is free. We charge a platform fee only when a deal closes — a percentage of the commission, which is always disclosed upfront before you submit any lead.' },
        { q: 'How long does verification take?', a: 'Applications are reviewed within 24 hours. Once approved, you receive your login credentials and can access the platform immediately.' },
        { q: 'Which cities does Waseet cover?', a: 'We operate across Saudi Arabia — including Jeddah, Riyadh, Dammam, Mecca, Medina and Khobar — with new cities added regularly.' },
      ],
    },
    finalCta: { visible: true, heading: 'Ready to join Waseet?', subtitle: 'Apply today. Our team reviews within 24 hours.', primaryBtn: { label: "List Your Project — I'm a Developer", href: '/register/developer', visible: true }, secondaryBtn: { label: 'Join as Realtor — Start Earning', href: '/register/realtor', visible: true }, footnote: 'Free to join · 24hr approval · No commitment' },
  },
  custom: { css: '', headHtml: '', bodyHtml: '', js: '' },
}

/* fixed icon sets zipped with editable text (by index, cycled) */
const STAT_ICONS = [
  'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  'M3 21h18M6 21V7l6-4 6 4v14M9 11h2M13 11h2M9 15h2M13 15h2',
  'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M8.5 15.5l7-7',
  'M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 9m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
]
const WHY_ICONS = [
  'M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M21 21l-4-4',
  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1.1 1.5-2.5 1.5-2.5.5-2.5 1.5 1.1 1.5 2.5 1.5 2.5-.5 2.5-1.5',
  'M3 3v18h18M7 14l3-3 3 3 5-6',
  'M12 8m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M8.5 12.5L7 22l5-3 5 3-1.5-9.5',
  'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
]
const TYPE_ICONS = [
  'M3 21h18M6 3h7v18M13 9h5v12M9 7v.01M9 11v.01M9 15v.01',
  'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
  'M3 21h18M5 21V9l5-4v16M14 21V11l5-3v13',
  'M2 7h20v14H2zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  'm8 3 4 8 5-5 5 15H2L8 3z',
]
const TRUST_ICONS = [
  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  'M3 11h18v11H3zM7 11V7a5 5 0 0 1 10 0v4',
  'M17 14a7 7 0 1 1-5.6-11.3A6 6 0 1 0 17 14zM19 4l.6 1.6L21 6l-1.4.4L19 8l-.6-1.6L17 6z',
]
const STEP3_ICONS = [
  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4',
  'M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M21 21l-4-4',
  'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1.1 1.5-2.5 1.5-2.5.5-2.5 1.5 1.1 1.5 2.5 1.5 2.5-.5 2.5-1.5',
]
const SAUDI_ICONS = ['M3 21h18M6 21V7l6-4 6 4v14M9 9h2M13 9h2M9 13h2M13 13h2', 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6', 'M3 17l6-6 4 4 8-8M17 7h4v4']
const DEV_ICON = 'M3 21h18M6 21V7l6-4 6 4v14M9 9h2M13 9h2M9 13h2M13 13h2'
const REALTOR_ICON = 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M16 11l2 2 4-4'
const at = (arr, i) => arr[i % arr.length]

/* ---------- small building blocks ---------- */

function Eyebrow({ children, style }) {
  return <div style={{ fontSize: 10, fontWeight: 600, color: colors.green, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, ...style }}>{children}</div>
}

function CtaButton({ children, variant = 'primary', onClick, style }) {
  const [h, hp] = useHover()
  const variants = {
    primary: { background: h ? colors.greenDark : colors.green, color: '#fff', border: 'none' },
    outline: { background: h ? colors.surfaceAlt : '#fff', color: colors.ink, border: `1px solid ${colors.border}` },
    dark: { background: h ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' },
  }
  return (
    <button {...hp} onClick={onClick} style={{ height: 46, padding: '0 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms ease', transform: h ? 'translateY(-1px)' : 'none', ...variants[variant], ...style }}>{children}</button>
  )
}

// render a CtaButton from a { label, href, visible } config; hidden when visible===false
function Btn({ b, variant, style, go }) {
  if (!b || b.visible === false || !b.label) return null
  return <CtaButton variant={variant} onClick={() => go(b.href)} style={style}>{b.label}</CtaButton>
}

function CheckLine({ children, weight = 2 }) {
  return (
    <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: colors.textSoft }}>
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12l2.5 2.5L16 9" /></svg>
      {children}
    </span>
  )
}

// decorative float styling per card slot (content comes from config)
const heroPresets = [
  { w: 230, rot: 'rotate(-3deg)', delay: '0s', shadow: '0 10px 30px rgba(0,0,0,0.07)', h: 120, nameSize: 13 },
  { w: 244, rot: 'scale(1.06)', delay: '.6s', shadow: '0 16px 44px rgba(0,0,0,0.1)', h: 128, nameSize: 14, render: true },
  { w: 230, rot: 'rotate(3deg)', delay: '1.2s', shadow: '0 10px 30px rgba(0,0,0,0.07)', h: 120, nameSize: 13 },
]
const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 7px)'

function HeroCard({ c = {}, preset }) {
  const p = preset || heroPresets[0]
  const badge = c.badge === 'NEW' ? { bg: '#FEF9EC', bd: '#F3E2B8', c: '#92763A' } : { bg: colors.greenTint, bd: colors.greenTintBorder, c: colors.greenDark }
  const img = c.image?.url
  return (
    <div style={{ transform: p.rot }}>
      <div style={{ animation: 'wfloat 4s ease-in-out infinite', animationDelay: p.delay, width: p.w, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: p.shadow, textAlign: 'left' }}>
        <div style={{ height: p.h, position: 'relative', backgroundColor: img ? '#000' : colors.surfaceMuted, backgroundImage: img ? `url("${img}")` : hatch, backgroundSize: img ? 'cover' : undefined, backgroundPosition: img ? 'center' : undefined, backgroundRepeat: img ? 'no-repeat' : undefined }}>
          {c.badge && <span style={{ position: 'absolute', top: 9, left: 9, background: badge.bg, border: `1px solid ${badge.bd}`, borderRadius: 999, padding: '2px 8px', fontSize: 9, fontWeight: 600, color: badge.c, letterSpacing: '0.03em' }}>{c.badge}</span>}
          {c.comm && <span style={{ position: 'absolute', bottom: 9, right: 9, background: colors.ink, borderRadius: 5, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#fff' }}>{c.comm}</span>}
          {!img && p.render && <span style={{ position: 'absolute', top: 10, right: 11, fontFamily: 'monospace', fontSize: 8, color: '#B6BAC0' }}>project render</span>}
        </div>
        <div style={{ padding: '11px 13px' }}>
          <div style={{ fontSize: p.nameSize, fontWeight: p.nameSize > 13 ? 700 : 600 }}>{c.name}</div>
          <div style={{ fontSize: 11, color: colors.textFaint, margin: '2px 0 6px' }}>{c.loc}</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{c.price}</div>
        </div>
      </div>
    </div>
  )
}

const marqueeGradients = ['linear-gradient(150deg,#0F3D2E,#1E7A52)', 'linear-gradient(150deg,#0E4F4A,#2A9D8F)', 'linear-gradient(150deg,#1F2937,#4B5563)', 'linear-gradient(150deg,#15803D,#34D058)', 'linear-gradient(150deg,#3F3A33,#6E6358)', 'linear-gradient(150deg,#1E293B,#3B5168)']
const marqueeFallback = [
  { badge: 'FEATURED', comm: '3%', name: 'Palm Residence', loc: 'Al Rawdhah, Jeddah', price: 'SAR 650K – 1.2M' },
  { badge: 'NEW', comm: '4%', name: 'Nesma Villas', loc: 'Al Yasmin, Riyadh', price: 'SAR 2.1M – 3.4M' },
  { badge: 'FEATURED', comm: '2.5%', name: 'Aldar Offices Tower', loc: 'Al Olaya, Riyadh', price: 'SAR 1.4M – 4.8M' },
  { badge: 'FEATURED', comm: '3.5%', name: 'Marsa Heights', loc: 'Al Shati, Jeddah', price: 'SAR 980K – 1.6M' },
  { badge: 'NEW', comm: '3%', name: 'Jeddah Gate Townhomes', loc: 'Al Naseem, Jeddah', price: 'SAR 980K – 1.7M' },
  { badge: 'FEATURED', comm: '4%', name: 'Sumou Garden Villas', loc: 'Al Shati, Jeddah', price: 'SAR 2.4M – 5.2M' },
]

function MarqueeCard({ c, i, onClick }) {
  const isNew = c.badge === 'NEW'
  const grad = at(marqueeGradients, i)
  return (
    <div onClick={onClick} style={{ flex: 'none', width: 248, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ height: 120, position: 'relative', overflow: 'hidden', backgroundColor: '#000', backgroundImage: c.image ? `url("${c.image}")` : grad, backgroundSize: c.image ? 'cover' : undefined, backgroundPosition: c.image ? 'center' : undefined, backgroundRepeat: c.image ? 'no-repeat' : undefined }}>
        {!c.image && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.06) 0,rgba(255,255,255,0.06) 1px,transparent 1px,transparent 9px)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,0.28) 100%)' }} />
        <span style={{ position: 'absolute', top: 9, left: 9, background: isNew ? '#FEF9EC' : '#fff', border: isNew ? '1px solid #F3E2B8' : 'none', borderRadius: 999, padding: '2px 8px', fontSize: 9, fontWeight: 600, color: isNew ? '#92763A' : colors.greenDark, letterSpacing: '0.03em' }}>{c.badge}</span>
        {c.comm && <span style={{ position: 'absolute', bottom: 9, right: 9, background: '#fff', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: colors.ink }}>{c.comm} Commission</span>}
      </div>
      <div style={{ padding: '11px 13px' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', margin: '3px 0 6px' }}>
          <Icon name="mapPin" size={11} color={colors.textFaint} strokeWidth={2} />
          <span style={{ fontSize: 11, color: colors.textFaint }}>{c.loc}</span>
        </div>
        {c.price && <div style={{ fontSize: 12, fontWeight: 600 }}>{c.price}</div>}
      </div>
    </div>
  )
}

function WhyCard({ c, d }) {
  const [h, hp] = useHover()
  return (
    <div {...hp} style={{ background: '#fff', border: `1px solid ${h ? colors.green : colors.border}`, borderRadius: 12, padding: 22, transition: 'all 200ms ease', transform: h ? 'translateY(-2px)' : 'none' }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: colors.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{c.title}</div>
      <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.6 }}>{c.body}</div>
    </div>
  )
}

function TypeCard({ c, d, onClick }) {
  const [h, hp] = useHover()
  return (
    <div {...hp} onClick={onClick} style={{ background: h ? colors.greenTint : '#fff', border: `1px solid ${h ? colors.green : colors.border}`, borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 150ms ease' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
      <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>{c.count}</div>
    </div>
  )
}

function FaqItem({ item, open, onClick }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${open ? colors.borderStrong : colors.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div onClick={onClick} style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: colors.ink }}>{item.q}</span>
        <span style={{ transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms ease', display: 'flex' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </span>
      </div>
      {open && <div style={{ padding: '0 18px 16px', fontSize: 13, color: colors.textSoft, lineHeight: 1.6 }}>{item.a}</div>}
    </div>
  )
}

/* ---------- page ---------- */
export default function Landing() {
  const navigate = useNavigate()
  const [faqOpen, setFaqOpen] = useState(0)
  const [data, setData] = useState(null)

  useEffect(() => {
    let alive = true
    landingApi.get().then((c) => { if (alive && c) setData(c) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const L = data || FALLBACK
  const S = L.sections || FALLBACK.sections
  const go = (href) => {
    if (!href) return
    if (/^https?:\/\//i.test(href)) window.location.href = href
    else navigate(href)
  }
  const vis = (sec) => sec && sec.visible !== false

  const hero = S.hero || {}
  const liveItems = (S.liveProjects?.items && S.liveProjects.items.length) ? S.liveProjects.items : marqueeFallback

  return (
    <div>
      <SeoHead seo={L.seo || {}} custom={L.custom || {}} />

      {/* ===== HERO ===== */}
      {vis(hero) && (
        <div style={{ background: '#fff', padding: '72px 32px 56px', textAlign: 'center', overflow: 'hidden' }}>
          {hero.badgeText && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 999, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.green, animation: 'ps-pulse 1.8s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: colors.greenDark }}>{hero.badgeText}</span>
            </div>
          )}
          <h1 className="wa-h1" style={{ fontSize: 48, fontWeight: 700, color: colors.ink, letterSpacing: '-0.04em', lineHeight: 1.08, maxWidth: 780, margin: '0 auto' }}>
            {hero.title} {hero.highlight && <span style={{ color: colors.green }}>{hero.highlight}</span>}
          </h1>
          {hero.subtitle && <p style={{ fontSize: 16, color: colors.textSoft, lineHeight: 1.6, maxWidth: 520, margin: '16px auto 8px' }}>{hero.subtitle}</p>}
          {hero.citiesLine && <div style={{ fontSize: 13, color: colors.textFaint, marginBottom: 36 }}>{hero.citiesLine}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
            <Btn b={hero.primaryBtn} variant="primary" go={go} />
            <Btn b={hero.secondaryBtn} variant="outline" go={go} style={{ borderWidth: 1.5 }} />
          </div>
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(hero.checkLines || []).map((t, i) => <CheckLine key={i}>{t}</CheckLine>)}
          </div>
          {(hero.cards && hero.cards.length > 0) && (
            <div className="wa-hero-cards" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 52 }}>
              {hero.cards.map((c, i) => <HeroCard key={i} c={c} preset={heroPresets[i % heroPresets.length]} />)}
            </div>
          )}
        </div>
      )}

      {/* ===== STATS BAR ===== */}
      {vis(S.stats) && (
        <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, display: 'flex', flexWrap: 'wrap' }}>
          {(S.stats.items || []).map((s, i, arr) => (
            <div key={i} style={{ flex: '1 1 180px', padding: '24px 0', textAlign: 'center', borderRight: i === arr.length - 1 ? 'none' : `1px solid ${colors.border}` }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}><path d={at(STAT_ICONS, i)} /></svg>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ===== FOR WHO ===== */}
      {vis(S.forWho) && (
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '72px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <Eyebrow>{S.forWho.eyebrow}</Eyebrow>
              <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{S.forWho.heading}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
              <ForWhoCard iconD={DEV_ICON} data={S.forWho.developer} ctaVariant="primary" go={go} />
              <ForWhoCard iconD={REALTOR_ICON} data={S.forWho.realtor} ctaVariant="outline" go={go} />
            </div>
          </div>
        </div>
      )}

      {/* ===== LIVE MARQUEE ===== */}
      {vis(S.liveProjects) && (
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '48px 0', overflow: 'hidden' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto 22px', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.green, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.green, animation: 'ps-pulse 1.8s ease-in-out infinite' }} />{S.liveProjects.eyebrow}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{S.liveProjects.heading}</h2>
            </div>
            {S.liveProjects.browseLabel && <span onClick={() => go(S.liveProjects.browseHref)} style={{ fontSize: 13, color: colors.greenDark, fontWeight: 500, cursor: 'pointer' }}>{S.liveProjects.browseLabel}</span>}
          </div>
          <div className="wa-marquee" style={{ position: 'relative' }}>
            <div className="wa-marquee-track" style={{ display: 'flex', gap: 16, width: 'max-content', animation: 'wmarquee 42s linear infinite', padding: '0 8px' }}>
              {[...liveItems, ...liveItems].map((c, i) => <MarqueeCard key={i} c={c} i={i} onClick={c.id ? () => go(`/marketplace/${c.id}`) : undefined} />)}
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 90, height: '100%', background: 'linear-gradient(90deg,#FAFAFA,rgba(250,250,250,0))', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 90, height: '100%', background: 'linear-gradient(270deg,#FAFAFA,rgba(250,250,250,0))', pointerEvents: 'none' }} />
          </div>
        </div>
      )}

      {/* ===== HOW WASEET WORKS (sticky scroll) ===== */}
      {vis(S.howItWorksSticky) && <HowItWorks data={S.howItWorksSticky} />}

      {/* ===== DARK BAND ===== */}
      {vis(S.darkBand) && <DarkBand data={S.darkBand} go={go} />}

      {/* ===== HOW IT WORKS (3 steps) ===== */}
      {vis(S.howItWorks3) && (
        <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '72px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <Eyebrow>{S.howItWorks3.eyebrow}</Eyebrow>
              <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{S.howItWorks3.heading}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40, position: 'relative' }}>
              {(S.howItWorks3.steps || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', border: `1.5px solid ${colors.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginBottom: 20 }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={at(STEP3_ICONS, i)} /></svg>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.6, maxWidth: 240 }}>{s.body}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              {S.howItWorks3.ctaText && <div style={{ fontSize: 14, color: colors.textSoft, marginBottom: 14 }}>{S.howItWorks3.ctaText}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Btn b={S.howItWorks3.primaryBtn} variant="primary" go={go} style={{ height: 40, padding: '0 20px' }} />
                <Btn b={S.howItWorks3.secondaryBtn} variant="outline" go={go} style={{ height: 40, padding: '0 20px' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SAUDI MARKET ===== */}
      {vis(S.saudiMarket) && (
        <div style={{ background: '#0B3D2E', padding: '76px 32px', position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(ellipse at 78% 38%, rgba(34,197,94,0.22) 0%, transparent 55%), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 12px)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 52, alignItems: 'center' }}>
            <div>
              {S.saudiMarket.badge && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 22 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />{S.saudiMarket.badge}</span>}
              <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 16px' }}>{S.saudiMarket.heading}</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, margin: '0 0 30px', maxWidth: 440 }}>{S.saudiMarket.body}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Btn b={S.saudiMarket.primaryBtn} variant="primary" go={go} style={{ height: 44, padding: '0 24px' }} />
                {S.saudiMarket.secondaryBtn && S.saudiMarket.secondaryBtn.visible !== false && S.saudiMarket.secondaryBtn.label && (
                  <CtaButton variant="dark" onClick={() => go(S.saudiMarket.secondaryBtn.href)} style={{ height: 44, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>{S.saudiMarket.secondaryBtn.label}
                  </CtaButton>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(S.saudiMarket.stats || []).map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, marginLeft: i === 1 ? 28 : 0, animation: 'wfloat 4s ease-in-out infinite', animationDelay: `${i * 0.8}s` }}>
                  <div style={{ width: 46, height: 46, minWidth: 46, borderRadius: 12, background: 'rgba(34,197,94,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={at(SAUDI_ICONS, i)} /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== WHY WASEET ===== */}
      {vis(S.whyWaseet) && (
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '72px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <Eyebrow>{S.whyWaseet.eyebrow}</Eyebrow>
              <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{S.whyWaseet.heading}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
              {(S.whyWaseet.cards || []).map((c, i) => <WhyCard key={i} c={c} d={at(WHY_ICONS, i)} />)}
            </div>
          </div>
        </div>
      )}

      {/* ===== BROWSE BY TYPE ===== */}
      {vis(S.browseType) && (
        <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '56px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 24px' }}>{S.browseType.heading}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {(S.browseType.types || []).map((c, i) => <TypeCard key={i} c={c} d={at(TYPE_ICONS, i)} onClick={() => go(S.browseType.href || '/marketplace')} />)}
            </div>
          </div>
        </div>
      )}

      {/* ===== REALTOR BADGES ===== */}
      {vis(S.badges) && (
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '72px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 56, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <Eyebrow style={{ marginBottom: 12 }}>{S.badges.eyebrow}</Eyebrow>
              <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 16px' }}>{S.badges.heading}</h2>
              <p style={{ fontSize: 14, color: colors.textSoft, lineHeight: 1.6, margin: '0 0 28px' }}>{S.badges.body}</p>
              {S.badges.cta && <CtaButton onClick={() => go(S.badges.href)} style={{ height: 40, padding: '0 20px' }}>{S.badges.cta}</CtaButton>}
            </div>
            <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(S.badges.items || []).map((b, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderLeft: i === 0 ? `3px solid ${colors.green}` : `1px solid ${colors.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 24 }}>{b.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: colors.textSoft }}>{b.req}</div>
                  </div>
                  <div style={{ fontSize: 11, color: colors.green, fontWeight: 500, textAlign: 'right' }}>{b.perk}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== REVIEWS ===== */}
      {vis(S.reviews) && (
        <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '72px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', margin: '0 0 40px' }}>{S.reviews.heading}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {(S.reviews.items || []).map((r, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[...Array(5)].map((_, j) => <svg key={j} width={16} height={16} viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth={1}><path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 17.8 5.4 21.2 6.7 14.2 1.7 9.4l7-.9z" /></svg>)}
                  </div>
                  <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.7 }}>{r.quote}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 'auto' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: colors.textMuted }}>{r.initials}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint }}>{r.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TRUST ===== */}
      {vis(S.trust) && (
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '72px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <Eyebrow style={{ fontSize: 11 }}>{S.trust.eyebrow}</Eyebrow>
              <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{S.trust.heading}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {(S.trust.cards || []).map((c, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 14, padding: 26 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={at(TRUST_ICONS, i)} /></svg>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{c.title}</div>
                  <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.6 }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== FAQ ===== */}
      {vis(S.faq) && (
        <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '72px 32px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', margin: '0 0 40px' }}>{S.faq.heading}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(S.faq.items || []).map((f, i) => <FaqItem key={i} item={f} open={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} />)}
            </div>
          </div>
        </div>
      )}

      {/* ===== FINAL CTA ===== */}
      {vis(S.finalCta) && (
        <div style={{ background: colors.ink, padding: '64px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(ellipse at center, rgba(22,163,74,0.08) 0%, transparent 65%)' }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', margin: '0 0 14px' }}>{S.finalCta.heading}</h2>
          {S.finalCta.subtitle && <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 36px' }}>{S.finalCta.subtitle}</p>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn b={S.finalCta.primaryBtn} variant="primary" go={go} style={{ height: 48, padding: '0 32px', fontSize: 15 }} />
            {S.finalCta.secondaryBtn && S.finalCta.secondaryBtn.visible !== false && S.finalCta.secondaryBtn.label && (
              <CtaButton variant="dark" onClick={() => go(S.finalCta.secondaryBtn.href)} style={{ height: 48, padding: '0 32px', fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>{S.finalCta.secondaryBtn.label}</CtaButton>
            )}
          </div>
          {S.finalCta.footnote && <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.03em' }}>{S.finalCta.footnote}</div>}
        </div>
      )}

      {/* ===== admin custom body HTML (widgets / embeds) ===== */}
      {L.custom?.bodyHtml ? <div dangerouslySetInnerHTML={{ __html: L.custom.bodyHtml }} /> : null}
    </div>
  )
}

/* ---------- ForWho card ---------- */
function ForWhoCard({ iconD, data = {}, ctaVariant, go }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 16, padding: 32 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={iconD} /></svg>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 6px' }}>{data.tag}</div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }}>{data.title}</div>
      <div style={{ fontSize: 14, color: colors.textSoft, lineHeight: 1.6, marginBottom: 24 }}>{data.body}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(data.points || []).map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M5 12l4 4L19 7" /></svg>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{p}</span>
          </div>
        ))}
      </div>
      {data.cta && <CtaButton variant={ctaVariant} onClick={() => go(data.href)} style={{ marginTop: 28, width: '100%', height: 40, fontSize: 14 }}>{data.cta}</CtaButton>}
    </div>
  )
}

/* ---------- HOW WASEET WORKS — sticky scroll-driven stepper ---------- */
const floatChips = [
  { top: '14%', left: '7%', size: 48, delay: '0s', d: 'M3 21h18M6 21V7l6-4 6 4v14M9 9h2M13 9h2M9 13h2M13 13h2' },
  { bottom: '12%', left: '16%', size: 44, delay: '1s', d: 'M8 15m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M10.85 12.15L19 4M18 5l2 2M15 8l2 2' },
  { top: '18%', right: '8%', size: 46, delay: '.6s', d: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M8.5 15.5l7-7' },
  { bottom: '20%', right: '15%', size: 44, delay: '1.6s', d: 'M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0M8 12l2.5 2.5L16 9' },
]

function HowItWorks({ data }) {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const steps = (data?.steps && data.steps.length) ? data.steps : FALLBACK.sections.howItWorksSticky.steps

  useEffect(() => {
    const onScroll = () => {
      const w = ref.current
      if (!w) return
      const rect = w.getBoundingClientRect()
      const total = w.offsetHeight - window.innerHeight
      let s = 0
      if (total > 0) {
        const scrolled = Math.min(Math.max(-rect.top, 0), total)
        s = Math.min(steps.length - 1, Math.max(0, Math.floor((scrolled / total) * steps.length + 0.001)))
      }
      setActive(s)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [steps.length])

  const goStep = (i) => {
    const w = ref.current
    if (!w) return
    const pageTop = w.getBoundingClientRect().top + window.scrollY
    const total = w.offsetHeight - window.innerHeight
    window.scrollTo({ top: pageTop + (total * (i + 0.5)) / steps.length, behavior: 'smooth' })
  }

  return (
    <div ref={ref} className="wa-hiw" style={{ position: 'relative', height: '280vh', background: colors.bg, borderTop: `1px solid ${colors.border}` }}>
      <div className="wa-sticky" style={{ position: 'sticky', top: 56, height: 'calc(100vh - 56px)', minHeight: 600, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -130, left: -90, width: 540, height: 540, borderRadius: '50%', background: 'radial-gradient(circle,rgba(22,163,74,0.12),transparent 68%)' }} />
          <div style={{ position: 'absolute', bottom: -170, right: -70, width: 580, height: 580, borderRadius: '50%', background: 'radial-gradient(circle,rgba(22,163,74,0.09),transparent 68%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(22,163,74,0.13) 1px, transparent 1px)', backgroundSize: '30px 30px', WebkitMaskImage: 'radial-gradient(ellipse at center,#000 25%,transparent 72%)', maskImage: 'radial-gradient(ellipse at center,#000 25%,transparent 72%)' }} />
          {floatChips.map((c, i) => (
            <div key={i} style={{ position: 'absolute', top: c.top, bottom: c.bottom, left: c.left, right: c.right, width: c.size, height: c.size, borderRadius: 13, background: '#fff', border: `1px solid ${colors.greenSoft}`, boxShadow: '0 12px 26px rgba(11,61,46,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: `wfloat 5s ease-in-out infinite`, animationDelay: c.delay }}>
              <svg width={Math.round(c.size * 0.45)} height={Math.round(c.size * 0.45)} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={c.d} /></svg>
            </div>
          ))}
        </div>

        <div className="wa-hiw-grid" style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 32px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 56, alignItems: 'center' }}>
          <div>
            <Eyebrow style={{ marginBottom: 24 }}>{data?.eyebrow || 'How Waseet works'}</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 30 }}>
              {steps.map((step, i) => {
                const on = i === active
                return (
                  <div key={i} onClick={() => goStep(i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', cursor: 'pointer', opacity: on ? 1 : 0.4, transition: 'opacity .2s' }}>
                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: on ? colors.green : colors.surfaceMuted, color: on ? '#fff' : colors.textFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{step.n || String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{step.rail || step.title}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ position: 'relative', minHeight: 140 }}>
              {steps.map((s, i) => (
                <div key={i} className="wa-hiw-fade" style={{ position: 'absolute', inset: 0, opacity: active === i ? 1 : 0, pointerEvents: active === i ? 'auto' : 'none', transition: 'opacity .5s ease' }}>
                  <h3 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 12px' }}>{s.title}</h3>
                  <p style={{ fontSize: 15, color: colors.textSoft, lineHeight: 1.6, margin: 0, maxWidth: 420 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>

          <DeviceMock active={active} />
        </div>
      </div>
    </div>
  )
}

/* ---------- Laptop mockup with 3 crossfading screens ---------- */
function DeviceMock({ active }) {
  const urls = ['waseet.sa/projects', 'waseet.sa/leads', 'waseet.sa/earnings']
  const screens = [<DeviceProjects key="p" />, <DeviceLeads key="l" />, <DeviceEarnings key="e" />]
  return (
    <div className="wa-device" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 560, background: 'linear-gradient(160deg,#ECFDF5,#D6F5E3)', border: `1px solid ${colors.greenSoft}`, borderRadius: 26, padding: 44, boxShadow: '0 30px 60px rgba(11,61,46,0.08)' }}>
        <div style={{ background: 'linear-gradient(160deg,#42454a,#0e0e10)', borderRadius: 20, padding: 11, boxShadow: '0 50px 90px rgba(0,0,0,0.26)' }}>
          <div style={{ position: 'relative', background: '#000', borderRadius: 11, overflow: 'hidden', aspectRatio: '16/10' }}>
            <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#1a1a1a', boxShadow: 'inset 0 0 0 1px #333', zIndex: 6 }} />
            {screens.map((screen, i) => (
              <div key={i} style={{ position: 'absolute', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', opacity: active === i ? 1 : 0, transition: 'opacity .5s ease' }}>
                <div style={{ height: 28, background: colors.surfaceMuted, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 6, padding: '0 11px', flexShrink: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5F57' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FEBC2E' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28C840' }} />
                  <span style={{ marginLeft: 8, flex: 1, height: 16, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 5, display: 'flex', alignItems: 'center', padding: '0 9px', fontSize: 9, color: colors.textFaint }}>{urls[i]}</span>
                </div>
                {screen}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', height: 15, width: '112%', marginLeft: '-6%', background: 'linear-gradient(#dadee3,#abb0b8)', borderRadius: '0 0 16px 16px', boxShadow: '0 22px 32px rgba(0,0,0,0.14)' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 130, height: 7, background: 'linear-gradient(#a7acb4,#c6cad0)', borderRadius: '0 0 9px 9px' }} />
        </div>
      </div>
    </div>
  )
}

function DeviceProjects() {
  const items = [
    { name: 'Palm Residence', loc: 'Al Rawdhah, Jeddah', comm: '3%', price: 'SAR 650K–1.2M' },
    { name: 'Nesma Villas', loc: 'Al Yasmin, Riyadh', comm: '4%', price: 'SAR 2.1M–3.4M' },
    { name: 'Aldar Offices', loc: 'Al Olaya, Riyadh', comm: '2.5%', price: 'SAR 1.4M–4.8M' },
    { name: 'Marsa Heights', loc: 'Al Shati, Jeddah', comm: '3.5%', price: 'SAR 980K–1.6M' },
  ]
  return (
    <div style={{ flex: 1, padding: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Featured projects</span>
        <span style={{ fontSize: 10, color: colors.greenDark, fontWeight: 600 }}>View all →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {items.map((it) => (
          <div key={it.name} style={{ border: `1px solid ${colors.border}`, borderRadius: 9, overflow: 'hidden' }}>
            <div style={{ height: 58, background: colors.surfaceMuted, backgroundImage: hatch, position: 'relative' }}>
              <span style={{ position: 'absolute', top: 5, left: 5, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 999, padding: '1px 6px', fontSize: 7, fontWeight: 600, color: colors.greenDark }}>FEATURED</span>
              <span style={{ position: 'absolute', bottom: 5, right: 5, background: colors.ink, borderRadius: 4, padding: '1px 6px', fontSize: 8, fontWeight: 700, color: '#fff' }}>{it.comm}</span>
            </div>
            <div style={{ padding: '7px 9px' }}>
              <div style={{ fontSize: 10, fontWeight: 600 }}>{it.name}</div>
              <div style={{ fontSize: 8, color: colors.textFaint, margin: '1px 0 3px' }}>{it.loc}</div>
              <div style={{ fontSize: 10, fontWeight: 600 }}>{it.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeviceLeads() {
  const rows = [
    { in: 'SA', name: 'Saud Al-Harbi', sub: 'Palm Residence · 3%', stage: 'Closed', bg: colors.greenTint, c: colors.greenDark },
    { in: 'NK', name: 'Noura Al-Kahtani', sub: 'Nesma Villas · 4%', stage: 'Negotiating', bg: colors.blueTint, c: '#1D4ED8' },
    { in: 'FA', name: 'Faisal Al-Otaibi', sub: 'Aldar Offices · 2.5%', stage: 'Viewing', bg: colors.surfaceMuted, c: colors.textMuted },
    { in: 'RM', name: 'Reem Al-Mutairi', sub: 'Marsa Heights · 3.5%', stage: 'New', bg: '#FEF9EC', c: '#92763A' },
  ]
  return (
    <div style={{ flex: 1, padding: '14px 16px', overflow: 'hidden' }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>My leads</div>
      {rows.map((r) => (
        <div key={r.in} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: colors.textMuted }}>{r.in}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: 9, color: colors.textFaint }}>{r.sub}</div>
          </div>
          <span style={{ background: r.bg, color: r.c, borderRadius: 5, padding: '2px 8px', fontSize: 8, fontWeight: 600 }}>{r.stage}</span>
        </div>
      ))}
    </div>
  )
}

function DeviceEarnings() {
  const bars = [34, 50, 42, 66, 58, 84, 100]
  const barColor = (h) => (h >= 84 ? colors.green : h >= 58 ? '#86EFAC' : '#BBF7D0')
  return (
    <div style={{ flex: 1, padding: 16, overflow: 'hidden' }}>
      <div style={{ fontSize: 9, color: colors.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total commission earned</div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '2px 0' }}>SAR 142,500</div>
      <div style={{ fontSize: 10, color: colors.greenDark, fontWeight: 600, marginBottom: 14 }}>▲ SAR 18,500 paid this month</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 62, marginBottom: 14 }}>
        {bars.map((h, i) => <div key={i} style={{ flex: 1, height: `${h}%`, background: barColor(h), borderRadius: '3px 3px 0 0' }} />)}
      </div>
      {[{ n: 'Palm Residence', v: 'SAR 36,000' }, { n: 'Nesma Villas', v: 'SAR 51,000' }].map((r) => (
        <div key={r.n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderTop: `1px solid ${colors.surfaceMuted}` }}>
          <span style={{ fontSize: 10, color: colors.textMuted }}>{r.n}</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>{r.v}</span>
          <span style={{ background: colors.greenTint, color: colors.greenDark, borderRadius: 5, padding: '1px 7px', fontSize: 8, fontWeight: 600 }}>Paid</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- DARK BAND with fanned deco cards ---------- */
function DarkBand({ data = {}, go }) {
  return (
    <div style={{ background: colors.ink, padding: '72px 32px', position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(ellipse at 65% 50%, rgba(22,163,74,0.08) 0%, transparent 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 12px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', minHeight: 280 }}>
        <div style={{ maxWidth: 560 }}>
          {data.badge && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 999, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.green, animation: 'ps-pulse 1.8s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{data.badge}</span>
            </div>
          )}
          <h2 style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 16px' }}>{data.heading}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 460, margin: '0 0 32px' }}>{data.body}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn b={data.primaryBtn} variant="primary" go={go} style={{ height: 40, padding: '0 20px', fontSize: 13 }} />
            <Btn b={data.secondaryBtn} variant="dark" go={go} style={{ height: 40, padding: '0 20px', fontSize: 13 }} />
          </div>
        </div>

        <div className="wa-deco" style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', width: 380, height: 250 }}>
          {(data.cards || []).slice(0, darkPresets.length).map((c, i) => <DarkCard key={i} c={c} preset={darkPresets[i]} />)}
        </div>
      </div>
    </div>
  )
}

// position/style presets for the 2 fanned dark-band cards (content from config)
const darkPresets = [
  { pos: { right: 200, top: 30 }, rot: 'rotate(-4deg)', w: 220, cardH: 84, delay: '1.2s', bg: '#1A1A1A', border: 'rgba(255,255,255,0.1)', shadow: '0 14px 40px rgba(0,0,0,0.5)', nameSize: 14, render: false },
  { pos: { right: 0, top: 8 }, rot: 'none', w: 252, cardH: 92, delay: '0s', bg: '#161616', border: 'rgba(255,255,255,0.12)', shadow: '0 20px 60px rgba(0,0,0,0.5)', nameSize: 15, render: true },
]

function DarkCard({ c = {}, preset }) {
  const p = preset || darkPresets[0]
  const img = c.image?.url
  return (
    <div style={{ position: 'absolute', ...p.pos, transform: p.rot !== 'none' ? p.rot : undefined }}>
      <div style={{ animation: 'wfloat 4.5s ease-in-out infinite', animationDelay: p.delay, width: p.w, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: p.shadow }}>
        <div style={{ height: p.cardH, position: 'relative', backgroundColor: img ? '#000' : 'rgba(255,255,255,0.06)', backgroundImage: img ? `url("${img}")` : undefined, backgroundSize: img ? 'cover' : undefined, backgroundPosition: img ? 'center' : undefined, backgroundRepeat: img ? 'no-repeat' : undefined }}>
          {c.badge && <span style={{ position: 'absolute', top: 10, left: 10, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 999, padding: '2px 9px', fontSize: 9, fontWeight: 600, color: colors.greenDark, letterSpacing: '0.03em' }}>{c.badge}</span>}
          {c.comm && <span style={{ position: 'absolute', bottom: 9, right: 10, background: colors.green, borderRadius: 6, padding: '3px 9px', fontSize: 10, fontWeight: 600, color: '#fff' }}>{c.comm}</span>}
          {!img && p.render && <span style={{ position: 'absolute', top: 11, right: 12, fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>project render</span>}
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: p.nameSize, fontWeight: p.nameSize > 14 ? 700 : 600, color: '#fff' }}>{c.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '2px 0 6px' }}>{c.loc}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{c.price}</div>
        </div>
      </div>
    </div>
  )
}
