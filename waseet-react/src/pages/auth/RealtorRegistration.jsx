import React, { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { colors, radius } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Label, Hint, TextInput, SelectInput, Section, CheckBox, Pill, StepIndicator, Dropzone, PhoneField } from './RegistrationKit'
import { authApi, documentsApi, setAccessToken } from '../../lib/api'

const langNames = ['Arabic', 'English', 'Urdu', 'Hindi', 'French']
const specNames = ['Apartments', 'Villas', 'Offices', 'Townhouses', 'Land', 'All types']
const checkLabels = [
  "I agree to Waseet's Terms & Conditions",
  'My license details are accurate and valid',
  'I will not share client data outside Waseet',
  'I understand the commission structure and badge system',
]
const timeline = [
  { title: 'Application received', sub: 'Just now', done: true },
  { title: 'License verification', sub: 'Within 24 hours', done: false },
  { title: 'Account approved', sub: "We'll email you", done: false },
  { title: 'Start earning commissions', sub: 'After approval', done: false },
]
const countryMap = { 'Saudi Arabia': 'SA', UAE: 'AE', Pakistan: 'PK' }
const phoneMeta = { 'Saudi Arabia': { flag: '🇸🇦', code: '+966' }, UAE: { flag: '🇦🇪', code: '+971' }, Pakistan: { flag: '🇵🇰', code: '+92' } }

