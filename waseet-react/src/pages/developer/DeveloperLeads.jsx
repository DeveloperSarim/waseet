import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { developerApi } from '../../lib/api'
import { initials, joinedLabel } from '../../lib/adminFormat'

const statusTone = {
  New: { bg: '#EEF3FF', color: '#1B4FD8', bd: '#BFDBFE', dot: '#1B4FD8' },
  Contacted: { bg: '#F5F3FF', color: '#5B5BD6', bd: '#DDD6FE', dot: '#5B5BD6' },
  'Site Visit': { bg: '#EEF3FF', color: '#3730A3', bd: '#C7D2FE', dot: '#3730A3' },
  Negotiation: { bg: '#FFFBEB', color: '#92400E', bd: '#FDE68A', dot: '#D97706' },
  Closed: { bg: colors.greenTint, color: colors.greenDark, bd: colors.greenTintBorder, dot: colors.green },
  Lost: { bg: colors.redTint, color: '#991B1B', bd: colors.redTintBorder, dot: colors.red },
}

// enum <-> Title-case label
const ENUM_TO_LABEL = { NEW: 'New', CONTACTED: 'Contacted', VIEWING: 'Site Visit', NEGOTIATING: 'Negotiation', CLOSED: 'Closed', LOST: 'Lost' }
const LABEL_TO_ENUM = { New: 'NEW', Contacted: 'CONTACTED', 'Site Visit': 'VIEWING', Negotiation: 'NEGOTIATING' }
const statusOptions = ['New', 'Contacted', 'Site Visit', 'Negotiation']

// status-category tabs
const tabDefs = ['All', 'New', 'In Progress', 'Closed', 'Lost']
const inCategory = (cat, s) => {
  if (cat === 'All') return true
  if (cat === 'New') return s === 'NEW'
  if (cat === 'In Progress') return s === 'CONTACTED' || s === 'VIEWING' || s === 'NEGOTIATING'
  if (cat === 'Closed') return s === 'CLOSED'
  if (cat === 'Lost') return s === 'LOST'
  return true
}

const maskPhone = (p) => {
  const s = String(p || '')
  if (s.length <= 4) return s || '—'
  return `${s.slice(0, 4)} ***** ${s.slice(-4)}`
}

const selStyle = { height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: colors.textMuted, background: '#fff' }
const dateStyle = { height: 34, width: 145, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: colors.textMuted }

