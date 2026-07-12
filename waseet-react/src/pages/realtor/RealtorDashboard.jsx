import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { colors, radius } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { PortalMain } from '../../components/layout/PortalLayout'
import { Avatar } from '../../components/ui'
import { UserAvatar } from '../../components/UserAvatar'
import { useAuth } from '../../context/AuthContext'
import { realtorApi } from '../../lib/api'
import { joinedLabel, timeAgo } from '../../lib/adminFormat'

// KPI card meta (icon path + labels). Values come from the live dashboard() stats.
const kpiMeta = [
  { key: 'leads', label: 'My Leads', sub: 'this week', subColor: colors.textSoft, money: false, d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8' },
  { key: 'deals', label: 'Deals Closed', sub: 'all time', subColor: colors.textSoft, money: false, d: 'M11 17a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M13 7a5 5 0 0 0-7 0L3 10a5 5 0 0 0 7 7l1-1' },
  { key: 'totalEarned', label: 'Total Earned', sub: 'all time', subColor: colors.textSoft, money: true, d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1.1 1.5-2.5 1.5-2.5.5-2.5 1.5 1.1 1.5 2.5 1.5 2.5-.5 2.5-1.5' },
  { key: 'pending', label: 'Pending', sub: 'processing', subColor: colors.textSoft, money: true, d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2' },
]

// Recent-activity dot color by kind.
const activityDot = { commission: colors.green, lead: '#1B4FD8' }

const card = {
  background: '#fff',
  border: `1px solid ${colors.border}`,
  borderRadius: radius.xl,
  padding: '14px 16px',
  marginBottom: 14,
}

const sectionHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }
const viewAll = { fontSize: 12, color: colors.greenDark, cursor: 'pointer' }

export default function RealtorDashboard() {
  const { user } = useAuth() || {}
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [newProjects, setNewProjects] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await realtorApi.dashboard()
        if (!alive) return
        setStats(data.stats || null)
        setActivity(data.activity || [])
      } catch { /* ignore */ }
    })()
    ;(async () => {
      try {
        const projects = await realtorApi.listProjects()
        if (!alive) return
        setNewProjects((projects || []).slice(0, 3))
      } catch { /* ignore */ }
    })()
    return () => { alive = false }
  }, [])

  const kpiValue = (m) => {
    const n = stats ? stats[m.key] : 0
    const v = typeof n === 'number' ? n : 0
    return m.money ? `SAR ${v.toLocaleString()}` : String(v)
  }

  return (
    <>
      <Topbar title="Dashboard" notifications={2} avatar={<UserAvatar size={32} />} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
        {/* Bank alert — only while the realtor hasn't added payout bank details */}
        {!(user?.bankName && user?.iban) && (
        <div
          style={{
            background: '#fff',
            border: `1px solid ${colors.border}`,
            borderLeft: `3px solid ${colors.amber}`,
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth={1.8} style={{ flexShrink: 0 }}>
            <path d="M12 2L1 21h22z" />
            <path d="M12 9v5M12 17h.01" />
          </svg>
          <span style={{ fontSize: 13, color: colors.textMuted }}>Add your bank details to receive commission payments</span>
          <Link to="/realtor/bank" style={{ fontSize: 12, color: colors.greenDark, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Add bank details →
          </Link>
        </div>
        )}

        {/* Badge / tier progress */}
        <div style={{ ...card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 22 }}>🥉</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Bronze Realtor</div>
                <div style={{ fontSize: 11, color: colors.textFaint }}>Active since {joinedLabel(user?.createdAt)}</div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: colors.textSoft }}>10 more deals to Platinum 💎</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: colors.textFaint, marginBottom: 4 }}>
              <span>Bronze</span>
              <span>Silver</span>
              <span>Gold</span>
              <span>Platinum</span>
            </div>
            <div style={{ height: 4, background: colors.surfaceMuted, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '0%', height: '100%', background: colors.green, borderRadius: 999 }} />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 14 }}>
          {kpiMeta.map((k) => (
            <div key={k.label} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '14px 16px' }}>
              <div style={{ width: 32, height: 32, background: colors.greenTint, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d={k.d} />
                </svg>
              </div>
              <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{kpiValue(k)}</div>
              <div style={{ fontSize: 11, color: k.subColor, marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div style={{ ...card }}>
          <div style={sectionHeader}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Recent activity</span>
            <span style={viewAll}>View all →</span>
          </div>
          {activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: activityDot[a.kind] || colors.textSoft, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>{a.sub}</div>
              </div>
              <span style={{ fontSize: 11, color: colors.textFaint, flexShrink: 0 }}>{timeAgo(a.at)}</span>
            </div>
          ))}
          {activity.length === 0 && (
            <div style={{ fontSize: 12, color: colors.textFaint, padding: '10px 0' }}>No recent activity yet.</div>
          )}
        </div>

        {/* New this week */}
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '14px 16px' }}>
          <div style={{ ...sectionHeader, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>New this week</span>
            <Link to="/realtor/browse" style={viewAll}>View all →</Link>
          </div>
          {newProjects.map((p) => (
            <Link key={p.id} to={'/realtor/browse'} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.surfaceMuted}`, textDecoration: 'none', color: 'inherit' }}>
              <div
                style={{
                  width: 40,
                  height: 32,
                  minWidth: 40,
                  borderRadius: 5,
                  background: colors.surfaceMuted,
                  backgroundImage: p.image ? `url(${p.image})` : 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 7px)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{p.title}</div>
                <div style={{ fontSize: 10, color: colors.textFaint }}>{p.location}</div>
              </div>
              <span style={{ background: colors.ink, color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>{p.commissionPct}%</span>
            </Link>
          ))}
          {newProjects.length === 0 && (
            <div style={{ fontSize: 12, color: colors.textFaint, padding: '10px 0' }}>No new projects.</div>
          )}
        </div>
      </div>
    </>
  )
}
