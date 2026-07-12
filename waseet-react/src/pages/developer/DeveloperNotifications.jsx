import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { PortalMain } from '../../components/layout/PortalLayout'
import { UserAvatar } from '../../components/UserAvatar'
import { developerApi } from '../../lib/api'
import { timeAgo } from '../../lib/adminFormat'

// backend notification `type` → design icon + tone
const TYPE_STYLE = {
  lead: { icon: 'user', tone: 'blue' },
  commission: { icon: 'dollar', tone: 'green' },
  deal: { icon: 'checkCircle', tone: 'green' },
  project: { icon: 'building', tone: 'amber' },
  announcement: { icon: 'megaphone', tone: 'amber' },
  badge: { icon: 'award', tone: 'green' },
  security: { icon: 'shield', tone: 'red' },
}

const toneMap = {
  green: { bg: colors.greenTint, color: colors.green },
  blue: { bg: colors.blueTint, color: colors.blue },
  amber: { bg: colors.amberTint, color: colors.amber },
  red: { bg: colors.redTint, color: colors.red },
}

export default function DeveloperNotifications() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(false)

  const load = useCallback(async () => {
    const data = await developerApi.listNotifications()
    setList(data.notifications || [])
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await developerApi.listNotifications()
        if (!alive) return
        setList(data.notifications || [])
      } catch { /* leave empty */ }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [])

  const unread = list.filter((n) => !n.read).length

  const markRead = async (n) => {
    if (!n.read) {
      setList((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      try { await developerApi.markNotificationRead(n.id) } catch { /* ignore */ }
    }
    if (n.link) navigate(n.link)
  }

  const markAll = async () => {
    setList((l) => l.map((x) => ({ ...x, read: true })))
    try {
      await developerApi.markAllNotificationsRead()
      await load()
    } catch { /* ignore */ }
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  // group into Today / Earlier by createdAt
  const today = list.filter((n) => timeAgo(n.createdAt) === 'Today')
  const earlier = list.filter((n) => timeAgo(n.createdAt) !== 'Today')
  const groups = [
    { label: 'Today', items: today },
    { label: 'Earlier', items: earlier },
  ].filter((g) => g.items.length > 0)

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Notifications</span>
            {unread > 0 && <span style={{ fontSize: 13, color: colors.textFaint }}>{unread} unread</span>}
          </div>
        }
        notifications={unread}
        avatar={<UserAvatar size={30} background={colors.surfaceMuted} color={colors.textMuted} style={{ border: `1px solid ${colors.border}` }} />}
        actions={unread > 0 ? <button onClick={markAll} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Mark all read</button> : null}
      />
      <PortalMain maxWidth={720} padding="20px 22px">
        {loading && (
          <div style={{ textAlign: 'center', padding: '56px 20px', fontSize: 13, color: colors.textFaint }}>Loading…</div>
        )}

        {!loading && list.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.6} style={{ marginBottom: 12 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
            <div style={{ fontSize: 14, fontWeight: 600 }}>All caught up!</div>
            <div style={{ fontSize: 13, color: colors.textSoft, marginTop: 6 }}>You have no notifications.</div>
          </div>
        )}

        {!loading && groups.map((g) => (
          <div key={g.label} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{g.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {g.items.map((n) => {
                const s = TYPE_STYLE[n.type] || { icon: 'bell', tone: 'green' }
                const t = toneMap[s.tone]
                const unreadItem = !n.read
                return (
                  <div key={n.id} onClick={() => markRead(n)} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '13px 15px', cursor: 'pointer' }}>
                    <span style={{ width: 34, height: 34, minWidth: 34, borderRadius: 9, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={s.icon} size={17} color={t.color} strokeWidth={1.8} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
                      {n.body && <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>{n.body}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: colors.textFaint }}>{timeAgo(n.createdAt)}</span>
                      {unreadItem && <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.green }} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </PortalMain>

      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>All notifications marked as read</span>
        </div>
      )}
    </>
  )
}