export default function DeveloperLeads() {
  const navigate = useNavigate()
  const [revealed, setRevealed] = useState({})
  const [statusOpen, setStatusOpen] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [projectF, setProjectF] = useState('')
  const [statusF, setStatusF] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    developerApi.listLeads()
      .then((rows) => setLeads(Array.isArray(rows) ? rows : []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const counts = tabDefs.reduce((acc, cat) => {
    acc[cat] = leads.filter((l) => inCategory(cat, l.status)).length
    return acc
  }, {})

  const projectOpts = Array.from(new Set(leads.map((l) => l.projectName).filter(Boolean))).sort()
  const q = search.trim().toLowerCase()
  const fromT = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null
  const toT = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null
  const visible = leads.filter((l) => {
    if (!inCategory(tab, l.status)) return false
    if (projectF && l.projectName !== projectF) return false
    if (statusF && l.status !== statusF) return false
    if (q && !(`${l.clientName || ''} ${l.realtorName || ''}`.toLowerCase().includes(q))) return false
    if (fromT || toT) {
      const t = new Date(l.createdAt || 0).getTime()
      if (fromT && t < fromT) return false
      if (toT && t > toT) return false
    }
    return true
  })

  const changeStatus = (id, label) => {
    const en = LABEL_TO_ENUM[label]
    setStatusOpen(null)
    if (!en) return
    developerApi.updateLeadStatus(id, en).then(load).catch(() => {})
  }

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>All Leads</span>
            <span className="wa-hide-sm" style={{ fontSize: 13, color: colors.textFaint }}>{leads.length} total</span>
          </div>
        }
        actions={
          <button className="wa-hide-sm" style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="download" size={14} color={colors.textMuted} strokeWidth={1.7} />Export CSV
          </button>
        }
      />

      {/* Status tabs */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex' }}>
        {tabDefs.map((label) => {
          const on = tab === label
          return (
            <div key={label} onClick={() => setTab(label)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap' }}>
              {label}
              <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: on ? colors.ink : colors.surfaceMuted, color: on ? '#fff' : colors.textSoft }}>{counts[label]}</span>
            </div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={projectF} onChange={(e) => setProjectF(e.target.value)} style={selStyle}>
          <option value="">All Projects</option>
          {projectOpts.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={selStyle}>
          <option value="">All Status</option>
          {Object.entries(ENUM_TO_LABEL).map(([en, lb]) => <option key={en} value={en}>{lb}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Date from" style={dateStyle} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Date to" style={dateStyle} />
        <div style={{ position: 'relative', flex: 1, maxWidth: 260, minWidth: 160 }}>
          <Icon name="search" size={14} color={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client or realtor..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
        {loading ? (
          <div style={{ padding: '60px 22px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading leads…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '60px 22px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>{leads.length === 0 ? 'No leads yet.' : 'No leads in this status.'}</div>
        ) : (
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((l) => {
            const label = ENUM_TO_LABEL[l.status] || l.status
            const t = statusTone[label] || statusTone.New
            const isRevealed = revealed[l.id]
            return (
              <div key={l.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: colors.textMuted }}>{initials(l.clientName)}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{l.clientName}</span>
                      {l.realtorName && <span style={{ fontSize: 12, color: colors.textFaint }}>via {l.realtorName}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 3 }}>{l.projectName}{l.unit ? ` · ${l.unit}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, border: `1px solid ${t.bd}`, background: t.bg, color: t.color }}>{label}</span>
                    <span style={{ fontSize: 11, color: colors.textFaint }}>{joinedLabel(l.createdAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}`, gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: colors.textFaint }}>Client:</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>{l.clientName}</span>
                    {isRevealed ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{l.clientPhone || '—'}</span>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.7} style={{ cursor: 'pointer' }}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: colors.textFaint }}>{maskPhone(l.clientPhone)}</span>
                        <span onClick={() => setRevealed({ ...revealed, [l.id]: true })} style={{ fontSize: 11, fontWeight: 500, color: colors.greenDark, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}>Reveal</span>
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <div onClick={() => setStatusOpen(statusOpen === l.id ? null : l.id)} style={{ height: 32, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 12, color: colors.textMuted, cursor: 'pointer', background: '#fff' }}>
                        {label}<Icon name="chevronDown" size={12} color={colors.textFaint} strokeWidth={2} />
                      </div>
                      {statusOpen === l.id && (
                        <div style={{ position: 'absolute', right: 0, top: 36, zIndex: 20, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 180, overflow: 'hidden' }}>
                          {statusOptions.map((o) => (
                            <div key={o} onClick={() => changeStatus(l.id, o)} style={{ padding: '9px 14px', fontSize: 13, color: colors.textMuted, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusTone[o].dot }} />{o}
                            </div>
                          ))}
                          <div style={{ height: 1, background: colors.surfaceMuted }} />
                          <div onClick={() => navigate('/developer/leads/' + l.id)} style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: colors.greenDark, cursor: 'pointer' }}>Mark as Closed Deal →</div>
                        </div>
                      )}
                    </div>
                    <div onClick={() => navigate('/developer/leads/' + l.id)} title="Edit lead" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}`, borderRadius: 6, cursor: 'pointer' }}>
                      <Icon name="edit" size={13} color={colors.textFaint} strokeWidth={1.8} />
                    </div>
                    <div onClick={() => navigate('/developer/leads/' + l.id)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}`, borderRadius: 6, cursor: 'pointer', color: colors.textFaint, fontSize: 14 }}>⋯</div>
                  </div>
                </div>
                {isRevealed && <div style={{ fontSize: 10, color: colors.textFaint, fontStyle: 'italic', marginTop: 6 }}>Logged: you viewed this contact</div>}
              </div>
            )
          })}
        </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '12px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: colors.textSoft }}>Showing {visible.length === 0 ? 0 : 1}–{visible.length} of {visible.length} leads</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textFaint, background: '#fff' }}>← Prev</span>
          {['1', '2', '3'].map((n, i) => (
            <span key={n} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, fontSize: 12, fontWeight: i === 0 ? 600 : 400, border: i === 0 ? 'none' : `1px solid ${colors.border}`, background: i === 0 ? colors.ink : '#fff', color: i === 0 ? '#fff' : colors.textMuted, cursor: 'pointer' }}>{n}</span>
          ))}
          <span style={{ height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, background: '#fff', cursor: 'pointer' }}>Next →</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.textSoft }}>Per page</span>
          <select style={{ height: 32, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}><option>10</option><option>25</option></select>
        </div>
      </div>
    </>
  )
}
