import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { realtorApi } from '../../lib/api'
import { timeAgo } from '../../lib/adminFormat'

const BLUE = '#1B4FD8'

const T = {
  lead: { iconBg: '#EEF3FF', iconColor: '#1B4FD8', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h4', pill: 'Lead update' },
  dealClosed: { iconBg: '#F0FDF4', iconColor: '#16A34A', icon: 'M8 11l3 3 5-6M20 6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z', pill: 'Commission' },
  coinGreen: { iconBg: '#F0FDF4', iconColor: '#16A34A', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10', pill: 'Commission' },
  coinBlue: { iconBg: '#EEF3FF', iconColor: '#1B4FD8', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10', pill: 'Commission' },
  project: { iconBg: '#FFFBEB', iconColor: '#D97706', icon: 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4', pill: 'New project' },
  badge: { iconBg: '#F5F3FF', iconColor: '#5B5BD6', icon: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM5 9H3a2 2 0 0 1-2-2V5h4M19 9h2a2 2 0 0 0 2-2V5h-4', pill: 'Achievement' },
  progress: { iconBg: '#F5F3FF', iconColor: '#5B5BD6', icon: 'M3 3v18h18M7 16l4-6 4 3 5-7', pill: 'Achievement' },
  platform: { iconBg: '#F3F4F6', iconColor: '#374151', icon: 'M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6', pill: 'Platform' },
  security: { iconBg: '#FFF5F5', iconColor: '#DC2626', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', pill: 'Account' },
}

// Map a backend notification `type` → design icon/style key in T and a filter category.
const TYPE_STYLE = { lead: 'lead', commission: 'coinGreen', badge: 'badge', announcement: 'platform', security: 'security' }
const TYPE_CAT = { lead: 'Leads', commission: 'Commissions', badge: 'Platform', announcement: 'Platform', security: 'Platform' }

const tabDefs = ['All', 'Unread', 'Leads', 'Commissions', 'Platform']

export default function Notifications() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [toast, setToast] = useState(false)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState(null)
  const [markHover, setMarkHover] = useState(false)
  const [prefHover, setPrefHover] = useState(false)

  const load = useCallback(async () => {
    const data = await realtorApi.listNotifications()
    setList(data.notifications || [])
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await realtorApi.listNotifications()
        if (!alive) return
        setList(data.notifications || [])
      } catch {
        /* leave empty */
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const markRead = async (n) => {
    if (!n.read) {
      setList((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      try { await realtorApi.markNotificationRead(n.id) } catch { /* ignore */ }
    }
    if (n.link) navigate(n.link)
  }

  const markAll = async () => {
    try {
      await realtorApi.markAllNotificationsRead()
      await load()
    } catch { /* ignore */ }
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  const unreadCount = list.filter((n) => !n.read).length
  const hasUnread = unreadCount > 0
  const unreadText = unreadCount + ' unread'

  const counts = {
    All: list.length,
    Unread: unreadCount,
    Leads: list.filter((n) => TYPE_CAT[n.type] === 'Leads').length,
    Commissions: list.filter((n) => TYPE_CAT[n.type] === 'Commissions').length,
    Platform: list.filter((n) => TYPE_CAT[n.type] === 'Platform').length,
  }

  let filtered = list
  if (tab === 'Unread') filtered = list.filter((n) => !n.read)
  else if (tab !== 'All') filtered = list.filter((n) => TYPE_CAT[n.type] === tab)

  const isEmpty = filtered.length === 0

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Notifications</span>
            {hasUnread && <span style={{ fontSize: 13, color: colors.textFaint, whiteSpace: 'nowrap' }}>{unreadText}</span>}
          </div>
        }
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            {hasUnread && (
              <button
                onClick={markAll}
                onMouseEnter={() => setMarkHover(true)}
                onMouseLeave={() => setMarkHover(false)}
                style={{ height: 34, padding: '0 14px', background: 'transparent', border: 'none', fontSize: 12, color: markHover ? colors.ink : colors.textSoft, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Mark all as read
              </button>
            )}
            <button
              className="wa-hide-sm"
              onMouseEnter={() => setPrefHover(true)}
              onMouseLeave={() => setPrefHover(false)}
              style={{ height: 34, padding: '0 14px', background: prefHover ? colors.surfaceAlt : '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.8}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Preferences →
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="pd-tabs" style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex', overflowX: 'auto' }}>
        {tabDefs.map((id) => {
          const on = tab === id
          return (
            <div
              key={id}
              onClick={() => setTab(id)}
              style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}
            >
              {id}
              <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, ...(on ? { background: colors.ink, color: '#fff' } : { background: colors.surfaceMuted, color: colors.textSoft }) }}>{counts[id]}</span>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
        {filtered.map((n) => {
          const t = T[TYPE_STYLE[n.type]] || T.platform
          const hovered = hoveredId === n.id
          const unread = !n.read
          return (
            <div
              key={n.id}
              onClick={() => markRead(n)}
              onMouseEnter={() => setHoveredId(n.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ position: 'relative', background: hovered ? colors.bg : '#fff', borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '14px 22px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'background 150ms' }}
            >
              {unread && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: BLUE }} />}
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: t.iconBg }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={t.iconColor} strokeWidth={1.8}>
                  <path d={t.icon} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, marginBottom: 2, color: unread ? colors.ink : colors.textMuted, fontWeight: unread ? 600 : 500 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: colors.textSoft, lineHeight: 1.5, marginBottom: 6 }}>{n.body}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: colors.surfaceMuted, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 500, color: colors.textSoft }}>{t.pill}</span>
                  <span style={{ color: colors.borderStrong }}>·</span>
                  <span style={{ fontSize: 11, color: colors.textFaint }}>{timeAgo(n.createdAt)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                {unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: BLUE }} />}
                <span style={{ opacity: hovered ? 1 : 0, transition: 'opacity 150ms', width: 28, height: 28, borderRadius: '50%', border: `1px solid ${colors.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </div>
          )
        })}

        {loading && (
          <div style={{ textAlign: 'center', padding: '64px 20px', fontSize: 13, color: colors.textSoft }}>Loading…</div>
        )}

        {!loading && isEmpty && (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.6} style={{ marginBottom: 12 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l3 3 5-6" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{tab === 'Unread' || tab === 'All' ? 'All caught up!' : 'No notifications'}</div>
            <div style={{ fontSize: 13, color: colors.textSoft, marginTop: 6 }}>{tab === 'Unread' ? 'No unread notifications.' : 'No notifications'}</div>
          </div>
        )}

        {!loading && !isEmpty && (
          <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: colors.textSoft }}>Showing 1–{filtered.length} of {filtered.length} notifications</span>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l3 3 5-6" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>All notifications marked as read</span>
        </div>
      )}
    </>
  )
}
