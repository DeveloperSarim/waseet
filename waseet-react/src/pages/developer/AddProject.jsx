import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { developerApi } from '../../lib/api'
import { MapPicker } from '../../components/MapPicker'
import { ProjectProgressEditor } from '../../components/ProjectProgressEditor'

// Cities available in the design → their country code (payload needs SA/AE/PK).
const CITY_COUNTRY = { Jeddah: 'SA', Riyadh: 'SA', Dammam: 'SA', Mecca: 'SA', Dubai: 'AE', 'Abu Dhabi': 'AE' }
const toInt = (v) => parseInt(String(v || '').replace(/[^0-9]/g, ''), 10) || 0

const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 7px)'
const stepLabels = ['Basic Info', 'Unit Types', 'Content', 'Media', 'Review']
const inputStyle = { width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', color: colors.ink, background: '#fff' }
const selStyle = { ...inputStyle, color: colors.textMuted }
const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }
const cardLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }
const fieldLabel = { fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }

const amenityDefs = [
  ['🏊', 'Swimming Pool'], ['🏋️', 'Gymnasium'], ['🛡️', '24/7 Security'], ['🅿️', 'Parking'],
  ['🌳', 'Garden'], ['🛗', 'Elevators'], ['🏬', 'Retail'], ['🧒', 'Kids Area'],
  ['🧖', 'Sauna'], ['♿', 'Accessible'], ['🏠', 'Smart Home'], ['🌊', 'Sea View'],
]
const rteTools = ['B', 'I', 'U', '•', '1.']
const landmarks = [
  { cat: 'School', name: 'Al-Noor International School', dist: '0.5 km' },
  { cat: 'Hospital', name: 'Al-Hamra Medical Center', dist: '1.2 km' },
  { cat: 'Mall', name: 'Red Sea Mall', dist: '2.0 km' },
]
const docsList = [
  { name: 'Project Brochure', meta: 'PDF · 4.2 MB', done: true },
  { name: 'Payment Plan', meta: 'PDF · 1.8 MB', done: true },
  { name: 'NOC Document', meta: 'Required', done: false },
  { name: 'Floor Plans', meta: 'Required', done: false },
]
const timeline = [
  { title: 'Submitted for review', sub: 'Just now', done: true },
  { title: 'Admin content review', sub: 'Within 24 hours', done: false },
  { title: 'Project goes live', sub: 'After approval', done: false },
  { title: 'Realtors start submitting leads', sub: 'Once live', done: false },
]

function Field({ label, children }) {
  return (
    <div>
      <div style={fieldLabel}>{label}</div>
      {children}
    </div>
  )
}

