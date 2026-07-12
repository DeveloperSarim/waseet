import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, radius } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { Avatar, Button } from '../../components/ui'
import { realtorApi } from '../../lib/api'
import { joinedLabel } from '../../lib/adminFormat'

// enum → design label + tab group + badge colours (colours preserved from the
// original static design, keyed off the real Lead status enum)
const STATUS = {
  NEW:         { label: 'New',         group: 'New',         tone: { bg: '#EEF3FF', color: '#1B4FD8', bd: '#BFDBFE' } },
  CONTACTED:   { label: 'Contacted',   group: 'In Progress', tone: { bg: '#F5F3FF', color: '#5B5BD6', bd: '#DDD6FE' } },
  VIEWING:     { label: 'Viewing',     group: 'In Progress', tone: { bg: '#EEF3FF', color: '#3730A3', bd: '#C7D2FE' } },
  NEGOTIATING: { label: 'Negotiating', group: 'In Progress', tone: { bg: '#FFFBEB', color: '#92400E', bd: '#FDE68A' } },
  CLOSED:      { label: 'Closed',      group: 'Closed',      tone: { bg: '#F0FDF4', color: '#15803D', bd: '#BBF7D0' } },
  LOST:        { label: 'Lost',        group: 'Lost',        tone: { bg: '#FFF5F5', color: '#991B1B', bd: '#FECACA' } },
}
const FALLBACK_TONE = { bg: colors.surfaceMuted, color: colors.textMuted, bd: colors.border }
const TAB_GROUPS = ['New', 'In Progress', 'Closed', 'Lost']

function TabBar({ active, onChange, tabDefs }) {
  return (
    <div className="pd-tabs" style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex', overflowX: 'auto' }}>
      {tabDefs.map(([label, count]) => {
        const on = active === label
        return (
          <div key={label} onClick={() => onChange(label)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>
            {label}
            <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: on ? colors.ink : colors.surfaceMuted, color: on ? '#fff' : colors.textSoft }}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function MyLeads() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setLeads(await realtorApi.listLeads()) }
    catch (e) { setError(e.message || 'Could not load your leads') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const tabDefs = useMemo(() => {
    const c = { All: leads.length, New: 0, 'In Progress': 0, Closed: 0, Lost: 0 }
    for (const l of leads) {
      const g = STATUS[l.status]?.group
      if (g) c[g] += 1
    }
    return [['All', c.All], ...TAB_GROUPS.map((g) => [g, c[g]])]
  }, [leads])

  const filtered = tab === 'All' ? leads : leads.filter((l) => STATUS[l.status]?.group === tab)

  // pagination — only surfaces when there's more than one page
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  useEffect(() => { setPage(1) }, [tab, perPage, total])
  const pageStart = (page - 1) * perPage
  const visible = filtered.slice(pageStart, pageStart + perPage)
  const showFrom = total === 0 ? 0 : pageStart + 1
  const showTo = Math.min(total, pageStart + perPage)

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>My Leads</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{leads.length} total</span>
          </div>
        }
        actions={<Button variant="primary" onClick={() => navigate('/realtor/browse')}>Browse Projects →</Button>}
      />
      <TabBar active={tab} onChange={setTab} tabDefs={tabDefs} />

      {/* Search / filter */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Icon name="search" size={14} color={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input placeholder="Search by client name..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <select style={{ height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: colors.textMuted, background: '#fff' }}><option>All Projects</option></select>
        <select style={{ height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: colors.textMuted, background: '#fff' }}><option>Date range</option></select>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading leads…</div>
          )}
          {!loading && error && (
            <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <Icon name="xCircle" size={16} color={colors.red} strokeWidth={1.9} />
              <span style={{ fontSize: 13, color: colors.textMuted }}>{error}</span>
              <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: colors.textFaint }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>No leads yet</div>
              <div style={{ fontSize: 13 }}>{tab === 'All' ? 'Leads you submit will appear here.' : `No leads in ${tab}.`}</div>
            </div>
          )}
          {!loading && !error && visible.map((l) => {
            const cfg = STATUS[l.status] || { label: l.status || '—', tone: FALLBACK_TONE }
            const t = cfg.tone
            const closed = l.status === 'CLOSED'
            const lost = l.status === 'LOST'
            const dateLabel = lost ? `Lost · ${joinedLabel(l.updatedAt)}` : `Submitted ${joinedLabel(l.createdAt)}`
            return (
              <div key={l.id} onClick={() => navigate('/realtor/leads/' + l.id)} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderLeft: closed ? `3px solid ${colors.green}` : `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', opacity: lost ? 0.7 : 1, transition: 'all 150ms' }}>
                {closed && (
                  <div style={{ background: colors.greenTint, borderBottom: `1px solid ${colors.greenTintBorder}`, borderRadius: '12px 12px 0 0', padding: '8px 16px', margin: '-14px -16px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Icon name="checkCircle" size={14} color={colors.green} strokeWidth={2} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors.greenDark }}>Deal Closed!</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{l.projectName || '—'}{l.unit ? ` · ${l.unit}` : ''}</div>
                    <div style={{ fontSize: 12, color: colors.textFaint, display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Icon name="mapPin" size={11} color={colors.textFaint} strokeWidth={1.8} />{l.developerName || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <span style={{ borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, border: `1px solid ${t.bd}`, background: t.bg, color: t.color }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, color: colors.textFaint }}>{dateLabel}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>{l.clientName || '—'}</span>
                    <span style={{ fontSize: 11, color: colors.textFaint }}>{l.clientPhone || '—'}</span>
                  </div>
                  <span style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>View details →</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pagination — page controls only appear when there's more than one page */}
      {!loading && !error && total > 0 && (
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '12px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: colors.textSoft }}>Showing {showFrom}–{showTo} of {total} leads</span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: page === 1 ? colors.textFaint : colors.textMuted, background: '#fff', cursor: page === 1 ? 'default' : 'pointer' }}>← Prev</span>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <span key={n} onClick={() => setPage(n)} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, fontSize: 12, fontWeight: n === page ? 600 : 400, border: n === page ? 'none' : `1px solid ${colors.border}`, background: n === page ? colors.ink : '#fff', color: n === page ? '#fff' : colors.textMuted, cursor: 'pointer' }}>{n}</span>
              ))}
              <span onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: page === totalPages ? colors.textFaint : colors.textMuted, background: '#fff', cursor: page === totalPages ? 'default' : 'pointer' }}>Next →</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: colors.textSoft }}>Per page</span>
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} style={{ height: 32, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select>
          </div>
        </div>
      )}
    </>
  )
}
