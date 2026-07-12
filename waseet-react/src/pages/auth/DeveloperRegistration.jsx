import React, { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Label, TextInput, SelectInput, Section, CheckBox, StepIndicator, Dropzone, PhoneField } from './RegistrationKit'
import { authApi, documentsApi, setAccessToken } from '../../lib/api'

const checkLabels = [
  "I agree to Waseet's Terms & Conditions",
  'All information provided is accurate',
  'I understand Waseet charges a platform commission on all closed deals',
  'I agree to provide valid NOC documents for all listed projects',
]
const timeline = [
  { title: 'Application received', sub: 'Just now', done: true },
  { title: 'Admin review', sub: 'Within 24 hours', done: false },
  { title: 'Account approved', sub: "We'll email you", done: false },
  { title: 'Add your first project', sub: 'After approval', done: false },
]
const countryMap = { 'Saudi Arabia': 'SA', UAE: 'AE', Pakistan: 'PK' }
const phoneMeta = { 'Saudi Arabia': { flag: '🇸🇦', code: '+966' }, UAE: { flag: '🇦🇪', code: '+971' }, Pakistan: { flag: '🇵🇰', code: '+92' } }

export default function DeveloperRegistration() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ companyName: '', country: 'Saudi Arabia', city: '', contactName: '', email: '', phone: '' })
  const [tradeLicense, setTradeLicense] = useState(null)
  const [companyProfile, setCompanyProfile] = useState(null)
  const [logo, setLogo] = useState(null) // { key, url }
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const logoInputRef = useRef(null)
  const [checks, setChecks] = useState([false, false, false, false])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const onLogoFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLogoError('')
    setLogoUploading(true)
    try {
      const res = await authApi.uploadLogo(file)
      setLogo({ key: res.key, url: res.url })
    } catch (err) {
      setLogoError(err?.message || 'Upload failed. Use JPG, PNG or WEBP up to 5MB.')
    } finally {
      setLogoUploading(false)
    }
  }
  const toggle = (i) => setChecks(checks.map((v, j) => (j === i ? !v : v)))
  const allChecked = checks.every(Boolean)
  const pm = phoneMeta[form.country]

  const onSubmit = async () => {
    if (loading) return
    setError('')
    if (!form.companyName.trim() || !form.contactName.trim() || !form.email.trim() || !form.city.trim() || !form.phone.trim()) {
      return setError('Please fill all required fields.')
    }
    if (!tradeLicense) return setError('Please upload your Trade License / CR certificate.')
    if (!allChecked) return setError('Please accept all terms to continue.')

    setLoading(true)
    try {
      const res = await authApi.registerDeveloper({
        email: form.email.trim(),
        fullName: form.companyName.trim(),
        phone: `${pm.code} ${form.phone.trim()}`,
        country: countryMap[form.country],
        city: form.city.trim(),
        avatarKey: logo?.key,
      })
      setAccessToken(res.accessToken)
      await documentsApi.upload('TRADE_LICENSE', tradeLicense)
      if (companyProfile) await documentsApi.upload('OTHER', companyProfile)
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
          <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 20px', animation: 'pd-pop .3s ease-out' }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l2.5 2.5L16 9" />
          </svg>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Application submitted! 🎉</div>
          <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.7, marginBottom: 28 }}>
            We received your developer application. Our team reviews within 24 hours. Check your email for updates.
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
            Already have an account? <Link to="/login" style={{ color: colors.greenDark, cursor: 'pointer' }}>Sign in</Link>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Create developer account</h1>
        <p style={{ fontSize: 13, color: colors.textSoft, margin: '0 0 28px' }}>Join 50+ verified developers on Waseet</p>

        <StepIndicator labels={['Company', 'Contact', 'Documents', 'Agreement']} activeIndex={0} />

        {/* 01 Company */}
        <Section num="01" title="Company information">
          <div style={{ marginBottom: 12 }}>
            <Label>Company Logo (optional)</Label>
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onLogoFile} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div onClick={() => { if (!logoUploading) logoInputRef.current?.click() }} style={{ width: 56, height: 56, borderRadius: 10, flexShrink: 0, border: `1px solid ${colors.border}`, background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: logoUploading ? 'default' : 'pointer' }}>
                {logo ? <img src={logo.url} alt="Company logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="upload" size={20} color={colors.borderStrong} strokeWidth={1.6} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button type="button" onClick={() => { if (!logoUploading) logoInputRef.current?.click() }} disabled={logoUploading} style={{ height: 30, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: logoUploading ? 'default' : 'pointer' }}>{logoUploading ? 'Uploading…' : logo ? 'Change logo' : 'Upload logo'}</button>
                  {logo && !logoUploading && <span onClick={() => setLogo(null)} style={{ fontSize: 12, color: colors.red, cursor: 'pointer' }}>Remove</span>}
                </div>
                <div style={{ fontSize: 11, color: logoError ? colors.red : colors.textFaint }}>{logoError || 'JPG, PNG or WEBP · max 5MB'}</div>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Label>Company Name *</Label>
            <TextInput value={form.companyName} onChange={set('companyName')} placeholder="Al Faisal Real Estate Development" />
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
            <Label icon="info">REGA License Number *</Label>
            <TextInput placeholder="REGA-2024-12345" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <Label>CR / Trade License *</Label>
              <TextInput placeholder="1234567890" />
            </div>
            <div>
              <Label>Website (optional)</Label>
              <TextInput placeholder="https://company.com" />
            </div>
          </div>
          <div>
            <Label>Years in Business</Label>
            <SelectInput defaultValue="Select"><option>Select</option><option>Less than 1 year</option><option>1–3 years</option><option>3–5 years</option><option>5–10 years</option><option>10+ years</option></SelectInput>
          </div>
        </Section>

        {/* 02 Contact person */}
        <Section num="02" title="Contact person">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <Label>Full Name *</Label>
              <TextInput value={form.contactName} onChange={set('contactName')} placeholder="Mohammed Al-Faisal" />
            </div>
            <div>
              <Label>Designation *</Label>
              <TextInput placeholder="Sales Director" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Label>Phone Number *</Label>
            <PhoneField flag={pm.flag} code={pm.code} value={form.phone} onChange={set('phone')} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Label>Email Address *</Label>
            <div style={{ position: 'relative' }}>
              <Icon name="mail" size={14} color={colors.textFaint} strokeWidth={1.7} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <TextInput value={form.email} onChange={set('email')} placeholder="m.faisal@company.com" style={{ padding: '0 10px 0 34px' }} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="info" size={13} color={colors.textFaint} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>No password needed now. Once an admin approves your account, you'll get an email to set your password.</span>
          </div>
        </Section>

        {/* 03 Documents */}
        <Section num="03" title="Required documents">
          <Dropzone
            icon="upload"
            title="Trade License / CR Certificate *"
            sub="Click to browse"
            note="PDF, JPG, PNG · max 10MB"
            file={tradeLicense}
            onFile={setTradeLicense}
            onRemove={() => setTradeLicense(null)}
          />
          <Dropzone
            icon="upload"
            title="Company Profile (optional)"
            sub="Click to browse"
            note="PDF, JPG, PNG · max 10MB"
            file={companyProfile}
            onFile={setCompanyProfile}
            onRemove={() => setCompanyProfile(null)}
          />
        </Section>

        {/* 04 Agreement */}
        <Section num="04" title="Terms & agreement" style={{ marginBottom: 20 }}>
          {checkLabels.map((label, i) => (
            <div key={i} onClick={() => toggle(i)} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, cursor: 'pointer' }}>
              <CheckBox on={checks[i]} marginTop={1} />
              <span style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>{label}</span>
            </div>
          ))}
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
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
          <div style={{ fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: 12 }}>Your data is stored securely per our Privacy Policy</div>
        </Section>
      </div>
    </div>
  )
}
