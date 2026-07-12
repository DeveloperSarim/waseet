import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { UserAvatar } from '../../components/UserAvatar'
import { useAuth } from '../../context/AuthContext'
import { developerApi } from '../../lib/api'
import { timeAgo } from '../../lib/adminFormat'

// KPI card meta (icon path + labels). Values come from the live dashboard() stats.
const kpiMeta = [
  { key: 'live', label: 'Live Projects', money: false, d: 'M3 21h18M6 21V7l6-4 6 4v14M9 9h2M13 9h2', sub: (s) => `${Math.max((s.projects || 0) - (s.live || 0), 0)} under review` },
  { key: 'leads', label: 'New Leads', money: false, d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 11v6M9 14h6', sub: () => 'this week' },
  { key: 'deals', label: 'Deals Closed', money: false, d: 'M11 17a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M13 7a5 5 0 0 0-7 0L3 10a5 5 0 0 0 7 7l1-1', sub: () => 'all time' },
  { key: 'commissionPaid', label: 'Commission Paid', money: true, d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1.1 1.5-2.5 1.5-2.5.5-2.5 1.5 1.1 1.5 2.5 1.5 2.5-.5 2.5-1.5', sub: () => 'to realtors total' },
  { key: 'realtors', label: 'Active Realtors', money: false, d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', sub: () => 'submitted leads' },
]

// Recent-activity dot color by kind.
const activityDot = { lead: '#1B4FD8', deal: colors.green, commission: colors.green, project: colors.amber }

export default function DeveloperDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth() || {}
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await developerApi.dashboard()
        if (!alive) return
        setStats(data.stats || null)
        setActivity(data.activity || [])
      } catch { /* ignore */ }
    })()
    ;(async () => {
      try {
        const n = await developerApi.listNotifications()
        if (!alive) return
        setUnread(n.unread || 0)
      } catch { /* ignore */ }
    })()
    return () => { alive = false }
  }, [])

  const companyName = user?.companyName || user?.fullName || 'there'

  const kpiValue = (m) => {
    const n = stats ? stats[m.key] : 0
    const v = typeof n === 'number' ? n : 0
    return m.money ? `SAR ${v.toLocaleString()}` : String(v)
  }

  return (
    <>
      <Topbar title="Dashboard" notifications={unread} avatar={<UserAvatar size={32} background={colors.surfaceMuted} color={colors.textMuted} style={{ border: `1px solid ${colors.border}` }} />} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
        {/* Greeting */}
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }}>Welcome back, {companyName}</div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
          {kpiMeta.map((k) => (
            <div key={k.label} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ width: 30, height: 30, background: colors.greenTint, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={k.d} /></svg>
              </div>
              <div style={{ fontSize: 10, color: colors.textFaint, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{kpiValue(k)}</div>
              <div style={{ fontSize: 10, color: colors.textSoft, marginTop: 3 }}>{stats ? k.sub(stats) : k.sub({})}</div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Recent activity</span>
            <span onClick={() => navigate('/developer/leads')} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>View all →</span>
          </div>
          {activity.length === 0 && (
            <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>No recent activity yet</div>
          )}
          {activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: activityDot[a.kind] || colors.textSoft, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
                {a.sub && <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>{a.sub}</div>}
              </div>
              <span style={{ fontSize: 11, color: colors.textFaint, flexShrink: 0 }}>{timeAgo(a.at)}</span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/developer/projects/new')} style={{ height: 36, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} color="#fff" strokeWidth={2} />Add New Project
          </button>
          <button onClick={() => navigate('/developer/leads')} style={{ height: 36, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>View All Leads</button>
          <button onClick={() => navigate('/developer/commissions')} style={{ height: 36, padding: '0 14px', background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: colors.red, fontFamily: 'inherit', cursor: 'pointer' }}>Pending Payments</button>
        </div>
      </div>
    </>
  )
}
