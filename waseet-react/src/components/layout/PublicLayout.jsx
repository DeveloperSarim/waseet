import React, { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { useHover } from '../../hooks/useHover'
import { useAuth } from '../../context/AuthContext'
import { PublicUserMenu } from '../PublicUserMenu'
import { portalHome } from '../../lib/portalNav'
import { landingApi } from '../../lib/api'

// Navbar + footer content is admin-managed (Admin → Landing Page → Header & Footer).
// These fallbacks mirror the original markup so the chrome renders instantly and
// survives an API outage.
const FALLBACK_NAV = {
  logoText: 'waseet', logoSub: 'وسيط', logoImage: { url: null },
  links: [
    { label: 'How it works', href: '/', visible: true },
    { label: 'For Developers', href: '/register/developer', visible: true },
    { label: 'For Realtors', href: '/register/realtor', visible: true },
    { label: 'Pricing', href: '/marketplace', visible: true },
  ],
  loginLabel: 'Login',
  primaryBtn: { label: 'List your project', href: '/register/developer', visible: true },
  secondaryBtn: { label: 'Join as realtor', href: '/register/realtor', visible: true },
  showLangToggle: true,
}
const FALLBACK_FOOTER = {
  logoText: 'waseet', logoSub: 'وسيط', logoImage: { url: null },
  tagline: "Saudi Arabia's private B2B real estate network — verified developers, licensed realtors, commission protected.",
  socials: [
    { type: 'facebook', href: '', visible: true },
    { type: 'linkedin', href: '', visible: true },
    { type: 'x', href: '', visible: true },
  ],
  columns: [
    { title: 'Platform', links: [{ label: 'Marketplace', href: '/marketplace' }, { label: 'For Developers', href: '/register/developer' }, { label: 'For Realtors', href: '/register/realtor' }, { label: 'How it Works', href: '/' }] },
    { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Contact', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Pricing', href: '/marketplace' }] },
    { title: 'Legal', links: [{ label: 'Privacy Policy', href: '/legal/privacy' }, { label: 'Terms of Use', href: '/legal/terms' }, { label: 'Cookie Notice', href: '/legal/cookies' }] },
  ],
  copyrightLeft: '© 2026 Waseet. All rights reserved.',
  copyrightRight: 'جميع الحقوق محفوظة · Riyadh, Saudi Arabia',
}

const SOCIAL_ICONS = {
  facebook: 'M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12H17l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z',
  linkedin: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 18H6V10h2.5v8zM7.2 8.8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM18 18h-2.5v-4.3c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.7V18H10.4s0-7.3 0-8H13v1.1c.3-.5 1-1.3 2.4-1.3 1.7 0 3 1.1 3 3.6V18z',
  x: 'M18.2 2H21l-6.5 7.4L22 22h-6l-4.7-6.1L5.8 22H3l7-8L2 2h6.2l4.2 5.6L18.2 2zm-1 18h1.6L7.9 3.7H6.1L17.2 20z',
  instagram: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2a3.9 3.9 0 0 1-.9 1.4 3.9 3.9 0 0 1-1.4.9c-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 4.3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 9a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm5.7-9.2a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0z',
  youtube: 'M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.7C19.4 5.2 12 5.2 12 5.2s-7.4 0-8.9.4A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7c.2.8.9 1.5 1.7 1.7 1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4c.8-.2 1.5-.9 1.7-1.7.4-1.5.4-4.7.4-4.7zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z',
  website: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c2.5 2.7 4 6.3 4 10s-1.5 7.3-4 10c-2.5-2.7-4-6.3-4-10s1.5-7.3 4-10z',
}

const isExternal = (to) => /^https?:\/\//i.test(to || '')

