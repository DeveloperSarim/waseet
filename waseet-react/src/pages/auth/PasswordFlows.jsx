import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '../../lib/api'
import { colors } from '../../theme/tokens'

const input = { width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }
const fieldLabel = { fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }
const title = { fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center' }
const subtitle = { fontSize: 13, color: colors.textSoft, textAlign: 'center', lineHeight: 1.6 }
const lockPath = 'M7 11V7a5 5 0 0 1 10 0v4'
const mailPath = 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6'
const checkIcon = 'M20 6L9 17l-5-5'
const xIcon = 'M18 6L6 18M6 6l12 12'
const stColors = ['#DC2626', '#F97316', '#EAB308', '#16A34A']
const stLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

function Shell({ banner, children }) {
  return (
    <div className="wa-form" style={{ fontFamily: 'Inter, sans-serif', color: colors.ink, background: colors.bg, minHeight: '100vh' }}>
      {banner}
      <div style={{ minHeight: banner ? 'calc(100vh - 41px)' : '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px 40px' }}>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '32px 36px', maxWidth: 400, width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function IconCircle({ bg, bd, stroke, children }) {
  return (
    <div style={{ width: 56, height: 56, borderRadius: '50%', background: bg, border: `1px solid ${bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.8}>{children}</svg>
    </div>
  )
}

function LockLeft() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d={lockPath} /></svg>
}

function usePassword() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [hidden, setHidden] = useState(true)
  const checks = [
    { ok: pw.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(pw), label: 'One uppercase letter' },
    { ok: /[0-9]/.test(pw), label: 'One number' },
    { ok: /[!@#$%^&*(),.?":{}|<>]/.test(pw), label: 'One special character (!@#$%)' },
  ]
  const n = checks.filter((c) => c.ok).length
  const canSubmit = n === 4 && pw.length > 0 && pw === pw2
  return { pw, setPw, pw2, setPw2, hidden, setHidden, checks, n, canSubmit }
}

function Strength({ n }) {
  const color = n === 0 ? colors.textFaint : stColors[n - 1]
  return (
    <>
      <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
        {[0, 1, 2, 3].map((i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i < n ? color : colors.border, transition: 'background 200ms' }} />)}
      </div>
      <div style={{ fontSize: 13, textAlign: 'right', marginTop: 4, color }}>{stLabels[n]}</div>
    </>
  )
}

function Rules({ checks }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
      {checks.map((c) => (
        <div key={c.label} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c.ok ? colors.green : colors.borderStrong} strokeWidth={2}>{c.ok ? <path d={checkIcon} /> : <circle cx="12" cy="12" r="10" />}</svg>
          <span style={{ fontSize: 11, color: colors.textSoft }}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

function PwField({ value, onChange, hidden, onToggle, placeholder }) {
  const eyePath = hidden ? 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z' : 'M17.94 17.94A10 10 0 0 1 12 19c-7 0-11-7-11-7a18 18 0 0 1 5-5.94M1 1l22 22'
  return (
    <div style={{ position: 'relative' }}>
      <LockLeft />
      <input value={value} onChange={onChange} type={hidden ? 'password' : 'text'} placeholder={placeholder} style={{ ...input, padding: '0 32px' }} />
      <span onClick={onToggle} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}><path d={eyePath} />{hidden && <circle cx="12" cy="12" r="3" />}</svg>
      </span>
    </div>
  )
}

function ConfirmField({ value, onChange, showIcon, matching }) {
  return (
    <div style={{ position: 'relative' }}>
      <LockLeft />
      <input value={value} onChange={onChange} type="password" placeholder="Re-enter password" style={{ ...input, padding: '0 32px' }} />
      {showIcon && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={matching ? colors.green : colors.red} strokeWidth={2} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}><path d={matching ? checkIcon : xIcon} /></svg>}
    </div>
  )
}

const primaryBtn = (enabled) => ({ width: '100%', height: 34, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', background: enabled ? colors.green : colors.textFaint, cursor: enabled ? 'pointer' : 'not-allowed' })

/* ---------- FORGOT ---------- */
function ForgotFlow() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [devToken, setDevToken] = useState(null)

  const send = async () => {
    if (!email.trim() || sending) return
    setSending(true)
    try {
      const res = await authApi.forgotPassword(email.trim())
      setDevToken(res?.devToken || null) // dev-only: reset link shortcut
      setDone(true)
    } catch {
      // backend responds 200 regardless; only network errors land here
      setDone(true)
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <Shell>
        <IconCircle bg={colors.greenTint} bd={colors.greenTintBorder} stroke={colors.green}><path d={checkIcon} strokeWidth={2} /></IconCircle>
        <div style={{ ...title, marginBottom: 8 }}>Check your email</div>
        <div style={{ ...subtitle, marginBottom: 20 }}>If this email is registered on Waseet, you'll receive a reset link shortly.</div>
        <div style={{ textAlign: 'center', marginBottom: 20 }}><div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 3 }}>Sent to:</div><div style={{ fontSize: 13, fontWeight: 600 }}>{email}</div></div>
        <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '8px 12px', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth={1.9} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          <span style={{ fontSize: 12, color: '#92400E' }}>The reset link expires in 15 minutes.</span>
        </div>
        {devToken && (
          <button onClick={() => navigate(`/reset-password?token=${devToken}`)} style={{ width: '100%', height: 34, marginBottom: 16, background: colors.ink, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>
            Dev: open reset link →
          </button>
        )}
        <div style={{ borderTop: `1px solid ${colors.surfaceMuted}`, paddingTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 6 }}>Didn't receive it?</div>
          <div onClick={send} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer', marginBottom: 6 }}>Resend reset link</div>
          <div style={{ fontSize: 12, color: colors.textFaint }}>Check your spam folder · Try a different email</div>
        </div>
        <Link to="/login" style={{ display: 'block', textDecoration: 'none' }}><button style={{ width: '100%', height: 34, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', marginTop: 16 }}>Back to Login</button></Link>
      </Shell>
    )
  }

  return (
    <Shell>
      <Link to="/login" style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20, color: colors.textFaint, textDecoration: 'none' }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg><span style={{ fontSize: 12 }}>Back to login</span>
      </Link>
      <IconCircle bg={colors.greenTint} bd={colors.greenTintBorder} stroke={colors.green}><path d={mailPath} /></IconCircle>
      <div style={{ ...title, marginBottom: 4 }}>Forgot your password?</div>
      <div style={{ ...subtitle, marginBottom: 24 }}>Enter your registered email address and we'll send you a reset link.</div>
      <div style={{ marginBottom: 16 }}>
        <div style={fieldLabel}>Email address</div>
        <div style={{ position: 'relative' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><path d={mailPath} /></svg>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={{ ...input, padding: '0 10px 0 32px' }} />
        </div>
      </div>
      <button onClick={send} style={{ ...primaryBtn(true), fontWeight: 500 }}>{sending ? 'Sending…' : 'Send Reset Link'}</button>
      <div style={{ textAlign: 'center', marginTop: 14 }}><span style={{ fontSize: 12, color: colors.textFaint }}>Remembered it? </span><Link to="/login" style={{ fontSize: 12, color: colors.greenDark, textDecoration: 'none' }}>Sign in →</Link></div>
    </Shell>
  )
}

/* ---------- RESET ---------- */
function ResetFlow() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')
  const p = usePassword()
  const [done, setDone] = useState(false)
  const [expired, setExpired] = useState(params.get('expired') === '1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!done) return
    if (countdown <= 0) { navigate('/login'); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [done, countdown, navigate])

  const doReset = async () => {
    if (!p.canSubmit || submitting) return
    setError(''); setSubmitting(true)
    try {
      await authApi.resetPassword(token, p.pw)
      setDone(true)
    } catch (err) {
      if (err.status === 400) setExpired(true) // invalid/expired token
      else setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if ((expired || !token) && !done) {
    return (
      <Shell>
        <IconCircle bg={colors.redTint} bd={colors.redTintBorder} stroke={colors.red}><circle cx="12" cy="12" r="9" /><path d="M12 7v5M15 15l-3-3M16 8l-8 8" /></IconCircle>
        <div style={{ ...title, marginBottom: 8 }}>Link expired</div>
        <div style={{ ...subtitle, marginBottom: 20 }}>This reset link has expired or has already been used. Reset links are valid for 15 minutes.</div>
        <Link to="/forgot-password" style={{ display: 'block', textDecoration: 'none' }}><button style={primaryBtn(true)}>Request New Reset Link</button></Link>
        <Link to="/login" style={{ display: 'block', fontSize: 12, color: colors.greenDark, textAlign: 'center', marginTop: 12, textDecoration: 'none' }}>Back to Login</Link>
      </Shell>
    )
  }

  if (done) {
    return (
      <Shell>
        <IconCircle bg={colors.greenTint} bd={colors.greenTintBorder} stroke={colors.green}><path d={checkIcon} strokeWidth={2} /></IconCircle>
        <div style={{ ...title, marginBottom: 8 }}>Password reset!</div>
        <div style={{ ...subtitle, marginBottom: 20 }}>Your password has been updated. All other devices have been signed out.</div>
        <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 2 }}>Redirecting to login in</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{countdown}</div>
        </div>
        <button onClick={() => navigate('/login')} style={primaryBtn(true)}>Go to Login →</button>
      </Shell>
    )
  }

  const hasPw2 = p.pw2.length > 0
  const matching = hasPw2 && p.pw === p.pw2
  return (
    <Shell>
      <IconCircle bg={colors.greenTint} bd={colors.greenTintBorder} stroke={colors.green}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></IconCircle>
      <div style={{ ...title, marginBottom: 4 }}>Set new password</div>
      <div style={{ ...subtitle, marginBottom: 24 }}>Choose a strong password for your Waseet account.</div>
      <div style={{ marginBottom: 4 }}>
        <div style={fieldLabel}>New password</div>
        <PwField value={p.pw} onChange={(e) => p.setPw(e.target.value)} hidden={p.hidden} onToggle={() => p.setHidden(!p.hidden)} placeholder="Enter new password" />
        <Strength n={p.n} />
        <Rules checks={p.checks} />
      </div>
      <div style={{ margin: '16px 0' }}>
        <div style={fieldLabel}>Confirm new password</div>
        <ConfirmField value={p.pw2} onChange={(e) => p.setPw2(e.target.value)} showIcon={hasPw2} matching={matching} />
        {hasPw2 && <div style={{ fontSize: 11, marginTop: 4, color: matching ? colors.green : colors.red }}>{matching ? 'Passwords match' : "Passwords don't match"}</div>}
      </div>
      {error && (
        <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 7, padding: '8px 10px', marginBottom: 10, fontSize: 12, color: colors.red }}>{error}</div>
      )}
      <button onClick={doReset} disabled={!p.canSubmit || submitting} style={primaryBtn(p.canSubmit && !submitting)}>{submitting ? 'Resetting…' : 'Reset Password'}</button>
    </Shell>
  )
}

/* ---------- FORCED CHANGE ---------- */
function ForcedFlow() {
  const navigate = useNavigate()
  const p = usePassword()
  const [temp, setTemp] = useState('')
  const canSubmit = p.canSubmit && temp.length > 0
  const hasPw2 = p.pw2.length > 0
  const matching = hasPw2 && p.pw === p.pw2

  const banner = (
    <div style={{ background: colors.amberTint, borderBottom: `1px solid ${colors.amberTintBorder}`, padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center' }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth={1.9}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
      <span style={{ fontSize: 13, color: '#92400E' }}>Security: Please set a personal password before accessing your account.</span>
    </div>
  )

  return (
    <Shell banner={banner}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 20 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8}><path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" /><circle cx="12" cy="11" r="2.4" /></svg>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>waseet</span>
      </div>
      <IconCircle bg={colors.amberTint} bd={colors.amberTintBorder} stroke={colors.amber}><rect x="3" y="11" width="18" height="11" rx="2" /><path d={lockPath} /></IconCircle>
      <div style={{ ...title, marginBottom: 4 }}>Set your password</div>
      <div style={{ ...subtitle, marginBottom: 24 }}>Your temporary password must be changed before you can access Waseet.</div>
      <div style={{ marginBottom: 12 }}>
        <div style={fieldLabel}>Temporary password (from email)</div>
        <div style={{ position: 'relative' }}><LockLeft /><input value={temp} onChange={(e) => setTemp(e.target.value)} type="password" placeholder="Temporary password" style={{ ...input, padding: '0 32px' }} /></div>
        <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>This is the password we emailed you</div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={fieldLabel}>New password</div>
        <PwField value={p.pw} onChange={(e) => p.setPw(e.target.value)} hidden={p.hidden} onToggle={() => p.setHidden(!p.hidden)} placeholder="Enter new password" />
        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>{[0, 1, 2, 3].map((i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i < p.n ? (p.n === 0 ? colors.textFaint : stColors[p.n - 1]) : colors.border }} />)}</div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={fieldLabel}>Confirm new password</div>
        <div style={{ position: 'relative' }}><LockLeft /><input value={p.pw2} onChange={(e) => p.setPw2(e.target.value)} type="password" placeholder="Re-enter password" style={{ ...input, padding: '0 32px' }} /></div>
        {hasPw2 && <div style={{ fontSize: 11, marginTop: 4, color: matching ? colors.green : colors.red }}>{matching ? 'Passwords match' : "Passwords don't match"}</div>}
      </div>
      <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>Your new password must have:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {p.checks.map((c) => (
            <div key={c.label} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c.ok ? colors.green : colors.borderStrong} strokeWidth={2}>{c.ok ? <path d={checkIcon} /> : <circle cx="12" cy="12" r="10" />}</svg>
              <span style={{ fontSize: 11, color: colors.textSoft }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => canSubmit && navigate('/admin')} disabled={!canSubmit} style={{ ...primaryBtn(canSubmit), height: 36, borderRadius: 8 }}>Set Password &amp; Continue →</button>
      <div style={{ fontSize: 11, color: colors.textFaint, textAlign: 'center', marginTop: 12 }}>Cannot skip this step.</div>
    </Shell>
  )
}

export default function PasswordFlows({ flow = 'forgot' }) {
  if (flow === 'forced') return <ForcedFlow />
  if (flow === 'reset') return <ResetFlow />
  return <ForgotFlow />
}
