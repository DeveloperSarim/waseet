import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { developerApi, geoApi } from '../../lib/api'
import { MapPicker } from '../../components/MapPicker'
import { ProjectProgressEditor } from '../../components/ProjectProgressEditor'

const defaultTimeline = [
  { label: 'Planning', date: '', state: 'todo' },
  { label: 'Foundation', date: '', state: 'todo' },
  { label: 'Construction', date: '', state: 'todo' },
  { label: 'Handover', date: '', state: 'todo' },
]
const defaultPaymentPlan = [
  { pct: 20, title: 'Down payment', sub: 'On signing' },
  { pct: 60, title: 'During construction', sub: 'Quarterly instalments' },
  { pct: 20, title: 'On handover', sub: '' },
]

const hatch = 'repeating-linear-gradient(45deg, #ECECEE 0, #ECECEE 1px, transparent 1px, transparent 8px)'
const stepDefs = [
  { n: 1, label: 'Basic Info' }, { n: 2, label: 'Unit Types' }, { n: 3, label: 'Content' }, { n: 4, label: 'Media' }, { n: 5, label: 'Review' },
]
const fieldLabel = { display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }
const cardLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }
const inputBase = { width: '100%', height: 36, borderRadius: 7, padding: '0 12px', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', color: colors.ink, background: '#fff' }
const majorBadge = { fontSize: 10, color: colors.amber, background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 3, padding: '1px 5px' }
const selectBox = { height: 36, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', fontSize: 13 }
const chevron = <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2.2}><polyline points="6 9 12 15 18 9" /></svg>

const unitTypes = [
  { type: 'Studio', size: '45 – 55', price: 'SAR 420k – 480k', units: '8', commission: '3%', removable: true, locked: false },
  { type: '1BR', size: '75 – 90', price: 'SAR 600k – 700k', units: '12', commission: '3%', removable: true, locked: false },
  { type: '2BR', size: '110 – 130', price: 'SAR 850k – 1M', units: '8', commission: '3%', removable: true, locked: false },
  { type: '3BR', size: '150 – 170', price: 'SAR 1.1M – 1.3M', units: '0', commission: '2.5%', removable: false, locked: true },
]
const amenList = ['Pool', 'Gym', 'Parking', 'Security', 'Garden', 'Elevator', 'Mosque', 'Playground', 'Spa']
const landmarks = [
  { name: 'Red Sea Mall', dist: '2.5 km' },
  { name: 'King Abdulaziz Intl Airport', dist: '18 km' },
  { name: 'Jeddah Corniche', dist: '1.2 km' },
]
const images = [1, 2, 3, 4, 5, 6, 7, 8]
const documents = [{ name: 'Building Permit.pdf' }, { name: 'Title Deed.pdf' }, { name: 'WAFI License.pdf' }]
const majorChanges = [{ field: 'Commission % — 2BR', old: '3%', new: '3.5%' }]
const minorChanges = [
  { title: 'Description updated', detail: 'Content revised' },
  { title: 'Pool added to amenities', detail: 'Amenities list changed' },
  { title: 'New image added', detail: '9 images total' },
]

export default function EditProject() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [step, setStep] = useState(1)
  const [pName, setPName] = useState('')
  const [amenities, setAmenities] = useState({ Pool: true, Gym: true, Parking: true, Security: true, Garden: true, Elevator: true, Mosque: false, Playground: false, Spa: false })
  const [submitted, setSubmitted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const toastTimer = useRef(null)
  const fileRef = useRef(null)

  // fetched project + controlled edit fields
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [originalTitle, setOriginalTitle] = useState('')
  const [ptype, setPtype] = useState('')
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [imageKey, setImageKey] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [location, setLocation] = useState(null) // { lat, lng, address }
  const [floorPlans, setFloorPlans] = useState([]) // [{ label, key, filename, size, url }]
  const [busyFp, setBusyFp] = useState(false)
  const [progress, setProgress] = useState({
    progressPercent: 0,
    timeline: defaultTimeline,
    paymentPlan: defaultPaymentPlan,
  })
  const [devStatus, setDevStatus] = useState('Under Construction')
  const [handover, setHandover] = useState('')
  const [floors, setFloors] = useState('')
  const [totalUnits, setTotalUnits] = useState('')
  const [geoCities, setGeoCities] = useState([])
  const [areaDistricts, setAreaDistricts] = useState([])
  useEffect(() => { geoApi.cities().then((l) => setGeoCities(Array.isArray(l) ? l : [])).catch(() => {}) }, [])
  useEffect(() => {
    const sel = geoCities.find((c) => c.name === city)
    if (!sel) { setAreaDistricts([]); return }
    let active = true
    geoApi.districts(sel.id).then((d) => { if (active) setAreaDistricts(Array.isArray(d) ? d : []) }).catch(() => { if (active) setAreaDistricts([]) })
    return () => { active = false }
  }, [city, geoCities])

  useEffect(() => {
    let alive = true
    setLoading(true); setNotFound(false); setError('')
    developerApi.getProject(id)
      .then((p) => {
        if (!alive) return
        setProject(p)
        setPName(p.title || '')
        setOriginalTitle(p.title || '')
        setPtype(p.type || '')
        setCity(p.city || '')
        setDescription(p.description || '')
        setImageUrl(p.image || null)
        setFloorPlans(p.details?.floorPlans || [])
        setDevStatus(p.details?.constructionStatus || 'Under Construction')
        setHandover(p.details?.handover || '')
        setFloors(p.details?.floors != null ? String(p.details.floors) : '')
        setTotalUnits(p.details?.totalUnits != null ? String(p.details.totalUnits) : '')
        setProgress({
          progressPercent: p.details?.progressPercent ?? 0,
          timeline: Array.isArray(p.details?.timeline) && p.details.timeline.length ? p.details.timeline : defaultTimeline,
          paymentPlan: Array.isArray(p.details?.paymentPlan) && p.details.paymentPlan.length ? p.details.paymentPlan : defaultPaymentPlan,
        })
        // location is stored as a single string; show it in the Address field
        setAddress(p.address || p.location || '')
        if (p.latitude != null && p.longitude != null) setLocation({ lat: p.latitude, lng: p.longitude, address: p.address || p.location || '' })
      })
      .catch((e) => {
        if (!alive) return
        if (e.status === 404) setNotFound(true)
        else setError(e.message || 'Could not load project')
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  const onPickImage = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const res = await developerApi.uploadProjectImage(file)
      setImageKey(res.imageKey)
      setImageUrl(res.url)
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
  const fmtSize = (b) => (b == null ? '' : b / 1048576 >= 0.1 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
  const uploadFloorPlan = () => pickFile('application/pdf,image/*', async (file) => {
    setBusyFp(true); setError('')
    try {
      const res = await developerApi.uploadProjectImage(file)
      setFloorPlans((fp) => [...fp, { label: `Floor Plan ${fp.length + 1}`, key: res.key, filename: res.filename, size: res.size, url: res.url }])
    } catch (err) { setError(err.message || 'Upload failed') } finally { setBusyFp(false) }
  })

  const nameChanged = pName !== originalTitle
  const hasMajor = majorChanges.length > 0
  const previewSections = [
    { title: 'Basic Info', body: pName + ' · Apartments · Under Construction · Handover Q4 2027' },
    { title: 'Location', body: 'Al Rawdhah, Jeddah · King Abdullah Road, District 7' },
    { title: 'Unit Types', body: 'Studio, 1BR, 2BR, 3BR · 28 units · 2.5–3.5% commission' },
    { title: 'Media', body: '8 images · master_plan.pdf · 3 verified documents' },
  ]

  const go = (n) => setStep(n)

  const persist = async (onDone, status) => {
    if (!project) return
    if (!pName.trim()) { setError('Project name is required'); setStep(1); return }
    setSaving(true); setError('')
    // fields with no dedicated edit UI carry their fetched values back unchanged
    const payload = {
      title: pName.trim(),
      city: city || project.city,
      country: project.country,
      type: ptype || project.type,
      bedrooms: project.bedrooms,
      priceFrom: project.priceFrom,
      priceTo: project.priceTo,
      commissionPct: project.commissionPct,
      location: location?.address || address.trim() || project.location,
      address: location?.address || address.trim() || project.address || null,
      latitude: location?.lat ?? project.latitude ?? null,
      longitude: location?.lng ?? project.longitude ?? null,
      mapLink: location?.lat != null ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : (project.mapLink || ''),
      description: description.trim(),
      details: {
        ...(project.details || {}),
        constructionStatus: devStatus,
        handover: devStatus === 'Ready' ? '' : handover,
        floors: floors ? Number(floors) || null : null,
        totalUnits: totalUnits ? Number(totalUnits) || null : null,
        floorPlans: floorPlans.map((f) => ({ label: f.label, key: f.key, filename: f.filename, size: f.size })),
        progressPercent: Number(progress.progressPercent) || 0,
        timeline: progress.timeline,
        paymentPlan: progress.paymentPlan.map((p) => ({ ...p, pct: Number(p.pct) || 0 })),
      },
    }
    if (imageKey) payload.imageKey = imageKey
    if (status) payload.status = status
    try {
      const updated = await developerApi.updateProject(project.id, payload)
      setProject(updated)
      setOriginalTitle(updated.title || pName.trim())
      onDone && onDone()
    } catch (err) {
      setError(err.message || 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  const save = () => {
    persist(() => {
      clearTimeout(toastTimer.current)
      setShowToast(true)
      toastTimer.current = setTimeout(() => setShowToast(false), 1800)
    })
  }
  const onNext = () => { if (step === 5) persist(() => setSubmitted(true), 'PENDING'); else go(Math.min(5, step + 1)) }
  const toggleAmenity = (a) => setAmenities((prev) => ({ ...prev, [a]: !prev[a] }))

  const showNav = !(step === 5 && submitted)

  if (loading) {
    return (
      <>
        <Topbar left={<span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Edit Project</span>} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, fontSize: 13, color: colors.textFaint }}>Loading project…</div>
      </>
    )
  }

  if (notFound || !project) {
    return (
      <>
        <Topbar left={<span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Edit Project</span>} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: colors.bg }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted }}>{notFound ? 'Project not found' : (error || 'Could not load project')}</div>
          <button onClick={() => navigate('/developer/projects')} style={{ height: 36, padding: '0 16px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Back to My Projects</button>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{'@keyframes wsk-pop { 0% { transform: scale(0); } 70% { transform: scale(1.1); } 100% { transform: scale(1); } } @keyframes wsk-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }'}</style>

      {/* top bar */}
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span className="wa-hide-sm" style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => navigate('/developer/projects')}>My Projects</span>
            <svg className="wa-hide-sm" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => navigate('/developer/projects')}>{project.title}</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>Edit</span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="wa-hide-sm" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: colors.green, animation: 'wsk-pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, color: colors.greenDark }}>Live on marketplace</span>
            </div>
            <button className="wa-hide-sm" style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>View on Marketplace</button>
          </div>
        }
      />

      {/* notice banner */}
      <div style={{ background: colors.amberTint, borderBottom: `1px solid ${colors.amberTintBorder}`, padding: '10px 22px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.amberText, marginBottom: 2 }}>Editing a live project</div>
          <div style={{ fontSize: 12, color: colors.amberText, lineHeight: 1.5 }}>Minor edits (description, amenities, documents) go live immediately. Major changes (name, price, commission %, unit types) require admin re-review.</div>
        </div>
        <span style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer', whiteSpace: 'nowrap' }}>What counts as major? →</span>
      </div>

      {/* stepper */}
      <div className="wa-scroll-x" style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '14px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, width: 'max-content', minWidth: '100%', margin: '0 auto' }}>
        {stepDefs.map((st, i) => {
          const isActive = step === st.n
          const isDone = step > st.n
          let bg, color, border, mark
          if (isActive) { bg = colors.ink; color = '#fff'; border = 'none'; mark = String(st.n) }
          else if (isDone) { bg = colors.green; color = '#fff'; border = 'none'; mark = '✓' }
          else { bg = '#fff'; color = colors.textFaint; border = `1px solid ${colors.borderStrong}`; mark = String(st.n) }
          return (
            <div key={st.n} style={{ display: 'flex', alignItems: 'center' }}>
              <div onClick={() => go(st.n)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{ width: 26, height: 26, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, background: bg, color, border }}><span>{mark}</span></div>
                <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 500, color: isActive ? colors.ink : isDone ? colors.greenDark : colors.textFaint, whiteSpace: 'nowrap' }}>{st.label}</span>
              </div>
              {i < stepDefs.length - 1 && <div style={{ width: 36, height: 2, margin: '0 10px', background: step > st.n ? colors.green : colors.border }} />}
            </div>
          )
        })}
      </div>
      </div>

      {/* content scroll */}
      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 24px 32px' }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                <div style={cardLabel}>Basic Information</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>Project Name *</label>
                    <span style={majorBadge}>⚠ Major change</span>
                  </div>
                  <input value={pName} onChange={(e) => setPName(e.target.value)} style={{ ...inputBase, border: `1px solid ${nameChanged ? colors.amberTintBorder : colors.border}`, ...(nameChanged ? { background: colors.amberTint } : {}) }} />
                  {error && <div style={{ fontSize: 11, color: colors.red, marginTop: 6 }}>{error}</div>}
                  {nameChanged && (
                    <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '10px 12px', marginTop: 8, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      <span style={{ fontSize: 12, color: colors.amberText, lineHeight: 1.5 }}>Changing this field requires admin re-review. Project stays live during review.</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
                  <div><label style={fieldLabel}>Project Type *</label><div style={selectBox}>{ptype || '—'}{chevron}</div></div>
                  <div><label style={fieldLabel}>Development Status *</label>
                    <select value={devStatus} onChange={(e) => setDevStatus(e.target.value)} style={{ ...inputBase, border: `1px solid ${colors.border}`, background: '#fff' }}><option>Off-plan</option><option>Under Construction</option><option>Ready</option></select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
                  {devStatus === 'Ready' ? (
                    <div><label style={fieldLabel}>Handover</label><input value="Delivered — ready to move in" disabled style={{ ...inputBase, border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.textFaint }} /></div>
                  ) : (
                    <div><label style={fieldLabel}>Expected Handover *</label><input value={handover} onChange={(e) => setHandover(e.target.value)} placeholder="Q4 2027" style={{ ...inputBase, border: `1px solid ${colors.border}` }} /></div>
                  )}
                  <div><label style={fieldLabel}>Completion %</label><input value={progress.progressPercent} onChange={(e) => setProgress((p) => ({ ...p, progressPercent: e.target.value.replace(/[^\d]/g, '') }))} placeholder="68" style={{ ...inputBase, border: `1px solid ${colors.border}` }} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  <div><label style={fieldLabel}>Total Floors</label><input value={floors} onChange={(e) => setFloors(e.target.value)} placeholder="12" style={{ ...inputBase, border: `1px solid ${colors.border}` }} /></div>
                  <div><label style={fieldLabel}>Total Units</label><input value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} placeholder="96" style={{ ...inputBase, border: `1px solid ${colors.border}` }} /></div>
                </div>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px' }}>
                <div style={cardLabel}>Location</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
                  <div><label style={fieldLabel}>City</label><div style={selectBox}>{city || '—'}{chevron}</div></div>
                  <div><label style={fieldLabel}>Area</label>
                    <select value={area} onChange={(e) => setArea(e.target.value)} disabled={areaDistricts.length === 0} style={{ ...inputBase, border: `1px solid ${colors.border}`, background: '#fff', color: area ? colors.ink : colors.textFaint }}>
                      <option value="">{areaDistricts.length ? 'Select area' : 'No areas for this city'}</option>
                      {area && !areaDistricts.some((d) => d.name === area) && <option value={area}>{area}</option>}
                      {areaDistricts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}><label style={fieldLabel}>Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} style={{ ...inputBase, border: `1px solid ${colors.border}` }} /></div>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Pin location on map</div>
                <MapPicker value={location} onChange={setLocation} height={240} />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: colors.amberText }}>Changes to commission % or prices require admin re-review.</span>
              </div>
              {unitTypes.map((u, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, ...(u.locked ? { opacity: 0.78 } : {}) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{u.type}</span>
                      {u.locked && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: colors.textMuted, background: colors.surfaceMuted, border: `1px solid ${colors.border}`, borderRadius: 4, padding: '2px 6px' }}>All units sold · Cannot remove<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                      )}
                    </div>
                    {u.removable && (
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
                    <div><label style={{ display: 'block', fontSize: 11, color: colors.textFaint, marginBottom: 3 }}>Size range (m²)</label><div style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>{u.size}</div></div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}><label style={{ fontSize: 11, color: colors.textFaint }}>Price range</label><span style={{ fontSize: 9, color: colors.amber, background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 3, padding: '0 4px' }}>⚠ Major</span></div>
                      <div style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>{u.price}</div>
                    </div>
                    <div><label style={{ display: 'block', fontSize: 11, color: colors.textFaint, marginBottom: 3 }}>Units</label><div style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>{u.units}</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 7, padding: '8px 10px' }}>
                    <span style={{ width: 14, height: 14, borderRadius: 999, border: '4px solid #16A34A', display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: colors.textMuted }}>Commission</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{u.commission}</span>
                    <span style={{ fontSize: 9, color: colors.amber, background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 3, padding: '1px 5px', marginLeft: 'auto' }}>⚠ Major</span>
                  </div>
                </div>
              ))}
              <button style={{ width: '100%', height: 42, background: '#fff', border: `1.5px dashed ${colors.borderStrong}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>Add New Unit Type</button>
              <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 6, textAlign: 'center' }}>Adding new unit types requires admin re-review.</div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 8, padding: '8px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <span style={{ fontSize: 12, color: colors.greenDark }}>Changes here go live immediately — no admin re-review required.</span>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 6 }}>Description</label>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 2, padding: '6px 8px', borderBottom: `1px solid ${colors.surfaceMuted}`, background: colors.bg }}>
                    <span style={{ width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colors.textMuted, cursor: 'pointer' }}>B</span>
                    <span style={{ width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontStyle: 'italic', color: colors.textMuted, cursor: 'pointer' }}>I</span>
                    <span style={{ width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: colors.textMuted, cursor: 'pointer' }}>•</span>
                  </div>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project…" style={{ width: '100%', minHeight: 110, border: 'none', outline: 'none', padding: 12, fontSize: 13, fontFamily: 'inherit', color: colors.ink, resize: 'vertical', lineHeight: 1.6 }} />
                </div>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 10 }}>Amenities</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                  {amenList.map((a) => {
                    const on = !!amenities[a]
                    return (
                      <div key={a} onClick={() => toggleAmenity(a)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, border: `1px solid ${on ? colors.greenTintBorder : colors.border}`, background: on ? colors.greenTint : '#fff', cursor: 'pointer', color: on ? colors.greenDark : colors.textMuted }}>
                        <span style={{ width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', background: on ? colors.green : 'transparent', border: on ? 'none' : `1.5px solid ${colors.borderStrong}` }}>{on ? '✓' : ''}</span>
                        <span style={{ fontSize: 12 }}>{a}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 10 }}>Nearby landmarks</label>
                {landmarks.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input defaultValue={l.name} style={{ flex: 2, height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                    <input defaultValue={l.dist} style={{ flex: 1, height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 10 }}>Construction timeline &amp; payment plan</label>
                <ProjectProgressEditor value={progress} onChange={setProgress} />
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Project Images</div>
                <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 8 }}>8 images · drag to reorder</div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
                  {images.map((img, idx) => {
                    const showCover = idx === 0 && imageUrl
                    return (
                      <div key={img} style={{ position: 'relative', height: 60, borderRadius: 7, backgroundColor: colors.surfaceMuted, backgroundImage: showCover ? `url(${imageUrl})` : hatch, backgroundSize: showCover ? 'cover' : undefined, backgroundPosition: showCover ? 'center' : undefined, border: `1px solid ${colors.border}` }}>
                        <span style={{ position: 'absolute', top: 3, left: 4, fontSize: 10, color: colors.textFaint }}>⣿</span>
                        <button style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: 999, background: 'rgba(255,255,255,0.95)', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={3} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                      </div>
                    )
                  })}
                </div>
                <button onClick={() => fileRef.current && fileRef.current.click()} style={{ height: 36, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>{uploading ? 'Uploading…' : 'Upload more'}</button>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Master Plan</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 12px', flexWrap: 'wrap' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 6, backgroundColor: colors.surfaceMuted, backgroundImage: hatch, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>master_plan.pdf</div><div style={{ fontSize: 11, color: colors.textFaint }}>Uploaded Jun 12, 2025 · 2.4 MB</div></div>
                  <button style={{ height: 30, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Replace</button>
                  <button style={{ height: 30, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Preview</button>
                </div>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Documents</div>
                {documents.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}`, flexWrap: 'wrap' }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    <span style={{ flex: 1, fontSize: 13, color: colors.ink }}>{d.name}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: colors.greenDark }}><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>Verified</span>
                    <button style={{ height: 28, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Replace</button>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 8 }}>Replacing documents takes effect immediately. Adding new document types requires re-review.</div>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Floor Plans</div>
                {floorPlans.map((f, i) => {
                  const isImg = /\.(png|jpe?g|webp)$/i.test(f.filename || '')
                  return (
                    <div key={f.key} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                      {isImg && f.url ? (
                        <img src={f.url} alt={f.label} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: `1px solid ${colors.border}`, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 6, backgroundColor: colors.surfaceMuted, backgroundImage: hatch, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <input value={f.label} onChange={(e) => setFloorPlans((fp) => fp.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Floor plan label" style={{ ...inputBase, border: `1px solid ${colors.border}` }} />
                        <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>{f.filename} · {fmtSize(f.size)}</div>
                      </div>
                      <button onClick={() => setFloorPlans((fp) => fp.filter((_, j) => j !== i))} style={{ height: 30, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 11, color: colors.red, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>× Remove</button>
                    </div>
                  )
                })}
                <button onClick={uploadFloorPlan} style={{ width: '100%', height: 40, marginTop: floorPlans.length ? 4 : 0, background: '#fff', border: `1.5px dashed ${colors.borderStrong}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  {busyFp ? 'Uploading…' : 'Add floor plan'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && !submitted && (
            <div>
              {hasMajor ? (
                <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: colors.amberText, lineHeight: 1.5 }}>{majorChanges.length} major change requires admin review. Your project stays live during review. Expect approval within 24 hours.</span>
                </div>
              ) : (
                <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: colors.greenDark, lineHeight: 1.5 }}>All changes go live immediately. No admin re-review required.</span>
                </div>
              )}

              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, marginBottom: 14 }}>Summary of changes</div>

                {hasMajor && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}><svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg><span style={{ fontSize: 9, fontWeight: 600, color: colors.amber, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Requires admin review</span></div>
                    {majorChanges.map((m, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        <div><div style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>{m.field}</div><div style={{ fontSize: 12, marginTop: 2 }}><span style={{ color: colors.red, textDecoration: 'line-through', marginRight: 6 }}>{m.old}</span><span style={{ color: colors.green }}>{m.new}</span></div></div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}><svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg><span style={{ fontSize: 9, fontWeight: 600, color: colors.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Goes live immediately</span></div>
                  {minorChanges.map((mn, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      <div><div style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>{mn.title}</div><div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{mn.detail}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>Full project preview</span>
                  <span onClick={() => setExpanded(!expanded)} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>{expanded ? 'Collapse all' : 'Expand all'}</span>
                </div>
                {expanded && (
                  <div style={{ marginTop: 12 }}>
                    {previewSections.map((ps, i) => (
                      <div key={i} style={{ padding: '10px 0', borderTop: `1px solid ${colors.surfaceMuted}` }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{ps.title}</div>
                        <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>{ps.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <div style={{ fontSize: 12, color: colors.red, marginBottom: 8, textAlign: 'center' }}>{error}</div>}
              <button onClick={() => persist(() => setSubmitted(true))} disabled={saving} style={{ width: '100%', height: 38, background: colors.green, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}><span>{saving ? 'Saving…' : 'Submit Changes'}</span></button>
              <button onClick={() => setShowDiscard(true)} style={{ width: '100%', height: 36, background: 'none', border: 'none', fontSize: 12, color: colors.textFaint, fontFamily: 'inherit', cursor: 'pointer', marginTop: 8 }}>Discard all changes</button>
            </div>
          )}

          {/* SUCCESS */}
          {step === 5 && submitted && (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '40px 32px', textAlign: 'center' }}>
              {hasMajor ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'wsk-pop 400ms ease-out' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 8 }}>Changes submitted for review</div>
                  <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.6, marginBottom: 24, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>Minor changes are already live. Major changes will go live within 24 hours after admin approval.</div>
                  <div style={{ maxWidth: 320, margin: '0 auto 24px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg><div><div style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>Changes submitted</div><div style={{ fontSize: 11, color: colors.textFaint }}>Just now</div></div></div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}><span style={{ width: 16, height: 16, borderRadius: 999, border: `2px solid ${colors.borderStrong}`, flexShrink: 0, marginTop: 1 }} /><div><div style={{ fontSize: 13, fontWeight: 500, color: colors.textSoft }}>Admin reviews major changes</div><div style={{ fontSize: 11, color: colors.textFaint }}>Within 24 hours</div></div></div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ width: 16, height: 16, borderRadius: 999, border: `2px solid ${colors.borderStrong}`, flexShrink: 0, marginTop: 1 }} /><div><div style={{ fontSize: 13, fontWeight: 500, color: colors.textSoft }}>All changes live</div><div style={{ fontSize: 11, color: colors.textFaint }}>After approval</div></div></div>
                  </div>
                  <button onClick={() => navigate('/developer/projects')} style={{ height: 38, padding: '0 20px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Back to My Projects</button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'wsk-pop 400ms ease-out' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 8 }}>Changes saved!</div>
                  <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.6, marginBottom: 24 }}>Your project has been updated. Changes are live on the marketplace.</div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button style={{ height: 38, padding: '0 18px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>View on Marketplace ↗</button>
                    <button onClick={() => navigate('/developer/projects')} style={{ height: 38, padding: '0 18px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Back to My Projects</button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* nav bar */}
      {showNav && (
        <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ width: 120 }}>
            {step > 1 && (
              <button onClick={() => go(Math.max(1, step - 1))} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>← Previous</button>
            )}
          </div>
          <button onClick={save} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Save Changes</button>
          <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onNext} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>{step === 5 ? 'Submit Changes' : 'Next Step →'}</button>
          </div>
        </div>
      )}

      {/* discard modal */}
      {showDiscard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 380, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, marginBottom: 4 }}>Discard all changes?</div>
            <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5, marginBottom: 14 }}>All unsaved changes will be lost. Your project will not be modified.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDiscard(false)} style={{ flex: 1, height: 36, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 13, fontWeight: 500, color: colors.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>Keep editing</button>
              <button onClick={() => { setShowDiscard(false); navigate('/developer/projects') }} style={{ flex: 1, height: 36, background: colors.red, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Discard changes</button>
            </div>
          </div>
        </div>
      )}

      {/* save toast */}
      {showToast && (
        <div style={{ position: 'fixed', bottom: 76, right: 22, background: colors.ink, color: '#fff', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 80 }}>Progress saved</div>
      )}
    </>
  )
}
