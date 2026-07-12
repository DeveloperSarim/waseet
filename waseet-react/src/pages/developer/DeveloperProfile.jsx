import React, { useState, useRef, useEffect } from 'react'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../lib/api'
import { countryName, joinedLabel, initials } from '../../lib/adminFormat'

// Icon paths for the hero info pills. Labels are filled in from the real user.
const pinIcon = 'M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z'
const bldgIcon = 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4'
const bagIcon = 'M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z'
const globeIcon = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z'

const sB = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: `1px solid ${colors.surfaceMuted}` }
const sL = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }
// No backend for these domain metrics yet — honest zeros, same layout.
const heroStats = [
  { value: '0', label: 'Live Projects', style: sB }, { value: '0', label: 'Total Leads', style: sB },
  { value: '0', label: 'Deals Closed', style: sB }, { value: 'SAR 0', label: 'Commission Paid', style: sL },
]

const verifiedBadge = { display: 'inline-block', background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, color: colors.greenDark, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }
const pendingBadge = { display: 'inline-block', background: '#FEF9EC', border: '1px solid #F3E2B8', color: colors.amberText, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }
const docs = [
  { name: 'Trade License / CR Certificate', meta: 'Uploaded June 24 · 2.4MB', badge: 'Verified ✓', badgeStyle: verifiedBadge },
  { name: 'REGA License', meta: 'Uploaded June 24 · 1.8MB', badge: 'Verified ✓', badgeStyle: verifiedBadge },
  { name: 'Company Profile', meta: 'Uploaded June 26 · 4.1MB', badge: 'Pending', badgeStyle: pendingBadge },
]

const check = 'M20 6L9 17l-5-5'
const clock = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v5l3 2'
const checklist = [
  { label: 'Company registered', color: '#16A34A', icon: check },
  { label: 'Trade license verified', color: '#16A34A', icon: check },
  { label: 'REGA license verified', color: '#16A34A', icon: check },
  { label: 'Contact person verified', color: '#16A34A', icon: check },
  { label: 'Company profile (pending)', color: '#D97706', icon: clock },
]

const editInput = { width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }
const editInputDisabled = { ...editInput, background: colors.surfaceAlt, color: colors.textFaint }
const editLabel = { fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }
const sectionLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }

export default function DeveloperProfile() {
  const { user, setUser, updateProfile } = useAuth() || {}
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [logoHover, setLogoHover] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)
  const timers = useRef([])

  // Editable company fields (only those with backend columns). Sync when user loads.
  const [form, setForm] = useState({ companyName: '', city: '', website: '' })
  useEffect(() => {
    setForm({
      companyName: user?.companyName || user?.fullName || '',
      city: user?.city || '',
      website: user?.website || '',
    })
  }, [user])

  const companyName = user?.companyName || user?.fullName || '—'
  const locationLabel = user?.city ? `${user.city}, ${countryName(user?.country)}` : countryName(user?.country)

  const infoPills = [
    { d: pinIcon, label: locationLabel },
    { d: bldgIcon, label: 'Est. 2015' },
    { d: bagIcon, label: 'Real Estate Developer' },
    { d: globeIcon, label: user?.website || '—' },
  ]

  const companyInfo = [
    { label: 'Company Name', value: companyName }, { label: 'Country', value: countryName(user?.country) },
    { label: 'City', value: user?.city || '—' }, { label: 'REGA License', value: 'REGA-2024-12345' },
    { label: 'CR Number', value: '1234567890' }, { label: 'Years in Business', value: '—' },
    { label: 'Website', value: user?.website || '—' }, { label: 'Approved', value: joinedLabel(user?.createdAt) },
  ]
  const contactInfo = [
    { label: 'Name', value: user?.contactName || '—' }, { label: 'Designation', value: '—' },
    { label: 'Phone', value: user?.phone || '—' }, { label: 'Email', value: user?.email || '—' },
    { label: 'WhatsApp', value: user?.phone || '—' },
  ]

  const onPickLogo = () => { if (!uploading) fileInputRef.current?.click() }
  const onLogoFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const updated = await authApi.uploadAvatar(file)
      setUser?.(updated)
    } catch (err) {
      setUploadError(err?.message || 'Upload failed. Use JPG, PNG or WEBP up to 5MB.')
    } finally {
      setUploading(false)
    }
  }

  const startEdit = () => { setEditing(true); setSavedToast(false) }
  const cancelEdit = () => setEditing(false)
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const saveEdit = async () => {
    setSaving(true)
    try {
      await updateProfile?.({ companyName: form.companyName, city: form.city, website: form.website })
      setSaving(false); setEditing(false); setSavedToast(true)
      timers.current.push(setTimeout(() => setSavedToast(false), 4000))
    } catch {
      setSaving(false)
    }
  }
  const stop = (e) => e.stopPropagation()

  return (
    <>
      <style>{'@keyframes dp-pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }'}</style>
      <Topbar
        left={<span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{editing ? 'Edit Company Profile' : 'Company Profile'}</span>}
        actions={
          editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={cancelEdit} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveEdit} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          ) : (
            <button onClick={startEdit} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={1.8}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>Edit Profile</button>
          )
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {savedToast && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg><span style={{ fontSize: 13, fontWeight: 500 }}>Profile updated</span></div>
        )}

        <div className="rp-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* LEFT */}
          <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* HERO */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div onMouseEnter={() => setLogoHover(true)} onMouseLeave={() => setLogoHover(false)} onClick={onPickLogo} style={{ width: 80, height: 80, borderRadius: 14, background: colors.surfaceMuted, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: colors.textMuted, position: 'relative', overflow: 'hidden', cursor: uploading ? 'default' : 'pointer' }}>
                    {user?.avatar ? <img src={user.avatar} alt={companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(companyName)}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, opacity: uploading || editing || logoHover ? 1 : 0, transition: 'opacity 200ms' }}><svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg><span style={{ fontSize: 10, color: '#fff' }}>{uploading ? 'Uploading…' : 'Change'}</span></div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onLogoFile} />
                  <button onClick={onPickLogo} disabled={uploading} style={{ height: 28, padding: '0 10px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: uploading ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>{uploading ? 'Uploading…' : user?.avatar ? 'Change logo' : 'Upload logo'}</button>
                  {uploadError && <div style={{ fontSize: 10, color: colors.red, textAlign: 'center', maxWidth: 110, lineHeight: 1.4 }}>{uploadError}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}><span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{companyName}</span><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg></div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {infoPills.map((p, i) => <span key={i} style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}`, borderRadius: 999, padding: '4px 10px', display: 'flex', gap: 5, alignItems: 'center' }}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8}><path d={p.d} /></svg><span style={{ fontSize: 12, color: colors.textMuted }}>{p.label}</span></span>)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 999, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.green, animation: 'dp-pulse-dot 1.6s infinite' }} /><span style={{ fontSize: 11, fontWeight: 600, color: colors.greenDark }}>Active</span></span><span style={{ fontSize: 12, color: colors.textFaint }}>Member since {joinedLabel(user?.createdAt)}</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                {heroStats.map((st, i) => <div key={i} style={st.style}><div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{st.value}</div><div style={{ fontSize: 10, color: colors.textFaint, marginTop: 3 }}>{st.label}</div></div>)}
              </div>
            </div>

            {/* COMPANY INFO */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><span style={sectionLabel}>Company Information</span>{!editing && <span onClick={startEdit} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Edit ✏️</span>}</div>
              {!editing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                  {companyInfo.map((f, i) => <div key={i}><div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>{f.label}</div><div style={{ fontSize: 13, color: colors.textMuted }}>{f.value}</div></div>)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                  <div><div style={editLabel}>Company Name</div><input value={form.companyName} onChange={setField('companyName')} style={editInput} /></div>
                  <div><div style={editLabel}>Country</div><input value={countryName(user?.country)} disabled style={editInputDisabled} /><div style={{ fontSize: 10, color: colors.textFaint, marginTop: 3 }}>Contact support to change</div></div>
                  <div><div style={editLabel}>City</div><input value={form.city} onChange={setField('city')} style={editInput} /></div>
                  <div><div style={editLabel}>REGA License</div><input defaultValue="REGA-2024-12345" disabled style={editInputDisabled} /><div style={{ fontSize: 10, color: colors.textFaint, marginTop: 3 }}>Locked</div></div>
                  <div><div style={editLabel}>CR Number</div><input defaultValue="1234567890" disabled style={editInputDisabled} /><div style={{ fontSize: 10, color: colors.textFaint, marginTop: 3 }}>Locked</div></div>
                  <div><div style={editLabel}>Website</div><input value={form.website} onChange={setField('website')} style={editInput} /></div>
                  <div style={{ gridColumn: 'span 2' }}><div style={{ fontSize: 11, color: colors.textFaint }}>Contact support@waseet.io to change locked fields.</div></div>
                </div>
              )}
            </div>

            {/* CONTACT */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><span style={sectionLabel}>Contact Person</span>{!editing && <span onClick={startEdit} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Edit ✏️</span>}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                {contactInfo.map((f, i) => <div key={i}><div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>{f.label}</div><div style={{ fontSize: 13, color: colors.textMuted }}>{f.value}</div></div>)}
              </div>
            </div>

            {/* DOCUMENTS */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><span style={sectionLabel}>Documents</span><span style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Manage Documents</span></div>
              {docs.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.7}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" /></svg><div><div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div><div style={{ fontSize: 11, color: colors.textFaint }}>{d.meta}</div></div></div><span style={d.badgeStyle}>{d.badge}</span><div style={{ display: 'flex', gap: 6 }}><span style={{ fontSize: 11, color: colors.greenDark, border: `1px solid ${colors.greenTintBorder}`, background: colors.greenTint, borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>View</span><span style={{ fontSize: 11, color: colors.textMuted, border: `1px solid ${colors.border}`, background: '#fff', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>Replace</span></div></div>
              ))}
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 10, lineHeight: 1.5, display: 'flex', gap: 4, alignItems: 'flex-start' }}><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>Replacing documents requires admin re-verification. Account stays active during review.</div>
            </div>

            {/* PROJECTS OVERVIEW */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><span style={sectionLabel}>My Projects</span><span style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>View all →</span></div>
              <div style={{ fontSize: 13, color: colors.textFaint, textAlign: 'center', padding: '18px 0' }}>No projects yet</div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* VERIFICATION */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Verification Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, fontWeight: 600, color: colors.greenDark }}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>Verified Developer ✓</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {checklist.map((c, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth={2}><path d={c.icon} /></svg><span style={{ fontSize: 12, color: colors.textMuted }}>{c.label}</span></div>)}
              </div>
            </div>

            {/* COMMISSION */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Commission Rates</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>Platform rate:</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>15% of developer commission</div>
              <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 12 }}>(global default)</div>
              <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 8 }}>On a SAR 900k deal at 3% commission:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ fontSize: 12, color: colors.textMuted }}>Developer commission (3%):</span><span style={{ fontSize: 12, color: colors.textMuted }}>SAR 27,000</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ fontSize: 12, color: colors.textFaint }}>Platform fee (15%):</span><span style={{ fontSize: 12, color: colors.textFaint }}>SAR 4,050</span></div>
                <div style={{ borderTop: `1px solid ${colors.surfaceMuted}`, margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ fontSize: 13, fontWeight: 600 }}>Realtor receives:</span><span style={{ fontSize: 13, fontWeight: 600 }}>SAR 22,950</span></div>
              </div>
            </div>

            {/* ACCOUNT */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Account</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><span style={{ fontSize: 12, color: colors.textMuted }}>Email</span><span style={{ fontSize: 12, color: colors.textFaint }}>{user?.email || '—'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><span style={{ fontSize: 12, color: colors.textMuted }}>Password</span><span style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Change Password</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><span style={{ fontSize: 12, color: colors.textMuted }}>Notifications</span><span style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Manage →</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><span style={{ fontSize: 12, color: colors.textMuted }}>Account type</span><span style={{ fontSize: 12, color: colors.textFaint }}>Developer</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><span style={{ fontSize: 12, color: colors.textMuted }}>Member since</span><span style={{ fontSize: 12, color: colors.textFaint }}>{joinedLabel(user?.createdAt)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}><span style={{ fontSize: 12, color: colors.textMuted }}>Last login</span><span style={{ fontSize: 12, color: colors.textFaint }}>{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}</span></div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.red, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Danger zone</div>
                <button onClick={() => setDeleteOpen(true)} style={{ width: '100%', height: 32, background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 7, fontSize: 12, color: colors.red, fontFamily: 'inherit', cursor: 'pointer' }}>Request Account Deletion</button>
                <div style={{ fontSize: 10, color: colors.textFaint, textAlign: 'center', marginTop: 6 }}>Takes 30 days to process</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteOpen && (
        <div onClick={() => setDeleteOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stop} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Request account deletion</span><span onClick={() => setDeleteOpen(false)} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={1.9} style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg><span style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.6 }}>Financial records (deals, commissions) are retained for 7 years per PDPL requirements. Live projects will be unpublished. Everything else is deleted within 30 days.</span></div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Reason (optional):</div>
            <textarea style={{ width: '100%', height: 60, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}><button onClick={() => setDeleteOpen(false)} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button><button onClick={() => setDeleteOpen(false)} style={{ height: 34, padding: '0 14px', background: colors.red, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Send Deletion Request</button></div>
          </div>
        </div>
      )}
    </>
  )
}