function LogoMark({ img, text, sub, size = 20, subSize = 12 }) {
  if (img) return <img src={img} alt={text || 'logo'} style={{ height: size + 6, maxWidth: 160, objectFit: 'contain' }} />
  return (
    <>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" />
        <circle cx="12" cy="11" r="2.4" />
      </svg>
      {text && <span style={{ fontSize: size < 20 ? 15 : 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{text}</span>}
      {sub && <span style={{ fontSize: subSize, color: colors.textFaint, marginLeft: 2 }}>{sub}</span>}
    </>
  )
}

function NavLinkText({ children, to }) {
  const [hovered, hoverProps] = useHover()
  const navigate = useNavigate()
  const onClick = () => { if (!to) return; isExternal(to) ? (window.location.href = to) : navigate(to) }
  return (
    <span {...hoverProps} onClick={onClick} style={{ fontSize: 13, color: hovered ? colors.ink : colors.textMuted, cursor: 'pointer', transition: 'color 120ms' }}>
      {children}
    </span>
  )
}

function NavButton({ b, variant, className }) {
  const [h, hp] = useHover()
  const navigate = useNavigate()
  if (!b || b.visible === false || !b.label) return null
  const onClick = () => { if (!b.href) return; isExternal(b.href) ? (window.location.href = b.href) : navigate(b.href) }
  const base = { height: 36, display: 'inline-flex', alignItems: 'center', padding: '0 16px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer' }
  const styles = variant === 'primary'
    ? { ...base, background: h ? colors.greenDark : colors.green, color: '#fff' }
    : { ...base, background: h ? colors.surfaceAlt : '#fff', border: `1px solid ${colors.border}`, color: colors.textMuted }
  return <span {...hp} onClick={onClick} className={className} style={styles}>{b.label}</span>
}

function LangToggle() {
  const [lang, setLang] = useState('EN')
  const cell = (active) => ({ padding: '6px 10px', fontSize: 12, cursor: 'pointer', background: active ? colors.ink : '#fff', color: active ? '#fff' : colors.textMuted, fontWeight: active ? 600 : 400 })
  return (
    <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden' }}>
      <span onClick={() => setLang('AR')} style={cell(lang === 'AR')}>AR</span>
      <span onClick={() => setLang('EN')} style={cell(lang === 'EN')}>EN</span>
    </div>
  )
}

export function PublicNav({ nav = FALLBACK_NAV }) {
  const { user } = useAuth() || {}
  const logoImg = nav.logoImage?.url || null
  const links = (nav.links || []).filter((l) => l.visible !== false)
  return (
    <div style={{ height: 56, minHeight: 56, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <LogoMark img={logoImg} text={nav.logoText} sub={nav.logoSub} />
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
          links.map((l, i) => <NavLinkText key={i} to={l.href}>{l.label}</NavLinkText>)
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {nav.showLangToggle !== false && <LangToggle />}
        {user ? (
          <PublicUserMenu />
        ) : (
          <>
            {nav.loginLabel && <Link to="/login" className="wa-hide-sm" style={{ fontSize: 13, color: colors.textMuted, cursor: 'pointer', margin: '0 4px' }}>{nav.loginLabel}</Link>}
            <NavButton b={nav.primaryBtn} variant="primary" />
            <NavButton b={nav.secondaryBtn} variant="outline" className="wa-hide-sm" />
          </>
        )}
      </div>
    </div>
  )
}

function FooterLink({ label, to }) {
  const [hovered, hoverProps] = useHover()
  const navigate = useNavigate()
  return (
    <span {...hoverProps} onClick={() => { if (to && to !== '#') isExternal(to) ? (window.location.href = to) : navigate(to) }} style={{ fontSize: 13, color: hovered ? colors.ink : colors.textMuted, display: 'block', marginBottom: 10, cursor: to && to !== '#' ? 'pointer' : 'default' }}>
      {label}
    </span>
  )
}

export function PublicFooter({ footer = FALLBACK_FOOTER }) {
  const logoImg = footer.logoImage?.url || null
  const socials = (footer.socials || []).filter((s) => s.visible !== false)
  return (
    <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '52px 32px 28px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap', paddingBottom: 36, borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ flex: 2, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogoMark img={logoImg} text={footer.logoText} sub={footer.logoSub} size={18} />
            </div>
            {footer.tagline && <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.6, marginTop: 12, maxWidth: 300 }}>{footer.tagline}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              {socials.map((s, i) => {
                const d = SOCIAL_ICONS[s.type] || SOCIAL_ICONS.website
                const icon = (
                  <span style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: s.href ? 'pointer' : 'default' }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill={colors.textSoft}><path d={d} /></svg>
                  </span>
                )
                return s.href ? <a key={i} href={s.href} target="_blank" rel="noreferrer" aria-label={s.type}>{icon}</a> : <React.Fragment key={i}>{icon}</React.Fragment>
              })}
            </div>
          </div>
          {(footer.columns || []).map((col, ci) => (
            <div key={ci}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>{col.title}</div>
              {(col.links || []).map((lnk, li) => <FooterLink key={li} label={lnk.label} to={lnk.href} />)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {footer.copyrightLeft && <span style={{ fontSize: 12, color: colors.textFaint }}>{footer.copyrightLeft}</span>}
          {footer.copyrightRight && <span style={{ fontSize: 12, color: colors.textFaint }}>{footer.copyrightRight}</span>}
        </div>
      </div>
    </div>
  )
}

/** Public site shell: sticky nav + page outlet + footer. Nav/footer content is
 *  admin-managed; fetched once here and passed down (falls back to defaults). */
export function PublicLayout() {
  const [chrome, setChrome] = useState(null)
  useEffect(() => {
    let alive = true
    landingApi.get().then((c) => { if (alive && c) setChrome(c) }).catch(() => {})
    return () => { alive = false }
  }, [])
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: colors.ink, background: '#fff', minHeight: '100vh' }}>
      <PublicNav nav={chrome?.navbar || FALLBACK_NAV} />
      <Outlet />
      <PublicFooter footer={chrome?.footer || FALLBACK_FOOTER} />
    </div>
  )
}

export default PublicLayout
