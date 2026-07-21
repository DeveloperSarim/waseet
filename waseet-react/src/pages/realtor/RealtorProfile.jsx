import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { Avatar } from '../../components/ui'
import { UserAvatar } from '../../components/UserAvatar'
import { useAuth } from '../../context/AuthContext'
import { countryName, joinedLabel } from '../../lib/adminFormat'
import { realtorApi, documentsApi } from '../../lib/api'
import { DocPreviewModal } from '../../components/DocPreviewModal'

// Icon path per info pill (labels are derived from the logged-in user at render).
const pillIcons = [
  'M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z',
  'M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z',
  'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z',
  'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
]
// Friendly labels for each stored document type.
const DOC_NAMES = {
  PROFILE_PHOTO: 'Profile Photo',
  FAL_LICENSE: 'FAL License',
  NATIONAL_ID: 'Iqama / National ID',
  TRADE_LICENSE: 'Trade License',
  REGA_CERTIFICATE: 'REGA Certificate',
  OTHER: 'Document',
}
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
// License expiry as "December 2026" (matches the original copy) or "—" when unset.
const expiryLabel = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
// Bronze is the entry tier for an approved realtor; no badge backend yet.
const tiers = [
  { emoji: '🥉', name: 'Bronze', req: 'New approved realtor', status: '● Current', statusColor: colors.green, current: true },
  { emoji: '🥈', name: 'Silver', req: '5 leads or 1 deal', status: '🔒', statusColor: colors.textFaint },
  { emoji: '🥇', name: 'Gold', req: '3 deals closed', status: '🔒', statusColor: colors.textFaint },
  { emoji: '💎', name: 'Platinum', req: '10 deals closed', status: '🔒', statusColor: colors.textFaint },
]
// Saudi-only platform.
const COUNTRIES = [['SA', '🇸🇦 Saudi Arabia']]
// Same option sets the registration form uses, so edit ⇄ register stay consistent.
const LANG_NAMES = ['Arabic', 'English', 'Urdu', 'Hindi', 'French']
const EXP_OPTIONS = ['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years']
const LICENSE_TYPES = ['FAL License', 'REGA Certificate', 'Other']
const ID_TYPES = ['Iqama / National ID', 'Passport', 'Other']
const splitJoined = (s) => String(s || '').split('·').map((x) => x.trim()).filter(Boolean)

const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px' }
const sectionLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }
const rSectionLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }

