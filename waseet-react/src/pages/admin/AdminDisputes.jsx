import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { adminApi } from '../../lib/api'
import { timeAgo } from '../../lib/adminFormat'

const chevron = <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>

// Status metadata keyed by the backend status enum.
const ST = {
  OPEN: { label: 'Open', bg: '#FFF5F5', bd: '#FECACA', color: '#991B1B', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01', iconColor: '#DC2626', actionLabel: 'Review →', actionColor: '#DC2626', rowBg: '#FFFCFC', leftBar: '#DC2626' },
  UNDER_REVIEW: { label: 'Under Review', bg: '#FEF9EC', bd: '#F3E2B8', color: '#92400E', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v5l3 2', iconColor: '#D97706', actionLabel: 'Review →', actionColor: '#92400E', rowBg: '#FFFEF5', leftBar: '#D97706' },
  RESOLVED: { label: 'Resolved ✓', bg: '#F0FDF4', bd: '#BBF7D0', color: '#15803D', icon: 'M20 6L9 17l-5-5', iconColor: '#16A34A', actionLabel: 'View →', actionColor: '#15803D', rowBg: '#fff', leftBar: 'transparent' },
  REJECTED: { label: 'Rejected', bg: colors.surfaceMuted, bd: colors.border, color: colors.textMuted, icon: 'M18 6L6 18M6 6l12 12', iconColor: colors.textMuted, actionLabel: 'View →', actionColor: colors.textMuted, rowBg: '#fff', leftBar: 'transparent' },
}

const tabDefs = [
  { id: 'All', label: 'All', status: null, countKey: 'all' },
  { id: 'Open', label: 'Open', status: 'OPEN', countKey: 'open' },
  { id: 'Under Review', label: 'Under review', status: 'UNDER_REVIEW', countKey: 'review' },
  { id: 'Resolved', label: 'Resolved', status: 'RESOLVED', countKey: 'resolved' },
  { id: 'Rejected', label: 'Rejected', status: 'REJECTED', countKey: 'rejected' },
]

const head = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }
const roleLabel = (r) => (r ? r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() : '—')
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminDisputes() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('Open')
  const [search, setSearch] = useState('')
  const [disputes, setDisputes] = useState([])
  const [counts, setCounts] = useState({ all: 0, open: 0, review: 0, resolved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const data = await adminApi.listDisputes()
      setDisputes(data.disputes || [])
      setCounts(data.counts || { all: 0, open: 0, review: 0, resolved: 0, rejected: 0 })
    } catch (e) {
      setLoadError(e.message || 'Could not load disputes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const activeTab = tabDefs.find((t) => t.id === tab) || tabDefs[0]
  const q = search.trim().toLowerCase()
  const visible = disputes
    .filter((r) => (activeTab.status ? r.status === activeTab.status : true))
    .filter((r) => (q
      ? [r.ref, r.subject, r.raisedByName].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
      : true))

  // Oldest open dispute (for the urgent banner) — derived, not fabricated.
  const oldestOpen = disputes
    .filter((r) => r.status === 'OPEN')
    .reduce((min, r) => (!min || new Date(r.createdAt) < new Date(min.createdAt) ? r : min), null)

  const resolutionRate = counts.all > 0 ? Math.round((counts.resolved / counts.all) * 100) + '%' : '—'
  const summary = [
    [String(counts.all), colors.ink, 'Total disputes'],
    [String(counts.open), '#DC2626', 'Open'],
    [String(counts.review), '#D97706', 'Under review'],
    [String(counts.resolved), '#16A34A', 'Resolved'],
    [String(counts.rejected), colors.textMuted, 'Rejected'],
    [resolutionRate, colors.textMuted, 'Resolution rate'],
  ]

  return (
    <>
      <Topbar
        left={<div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Disputes</span><span style={{ fontSize: 13, color: colors.textFaint }}>{counts.all} total</span></div>}
        actions={<button style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.8}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>Export CSV</button>}
      />

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex' }}>
        {tabDefs.map((t) => {
          const on = tab === t.id
          const red = t.id === 'Open'
          const badge = on
            ? { background: colors.ink, color: '#fff' }
            : red ? { background: '#FFF5F5', border: '1px solid #FECACA', color: '#991B1B' } : { background: colors.surfaceMuted, color: colors.textSoft }
          return (
            <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>
              {t.label}<span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, ...badge }}>{counts[t.countKey]}</span>
            </div>
          )
        })}
      </div>

      {/* Urgent banner */}
      {tab === 'Open' && counts.open > 0 && (
        <div style={{ background: colors.redTint, borderBottom: `1px solid ${colors.redTintBorder}`, padding: '10px 22px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.9} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>{counts.open} open dispute{counts.open === 1 ? '' : 's'} need resolution</span>
          {oldestOpen && (
            <>
              <span style={{ color: colors.borderStrong }}>·</span>
              <span style={{ fontSize: 13, color: colors.red }}>Oldest open: {timeAgo(oldestOpen.createdAt)}</span>
            </>
          )}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center' }} className="wa-form">
        <div style={{ flex: 1, maxWidth: 280, position: 'relative' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ref, subject, or person..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <span style={{ height: 34, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#fff', marginLeft: 'auto' }}>Oldest first {chevron}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
        {loadError && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderLeft: '3px solid #DC2626', borderRadius: 8, padding: '10px 14px', margin: '16px 22px 0', display: 'flex', gap: 10, alignItems: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.9} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{loadError}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', margin: '16px 22px' }}>
          {/* Header */}
          <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 0.7, ...head }}>Dispute</span>
            <span style={{ flex: 2, ...head }}>Subject</span>
            <span style={{ flex: 1.5, ...head }}>Raised by</span>
            <span style={{ flex: 1, textAlign: 'right', ...head }}>Amount</span>
            <span style={{ flex: 1, ...head }}>Status</span>
            <span style={{ flex: 1, ...head }}>Created</span>
            <span style={{ flex: 0.8, textAlign: 'right', ...head }}>Actions</span>
          </div>
          {/* Rows */}
          {visible.map((r) => {
            const st = ST[r.status] || ST.OPEN
            return (
              <div key={r.id} onClick={() => navigate('/admin/disputes/' + r.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '14px 16px', minHeight: 60, cursor: 'pointer', background: st.rowBg, borderLeft: `2px solid ${st.leftBar}` }}>
                <div style={{ flex: 0.7 }}><div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.ref}</div></div>
                <div style={{ flex: 2, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subject}</div></div>
                <div style={{ flex: 1.5, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{r.raisedByName || '—'}</div>
                  <div style={{ fontSize: 10, color: colors.textFaint }}>{roleLabel(r.raisedByRole)}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{r.amount != null ? `SAR ${r.amount.toLocaleString()}` : '—'}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 600, background: st.bg, border: `1px solid ${st.bd}`, color: st.color }}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={st.iconColor} strokeWidth={2}><path d={st.icon} /></svg>{st.label}
                  </span>
                </div>
                <div style={{ flex: 1, fontSize: 12, color: colors.textMuted }}>{fmtDate(r.createdAt)}</div>
                <div style={{ flex: 0.8, display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: st.actionColor, cursor: 'pointer' }}>{st.actionLabel}</span>
                </div>
              </div>
            )
          })}
          {loading && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading disputes…</div>
          )}
          {!loading && visible.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>No disputes {tab !== 'All' ? `in "${activeTab.label}"` : 'yet'}</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>Disputes raised by developers or realtors will appear here.</div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', margin: '0 22px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Dispute summary</div>
          <div style={{ display: 'flex' }}>
            {summary.map(([value, color, label], i) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', borderRight: i < summary.length - 1 ? `1px solid ${colors.surfaceMuted}` : 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 3, color }}>{value}</div>
                <div style={{ fontSize: 10, color: colors.textFaint }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.textSoft }}>Showing {visible.length} of {counts.all} disputes</span>
        </div>
      </div>
    </>
  )
}
