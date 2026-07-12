import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { MapPicker } from '../../components/MapPicker'
import { ProjectProgressEditor } from '../../components/ProjectProgressEditor'
import { adminApi } from '../../lib/api'

const inputStyle = { width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', color: colors.ink, background: '#fff', outline: 'none' }
const selStyle = { ...inputStyle, color: colors.textMuted }
const textareaStyle = { width: '100%', minHeight: 120, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: colors.ink, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }
const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }
const cardLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }
const fieldLabel = { fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }
const btnGhost = { height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }
const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 7px)'

const TYPE_OPTIONS = ['Apartment', 'Villa', 'Office', 'Townhouse', 'Land']
const STATUS_OPTIONS = ['LIVE', 'PENDING', 'DRAFT', 'SOLD_OUT']
const STATUS_LABEL = { LIVE: 'Live', PENDING: 'Pending Review', DRAFT: 'Draft', SOLD_OUT: 'Sold Out' }

const toInt = (v) => parseInt(String(v ?? '').replace(/[^0-9]/g, ''), 10) || 0
const fmtSize = (b) => (b == null ? '' : b / 1048576 >= 0.1 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const isImageName = (n) => /\.(png|jpe?g|webp|gif)$/i.test(n || '')

// Opens a native file picker and hands the chosen file to onFile.
function pickFile(accept, onFile) {
  const inp = document.createElement('input')
  inp.type = 'file'
  inp.accept = accept
  inp.onchange = () => { if (inp.files && inp.files[0]) onFile(inp.files[0]) }
  inp.click()
}

function Field({ label, children }) {
  return (
    <div>
      <div style={fieldLabel}>{label}</div>
      {children}
    </div>
  )
}

export default function AdminProjectEdit() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState('') // which media action is uploading

  // scalar fields
  const [title, setTitle] = useState('')
  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [description, setDescription] = useState('')
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [commissionPct, setCommissionPct] = useState('')
  const [status, setStatus] = useState('DRAFT')
  const [handover, setHandover] = useState('')
  const [floors, setFloors] = useState('')
  const [totalUnits, setTotalUnits] = useState('')
  const [constructionStatus, setConstructionStatus] = useState('')
  const [location, setLocation] = useState(null) // { lat, lng, address }

  // media (local editable state; keys are the source of truth for saving)
  const [gallery, setGallery] = useState([]) // [{ key, url }]
  const [floorPlans, setFloorPlans] = useState([]) // [{ label, key, url, filename, size }]
  const [masterPlan, setMasterPlan] = useState(null) // { key, url, filename, size } | null
  const [documents, setDocuments] = useState([]) // [{ name, key, url, filename, size }]

  // construction timeline / payment plan / % complete
  const [progress, setProgress] = useState({ progressPercent: 0, timeline: [], paymentPlan: [] })

  useEffect(() => {
    let alive = true
    setLoading(true); setNotFound(false); setError('')
    adminApi.getProject(id)
      .then((p) => {
        if (!alive) return
        setProject(p)
        setTitle(p.title || '')
        setCity(p.city || '')
        setType(p.type || '')
        setBedrooms(p.bedrooms != null ? String(p.bedrooms) : '')
        setDescription(p.description || '')
        setPriceFrom(p.priceFrom != null ? String(p.priceFrom) : '')
        setPriceTo(p.priceTo != null ? String(p.priceTo) : '')
        setCommissionPct(p.commissionPct != null ? String(p.commissionPct) : '')
        setStatus(p.status || 'DRAFT')
        const d = p.details || {}
        setHandover(d.handover || '')
        setFloors(d.floors != null ? String(d.floors) : '')
        setTotalUnits(d.totalUnits != null ? String(d.totalUnits) : '')
        setConstructionStatus(d.constructionStatus || '')
        if (p.latitude != null && p.longitude != null) setLocation({ lat: p.latitude, lng: p.longitude, address: p.address || p.location || '' })
        else if (p.address || p.location) setLocation({ lat: null, lng: null, address: p.address || p.location })

        // gallery: keys from details, preview urls from top-level images
        const keys = d.images || []
        const urls = p.images || []
        setGallery(keys.map((key, i) => ({ key, url: urls[i] || null })))

        // floor plans: keys from details, preview urls from top-level floorPlans
        const fpKeys = d.floorPlans || []
        const fpUrls = p.floorPlans || []
        setFloorPlans(fpKeys.map((f, i) => ({ label: f.label || 'Floor Plan', key: f.key, filename: f.filename, size: f.size, url: fpUrls[i]?.url || null })))

        // master plan
        setMasterPlan(d.masterPlanKey ? { key: d.masterPlanKey, filename: d.masterPlanName || 'master_plan', size: null, url: p.masterPlanUrl || null } : null)

        // documents: object keyed by name in details, preview urls in top-level documents
        const docObj = d.documents || {}
        const urlByName = Object.fromEntries((p.documents || []).map((x) => [x.name, x.url]))
        setDocuments(Object.entries(docObj).map(([name, v]) => ({ name, key: v.key, filename: v.filename, size: v.size, url: urlByName[name] || null })))

        // construction timeline / payment plan / % complete
        setProgress({
          progressPercent: p.details?.progressPercent ?? 0,
          timeline: Array.isArray(p.details?.timeline) && p.details.timeline.length ? p.details.timeline : [
            { label: 'Planning', date: '', state: 'todo' },
            { label: 'Foundation', date: '', state: 'todo' },
            { label: 'Construction', date: '', state: 'todo' },
            { label: 'Handover', date: '', state: 'todo' },
          ],
          paymentPlan: Array.isArray(p.details?.paymentPlan) && p.details.paymentPlan.length ? p.details.paymentPlan : [
            { pct: 20, title: 'Down payment', sub: 'On signing' },
            { pct: 60, title: 'During construction', sub: 'Quarterly instalments' },
            { pct: 20, title: 'On handover', sub: '' },
          ],
        })
      })
      .catch((e) => {
        if (!alive) return
        if (e.status === 404) setNotFound(true)
        else setError(e.message || 'Could not load project')
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  // ---- media handlers ----
  const addImage = () => pickFile('image/*', async (file) => {
    setBusy('image'); setError('')
    try { const res = await adminApi.uploadProjectImage(file); setGallery((g) => [...g, { key: res.key, url: res.url }]) }
    catch (err) { setError(err.message || 'Image upload failed') } finally { setBusy('') }
  })
  const removeImage = (key) => setGallery((g) => g.filter((x) => x.key !== key))

  const addFloorPlan = () => pickFile('application/pdf,image/*', async (file) => {
    setBusy('floorPlan'); setError('')
    try { const res = await adminApi.uploadProjectImage(file); setFloorPlans((f) => [...f, { label: 'Floor Plan', key: res.key, url: res.url, filename: res.filename, size: res.size }]) }
    catch (err) { setError(err.message || 'Floor plan upload failed') } finally { setBusy('') }
  })
  const setFloorPlanLabel = (i, label) => setFloorPlans((f) => f.map((x, j) => (j === i ? { ...x, label } : x)))
  const removeFloorPlan = (i) => setFloorPlans((f) => f.filter((_, j) => j !== i))

  const uploadMaster = () => pickFile('application/pdf,image/*', async (file) => {
    setBusy('master'); setError('')
    try { const res = await adminApi.uploadProjectImage(file); setMasterPlan({ key: res.key, url: res.url, filename: res.filename, size: res.size }) }
    catch (err) { setError(err.message || 'Upload failed') } finally { setBusy('') }
  })
  const removeMaster = () => setMasterPlan(null)

  const addDocument = () => pickFile('application/pdf,image/*', async (file) => {
    setBusy('document'); setError('')
    try { const res = await adminApi.uploadProjectImage(file); setDocuments((d) => [...d, { name: res.filename || 'Document', key: res.key, url: res.url, filename: res.filename, size: res.size }]) }
    catch (err) { setError(err.message || 'Document upload failed') } finally { setBusy('') }
  })
  const removeDocument = (i) => setDocuments((d) => d.filter((_, j) => j !== i))

  // ---- save ----
  const save = async () => {
    if (!project) return
    if (!title.trim()) { setError('Project name is required'); return }
    setSaving(true); setError('')

    const details = {
      ...(project.details || {}), // preserve units, amenities, unitSizes, startingPrice, etc.
      handover,
      floors: floors === '' ? (project.details?.floors ?? null) : toInt(floors),
      totalUnits: totalUnits === '' ? (project.details?.totalUnits ?? null) : toInt(totalUnits),
      constructionStatus,
      images: gallery.map((g) => g.key),
      masterPlanKey: masterPlan?.key || null,
      masterPlanName: masterPlan?.filename || null,
      documents: Object.fromEntries(documents.map((d) => [d.name, { key: d.key, filename: d.filename, size: d.size }])),
      floorPlans: floorPlans.map((f) => ({ label: f.label, key: f.key, filename: f.filename, size: f.size })),
      progressPercent: Number(progress.progressPercent) || 0,
      timeline: progress.timeline,
      paymentPlan: progress.paymentPlan.map((p) => ({ ...p, pct: Number(p.pct) || 0 })),
    }

    const payload = {
      title: title.trim(),
      city: city.trim() || project.city,
      country: project.country,
      type: type || project.type,
      bedrooms: bedrooms.trim(),
      priceFrom: toInt(priceFrom),
      priceTo: toInt(priceTo),
      commissionPct: parseFloat(commissionPct) || 0,
      status,
      location: location?.address || project.location,
      address: location?.address || project.address || null,
      latitude: location?.lat ?? project.latitude ?? null,
      longitude: location?.lng ?? project.longitude ?? null,
      mapLink: location?.lat != null ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : (project.mapLink || ''),
      description: description.trim(),
      details,
    }
    payload.imageKey = gallery[0]?.key || null

    try {
      await adminApi.updateProject(project.id, payload)
      navigate(`/admin/projects/${id}`)
    } catch (err) {
      setError(err.message || 'Could not save changes')
      setSaving(false)
    }
  }

  const backToReview = () => navigate(`/admin/projects/${id}`)

  const header = (extraActions) => (
    <Topbar
      left={
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span onClick={() => navigate('/admin/projects')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Projects</span>
          <Icon name="chevronRight" size={14} color={colors.borderStrong} strokeWidth={2} />
          <span onClick={backToReview} style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{project?.title || 'Project'}</span>
          <Icon name="chevronRight" size={14} color={colors.borderStrong} strokeWidth={2} />
          <span style={{ fontSize: 13, color: colors.textFaint }}>Edit</span>
        </div>
      }
      actions={extraActions}
    />
  )

  if (loading) {
    return (
      <>
        {header(null)}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, fontSize: 13, color: colors.textFaint }}>Loading project…</div>
      </>
    )
  }

  if (notFound || !project) {
    return (
      <>
        {header(<button onClick={() => navigate('/admin/projects')} style={btnGhost}>← Back to list</button>)}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: colors.bg }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted }}>{notFound ? 'Project not found' : (error || 'Could not load project')}</div>
          <button onClick={() => navigate('/admin/projects')} style={btnGhost}>← Back to projects</button>
        </div>
      </>
    )
  }

  const typeOptions = type && !TYPE_OPTIONS.includes(type) ? [type, ...TYPE_OPTIONS] : TYPE_OPTIONS
  const statusOptions = status && !STATUS_OPTIONS.includes(status) ? [status, ...STATUS_OPTIONS] : STATUS_OPTIONS

  return (
    <>
      {header(
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={backToReview} style={btnGhost}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ height: 36, padding: '0 18px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }} className="wa-form">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 24px 32px' }}>
          {error && (
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: colors.red }}>{error}</div>
          )}

          {/* Basic info */}
          <div style={card}>
            <div style={cardLabel}>Basic Information</div>
            <div style={{ marginBottom: 12 }}><Field label="Project Name *"><input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} /></Field></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <Field label="Type"><select value={type} onChange={(e) => setType(e.target.value)} style={selStyle}>{typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value)} style={selStyle}>{statusOptions.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}</select></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} /></Field>
              <Field label="Bedrooms"><input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="e.g. 1, 2, 3 BR" style={inputStyle} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Price From (SAR)"><input value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} style={inputStyle} /></Field>
              <Field label="Price To (SAR)"><input value={priceTo} onChange={(e) => setPriceTo(e.target.value)} style={inputStyle} /></Field>
              <Field label="Commission %"><input value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} style={inputStyle} /></Field>
            </div>
          </div>

          {/* Development details */}
          <div style={card}>
            <div style={cardLabel}>Development Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <Field label="Expected Handover"><input value={handover} onChange={(e) => setHandover(e.target.value)} placeholder="Q4 2027" style={inputStyle} /></Field>
              <Field label="Construction Status"><input value={constructionStatus} onChange={(e) => setConstructionStatus(e.target.value)} placeholder="Under Construction" style={inputStyle} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Total Floors"><input value={floors} onChange={(e) => setFloors(e.target.value)} placeholder="12" style={inputStyle} /></Field>
              <Field label="Total Units"><input value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} placeholder="96" style={inputStyle} /></Field>
            </div>
          </div>

          {/* Description */}
          <div style={card}>
            <div style={cardLabel}>Description</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project…" style={textareaStyle} />
          </div>

          {/* Location */}
          <div style={card}>
            <div style={cardLabel}>Location</div>
            <MapPicker value={location} onChange={setLocation} height={260} />
          </div>

          {/* Gallery images */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={cardLabel}>Gallery Images</span>
              <button onClick={addImage} disabled={busy === 'image'} style={btnGhost}>{busy === 'image' ? 'Uploading…' : '+ Add image'}</button>
            </div>
            {gallery.length === 0 ? (
              <div style={{ fontSize: 12, color: colors.textFaint }}>No images yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
                {gallery.map((g, i) => (
                  <div key={g.key} style={{ position: 'relative', border: `1px solid ${i === 0 ? colors.green : colors.border}`, borderRadius: 8, overflow: 'hidden', aspectRatio: '5/4', backgroundColor: colors.surfaceMuted, backgroundImage: g.url ? `url(${g.url})` : hatch, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    {i === 0 && <span style={{ position: 'absolute', bottom: 3, left: 3, background: colors.green, color: '#fff', fontSize: 8, fontWeight: 700, borderRadius: 3, padding: '1px 4px' }}>COVER</span>}
                    <span onClick={() => removeImage(g.key)} title="Remove" style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</span>
                  </div>
                ))}
              </div>
            )}
            {gallery.length > 0 && <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 8 }}>First image is the cover.</div>}
          </div>

          {/* Floor plans */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={cardLabel}>Floor Plans</span>
              <button onClick={addFloorPlan} disabled={busy === 'floorPlan'} style={btnGhost}>{busy === 'floorPlan' ? 'Uploading…' : '+ Add floor plan'}</button>
            </div>
            {floorPlans.length === 0 ? (
              <div style={{ fontSize: 12, color: colors.textFaint }}>No floor plans yet.</div>
            ) : (
              floorPlans.map((f, i) => (
                <div key={f.key || i} style={{ display: 'flex', gap: 10, alignItems: 'center', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 8, marginBottom: 8 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 6, flexShrink: 0, backgroundColor: colors.surfaceMuted, backgroundImage: f.url && isImageName(f.filename) ? `url(${f.url})` : hatch, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!(f.url && isImageName(f.filename)) && <Icon name="layers" size={20} color={colors.textFaint} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input value={f.label} onChange={(e) => setFloorPlanLabel(i, e.target.value)} placeholder="Label" style={{ ...inputStyle, marginBottom: 4 }} />
                    <div style={{ fontSize: 11, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.filename || '—'}{f.size != null ? ` · ${fmtSize(f.size)}` : ''}</div>
                  </div>
                  <button onClick={() => removeFloorPlan(i)} style={{ ...btnGhost, color: colors.red, borderColor: colors.redTintBorder }}>× Remove</button>
                </div>
              ))
            )}
          </div>

          {/* Master plan */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={cardLabel}>Master Plan</span>
              <button onClick={uploadMaster} disabled={busy === 'master'} style={btnGhost}>{busy === 'master' ? 'Uploading…' : masterPlan ? 'Replace' : '+ Upload master plan'}</button>
            </div>
            {masterPlan ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ width: 56, height: 56, borderRadius: 6, flexShrink: 0, backgroundColor: colors.surfaceMuted, backgroundImage: masterPlan.url && isImageName(masterPlan.filename) ? `url(${masterPlan.url})` : hatch, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!(masterPlan.url && isImageName(masterPlan.filename)) && <Icon name="fileText" size={22} color={colors.textFaint} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{masterPlan.filename || 'Master plan'}</div>
                  {masterPlan.size != null && <div style={{ fontSize: 11, color: colors.textFaint }}>{fmtSize(masterPlan.size)}</div>}
                </div>
                <button onClick={removeMaster} style={{ ...btnGhost, color: colors.red, borderColor: colors.redTintBorder }}>× Remove</button>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: colors.textFaint }}>No master plan uploaded.</div>
            )}
          </div>

          {/* Documents */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={cardLabel}>Documents</span>
              <button onClick={addDocument} disabled={busy === 'document'} style={btnGhost}>{busy === 'document' ? 'Uploading…' : '+ Add document'}</button>
            </div>
            {documents.length === 0 ? (
              <div style={{ fontSize: 12, color: colors.textFaint }}>No documents yet.</div>
            ) : (
              documents.map((d, i) => (
                <div key={d.key || i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: i < documents.length - 1 ? `1px solid ${colors.surfaceMuted}` : 'none' }}>
                  <Icon name="fileText" size={16} color={colors.textFaint} strokeWidth={1.7} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>{d.filename || '—'}{d.size != null ? ` · ${fmtSize(d.size)}` : ''}</div>
                  </div>
                  <button onClick={() => removeDocument(i)} style={{ ...btnGhost, color: colors.red, borderColor: colors.redTintBorder }}>× Remove</button>
                </div>
              ))
            )}
          </div>

          {/* Construction timeline & payment plan */}
          <div style={{ ...card, marginBottom: 0 }}>
            <div style={cardLabel}>Construction timeline & payment plan</div>
            <ProjectProgressEditor value={progress} onChange={setProgress} />
          </div>

          {/* Bottom save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button onClick={backToReview} style={btnGhost}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ height: 38, padding: '0 20px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>
      </div>
    </>
  )
}
