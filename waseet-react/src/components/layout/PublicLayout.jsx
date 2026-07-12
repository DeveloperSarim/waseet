import React, { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { useHover } from '../../hooks/useHover'
import { useAuth } from '../../context/AuthContext'
import { PublicUserMenu } from '../PublicUserMenu'
import { portalHome } from '../../lib/portalNav'

function NavLinkText({ children, to }) {
  const [hovered, hoverProps] = useHover()
  const navigate = useNavigate()
  return (
    <span
      {...hoverProps}
      onClick={() => to && navigate(to)}
      style={{ fontSize: 13, color: hovered ? colors.ink : colors.textMuted, cursor: 'pointer', transition: 'color 120ms' }}
    >
      {children}
    </span>
  )
}

function LangToggle() {
  const [lang, setLang] = useState('EN')
  const cell = (active) => ({
    padding: '6px 10px',
    fontSize: 12,
    cursor: 'pointer',
    background: active ? colors.ink : '#fff',
    color: active ? '#fff' : colors.textMuted,
    fontWeight: active ? 600 : 400,
  })
  return (
    <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden' }}>
      <span onClick={() => setLang('AR')} style={cell(lang === 'AR')}>
        AR
      </span>
      <span onClick={() => setLang('EN')} style={cell(lang === 'EN')}>
        EN
      </span>
    </div>
  )
}

export function PublicNav() {
  const [listHover, listHoverProps] = useHover()
  const [joinHover, joinHoverProps] = useHover()
  const { user } = useAuth() || {}
  return (
    <div
      style={{
        height: 56,
        minHeight: 56,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" />
          <circle cx="12" cy="11" r="2.4" />
        </svg>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>waseet</span>
        <span style={{ fontSize: 12, color: colors.textFaint, marginLeft: 2 }}>وسيط</span>
      </Link>

      <div className="wa-hide-sm" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {user ? (
          <>
            <NavLinkText to="/marketplace">Marketplace</NavLinkText>
            <NavLinkText to={portalHome(user.role)}>My Dashboard</NavLinkText>
            {user.role === 'REALTOR' && <NavLinkText to="/realtor/leads">My Leads</NavLinkText>}
            {user.role === 'DEVELOPER' && <NavLinkText to="/developer/projects">My Projects</NavLinkText>}
            {user.role === 'ADMIN' && <NavLinkText to="/admin/projects">Projects</NavLinkText>}
          </>
        ) : (
          <>
            <NavLinkText to="/">How it works</NavLinkText>
            <NavLinkText to="/register/developer">For Developers</NavLinkText>
            <NavLinkText to="/register/realtor">For Realtors</NavLinkText>
            <NavLinkText to="/marketplace">Pricing</NavLinkText>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LangToggle />
        {user ? (
          <PublicUserMenu />
        ) : (
          <>
            <Link to="/login" className="wa-hide-sm" style={{ fontSize: 13, color: colors.textMuted, cursor: 'pointer', margin: '0 4px' }}>
              Login
            </Link>
            <Link
              {...listHoverProps}
              to="/register/developer"
              style={{
                height: 36,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 16px',
                background: listHover ? colors.greenDark : colors.green,
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 500,
                color: '#fff',
              }}
            >
              List your project
            </Link>
            <Link
              {...joinHoverProps}
              to="/register/realtor"
              className="wa-hide-sm"
              style={{
                height: 36,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 16px',
                background: joinHover ? colors.surfaceAlt : '#fff',
                border: `1px solid ${colors.border}`,
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 500,
                color: colors.textMuted,
              }}
            >
              Join as realtor
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

const socials = [
  'M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12H17l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z',
  'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 18H6V10h2.5v8zM7.2 8.8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM18 18h-2.5v-4.3c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.7V18H10.4s0-7.3 0-8H13v1.1c.3-.5 1-1.3 2.4-1.3 1.7 0 3 1.1 3 3.6V18z',
  'M18.2 2H21l-6.5 7.4L22 22h-6l-4.7-6.1L5.8 22H3l7-8L2 2h6.2l4.2 5.6L18.2 2zm-1 18h1.6L7.9 3.7H6.1L17.2 20z',
]

const footerCols = [
  { title: 'Platform', links: [['Marketplace', '/marketplace'], ['For Developers', '#'], ['For Realtors', '#'], ['How it Works', '#']] },
  { title: 'Company', links: [['About', '#'], ['Contact', '#'], ['Careers', '#'], ['Pricing', '#']] },
  { title: 'Legal', links: [['Privacy Policy', '/legal/privacy'], ['Terms of Use', '/legal/terms'], ['Cookie Notice', '/legal/cookies']] },
]

function FooterLink({ label, to }) {
  const [hovered, hoverProps] = useHover()
  const inner = (
    <span {...hoverProps} style={{ fontSize: 13, color: hovered ? colors.ink : colors.textMuted, display: 'block', marginBottom: 10 }}>
      {label}
    </span>
  )
  return to && to !== '#' ? <Link to={to}>{inner}</Link> : inner
}

export function PublicFooter() {
  return (
    <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '52px 32px 28px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap', paddingBottom: 36, borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ flex: 2, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" />
                <circle cx="12" cy="11" r="2.4" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>waseet</span>
              <span style={{ fontSize: 12, color: colors.textFaint, marginLeft: 2 }}>وسيط</span>
            </div>
            <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.6, marginTop: 12, maxWidth: 300 }}>
              Saudi Arabia's private B2B real estate network — verified developers, licensed realtors, commission protected.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              {socials.map((d, i) => (
                <span
                  key={i}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <svg width={15} height={15} viewBox="0 0 24 24" fill={colors.textSoft}>
                    <path d={d} />
                  </svg>
                </span>
              ))}
            </div>
          </div>
          {footerCols.map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                {col.title}
              </div>
              {col.links.map(([label, to]) => (
                <FooterLink key={label} label={label} to={to} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: colors.textFaint }}>© 2026 Waseet. All rights reserved.</span>
          <span style={{ fontSize: 12, color: colors.textFaint }}>جميع الحقوق محفوظة · Riyadh, Saudi Arabia</span>
        </div>
      </div>
    </div>
  )
}

/** Public site shell: sticky nav + page outlet + footer. */
export function PublicLayout() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: colors.ink, background: '#fff', minHeight: '100vh' }}>
      <PublicNav />
      <Outlet />
      <PublicFooter />
    </div>
  )
}

export default PublicLayout
