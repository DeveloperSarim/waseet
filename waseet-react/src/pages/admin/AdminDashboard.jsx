import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { Avatar } from '../../components/ui'
import { adminApi } from '../../lib/api'
import { timeAgo } from '../../lib/adminFormat'

// icon path strings reused across KPI cards, the pending list and the activity feed
const ICONS = {
  developers: 'M3 21h18M6 21V7l6-4 6 4v14M9 9h2M13 9h2M9 13h2M13 13h2',
  realtors: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  projects: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  leads: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
  deals: 'M11 17a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M13 7a5 5 0 0 0-7 0L3 10a5 5 0 0 0 7 7l1-1',
  commission: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1.1 1.5-2.5 1.5-2.5.5-2.5 1.5 1.1 1.5 2.5 1.5 2.5-.5 2.5-1.5',
  disputes: 'M14 9V5a3 3 0 0 0-6 0v4M5 9h14l1 12H4zM12 13v4',
  pending: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
}

// Revenue chart geometry (visual shell — no time-series comes from the API, so the
// live headline value is bound into the tooltip / summary below instead)
const vals = [38, 45, 52, 61, 66, 81]
const CMAX = 88
const CW = 600
const CH = 142
const pts = vals.map((v, i) => [(i / (vals.length - 1)) * CW, CH - (v / CMAX) * CH])
const chartLine = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
const chartArea = chartLine + ` L${CW} ${CH} L0 ${CH} Z`
const chartDots = pts.map((p) => ({ left: ((p[0] / CW) * 100).toFixed(1) + '%', top: ((p[1] / CH) * 100).toFixed(1) + '%' }))

const money = (n) => `SAR ${Number(n || 0).toLocaleString()}`
const num = (n) => Number(n || 0).toLocaleString()

