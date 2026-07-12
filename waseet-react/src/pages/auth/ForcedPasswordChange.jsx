import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'

const SPECIAL = /[!@#$%^&*(),.?":{}|<>]/
const segColors = { 1: '#DC2626', 2: '#F97316', 3: '#EAB308', 4: '#16A34A' }
const strengthMap = { 1: { label: 'Weak', color: '#DC2626' }, 2: { label: 'Fair', color: '#F97316' }, 3: { label: 'Good', color: '#EAB308' }, 4: { label: 'Strong', color: '#16A34A' } }

function scoreOf(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (SPECIAL.test(pw)) s++
  return s
}

function RuleIcon({ state, color }) {
  if (state === 'check')
    return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="16 10 11 15 8 12" /></svg>
  if (state === 'x')
    return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><circle cx="12" cy="12" r="9" /></svg>
}

function EyeBtn({ visible, onClick }) {
  return (
    <button onClick={onClick} type="button" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
      {visible ? (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
      ) : (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
      )}
    </button>
  )
}

function LockLeft() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
}

const inputBase = { width: '100%', height: 34, borderRadius: 7, padding: '0 40px 0 36px', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', color: colors.ink, background: '#fff' }

export default function ForcedPasswordChange() {
  const navigate = useNavigate()
  const [temp, setTemp] = useState('')
  const [np, setNp] = useState('')
  const [cp, setCp] = useState('')
  const [tempType, setTempType] = useState('password')
  const [npType, setNpType] = useState('password')
  const [cpType, setCpType] = useState('password')
  const [cpTouched, setCpTouched] = useState(false)
  const [sameError, setSameError] = useState(false)
  const [phase, setPhase] = useState('form') // form | loading | success
  const [countdown, setCountdown] = useState(3)
  const [progressWidth, setProgressWidth] = useState('0%')
  const iv = useRef(null)

  useEffect(() => () => clearInterval(iv.current), [])

  const ruleDefs = [
    { test: np.length >= 8, text: 'At least 8 characters' },
    { test: /[A-Z]/.test(np), text: 'One uppercase letter (A-Z)' },
    { test: /[0-9]/.test(np), text: 'One number (0-9)' },
    { test: SPECIAL.test(np), text: 'One special character (!@#$%)' },
  ]
  const allRules = ruleDefs.every((r) => r.test)
  const score = scoreOf(np)
  const sm = strengthMap[score] || { label: 'Weak', color: '#DC2626' }
  const sc = segColors[score] || colors.border

  const match = cp.length > 0 && np === cp
  const mismatch = cpTouched && cp.length > 0 && np !== cp

  const npBorder = sameError ? colors.red : colors.border
  let cpBorder = colors.border
  if (mismatch) cpBorder = colors.red
  else if (match) cpBorder = colors.green

  const isLoading = phase === 'loading'
  const isSuccess = phase === 'success'
  const canSubmit = allRules && match && temp.length > 0 && temp !== np
  const submitEnabled = canSubmit && !isLoading

  const startSuccess = () => {
    setPhase('success')
    setCountdown(3)
    setProgressWidth('0%')
    requestAnimationFrame(() => setProgressWidth('100%'))
    iv.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(iv.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const onSubmit = () => {
    if (!submitEnabled) return
    if (temp === np && np) {
      setSameError(true)
      return
    }
    setPhase('loading')
    setTimeout(startSuccess, 1200)
  }

  const banner = isSuccess ? (
    <div style={{ background: colors.greenTint, borderBottom: `1px solid ${colors.greenTintBorder}`, padding: '10px 24px', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
      <span style={{ fontSize: 13, color: colors.greenDark }}>Password set successfully. Your account is now secured.</span>
    </div>
  ) : (
    <div style={{ background: colors.amberTint, borderBottom: `1px solid ${colors.amberTintBorder}`, padding: '10px 24px', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
      <span style={{ fontSize: 13, color: colors.amberText }}>Security required: Set a personal password before accessing your Waseet account.</span>
      <span style={{ fontSize: 12, color: colors.amber, fontWeight: 500, marginLeft: 'auto' }}>Cannot skip this step.</span>
    </div>
  )

  const stepBadge = (n, active) => (
    <div style={{ width: 20, height: 20, borderRadius: 999, background: active ? colors.ink : '#fff', border: active ? 'none' : `1px solid ${colors.borderStrong}`, color: active ? '#fff' : colors.textFaint, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
  )

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', color: colors.ink }}>
      {/* NAVBAR */}
      <div style={{ height: 56, background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.greenDark} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ alignSelf: 'center' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>waseet</span>
          <span style={{ fontSize: 11, color: colors.textFaint }}>وسيط</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 12, color: colors.textFaint }}>Need help?</span>
          <span style={{ fontSize: 12, color: colors.greenDark, fontWeight: 500 }}>support@waseet.io</span>
        </div>
      </div>

      {banner}

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 24px' }}>
        {!isSuccess ? (
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '32px 36px', maxWidth: 440, width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {/* icon */}
            <div style={{ width: 56, height: 56, borderRadius: 999, background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.ink, textAlign: 'center', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Set your password</h1>
            <p style={{ fontSize: 13, color: colors.textSoft, textAlign: 'center', margin: '0 0 28px', lineHeight: 1.6 }}>Your account was created with a temporary password. Set a personal one now to secure your Waseet account.</p>

            {/* TEMP */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Temporary password *</label>
              <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>(sent to your email when account was approved)</div>
              <div style={{ position: 'relative' }}>
                <LockLeft />
                <input type={tempType} value={temp} onInput={(e) => setTemp(e.target.value)} placeholder="Enter temporary password" style={{ ...inputBase, border: `1px solid ${colors.border}` }} />
                <EyeBtn visible={tempType === 'text'} onClick={() => setTempType(tempType === 'password' ? 'text' : 'password')} />
              </div>
            </div>

            <div style={{ height: 1, background: colors.surfaceMuted, margin: '16px 0' }} />

            {/* NEW */}
            <div style={{ marginBottom: 4 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>New password *</label>
              <div style={{ position: 'relative' }}>
                <LockLeft />
                <input type={npType} value={np} onInput={(e) => { setNp(e.target.value); setSameError(false) }} placeholder="Enter new password" style={{ ...inputBase, border: `1px solid ${npBorder}` }} />
                <EyeBtn visible={npType === 'text'} onClick={() => setNpType(npType === 'password' ? 'text' : 'password')} />
              </div>
              {np.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                    {[1, 2, 3, 4].map((i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: score >= i ? sc : colors.border, transition: 'background 200ms' }} />)}
                  </div>
                  <div style={{ fontSize: 10, marginTop: 4, textAlign: 'right', color: sm.color, fontWeight: 600 }}>{sm.label}</div>
                </div>
              )}
            </div>

            {/* RULES */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 12px', marginBottom: 14, marginTop: 8 }}>
              {ruleDefs.map((r) => (
                <div key={r.text} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ display: 'flex', flexShrink: 0 }}>
                    <RuleIcon state={np ? (r.test ? 'check' : 'x') : 'circle'} color={np ? (r.test ? colors.green : colors.red) : colors.borderStrong} />
                  </span>
                  <span style={{ fontSize: 11, color: colors.textSoft }}>{r.text}</span>
                </div>
              ))}
            </div>

            {/* CONFIRM */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Confirm new password *</label>
              <div style={{ position: 'relative' }}>
                <LockLeft />
                <input type={cpType} value={cp} onInput={(e) => { setCp(e.target.value); setCpTouched(true) }} placeholder="Re-enter new password" style={{ ...inputBase, border: `1px solid ${cpBorder}` }} />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  {cp.length > 0 && <RuleIcon state={match ? 'check' : 'x'} color={match ? colors.green : colors.red} />}
                </span>
              </div>
              {mismatch && <div style={{ fontSize: 11, color: colors.red, marginTop: 4 }}>Passwords don't match</div>}
            </div>

            {/* SAME AS TEMP ERROR */}
            {sameError && (
              <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 7, padding: '8px 10px', marginTop: 8, marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                <span style={{ fontSize: 12, color: colors.red }}>New password cannot be the same as your temporary password.</span>
              </div>
            )}

            {/* reuse note */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 12, marginBottom: 18 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <span style={{ fontSize: 11, color: colors.textFaint }}>New password cannot be the same as your temporary password.</span>
            </div>

            {/* SUBMIT */}
            <button onClick={onSubmit} disabled={!submitEnabled} title={submitEnabled ? '' : 'Complete all requirements above'} style={{ width: '100%', height: 38, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', background: submitEnabled ? colors.green : colors.textFaint, cursor: submitEnabled ? 'pointer' : 'not-allowed', opacity: isLoading ? 0.8 : 1 }}>
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: 999, display: 'inline-block', animation: 'ws-spin 0.7s linear infinite' }} />
                  Setting password...
                </span>
              ) : (
                'Set Password & Enter Waseet →'
              )}
            </button>

            {/* PROGRESS STEPS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {stepBadge('1', true)}
                <span style={{ fontSize: 11, color: colors.ink, fontWeight: 500 }}>Set password</span>
              </div>
              <span style={{ color: colors.borderStrong, fontSize: 12 }}>→</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {stepBadge('2', false)}
                <span style={{ fontSize: 11, color: colors.textFaint }}>Enter Waseet</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 36, maxWidth: 440, width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'wsk-pop 400ms ease-out' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>Password set! Welcome to Waseet 🎉</h1>
            <p style={{ fontSize: 13, color: colors.textSoft, margin: '0 0 24px', lineHeight: 1.6 }}>Your account is secured. You're being redirected to your dashboard.</p>

            <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 4 }}>Taking you to dashboard in</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.ink, letterSpacing: '-0.02em' }}>{countdown}</div>
            </div>

            <div style={{ height: 3, background: colors.surfaceMuted, borderRadius: 999, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ height: '100%', background: colors.green, borderRadius: 999, width: progressWidth, transition: 'width 1s linear' }} />
            </div>

            <button onClick={() => navigate('/realtor')} style={{ width: '100%', height: 38, background: colors.green, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Go to Dashboard →</button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, background: colors.green, color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                <span style={{ fontSize: 11, color: colors.green, fontWeight: 500 }}>Set password</span>
              </div>
              <span style={{ color: colors.greenTintBorder, fontSize: 12 }}>→</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, background: colors.green, color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                <span style={{ fontSize: 11, color: colors.green, fontWeight: 500 }}>Enter Waseet</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
