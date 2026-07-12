import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { useHover } from '../../hooks/useHover'
import { statusApi } from '../../lib/api'

const fmtDateTime = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(',', ' ·')
  } catch { return '—' }
}

const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

function HoverBtn({ base, hover, children, ...props }) {
  const [h, hp] = useHover()
  return (
    <button {...hp} {...props} style={{ ...base, ...(h ? hover : null) }}>
      {children}
    </button>
  )
}

function HoverSpan({ base, hover, children, ...props }) {
  const [h, hp] = useHover()
  return (
    <span {...hp} {...props} style={{ ...base, ...(h ? hover : null) }}>
      {children}
    </span>
  )
}

/* =========================================================================
   404 ERROR PAGE
   ========================================================================= */
export function ErrorPage() {
  const navigate = useNavigate()
  const quickLinks = [
    ['Marketplace', '/marketplace'],
    ['Dashboard', '/realtor'],
    ['My Leads', '/realtor/leads'],
    ['Support', '/legal/privacy'],
  ]
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: colors.bg, fontFamily: 'Inter, sans-serif', color: colors.ink }}>
      {/* NAVBAR */}
      <div style={{ height: 56, flexShrink: 0, background: '#fff', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginLeft: 7 }}>waseet</span>
          <span style={{ fontSize: 11, color: colors.textFaint, marginLeft: 6 }}>وسيط</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HoverBtn onClick={() => navigate('/login')} base={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${colors.border}`, background: '#fff', color: colors.textMuted, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }} hover={{ background: colors.surfaceAlt }}>Login</HoverBtn>
          <HoverBtn onClick={() => navigate('/register/developer')} base={{ height: 34, padding: '0 16px', borderRadius: 8, border: 'none', background: colors.green, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }} hover={{ background: colors.greenDark }}>Register</HoverBtn>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, width: '100%', padding: '8px 8px 12px' }}>
          <div style={{ position: 'relative', height: 140, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: '-0.04em', color: colors.border, lineHeight: 1 }}>404</div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-58%)', width: 80, height: 80, border: `2px dashed ${colors.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /><path d="M11 8v3" strokeWidth={1.6} /><circle cx="11" cy="13.6" r="0.4" fill={colors.textFaint} stroke="none" /></svg>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Page not found</div>
          <div style={{ fontSize: 14, color: colors.textSoft, lineHeight: 1.6, marginBottom: 20 }}>The page you're looking for doesn't exist or has been moved. Check the URL or go back to where you came from.</div>
          <div style={{ display: 'inline-block', background: colors.surfaceMuted, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 12px', marginBottom: 24, fontFamily: mono, fontSize: 12, color: colors.textFaint }}>waseet.io/projects/marina-heights-x9</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280, margin: '0 auto' }}>
            <HoverBtn onClick={() => navigate('/')} base={{ height: 40, borderRadius: 8, border: 'none', background: colors.green, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} hover={{ background: colors.greenDark }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
              Go to Homepage
            </HoverBtn>
            <HoverBtn onClick={() => navigate(-1)} base={{ height: 40, borderRadius: 8, border: `1px solid ${colors.border}`, background: '#fff', color: colors.textMuted, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }} hover={{ background: colors.surfaceAlt }}>← Go back</HoverBtn>
          </div>
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${colors.surfaceMuted}` }}>
            <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 10 }}>Looking for something specific?</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {quickLinks.map(([label, to]) => (
                <HoverSpan key={label} onClick={() => navigate(to)} base={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }} hover={{ textDecoration: 'underline' }}>{label}</HoverSpan>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ flexShrink: 0, background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: colors.textFaint }}>© 2026 Waseet</span>
        <span style={{ fontSize: 12, color: colors.greenDark }}>support@waseet.io</span>
      </div>
    </div>
  )
}

/* =========================================================================
   MAINTENANCE MODE (live)
   ========================================================================= */
const gearPath = 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'
const refreshPaths = ['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5']

function pad(n) {
  return String(n).padStart(2, '0')
}

export function MaintenancePage() {
  const navigate = useNavigate()
  const [info, setInfo] = useState(null)
  const [cd, setCd] = useState(0)

  // poll platform status: if maintenance is off, the platform is back → go home
  useEffect(() => {
    let alive = true
    const check = async () => {
      try {
        const s = await statusApi.get()
        if (!alive) return
        if (!s?.maintenance) { navigate('/', { replace: true }); return }
        setInfo(s.info || {})
      } catch { /* keep showing the page */ }
    }
    check()
    const poll = setInterval(check, 60000) // auto-refresh every 60s
    return () => { alive = false; clearInterval(poll) }
  }, [navigate])

  // countdown ticks toward expectedBack
  useEffect(() => {
    const tick = () => {
      if (!info?.expectedBack) { setCd(0); return }
      const secs = Math.max(0, Math.floor((new Date(info.expectedBack).getTime() - Date.now()) / 1000))
      setCd(secs)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [info])

  const etaMinutes = info?.etaMinutes ?? 30
  const items = info?.items || []
  const message = info?.message || "We're performing scheduled maintenance to improve your experience. The platform will be back shortly."

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: colors.bg, fontFamily: 'Inter, sans-serif', color: colors.ink }}>
      {/* TOP BAR */}
      <div style={{ height: 56, flexShrink: 0, background: '#fff', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginLeft: 6 }}>waseet</span>
          <span style={{ fontSize: 11, color: colors.textFaint, marginLeft: 6 }}>وسيط</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.textFaint, marginRight: 6 }}>Need help?</span>
          <a href="mailto:support@waseet.io" style={{ fontSize: 12, color: colors.greenDark, textDecoration: 'none' }}>support@waseet.io</a>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          {/* animated illustration */}
          <div style={{ height: 120, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, background: colors.surfaceMuted, border: `2px solid ${colors.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'ws-spin 4s linear infinite' }}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={gearPath} /><circle cx="12" cy="12" r="3" /></svg>
            </div>
            <div style={{ position: 'absolute', bottom: 8, left: 'calc(50% - 120px)', width: 32, height: 32, background: colors.bg, border: `2px solid ${colors.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'ws-spin-rev 2s linear infinite' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={gearPath} /><circle cx="12" cy="12" r="3" /></svg>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 'calc(50% + 70px)', width: 40, height: 40, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
            </div>
          </div>

          {/* status pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
            <span style={{ position: 'relative', width: 8, height: 8 }}><span style={{ position: 'absolute', inset: 0, background: colors.amber, borderRadius: '50%', animation: 'ws-pulse 1.5s ease-in-out infinite' }} /></span>
            <span style={{ fontSize: 12, fontWeight: 500, color: colors.amberText }}>Scheduled maintenance in progress</span>
          </div>

          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10 }}>Waseet is being updated</div>
          <div style={{ fontSize: 14, color: colors.textSoft, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>{message}</div>

          {/* estimated time card */}
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', textAlign: 'left', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${colors.surfaceMuted}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg><span style={{ fontSize: 13, color: colors.textMuted }}>Estimated completion</span></div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>~{etaMinutes} minutes</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${colors.surfaceMuted}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></svg><span style={{ fontSize: 13, color: colors.textMuted }}>Started at</span></div>
              <span style={{ fontSize: 13, color: colors.ink }}>{fmtDateTime(info?.startedAt)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg><span style={{ fontSize: 13, color: colors.textMuted }}>Expected back</span></div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{fmtDateTime(info?.expectedBack)}</span>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}`, display: 'flex', gap: 6, alignItems: 'center' }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              <span style={{ fontSize: 11, color: colors.textFaint }}>Asia/Riyadh timezone (UTC+3)</span>
            </div>
          </div>

          {/* countdown */}
          <div style={{ background: colors.ink, borderRadius: 12, padding: '18px 24px', display: 'inline-block', minWidth: 280, marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, textAlign: 'center' }}>Back in approximately</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px', borderRight: '1px solid rgba(255,255,255,.1)' }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: mono, letterSpacing: '-0.02em' }}>{pad(Math.floor(cd / 3600))}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 4 }}>Hrs</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px', borderRight: '1px solid rgba(255,255,255,.1)' }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: mono, letterSpacing: '-0.02em' }}>{pad(Math.floor((cd % 3600) / 60))}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 4 }}>Min</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px' }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: mono, letterSpacing: '-0.02em' }}>{pad(cd % 60)}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 4 }}>Sec</span>
              </div>
            </div>
          </div>

          {/* what we're doing */}
          {items.length > 0 && (
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', textAlign: 'left', marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 12 }}>What's being updated:</div>
            {items.map((it, i) => {
              const st = it.status || 'pending'
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: i < items.length - 1 ? 8 : 0 }}>
                  {st === 'done' ? (
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                  ) : st === 'active' ? (
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, animation: 'ws-spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  ) : (
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /></svg>
                  )}
                  <span style={{ fontSize: 13, ...(st === 'done' ? { color: colors.textMuted, textDecoration: 'line-through', opacity: 0.6 } : st === 'active' ? { fontWeight: 500, color: colors.ink } : { color: colors.textFaint }) }}>{it.label}</span>
                </div>
              )
            })}
          </div>
          )}

          {/* auto-refresh notice */}
          <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left', marginBottom: 20 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{refreshPaths.map((d, i) => <path key={i} d={d} />)}</svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.greenDark, marginBottom: 2 }}>Auto-refresh enabled</div>
              <div style={{ fontSize: 11, color: colors.greenDark, lineHeight: 1.5 }}>This page will automatically refresh every 60 seconds to check status.</div>
            </div>
          </div>

          <HoverBtn onClick={() => window.location.reload()} base={{ height: 40, padding: '0 20px', borderRadius: 8, border: `1px solid ${colors.border}`, background: '#fff', color: colors.textMuted, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }} hover={{ background: colors.surfaceAlt }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">{refreshPaths.map((d, i) => <path key={i} d={d} />)}</svg>
            Check again
          </HoverBtn>

          {/* contact + social */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              <a href="mailto:support@waseet.io" style={{ fontSize: 12, color: colors.greenDark, textDecoration: 'none' }}>support@waseet.io</a>
            </div>
            <div style={{ width: 1, height: 14, background: colors.border }} />
            <span style={{ fontSize: 12, color: colors.textFaint }}>Follow for updates:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill={colors.textFaint}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              <span style={{ fontSize: 12, color: colors.textMuted }}>@waseet_io</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ flexShrink: 0, background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: colors.textFaint }}>© 2026 Waseet</span>
        <span style={{ fontSize: 12, color: colors.textFaint }}>Maintenance by Waseet Engineering</span>
        <span style={{ fontSize: 12, color: colors.textFaint }}>waseet.io</span>
      </div>
    </div>
  )
}
