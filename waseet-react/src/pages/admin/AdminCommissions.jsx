import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { Avatar } from '../../components/ui'
import { AdminSearchBar, Pagination, StatusPill } from './AdminTableKit'
import { adminApi } from '../../lib/api'
import { timeAgo } from '../../lib/adminFormat'

// backend commission status enum → Title-case label for the pill
const STATUS_LABEL = { PENDING: 'Pending', PROCESSING: 'Processing', PAID: 'Paid', FAILED: 'Failed' }
// map a tab label → the backend enum it filters on
const TAB_STATUS = { Pending: 'PENDING', Processing: 'PROCESSING', Paid: 'PAID', Failed: 'FAILED' }

const money = (n) => (n == null ? '—' : `SAR ${Number(n).toLocaleString()}`)

const toRow = (c) => ({
  id: c.id,
  dealRef: c.dealRef || '—',
  project: [c.projectName, c.unit].filter(Boolean).join(' · ') || '—',
  realtor: c.realtorName || '—',
  developer: c.developerName || '—',
  gross: money(c.gross),
  net: money(c.net),
  fee: money(c.gross != null && c.net != null ? c.gross - c.net : null),
  platformPct: c.platformPct != null ? `${c.platformPct}%` : '—',
  status: STATUS_LABEL[c.status] || c.status || '—',
  closed: c.closedAt ? timeAgo(c.closedAt) : '—',
})

export default function AdminCommissions() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({ all: 0, pending: 0, processing: 0, paid: 0, failed: 0 })
  const [platformRevenue, setPlatformRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState('All')

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const data = await adminApi.listCommissions()
      setRows((data.commissions || []).map(toRow))
      setCounts(data.counts || { all: 0, pending: 0, processing: 0, paid: 0, failed: 0 })
      setPlatformRevenue(data.platformRevenue || 0)
    } catch (e) {
      setLoadError(e.message || 'Could not load commissions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const tabs = [
    ['All', counts.all || 0],
    ['Pending', counts.pending || 0],
    ['Processing', counts.processing || 0],
    ['Paid', counts.paid || 0],
    ['Failed', counts.failed || 0],
  ]
  const visible = tab === 'All' ? rows : rows.filter((r) => r.status === STATUS_LABEL[TAB_STATUS[tab]])

  const grid = '0.9fr 1.5fr 1.2fr 1fr 1fr 0.9fr'

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Commissions</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{(counts.all || 0)} total</span>
            <span className="wa-hide-sm" style={{ fontSize: 13, color: colors.textFaint }}>·</span>
            <span className="wa-hide-sm" style={{ fontSize: 13, color: colors.greenDark, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{money(platformRevenue)} platform revenue</span>
          </div>
        }
        notifications={5}
        avatar={<Avatar initials="SA" size={30} />}
        actions={
          <button className="wa-hide-sm" style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="download" size={14} color={colors.textMuted} strokeWidth={1.8} />Export CSV
          </button>
        }
      />

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex' }}>
        {tabs.map(([label, count]) => {
          const on = tab === label
          return (
            <div key={label} onClick={() => setTab(label)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap' }}>
              {label}
              <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: on ? colors.ink : colors.surfaceMuted, color: on ? '#fff' : colors.textSoft }}>{count}</span>
            </div>
          )
        })}
      </div>

      <AdminSearchBar placeholder="Search by deal, realtor or developer..." filters={['Developer', 'Status']} />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
        {loadError && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderLeft: '3px solid #DC2626', borderRadius: 8, padding: '10px 14px', margin: '16px 22px 0', display: 'flex', gap: 10, alignItems: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.9} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{loadError}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}

        <div className="wa-scroll-x" style={{ margin: '16px 22px' }}>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', minWidth: 720 }}>
          <div style={{ display: 'grid', gridTemplateColumns: grid, background: colors.bg, borderBottom: `1px solid ${colors.border}`, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span style={{ padding: '9px 16px' }}>Deal</span><span style={{ padding: '9px 8px' }}>Project</span><span style={{ padding: '9px 8px' }}>Realtor</span><span style={{ padding: '9px 8px' }}>Commission</span><span style={{ padding: '9px 8px' }}>Platform fee</span><span style={{ padding: '9px 8px' }}>Status</span>
          </div>
          {visible.map((r) => (
            <div key={r.id} onClick={() => navigate('/admin/commissions/' + r.id)} style={{ display: 'grid', gridTemplateColumns: grid, borderBottom: `1px solid ${colors.surfaceMuted}`, alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ padding: '11px 16px' }}>
                <div style={{ fontSize: 12, color: colors.textFaint }}>#{r.dealRef}</div>
                <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 2 }}>{r.closed}</div>
              </span>
              <span style={{ padding: '11px 8px', fontSize: 13, fontWeight: 500 }}>{r.project}</span>
              <span style={{ padding: '11px 8px' }}>
                <div style={{ fontSize: 12, color: colors.textMuted }}>{r.realtor}</div>
                <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 2 }}>{r.developer}</div>
              </span>
              <span style={{ padding: '11px 8px' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.gross}</div>
                <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 2 }}>Net {r.net}</div>
              </span>
              <span style={{ padding: '11px 8px' }}>
                <div style={{ fontSize: 12, color: colors.green }}>{r.fee}</div>
                <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 2 }}>{r.platformPct}</div>
              </span>
              <span style={{ padding: '11px 8px' }}><StatusPill status={r.status} /></span>
            </div>
          ))}
          {loading && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading commissions…</div>
          )}
          {!loading && visible.length === 0 && !loadError && (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>No commissions {tab !== 'All' ? `in "${tab}"` : 'yet'}</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>Closed deals will appear here once commissions are generated.</div>
            </div>
          )}
        </div>
        </div>
        <Pagination label={`Showing ${visible.length} of ${counts.all || 0} commissions`} />
      </div>
    </>
  )
}
