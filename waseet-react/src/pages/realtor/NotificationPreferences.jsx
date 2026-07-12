import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { useAuth } from '../../context/AuthContext'

// Toggle track / knob styles (ported exactly from the source)
const trackStyle = (on) => ({
  position: 'relative',
  width: 36,
  height: 20,
  borderRadius: 999,
  cursor: 'pointer',
  display: 'inline-block',
  transition: 'background 200ms',
  background: on ? colors.green : colors.border,
})
const knobStyle = (on) => ({
  position: 'absolute',
  top: 2,
  ...(on ? { right: 2 } : { left: 2 }),
  width: 16,
  height: 16,
  background: '#fff',
  borderRadius: '50%',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  transition: 'all 200ms',
})

const rowB = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: `1px solid ${colors.surfaceMuted}`,
}
const rowL = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
}

const alwaysOn = [
  { icon: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0', label: 'Lead status updates', desc: 'When developer updates your lead status', last: false },
  { icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10', label: 'Commission payments', desc: 'When commission is verified or paid', last: false },
  { icon: 'M8 11l3 3 5-6M20 6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z', label: 'Deal closures', desc: 'When a deal is marked as closed', last: false },
  { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label: 'Account security', desc: 'Password changes, new logins', last: false },
  { icon: 'M12 2L2 22h20zM12 9v5M12 18h.01', label: 'Dispute updates', desc: 'When a dispute status changes', last: true },
]

const badgeDefs = [
  { key: 'badgeUpgrade', icon: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM5 9H3a2 2 0 0 1-2-2V5h4M19 9h2a2 2 0 0 0 2-2V5h-4', label: 'Badge upgrades', desc: 'When you reach a new badge level', last: false },
  { key: 'milestone', icon: 'M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21 8 14 2 9.4h7.6z', label: 'Milestone achievements', desc: 'First lead, first deal, etc.', last: false },
  { key: 'weekly', icon: 'M3 3v18h18M7 16l4-6 4 3 5-7', label: 'Weekly performance summary', desc: 'Weekly digest of your activity', last: true },
]

const announceDefs = [
  { key: 'platformUpdates', icon: 'M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6', label: 'Platform updates', desc: 'New features, maintenance notices', last: false },
  { key: 'newsletter', icon: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6', label: 'Newsletters', desc: 'Market insights and platform news', last: true },
]

const cityKeys = ['All cities', 'Jeddah', 'Riyadh', 'Dubai', 'Abu Dhabi', 'Karachi', 'Lahore']
const typeKeys = ['All types', 'Apartments', 'Villas', 'Offices', 'Townhouses', 'Land']

const freqDefs = [
  ['Instant', 'Get notified immediately when something happens'],
  ['Daily digest', 'One summary email at 9:00 AM daily with all your updates'],
  ['Weekly digest', 'One summary email every Monday with your weekly highlights'],
]

const card = {
  background: '#fff',
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: '16px 18px',
  marginBottom: 14,
}
const sectionTitle = { fontSize: 14, fontWeight: 600 }
const sectionDesc = { fontSize: 12, color: colors.textFaint }
const subLabel = { fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 10 }
const rowIconWrap = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: colors.surfaceMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

// Disabled "always on" toggle (green, dimmed, not clickable) + lock glyph
function LockedToggle() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ position: 'relative', width: 36, height: 20, background: colors.green, opacity: 0.6, borderRadius: 999, cursor: 'not-allowed', display: 'inline-block' }}>
        <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </span>
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
  )
}

function RowIcon({ d }) {
  return (
    <div style={rowIconWrap}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textSoft} strokeWidth={1.8}>
        <path d={d} />
      </svg>
    </div>
  )
}

