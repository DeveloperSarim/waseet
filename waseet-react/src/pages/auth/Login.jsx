import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { colors, radius, shadow } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Button } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

const portalFor = (u) => (u.role === 'ADMIN' ? '/admin' : u.role === 'DEVELOPER' ? '/developer' : '/realtor')

const statusNotice = {
  PENDING: { text: 'Your account is pending admin approval. You will get access once approved.', tone: 'amber' },
  SUSPENDED: { text: 'Your account has been suspended. Please contact support.', tone: 'red' },
  REJECTED: { text: 'Your application was not approved. Please contact support.', tone: 'red' },
}

export default function Login() {
  const navigate = useNavigate()
  const { login, user, loading: authLoading } = useAuth()

  // Already signed in? Don't show the login form — send them to their portal
  // (they must log out first to switch accounts).
  useEffect(() => {
    if (!authLoading && user && user.status === 'ACTIVE') {
      navigate(portalFor(user), { replace: true })
    }
  }, [authLoading, user, navigate])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)

  const filled = email.trim() && password.trim()
  const btnActive = filled && !loading

  const onSignIn = async () => {
    if (!btnActive) return
    setError('')
    setNotice(null)
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else if (user.status !== 'ACTIVE') {
        setNotice(statusNotice[user.status] || statusNotice.PENDING)
      } else {
        navigate(user.role === 'DEVELOPER' ? '/developer' : '/realtor')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase = {
    width: '100%',
    height: 34,
    borderRadius: radius.md,
    padding: '0 34px',
    fontSize: 13,
    fontFamily: 'inherit',
    color: colors.ink,
    background: '#fff',
  }

  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        color: colors.ink,
        background: colors.bg,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#fff',
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xl,
          padding: 36,
          boxShadow: shadow.sm,
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" />
            <circle cx="12" cy="11" r="2.4" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>waseet</span>
          <span style={{ fontSize: 12, color: colors.textFaint, marginLeft: 2 }}>وسيط</span>
        </Link>

        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Sign in</h1>
        <p style={{ fontSize: 13, color: colors.textSoft, margin: '0 0 24px' }}>Welcome back to Waseet</p>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Email address</div>
          <div style={{ position: 'relative' }}>
            <Icon name="mail" size={14} color={colors.textFaint} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ ...inputBase, border: `1px solid ${colors.border}` }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>Password</span>
            <Link to="/forgot-password" style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer', textDecoration: 'none' }}>Forgot password?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Icon name="lock" size={14} color={colors.textFaint} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && onSignIn()}
              style={{
                ...inputBase,
                border: `1px solid ${error ? colors.red : colors.border}`,
                background: error ? colors.redTint : '#fff',
              }}
            />
            <span onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex' }}>
              <Icon name={showPw ? 'eye' : 'eyeOff'} size={15} color={colors.textFaint} />
            </span>
          </div>
          {error && (
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: radius.md, padding: '8px 10px', marginTop: 8, display: 'flex', gap: 7, alignItems: 'center' }}>
              <Icon name="alertCircle" size={14} color={colors.red} strokeWidth={2} />
              <span style={{ fontSize: 12, color: colors.red }}>{error}</span>
            </div>
          )}
        </div>

        {notice && (
          <div style={{ background: notice.tone === 'amber' ? colors.amberTint : colors.redTint, border: `1px solid ${notice.tone === 'amber' ? colors.amberTintBorder : colors.redTintBorder}`, borderRadius: radius.md, padding: '10px 12px', marginBottom: 4, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name={notice.tone === 'amber' ? 'clock' : 'alertCircle'} size={15} color={notice.tone === 'amber' ? colors.amber : colors.red} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, lineHeight: 1.5, color: notice.tone === 'amber' ? colors.amberText : colors.red }}>{notice.text}</span>
          </div>
        )}

        <Button variant="primary" fullWidth loading={loading} disabled={!btnActive} onClick={onSignIn} style={{ marginTop: 8 }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: colors.textFaint }}>
          New realtor or developer?{' '}
          <Link to="/register/realtor" style={{ color: colors.greenDark, textDecoration: 'none', fontWeight: 500 }}>Create an account</Link>
        </div>
      </div>

      <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 24 }}>© 2026 Waseet · Privacy · Terms</div>
    </div>
  )
}
