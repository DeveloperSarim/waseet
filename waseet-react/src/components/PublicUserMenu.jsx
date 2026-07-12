import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../theme/tokens'
import { useAuth } from '../context/AuthContext'
import { initials as toInitials } from '../lib/adminFormat'

// Logged-in avatar + dropdown for the public/marketplace navbars.
// Renders nothing when there's no session (caller shows Login/Join instead).
export function PublicUserMenu() {
  const { user, logout } = useAuth() || {}
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  if (!user) return null

  const portal = user.role === 'ADMIN' ? '/admin' : user.role === 'DEVELOPER' ? '/developer' : '/realtor'
  const roleLabel = user.role === 'ADMIN' ? 'Admin' : user.role === 'DEVELOPER' ? 'Developer' : 'Realtor'
  const items = [
    ['My Portal', portal],
    ['My Profile', `${portal}/profile`],
    ['Settings', `${portal}/settings`],
  ]
  const go = (to) => { setOpen(false); navigate(to) }
  const onLogout = async () => { setOpen(false); try { await logout?.() } catch {} navigate('/login') }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
          {toInitials(user.fullName)}
        </div>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}><path d="M6 9l6 6 6-6" /></svg>
      </div>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 42, width: 220, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', padding: 6, zIndex: 200 }}>
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${colors.surfaceMuted}`, marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName}</div>
            <div style={{ fontSize: 11, color: colors.textFaint }}>{roleLabel} · {user.email}</div>
          </div>
          {items.map(([label, to]) => (
            <div key={label} onClick={() => go(to)} style={{ padding: '8px 10px', fontSize: 13, color: colors.textMuted, borderRadius: 7, cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceMuted)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              {label}
            </div>
          ))}
          <div onClick={onLogout} style={{ padding: '8px 10px', fontSize: 13, color: colors.red, borderRadius: 7, cursor: 'pointer', borderTop: `1px solid ${colors.surfaceMuted}`, marginTop: 4 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.redTint)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            Log out
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicUserMenu
