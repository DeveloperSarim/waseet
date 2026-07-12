import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { colors, radius } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { useHover } from '../../hooks/useHover'
import { getProject } from '../../data/mock'
import { MapView } from '../../components/MapView'
import { DocPreviewModal } from '../../components/DocPreviewModal'
import { realtorApi } from '../../lib/api'
import { countryName } from '../../lib/adminFormat'
import { fmtPriceRange, projLoc } from '../../lib/projectFormat'
import { cityImage } from '../../lib/cityImages'
import { PublicUserMenu } from '../../components/PublicUserMenu'
import { useAuth } from '../../context/AuthContext'
import { leadsPath } from '../../lib/portalNav'

const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 8px)'
const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }
const cardTitle = { fontSize: 14, fontWeight: 600, marginBottom: 14 }

const curFor = (c) => (c === 'AE' ? 'AED' : c === 'PK' ? 'PKR' : 'SAR')
// compact money: 1_200_000 -> "SAR 1.2M", 480_000 -> "SAR 480k"
const kMoney = (n, cur = 'SAR') => {
  if (n == null || n === '') return null
  const v = Number(n)
  if (Number.isNaN(v)) return null
  if (v >= 1e6) return `${cur} ${(v / 1e6).toFixed(v % 1e6 ? 1 : 0)}M`
  if (v >= 1000) return `${cur} ${Math.round(v / 1000)}k`
  return `${cur} ${v.toLocaleString()}`
}
const fileSize = (bytes) => {
  if (bytes == null) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
const isImageDoc = (d) => (d?.mimeType || '').startsWith('image') || /\.(png|jpe?g|webp|gif)$/i.test(d?.filename || '')

// Full-screen image lightbox with prev/next + close.
function Lightbox({ images, index, onIndex, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onIndex((index + 1) % images.length)
      else if (e.key === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, images.length, onIndex, onClose])
  const multi = images.length > 1
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 16, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <span onClick={onClose} style={{ color: '#fff', display: 'flex' }}><Icon name="x" size={22} color="#fff" strokeWidth={2} /></span>
      </div>
      {multi && (
        <div onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + images.length) % images.length) }} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronLeft" size={26} color="#fff" strokeWidth={2} />
        </div>
      )}
      <img src={images[index]} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
      {multi && (
        <div onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % images.length) }} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronRight" size={26} color="#fff" strokeWidth={2} />
        </div>
      )}
      {multi && <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 999 }}>{index + 1} / {images.length}</div>}
    </div>
  )
}