export default function RealtorRegistration() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', country: 'Saudi Arabia', city: '', email: '', phone: '' })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [falLicense, setFalLicense] = useState(null)
  const [nationalId, setNationalId] = useState(null)
  const [langs, setLangs] = useState([true, true, false, false, false])
  const [specs, setSpecs] = useState([false, false, false, false, false, true])
  const [checks, setChecks] = useState([false, false, false, false])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const photoRef = useRef(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggle = (arr, setArr, i) => setArr(arr.map((v, j) => (j === i ? !v : v)))
  const toggleCheck = (i) => setChecks(checks.map((v, j) => (j === i ? !v : v)))
  const allChecked = checks.every(Boolean)
  const pm = phoneMeta[form.country]

  const onSubmit = async () => {
    if (loading) return
    setError('')
    if (!form.fullName.trim() || !form.email.trim() || !form.city.trim() || !form.phone.trim()) {
      return setError('Please fill all required fields.')
    }
    if (!falLicense) return setError('Please upload your Real Estate License document.')
    if (!allChecked) return setError('Please accept all terms to continue.')

    setLoading(true)
    try {
      const res = await authApi.registerRealtor({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: `${pm.code} ${form.phone.trim()}`,
        country: countryMap[form.country],
        city: form.city.trim(),
      })
      setAccessToken(res.accessToken)
      if (profilePhoto) await documentsApi.upload('PROFILE_PHOTO', profilePhoto)
      await documentsApi.upload('FAL_LICENSE', falLicense)
      if (nationalId) await documentsApi.upload('NATIONAL_ID', nationalId)
      setSubmitted(true)
      window.scrollTo(0, 0)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ fontFamily: 'Inter, sans-serif', color: colors.ink, background: colors.bg, minHeight: '100vh' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
          <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', animation: 'pd-pop .3s ease-out' }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l2.5 2.5L16 9" />
          </svg>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You're almost in! 🎉</div>
          <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.7, marginBottom: 24 }}>
            We received your realtor application. Our team verifies your license and documents within 24 hours. Check your email for updates.
          </div>
          <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', marginBottom: 24 }}>
            <span style={{ fontSize: 28 }}>🥉</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Bronze Realtor — unlocked</div>
              <div style={{ fontSize: 12, color: colors.textSoft }}>Once approved, you'll access all marketplace projects</div>
            </div>
          </div>
          <div style={{ textAlign: 'left', maxWidth: 320, margin: '0 auto' }}>
            {timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 16, position: 'relative' }}>
                {i !== timeline.length - 1 && <div style={{ position: 'absolute', left: 9, top: 20, width: 1, height: '100%', background: colors.border }} />}
                <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, background: t.done ? colors.green : '#fff', border: t.done ? 'none' : `1px solid ${colors.border}` }}>
                  {t.done && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M5 12l4 4L19 7" /></svg>}
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <button onClick={() => navigate('/login')} style={{ height: 36, background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Continue to Login</button>
            <button onClick={() => navigate('/')} style={{ height: 36, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Back to Home</button>
          </div>
          <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 16 }}>Questions? support@waseet.io</div>
        </div>
      </div>
    )
  }

  return (
    <div className="wa-form" style={{ fontFamily: 'Inter, sans-serif', color: colors.ink, background: colors.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" /><circle cx="12" cy="11" r="2.4" /></svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>waseet</span>
          </Link>
          <div style={{ fontSize: 12, color: colors.textSoft }}>
            Already registered? <Link to="/login" style={{ color: colors.greenDark, cursor: 'pointer' }}>Sign in</Link>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Create realtor account</h1>
        <p style={{ fontSize: 13, color: colors.textSoft, margin: '0 0 28px' }}>Join 200+ licensed realtors on Waseet</p>

        <StepIndicator labels={['Personal', 'Professional', 'Documents', 'Agreement']} activeIndex={0} />

        {/* Photo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <input
            ref={photoRef}
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) setProfilePhoto(f)
            }}
          />
          <div onClick={() => photoRef.current?.click()} style={{ width: 120, height: 120, border: `2px dashed ${colors.borderStrong}`, borderRadius: '50%', background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
            {profilePhoto ? (
              <img src={URL.createObjectURL(profilePhoto)} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={1.5}><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 12 0v1" /></svg>
            )}
          </div>
          <div onClick={() => photoRef.current?.click()} style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted, marginTop: 10, cursor: 'pointer' }}>{profilePhoto ? 'Change photo' : 'Upload your photo'}</div>
          <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>Face must be clearly visible</div>
          <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>JPG, PNG · max 5MB</div>
        </div>

        {/* 01 Personal */}
        <Section num="01" title="Personal information">
          <div style={{ marginBottom: 12 }}>
            <Label>Full Name *</Label>
            <TextInput value={form.fullName} onChange={set('fullName')} placeholder="Ahmed Mohammed Al-Rashid" />
            <Hint>As it appears on your ID</Hint>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <Label>Country *</Label>
              <SelectInput value={form.country} onChange={set('country')}><option>Saudi Arabia</option><option>UAE</option><option>Pakistan</option></SelectInput>
            </div>
            <div>
              <Label>City *</Label>
              <TextInput value={form.city} onChange={set('city')} placeholder="Jeddah" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Label>Email Address *</Label>
            <div style={{ position: 'relative' }}>
              <Icon name="mail" size={14} color={colors.textFaint} strokeWidth={1.7} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <TextInput value={form.email} onChange={set('email')} placeholder="ahmed@example.com" style={{ padding: '0 10px 0 34px' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <Label>Iqama / National ID *</Label>
            <TextInput placeholder="1XXXXXXXXX" />
            <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>10 digits starting with 1 or 2</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
              <Icon name="lock" size={13} color={colors.textFaint} strokeWidth={1.8} />
              <span style={{ fontSize: 12, color: colors.textFaint }}>Stored encrypted — never shown publicly</span>
            </div>
          </div>
          <div>
            <Label>Languages spoken</Label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {langNames.map((l, i) => (
                <label key={l} onClick={() => toggle(langs, setLangs, i)} style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                  <CheckBox on={langs[i]} />
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{l}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* 02 Professional */}
        <Section num="02" title="Professional information">
          <div style={{ marginBottom: 12 }}>
            <Label icon="info">FAL License Number *</Label>
            <TextInput placeholder="FAL-XXXX-XXXXX" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <Label>License Expiry *</Label>
              <TextInput placeholder="MM / YYYY" />
            </div>
            <div>
              <Label>Years of Experience *</Label>
              <SelectInput defaultValue="Select"><option>Select</option><option>Less than 1 year</option><option>1–3 years</option><option>3–5 years</option><option>5–10 years</option><option>10+ years</option></SelectInput>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Label>Specialization</Label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {specNames.map((p, i) => (
                <Pill key={p} label={p} on={specs[i]} onClick={() => toggle(specs, setSpecs, i)} />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Label>Agency / Company Name</Label>
            <TextInput placeholder="Al-Rashid Real Estate" />
            <Hint>Leave blank if independent</Hint>
          </div>
          <div>
            <Label>WhatsApp Number *</Label>
            <PhoneField flag={pm.flag} code={pm.code} value={form.phone} onChange={set('phone')} />
            <Hint>Used by Platinum-level developers to contact you</Hint>
          </div>
        </Section>

        {/* 03 Documents */}
        <Section num="03" title="Required documents">
          <Dropzone
            icon="upload"
            title="Real Estate License Document *"
            sub="FAL / RERA / DLD — clear photo or scan"
            note="PDF, JPG, PNG · max 50MB"
            file={falLicense}
            onFile={setFalLicense}
            onRemove={() => setFalLicense(null)}
          />
          <Dropzone
            icon="upload"
            title="Iqama / National ID (optional)"
            sub="Click to browse"
            note="PDF, JPG, PNG · max 10MB"
            file={nationalId}
            onFile={setNationalId}
            onRemove={() => setNationalId(null)}
          />
        </Section>

        {/* 04 Agreement */}
        <Section num="04" title="Terms & agreement" style={{ marginBottom: 20 }}>
          {checkLabels.map((label, i) => (
            <div key={i} onClick={() => toggleCheck(i)} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, cursor: 'pointer' }}>
              <CheckBox on={checks[i]} marginTop={1} />
              <span style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>{label}</span>
            </div>
          ))}
          <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 8 }}>You'll start as:</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>🥉</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Bronze Realtor</div>
                <div style={{ fontSize: 11, color: colors.textFaint }}>Upgrade by closing deals</div>
              </div>
              <span style={{ fontSize: 14, opacity: 0.4 }}>🥈 🥇 💎</span>
            </div>
            <div style={{ height: 3, background: colors.surfaceMuted, borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: '5%', height: '100%', background: colors.green }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: colors.textFaint, marginTop: 4 }}>
              <span>Bronze</span><span>Silver</span><span>Gold</span><span>Platinum</span>
            </div>
          </div>
          {error && (
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '9px 12px', marginBottom: 12, display: 'flex', gap: 7, alignItems: 'center' }}>
              <Icon name="alertCircle" size={14} color={colors.red} strokeWidth={2} />
              <span style={{ fontSize: 12, color: colors.red }}>{error}</span>
            </div>
          )}
          <button
            onClick={onSubmit}
            disabled={loading}
            style={{ width: '100%', height: 36, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: loading ? colors.textFaint : colors.green, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'pd-spin .7s linear infinite' }} />}
            {loading ? 'Creating account…' : 'Create Realtor Account'}
          </button>
          <div style={{ fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: 10 }}>Secured per our Privacy Policy · PDPL compliant</div>
        </Section>
      </div>
    </div>
  )
}
