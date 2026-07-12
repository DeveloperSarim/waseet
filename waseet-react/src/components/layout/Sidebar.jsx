import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { useHover } from '../../hooks/useHover'
import { useAuth } from '../../context/AuthContext'
import { initials as toInitials } from '../../lib/adminFormat'
import { useDrawer } from './DrawerContext'

function NavIcon({ d, color }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function NavItem({ item, active, dark, onNav }) {
  const [hovered, hoverProps] = useHover()

  const itemStyle = dark
    ? {
        color: active ? '#fff' : hovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
        background: active ? 'rgba(255,255,255,0.1)' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
      }
    : {
        color: active ? colors.greenDark : colors.textMuted,
        background: active ? colors.greenTint : hovered ? colors.surfaceMuted : 'transparent',
      }

  const iconColor = dark
    ? active
      ? '#fff'
      : 'rgba(255,255,255,0.35)'
    : active
    ? colors.greenDark
    : colors.textFaint

  const badgeStyle = item.badgeRed
    ? dark
      ? { background: 'rgba(220,38,38,0.3)', color: '#FCA5A5' }
      : { background: colors.redSoft, color: colors.red }
    : dark
    ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
    : { background: colors.surfaceMuted, color: colors.textFaint, border: `1px solid ${colors.border}` }

  return (
    <Link
      {...hoverProps}
      to={item.to}
      onClick={onNav}
      style={{
        position: 'relative',
        display: 'flex',
        gap: 9,
        alignItems: 'center',
        padding: '8px 10px',
        borderRadius: 8,
        marginBottom: 1,
        fontSize: 13,
        transition: 'all 150ms',
        ...itemStyle,
      }}
    >
      {active && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            width: 3,
            height: 20,
            background: colors.green,
            borderRadius: '0 3px 3px 0',
          }}
        />
      )}
      <NavIcon d={item.d} color={iconColor} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 999, padding: '1px 7px', ...badgeStyle }}>
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export function Sidebar({ config, className }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth() || {}
  const drawer = useDrawer()
  const closeDrawer = () => drawer?.setOpen(false)
  const dark = config.theme === 'dark'
  const border = dark ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${colors.border}`

  // Real logged-in identity overrides the static placeholder from navConfig.
  const displayName = user?.fullName || config.user.name
  const displayInitials = user ? toInitials(user.fullName) : config.user.initials
  const displaySub = user
    ? (user.role === 'ADMIN' ? user.email : config.badge.label)
    : config.user.sub

  const onLogout = async (e) => {
    e.preventDefault()
    if (logout) await logout()
    navigate('/login')
  }

  // Longest matching route wins so nested pages keep their parent highlighted.
  const allItems = config.groups.flatMap((g) => g.items)
  const activeTo = allItems
    .filter((i) => location.pathname === i.to || location.pathname.startsWith(i.to + '/'))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to

  return (
    <div
      className={className}
      style={{
        width: 232,
        minWidth: 232,
        background: dark ? colors.ink : colors.bg,
        borderRight: border,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Brand header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: border,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link to={config.base} onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={dark ? '#fff' : colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" />
            <circle cx="12" cy="11" r="2.4" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: dark ? '#fff' : colors.ink }}>
            waseet
          </span>
          <span style={{ fontSize: 11, color: dark ? 'rgba(255,255,255,0.35)' : colors.textFaint }}>وسيط</span>
        </Link>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: config.badge.color,
            background: config.badge.bg,
            border: `1px solid ${config.badge.border}`,
            borderRadius: 4,
            padding: '2px 6px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginLeft: config.badge.marginLeftAuto ? 'auto' : undefined,
          }}
        >
          {config.badge.label}
        </span>
      </div>

      {/* Nav groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
        {config.groups.map((group) => (
          <div key={group.label}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: colors.textFaint,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '12px 8px 6px',
              }}
            >
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavItem key={item.to} item={item} active={item.to === activeTo} dark={dark} onNav={closeDrawer} />
            ))}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div style={{ padding: 14, borderTop: border, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div
          style={{
            width: 32,
            height: 32,
            minWidth: 32,
            borderRadius: '50%',
            background: dark ? 'rgba(255,255,255,0.15)' : colors.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {displayInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: dark ? '#fff' : colors.ink,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: 11,
              color: config.user.subColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displaySub}
          </div>
        </div>
        <a href="/login" onClick={onLogout} title="Log out" style={{ display: 'flex' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={dark ? 'rgba(255,255,255,0.35)' : colors.textFaint} strokeWidth={1.7} style={{ cursor: 'pointer' }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </a>
      </div>
    </div>
  )
}

export default Sidebar