function KpiCard({ k }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderLeft: k.accent ? `3px solid ${k.accent}` : `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ width: 30, height: 30, background: colors.greenTint, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={k.d} /></svg>
      </div>
      <div style={{ fontSize: 10, color: colors.textFaint, marginBottom: 4 }}>{k.label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{k.value}</div>
      <div style={{ fontSize: 10, color: k.subColor, marginTop: 3 }}>{k.sub}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [d, pu] = await Promise.all([
        adminApi.dashboard(),
        adminApi.listUsers({ status: 'PENDING' }).catch(() => []),
      ])
      setData(d)
      setPendingUsers(Array.isArray(pu) ? pu : [])
    } catch (e) {
      setError(e.message || 'Could not load the dashboard')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const stats = data?.stats
  const activity = data?.activity || []
  const roleOf = (u) => String(u.role || '').toUpperCase()
  const devPending = pendingUsers.filter((u) => roleOf(u) === 'DEVELOPER').length
  const realtorPending = pendingUsers.filter((u) => roleOf(u) === 'REALTOR').length

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const kpis1 = stats ? [
    { label: 'Total Developers', value: num(stats.developers), sub: `${devPending} pending approval`, subColor: devPending ? colors.amber : colors.textSoft, d: ICONS.developers },
    { label: 'Total Realtors', value: num(stats.realtors), sub: `${realtorPending} pending approval`, subColor: realtorPending ? colors.amber : colors.textSoft, d: ICONS.realtors },
    { label: 'Live Projects', value: num(stats.projects), sub: `${num(stats.pendingProjects)} pending review`, subColor: stats.pendingProjects ? colors.amber : colors.textSoft, d: ICONS.projects },
    { label: 'Total Leads', value: num(stats.leads), sub: 'this platform', subColor: colors.textSoft, d: ICONS.leads },
  ] : []
  const kpis2 = stats ? [
    { label: 'Deals Closed', value: num(stats.deals), sub: 'all time', subColor: colors.textSoft, accent: null, d: ICONS.deals },
    { label: 'Commission Earned', value: money(stats.commissionVolume), sub: 'platform total', subColor: colors.textSoft, accent: null, d: ICONS.commission },
    { label: 'Open Disputes', value: num(stats.disputes), sub: 'needs resolution', subColor: colors.red, accent: colors.red, d: ICONS.disputes },
    { label: 'Pending Approvals', value: num(stats.pendingApprovals), sub: 'action required', subColor: colors.amber, accent: colors.amber, d: ICONS.pending },
  ] : []

  const pending = stats ? [
    { type: 'Developers', sub: 'Awaiting document review', count: `${devPending} pending`, d: ICONS.developers, to: '/admin/developers' },
    { type: 'Realtors', sub: 'Awaiting license verification', count: `${realtorPending} pending`, d: ICONS.realtors, to: '/admin/realtors' },
    { type: 'Projects', sub: 'Awaiting content review', count: `${num(stats.pendingProjects)} pending`, d: ICONS.projects, to: '/admin/projects' },
  ] : []
  const pendingTotal = stats ? (stats.pendingApprovals || 0) + (stats.pendingProjects || 0) : 0

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Dashboard</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{today}</span>
          </div>
        }
        right={
          <div style={{ position: 'relative', width: 260 }}>
            <Icon name="search" size={14} color={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input placeholder="Search developers, realtors..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
          </div>
        }
        notifications={stats ? stats.pendingApprovals : 0}
        avatar={<Avatar initials="SA" size={32} />}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
        {loading && (
          <div style={{ padding: '60px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading dashboard…</div>
        )}

        {!loading && error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderLeft: '3px solid #DC2626', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.9} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{error}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            {/* KPI rows */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
              {kpis1.map((k) => <KpiCard key={k.label} k={k} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
              {kpis2.map((k) => <KpiCard key={k.label} k={k} />)}
            </div>

            {/* Pending approvals */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.amber}`, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Icon name="alertTriangle" size={16} color={colors.amber} strokeWidth={1.8} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Pending approvals</span>
                  <span style={{ fontSize: 13, color: colors.amber }}>· action required</span>
                </div>
                <span style={{ fontSize: 12, color: colors.textFaint }}>{pendingTotal} total</span>
              </div>
              {pending.map((p) => (
                <div key={p.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: colors.surfaceAlt, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textSoft} strokeWidth={1.7}><path d={p.d} /></svg>
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.type}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint }}>{p.sub}</div>
                    </div>
                  </div>
                  <span style={{ background: '#FEF9EC', border: '1px solid #F3E2B8', color: '#92400E', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{p.count}</span>
                  <span onClick={() => navigate(p.to)} style={{ fontSize: 12, fontWeight: 500, color: colors.greenDark, cursor: 'pointer' }}>Review →</span>
                </div>
              ))}
            </div>

            {/* Revenue chart */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Platform revenue</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>Commission earned by Waseet</div>
                </div>
                <select style={{ height: 32, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: colors.textMuted, background: '#fff' }}><option>Monthly</option><option>Quarterly</option></select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 160, fontSize: 11, color: colors.textFaint, textAlign: 'right', paddingBottom: 18 }}>
                  <span>80k</span><span>60k</span><span>40k</span><span>20k</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ position: 'relative', height: 160 }}>
                    <div style={{ position: 'absolute', inset: '0 0 18px 0' }}>
                      {[0, 33.3, 66.6, 100].map((t) => (
                        <div key={t} style={{ position: 'absolute', top: `${t}%`, left: 0, right: 0, height: 1, background: colors.surfaceMuted }} />
                      ))}
                      <svg viewBox="0 0 600 142" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                        <path d={chartArea} fill="rgba(22,163,74,0.08)" />
                        <path d={chartLine} fill="none" stroke={colors.green} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                      </svg>
                      {chartDots.map((d, i) => (
                        <div key={i} style={{ position: 'absolute', left: d.left, top: d.top, transform: 'translate(-50%,-50%)', width: 9, height: 9, borderRadius: '50%', background: '#fff', border: `2px solid ${colors.green}` }} />
                      ))}
                      <div style={{ position: 'absolute', left: '100%', top: -6, transform: 'translate(-90%,-100%)', background: colors.ink, borderRadius: 6, padding: '5px 8px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>To date</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{money(stats.platformRevenue)}</div>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.textFaint }}>
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <div><div style={{ fontSize: 10, color: colors.textFaint }}>Platform revenue</div><div style={{ fontSize: 13, fontWeight: 600 }}>{money(stats.platformRevenue)}</div></div>
                <div><div style={{ fontSize: 10, color: colors.textFaint }}>Commission volume</div><div style={{ fontSize: 13, fontWeight: 600 }}>{money(stats.commissionVolume)}</div></div>
                <div><div style={{ fontSize: 10, color: colors.textFaint }}>Deals closed</div><div style={{ fontSize: 13, fontWeight: 600, color: colors.green }}>{num(stats.deals)}</div></div>
              </div>
            </div>

            {/* Disputes banner */}
            {stats.disputes > 0 && (
              <div style={{ background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderLeft: `3px solid ${colors.red}`, borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                <Icon name="alertCircle" size={16} color={colors.red} strokeWidth={1.8} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>{stats.disputes} open dispute{stats.disputes === 1 ? '' : 's'} need{stats.disputes === 1 ? 's' : ''} resolution</span>
                <span onClick={() => navigate('/admin/disputes')} style={{ fontSize: 12, fontWeight: 500, color: colors.red, marginLeft: 'auto', cursor: 'pointer' }}>Review Disputes →</span>
              </div>
            )}

            {/* Recent activity */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Recent activity</span>
                <span style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>View all →</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 0.8fr', background: colors.bg, borderBottom: `1px solid ${colors.border}`, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span style={{ padding: '8px 16px' }}>Name</span><span style={{ padding: '8px 8px' }}>Action</span><span style={{ padding: '8px 8px' }}>Time</span>
              </div>
              {activity.length === 0 && (
                <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>No recent activity yet.</div>
              )}
              {activity.map((a, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 0.8fr', borderBottom: `1px solid ${colors.surfaceMuted}`, alignItems: 'center' }}>
                  <span style={{ padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.7}><path d={a.kind === 'lead' ? ICONS.leads : ICONS.realtors} /></svg>
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</span>
                  </span>
                  <span style={{ padding: '8px 8px', fontSize: 12, color: colors.textSoft }}>{a.sub}</span>
                  <span style={{ padding: '8px 8px', fontSize: 11, color: colors.textFaint }}>{timeAgo(a.at)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
