import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, radius } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { useHover } from '../../hooks/useHover'
import { MapView } from '../../components/MapView'
import { MapMultiView } from '../../components/MapMultiView'
import { cityImage } from '../../lib/cityImages'
import { realtorApi, geoApi } from '../../lib/api'
import { countryName } from '../../lib/adminFormat'

function Segmented({ options, value, onChange, height = 36, fontSize = 13 }) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden', height }}>
      {options.map((o) => {
        const on = o === value
        return (
          <div
            key={o}
            onClick={() => onChange(o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              fontSize,
              cursor: 'pointer',
              background: on ? colors.ink : '#fff',
              color: on ? '#fff' : colors.textMuted,
              fontWeight: on ? 600 : 400,
            }}
          >
            {o}
          </div>
        )
      })}
    </div>
  )
}

// A DropField renders as a static control unless `options` are provided, in
// which case it becomes a real dropdown: click toggles an absolutely-positioned
// menu, selecting an option calls onChange and closes, and an outside click or
// Escape dismisses it. The trigger styling is preserved exactly.
function DropField({ label, flex = 1, accent, height = 36, fontSize = 13, options, onChange, multi, selected, onToggle, disabled, searchable }) {
  const [h, hp] = useHover()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const interactive = Array.isArray(options) && !disabled
  useEffect(() => { if (!open) setQuery('') }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flex }}>
      <div
        {...hp}
        onClick={() => interactive && setOpen((o) => !o)}
        style={{
          width: '100%',
          height,
          border: `1px solid ${colors.border}`,
          borderRadius: 7,
          padding: '0 12px',
          fontSize,
          color: disabled ? colors.textFaint : accent ? colors.greenDark : colors.textMuted,
          fontWeight: accent ? 500 : 400,
          background: disabled ? colors.surfaceAlt : h ? colors.surfaceAlt : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.75 : 1,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <Icon name="chevronDown" size={13} color={colors.textFaint} strokeWidth={2} style={{ marginLeft: 8, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </div>
      {open && interactive && (
        <div
          style={{
            position: 'absolute',
            top: height + 5,
            left: 0,
            minWidth: '100%',
            maxHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            padding: 4,
            zIndex: 200,
            whiteSpace: 'nowrap',
          }}
        >
          {searchable && (
            <div style={{ position: 'relative', padding: 2, marginBottom: 2 }} onClick={(e) => e.stopPropagation()}>
              <Icon name="search" size={13} color={colors.textFaint} strokeWidth={2} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search…"
                style={{ width: '100%', height: 32, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '0 8px 0 28px', fontSize: 12, fontFamily: 'inherit', color: colors.ink, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}
          {(() => {
            const q = query.trim().toLowerCase()
            const filtered = q ? options.filter((o) => String(o.label).toLowerCase().includes(q)) : options
            const shown = filtered.slice(0, 100)
            return (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filtered.length === 0 && <div style={{ padding: '8px 10px', fontSize, color: colors.textFaint }}>{options.length === 0 ? 'No options' : 'No matches'}</div>}
                {shown.map((opt, oi) => {
                  const checked = multi && Array.isArray(selected) && selected.includes(opt.value)
                  return (
                    <div
                      key={opt.id != null ? `id-${opt.id}` : `${opt.value}-${oi}`}
                      onClick={() => { if (multi) { onToggle && onToggle(opt.value) } else { onChange && onChange(opt.value); setOpen(false) } }}
                      style={{ padding: '8px 10px', fontSize, color: colors.textMuted, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceMuted)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {multi && (
                        <span style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checked ? colors.green : '#fff', border: checked ? `1px solid ${colors.green}` : `1.5px solid ${colors.borderStrong}` }}>
                          {checked && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg>}
                        </span>
                      )}
                      {opt.label}
                    </div>
                  )
                })}
                {filtered.length > shown.length && (
                  <div style={{ padding: '8px 10px', fontSize: 11, color: colors.textFaint }}>+{filtered.length - shown.length} more — keep typing to narrow…</div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

const searchTabs = ['Properties']
const cityPills = ['All cities', 'Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar']
const projCats = ['All projects', 'Apartments', 'Villas', 'Offices', 'Townhouses']

// Dropdown option sets ({ label, value }) for the working filter controls.
const cityDropOptions = cityPills.map((c) => ({ label: c, value: c }))

// Real Saudi districts/areas per city — the areas dropdown depends on the selected city.
const CITY_AREAS = {
  Riyadh: ['Olaya', 'Al Malqa', 'King Fahd District', 'Al Nakheel', 'Hittin', 'Al Yasmin', 'Diplomatic Quarter', 'Al Wurud', 'Al Sahafa', 'Al Ghadir', 'Al Rabwah', 'Al Muruj'],
  Jeddah: ['Al Hamra', 'Al Rawdah', 'Al Shatea', 'Al Salamah', 'Corniche', 'Obhur', 'Al Naeem', 'Al Zahra', 'Al Faisaliyah', 'Al Andalus', 'Al Bawadi', 'Al Marwah'],
  Dammam: ['Al Faisaliyah', 'Al Shatea', 'Al Muntazah', 'Al Aziziyah', 'Al Danah', 'Al Adamah', 'Al Firdaws', 'Al Nahda'],
  Mecca: ['Al Aziziyah', 'Al Rusaifah', 'Al Shuhada', 'Al Nuzhah', 'Al Awali', 'Al Zahir', 'Al Umrah'],
  Medina: ['Al Haram', 'Quba', 'Al Aqiq', 'Al Aziziyah', 'Al Khalidiyah', 'Shuran', 'Al Ranuna'],
  Khobar: ['Al Aqrabiyah', 'Al Ulaya', 'Al Rakah', 'Corniche', 'Al Hizam', 'Al Bandariyah', 'Al Yarmouk'],
}
const ALL_AREAS = [...new Set(Object.values(CITY_AREAS).flat())].sort()
const areasForCity = (city) => (city === 'All cities' ? ALL_AREAS : CITY_AREAS[city] || []).map((a) => ({ label: a, value: a }))
const typeDropOptions = [
  { label: 'All types', value: 'All projects' },
  { label: 'Apartments', value: 'Apartments' },
  { label: 'Villas', value: 'Villas' },
  { label: 'Townhouses', value: 'Townhouses' },
  { label: 'Offices', value: 'Offices' },
  { label: 'Land', value: 'Land' },
]
const commissionOptions = [
  { label: 'Any commission', value: 0 },
  { label: '2%+', value: 2 },
  { label: '2.5%+', value: 2.5 },
  { label: '3%+', value: 3 },
]
const priceOptions = [
  { label: 'Any price', value: 'any' },
  { label: 'Under SAR 1M', value: 'u1' },
  { label: 'SAR 1M – 5M', value: '1-5' },
  { label: 'SAR 5M+', value: '5p' },
]

// Stat-strip tiles: the icon + label are static design; the value is derived
// from the live marketplaceStats() payload (fmt receives the stats object).
const statTiles = [
  { icon: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>), label: 'Verified realtors', fmt: (s) => `${s.realtors.toLocaleString()}` },
  { icon: (<><path d="M3 21h18" /><path d="M6 21V7l6-4 6 4v14" /><path d="M9 11h2M13 11h2M9 15h2M13 15h2" /></>), label: 'Developer projects', fmt: (s) => `${s.liveProjects.toLocaleString()}` },
  { icon: (<><circle cx="12" cy="12" r="9" /><path d="M8.5 15.5l7-7" /><circle cx="9" cy="9" r="1.3" /><circle cx="15" cy="15" r="1.3" /></>), label: 'Commission paid', fmt: (s) => `SAR ${s.commissionPaid.toLocaleString()}` },
  { icon: (<><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>), label: 'Cities covered', fmt: (s) => `${s.cities.toLocaleString()}`, last: true },
]

// Browse-by-type tiles: icon + name are static; the project count is derived
// live from the real project list in the component.
const browseTypes = [
  { icon: (<><path d="M3 21h18" /><rect x="6" y="3" width="7" height="18" /><path d="M13 9h5v12" /><path d="M9 7v.01M9 11v.01M9 15v.01" /></>), name: 'Apartments' },
  { icon: (<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>), name: 'Villas' },
  { icon: (<><path d="M3 21h18" /><path d="M5 21V9l5-4v16" /><path d="M14 21V11l5-3v13" /><path d="M8 11v.01M8 15v.01" /></>), name: 'Townhouses' },
  { icon: (<><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" /><path d="M10 21v-3h4v3" /></>), name: 'Offices' },
]

// Clean theme gradient used behind a card when a real cover image is missing —
// replaces the old grey/dark hatch "placeholder" look.
const coverFallback = `linear-gradient(135deg, ${colors.greenDarker} 0%, ${colors.ink} 100%)`

// Shared formatters for the real project shape.
const fmtPriceRange = (p) =>
  p.priceFrom != null && p.priceTo != null
    ? `SAR ${p.priceFrom.toLocaleString()} – ${p.priceTo.toLocaleString()}`
    : p.priceFrom != null
      ? `From SAR ${p.priceFrom.toLocaleString()}`
      : '—'

const typeSpec = (p) => [p.type, p.bedrooms != null ? `${p.bedrooms} BR` : null].filter(Boolean).join(' · ') || '—'
const projLoc = (p) => `${p.city || '—'}${p.country ? ` · ${countryName(p.country)}` : ''}`

const exploreTools = [
  { title: 'Commission Calculator', sub: 'Estimate your earnings per deal', d: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M8.5 15.5l7-7' },
  { title: 'New Projects', sub: 'Latest off-plan launches', d: 'M3 21h18M6 21V8l6-4 6 4v13M9 11h2M13 11h2M9 15h2M13 15h2' },
  { title: 'My Leads', sub: 'Track every lead from submit to close', d: 'M14 9V5a2 2 0 0 0-2-2l-3 7v11h9.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3zM7 21H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3' },
  { title: 'Developer Directory', sub: 'Browse all verified developers', d: 'M4 3h16v18H4zM8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M10 21v-3h4v3' },
  { title: 'Payment Plans', sub: 'Compare off-plan payment plans', d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h1' },
  { title: 'Area Guides', sub: 'Explore Saudi districts & prices', d: 'M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15' },
  { title: 'Price Trends', sub: 'Track real-estate prices over time', d: 'M3 17l6-6 4 4 8-8M17 7h4v4' },
  { title: 'Area Unit Converter', sub: 'm² · ft² · dunum instantly', d: 'M4 4h7v7H4zM13 13h7v7h-7zM7 16v3M5.5 17.5h3M16.5 6h3M18 4.5v3' },
]

const faqs = [
  { q: 'Who can join Waseet?', a: 'Verified property developers and licensed real estate agents across Saudi Arabia can apply. All applicants are reviewed by our admin team within 24 hours.' },
  { q: 'How is commission paid?', a: 'When a deal closes, the developer pays the commission to Waseet. After verification, Waseet disburses your share directly to your registered bank account within 5–7 business days.' },
  { q: 'How long does verification take?', a: 'Applications are reviewed within 24 hours. You will receive an email with your account credentials once approved.' },
  { q: 'Which cities does Waseet cover?', a: 'Waseet operates across Saudi Arabia — including Jeddah, Riyadh, Dammam, Mecca, Medina and Khobar — with new cities added regularly.' },
  { q: 'What is the commission structure?', a: 'Each project lists its commission rate per unit type upfront — typically 2–4%. Waseet charges a platform fee of 10–20% from the commission, and the remainder goes to the realtor.' },
]

function CityPill({ label, active, onClick }) {
  const [h, hp] = useHover()
  return (
    <span
      {...hp}
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: 12,
        cursor: 'pointer',
        border: `1px solid ${active ? colors.ink : colors.border}`,
        background: active ? colors.ink : h ? colors.surfaceAlt : '#fff',
        color: active ? '#fff' : colors.textMuted,
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </span>
  )
}

function CatPill({ label, active, onClick }) {
  const [h, hp] = useHover()
  return (
    <span
      {...hp}
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 7,
        fontSize: 12,
        cursor: 'pointer',
        background: active ? colors.greenTint : h ? colors.surfaceMuted : '#fff',
        border: `1px solid ${active ? colors.greenTintBorder : colors.border}`,
        color: active ? colors.greenDark : colors.textMuted,
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </span>
  )
}

function TypeCard({ c, count, onSelect }) {
  const [h, hp] = useHover()
  return (
    <div
      {...hp}
      onClick={onSelect}
      style={{
        background: h ? colors.greenTint : '#fff',
        border: `1px solid ${h ? colors.green : colors.border}`,
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        transform: h ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{c.icon}</svg>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
        <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>{count} project{count === 1 ? '' : 's'}</div>
      </div>
    </div>
  )
}

// Status pill tone for real backend statuses (LIVE / PENDING / …).
const statusPill = {
  LIVE: { label: 'Live', color: colors.greenDark, background: colors.greenTint, border: colors.greenTintBorder },
  PENDING: { label: 'Pending', color: colors.amberText, background: colors.amberTint, border: colors.amberTintBorder },
}

// Live-data card. Mirrors the marketplace ProjectCard design but reads the real
// project shape and navigates to the private /marketplace/:id detail page.
function LiveProjectCard({ project, onToggleSave }) {
  const [hovered, hoverProps] = useHover()
  const navigate = useNavigate()
  const p = project
  const name = p.title || '—'
  const developer = p.developerName || '—'
  const loc = `${p.city || '—'}${p.country ? ` · ${countryName(p.country)}` : ''}`
  const priceRange =
    p.priceFrom != null && p.priceTo != null
      ? `SAR ${p.priceFrom.toLocaleString()}–${p.priceTo.toLocaleString()}`
      : p.priceFrom != null
        ? `From SAR ${p.priceFrom.toLocaleString()}`
        : '—'
  const typeLabel = [p.type, p.bedrooms != null ? `${p.bedrooms} BR` : null].filter(Boolean).join(' · ') || '—'
  const st = statusPill[p.status] || { label: p.status || '—', color: colors.textFaint, background: colors.surfaceMuted, border: colors.border }

  return (
    <div
      {...hoverProps}
      onClick={() => navigate(`/marketplace/${p.id}`)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? colors.borderStrong : colors.border}`,
        borderRadius: radius.xl,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 160ms ease',
      }}
    >
      <div style={{ height: 168, background: p.image ? colors.surfaceMuted : coverFallback, position: 'relative' }}>
        {p.image && <img src={p.image} alt={name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div
          onClick={(e) => { e.stopPropagation(); onToggleSave(p) }}
          style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.92)', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill={p.saved ? colors.green : 'none'} stroke={p.saved ? colors.green : colors.textSoft} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
        </div>
        {p.commissionPct != null && (
          <span style={{ position: 'absolute', bottom: 10, right: 10, background: colors.ink, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>
            {p.commissionPct}% Commission
          </span>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>{name}</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
          <Icon name="mapPin" size={12} color={colors.textFaint} strokeWidth={2} />
          <span style={{ fontSize: 12, color: colors.textFaint }}>{loc}</span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: colors.surfaceMuted }} />
          <span style={{ fontSize: 11, color: colors.textSoft }}>{developer}</span>
          <Icon name="checkCircle" size={12} color={colors.green} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{priceRange}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ background: colors.surfaceMuted, borderRadius: 5, padding: '2px 8px', fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>
            {typeLabel}
          </span>
          <span style={{ background: st.background, border: `1px solid ${st.border}`, color: st.color, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
            {st.label}
          </span>
        </div>
      </div>
    </div>
  )
}

// Full-screen map modal. Left column lists the (filtered) real projects; the
// right pane embeds an interactive Google map for the selected project. Escape,
// the × button, or a click on the backdrop closes it.
function MapModal({ projects, onClose, navigate }) {
  const [selectedId, setSelectedId] = useState(projects[0]?.id)
  const selected = projects.find((p) => p.id === selectedId) || projects[0]

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const priceRange = (p) =>
    p.priceFrom != null && p.priceTo != null
      ? `SAR ${p.priceFrom.toLocaleString()}–${p.priceTo.toLocaleString()}`
      : p.priceFrom != null
        ? `From SAR ${p.priceFrom.toLocaleString()}`
        : '—'

  const mapSrc = selected
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${selected.title}, ${selected.city || ''}, ${countryName(selected.country)}`)}&output=embed`
    : ''

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 1000, height: '80vh', maxHeight: 640, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Icon name="layers" size={18} color={colors.green} strokeWidth={1.9} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected ? selected.title || '—' : 'Projects on map'}</div>
              {selected && <div style={{ fontSize: 12, color: colors.textFaint }}>{selected.city || '—'} · {countryName(selected.country)}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {selected && (
              <span
                onClick={() => { onClose(); navigate(`/marketplace/${selected.id}`) }}
                style={{ fontSize: 13, color: colors.greenDark, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                View details →
              </span>
            )}
            <div
              onClick={onClose}
              style={{ width: 32, height: 32, minWidth: 32, borderRadius: 8, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Icon name="x" size={16} color={colors.textMuted} strokeWidth={2} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <div style={{ width: 300, minWidth: 240, borderRight: `1px solid ${colors.border}`, overflowY: 'auto' }}>
            {projects.length === 0 ? (
              <div style={{ padding: 24, fontSize: 13, color: colors.textFaint }}>No projects to show.</div>
            ) : (
              projects.map((p) => {
                const on = p.id === selectedId
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.surfaceMuted}`, cursor: 'pointer', background: on ? colors.greenTint : '#fff', borderLeft: `3px solid ${on ? colors.green : 'transparent'}` }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{p.title || '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: colors.textFaint, marginBottom: 6 }}>
                      <Icon name="mapPin" size={12} color={colors.textFaint} strokeWidth={2} />
                      {p.city || '—'} · {countryName(p.country)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{priceRange(p)}</span>
                      {p.commissionPct != null && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: colors.greenDark, whiteSpace: 'nowrap' }}>{p.commissionPct}% comm.</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div style={{ flex: 1, background: colors.surfaceMuted, position: 'relative', minWidth: 0 }}>
            {/* all project locations plotted as pins; selecting a row focuses its pin */}
            <MapMultiView projects={projects} selectedId={selectedId} onSelect={setSelectedId} height="100%" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('Properties')
  const [deal, setDeal] = useState('Buy')
  const [status, setStatus] = useState('All')
  const [city, setCity] = useState('All cities')
  const [cat, setCat] = useState('All projects')
  const [areas, setAreas] = useState([]) // multi-select districts (depends on city)
  const [commission, setCommission] = useState(0)
  const [price, setPrice] = useState('any')
  const [featCat, setFeatCat] = useState('All projects') // Featured section's own category filter
  const [mapOpen, setMapOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(0)
  const resultsRef = useRef(null)

  // areas depend on the selected city; reset the picks whenever the city changes
  // Saudi cities + districts served from our DB (imported open dataset).
  const [geoCities, setGeoCities] = useState([])
  const [areaDistricts, setAreaDistricts] = useState([])
  useEffect(() => {
    let active = true
    geoApi.cities().then((list) => { if (active) setGeoCities(Array.isArray(list) ? list : []) }).catch(() => {})
    return () => { active = false }
  }, [])

  // When the city changes, reset the area picks and load that city's districts.
  useEffect(() => {
    setAreas([])
    const sel = geoCities.find((c) => c.name === city)
    if (!sel) { setAreaDistricts([]); return }
    let active = true
    geoApi.districts(sel.id).then((d) => { if (active) setAreaDistricts(Array.isArray(d) ? d : []) }).catch(() => { if (active) setAreaDistricts([]) })
    return () => { active = false }
  }, [city, geoCities])

  const cityDropOptions = useMemo(() => [{ label: 'All cities', value: 'All cities', id: 'all' }, ...geoCities.map((c) => ({ label: c.name, value: c.name, id: `c-${c.id}` }))], [geoCities])
  const areaOpts = useMemo(() => areaDistricts.map((d) => ({ label: d.name, value: d.name, id: `d-${d.id}` })), [areaDistricts])
  const areaLabel = areas.length === 0 ? 'All areas' : areas.length === 1 ? areas[0] : `${areas.length} areas`
  const toggleArea = (a) => setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))

  // Live projects from the backend (private marketplace behind login).
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  useEffect(() => {
    let active = true
    realtorApi
      .listProjects()
      .then((list) => { if (active) setItems(Array.isArray(list) ? list : []) })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Aggregate marketplace stats (counts, commission paid, per-city breakdown).
  useEffect(() => {
    let active = true
    realtorApi
      .marketplaceStats()
      .then((s) => { if (active) setStats(s || null) })
      .catch(() => { if (active) setStats(null) })
    return () => { active = false }
  }, [])

  const toggleSave = (p) => {
    const next = !p.saved
    setItems((list) => list.map((x) => (x.id === p.id ? { ...x, saved: next } : x)))
    const call = next ? realtorApi.saveProject(p.id) : realtorApi.unsaveProject(p.id)
    call.catch(() => {
      // revert on failure
      setItems((list) => list.map((x) => (x.id === p.id ? { ...x, saved: !next } : x)))
    })
  }

  const filtered = items.filter((p) => {
    const cityOk = city === 'All cities' || p.city === city
    const catOk =
      cat === 'All projects' ||
      (p.type && p.type.toLowerCase().includes(cat.toLowerCase().replace(/s$/, '')))
    const commOk = !commission || (p.commissionPct != null && p.commissionPct >= commission)
    const priceOk =
      price === 'any' ||
      (p.priceFrom != null &&
        (price === 'u1'
          ? p.priceFrom < 1000000
          : price === '1-5'
            ? p.priceFrom >= 1000000 && p.priceFrom <= 5000000
            : price === '5p'
              ? p.priceFrom > 5000000
              : true))
    return cityOk && catOk && commOk && priceOk
  })

  // Trigger labels derived from the current filter state.
  const commissionLabel = commission ? commissionOptions.find((o) => o.value === commission).label : 'Commission %'
  const priceLabel = price === 'any' ? 'Price range' : priceOptions.find((o) => o.value === price).label

  // Real data slices for the curated listing sections (no fabricated cards).
  // "Featured" is driven entirely by the admin (Projects → Feature). Only
  // admin-featured projects show here; if none are featured the rail is empty.
  const featuredProjects = items.filter(
    (p) => p.featured && (featCat === 'All projects' || (p.type && p.type.toLowerCase().includes(featCat.toLowerCase().replace(/s$/, '')))),
  )
  const exclusiveProjects = [...items].sort((a, b) => (b.commissionPct || 0) - (a.commissionPct || 0)).slice(0, 4)
  const decoCards = items.slice(0, 2) // fanned cards in the dark band
  const cityEntries = stats?.cityCounts
    ? Object.entries(stats.cityCounts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
    : []
  // Handpicked ties to the busiest city so the "Handpicked in {city}" header is honest.
  const topCity = cityEntries[0]?.[0] || null
  const handpickedProjects = (topCity ? items.filter((p) => p.city === topCity) : items).slice(0, 4)
  const handpickedLabel = topCity ? `Handpicked in ${topCity}` : 'Handpicked for you'
  const coverForCity = (cityName) => items.find((p) => p.city === cityName && p.image)?.image || null
  const typeCount = (name) => items.filter((p) => p.type && p.type.toLowerCase().includes(name.toLowerCase().replace(/s$/, ''))).length
  // Jump to results with a filter applied (used by city / type cards + hero pills).
  const goToResults = () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Build the shared criteria query and route to the listing / map pages.
  const buildQuery = (over = {}) => {
    const q = new URLSearchParams()
    const c = over.city ?? city
    const t = over.cat ?? cat
    if (c && c !== 'All cities') q.set('city', c)
    if (t && t !== 'All projects') q.set('cat', t)
    if (commission) q.set('commission', String(commission))
    if (price !== 'any') q.set('price', price)
    return q.toString()
  }
  const goSearch = (over) => { const s = buildQuery(over); navigate('/browse' + (s ? `?${s}` : '')) }
  const goMap = (over) => { const s = buildQuery(over); navigate('/marketplace/map' + (s ? `?${s}` : '')) }

  return (
    <div>
      {/* HERO */}
      <div style={{ background: '#fff', padding: '48px 24px 40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: 999, padding: '4px 11px', marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.green, animation: 'ps-pulse 1.8s ease-in-out infinite' }} />
          <span style={{ fontSize: 12, color: colors.textSoft }}>Live · <span style={{ fontWeight: 700, color: colors.ink }}>{(stats?.activeListings ?? items.length).toLocaleString()}</span> active listings</span>
        </div>
        <h1 className="wa-h1" style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: 600, margin: '0 auto 12px' }}>
          Saudi Arabia's Premier<br />B2B Real Estate <span style={{ color: colors.green }}>Network.</span>
        </h1>
        <p style={{ fontSize: 14, color: colors.textSoft, lineHeight: 1.5, maxWidth: 460, margin: '0 auto 8px' }}>Connecting verified developers with licensed realtors.</p>
        <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 28 }}>Jeddah · Riyadh · Dammam · Mecca · Medina · Khobar</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Verified developers', 'Licensed realtors', 'Commission protected'].map((t) => (
            <span key={t} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: colors.textSoft }}>
              <Icon name="checkCircle" size={15} color={colors.green} strokeWidth={2} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* SEARCH CARD */}
      <div style={{ background: '#fff', padding: '8px 24px 28px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)', overflow: 'visible' }}>
            <div style={{ borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '0 16px', display: 'flex' }}>
              {searchTabs.map((t) => {
                const on = t === tab
                return (
                  <div key={t} onClick={() => setTab(t)} style={{ padding: '13px 14px', fontSize: 13, fontWeight: on ? 600 : 500, color: on ? colors.ink : colors.textSoft, borderBottom: `2px solid ${on ? colors.green : 'transparent'}`, cursor: 'pointer', marginBottom: -1 }}>
                    {t}
                  </div>
                )
              })}
            </div>

            {tab === 'Properties' && (
              <div>
                <div style={{ padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Segmented options={['Buy', 'Rent']} value={deal} onChange={setDeal} />
                  <DropField label={city} flex={1} options={cityDropOptions} onChange={setCity} searchable />
                  <DropField label={city === 'All cities' ? 'Select a city first' : areaLabel} flex={1.5} options={areaOpts} multi selected={areas} onToggle={toggleArea} disabled={city === 'All cities'} searchable />
                  <button
                    onClick={() => goSearch()}
                    style={{ height: 36, padding: '0 18px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                  >
                    <Icon name="search" size={14} color="#fff" strokeWidth={2} />
                    Search
                  </button>
                </div>
                <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Segmented options={['All', 'Ready', 'Off-plan']} value={status} onChange={setStatus} height={34} fontSize={12} />
                  <DropField label={cat === 'All projects' ? 'Property type' : cat} options={typeDropOptions} onChange={setCat} height={34} fontSize={12} />
                  <DropField label={commissionLabel} accent options={commissionOptions} onChange={setCommission} height={34} fontSize={12} />
                  <DropField label={priceLabel} options={priceOptions} onChange={setPrice} height={34} fontSize={12} />
                </div>
                <div onClick={() => goMap()} style={{ margin: '0 14px 12px', background: colors.greenTint, border: `1px solid ${colors.greenSoft}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <Icon name="layers" size={16} color={colors.green} strokeWidth={1.9} />
                  <span style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: colors.greenDark }}>Search on map</span>
                    <span style={{ color: colors.textMuted }}> — Explore projects by location, side by side with listings</span>
                  </span>
                  <Icon name="arrowRight" size={14} color={colors.green} strokeWidth={2} style={{ marginLeft: 'auto' }} />
                </div>
              </div>
            )}

            {tab !== 'Properties' && (
              <div style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={tab === 'For developers' ? 'building' : 'users'} size={20} color={colors.green} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                    {tab === 'For developers' ? 'List your off-plan & ready projects' : 'Browse exclusive developer projects'}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSoft }}>
                    {tab === 'For developers'
                      ? 'Reach 200+ verified realtors and show commission rates upfront on every unit.'
                      : 'Submit client leads with commission shown upfront, and get paid on every closed deal.'}
                  </div>
                </div>
                <button
                  onClick={() => navigate(tab === 'For developers' ? '/register/developer' : '/register/realtor')}
                  style={{ height: 40, padding: '0 20px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {tab === 'For developers' ? 'List your project' : 'Join as realtor'}
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {cityPills.map((c) => (
              <CityPill key={c} label={c} active={city === c} onClick={() => setCity(c)} />
            ))}
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, display: 'flex', flexWrap: 'wrap' }}>
        {statTiles.map((s, i) => (
          <div key={i} style={{ flex: '1 1 180px', padding: '22px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, borderRight: s.last ? 'none' : `1px solid ${colors.border}` }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{stats ? s.fmt(stats) : '—'}</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FEATURED PROJECTS */}
      <div ref={resultsRef} style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '40px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Featured projects</h2>
            <span style={{ fontSize: 13, color: colors.greenDark, fontWeight: 500, cursor: 'pointer' }}>View all →</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {projCats.map((c) => (
              <CatPill key={c} label={c} active={featCat === c} onClick={() => setFeatCat(c)} />
            ))}
          </div>
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading projects…</div>
          ) : featuredProjects.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>No featured projects yet. Browse all projects below or check back soon.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 340px))', gap: 16, justifyContent: 'start' }}>
              {featuredProjects.map((p) => (
                <LiveProjectCard key={p.id} project={p} onToggleSave={toggleSave} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BROWSE BY TYPE */}
      <div style={{ background: '#fff', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 18px' }}>Browse by type</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {browseTypes.map((c, i) => (
              <TypeCard key={i} c={c} count={typeCount(c.name)} onSelect={() => goSearch({ cat: c.name })} />
            ))}
          </div>
        </div>
      </div>

      {/* DARK BAND */}
      <div style={{ background: colors.ink, padding: '48px 24px', position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(ellipse at 70% 50%, rgba(22,163,74,0.12) 0%, transparent 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 11px)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', position: 'relative', minHeight: 280 }}>
          <div style={{ maxWidth: 540 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '5px 12px', marginBottom: 18 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.green, animation: 'ps-pulse 1.8s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>New developments live now</span>
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 14px' }}>Exclusive access to Saudi Arabia's finest off-plan projects.</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 460, margin: '0 0 24px' }}>Every verified project shows commission rates upfront — no chasing developers, no surprises.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/marketplace')} style={{ height: 40, padding: '0 20px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Explore projects</button>
              <button onClick={() => goMap()} style={{ height: 40, padding: '0 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', fontFamily: 'inherit', cursor: 'pointer' }}>View on map</button>
            </div>
          </div>

          {/* fanned floating cards — real top projects; rotate on wrapper, float on inner */}
          {decoCards.length > 0 && (
            <div className="wa-deco" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 430, height: 260 }}>
              {decoCards[1] && (
                <div style={{ position: 'absolute', right: 215, top: 36, transform: 'rotate(-7deg)' }}>
                  <div onClick={() => navigate(`/marketplace/${decoCards[1].id}`)} style={{ width: 210, background: 'rgba(22,22,22,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 18px 40px rgba(0,0,0,0.5)', animation: 'wfloat 4.5s ease-in-out infinite', animationDelay: '1.2s', cursor: 'pointer' }}>
                    <div style={{ height: 96, background: coverFallback, position: 'relative' }}>
                      {decoCards[1].image && <img src={decoCards[1].image} alt={decoCards[1].title || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <span style={{ position: 'absolute', top: 9, left: 9, background: '#FEF9EC', border: '1px solid #F3E2B8', borderRadius: 999, padding: '2px 8px', fontSize: 9, fontWeight: 600, color: '#92763A' }}>NEW</span>
                      {decoCards[1].commissionPct != null && <span style={{ position: 'absolute', bottom: 9, right: 9, background: colors.green, borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#fff' }}>{decoCards[1].commissionPct}% Commission</span>}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decoCards[1].title || '—'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{projLoc(decoCards[1])}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{fmtPriceRange(decoCards[1])}</div>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ position: 'absolute', right: 4, top: 8, transform: 'rotate(3deg)' }}>
                <div onClick={() => navigate(`/marketplace/${decoCards[0].id}`)} style={{ width: 232, background: 'rgba(24,24,24,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 26px 60px rgba(0,0,0,0.6)', animation: 'wfloat 4.5s ease-in-out infinite', cursor: 'pointer' }}>
                  <div style={{ height: 120, background: coverFallback, position: 'relative' }}>
                    {decoCards[0].image && <img src={decoCards[0].image} alt={decoCards[0].title || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <span style={{ position: 'absolute', top: 10, left: 10, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 999, padding: '3px 9px', fontSize: 10, fontWeight: 600, color: colors.greenDark, letterSpacing: '0.03em' }}>FEATURED</span>
                    {decoCards[0].commissionPct != null && <span style={{ position: 'absolute', bottom: 10, right: 10, background: colors.green, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>{decoCards[0].commissionPct}% Commission</span>}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decoCards[0].title || '—'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{projLoc(decoCards[0])}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{fmtPriceRange(decoCards[0])}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WASEET EXCLUSIVE — real highest-commission projects */}
      {exclusiveProjects.length > 0 && (
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '40px 24px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenSoft}`, borderRadius: 16, padding: '22px 22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Waseet Exclusive</h2>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: colors.green, color: '#fff', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                    <Icon name="check" size={12} color="#fff" strokeWidth={2.2} />Listed by us
                  </span>
                </div>
                <span onClick={() => goSearch()} style={{ fontSize: 13, color: colors.greenDark, fontWeight: 500, cursor: 'pointer' }}>View all →</span>
              </div>
              <div className="pd-tabs" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
                {exclusiveProjects.map((p) => (
                  <div key={p.id} onClick={() => navigate(`/marketplace/${p.id}`)} style={{ flex: 'none', width: 270, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ height: 150, background: coverFallback, position: 'relative' }}>
                      {p.image && <img src={p.image} alt={p.title || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <span style={{ position: 'absolute', top: 10, left: 10, background: colors.ink, color: '#fff', borderRadius: 5, padding: '3px 9px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>EXCLUSIVE</span>
                      {p.commissionPct != null && <span style={{ position: 'absolute', bottom: 10, right: 10, background: colors.green, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>{p.commissionPct}% Commission</span>}
                    </div>
                    <div style={{ padding: '13px 14px' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 3 }}>{fmtPriceRange(p)}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title || '—'}</div>
                      <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 10 }}>{projLoc(p)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textSoft, marginBottom: 5 }}>
                        <Icon name="building" size={13} color={colors.textFaint} strokeWidth={1.8} />{p.developerName || '—'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textSoft }}>
                        <Icon name="grid" size={13} color={colors.textFaint} strokeWidth={1.8} />{typeSpec(p)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BROWSE BY CITY — real cities with real project cover images */}
      {cityEntries.length > 0 && (
        <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '40px 24px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 18px' }}>Browse by city</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {cityEntries.map(([name, count]) => {
                const photo = cityImage(name) || coverForCity(name)
                return (
                  <div key={name} onClick={() => goSearch({ city: name })} style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative', height: 130, background: coverFallback }}>
                    {photo && <img src={photo} alt={name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.78) 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 11, left: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{count} project{count > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* HANDPICKED — real projects from the busiest city */}
      {handpickedProjects.length > 0 && (
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '40px 24px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, letterSpacing: '0.08em', marginBottom: 4 }}>FEATURED</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{handpickedLabel}</h2>
              </div>
              <span onClick={() => goSearch()} style={{ fontSize: 13, color: colors.greenDark, fontWeight: 500, cursor: 'pointer' }}>View all →</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 300px))', gap: 14, justifyContent: 'start' }}>
              {handpickedProjects.map((p) => (
                <div key={p.id} onClick={() => navigate(`/marketplace/${p.id}`)} style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: '#fff' }}>
                  <div style={{ height: 150, background: colors.surfaceMuted, backgroundImage: p.image ? 'none' : coverFallback, position: 'relative' }}>
                    {p.image && <img src={p.image} alt={p.title || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <span style={{ position: 'absolute', top: 9, left: 9, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.95)', border: `1px solid ${colors.border}`, borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: colors.greenDark }}>
                      <Icon name="check" size={12} color={colors.green} strokeWidth={2.2} />Verified
                    </span>
                    <div style={{ position: 'absolute', top: 9, right: 9, width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.92)', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="bookmark" size={14} color={colors.textSoft} strokeWidth={1.8} />
                    </div>
                    {p.commissionPct != null && <span style={{ position: 'absolute', bottom: 9, right: 9, background: colors.ink, borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 700, color: '#fff' }}>{p.commissionPct}% Commission</span>}
                  </div>
                  <div style={{ padding: '12px 13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{fmtPriceRange(p)}</span>
                      <span style={{ fontSize: 11, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.developerName || '—'}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.greenDark, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title || '—'}</div>
                    <div style={{ fontSize: 12, color: colors.textSoft, marginBottom: 4 }}>{typeSpec(p)}</div>
                    <div style={{ fontSize: 12, color: colors.textFaint }}>{projLoc(p)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXPLORE MORE */}
      <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '48px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 28px' }}>Explore more on Waseet</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px 28px' }}>
            {exploreTools.map((t) => (
              <div key={t.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, minWidth: 44, borderRadius: 11, background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={t.d} /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4, lineHeight: 1.45 }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* APP DOWNLOAD */}
      <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '40px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenSoft}`, borderRadius: 16, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: colors.ink }}>Take Waseet anywhere</h2>
              <p style={{ fontSize: 14, color: colors.greenDark, lineHeight: 1.55, margin: '0 0 20px', maxWidth: 440 }}>Submit leads, track your commissions, and get notified the moment a new verified project goes live — right from your phone.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['Download on the', 'App Store'], ['Get it on', 'Google Play']].map(([top, bot]) => (
                  <div key={bot} style={{ display: 'flex', alignItems: 'center', gap: 9, background: colors.ink, borderRadius: 9, padding: '8px 16px', cursor: 'pointer' }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff">{bot === 'App Store' ? <path d="M17.6 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.3 2-1.4 2.5-.4 6.1 1 8.1.7 1 1.4 2.1 2.5 2.1 1 0 1.4-.7 2.6-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.1-.8-2.1-3.2zM15.5 6.3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z" /> : <path d="M3.6 2.4c-.3.3-.5.7-.5 1.3v16.6c0 .6.2 1 .5 1.3l9-9.3-9-9.9zM16.5 8.9 5.9 2.7l8.2 8.5 2.4-2.3zm-2.4 3.9-8.2 8.5 10.6-6.2-2.4-2.3zm5.5-2.3L16.5 8.9l-2.4 2.3 2.4 2.3 3.1-1.6c.9-.5.9-1.9 0-2.4z" />}</svg>
                    <div style={{ lineHeight: 1.15 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{top}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{bot}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 120, height: 120, borderRadius: 14, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: 96, height: 96, background: '#fff', borderRadius: 6 }}>
                <div style={{ position: 'absolute', inset: 10, background: 'repeating-conic-gradient(#0A0A0A 0% 25%, #fff 0% 50%) 0 0 / 8px 8px', borderRadius: 2 }} />
                {[{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }].map((pos, i) => (
                  <div key={i} style={{ position: 'absolute', ...pos, width: 24, height: 24, background: '#fff', border: '5px solid #0A0A0A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 7, height: 7, background: '#0A0A0A', borderRadius: 2 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '48px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', margin: '0 0 28px' }}>Frequently asked questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqs.map((f, i) => {
              const open = faqOpen === i
              return (
                <div key={i} style={{ background: '#fff', border: `1px solid ${open ? colors.borderStrong : colors.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div onClick={() => setFaqOpen(open ? -1 : i)} style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: colors.ink }}>{f.q}</span>
                    <span style={{ transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms ease', display: 'flex' }}>
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </span>
                  </div>
                  {open && <div style={{ padding: '0 18px 16px', fontSize: 13, color: colors.textSoft, lineHeight: 1.6 }}>{f.a}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {mapOpen && <MapModal projects={filtered} onClose={() => setMapOpen(false)} navigate={navigate} />}
    </div>
  )
}
