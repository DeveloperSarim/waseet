import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { developerApi } from '../../lib/api'
import { countryName } from '../../lib/adminFormat'

const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 11px)'
// tab label → status filter ('all' = every project)
const tabDefs = [['All', 'all'], ['Live', 'LIVE'], ['Under Review', 'PENDING'], ['Draft', 'DRAFT'], ['Paused', 'SOLD_OUT']]

const STATUS = {
  LIVE: { label: 'Live', bg: colors.greenTint, border: colors.greenTintBorder, color: colors.greenDark, dot: colors.green, pulse: true },
  PENDING: { label: 'Pending review', bg: colors.amberTint, border: colors.amberTintBorder, color: colors.amberText, icon: 'clock' },
  DRAFT: { label: 'Draft', bg: colors.surfaceMuted, border: colors.border, color: colors.textSoft },
  SOLD_OUT: { label: 'Sold out', bg: colors.surfaceMuted, border: colors.border, color: colors.textSoft },
}

const addedLabel = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return 'Added ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
const money = (n) => `SAR ${Number(n || 0).toLocaleString()}`

function TabBar({ active, onChange, counts }) {
  return (
    <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex' }}>
      {tabDefs.map(([label, key]) => {
        const on = active === label
        const count = key === 'all' ? counts.all : (counts[key] || 0)
        return (
          <div key={label} onClick={() => onChange(label)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap' }}>
            {label}
            <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: on ? colors.ink : colors.surfaceMuted, color: on ? '#fff' : colors.textSoft }}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.DRAFT
  return (
    <div style={{ position: 'absolute', top: 12, left: 12, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
      {s.pulse && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, animation: 'ps-pulse 1.6s infinite' }} />}
      {s.icon && <Icon name={s.icon} size={11} color={colors.amber} strokeWidth={2} />}
      <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span>
    </div>
  )
}

function ProjectCard({ p, onEdit, onDelete }) {
  const isLive = p.status === 'LIVE'
  const isPending = p.status === 'PENDING'
  const cover = p.image
    ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: colors.surfaceMuted, backgroundImage: hatch }
  return (
    <div style={{ background: '#fff', border: `1px solid ${isPending ? colors.amberTintBorder : colors.border}`, ...(isPending ? { borderLeft: `3px solid ${colors.amber}` } : {}), borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ height: 160, position: 'relative', ...cover }}>
        <StatusPill status={p.status} />
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
          <span style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 999, padding: '3px 8px', display: 'flex', gap: 4, alignItems: 'center' }}>
            <Icon name="fileText" size={12} color="#fff" strokeWidth={1.8} /><span style={{ fontSize: 10, color: '#fff' }}>{p.leadCount || 0} leads</span>
          </span>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{p.title}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Icon name="mapPin" size={12} color={colors.textFaint} strokeWidth={1.8} />
              <span style={{ fontSize: 12, color: colors.textFaint }}>{p.city} · {countryName(p.country)}</span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: colors.textFaint }}>{addedLabel(p.createdAt)}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ background: colors.surfaceMuted, borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 500, color: colors.textMuted }}>{[p.type, p.bedrooms].filter(Boolean).join(' · ')}</span>
          <span style={{ background: colors.surfaceMuted, borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 500, color: colors.textMuted }}>{money(p.priceFrom)} – {money(p.priceTo)}</span>
          <span style={{ background: colors.greenTint, borderRadius: 5, padding: '3px 8px', display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: colors.greenDark }}>{p.commissionPct}% commission</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}` }}>
          {isLive && (
            <button onClick={() => onEdit(p.id, 'leads')} style={{ height: 32, padding: '0 12px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>View Leads →</button>
          )}
          <button onClick={() => onEdit(p.id, 'edit')} style={{ height: 32, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Edit</button>
          <button onClick={() => onDelete(p)} style={{ height: 32, padding: '0 12px', background: 'transparent', border: 'none', fontSize: 11, color: colors.red, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 7, marginLeft: 'auto' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function MyProjects() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const rows = await developerApi.listProjects()
      setProjects(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setLoadError(e.message || 'Could not load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const counts = { all: projects.length }
  for (const p of projects) counts[p.status] = (counts[p.status] || 0) + 1

  const filterKey = (tabDefs.find(([label]) => label === tab) || [])[1]
  const visible = filterKey === 'all' ? projects : projects.filter((p) => p.status === filterKey)

  const onEdit = (id, dest) => navigate(dest === 'leads' ? '/developer/leads' : `/developer/projects/${id}/edit`)
  const onDelete = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return
    try {
      await developerApi.deleteProject(p.id)
      load()
    } catch (e) {
      window.alert(e.message || 'Could not delete project')
    }
  }

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>My Projects</span>
            <span className="wa-hide-sm" style={{ fontSize: 13, color: colors.textFaint }}>{projects.length} total</span>
          </div>
        }
        actions={
          <button onClick={() => navigate('/developer/projects/new')} style={{ height: 36, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} color="#fff" strokeWidth={2} />Add New Project
          </button>
        }
      />
      <TabBar active={tab} onChange={setTab} counts={counts} />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {loadError && (
          <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{loadError}</span>
          </div>
        )}
        {loading ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading projects…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{tab === 'All' ? 'No projects yet' : `No projects in "${tab}"`}</div>
            <div style={{ fontSize: 13, color: colors.textFaint, marginBottom: 16 }}>Add your first project to start receiving leads.</div>
            {tab === 'All' && (
              <button onClick={() => navigate('/developer/projects/new')} style={{ height: 36, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Add New Project</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 14, alignItems: 'start' }}>
            {visible.map((p) => (
              <ProjectCard key={p.id} p={p} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
