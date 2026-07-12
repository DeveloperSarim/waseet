import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, radius } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { useHover } from '../../hooks/useHover'
import { Topbar } from '../../components/layout/Topbar'
import { UserAvatar } from '../../components/UserAvatar'
import { statusTones } from '../../data/mock'
import { realtorApi } from '../../lib/api'
import { countryName } from '../../lib/adminFormat'

const cityTabs = ['All', 'Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar']
const catTabs = ['All', 'Apartments', 'Villas', 'Townhouses', 'Offices', 'Land']
const filters = [{ label: 'Property type' }, { label: 'Commission %', accent: true }, { label: 'Price range' }, { label: 'Status' }]

const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 8px)'

const tonePill = {
  green: { color: colors.greenDark, background: colors.greenTint, border: colors.greenTintBorder },
  amber: { color: colors.amberText, background: colors.amberTint, border: colors.amberTintBorder },
  gray: { color: colors.textFaint, background: colors.surfaceMuted, border: colors.border },
  red: { color: colors.red, background: colors.redTint, border: colors.redTintBorder },
}

// normalise type labels so "Apartments" tab matches a "Apartment" project type
const normType = (s) => (s || '').toLowerCase().replace(/s$/, '')

const money = (n) => (typeof n === 'number' ? `SAR ${n.toLocaleString()}` : null)

function FilterButton({ label, accent }) {
  const [h, hp] = useHover()
  return (
    <div {...hp} style={{ height: 34, border: `1px solid ${accent ? colors.green : colors.border}`, borderRadius: 7, padding: '0 12px', fontSize: 12, color: accent ? colors.greenDark : colors.textMuted, fontWeight: accent ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: h && !accent ? colors.surfaceAlt : '#fff' }}>
      {label}
      <Icon name="chevronDown" size={11} color={accent ? colors.green : colors.textFaint} strokeWidth={2} />
    </div>
  )
}

function Tab({ label, active, onClick }) {
  const [h, hp] = useHover()
  return (
    <div {...hp} onClick={onClick} style={{ padding: '11px 14px', fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer', color: active ? colors.ink : h ? colors.textMuted : colors.textSoft, fontWeight: active ? 600 : 400, borderBottom: `2px solid ${active ? colors.ink : 'transparent'}`, marginBottom: -1 }}>
      {label}
    </div>
  )
}

function ProjectCard({ project, onToggleSave }) {
  const [hovered, hoverProps] = useHover()
  const navigate = useNavigate()
  const p = project
  const st = tonePill[statusTones[p.status]] || tonePill.gray
  const priceRange = money(p.priceFrom) && money(p.priceTo)
    ? `${money(p.priceFrom)}–${p.priceTo.toLocaleString()}`
    : money(p.priceFrom) || money(p.priceTo) || '—'

  // open the full project detail page (in-app), not the raw map link
  const openListing = () => navigate(`/realtor/projects/${p.id}`)

  return (
    <div
      {...hoverProps}
      onClick={openListing}
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
      <div style={{ height: 168, background: colors.surfaceMuted, backgroundImage: p.image ? undefined : hatch, position: 'relative', overflow: 'hidden' }}>
        {p.image && <img src={p.image} alt={p.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(p.id) }}
          aria-label={p.saved ? 'Remove from saved' : 'Save project'}
          style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.92)', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill={p.saved ? colors.green : 'none'} stroke={p.saved ? colors.green : colors.textSoft} strokeWidth={1.8}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <span style={{ position: 'absolute', bottom: 10, right: 10, background: colors.ink, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>
          {p.commissionPct}% Commission
        </span>
        {!p.image && <span style={{ position: 'absolute', bottom: 10, left: 10, fontFamily: 'monospace', fontSize: 9, color: '#B6BAC0' }}>project render</span>}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>{p.title}</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
          <Icon name="mapPin" size={12} color={colors.textFaint} strokeWidth={2} />
          <span style={{ fontSize: 12, color: colors.textFaint }}>{p.city}{p.country ? ` · ${countryName(p.country)}` : ''}</span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: colors.surfaceMuted }} />
          <span style={{ fontSize: 11, color: colors.textSoft }}>{p.developerName}</span>
          <Icon name="checkCircle" size={12} color={colors.green} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{priceRange}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {p.type && (
            <span style={{ background: colors.surfaceMuted, borderRadius: 5, padding: '2px 8px', fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>
              {p.type}
            </span>
          )}
          {p.bedrooms != null && (
            <span style={{ background: colors.surfaceMuted, borderRadius: 5, padding: '2px 8px', fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>
              {p.bedrooms} BR
            </span>
          )}
          {p.status && (
            <span style={{ background: st.background, border: `1px solid ${st.border}`, color: st.color, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
              {p.status}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RealtorBrowse() {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All')
  const [cat, setCat] = useState('All')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    realtorApi
      .listProjects()
      .then((rows) => { if (alive) setProjects(rows || []) })
      .catch(() => { if (alive) setProjects([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const toggleSave = async (id) => {
    const target = projects.find((p) => p.id === id)
    if (!target) return
    const nextSaved = !target.saved
    // optimistic
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, saved: nextSaved } : p)))
    try {
      if (nextSaved) await realtorApi.saveProject(id)
      else await realtorApi.unsaveProject(id)
    } catch {
      // revert on failure
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, saved: !nextSaved } : p)))
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = projects.filter(
    (p) =>
      (city === 'All' || p.city === city) &&
      (cat === 'All' || normType(p.type) === normType(cat)) &&
      (!q || (p.title || '').toLowerCase().includes(q) || (p.city || '').toLowerCase().includes(q) || (p.developerName || '').toLowerCase().includes(q)),
  )

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Browse Projects</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{projects.length} live</span>
          </div>
        }
        notifications={3}
        avatar={<UserAvatar size={30} />}
      />

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300, minWidth: 180 }}>
          <Icon name="search" size={14} color={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects, developers..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit', color: colors.ink }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filters.map((f) => <FilterButton key={f.label} label={f.label} accent={f.accent} />)}
        </div>
        <span style={{ fontSize: 12, color: colors.textSoft, marginLeft: 'auto' }}>{filtered.length} projects</span>
      </div>

      {/* City + category tabs */}
      <div className="pd-tabs" style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex', overflowX: 'auto' }}>
        {cityTabs.map((t) => <Tab key={t} label={t} active={city === t} onClick={() => setCity(t)} />)}
      </div>
      <div className="pd-tabs" style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex', overflowX: 'auto' }}>
        {catTabs.map((t) => <Tab key={t} label={t} active={cat === t} onClick={() => setCat(t)} />)}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: colors.textSoft, fontSize: 13 }}>Loading projects…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: colors.textSoft }}>
            <Icon name="search" size={28} color={colors.textFaint} style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>No projects found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters or search.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map((p) => <ProjectCard key={p.id} project={p} onToggleSave={toggleSave} />)}
          </div>
        )}
      </div>
    </>
  )
}
