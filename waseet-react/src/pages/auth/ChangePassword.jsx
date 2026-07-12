import React, { useState, useEffect, useRef } from 'react'
import { colors } from '../../theme/tokens'
import { authApi } from '../../lib/api'

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

const inputBase = { width: '100%', height: 34, borderRadius: 7, padding: '0 40px 0 36px', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', color: colors.ink }

const navMainDefs = [
  { label: 'Dashboard', d: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 9h8V3h-8z' },
  { label: 'Browse Projects', d: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4-4' },
  { label: 'My Leads', d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
  { label: 'Commissions', d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1.1 1.5-2.5 1.5-2.5.5-2.5 1.5 1.1 1.5 2.5 1.5 2.5-.5 2.5-1.5' },
  { label: 'Saved Projects', d: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' },
]
const navAcctDefs = [
  { label: 'My Profile', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 12 0v1', active: false },
  { label: 'Notifications', d: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0', active: false },
  { label: 'Settings', d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0 1.6 1.6 0 0 0-2.7-1.1 2 2 0 1 1-2.8-2.8 1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1 2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8 1.6 1.6 0 0 0 2.7-1.1 2 2 0 1 1 4 0 1.6 1.6 0 0 0 2.7 1.1 2 2 0 1 1 2.8 2.8 1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1 2 2 0 1 1 0 4 1.6 1.6 0 0 0-1.5 1z', active: true },
]
const settingsDefs = [
  { label: 'Profile', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 12 0v1', active: false },
  { label: 'Change Password', d: 'M3 11h18v10H3zM7 11V7a5 5 0 0 1 10 0v4', active: true },
  { label: 'Notifications', d: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0', active: false },
  { label: 'Bank Details', d: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3', active: false },
  { label: 'Security', d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', active: false },
]
const tips = [
  'Use a unique password not used on any other website',
  'Mix uppercase, lowercase, numbers and symbols for maximum security',
  'Consider using a password manager to store passwords safely',
  'Never share your password with anyone, including Waseet support',
]

function SideNavItem({ label, d, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, marginBottom: 1, cursor: 'pointer', ...(active ? { background: colors.greenTint, color: colors.greenDark, fontWeight: 600 } : { color: colors.textMuted }) }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={active ? colors.green : colors.textFaint} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
      <span style={{ flex: 1 }}>{label}</span>
    </div>
  )
}

export default function ChangePassword({ embed = false }) {
  const [cur, setCur] = useState('')
  const [np, setNp] = useState('')
  const [cp, setCp] = useState('')
  const [curType, setCurType] = useState('password')
  const [npType, setNpType] = useState('password')
  const [cpType, setCpType] = useState('password')
  const [cpTouched, setCpTouched] = useState(false)
  const [signOut, setSignOut] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [phase, setPhase] = useState('form') // form | loading | success
  const [successHadSignOut, setSuccessHadSignOut] = useState(false)
  const [err, setErr] = useState('')
  const toastT = useRef(null)

  useEffect(() => () => clearTimeout(toastT.current), [])

  const ruleDefs = [
    { test: np.length >= 8, text: 'At least 8 characters' },
    { test: /[A-Z]/.test(np), text: 'One uppercase (A-Z)' },
    { test: /[0-9]/.test(np), text: 'One number (0-9)' },
    { test: SPECIAL.test(np), text: 'One special character' },
  ]
  const allRules = ruleDefs.every((r) => r.test)
  const score = scoreOf(np)
  const sm = strengthMap[score] || { label: 'Weak', color: '#DC2626' }
  const sc = segColors[score] || colors.border

  const match = cp.length > 0 && np === cp
  const mismatch = cpTouched && cp.length > 0 && np !== cp
  const showSameAsCur = cur.length > 0 && np.length > 0 && cur === np

  const isLoading = phase === 'loading'
  const isSuccess = phase === 'success'
  const inputsDisabled = isLoading

  const curBorder = colors.border
  const npBorder = showSameAsCur ? colors.red : colors.border
  let cpBorder = colors.border
  if (mismatch) cpBorder = colors.red
  else if (match) cpBorder = colors.green

  const canSubmit = allRules && match && cur.length > 0 && cur !== np
  const submitEnabled = canSubmit && !isLoading

  const armToast = () => {
    clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setShowToast(false), 4000)
  }
  const runUpdate = async (had) => {
    setPhase('loading')
    setShowModal(false)
    setErr('')
    try {
      await authApi.changePassword(cur, np)
      setPhase('success')
      setSuccessHadSignOut(had)
      setShowToast(true)
      armToast()
      setCur(''); setNp(''); setCp(''); setCpTouched(false)
    } catch (e) {
      setErr(e.message || 'Could not change password. Please try again.')
      setPhase('form')
    }
  }
  const onSubmit = () => {
    if (!submitEnabled) return
    if (signOut) {
      setShowModal(true)
      return
    }
    runUpdate(false)
  }

  const successMsg = successHadSignOut
    ? 'Your new password is active. All other devices have been signed out.'
    : 'Your new password is active.'

  const rightContent = isSuccess ? (
    <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '18px 20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'wsk-pop 400ms ease-out' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>Password updated!</div>
      <div style={{ fontSize: 13, color: colors.textSoft, marginBottom: 16, lineHeight: 1.5 }}>{successMsg}</div>
      <button onClick={() => setPhase('form')} style={{ width: '100%', height: 34, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, fontWeight: 500, color: colors.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>Back to Settings</button>
    </div>
  ) : (
    <>
      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 14 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.ink, marginBottom: 4 }}>Change password</div>
          <div style={{ fontSize: 12, color: colors.textFaint }}>Choose a strong password to keep your account secure.</div>
        </div>

        {/* CURRENT */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Current password *</label>
          <div style={{ position: 'relative' }}>
            <LockLeft />
            <input type={curType} value={cur} onInput={(e) => setCur(e.target.value)} disabled={inputsDisabled} placeholder="Enter current password" style={{ ...inputBase, border: `1px solid ${curBorder}`, background: '#fff', opacity: isLoading ? 0.7 : 1 }} />
            <EyeBtn visible={curType === 'text'} onClick={() => setCurType(curType === 'password' ? 'text' : 'password')} />
          </div>
          <div style={{ fontSize: 12, color: colors.greenDark, marginTop: 6, cursor: 'pointer', display: 'inline-block' }}>Forgot your password?</div>
        </div>

        <div style={{ height: 1, background: colors.surfaceMuted, marginBottom: 16 }} />

        {/* NEW */}
        <div style={{ marginBottom: 4 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>New password *</label>
          <div style={{ position: 'relative' }}>
            <LockLeft />
            <input type={npType} value={np} onInput={(e) => setNp(e.target.value)} disabled={inputsDisabled} placeholder="Enter new password" style={{ ...inputBase, border: `1px solid ${npBorder}`, background: '#fff', opacity: isLoading ? 0.7 : 1 }} />
            <EyeBtn visible={npType === 'text'} onClick={() => setNpType(npType === 'password' ? 'text' : 'password')} />
          </div>
          {showSameAsCur && <div style={{ fontSize: 11, color: colors.red, marginTop: 4 }}>New password must be different from your current password.</div>}
        </div>

        {/* strength */}
        {np.length > 0 && (
          <div style={{ marginBottom: 6, marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[1, 2, 3, 4].map((i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: score >= i ? sc : colors.border, transition: 'background 200ms' }} />)}
            </div>
            <div style={{ fontSize: 10, marginTop: 3, textAlign: 'right', color: sm.color, fontWeight: 600 }}>{sm.label}</div>
          </div>
        )}

        {/* rules */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 16, marginTop: 8 }}>
          {ruleDefs.map((r) => (
            <div key={r.text} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ display: 'flex', flexShrink: 0 }}>
                <RuleIcon state={np ? (r.test ? 'check' : 'x') : 'circle'} color={np ? (r.test ? colors.green : colors.red) : colors.borderStrong} />
              </span>
              <span style={{ fontSize: 11, color: np ? (r.test ? colors.ink : colors.textSoft) : colors.textSoft }}>{r.text}</span>
            </div>
          ))}
        </div>

        {/* CONFIRM */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Confirm new password *</label>
          <div style={{ position: 'relative' }}>
            <LockLeft />
            <input type={cpType} value={cp} onInput={(e) => { setCp(e.target.value); setCpTouched(true) }} disabled={inputsDisabled} placeholder="Re-enter new password" style={{ ...inputBase, border: `1px solid ${cpBorder}`, background: '#fff', opacity: isLoading ? 0.7 : 1 }} />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
              {cp.length > 0 && <RuleIcon state={match ? 'check' : 'x'} color={match ? colors.green : colors.red} />}
            </span>
          </div>
          {mismatch && <div style={{ fontSize: 11, color: colors.red, marginTop: 4 }}>Passwords don't match</div>}
          {match && <div style={{ fontSize: 11, color: colors.green, marginTop: 4 }}>Passwords match ✓</div>}
        </div>

        {/* sign out toggle */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.ink, marginBottom: 2 }}>Sign out other devices</div>
              <div style={{ fontSize: 11, color: colors.textFaint, lineHeight: 1.4 }}>All other logged-in sessions will be ended after password change.</div>
            </div>
            <button onClick={() => setSignOut(!signOut)} style={{ width: 36, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0, position: 'relative', transition: 'background 200ms', flexShrink: 0, background: signOut ? colors.green : colors.border }}>
              <span style={{ position: 'absolute', top: 2, left: 2, width: 16, height: 16, borderRadius: 999, background: '#fff', transition: 'transform 200ms', transform: `translateX(${signOut ? '16px' : '0'})`, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          {signOut && <div style={{ fontSize: 11, color: colors.amber, marginTop: 6 }}>All other sessions will be signed out immediately.</div>}
        </div>

        {/* api error */}
        {err && (
          <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: colors.red }}>{err}</div>
        )}

        {/* submit */}
        <button onClick={onSubmit} disabled={!submitEnabled} style={{ width: '100%', height: 36, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', background: submitEnabled ? colors.green : colors.textFaint, cursor: submitEnabled ? 'pointer' : 'not-allowed', opacity: isLoading ? 0.85 : 1 }}>
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: 999, display: 'inline-block', animation: 'ws-spin 0.7s linear infinite' }} />
              Updating...
            </span>
          ) : (
            'Update Password'
          )}
        </button>
      </div>

      {/* tips card */}
      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 10 }}>Password tips</div>
        {tips.map((tip) => (
          <div key={tip} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12" /></svg>
            <span style={{ fontSize: 12, color: colors.textSoft, lineHeight: 1.5 }}>{tip}</span>
          </div>
        ))}
      </div>
    </>
  )

  const toastEl = showToast && (
    <div style={{ position: 'fixed', bottom: 22, right: 22, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'flex-start', animation: 'wsk-toast 300ms ease-out', zIndex: 60 }}>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>Password updated successfully</div>
        <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>Your account is secured.</div>
      </div>
    </div>
  )

  const modalEl = showModal && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 22, maxWidth: 380, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, marginBottom: 4 }}>Sign out other devices?</div>
        <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '10px 12px', margin: '12px 0 14px' }}>
          <div style={{ fontSize: 12, color: colors.amberText, lineHeight: 1.6 }}>You are currently logged in on:</div>
          <div style={{ fontSize: 12, color: colors.amberText, lineHeight: 1.7, marginTop: 4 }}>· This device (active now)<br />· iPhone · Jeddah · Jun 27<br />· Chrome · Windows · Jun 25</div>
          <div style={{ fontSize: 12, color: colors.amberText, lineHeight: 1.6, marginTop: 4 }}>All except this device will be signed out.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowModal(false)} style={{ flex: 1, height: 36, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 13, fontWeight: 500, color: colors.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={() => runUpdate(true)} style={{ flex: 1.4, height: 36, background: colors.green, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Update &amp; Sign Out Others</button>
        </div>
      </div>
    </div>
  )

  // Embedded inside Realtor Settings tabs — content only, no sidebar/topbar/subnav
  if (embed) {
    return (
      <>
        <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>{rightContent}</div>
        </div>
        {toastEl}
        {modalEl}
      </>
    )
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: colors.ink, background: colors.bg, WebkitFontSmoothing: 'antialiased', letterSpacing: '-0.01em', height: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* SIDEBAR */}
      <div style={{ width: 232, minWidth: 232, background: colors.bg, borderRight: `1px solid ${colors.border}`, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" /><circle cx="12" cy="11" r="2.4" /></svg>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>waseet</span>
            <span style={{ fontSize: 11, color: colors.textFaint }}>وسيط</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: colors.greenDark, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase' }}>Realtor</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 4px' }}>Main</div>
          <div style={{ padding: '0 8px' }}>
            {navMainDefs.map((n) => <SideNavItem key={n.label} label={n.label} d={n.d} active={false} />)}
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 12px 4px' }}>Account</div>
          <div style={{ padding: '0 8px' }}>
            {navAcctDefs.map((n) => <SideNavItem key={n.label} label={n.label} d={n.d} active={n.active} />)}
          </div>
        </div>
        <div style={{ padding: 14, borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>AR</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Ahmed Al-Rashid</div>
            <div style={{ fontSize: 11, color: colors.greenDark }}>Gold Realtor 🥇</div>
          </div>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.7} style={{ cursor: 'pointer' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ height: 56, minHeight: 56, background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Settings</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>Change Password</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ width: 200, flexShrink: 0, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '10px 8px', position: 'sticky', top: 0 }}>
              {settingsDefs.map((it) => (
                <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 1, cursor: 'pointer', ...(it.active ? { background: colors.greenTint, color: colors.greenDark, fontWeight: 600 } : { color: colors.textMuted }) }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={it.active ? colors.green : colors.textFaint} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={it.d} /></svg>
                  <span>{it.label}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, maxWidth: 520 }}>{rightContent}</div>
          </div>
        </div>
      </div>

      {toastEl}
      {modalEl}
    </div>
  )
}
