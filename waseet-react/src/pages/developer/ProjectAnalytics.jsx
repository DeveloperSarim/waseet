import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { developerApi } from '../../lib/api'

const pct = (n) => `${Number(n || 0)}%`

const chip = { height: 34, padding: '0 14px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, background: '#fff' }
const crumb = { fontSize: 13, color: colors.textFaint, cursor: 'pointer' }

export default function ProjectAnalytics() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState({ leads: 0, deals: 0, conversion: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await developerApi.analytics()
        if (!alive) return
        setRows(data.rows || [])
        setTotals(data.totals || { leads: 0, deals: 0, conversion: 0 })
      } catch { /* leave empty */ }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [])

  const statCards = [
    { icon: 'M3 21h18M6 21V7l6-4 6 4v14M9 9h2M13 9h2', label: 'Projects', value: String(rows.length), sub: 'with activity' },
    { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6', label: 'Total Leads', value: String(totals.leads || 0), sub: 'across all projects' },
    { icon: 'M8 11l3 3 5-6M20 6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z', label: 'Deals Closed', value: String(totals.deals || 0), sub: 'across all projects' },
    { icon: 'M3 3v18h18M7 16l4-6 4 3 5-7', label: 'Conversion', value: pct(totals.conversion), sub: 'leads to deals' },
  ]

  const maxLeads = Math.max(1, ...rows.map((r) => Number(r.leads) || 0))

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={crumb} onClick={() => navigate('/developer/projects')}>My Projects</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>
            <span style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>Analytics</span>
          </div>
        }
        actions={
          <div className="wa-hide-sm" style={{ display: 'flex', gap: 8 }}>
            <span style={chip}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={1.8}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>Export CSV</span>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
        <div style={{ padding: '18px 22px 22px' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '56px 20px', fontSize: 13, color: colors.textFaint }}>Loading analytics…</div>
          )}

          {!loading && (
            <>
              {/* STAT CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
                {statCards.map((c, i) => (
                  <div key={i} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={1.8}><path d={c.icon} /></svg></div>
                    <div style={{ fontSize: 10, color: colors.textFaint, marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{c.value}</div>
                    <div style={{ fontSize: 10, color: colors.textSoft, marginTop: 4 }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* LEAD CONVERSION FUNNEL (driven by totals) */}
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Lead Conversion Funnel</div>
                <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 16 }}>All projects</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>Leads</span><span style={{ fontSize: 12, fontWeight: 600 }}>{totals.leads || 0}</span></div>
                  <div style={{ height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: '#EEF3FF', border: '1px solid #BFDBFE', fontSize: 11, color: '#1B4FD8' }}>{totals.leads || 0} leads</div>
                  <div style={{ textAlign: 'center', margin: '2px 0' }}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>Deals</span><span style={{ fontSize: 12, fontWeight: 600 }}>{totals.deals || 0} ({pct(totals.conversion)})</span></div>
                  <div style={{ height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', width: (totals.leads ? `${Math.max(6, Math.min(100, ((totals.deals || 0) / totals.leads) * 100))}%` : '6%'), background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 11, color: '#15803D' }}>{totals.deals || 0} deals</div>
                </div>
              </div>

              {/* PER-PROJECT TABLE */}
              <div className="wa-scroll-x">
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', minWidth: 480 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${colors.border}` }}><span style={{ fontSize: 14, fontWeight: 600 }}>Performance by Project</span><span style={{ fontSize: 12, color: colors.textFaint }}>All projects</span></div>
                <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '8px 18px', display: 'flex', alignItems: 'center' }}><span style={{ flex: 2, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Project</span><span style={{ flex: 1, textAlign: 'right', fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Leads</span><span style={{ flex: 1, textAlign: 'right', fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Deals</span><span style={{ flex: 1, textAlign: 'right', fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Conv.</span></div>

                {rows.length === 0 && (
                  <div style={{ padding: '48px 18px', textAlign: 'center' }}>
                    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={1.6} style={{ marginBottom: 10 }}><path d="M3 3v18h18M7 16l4-6 4 3 5-7" /></svg>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No analytics yet</div>
                    <div style={{ fontSize: 13, color: colors.textSoft, marginTop: 6 }}>Data appears once your projects start receiving leads.</div>
                  </div>
                )}

                {rows.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                    <div style={{ flex: 2, paddingRight: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{r.project}</div>
                      <div style={{ height: 6, background: colors.surfaceMuted, borderRadius: 999, overflow: 'hidden' }}><div style={{ height: '100%', background: '#16A34A', borderRadius: 999, width: `${Math.round(((Number(r.leads) || 0) / maxLeads) * 100)}%` }} /></div>
                    </div>
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{r.leads}</span>
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 13, color: colors.green }}>{r.deals}</span>
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 12, color: colors.textMuted }}>{pct(r.conversion)}</span>
                  </div>
                ))}

                {rows.length > 0 && (
                  <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '12px 18px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 2, fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Totals</span>
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{totals.leads || 0}</span>
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 700, color: colors.green }}>{totals.deals || 0}</span>
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{pct(totals.conversion)}</span>
                  </div>
                )}
              </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}