const unitData = [
  { type: 'Studio', size: '45–55 m²', price: 'SAR 420k–480k', units: '8 available', comm: '3%', sold: false },
  { type: '1BR', size: '75–90 m²', price: 'SAR 600k–700k', units: '12 available', comm: '3%', sold: false },
  { type: '2BR', size: '110–130 m²', price: 'SAR 850k–1M', units: '8 available', comm: '3%', sold: false },
  { type: '3BR', size: '150–170 m²', price: 'SAR 1.1M–1.3M', units: 'Sold Out', comm: '2.5%', sold: true },
]
const amenities = [
  { name: 'Swimming Pool', d: 'M2 16c2 0 2 1.2 4 1.2s2-1.2 4-1.2 2 1.2 4 1.2 2-1.2 4-1.2M2 20c2 0 2 1.2 4 1.2s2-1.2 4-1.2 2 1.2 4 1.2 2-1.2 4-1.2M7 14V5a2 2 0 0 1 4 0M7 9h4' },
  { name: 'Gymnasium', d: 'M4 9v6M8 7v10M16 7v10M20 9v6M8 12h8' },
  { name: '24/7 Security', d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' },
  { name: 'Underground Parking', d: 'M7 21V4h6a4 4 0 0 1 0 8H7' },
  { name: 'Landscaped Garden', d: 'M5 21c0-9 6-13 14-13 0 8-4 14-13 14M5 21c2-4 5-6 9-7' },
  { name: 'High-speed Elevators', d: 'M6 3h12v18H6zM10 8l2-2 2 2M10 16l2 2 2-2' },
  { name: 'Retail Ground Floor', d: 'M3 9l1-5h16l1 5M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z' },
  { name: 'Kids Play Area', d: 'M12 4a1.5 1.5 0 1 0 0 0.01M5 21l3-7h8l3 7M9 14v-3a3 3 0 0 1 6 0v3' },
  { name: 'Steam & Sauna', d: 'M4 20h16M6 20v-6M18 20v-6M5 14h14' },
  { name: 'Accessible Design', d: 'M12 5a1.5 1.5 0 1 0 0 0.01M9 9l3 1h3M12 10v4l3 5M12 14a4 4 0 1 0 3 6.4' },
  { name: 'Smart Home System', d: 'M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h0.01' },
  { name: 'Sea View Units', d: 'M2 9c2 0 2 1.2 4 1.2S10 9 12 9s2 1.2 4 1.2S20 9 22 9M2 14c2 0 2 1.2 4 1.2S10 14 12 14s2 1.2 4 1.2S20 14 22 14' },
]
const nearby = [
  { name: 'Al-Noor International School', dist: '0.5 km', d: 'M3 10l9-5 9 5-9 5zM7 12v5c0 1 5 3 5 3s5-2 5-3v-5' },
  { name: 'Al-Hamra Medical Center', dist: '1.2 km', d: 'M5 21V8l7-5 7 5v13M9 12h6M12 9v6' },
  { name: 'Red Sea Mall', dist: '2.0 km', d: 'M6 8V6a6 6 0 0 1 12 0v2M4 8h16l-1 12H5z' },
  { name: 'Al-Rawdhah Mosque', dist: '0.3 km', d: 'M12 3c-3 3-5 5-5 8h10c0-3-2-5-5-8zM5 21v-8M19 21v-8M8 21v-6h8v6' },
  { name: 'Jeddah Corniche', dist: '3.5 km', d: 'M3 20h18M12 12V4M12 12c-3 0-5-2-5-5 3 0 5 2 5 5' },
]
const documents = [
  { name: 'Project Brochure', size: '4.2 MB' },
  { name: 'Payment Plan', size: '1.8 MB' },
  { name: 'Master Plan', size: '6.1 MB' },
  { name: 'NOC Document', size: '2.3 MB' },
]
const quickFacts = [
  { value: 'Under Construction', label: 'Status', d: 'M2 20h20M4 20V10l5-3 5 3v10M9 13h0.01M9 16h0.01' },
  { value: 'Q4 2027', label: 'Handover', d: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18' },
  { value: '12', label: 'Floors', d: 'M6 3h12v18H6zM10 7h4M10 11h4M10 15h4' },
  { value: '96', label: 'Total units', d: 'M3 21h18M5 21V7l7-4 7 4v14M10 21v-5h4v5' },
  { value: '45 – 170 m²', label: 'Unit sizes', d: 'M3 3h18v18H3zM3 9h18M9 21V9' },
  { value: 'SAR 420k', label: 'Starting from', d: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
]
const fpTabs = ['Studio', '1BR', '2BR', '3BR']

function SectionCard({ title, right, children, style }) {
  return (
    <div style={{ ...card, ...style }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={cardTitle}>{title}</span>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

export default function ProjectDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth() || {}

  // Fetch the real project from the live backend; fall back to mock data so the
  // page never crashes before load (or if the id isn't in the backend).
  const [project, setProject] = useState(() => getProject(id))
  useEffect(() => {
    realtorApi.getProject(id).then((p) => { setProject(p); setActiveIdx(0) }).catch(() => setProject(getProject(id) || null))
  }, [id])

  // Real marketplace projects for the "Similar projects" section (no hardcoded cards).
  const [allProjects, setAllProjects] = useState([])
  useEffect(() => {
    realtorApi.listProjects().then((list) => setAllProjects(Array.isArray(list) ? list : [])).catch(() => setAllProjects([]))
  }, [])
  const otherProjects = allProjects.filter((p) => String(p.id) !== String(id))
  const sameCityProjects = project?.city ? otherProjects.filter((p) => p.city === project.city) : []
  const similarProjects = (sameCityProjects.length ? sameCityProjects : otherProjects).slice(0, 4)
  const similarCity = sameCityProjects.length ? project.city : null

  // Derive with fallbacks so both real + mock shapes render safely.
  const name = project?.title || project?.name || '—'
  const developer = project?.developerName || project?.developer || '—'
  const city = project?.city || '—'
  const location = project?.location || project?.city || '—'
  const image = project?.image || null
  const price = project?.priceFrom != null ? `SAR ${project.priceFrom.toLocaleString()}` : (project?.price || '—')
  const commission = project?.commissionPct != null ? `${project.commissionPct}%` : null
  const description = project?.description

  // Real, resolved media + details (falls back to the demo constants when absent).
  const cur = curFor(project?.country)
  const det = project?.details || {}
  const galleryImages = ((Array.isArray(project?.images) && project.images.length ? project.images : (image ? [image] : [])) || []).filter(Boolean)
  const projectDocs = Array.isArray(project?.documents) && project.documents.length ? project.documents : null
  const devInfo = project?.developer || null
  const unitRows = Array.isArray(det.units) && det.units.length ? det.units : null
  const amenityNames = Array.isArray(det.amenities) && det.amenities.length ? det.amenities : null
  const floorPlans = Array.isArray(project?.floorPlans) ? project.floorPlans : []
  // Construction timeline + payment plan (real from details, else sensible defaults)
  const DEFAULT_TIMELINE = [
    { label: 'Planning', date: 'Q1 2024', state: 'done' },
    { label: 'Foundation', date: 'Q3 2024', state: 'done' },
    { label: 'Construction', date: 'In Progress', state: 'active' },
    { label: 'Handover', date: det.handover || 'Q4 2027', state: 'todo' },
  ]
  const DEFAULT_PAYMENT = [
    { pct: 20, title: 'Down payment', sub: 'On signing' },
    { pct: 60, title: 'During construction', sub: 'Quarterly instalments' },
    { pct: 20, title: 'On handover', sub: det.handover || 'On completion' },
  ]
  const timeline = Array.isArray(det.timeline) && det.timeline.length ? det.timeline : DEFAULT_TIMELINE
  const paymentPlan = Array.isArray(det.paymentPlan) && det.paymentPlan.length ? det.paymentPlan : DEFAULT_PAYMENT
  const progressPercent = det.progressPercent != null ? det.progressPercent : 68
  const pctNum = (p) => Number(String(p.pct).replace('%', '')) || 0
  const _activeIdx = timeline.findIndex((t) => t.state === 'active')
  const _doneCount = timeline.filter((t) => t.state === 'done').length
  const lineFill = timeline.length <= 1 ? 0 : Math.max(0, Math.min(1, (_activeIdx >= 0 ? _activeIdx : _doneCount - 1) / (timeline.length - 1))) * 100
  const displayUnits = unitRows
    ? unitRows.map((u) => {
        const lo = kMoney(u.priceMin, cur), hi = kMoney(u.priceMax, cur)
        const price = lo && hi ? `${lo}–${hi.replace(cur + ' ', '')}` : lo || hi || '—'
        const size = [u.sizeMin, u.sizeMax].filter(Boolean).join('–')
        return { type: u.type, size: size ? `${size} m²` : '—', price, units: u.count ? `${u.count} available` : '—', comm: u.comm ? `${u.comm}%` : '—', sold: false }
      })
    : unitData
  const AMENITY_PATHS = Object.fromEntries(amenities.map((a) => [a.name, a.d]))
  const displayAmenities = amenityNames ? amenityNames.map((n) => ({ name: n, d: AMENITY_PATHS[n] || 'M20 6L9 17l-5-5' })) : amenities
  const devName = devInfo?.name || developer
  const devInitials = String(devName || 'D').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'D'
  const devSince = devInfo?.since ? new Date(devInfo.since).getFullYear() : null
  const openDoc = (d) => { if (d?.url) setPreviewDoc({ ...d, title: d.name || d.filename }) }
  const factVals = [
    det.constructionStatus,
    det.handover,
    det.floors != null ? String(det.floors) : null,
    det.totalUnits != null ? String(det.totalUnits) : null,
    det.unitSizes,
    det.startingPrice != null ? kMoney(det.startingPrice, cur) : (project?.priceFrom != null ? kMoney(project.priceFrom, cur) : null),
  ]
  const displayFacts = quickFacts.map((q, i) => ({ ...q, value: factVals[i] || q.value }))
  const commRates = unitRows ? unitRows.map((u) => [u.type, `${u.comm}%`]) : [['Studio', '3%'], ['1BR', '3%'], ['2BR', '3%'], ['3BR', '2.5%']]
  const exPrice = project?.priceFrom || 900000
  const exComm = project?.commissionPct != null ? project.commissionPct : 3
  const exEarn = Math.round((exPrice * exComm) / 100)

  const [img, setImg] = useState(1)
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightbox, setLightbox] = useState(null) // { images:[urls], index }
  const [previewDoc, setPreviewDoc] = useState(null) // document shown in the popup
  const [saved, setSaved] = useState(false)
  const safeIdx = Math.min(activeIdx, Math.max(0, galleryImages.length - 1))
  const [aboutOpen, setAboutOpen] = useState(false)
  const [fpIdx, setFpIdx] = useState(0)
  const fpSafe = Math.min(fpIdx, Math.max(0, floorPlans.length - 1))
  const [lead, setLead] = useState({ name: '', phone: '', unit: '', budget: '', notes: '' })
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadError, setLeadError] = useState('')

  const canSubmit = lead.name.trim() && lead.phone.trim() && lead.unit
  const onSubmit = async () => {
    if (!canSubmit || leadSubmitting) return
    setLeadSubmitting(true)
    setLeadError('')
    try {
      await realtorApi.createLead({
        projectId: id,
        clientName: lead.name,
        clientPhone: lead.phone,
        unit: lead.unit,
        budget: lead.budget,
        notes: lead.notes,
      })
      setLeadSubmitted(true)
    } catch (e) {
      setLeadError(e?.message || 'Could not submit the lead. Please try again.')
    } finally {
      setLeadSubmitting(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: colors.ink, background: colors.bg, minHeight: '100vh' }}>
      {/* Navbar */}
      <div style={{ height: 56, minHeight: 56, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: '#fff', position: 'sticky', top: 0, zIndex: 40 }}>
        <Link to="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" /><circle cx="12" cy="11" r="2.4" /></svg>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>waseet</span>
          <span style={{ fontSize: 12, color: colors.textFaint, marginLeft: 2 }}>وسيط</span>
        </Link>
        <PublicUserMenu />
      </div>

      {/* Breadcrumb */}
      <div style={{ height: 44, background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link to="/marketplace" style={{ fontSize: 12, color: colors.textSoft }}>Marketplace</Link>
        <span style={{ fontSize: 12, color: colors.borderStrong }}>/</span>
        <span style={{ fontSize: 12, color: colors.textSoft }}>{city}</span>
        <span style={{ fontSize: 12, color: colors.borderStrong }}>/</span>
        <span style={{ fontSize: 12, color: colors.ink }}>{name}</span>
      </div>

      {/* Gallery */}
      <div style={{ background: '#fff', maxWidth: 1280, margin: '0 auto', borderLeft: `1px solid ${colors.border}`, borderRight: `1px solid ${colors.border}` }}>
        <div
          onClick={() => galleryImages.length && setLightbox({ images: galleryImages, index: safeIdx })}
          style={{ aspectRatio: '16 / 9', background: colors.surfaceMuted, backgroundImage: galleryImages.length ? 'none' : hatch, position: 'relative', cursor: galleryImages.length ? 'zoom-in' : 'default', overflow: 'hidden' }}
        >
          {galleryImages.length > 0 ? (
            <img src={galleryImages[safeIdx]} alt={name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'monospace', fontSize: 12, color: '#B6BAC0' }}>No images yet</span>
          )}
          <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 }}>
            <span style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 999, padding: '3px 8px', fontSize: 10, fontWeight: 600, color: colors.greenDark }}>FEATURED</span>
            <span style={{ background: '#FEF9EC', border: '1px solid #F3E2B8', borderRadius: 999, padding: '3px 8px', fontSize: 10, fontWeight: 600, color: '#92763A' }}>NEW</span>
          </div>
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6 }}>
            {galleryImages.length > 0 && (
              <div onClick={(e) => { e.stopPropagation(); setLightbox({ images: galleryImages, index: safeIdx }) }} style={{ height: 32, padding: '0 10px', background: 'rgba(255,255,255,0.9)', border: `1px solid ${colors.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: colors.textMuted }}>
                <Icon name="externalLink" size={14} color={colors.textSoft} strokeWidth={1.9} />Expand
              </div>
            )}
            <div onClick={(e) => { e.stopPropagation(); setSaved(!saved) }} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.9)', border: `1px solid ${colors.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill={saved ? colors.green : 'none'} stroke={saved ? colors.green : colors.textSoft} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
            </div>
          </div>
          {galleryImages.length > 1 && (
            <>
              <div onClick={(e) => { e.stopPropagation(); setActiveIdx((safeIdx - 1 + galleryImages.length) % galleryImages.length) }} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, background: 'rgba(255,255,255,0.9)', border: `1px solid ${colors.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="chevronLeft" size={18} color={colors.textMuted} strokeWidth={2} />
              </div>
              <div onClick={(e) => { e.stopPropagation(); setActiveIdx((safeIdx + 1) % galleryImages.length) }} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, background: 'rgba(255,255,255,0.9)', border: `1px solid ${colors.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="chevronRight" size={18} color={colors.textMuted} strokeWidth={2} />
              </div>
              <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.5)', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 500, color: '#fff' }}>{safeIdx + 1} / {galleryImages.length}</div>
            </>
          )}
        </div>
        {galleryImages.length > 1 && (
          <div style={{ padding: '10px 32px', borderBottom: `1px solid ${colors.border}`, display: 'flex', gap: 8, overflowX: 'auto' }}>
            {galleryImages.map((src, i) => (
              <div key={i} onClick={() => setActiveIdx(i)} style={{ width: 72, height: 48, minWidth: 72, borderRadius: 6, background: colors.surfaceMuted, overflow: 'hidden', border: `2px solid ${safeIdx === i ? colors.green : 'transparent'}`, cursor: 'pointer' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two column */}
      <div className="pd-cols" style={{ display: 'flex', gap: 24, padding: '24px 32px', maxWidth: 1280, margin: '0 auto', alignItems: 'flex-start' }}>
        {/* LEFT */}
        <div style={{ flex: 2.5, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{name}</h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: '#FEF9EC', border: '1px solid #F3E2B8', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#92763A' }}>Under Construction</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: colors.textFaint }}>
                  <Icon name="eye" size={12} color="currentColor" strokeWidth={2} />124 views
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: colors.textMuted }}><Icon name="mapPin" size={14} color={colors.green} strokeWidth={1.9} />{location}{project?.country ? ` · ${countryName(project.country)}` : ''}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: colors.textMuted }}><Icon name="building" size={14} color={colors.textFaint} strokeWidth={1.8} />{developer} <Icon name="checkCircle" size={13} color={colors.green} strokeWidth={2} /></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: colors.textMuted }}><Icon name="calendar" size={14} color={colors.textFaint} strokeWidth={1.8} />Handover: Q4 2027</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: colors.textMuted }}><Icon name="layers" size={14} color={colors.textFaint} strokeWidth={1.8} />12 Floors · 96 Units</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: colors.textFaint }}>Launch price from:</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 1 }}>{price} <span style={{ fontSize: 12, fontWeight: 400, color: colors.textFaint }}>per unit</span></div>
            </div>
          </div>

          {/* Unit types */}
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: colors.bg, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Unit Types</span>
              <span style={{ fontSize: 11, color: colors.textFaint }}>All prices include VAT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr 1.1fr 0.9fr', background: colors.bg, borderBottom: `1px solid ${colors.border}`, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span style={{ padding: '9px 16px' }}>Type</span><span style={{ padding: '9px 8px' }}>Size</span><span style={{ padding: '9px 8px' }}>Price</span><span style={{ padding: '9px 8px' }}>Units Avail.</span><span style={{ padding: '9px 8px' }}>Commission</span>
            </div>
            {displayUnits.map((u) => (
              <div key={u.type} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr 1.1fr 0.9fr', height: 44, borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                <span style={{ padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: u.sold ? colors.textFaint : colors.ink, textDecoration: u.sold ? 'line-through' : 'none', fontStyle: u.sold ? 'italic' : 'normal' }}>{u.type}</span>
                <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 13, color: u.sold ? colors.textFaint : colors.textMuted }}>{u.size}</span>
                <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: u.sold ? colors.textFaint : colors.ink }}>{u.price}</span>
                <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 13, color: u.sold ? colors.textFaint : colors.textMuted }}>{u.units}</span>
                <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}><span style={{ background: colors.greenTint, color: colors.greenDark, fontSize: 13, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>{u.comm}</span></span>
              </div>
            ))}
          </div>

          {/* About */}
          <div style={card}>
            <div style={cardTitle}>About the project</div>
            <div
              style={
                aboutOpen
                  ? undefined
                  : { maxHeight: 96, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(#000 60%, transparent)', maskImage: 'linear-gradient(#000 60%, transparent)' }
              }
            >
              {description ? (
                <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{description}</p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.7, margin: '0 0 12px' }}>
                    {name} is a premium residential development located in the prestigious {location} district. The project features 96 fully finished units across 12 floors, offering studio, 1BR, 2BR, and 3BR apartments with panoramic views of the Red Sea.
                  </p>
                  <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.7, margin: 0 }}>
                    Built to international standards with high-end German kitchen fittings, Italian marble flooring, and smart home automation throughout every unit.
                  </p>
                </>
              )}
            </div>
            <span onClick={() => setAboutOpen(!aboutOpen)} style={{ display: 'inline-block', marginTop: 10, fontSize: 13, color: colors.green, cursor: 'pointer', fontWeight: 500 }}>{aboutOpen ? 'Show less ↑' : 'Show more ↓'}</span>
          </div>

          {/* Status timeline — real */}
          <SectionCard title="Project status" right={<span style={{ fontSize: 12, fontWeight: 600, color: colors.ink }}>{progressPercent}% Complete</span>}>
            <div style={{ display: 'flex', position: 'relative', marginTop: 6 }}>
              <div style={{ position: 'absolute', top: 7, left: '12%', right: '12%', height: 2, background: `linear-gradient(90deg, ${colors.green} 0%, ${colors.green} ${lineFill}%, #E5E7EB ${lineFill}%, #E5E7EB 100%)` }} />
              {timeline.map((s, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: s.state === 'done' ? colors.green : '#fff', border: s.state === 'todo' ? `2px solid ${colors.border}` : `2px solid ${colors.green}`, boxShadow: s.state === 'done' ? `0 0 0 1px ${colors.green}` : 'none', animation: s.state === 'active' ? 'ps-pulse 1.8s ease-in-out infinite' : 'none' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: s.state === 'todo' ? colors.textFaint : colors.green, marginTop: 8 }}>{s.label}</span>
                  <span style={{ fontSize: 10, color: s.state === 'todo' ? colors.textFaint : colors.green }}>{s.date}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Payment plan — real */}
          <div style={card}>
            <div style={{ ...cardTitle, marginBottom: 16 }}>Payment plan</div>
            <div style={{ height: 40, borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
              {paymentPlan.map((p, i) => {
                const bg = [colors.greenTint, colors.greenSoft, colors.greenTintBorder][i % 3]
                return <div key={i} style={{ width: `${pctNum(p)}%`, background: bg, borderRight: '1px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: colors.greenDark }}>{pctNum(p)}%</div>
              })}
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 14, flexWrap: 'wrap' }}>
              {paymentPlan.map((p, i) => (
                <div key={i}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{pctNum(p)}%</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{p.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div style={card}>
            <div style={{ ...cardTitle, marginBottom: 16 }}>Features &amp; Amenities</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              {displayAmenities.map((a) => (
                <div key={a.name} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8 }}>
                  <span style={{ width: 32, height: 32, minWidth: 32, background: colors.greenTint, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={a.d} /></svg>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floor plans — real, per unit type */}
          {floorPlans.length > 0 && (
            <div style={card}>
              <div style={{ ...cardTitle, marginBottom: 14 }}>Floor plans</div>
              <div className="pd-tabs" style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: 16, overflowX: 'auto' }}>
                {floorPlans.map((fp, i) => (
                  <div key={i} onClick={() => setFpIdx(i)} style={{ padding: '8px 14px 10px', fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer', color: fpSafe === i ? colors.ink : colors.textSoft, fontWeight: fpSafe === i ? 600 : 400, borderBottom: `2px solid ${fpSafe === i ? colors.ink : 'transparent'}` }}>{fp.label}</div>
                ))}
              </div>
              <div
                onClick={() => setLightbox({ images: floorPlans.map((f) => f.url), index: fpSafe })}
                style={{ position: 'relative', width: '100%', height: 300, background: colors.surfaceMuted, borderRadius: 10, overflow: 'hidden', cursor: 'zoom-in', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <img src={floorPlans[fpSafe].url} alt={floorPlans[fpSafe].label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="externalLink" size={13} color="currentColor" strokeWidth={2} />Expand
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <a href={floorPlans[fpSafe].url} target="_blank" rel="noreferrer" download style={{ height: 32, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, background: '#fff', fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                  <Icon name="download" size={13} color="currentColor" strokeWidth={1.8} />Download {floorPlans[fpSafe].label}
                </a>
              </div>
            </div>
          )}

          {/* Location */}
          <div style={card}>
            <div style={{ ...cardTitle, marginBottom: 14 }}>Location</div>
            <MapView lat={project?.latitude} lng={project?.longitude} label={name} mapLink={project?.mapLink} height={280} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12 }}>
              <Icon name="mapPin" size={14} color={colors.green} strokeWidth={1.9} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>{project?.address || project?.location || location}</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Nearby</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nearby.map((n) => (
                  <div key={n.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8 }}>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={n.d} /></svg>
                      <span style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>{n.name}</span>
                    </span>
                    <span style={{ fontSize: 11, color: colors.textFaint }}>{n.dist}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Developer */}
          <div style={card}>
            <div style={{ ...cardTitle, marginBottom: 14 }}>Developer</div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, minWidth: 48, background: colors.surfaceMuted, border: `1px solid ${colors.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: colors.textMuted }}>{devInitials}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{devName}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: colors.green }}><Icon name="checkCircle" size={13} color={colors.green} strokeWidth={2} />Verified</span>
                </div>
                <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>{[devInfo?.city, devInfo?.country ? countryName(devInfo.country) : null].filter(Boolean).join(' · ') || 'Real Estate Developer'}</div>
                <div style={{ fontSize: 12, color: colors.green, marginTop: 2 }}>{devInfo?.projectCount ?? '—'} project{devInfo?.projectCount === 1 ? '' : 's'} on Waseet</div>
              </div>
            </div>
            {devInfo?.bio && <p style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.6, margin: '12px 0 0' }}>{devInfo.bio}</p>}
            <div style={{ display: 'flex', gap: 16, marginTop: 14, borderTop: `1px solid ${colors.surfaceMuted}`, paddingTop: 14 }}>
              {[{ v: String(devInfo?.projectCount ?? '—'), l: 'Projects' }, { v: devInfo?.city || '—', l: 'Based in' }, { v: devSince ? String(devSince) : '—', l: 'On Waseet since' }].map((s, i) => (
                <div key={s.l} style={{ flex: 1, textAlign: 'center', borderLeft: i ? `1px solid ${colors.surfaceMuted}` : 'none' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {devInfo?.website && <a href={devInfo.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, fontSize: 12, fontWeight: 500, color: colors.greenDark, textDecoration: 'none' }}><Icon name="externalLink" size={13} color={colors.greenDark} strokeWidth={1.9} />Visit website</a>}
          </div>

          {/* Documents */}
          <div style={card}>
            <div style={{ ...cardTitle, marginBottom: 14 }}>Documents</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(projectDocs || documents).map((d) => {
                const sizeLabel = d.url ? fileSize(d.size) : d.size
                return (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '11px 14px', background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8 }}>
                    <span style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                      <Icon name={isImageDoc(d) ? 'layers' : 'fileText'} size={18} color={colors.textFaint} strokeWidth={1.7} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                      {sizeLabel && <span style={{ fontSize: 11, color: colors.textFaint }}>{sizeLabel}</span>}
                    </span>
                    {d.url ? (
                      <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <span onClick={() => openDoc(d)} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, color: colors.greenDark, border: `1px solid ${colors.greenTintBorder}`, background: colors.greenTint, borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>
                          <Icon name="eye" size={12} color={colors.greenDark} strokeWidth={1.8} />Preview
                        </span>
                        <a href={d.url} target="_blank" rel="noreferrer" download style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: colors.textMuted, border: `1px solid ${colors.border}`, background: '#fff', borderRadius: 5, padding: '3px 8px', textDecoration: 'none' }}>
                          <Icon name="download" size={12} color={colors.textSoft} strokeWidth={1.8} />Download
                        </a>
                      </span>
                    ) : (
                      <Icon name="download" size={16} color={colors.textFaint} strokeWidth={1.8} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT sticky */}
        <div className="pd-right" style={{ flex: 1, minWidth: 300, position: 'sticky', top: 72, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Commission rates */}
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Commission rates</div>
            {commRates.map(([t, c], i) => (
              <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < commRates.length - 1 ? `1px solid ${colors.surfaceMuted}` : 'none' }}>
                <span style={{ fontSize: 13, color: colors.textMuted }}>{t}</span>
                <span style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, color: colors.greenDark, fontSize: 13, fontWeight: 700, borderRadius: 6, padding: '3px 10px' }}>{c}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, background: colors.bg, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: colors.textFaint }}>On a {kMoney(exPrice, cur)} unit</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>Your commission: {cur} {exEarn.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 1 }}>(before platform fee)</div>
            </div>
          </div>

          {/* Lead form */}
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 18 }} className="wa-form">
            {!leadSubmitted ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Submit a lead</span>
                  <span style={{ fontSize: 11, color: colors.textFaint }}>48 leads submitted</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Client full name</div>
                    <input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} placeholder="Khalid Al-Mansour" style={inputSt} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Client phone</div>
                    <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden' }}>
                      <span style={{ width: 84, background: colors.bg, borderRight: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 12, color: colors.textMuted }}>🇸🇦 +966</span>
                      <input value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} placeholder="5X XXX XXXX" style={{ flex: 1, height: 34, border: 'none', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', minWidth: 0 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Unit type</div>
                    <select value={lead.unit} onChange={(e) => setLead({ ...lead, unit: e.target.value })} style={{ ...inputSt, color: lead.unit ? colors.ink : colors.textFaint }}>
                      <option value="">Select unit type</option>
                      {displayUnits.map((u) => (
                        <option key={u.type} value={u.type}>{u.type}{u.comm && u.comm !== '—' ? ` (${u.comm})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Client budget (optional)</div>
                    <input value={lead.budget} onChange={(e) => setLead({ ...lead, budget: e.target.value })} placeholder="SAR 800,000" style={inputSt} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Notes (optional)</div>
                    <textarea value={lead.notes} onChange={(e) => setLead({ ...lead, notes: e.target.value })} placeholder="Any relevant details about the client..." style={{ width: '100%', height: 72, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', color: colors.textMuted, resize: 'none' }} />
                  </div>
                  <button onClick={onSubmit} disabled={!canSubmit || leadSubmitting} style={{ width: '100%', height: 38, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'inherit', background: canSubmit ? colors.green : colors.textFaint, cursor: (canSubmit && !leadSubmitting) ? 'pointer' : 'not-allowed', opacity: leadSubmitting ? 0.75 : 1 }}>{leadSubmitting ? 'Submitting…' : 'Submit Lead'}</button>
                  {leadError && <div style={{ fontSize: 12, color: colors.red, textAlign: 'center' }}>{leadError}</div>}
                  <div style={{ fontSize: 11, color: colors.textFaint, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Icon name="eye" size={12} color="currentColor" strokeWidth={2} />124 realtors have viewed this project
                  </div>
                </div>
              </>
            ) : (
              <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: 18, textAlign: 'center' }}>
                <Icon name="checkCircle" size={32} color={colors.green} strokeWidth={2} style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Lead submitted!</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Client: {lead.name || 'Khalid Al-Mansour'} · {lead.unit || '2BR'}</div>
                <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 6 }}>The developer has been notified.</div>
                <button onClick={() => navigate(leadsPath(user?.role))} style={{ width: '100%', height: 32, marginTop: 12, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 7, fontSize: 13, fontWeight: 500, color: colors.greenDark, fontFamily: 'inherit', cursor: 'pointer' }}>View in My Leads →</button>
                <span onClick={() => { setLeadSubmitted(false); setLeadError(''); setLead({ name: '', phone: '', unit: '', budget: '', notes: '' }) }} style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>Submit another lead</span>
              </div>
            )}
          </div>

          {/* Quick info */}
          <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {displayFacts.map((q) => (
                <div key={q.label}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}><path d={q.d} /></svg>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{q.value}</div>
                  <div style={{ fontSize: 10, color: colors.textFaint }}>{q.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Similar projects */}
      <SimilarProjects navigate={navigate} city={similarCity} projects={similarProjects} />

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onIndex={(i) => setLightbox((l) => (l ? { ...l, index: i } : l))}
          onClose={() => setLightbox(null)}
        />
      )}
      <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  )
}

const simFallback = 'linear-gradient(150deg,#0F3D2E,#1E7A52)'

function SimilarCard({ p, navigate }) {
  const [hovered, hoverProps] = useHover()
  const photo = p.image || cityImage(p.city)
  const isNew = p.createdAt && Date.now() - new Date(p.createdAt).getTime() < 14 * 864e5
  return (
    <div
      {...hoverProps}
      onClick={() => navigate('/marketplace/' + p.id)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? colors.borderStrong : colors.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.06)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 180ms ease',
      }}
    >
      <div style={{ height: 150, background: simFallback, position: 'relative', overflow: 'hidden' }}>
        {photo && <img src={photo} alt={p.title || ''} onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        {(isNew || p.commissionPct >= 4) && (
          <span style={{ position: 'absolute', top: 9, left: 9, background: isNew ? '#FEF9EC' : colors.greenTint, border: `1px solid ${isNew ? '#F3E2B8' : colors.greenTintBorder}`, borderRadius: 999, padding: '2px 8px', fontSize: 9, fontWeight: 600, color: isNew ? '#92763A' : colors.greenDark, letterSpacing: '0.03em' }}>{isNew ? 'NEW' : 'TOP COMMISSION'}</span>
        )}
        {p.commissionPct != null && <span style={{ position: 'absolute', bottom: 9, right: 9, background: '#fff', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: colors.ink }}>{p.commissionPct}%</span>}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title || '—'}</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', margin: '3px 0 7px' }}>
          <Icon name="mapPin" size={12} color={colors.textFaint} strokeWidth={2} />
          <span style={{ fontSize: 12, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{projLoc(p)}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtPriceRange(p)}</div>
      </div>
    </div>
  )
}

function SimilarProjects({ navigate, city, projects = [] }) {
  if (!projects.length) return null
  return (
    <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '32px 32px 44px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{city ? `Similar projects in ${city}` : 'Other projects'}</h2>
          <span onClick={() => navigate(city ? `/browse?city=${encodeURIComponent(city)}` : '/browse')} style={{ fontSize: 13, color: colors.greenDark, fontWeight: 500, cursor: 'pointer' }}>View all →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {projects.map((p) => (
            <SimilarCard key={p.id} p={p} navigate={navigate} />
          ))}
        </div>
      </div>
    </div>
  )
}

const inputSt = {
  width: '100%',
  height: 34,
  border: `1px solid ${colors.border}`,
  borderRadius: 7,
  padding: '0 10px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: colors.ink,
  background: '#fff',
}
