import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../icons/Icon'
import { useDrawer } from './DrawerContext'
import { useCounts } from './CountsContext'
import { useAuth } from '../../context/AuthContext'

/**
 * 56px portal top bar: left slot (page title or breadcrumb) + right actions.
 * Pass `title` for the common case, or `left` for custom content.
 */
export function Topbar({ title, left, right, actions, notifications = 0, avatar }) {
  const drawer = useDrawer()
  const counts = useCounts()
  const navigate = useNavigate()
  const { user } = useAuth() || {}
  // prefer the live unread count from the portal; fall back to the passed prop
  const notifCount = counts?.notifications ?? notifications
  // the bell links to the current role's notifications page
  const notifTo = user?.role === 'REALTOR' ? '/realtor/notifications' : user?.role === 'DEVELOPER' ? '/developer/notifications' : null
  return (
    <div
      className="wa-topbar"
      style={{
        height: 56,
        minHeight: 56,
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        padding: '0 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {drawer && (
          <button
            className="wa-hamburger"
            onClick={() => drawer.setOpen(true)}
            aria-label="Open menu"
            style={{ border: 'none', background: 'transparent', padding: 6, margin: '0 -4px 0 -6px', cursor: 'pointer', borderRadius: 8, color: colors.ink, alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
        )}
        {left || <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        {right}
        {actions}
        {(notifTo || notifCount > 0) && (
          <div
            onClick={() => notifTo && navigate(notifTo)}
            title="Notifications"
            style={{ position: 'relative', display: 'flex', cursor: notifTo ? 'pointer' : 'default' }}
          >
            <Icon name="bell" size={20} color={colors.textSoft} />
            {notifCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -5,
                  background: colors.green,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  borderRadius: 999,
                  minWidth: 15,
                  height: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {notifCount}
              </span>
            )}
          </div>
        )}
        {avatar}
      </div>
    </div>
  )
}

export default Topbar
