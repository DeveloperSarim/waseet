import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { Pagination } from './AdminTableKit'
import { adminApi } from '../../lib/api'
import { countryName, initials, joinedLabel, timeAgo } from '../../lib/adminFormat'

const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 8px)'

const money = (n) => `SAR ${Number(n || 0).toLocaleString()}`

// map an API project → the row shape this table renders
const toRow = (p) => ({
  id: p.id,
  name: p.title,
  units: [
    p.bedrooms != null && p.bedrooms !== '' ? `${p.bedrooms} BR` : null,
    p.priceFrom != null ? `${money(p.priceFrom)}–${Number(p.priceTo || 0).toLocaleString()}` : null,
    p.commissionPct != null ? `${p.commissionPct}% commission` : null,
  ].filter(Boolean).join(' · ') || '—',
  devInitials: initials(p.developerName),
  developer: p.developerName || '—',
  city: p.city || '—',
  country: countryName(p.country),
  type: p.type || '—',
  leads: p.leadCount != null ? String(p.leadCount) : '—',
  deals: '—',
  added: joinedLabel(p.createdAt),
  addedAgo: timeAgo(p.createdAt),
  status: p.status,
})

const sBadge = (bg, color, border) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 600, background: bg, color, border: `1px solid ${border}` })
const ST = {
  PENDING: { label: 'Pending Review', style: sBadge('#FEF9EC', colors.amberText, '#F3E2B8'), dot: false },
  LIVE: { label: 'Live', style: sBadge(colors.greenTint, colors.greenDark, colors.greenTintBorder), dot: true },
  DRAFT: { label: 'Draft', style: sBadge(colors.surfaceMuted, colors.textMuted, colors.border), dot: false },
  SOLD_OUT: { label: 'Sold Out', style: sBadge('#FFF5F5', '#991B1B', colors.redTintBorder), dot: false },
}

const tabDefs = [
  { id: 'All', status: null, countKey: 'all' },
  { id: 'Pending Review', status: 'PENDING', countKey: 'pending' },
  { id: 'Live', status: 'LIVE', countKey: 'live' },
  { id: 'Draft', status: 'DRAFT', countKey: 'draft' },
  { id: 'Sold Out', status: 'SOLD_OUT', countKey: 'soldOut' },
]

const headCell = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }
const chevron = <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>

