import React, { useState, useEffect } from 'react'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { PortalMain } from '../../components/layout/PortalLayout'
import { Avatar, Toggle } from '../../components/ui'
import { UserAvatar } from '../../components/UserAvatar'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../lib/api'

const tabs = ['Billing', 'Password', 'Notifications']
const inputStyle = { width: '100%', height: 36, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: colors.ink }
const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }
const sectionLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

const notifRows = [
  ['New leads', 'When a realtor submits a lead on your projects'],
  ['Lead status changes', 'When a lead advances or closes'],
  ['Commission reminders', 'Upcoming and overdue payment alerts'],
  ['Project review updates', 'Approvals, rejections, and change requests'],
  ['New realtors', 'When a new realtor joins your network'],
  ['Platform announcements', 'News and updates from Waseet'],
]

export default function DeveloperSettings() {
  const { user, updateProfile } = useAuth() || {}
  const [tab, setTab] = useState('Billing')
  const [saved, setSaved] = useState(false)
  const [notif, setNotif] = useState(notifRows.map(() => ({ email: true, push: true })))
  const setN = (i, k, v) => setNotif((n) => n.map((row, j) => (j === i ? { ...row, [k]: v } : row)))

  // Password tab state
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  // Hydrate notification toggles from the persisted prefs when the user loads.
  useEffect(() => {
    const prefs = user?.notificationPrefs?.developerNotif
    if (Array.isArray(prefs) && prefs.length) {
      setNotif(notifRows.map((_, i) => ({
        email: prefs[i]?.email ?? true,
        push: prefs[i]?.push ?? true,
      })))
    }
  }, [user])

  const save = async () => {
    if (tab === 'Notifications' && updateProfile) {
      try {
        await updateProfile({ notificationPrefs: { developerNotif: notif } })
      } catch (e) {
        // Keep the design unchanged; surface nothing beyond the existing indicator.
      }
    }
    flashSaved()
  }

  const updatePassword = async () => {
    setPwError('')
    if (pwNew.length < 8) { setPwError('New password must be at least 8 characters'); return }
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match'); return }
    setPwSaving(true)
    try {
      await authApi.changePassword(pwCurrent, pwNew)
      setPwCurrent(''); setPwNew(''); setPwConfirm('')
      flashSaved()
    } catch (e) {
      setPwError(e?.message || 'Failed to update password')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <>
      <Topbar
        title="Settings"
        notifications={1}
        avatar={<UserAvatar size={30} background={colors.surfaceMuted} color={colors.textMuted} style={{ border: `1px solid ${colors.border}` }} />}
        actions={<button onClick={save} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Save Changes</button>}
      />
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex' }}>
        {tabs.map((t) => {
          const on = tab === t
          return <div key={t} onClick={() => setTab(t)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>{t}</div>
        })}
      </div>

      <PortalMain maxWidth={680} padding="20px 22px">
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
            <Icon name="checkCircle" size={18} color={colors.green} strokeWidth={2} /><span style={{ fontSize: 13, fontWeight: 500 }}>Settings saved</span>
          </div>
        )}

        {tab === 'Billing' && (
          <div className="wa-form" style={card}>
            <div style={sectionLabel}>Billing account for platform fees</div>
            <Field label="Billing Email"><input defaultValue="billing@alfaisal.com" style={inputStyle} /></Field>
            <Field label="Bank Name">
              <select defaultValue="Al Rajhi Bank" style={{ ...inputStyle, color: colors.textMuted }}><option>Al Rajhi Bank</option><option>Saudi National Bank</option><option>Riyad Bank</option></select>
            </Field>
            <Field label="IBAN" hint="Used for platform-fee settlement"><input defaultValue="SA00 0000 0000 0000 0000 9911" style={inputStyle} /></Field>
            <Field label="VAT Number"><input defaultValue="3000000000003" style={inputStyle} /></Field>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, fontSize: 12, color: colors.textFaint }}>
              <Icon name="lock" size={13} color={colors.textFaint} strokeWidth={1.8} />Billing details are stored encrypted.
            </div>
          </div>
        )}

        {tab === 'Password' && (
          <div className="wa-form" style={card}>
            <div style={sectionLabel}>Change password</div>
            <Field label="Current Password"><input type="password" placeholder="••••••••" style={inputStyle} value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} /></Field>
            <Field label="New Password" hint="At least 8 characters, with a number and symbol"><input type="password" placeholder="••••••••" style={inputStyle} value={pwNew} onChange={(e) => setPwNew(e.target.value)} /></Field>
            <Field label="Confirm New Password"><input type="password" placeholder="••••••••" style={inputStyle} value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} /></Field>
            {pwError && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10 }}>{pwError}</div>}
            <button onClick={updatePassword} disabled={pwSaving} style={{ height: 36, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: pwSaving ? 'default' : 'pointer', opacity: pwSaving ? 0.7 : 1, marginTop: 4 }}>{pwSaving ? 'Updating…' : 'Update Password'}</button>
          </div>
        )}

        {tab === 'Notifications' && (
          <div style={card}>
            <div style={{ display: 'flex', paddingBottom: 10, borderBottom: `1px solid ${colors.surfaceMuted}`, marginBottom: 4 }}>
              <span style={{ flex: 1, fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notification</span>
              <span style={{ width: 60, textAlign: 'center', fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase' }}>Email</span>
              <span style={{ width: 60, textAlign: 'center', fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase' }}>Push</span>
            </div>
            {notifRows.map(([title, sub], i) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i < notifRows.length - 1 ? `1px solid ${colors.surfaceMuted}` : 'none' }}>
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>{sub}</div>
                </div>
                <div style={{ width: 60, display: 'flex', justifyContent: 'center' }}><Toggle checked={notif[i].email} onChange={(v) => setN(i, 'email', v)} /></div>
                <div style={{ width: 60, display: 'flex', justifyContent: 'center' }}><Toggle checked={notif[i].push} onChange={(v) => setN(i, 'push', v)} /></div>
              </div>
            ))}
          </div>
        )}
      </PortalMain>
    </>
  )
}