export default function RealtorProfile() {
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth() || {}
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState(false)
  const [form, setForm] = useState({ fullName: '', country: '', city: '', phone: '', agency: '', specialization: '', languages: '', experience: '', licenseType: '', licenseNumber: '', licenseExpiry: '', idType: '', idNumber: '' })
  const [stats, setStats] = useState(null)
  const [documents, setDocuments] = useState([])
  const [previewDoc, setPreviewDoc] = useState(null)
  const [docsOpen, setDocsOpen] = useState(false)
  const [uploading, setUploading] = useState('')

  // Sync the edit form once the user loads / changes.
  useEffect(() => {
    if (user) setForm({
      fullName: user.fullName || '', country: user.country || '', city: user.city || '', phone: user.phone || '',
      agency: user.agency || '', specialization: user.specialization || '', languages: user.languages || '', experience: user.experience || '',
      licenseType: user.licenseType || '', licenseNumber: user.licenseNumber || '', licenseExpiry: user.licenseExpiry || '',
      idType: user.idType || '', idNumber: user.idNumber || '',
    })
  }, [user])

  // Upload / replace a KYC document, then refresh the list.
  const refreshDocs = () => documentsApi.list().then((docs) => setDocuments(docs || [])).catch(() => {})
  const onUploadDoc = async (type, file) => {
    if (!file) return
    setUploading(type)
    try { await documentsApi.upload(type, file); await refreshDocs() } catch (e) { /* keep panel open */ } finally { setUploading('') }
  }

  // Pull live hero stats + stored documents.
  useEffect(() => {
    let alive = true
    realtorApi.dashboard().then((d) => { if (alive) setStats(d?.stats || null) }).catch(() => {})
    documentsApi.list().then((docs) => { if (alive) setDocuments(docs || []) }).catch(() => {})
    return () => { alive = false }
  }, [])

  // Hero stats from the realtor dashboard (honest zeros before it loads).
  const leads = stats?.leads || 0
  const deals = stats?.deals || 0
  const totalEarned = stats?.totalEarned || 0
  const heroStats = [
    { value: String(leads), label: 'Total Leads' },
    { value: String(deals), label: 'Deals Closed' },
    { value: leads ? `${Math.round((deals / leads) * 100)}%` : '0%', label: 'Conversion Rate' },
    { value: `SAR ${totalEarned.toLocaleString()}`, label: 'Total Earned' },
  ]

  // Info pills: location + agency / languages / experience where present.
  const infoPills = [
    { d: pillIcons[0], label: `${user?.city || '—'}, ${user?.country ? countryName(user.country) : '—'}` },
    { d: pillIcons[1], label: user?.agency || '—' },
    { d: pillIcons[2], label: user?.languages || '—' },
    { d: pillIcons[3], label: user?.experience || '—' },
  ]
  // Professional info (view mode): real values, "—" only when genuinely null.
  const proInfo = [
    ['Full Name', user?.fullName || '—'], ['Country', countryName(user?.country)], ['City', user?.city || '—'], ['Agency', user?.agency || '—'],
    ['Specialization', user?.specialization || '—'], ['Languages', user?.languages || '—'], ['Experience', user?.experience || '—'], ['WhatsApp', user?.phone || '—'],
  ]
  // License & verification straight from the user record.
  const license = [
    ['License Type', user?.licenseType || '—'], ['License Number', user?.licenseNumber || '—'],
    ['ID Type', user?.idType || '—'], ['ID Number', user?.idNumber || '—'],
  ]
  // Edit grid: every field here maps to a real column.
  const editFields = [
    { label: 'Full Name', key: 'fullName' }, { label: 'Country', key: 'country', country: true }, { label: 'City', key: 'city' }, { label: 'Agency', key: 'agency' },
    { label: 'Specialization', key: 'specialization' }, { label: 'Languages', key: 'languages', multi: LANG_NAMES }, { label: 'Experience', key: 'experience', select: EXP_OPTIONS }, { label: 'WhatsApp', key: 'phone' },
  ]

  // toggle a value inside a "·"-joined multi-select string (Languages)
  const toggleMulti = (key, val) => setForm((f) => {
    const cur = splitJoined(f[key])
    const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]
    return { ...f, [key]: next.join(' · ') }
  })

  const save = async () => {
    try {
      await updateProfile?.({
        fullName: form.fullName,
        country: form.country || null,
        city: form.city,
        phone: form.phone,
        agency: form.agency,
        specialization: form.specialization,
        languages: form.languages,
        experience: form.experience,
        licenseType: form.licenseType,
        licenseNumber: form.licenseNumber,
        licenseExpiry: form.licenseExpiry,
        idType: form.idType,
        idNumber: form.idNumber,
      })
      setEditing(false)
      setToast(true)
      setTimeout(() => setToast(false), 3500)
    } catch (e) {
      // Keep the editor open so the user can retry.
    }
  }

  return (
    <>
      <Topbar
        title="My Profile"
        actions={
          editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(false)} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Save Changes</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="edit" size={14} color={colors.textMuted} strokeWidth={1.8} />Edit Profile
            </button>
          )
        }
      />
      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }} className="wa-form">
        {toast && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
            <Icon name="checkCircle" size={18} color={colors.green} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Profile updated</span>
          </div>
        )}
        <div className="rp-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* LEFT */}
          <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Hero */}
            <div style={{ ...card, padding: '18px 20px' }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <UserAvatar size={96} fontSize={24} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🥉</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{user?.fullName || '—'}</span>
                    <Icon name="checkCircle" size={18} color={colors.green} strokeWidth={2} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.greenDark }}>🥉 Bronze Realtor</span>
                    <span style={{ color: colors.borderStrong }}>·</span>
                    <span style={{ fontSize: 12, color: colors.textFaint }}>Member since {joinedLabel(user?.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {infoPills.map((p, i) => (
                      <span key={i} style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}`, borderRadius: 999, padding: '4px 10px', display: 'flex', gap: 5, alignItems: 'center' }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}><path d={p.d} /></svg>
                        <span style={{ fontSize: 12, color: colors.textMuted }}>{p.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                {heroStats.map((s, i) => (
                  <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: i < 3 ? `1px solid ${colors.surfaceMuted}` : 'none' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional info */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={sectionLabel}>Professional Information</span>
              </div>
              {!editing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                  {proInfo.map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: colors.textMuted }}>{value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                  {editFields.map((f) => (
                    <div key={f.label} style={f.label === 'Specialization' || f.label === 'Languages' ? { gridColumn: 'span 2' } : null}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>{f.label}</div>
                      {f.country ? (
                        <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: colors.ink }}>
                          <option value="">—</option>
                          {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                        </select>
                      ) : f.multi ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '4px 0' }}>
                          {f.multi.map((opt) => {
                            const on = splitJoined(form[f.key]).includes(opt)
                            return (
                              <span key={opt} onClick={() => toggleMulti(f.key, opt)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: `1px solid ${on ? colors.green : colors.border}`, background: on ? colors.greenTint : '#fff', color: on ? colors.greenDark : colors.textMuted, fontWeight: on ? 600 : 400 }}>
                                {on && <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2.6}><path d="M20 6L9 17l-5-5" /></svg>}{opt}
                              </span>
                            )
                          })}
                        </div>
                      ) : f.select ? (
                        <select value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: colors.ink }}>
                          <option value="">Select</option>
                          {f.select.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: colors.ink }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* License */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={sectionLabel}>License &amp; Verification</span>
                <span onClick={() => setDocsOpen((o) => !o)} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>{docsOpen ? 'Close' : 'Update Docs'}</span>
              </div>
              {!editing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                  {license.map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: colors.textMuted }}>{value}</div>
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Expiry</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: colors.textMuted }}>{expiryLabel(user?.licenseExpiry)}</span>
                      {user?.licenseExpiry && <span style={{ fontSize: 11, color: colors.greenDark, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 999, padding: '1px 7px' }}>Valid ✓</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Verification</div>
                    <div style={{ fontSize: 13, color: colors.green }}>Verified by Waseet ✓</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>License Type</div>
                    <select value={form.licenseType} onChange={(e) => setForm({ ...form, licenseType: e.target.value })} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: colors.ink }}>
                      <option value="">Select</option>
                      {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>License Number</div>
                    <input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} placeholder="FAL-XXXX-XXXXX" style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>ID Type</div>
                    <select value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: colors.ink }}>
                      <option value="">Select</option>
                      {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>ID Number</div>
                    <input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="1XXXXXXXXX" style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>License Expiry</div>
                    <input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                </div>
              )}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 8 }}>Documents</div>
                {docsOpen && (
                  <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 8 }}>Upload or replace a document (PDF, JPG or PNG). New uploads are re-verified by Waseet.</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[['FAL_LICENSE', 'FAL License'], ['NATIONAL_ID', 'Iqama / National ID']].map(([type, label]) => (
                        <label key={type} style={{ flex: '1 1 180px', minWidth: 160, cursor: uploading ? 'default' : 'pointer' }}>
                          <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} disabled={!!uploading} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; onUploadDoc(type, f) }} />
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, border: `1px dashed ${colors.borderStrong}`, borderRadius: 8, fontSize: 12, color: colors.textMuted, background: '#fff' }}>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 5v12" /></svg>
                            {uploading === type ? 'Uploading…' : `Upload ${label}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {documents.length === 0 ? (
                  <div style={{ fontSize: 12, color: colors.textFaint, padding: '8px 0' }}>No documents uploaded yet</div>
                ) : documents.map((d) => {
                  const title = DOC_NAMES[d.type] || DOC_NAMES.OTHER
                  const chip = d.status === 'VERIFIED'
                    ? { label: 'Verified ✓', color: colors.greenDark, background: colors.greenTint, border: colors.greenTintBorder }
                    : d.status === 'REJECTED'
                      ? { label: 'Rejected', color: colors.red, background: colors.redTint, border: colors.redTintBorder }
                      : { label: 'Pending', color: colors.amberText, background: colors.amberTint, border: colors.amberTintBorder }
                  return (
                    <div key={d.id} onClick={() => setPreviewDoc({ ...d, title })} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}`, cursor: 'pointer' }}>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Icon name="fileText" size={15} color={colors.textFaint} strokeWidth={1.7} />
                        <span style={{ fontSize: 12, color: colors.textMuted }}>{title}</span>
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: chip.color, background: chip.background, border: `1px solid ${chip.border}`, borderRadius: 999, padding: '2px 8px' }}>{chip.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Performance */}
            <div style={card}>
              <div style={{ ...sectionLabel, marginBottom: 14 }}>Performance by Project</div>
              <div style={{ display: 'flex', paddingBottom: 8, borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                <span style={{ flex: 2, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Project</span>
                {['Leads', 'Deals', 'Conv.'].map((h) => <span key={h} style={{ flex: 1, textAlign: 'right', fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>{h}</span>)}
              </div>
              <div style={{ display: 'flex', padding: '10px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                <span style={{ flex: 1, fontSize: 13, color: colors.textFaint }}>No performance data yet</span>
              </div>
              <div style={{ display: 'flex', paddingTop: 10 }}>
                <span style={{ flex: 2, fontSize: 13, fontWeight: 600 }}>Total</span>
                <span style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>0</span>
                <span style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>0</span>
                <span style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>0%</span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Badge progress */}
            <div style={{ ...card, padding: '14px 16px' }}>
              <div style={{ ...rSectionLabel, marginBottom: 14 }}>Badge Progress</div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 6 }}>🥉</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Bronze Realtor</div>
                <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>0 deals closed</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Progress to Platinum 💎</div>
                <div style={{ background: colors.surfaceMuted, height: 5, borderRadius: 999, overflow: 'hidden' }}><div style={{ background: colors.green, height: '100%', width: '0%' }} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: colors.textSoft }}>0 / 10 deals</span>
                  <span style={{ fontSize: 11, color: colors.green, fontWeight: 500 }}>10 more</span>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${colors.surfaceMuted}`, paddingTop: 14 }}>
                {tiers.map((t, i) => (
                  <div key={t.name} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${colors.surfaceMuted}` : 'none' }}>
                    <span style={{ fontSize: 18 }}>{t.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint }}>{t.req}</div>
                    </div>
                    <span style={{ fontSize: t.current ? 11 : 14, fontWeight: t.current ? 600 : 400, color: t.statusColor }}>{t.status}</span>
                  </div>
                ))}
              </div>
              <div onClick={() => navigate('/realtor/badge')} style={{ fontSize: 12, color: colors.greenDark, textAlign: 'center', marginTop: 12, cursor: 'pointer' }}>View Badge Details →</div>
            </div>

            {/* Bank */}
            <div style={{ ...card, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={rSectionLabel}>Bank Details</span>
                <span onClick={() => navigate('/realtor/bank')} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Edit</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{user?.bankName || '—'}</div>
              <div style={{ fontSize: 12, color: colors.textSoft }}>IBAN: {user?.iban || '—'}</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 3 }}>{user?.bankCountry || '—'}</div>
              <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="lock" size={12} color={colors.textFaint} strokeWidth={1.8} />Stored encrypted
              </div>
            </div>

            {/* Account */}
            <div style={{ ...card, padding: '14px 16px' }}>
              <div style={{ ...rSectionLabel, marginBottom: 12 }}>Account</div>
              {[['Email', user?.email || '—', false], ['Password', 'Change Password', true], ['Notifications', 'Manage →', true], ['Language', 'Arabic / English', false]].map(([label, value, link], i) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${colors.surfaceMuted}` : 'none' }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{label}</span>
                  <span style={{ fontSize: 12, color: link ? colors.greenDark : colors.textFaint, cursor: link ? 'pointer' : 'default' }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.red, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Danger zone</div>
                <button style={{ width: '100%', height: 32, background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 7, fontSize: 12, color: colors.red, fontFamily: 'inherit', cursor: 'pointer' }}>Request Account Deletion</button>
                <div style={{ fontSize: 10, color: colors.textFaint, textAlign: 'center', marginTop: 6 }}>Account deletion takes 30 days to process</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </>
  )
}