function Stepper({ step, goTo }) {
  return (
    <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '14px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: 640, margin: '0 auto' }}>
        {stepLabels.map((label, i) => {
          const n = i + 1
          const done = n < step
          const active = n === step
          const node = done
            ? { background: colors.green, color: '#fff', border: 'none' }
            : active
            ? { background: colors.ink, color: '#fff', border: 'none' }
            : { background: '#fff', border: `1px solid ${colors.border}`, color: colors.textFaint }
          return (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{ height: 1, flex: 1, background: i === 0 ? 'transparent' : n <= step ? colors.green : colors.border }} />
                <div onClick={() => goTo(n)} style={{ width: 28, height: 28, minWidth: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer', ...node }}>
                  {done ? '✓' : n}
                </div>
                <div style={{ height: 1, flex: 1, background: i === stepLabels.length - 1 ? 'transparent' : n < step ? colors.green : colors.border }} />
              </div>
              <span style={{ fontSize: 10, marginTop: 6, whiteSpace: 'nowrap', color: done ? colors.green : active ? colors.ink : colors.textFaint }}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AddProject() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [amenities, setAmenities] = useState(() => amenityDefs.map(() => false))
  const emptyUnit = { type: '', count: '', sizeMin: '', sizeMax: '', priceMin: '', priceMax: '', comm: '' }
  const [units, setUnits] = useState([{ ...emptyUnit }])
  const setUnit = (i, k, v) => setUnits(units.map((u, j) => (j === i ? { ...u, [k]: v } : u)))
  const [progress, setProgress] = useState({
    progressPercent: 0,
    timeline: [
      { label: 'Planning', date: '', state: 'todo' },
      { label: 'Foundation', date: '', state: 'todo' },
      { label: 'Construction', date: '', state: 'todo' },
      { label: 'Handover', date: '', state: 'todo' },
    ],
    paymentPlan: [
      { pct: 20, title: 'Down payment', sub: 'On signing' },
      { pct: 60, title: 'During construction', sub: 'Quarterly instalments' },
      { pct: 20, title: 'On handover', sub: '' },
    ],
  })

  // controlled fields that map onto the createProject payload
  const [title, setTitle] = useState('')
  const [ptype, setPtype] = useState('Apartments')
  const [city, setCity] = useState('Jeddah')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [imageKey, setImageKey] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [gallery, setGallery] = useState([]) // [{key,url}]
  const [masterPlan, setMasterPlan] = useState(null) // {key,filename,size}
  const [documents, setDocuments] = useState({}) // { 'Project Brochure': {key,filename,size}, ... }
  const [floorPlans, setFloorPlans] = useState([]) // [{ label, key, filename, size, url }]
  const [busyDoc, setBusyDoc] = useState('') // which doc/master is uploading
  const [handover, setHandover] = useState('')
  const [location, setLocation] = useState(null) // { lat, lng, address }
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [createdId, setCreatedId] = useState(null) // once saved, reuse for further saves
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const onPickImage = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true); setError('')
    try {
      for (const file of files) {
        const res = await developerApi.uploadProjectImage(file)
        setGallery((g) => [...g, { key: res.key, url: res.url }])
        // first uploaded image is the cover
        setImageKey((k) => k || res.key)
        setImageUrl((u) => u || res.url)
      }
    } catch (err) {
      setError(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // programmatic file picker (no per-item refs needed)
  const pickFile = (accept, onFile) => {
    const inp = document.createElement('input')
    inp.type = 'file'; inp.accept = accept
    inp.onchange = () => { if (inp.files && inp.files[0]) onFile(inp.files[0]) }
    inp.click()
  }
  const uploadMaster = () => pickFile('application/pdf,image/*', async (file) => {
    setBusyDoc('master'); setError('')
    try { const res = await developerApi.uploadProjectImage(file); setMasterPlan({ key: res.key, filename: res.filename, size: res.size, url: res.url }) }
    catch (err) { setError(err.message || 'Upload failed') } finally { setBusyDoc('') }
  })
  const uploadDoc = (name) => pickFile('application/pdf,image/*', async (file) => {
    setBusyDoc(name); setError('')
    try { const res = await developerApi.uploadProjectImage(file); setDocuments((d) => ({ ...d, [name]: { key: res.key, filename: res.filename, size: res.size, url: res.url } })) }
    catch (err) { setError(err.message || 'Upload failed') } finally { setBusyDoc('') }
  })
  const uploadFloorPlan = () => pickFile('application/pdf,image/*', async (file) => {
    setBusyDoc('floorPlan'); setError('')
    try {
      const res = await developerApi.uploadProjectImage(file)
      setFloorPlans((fp) => {
        const unitType = units.map((u) => u.type).filter(Boolean)[fp.length]
        const label = unitType ? `${unitType} Floor Plan` : `Floor Plan ${fp.length + 1}`
        return [...fp, { label, key: res.key, filename: res.filename, size: res.size, url: res.url }]
      })
    } catch (err) { setError(err.message || 'Upload failed') } finally { setBusyDoc('') }
  })
  const fmtSize = (b) => (b == null ? '' : b / 1048576 >= 0.1 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

  // status: 'DRAFT' (Save as Draft) | 'PENDING' (Submit for review)
  const submit = async (status = 'PENDING') => {
    if (!title.trim()) { setError('Project name is required'); setStep(1); return }
    setSaving(true); setError('')
    const prices = units.map((u) => ({ min: toInt(u.priceMin), max: toInt(u.priceMax) })).filter((p) => p.min || p.max)
    const priceFrom = prices.length ? Math.min(...prices.map((p) => p.min || p.max)) : 0
    const priceTo = prices.length ? Math.max(...prices.map((p) => p.max || p.min)) : 0
    const payload = {
      title: title.trim(),
      city,
      country: CITY_COUNTRY[city] || 'SA',
      type: ptype,
      bedrooms: units.map((u) => u.type).filter(Boolean).join(', '),
      priceFrom,
      priceTo,
      commissionPct: parseFloat(units[0]?.comm) || 0,
      location: location?.address || [area.trim(), address.trim()].filter(Boolean).join(', '),
      address: location?.address || address.trim() || null,
      latitude: location?.lat ?? null,
      longitude: location?.lng ?? null,
      mapLink: location?.lat != null ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : '',
      description: description.trim(),
      details: {
        units: units.filter((u) => u.type || u.priceMin || u.priceMax),
        amenities: amenities.map((on, i) => (on ? amenityDefs[i]?.[1] : null)).filter(Boolean),
        handover,
        images: gallery.map((g) => g.key),
        masterPlanKey: masterPlan?.key || null,
        masterPlanName: masterPlan?.filename || null,
        documents: Object.fromEntries(Object.entries(documents).map(([k, v]) => [k, { key: v.key, filename: v.filename, size: v.size }])),
        floorPlans: floorPlans.map((f) => ({ label: f.label, key: f.key, filename: f.filename, size: f.size })),
        progressPercent: Number(progress.progressPercent) || 0,
        timeline: progress.timeline,
        paymentPlan: progress.paymentPlan.map((p) => ({ ...p, pct: Number(p.pct) || 0 })),
      },
      status,
    }
    payload.imageKey = gallery[0]?.key || imageKey || null
    try {
      // reuse the same record across draft saves so we don't create duplicates
      const saved = createdId
        ? await developerApi.updateProject(createdId, payload)
        : await developerApi.createProject(payload)
      setCreatedId(saved.id)
      if (status === 'PENDING') setSubmitted(true)
      else navigate('/developer/projects')
    } catch (err) {
      setError(err.message || 'Could not save project')
    } finally {
      setSaving(false)
    }
  }
  const saveDraft = () => submit('DRAFT')

  const next = () => (step < 5 ? setStep(step + 1) : submit('PENDING'))

  if (submitted) {
    return (
      <>
        <Topbar left={<span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Add New Project</span>} />
        <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ maxWidth: 480, padding: '48px 24px', textAlign: 'center' }}>
            <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l2.5 2.5L16 9" /></svg>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Project submitted! 🎉</div>
            <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.7, marginBottom: 24 }}>{title.trim() || 'Your project'} is under review. Our team approves within 24 hours.</div>
            <div style={{ textAlign: 'left', maxWidth: 320, margin: '0 auto' }}>
              {timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 16, position: 'relative' }}>
                  {i !== timeline.length - 1 && <div style={{ position: 'absolute', left: 9, top: 20, width: 1, height: '100%', background: colors.border }} />}
                  <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, background: t.done ? colors.green : '#fff', border: t.done ? 'none' : `1px solid ${colors.border}` }}>
                    {t.done && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M5 12l4 4L19 7" /></svg>}
                  </div>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div><div style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>{t.sub}</div></div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <button onClick={() => navigate('/developer/projects')} style={{ height: 36, background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>View My Projects</button>
              <button onClick={() => { setSubmitted(false); setStep(1) }} style={{ height: 36, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Add Another Project</button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar
        left={<span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Add New Project</span>}
        actions={<span style={{ fontSize: 13, color: colors.textFaint }}>Step {step} of 5</span>}
      />
      <Stepper step={step} goTo={setStep} />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }} className="wa-form">
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 24px' }}>
          {error && step !== 5 && (
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: colors.red }}>{error}</div>
          )}
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div style={card}>
                <div style={cardLabel}>Basic Information</div>
                <div style={{ marginBottom: 12 }}><Field label="Project Name *"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Palm Residence" style={inputStyle} /></Field></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <Field label="Project Type *"><select value={ptype} onChange={(e) => setPtype(e.target.value)} style={selStyle}><option>Apartments</option><option>Villas</option><option>Offices</option><option>Townhouses</option><option>Mixed</option></select></Field>
                  <Field label="Development Status *"><select defaultValue="Under Construction" style={selStyle}><option>Under Construction</option><option>Ready</option><option>Off-plan</option></select></Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <Field label="Expected Handover *"><input placeholder="Q4 2027" style={inputStyle} /></Field>
                  <Field label="Completion %"><input placeholder="68" style={inputStyle} /></Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Total Floors"><input placeholder="12" style={inputStyle} /></Field>
                  <Field label="Total Units"><input placeholder="96" style={inputStyle} /></Field>
                </div>
              </div>
              <div style={{ ...card, marginBottom: 0 }}>
                <div style={cardLabel}>Location</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <Field label="City *"><select value={city} onChange={(e) => setCity(e.target.value)} style={selStyle}><option>Jeddah</option><option>Riyadh</option><option>Dammam</option><option>Mecca</option><option>Dubai</option><option>Abu Dhabi</option></select></Field>
                  <Field label="Area / Neighborhood *"><input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Al Rawdhah" style={inputStyle} /></Field>
                </div>
                <div style={{ marginBottom: 12 }}><Field label="Full Address *"><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street name, district, postal code" style={inputStyle} /></Field></div>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Pin location on map</div>
                <MapPicker value={location} onChange={setLocation} height={280} />
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              {units.map((u, i) => (
                <div key={i} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Unit Type</span>
                    <span onClick={() => setUnits(units.filter((_, j) => j !== i))} style={{ fontSize: 12, color: colors.red, cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}>× Remove</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <Field label="Type *"><select value={u.type} onChange={(e) => setUnit(i, 'type', e.target.value)} style={selStyle}><option value="">Select type…</option><option>Studio</option><option>1BR</option><option>2BR</option><option>3BR</option><option>4BR</option><option>Penthouse</option><option>Townhouse</option><option>Villa</option><option>Office</option></select></Field>
                    <Field label="Available Units *"><input value={u.count} onChange={(e) => setUnit(i, 'count', e.target.value)} placeholder="e.g. 8" style={inputStyle} /></Field>
                    <Field label="Size (m²)">
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input value={u.sizeMin} onChange={(e) => setUnit(i, 'sizeMin', e.target.value)} placeholder="min" style={inputStyle} /><span style={{ fontSize: 12, color: colors.textFaint }}>to</span><input value={u.sizeMax} onChange={(e) => setUnit(i, 'sizeMax', e.target.value)} placeholder="max" style={inputStyle} />
                      </div>
                    </Field>
                    <Field label="Price (SAR)">
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input value={u.priceMin} onChange={(e) => setUnit(i, 'priceMin', e.target.value)} placeholder="from" style={inputStyle} /><span style={{ fontSize: 12, color: colors.textFaint }}>to</span><input value={u.priceMax} onChange={(e) => setUnit(i, 'priceMax', e.target.value)} placeholder="to" style={inputStyle} />
                      </div>
                    </Field>
                  </div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}`, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: colors.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} /></span>
                      <span style={{ fontSize: 13, color: colors.textMuted }}>Percentage</span>
                    </span>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', border: `1.5px solid ${colors.borderStrong}` }} />
                      <span style={{ fontSize: 13, color: colors.textMuted }}>Fixed Amount</span>
                    </span>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input value={u.comm} onChange={(e) => setUnit(i, 'comm', e.target.value)} placeholder="3" style={{ ...inputStyle, width: 64, textAlign: 'right' }} /><span style={{ fontSize: 13, color: colors.textMuted }}>%</span>
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: colors.textFaint }}>Realtor earns ~SAR {(parseInt((u.priceMin || '0').replace(/,/g, '')) * (parseFloat(u.comm) || 0) / 100).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div onClick={() => setUnits([...units, { ...emptyUnit }])} style={{ border: `2px dashed ${colors.borderStrong}`, borderRadius: 10, padding: 12, textAlign: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: 13, color: colors.textFaint }}>+ Add unit type</span>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div style={card}>
                <div style={cardLabel}>Project Description</div>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '7px 10px', display: 'flex', gap: 2 }}>
                    {rteTools.map((t) => <span key={t} style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textFaint, fontSize: 13, cursor: 'pointer' }}>{t}</span>)}
                  </div>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Palm Residence is a premium waterfront development in Al Rawdhah, Jeddah, offering 96 thoughtfully designed apartments across 12 floors. Each unit features sea views, smart-home integration, and access to resort-grade amenities." style={{ width: '100%', minHeight: 140, border: 'none', outline: 'none', padding: '10px 14px', fontSize: 13, color: colors.textMuted, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical' }} />
                  <div style={{ borderTop: `1px solid ${colors.surfaceMuted}`, padding: '6px 10px', display: 'flex', justifyContent: 'flex-end' }}><span style={{ fontSize: 11, color: colors.textFaint }}>{description.length} / 100 minimum</span></div>
                </div>
              </div>
              <div style={card}>
                <div style={cardLabel}>Amenities</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                  {amenityDefs.map(([icon, label], i) => {
                    const on = amenities[i]
                    return (
                      <div key={label} onClick={() => setAmenities(amenities.map((v, j) => (j === i ? !v : v)))} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${on ? colors.green : colors.border}`, background: on ? colors.greenTint : '#fff' }}>
                        <span style={{ width: 16, height: 16, minWidth: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? colors.green : '#fff', border: `1.5px solid ${on ? colors.green : colors.borderStrong}` }}>
                          {on && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M5 12l4 4L19 7" /></svg>}
                        </span>
                        <span style={{ fontSize: 14 }}>{icon}</span>
                        <span style={{ fontSize: 12, color: on ? colors.greenDarker : colors.textMuted }}>{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={card}>
                <div style={cardLabel}>Nearby Landmarks</div>
                {landmarks.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <select defaultValue={m.cat} style={{ ...selStyle, width: 130 }}><option>{m.cat}</option><option>School</option><option>Hospital</option><option>Mall</option><option>Mosque</option></select>
                    <input defaultValue={m.name} style={{ ...inputStyle, flex: 1 }} />
                    <input defaultValue={m.dist} style={{ ...inputStyle, width: 80 }} />
                    <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textFaint, cursor: 'pointer' }}>×</span>
                  </div>
                ))}
                <span style={{ fontSize: 13, color: colors.greenDark, cursor: 'pointer', display: 'inline-block', marginTop: 4 }}>+ Add landmark</span>
              </div>
              <div style={{ ...card, marginBottom: 0 }}>
                <div style={cardLabel}>Construction timeline &amp; payment plan</div>
                <ProjectProgressEditor value={progress} onChange={setProgress} />
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <div style={card}>
                <div style={cardLabel}>Project Images (min 5)</div>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPickImage} style={{ display: 'none' }} />
                <div onClick={() => fileRef.current && fileRef.current.click()} style={{ border: `2px dashed ${colors.borderStrong}`, borderRadius: 12, padding: 28, textAlign: 'center', cursor: 'pointer', marginBottom: 14 }}>
                  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={1.5} style={{ margin: '0 auto 10px' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  <div style={{ fontSize: 14, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Drag &amp; drop photos here</div>
                  <div style={{ fontSize: 12, color: colors.textFaint }}>or</div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); fileRef.current && fileRef.current.click() }} style={{ height: 32, padding: '0 14px', marginTop: 6, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>{uploading ? 'Uploading…' : 'Choose Images'}</button>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 8 }}>JPG, PNG · max 10MB each · first image is the cover</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                  {gallery.map((g, i) => (
                    <div key={g.key} style={{ position: 'relative', border: `1px solid ${i === 0 ? colors.green : colors.border}`, borderRadius: 8, overflow: 'hidden', aspectRatio: '5/4', backgroundImage: `url(${g.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      {i === 0 && <span style={{ position: 'absolute', bottom: 3, left: 3, background: colors.green, color: '#fff', fontSize: 8, fontWeight: 700, borderRadius: 3, padding: '1px 4px' }}>COVER</span>}
                      <span onClick={() => setGallery((gg) => gg.filter((x) => x.key !== g.key))} style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - gallery.length) }).map((_, i) => (
                    <div key={`ph${i}`} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, aspectRatio: '5/4', background: colors.surfaceMuted, backgroundImage: hatch }} />
                  ))}
                </div>
                {gallery.length > 0 && <div style={{ fontSize: 11, color: colors.green, marginTop: 8 }}>{gallery.length} image{gallery.length > 1 ? 's' : ''} uploaded ✓</div>}
              </div>
              <div style={card}>
                <div style={cardLabel}>Master Plan</div>
                {masterPlan ? (
                  <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    {masterPlan.url && /\.(png|jpe?g|webp)$/i.test(masterPlan.filename || '') ? (
                      <img src={masterPlan.url} alt="master plan" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ height: 120, background: colors.surfaceMuted, backgroundImage: hatch, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="fileText" size={26} color={colors.textFaint} strokeWidth={1.5} /></div>
                    )}
                    <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>{masterPlan.filename} · {fmtSize(masterPlan.size)}</span>
                      <span onClick={uploadMaster} style={{ fontSize: 11, color: colors.greenDark, cursor: 'pointer' }}>Replace</span>
                    </div>
                  </div>
                ) : (
                  <div onClick={uploadMaster} style={{ border: `2px dashed ${colors.borderStrong}`, borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{busyDoc === 'master' ? 'Uploading…' : 'Upload master plan (PDF or image)'}</div>
                  </div>
                )}
              </div>
              <div style={card}>
                <div style={cardLabel}>Documents</div>
                {['Project Brochure', 'Payment Plan', 'NOC Document', 'Floor Plans'].map((name) => {
                  const doc = documents[name]
                  return (
                    <div key={name} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px' }}>
                        <Icon name="fileText" size={16} color={doc ? colors.green : colors.textFaint} strokeWidth={1.7} />
                        <div><div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>{name}</div><div style={{ fontSize: 11, color: colors.textFaint }}>{doc ? `${doc.filename} · ${fmtSize(doc.size)}` : 'Required'}</div></div>
                      </div>
                      {doc ? (
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="check" size={16} color={colors.green} strokeWidth={2} /><span onClick={() => uploadDoc(name)} style={{ fontSize: 11, color: colors.greenDark, cursor: 'pointer' }}>Replace</span></span>
                      ) : (
                        <button type="button" onClick={() => uploadDoc(name)} style={{ height: 30, padding: '0 10px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>{busyDoc === name ? '…' : 'Upload ↑'}</button>
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{ ...card, marginBottom: 0 }}>
                <div style={cardLabel}>Floor Plans</div>
                {floorPlans.map((f, i) => {
                  const isImg = /\.(png|jpe?g|webp)$/i.test(f.filename || '')
                  return (
                    <div key={f.key} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      {isImg && f.url ? (
                        <img src={f.url} alt={f.label} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: `1px solid ${colors.border}`, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 44, height: 44, minWidth: 44, borderRadius: 6, background: colors.surfaceMuted, backgroundImage: hatch, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="fileText" size={18} color={colors.textFaint} strokeWidth={1.7} /></div>
                      )}
                      <div style={{ flex: 1 }}>
                        <input value={f.label} onChange={(e) => setFloorPlans((fp) => fp.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Floor plan label" style={inputStyle} />
                        <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>{f.filename} · {fmtSize(f.size)}</div>
                      </div>
                      <span onClick={() => setFloorPlans((fp) => fp.filter((_, j) => j !== i))} style={{ fontSize: 12, color: colors.red, cursor: 'pointer', whiteSpace: 'nowrap' }}>× Remove</span>
                    </div>
                  )
                })}
                <div onClick={uploadFloorPlan} style={{ border: `2px dashed ${colors.borderStrong}`, borderRadius: 10, padding: 12, textAlign: 'center', cursor: 'pointer', marginTop: floorPlans.length ? 4 : 0 }}>
                  <span style={{ fontSize: 13, color: colors.textFaint }}>{busyDoc === 'floorPlan' ? 'Uploading…' : '+ Add floor plan'}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div>
              {[
                { title: 'Basic Info', go: 1, body: (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 12 }}><span style={{ color: colors.textFaint }}>Name</span><span style={{ color: colors.textMuted }}>{title.trim() || '—'}</span><span style={{ color: colors.textFaint }}>Type</span><span style={{ color: colors.textMuted }}>{ptype}</span><span style={{ color: colors.textFaint }}>City</span><span style={{ color: colors.textMuted }}>{city}</span><span style={{ color: colors.textFaint }}>Location</span><span style={{ color: colors.textMuted }}>{[area.trim(), address.trim()].filter(Boolean).join(', ') || '—'}</span></div>) },
              ].map((s) => (
                <div key={s.title} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</span><span onClick={() => setStep(s.go)} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Edit ✏️</span></div>
                  {s.body}
                </div>
              ))}
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Unit Types</span><span onClick={() => setStep(2)} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Edit ✏️</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1.3fr 0.7fr', gap: 6, fontSize: 12 }}>
                  {['Type', 'Size', 'Price', 'Comm.'].map((h) => <span key={h} style={{ color: colors.textFaint }}>{h}</span>)}
                  <span style={{ color: colors.textMuted }}>2BR</span><span style={{ color: colors.textMuted }}>110–130m²</span><span style={{ color: colors.textMuted }}>850k–1M</span><span style={{ color: colors.textMuted }}>3%</span>
                  <span style={{ color: colors.textMuted }}>1BR</span><span style={{ color: colors.textMuted }}>75–90m²</span><span style={{ color: colors.textMuted }}>600k–700k</span><span style={{ color: colors.textMuted }}>3%</span>
                </div>
              </div>
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Amenities</span><span onClick={() => setStep(3)} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Edit ✏️</span></div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {amenityDefs.filter((_, i) => amenities[i]).map(([, label]) => <span key={label} style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, color: colors.greenDark, borderRadius: 999, padding: '3px 10px', fontSize: 11 }}>{label}</span>)}
                </div>
              </div>
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Documents &amp; Images</span><span onClick={() => setStep(4)} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Edit ✏️</span></div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>✓ Brochure · ✓ Payment Plan · ✓ NOC · ✓ Floor Plans</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>{[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ aspectRatio: '5/4', borderRadius: 6, background: colors.surfaceMuted, backgroundImage: hatch }} />)}</div>
              </div>
              <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 10 }}>If sold at minimum price:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 0.6fr 1fr', gap: 6, fontSize: 12 }}>
                  {['Type', 'Min Price', 'Comm%', 'Realtor earns'].map((h) => <span key={h} style={{ color: colors.textFaint }}>{h}</span>)}
                  <span style={{ color: colors.textMuted }}>2BR</span><span style={{ color: colors.textMuted }}>SAR 850k</span><span style={{ color: colors.textMuted }}>3%</span><span style={{ color: colors.greenDark, fontWeight: 600 }}>SAR 25,500</span>
                  <span style={{ color: colors.textMuted }}>1BR</span><span style={{ color: colors.textMuted }}>SAR 600k</span><span style={{ color: colors.textMuted }}>3%</span><span style={{ color: colors.greenDark, fontWeight: 600 }}>SAR 18,000</span>
                </div>
              </div>
              {error && <div style={{ fontSize: 12, color: colors.red, marginBottom: 8 }}>{error}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={submit} disabled={saving} style={{ height: 38, background: colors.green, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Submitting…' : 'Submit for Review'}</button>
                <button onClick={saveDraft} disabled={saving} style={{ height: 38, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Save as Draft</button>
              </div>
              <div style={{ fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: 10 }}>Admin reviews within 24 hours. You'll be notified by email.</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>← Previous</button>
        ) : <span />}
        <button onClick={saveDraft} disabled={saving} style={{ height: 34, padding: '0 14px', background: 'transparent', border: 'none', fontSize: 12, color: colors.textSoft, fontFamily: 'inherit', cursor: 'pointer' }}>Save as Draft</button>
        <button onClick={next} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>{step < 5 ? 'Next Step →' : 'Submit for Review'}</button>
      </div>
    </>
  )
}