// Developer filter — styled like the static filter pills, but opens a menu built
// from the `developers` list the projects endpoint returns. Selecting one filters
// the table (server-side); "All developers" clears the filter.
function DeveloperFilter({ developers, value, onChange }) {
  const [open, setOpen] = useState(false)
  const selected = developers.find((d) => d.id === value)
  const active = !!value
  const options = [{ id: '', name: 'All developers' }, ...developers]
  return (
    <div style={{ position: 'relative' }}>
      <span onClick={() => setOpen((o) => !o)} style={{ height: 34, padding: '0 12px', border: `1px solid ${active ? colors.borderStrong : colors.border}`, borderRadius: 7, fontSize: 12, color: active ? colors.ink : colors.textMuted, fontWeight: active ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: active ? colors.surfaceMuted : '#fff', whiteSpace: 'nowrap' }}>
        {selected ? selected.name : 'Developer'} {chevron}
      </span>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 40, left: 0, minWidth: 200, maxHeight: 280, overflowY: 'auto', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 41, padding: 4 }}>
            {options.map((d) => {
              const on = d.id === value
              return (
                <div key={d.id || 'all'} onClick={() => { onChange(d.id); setOpen(false) }} style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, color: on ? colors.ink : colors.textMuted, fontWeight: on ? 600 : 400, background: on ? colors.surfaceMuted : 'transparent' }}>
                  {d.name}
                  {on && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default function AdminProjects() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [counts, setCounts] = useState({ all: 0, live: 0, pending: 0, draft: 0, soldOut: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState('All')
  const [featuredFilter, setFeaturedFilter] = useState(false)
  const [featured, setFeatured] = useState({})
  const [developers, setDevelopers] = useState([])
  const [developerId, setDeveloperId] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const params = {}
      if (developerId) params.developerId = developerId
      const res = await adminApi.listProjects(params)
      setData((res.projects || []).map(toRow))
      if (res.counts) setCounts(res.counts)
      // keep the full developer list from the initial (unfiltered) load so the
      // dropdown stays populated even after a developer filter is applied.
      if (res.developers) setDevelopers((prev) => (prev.length ? prev : res.developers))
    } catch (e) {
      setLoadError(e.message || 'Could not load projects')
    } finally {
      setLoading(false)
    }
  }, [developerId])
  useEffect(() => { load() }, [load])

  const toggleFeature = (id) =>
    setFeatured((f) => {
      const n = { ...f }
      if (n[id]) delete n[id]
      else n[id] = true
      return n
    })

  const activeTab = tabDefs.find((t) => t.id === tab) || tabDefs[0]
  let visible = activeTab.status ? data.filter((r) => r.status === activeTab.status) : data
  if (featuredFilter) visible = visible.filter((r) => featured[r.id])

  const featuredList = data.filter((r) => featured[r.id]).map((r, i) => ({ id: r.id, rank: String(i + 1).padStart(2, '0'), name: r.name + ' — ' + r.city }))

  const goRow = (r) => navigate('/admin/projects/' + r.id)

  return (
    <>
      <style>{`@keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>

      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Projects</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{counts.all} total</span>
          </div>
        }
        actions={
          <button className="wa-hide-sm" style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.8}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>Export CSV
          </button>
        }
      />

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex' }}>
        {tabDefs.map((t) => {
          const on = tab === t.id
          const amber = t.id === 'Pending Review'
          let badgeStyle
          if (on) badgeStyle = { background: colors.ink, color: '#fff' }
          else if (amber) badgeStyle = { background: '#FEF9EC', border: '1px solid #F3E2B8', color: colors.amberText }
          else badgeStyle = { background: colors.surfaceMuted, color: colors.textSoft }
          return (
            <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>
              {t.id}
              <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, ...badgeStyle }}>{counts[t.countKey] ?? 0}</span>
            </div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 280, position: 'relative' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
          <input placeholder="Search by project name or developer..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <DeveloperFilter developers={developers} value={developerId} onChange={setDeveloperId} />
        {['City', 'Type'].map((f) => (
          <span key={f} style={{ height: 34, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#fff' }}>{f} {chevron}</span>
        ))}
        <span onClick={() => setFeaturedFilter((v) => !v)} style={{ height: 34, padding: '0 12px', borderRadius: 999, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', marginLeft: 'auto', ...(featuredFilter ? { background: '#FEF9EC', border: `1px solid ${colors.amber}`, color: colors.amberText } : { background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, color: colors.amberText }) }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill={colors.amber} stroke={colors.amber} strokeWidth={1.5}><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z" /></svg>Featured only
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
        {loadError && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderLeft: '3px solid #DC2626', borderRadius: 8, padding: '10px 14px', margin: '16px 22px 0', display: 'flex', gap: 10, alignItems: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.9} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{loadError}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}

        <div className="wa-scroll-x" style={{ margin: '16px 22px' }}>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', minWidth: 1040 }}>
          {/* Header */}
          <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 2.5, ...headCell }}>Project</span>
            <span style={{ flex: 1.5, ...headCell }}>Developer</span>
            <span style={{ flex: 0.8, ...headCell }}>City</span>
            <span style={{ flex: 0.8, ...headCell }}>Type</span>
            <span style={{ flex: 0.9, ...headCell }}>Featured</span>
            <span style={{ flex: 0.6, ...headCell }}>Leads</span>
            <span style={{ flex: 0.6, ...headCell }}>Deals</span>
            <span style={{ flex: 0.8, ...headCell }}>Added</span>
            <span style={{ flex: 1, ...headCell }}>Status</span>
            <span style={{ flex: 1, textAlign: 'right', ...headCell }}>Actions</span>
          </div>
          {/* Rows */}
          {visible.map((r) => {
            const pending = r.status === 'PENDING'
            const feat = !!featured[r.id]
            const st = ST[r.status] || ST.DRAFT
            const dealsColor = r.deals === '0' || r.deals === '—' ? colors.textFaint : colors.green
            return (
              <div key={r.id} onClick={() => goRow(r)} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '12px 16px', minHeight: 60, cursor: 'pointer', background: pending ? '#FFFEF5' : '#fff', borderLeft: pending ? `2px solid ${colors.amber}` : '2px solid transparent' }}>
                <div style={{ flex: 2.5, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 32, borderRadius: 6, background: colors.surfaceMuted, backgroundImage: hatch, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: colors.textFaint }}>{r.units}</div>
                  </div>
                </div>
                <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: colors.surfaceMuted, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: colors.textMuted, flexShrink: 0 }}>{r.devInitials}</span>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{r.developer}</span>
                </div>
                <div style={{ flex: 0.8 }}>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{r.city}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint }}>{r.country}</div>
                </div>
                <div style={{ flex: 0.8 }}>
                  <span style={{ background: colors.surfaceMuted, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 500, color: colors.textMuted }}>{r.type}</span>
                </div>
                <div style={{ flex: 0.9 }}>
                  <span onClick={(e) => { e.stopPropagation(); toggleFeature(r.id) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999, padding: '3px 8px', fontSize: 10, cursor: 'pointer', ...(feat ? { background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, color: colors.amberText, fontWeight: 600 } : { background: colors.surfaceMuted, border: `1px solid ${colors.border}`, color: colors.textFaint }) }}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill={feat ? colors.amber : colors.borderStrong} stroke={feat ? colors.amber : colors.borderStrong} strokeWidth={1.5}><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
                    {feat ? 'Featured' : 'Feature?'}
                  </span>
                </div>
                <div style={{ flex: 0.6, fontSize: 13, fontWeight: 600 }}>{r.leads}</div>
                <div style={{ flex: 0.6, fontSize: 13, color: dealsColor }}>{r.deals}</div>
                <div style={{ flex: 0.8 }}>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{r.added}</div>
                  <div style={{ fontSize: 10, color: colors.textFaint }}>{r.addedAgo}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={st.style}>
                    {st.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.green, animation: 'pulse-dot 1.6s infinite' }} />}
                    {st.label}
                  </span>
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span onClick={(e) => { e.stopPropagation(); navigate('/admin/projects/' + r.id) }} style={{ height: 26, padding: '0 8px', background: pending ? colors.green : '#fff', border: pending ? 'none' : `1px solid ${colors.border}`, borderRadius: 5, fontSize: 11, fontWeight: 600, color: pending ? '#fff' : colors.textMuted, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>{pending ? 'Review →' : 'View →'}</span>
                  <span onClick={(e) => e.stopPropagation()} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill={colors.textFaint}><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
                  </span>
                </div>
              </div>
            )
          })}
          {loading && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading projects…</div>
          )}
          {!loading && visible.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>No projects {tab !== 'All' ? `in "${tab}"` : 'yet'}</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>Projects submitted by developers will appear here.</div>
            </div>
          )}
        </div>
        </div>

        {/* Feature management */}
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', margin: '0 22px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Featured projects</div>
          <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 12 }}>Featured projects appear first in marketplace search and landing page.</div>
          {featuredList.length === 0 && (
            <div style={{ fontSize: 12, color: colors.textFaint, padding: '8px 0' }}>No featured projects yet. Use the “Feature?” pill on a row to highlight it.</div>
          )}
          {featuredList.map((f) => (
            <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, fontFamily: 'monospace' }}>{f.rank}</span>
              <div style={{ width: 40, height: 28, borderRadius: 5, background: colors.surfaceMuted, backgroundImage: hatch, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: colors.textMuted, flex: 1 }}>{f.name}</span>
              <svg width={14} height={14} viewBox="0 0 24 24" fill={colors.amber} stroke={colors.amber} strokeWidth={1.5}><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
              <span onClick={() => toggleFeature(f.id)} style={{ fontSize: 11, color: colors.red, cursor: 'pointer' }}>Remove ×</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 8 }}>Max 6 featured projects</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 30, padding: '0 10px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, cursor: 'pointer', marginTop: 8, background: '#fff' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>Add featured project
          </span>
        </div>

        <Pagination label={`Showing ${visible.length} of ${counts.all} projects`} />
      </div>
    </>
  )
}
