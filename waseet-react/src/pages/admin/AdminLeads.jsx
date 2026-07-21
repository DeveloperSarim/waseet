import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { adminApi } from '../../lib/api'
import { initials, timeAgo } from '../../lib/adminFormat'

const sBadge = (bg, color, border) => ({ borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600, background: bg, color, border: `1px solid ${border}` })
const ST = {
  New: sBadge('#EEF3FF', '#1B4FD8', '#BFDBFE'),
  Contacted: sBadge('#F5F3FF', '#5B5BD6', '#DDD6FE'),
  'Site Visit': sBadge('#EEF3FF', '#3730A3', '#C7D2FE'),
  Negotiation: sBadge('#FFFBEB', '#92400E', '#FDE68A'),
  Closed: sBadge('#F0FDF4', '#15803D', '#BBF7D0'),
  Lost: sBadge('#F3F4F6', '#374151', '#E5E7EB'),
}
// backend lead status enum → design label + badge
const LEAD_STATUS = {
  NEW: { label: 'New', style: ST.New },
  CONTACTED: { label: 'Contacted', style: ST.Contacted },
  VIEWING: { label: 'Site Visit', style: ST['Site Visit'] },
  NEGOTIATING: { label: 'Negotiation', style: ST.Negotiation },
  CLOSED: { label: 'Closed', style: ST.Closed },
  LOST: { label: 'Lost', style: ST.Lost },
}

// backend Lead → the row shape this table renders
const toRow = (l) => ({
  id: l.id,
  initials: initials(l.realtorName),
  realtor: l.realtorName || '—',
  client: l.clientName || '—',
  phone: l.clientPhone || '—',
  project: [l.projectName, l.unit].filter(Boolean).join(' · ') || '—',
  dev: l.developerName || '—',
  status: LEAD_STATUS[l.status] || { label: l.status || '—', style: ST.New },
  date: timeAgo(l.createdAt) || '—',
  dateFull: l.createdAt ? new Date(l.createdAt).toLocaleString() : '',
})

const filters = ['All Developers', 'All Realtors', 'All Projects', 'All Status']
const chevron = <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
const colFlex = { realtor: 1.5, client: 1.2, phone: 1.5, project: 1.5, status: 1, date: 1 }
const headCell = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }
const dateInput = { height: 34, width: 110, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }

export default function AdminLeads() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [exportState, setExportState] = useState('idle') // idle | loading | done
  const [toast, setToast] = useState(false)
  const [hoverDate, setHoverDate] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const leads = await adminApi.listLeads()
      setRows(leads.map(toRow))
    } catch (e) {
      setLoadError(e.message || 'Could not load leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const doExport = () => {
    if (exportState !== 'idle') return
    setExportState('loading')
    setTimeout(() => { setExportState('done'); setToast(true) }, 1100)
    setTimeout(() => { setExportState('idle'); setToast(false) }, 4500)
  }
  const exportLabel = exportState === 'loading' ? 'Preparing export…' : exportState === 'done' ? 'Downloaded ✓' : 'Export CSV'
  const exportDone = exportState === 'done'

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>All Leads</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{rows.length.toLocaleString()} total</span>
          </div>
        }
        actions={
          <button onClick={doExport} className="wa-hide-sm" style={{ height: 34, padding: '0 14px', background: exportDone ? colors.greenTint : '#fff', border: `1px solid ${exportDone ? colors.greenTintBorder : colors.border}`, borderRadius: 7, fontSize: 12, color: exportDone ? colors.greenDark : colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={exportDone ? colors.greenDark : colors.textMuted} strokeWidth={1.8}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>{exportLabel}
          </button>
        }
      />

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} className="wa-form">
        {filters.map((f) => (
          <div key={f} style={{ height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 12px', fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>{f}{chevron}</div>
        ))}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <input placeholder="From" style={dateInput} /><span style={{ fontSize: 12, color: colors.textFaint }}>to</span><input placeholder="To" style={dateInput} />
        </div>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
          <input placeholder="Search by client name or phone..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <span style={{ fontSize: 12, color: colors.textFaint, cursor: 'pointer', marginLeft: 'auto' }}>Clear all</span>
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
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', minWidth: 760 }}>
          {/* Table header */}
          <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ flex: colFlex.realtor, ...headCell }}>Realtor</span>
            <span style={{ flex: colFlex.client, ...headCell }}>Client</span>
            <span style={{ flex: colFlex.phone, ...headCell }}>Phone</span>
            <span style={{ flex: colFlex.project, ...headCell }}>Project</span>
            <span style={{ flex: colFlex.status, ...headCell }}>Status</span>
            <span style={{ flex: colFlex.date, ...headCell }}>Date</span>
            <span style={{ width: 60, ...headCell, textAlign: 'right' }}>&nbsp;</span>
          </div>
          {/* Rows */}
          {rows.map((r, i) => (
            <div key={r.id} onClick={() => navigate(`/admin/leads/${r.id}`)} style={{ borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '12px 16px', display: 'flex', alignItems: 'center', minHeight: 56, cursor: 'pointer' }}>
              <div style={{ flex: colFlex.realtor, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: colors.textMuted }}>{r.initials}</div>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{r.realtor}</div></div>
              </div>
              <div style={{ flex: colFlex.client, fontSize: 13, color: colors.textMuted }}>{r.client}</div>
              <div style={{ flex: colFlex.phone, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{r.phone}</span>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ cursor: 'pointer' }}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              </div>
              <div style={{ flex: colFlex.project }}><div style={{ fontSize: 13, color: colors.textMuted }}>{r.project}</div><div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{r.dev}</div></div>
              <div style={{ flex: colFlex.status }}><span style={r.status.style}>{r.status.label}</span></div>
              <div style={{ flex: colFlex.date, position: 'relative' }} onMouseEnter={() => setHoverDate(i)} onMouseLeave={() => setHoverDate(null)}>
                <span style={{ fontSize: 12, color: colors.textFaint }}>{r.date}</span>
                {hoverDate === i && r.dateFull && <span style={{ position: 'absolute', left: 0, bottom: 22, zIndex: 30, background: colors.ink, color: '#fff', borderRadius: 6, padding: '4px 8px', fontSize: 11, whiteSpace: 'nowrap' }}>{r.dateFull}</span>}
              </div>
              <div style={{ width: 60, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: colors.borderStrong }}>→</span>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading leads…</div>
          )}
          {!loading && rows.length === 0 && !loadError && (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>No leads yet</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>Leads submitted by realtors will appear here.</div>
            </div>
          )}
        </div>
        </div>

        {/* Footer count */}
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.textSoft }}>Showing {rows.length.toLocaleString()} of {rows.length.toLocaleString()} leads</span>
        </div>
      </div>

      {/* Export toast */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <div><div style={{ fontSize: 13, fontWeight: 500 }}>Export ready — waseet_leads.csv</div><div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{rows.length.toLocaleString()} leads</div></div>
        </div>
      )}
    </>
  )
}