export default function NotificationPreferences({ embed = false }) {
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth() || {}

  const [toggles, setToggles] = useState({
    projectAlerts: true, badges: true, badgeUpgrade: true, milestone: true, weekly: false,
    platformUpdates: true, newsletter: false, email: true, quiet: false,
  })
  const [cities, setCities] = useState({ 'All cities': true, Jeddah: true, Riyadh: true, Dubai: false, 'Abu Dhabi': false, Karachi: false, Lahore: false })
  const [types, setTypes] = useState({ 'All types': true, Apartments: false, Villas: false, Offices: false, Townhouses: false, Land: false })
  const [freq, setFreq] = useState('Instant')
  const [saveState, setSaveState] = useState('idle')
  const [toast, setToast] = useState(false)

  // Hydrate from the user's saved preferences once they load.
  useEffect(() => {
    const p = user?.notificationPrefs
    if (!p || Object.keys(p).length === 0) return
    if (p.toggles) setToggles((s) => ({ ...s, ...p.toggles }))
    if (p.cities) setCities((s) => ({ ...s, ...p.cities }))
    if (p.types) setTypes((s) => ({ ...s, ...p.types }))
    if (p.freq) setFreq(p.freq)
  }, [user?.notificationPrefs])

  const toggle = (k) => setToggles((s) => ({ ...s, [k]: !s[k] }))

  const toggleCity = (c) => {
    setCities((prev) => {
      const next = { ...prev }
      if (c === 'All cities') {
        const v = !next['All cities']
        Object.keys(next).forEach((k) => { next[k] = v })
      } else {
        next[c] = !next[c]
        next['All cities'] = false
      }
      return next
    })
  }

  const toggleType = (t) => {
    setTypes((prev) => {
      const next = { ...prev }
      if (t === 'All types') {
        const v = !next['All types']
        Object.keys(next).forEach((k) => { next[k] = false })
        next['All types'] = v
      } else {
        next[t] = !next[t]
        next['All types'] = false
      }
      return next
    })
  }

  const save = async () => {
    if (saveState === 'saving') return
    setSaveState('saving')
    try {
      if (updateProfile) await updateProfile({ notificationPrefs: { toggles, cities, types, freq } })
      setSaveState('saved'); setToast(true)
      setTimeout(() => { setSaveState('idle'); setToast(false) }, 3500)
    } catch (e) {
      setSaveState('idle')
    }
  }

  const saveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save Preferences'
  const saveColor = saveState === 'saved' ? colors.greenDark : '#fff'
  const saveBg = saveState === 'saved' ? colors.greenTint : colors.green
  const saveBorder = saveState === 'saved' ? `1px solid ${colors.greenTintBorder}` : 'none'
  const saveTopStyle = { height: 34, padding: '0 16px', background: saveBg, border: saveBorder, borderRadius: 7, fontSize: 13, fontWeight: 600, color: saveColor, fontFamily: 'inherit', cursor: 'pointer' }
  const saveBottomStyle = { height: 36, padding: '0 20px', background: saveBg, border: saveBorder, borderRadius: 8, fontSize: 13, fontWeight: 600, color: saveColor, fontFamily: 'inherit', cursor: 'pointer' }

  const allCities = cities['All cities']

  const quietOn = toggles.quiet

  return (
    <>
      {!embed && (
        <Topbar
          left={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span onClick={() => navigate('/realtor/notifications')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Notifications</span>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>
              <span style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>Preferences</span>
            </div>
          }
          actions={<button onClick={save} style={saveTopStyle}>{saveLabel}</button>}
        />
      )}

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* SECTION 1: ALWAYS ON */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={sectionTitle}>Always on</span>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 16, lineHeight: 1.5 }}>These notifications cannot be disabled as they are required for platform security and commission processing.</div>
            {alwaysOn.map((r) => (
              <div key={r.label} style={r.last ? rowL : rowB}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <RowIcon d={r.icon} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>{r.desc}</div>
                  </div>
                </div>
                <LockedToggle />
              </div>
            ))}
          </div>

          {/* SECTION 2: NEW PROJECT ALERTS */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={sectionTitle}>New project alerts</span>
              <span onClick={() => toggle('projectAlerts')} style={trackStyle(toggles.projectAlerts)}><span style={knobStyle(toggles.projectAlerts)} /></span>
            </div>
            <div style={{ ...sectionDesc, marginBottom: 16 }}>Get notified when new projects are added to the marketplace.</div>
            <div style={subLabel}>Notify me about projects in:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {cityKeys.map((label) => {
                const checked = cities[label]
                const dim = allCities && label !== 'All cities'
                return (
                  <div key={label} onClick={() => toggleCity(label)} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', cursor: 'pointer' }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...(checked ? { background: colors.green, border: `1px solid ${colors.green}` } : { background: '#fff', border: `1.5px solid ${colors.borderStrong}` }) }}>
                      {checked && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg>}
                    </span>
                    <span style={{ fontSize: 12, color: dim ? colors.textFaint : colors.textMuted }}>{label}</span>
                  </div>
                )
              })}
            </div>
            <div style={subLabel}>Notify me about:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {typeKeys.map((label) => {
                const on = types[label]
                return (
                  <span key={label} onClick={() => toggleType(label)} style={{ borderRadius: 999, padding: '6px 12px', fontSize: 12, cursor: 'pointer', ...(on ? { background: colors.ink, color: '#fff', border: `1px solid ${colors.ink}` } : { background: '#fff', color: colors.textMuted, border: `1px solid ${colors.border}` }) }}>{label}</span>
                )
              })}
            </div>
          </div>

          {/* SECTION 3: BADGE UPDATES */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={sectionTitle}>Badge &amp; achievement updates</span>
              <span onClick={() => toggle('badges')} style={trackStyle(toggles.badges)}><span style={knobStyle(toggles.badges)} /></span>
            </div>
            <div style={{ ...sectionDesc, marginBottom: 12 }}>Celebrate milestones and badge upgrades.</div>
            {badgeDefs.map((r) => (
              <div key={r.key} style={r.last ? rowL : rowB}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <RowIcon d={r.icon} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>{r.desc}</div>
                  </div>
                </div>
                <span onClick={() => toggle(r.key)} style={trackStyle(toggles[r.key])}><span style={knobStyle(toggles[r.key])} /></span>
              </div>
            ))}
          </div>

          {/* SECTION 4: PLATFORM ANNOUNCEMENTS */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={sectionTitle}>Platform announcements</span>
            </div>
            {announceDefs.map((r) => (
              <div key={r.key} style={r.last ? rowL : rowB}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <RowIcon d={r.icon} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>{r.desc}</div>
                  </div>
                </div>
                <span onClick={() => toggle(r.key)} style={trackStyle(toggles[r.key])}><span style={knobStyle(toggles[r.key])} /></span>
              </div>
            ))}
          </div>

          {/* SECTION 5: DELIVERY */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Delivery preferences</div>
            <div style={{ ...sectionDesc, marginBottom: 16 }}>How and when you receive notifications.</div>
            <div style={subLabel}>Channels</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textSoft} strokeWidth={1.8}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>In-app notifications</div>
                  <div style={{ fontSize: 11, color: colors.textFaint }}>Shown in your notification bell</div>
                </div>
              </div>
              <LockedToggle />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textSoft} strokeWidth={1.8}><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Email notifications</div>
                  <div style={{ fontSize: 11, color: colors.textFaint }}>{user?.email || '—'}</div>
                </div>
              </div>
              <span onClick={() => toggle('email')} style={trackStyle(toggles.email)}><span style={knobStyle(toggles.email)} /></span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, margin: '16px 0 10px' }}>Email frequency</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {freqDefs.map(([label, desc]) => {
                const on = freq === label
                return (
                  <div key={label} onClick={() => setFreq(label)} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: on ? `1.5px solid ${colors.ink}` : `1px solid ${colors.border}`, background: on ? colors.bg : '#fff' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1, ...(on ? { background: colors.ink, boxShadow: `inset 0 0 0 3px #fff, 0 0 0 1.5px ${colors.ink}` } : { background: '#fff', border: `1.5px solid ${colors.borderStrong}` }) }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint }}>{desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SECTION 6: QUIET HOURS */}
          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={sectionTitle}>Quiet hours</span>
              <span onClick={() => toggle('quiet')} style={trackStyle(toggles.quiet)}><span style={knobStyle(toggles.quiet)} /></span>
            </div>
            <div style={sectionDesc}>Pause non-urgent notifications during specific hours.</div>
            {quietOn && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>From</span>
                  <select style={{ height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                    <option>10:00 PM</option>
                    <option>11:00 PM</option>
                    <option>9:00 PM</option>
                  </select>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>to</span>
                  <select style={{ height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                    <option>7:00 AM</option>
                    <option>6:00 AM</option>
                    <option>8:00 AM</option>
                  </select>
                </div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 8 }}>Timezone: Asia/Riyadh</div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 8, fontStyle: 'italic' }}>Urgent notifications (lead updates, commissions) will still be sent.</div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* STICKY SAVE */}
      <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '14px 22px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.textFaint }}>Changes save automatically</span>
          <button onClick={save} style={saveBottomStyle}>{saveLabel}</button>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 80, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Preferences saved</span>
        </div>
      )}
    </>
  )
}
