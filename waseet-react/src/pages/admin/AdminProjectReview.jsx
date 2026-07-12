import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { MapView } from '../../components/MapView'
import { adminApi } from '../../lib/api'
import { countryName, initials, joinedLabel } from '../../lib/adminFormat'
import { Icon } from '../../components/icons/Icon'
import { DocPreviewModal } from '../../components/DocPreviewModal'

const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 12 }
const sectionLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }
const rLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }
const fieldLabel = { fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }
const chevronBtn = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
const unitGrid = '0.8fr 1.1fr 1.4fr 0.8fr 0.9fr'
const modalShell = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
const modalCard = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 420, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }
const btnGhost = { height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }

const money = (n) => `SAR ${Number(n || 0).toLocaleString()}`

const STATUS = {
  PENDING: { label: 'Pending Review', bg: '#FEF9EC', color: '#92400E', border: '#F3E2B8', stroke: colors.amber },
  LIVE: { label: 'Live', bg: colors.greenTint, color: colors.greenDark, border: colors.greenTintBorder, stroke: colors.green },
  DRAFT: { label: 'Draft', bg: colors.surfaceMuted, color: colors.textMuted, border: colors.border, stroke: colors.textMuted },
  SOLD_OUT: { label: 'Sold Out', bg: '#FFF5F5', color: '#991B1B', border: colors.redTintBorder, stroke: colors.red },
}

export default function AdminProjectReview() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [lightbox, setLightbox] = useState(null) // { list, idx } | null
  const [fpIdx, setFpIdx] = useState(0)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [modal, setModal] = useState(null) // approve | reject
  const [rejectReason, setRejectReason] = useState('')
  const [reasonError, setReasonError] = useState(false)
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState(null) // { text, tone }

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setProject(await adminApi.getProject(id)) }
    catch (e) { setError(e.message || 'Could not load this project') }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { load() }, [load])

  const images = project?.images || []

  // Keep the gallery index within range whenever the image set changes
  useEffect(() => { setGalleryIdx((i) => (images.length ? Math.min(i, images.length - 1) : 0)) }, [images.length])

  // Lightbox keyboard controls (Esc to close, ‹ › to navigate)
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null)
      else if (e.key === 'ArrowLeft') setLightbox((lb) => (lb ? { ...lb, idx: lb.idx > 0 ? lb.idx - 1 : lb.list.length - 1 } : lb))
      else if (e.key === 'ArrowRight') setLightbox((lb) => (lb ? { ...lb, idx: lb.idx < lb.list.length - 1 ? lb.idx + 1 : 0 } : lb))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const close = () => { if (!working) setModal(null) }
  const hasReason = !!rejectReason.trim()
  const tryReject = () => (hasReason ? setModal('reject') : setReasonError(true))

  const run = async (status, text, opts = {}) => {
    if (working) return
    setWorking(true)
    try {
      await adminApi.setProjectStatus(id, status)
      setModal(null)
      setToast({ text, tone: 'success' })
      if (opts.goList) setTimeout(() => navigate('/admin/projects'), 1000)
      else { await load(); setTimeout(() => setToast(null), 3000) }
    } catch (e) {
      setToast({ text: e.message || 'Action failed', tone: 'error' })
      setTimeout(() => setToast(null), 3500)
    } finally { setWorking(false) }
  }

  const st = project ? (STATUS[project.status] || STATUS.DRAFT) : STATUS.PENDING
  const title = project?.title || (loading ? 'Loading…' : 'Project')

  const projectInfo = project ? [
    ['Project Name', project.title || '—'], ['Type', project.type || '—'],
    ['Status', st.label], ['Bedrooms', project.bedrooms != null && project.bedrooms !== '' ? String(project.bedrooms) : '—'],
    ['City', project.city || '—'], ['Country', countryName(project.country)],
    ['Price From', money(project.priceFrom)], ['Price To', money(project.priceTo)],
    ['Commission', project.commissionPct != null ? `${project.commissionPct}%` : '—'], ['Leads', String(project.leadCount ?? 0)],
    ['Location', project.location || '—'], ['Submitted', joinedLabel(project.createdAt)],
  ] : []

  // A single unit row derived from the project's real figures (no unit-mix breakdown in the API)
  const unitRows = project ? [{
    type: project.type || '—',
    size: '—',
    price: `${money(project.priceFrom)}–${Number(project.priceTo || 0).toLocaleString()}`,
    units: project.bedrooms != null && project.bedrooms !== '' ? `${project.bedrooms} BR` : '—',
    comm: project.commissionPct != null ? `${project.commissionPct}%` : '—',
  }] : []

  // Commission preview computed from the project's real commission % and starting price
  const sample = project ? (project.priceFrom || project.priceTo || 0) : 0
  const pct = project?.commissionPct || 0
  const gross = Math.round(sample * pct / 100)
  const platformCut = Math.round(gross * 0.15)
  const realtorNet = gross - platformCut

  const fileSize = (bytes) => {
    if (!bytes) return ''
    return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  const hasMasterDoc = (project?.documents || []).some((d) => /master\s*plan/i.test(d.name || ''))
  const docRows = project ? [
    ...(project.documents || []),
    ...(project.masterPlanUrl && !hasMasterDoc ? [{ name: 'Master Plan', filename: 'master-plan.pdf', url: project.masterPlanUrl, mimeType: 'application/pdf' }] : []),
  ] : []
  const floorPlans = project?.floorPlans || []
  const activeFp = floorPlans[Math.min(fpIdx, Math.max(0, floorPlans.length - 1))] || null

  const isPending = project?.status === 'PENDING'

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span onClick={() => navigate('/admin/projects')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Projects</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
            <span style={{ fontSize: 13, color: colors.textFaint }}>Review</span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate('/admin/projects')} style={btnGhost}>← Back to list</button>
            <button onClick={() => navigate('/admin/projects/' + id + '/edit')} style={{ height: 34, padding: '0 14px', background: colors.ink, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="edit" size={13} color="#fff" />Edit
            </button>
          </div>
        }
      />

      {loading && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: colors.textFaint }}>Loading project…</div>}

      {!loading && error && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted }}>Project not found</div>
          <div style={{ fontSize: 12, color: colors.textFaint }}>{error}</div>
          <button onClick={() => navigate('/admin/projects')} style={btnGhost}>← Back to projects</button>
        </div>
      )}

      {!loading && !error && project && (
        <>
          {/* Review banner (only while awaiting review) */}
          {isPending && (
            <div style={{ background: colors.amberTint, borderBottom: `1px solid ${colors.amberTintBorder}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth={1.8} style={{ flexShrink: 0 }}><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>Admin Review Mode</span>
              <span style={{ fontSize: 13, color: '#92400E' }}>· This project is not yet live</span>
              <span style={{ fontSize: 13, color: colors.borderStrong }}>·</span>
              <span style={{ fontSize: 13, color: '#92400E' }}>Submitted by {project.developerName || '—'}</span>
              <span style={{ fontSize: 13, color: colors.borderStrong }}>·</span>
              <span style={{ fontSize: 13, color: colors.textFaint }}>{joinedLabel(project.createdAt)}</span>
              <button onClick={() => navigate(`/project/${id}`)} style={{ marginLeft: 'auto', height: 30, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Preview as Realtor ↗</button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className="rp-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '18px 22px' }}>
              {/* LEFT */}
              <div style={{ flex: 2.5, minWidth: 0 }}>
                {/* Gallery */}
                <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ height: 280, background: colors.surfaceMuted, position: 'relative' }}>
                    {images.length > 0 ? (
                      <>
                        <img src={images[Math.min(galleryIdx, images.length - 1)]} alt={project.title || 'Project image'} onClick={() => setLightbox({ list: images, idx: Math.min(galleryIdx, images.length - 1) })} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }} />
                        {images.length > 1 && (
                          <>
                            <div onClick={() => setGalleryIdx((i) => (i > 0 ? i - 1 : images.length - 1))} style={{ ...chevronBtn, left: 12 }}>
                              <Icon name="chevronLeft" size={18} color={colors.textMuted} strokeWidth={2} />
                            </div>
                            <div onClick={() => setGalleryIdx((i) => (i < images.length - 1 ? i + 1 : 0))} style={{ ...chevronBtn, right: 12 }}>
                              <Icon name="chevronRight" size={18} color={colors.textMuted} strokeWidth={2} />
                            </div>
                          </>
                        )}
                        <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 999, padding: '3px 8px', fontSize: 11, color: '#fff' }}>{Math.min(galleryIdx, images.length - 1) + 1} / {images.length}</div>
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', justifyContent: 'center', color: colors.textFaint }}>
                        <Icon name="layers" size={24} color={colors.textFaint} />
                        <span style={{ fontSize: 12 }}>No images uploaded</span>
                      </div>
                    )}
                  </div>
                  {images.length > 0 && (
                    <div style={{ padding: '10px 12px', display: 'flex', gap: 6, overflowX: 'auto', background: colors.bg }}>
                      {images.map((src, n) => (
                        <img key={n} src={src} alt="" onClick={() => setGalleryIdx(n)} style={{ width: 64, height: 48, minWidth: 64, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: galleryIdx === n ? `1.5px solid ${colors.ink}` : '1px solid transparent' }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Project info */}
                <div style={card}>
                  <div style={sectionLabel}>Project Information</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                    {projectInfo.map(([label, value]) => (
                      <div key={label}><div style={fieldLabel}>{label}</div><div style={{ fontSize: 13, color: colors.textMuted }}>{value}</div></div>
                    ))}
                  </div>
                  {project.mapLink && (
                    <a href={project.mapLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: 12, color: colors.greenDark, marginTop: 12, textDecoration: 'none' }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.greenDark} strokeWidth={1.8}><path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" /><circle cx="12" cy="11" r="2" /></svg>View on map ↗
                    </a>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <MapView lat={project?.latitude} lng={project?.longitude} label={project?.title} mapLink={project?.mapLink} height={220} />
                  </div>
                </div>

                {/* Unit types */}
                <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Unit Types</span>
                    <span style={{ fontSize: 11, color: colors.textFaint }}>{unitRows.length} type{unitRows.length === 1 ? '' : 's'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: unitGrid, background: colors.bg, borderBottom: `1px solid ${colors.border}`, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <span style={{ padding: '8px 16px' }}>Type</span><span style={{ padding: '8px 8px' }}>Size</span><span style={{ padding: '8px 8px' }}>Price</span><span style={{ padding: '8px 8px' }}>Units</span><span style={{ padding: '8px 8px' }}>Comm.</span>
                  </div>
                  {unitRows.map((u, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: unitGrid, borderBottom: `1px solid ${colors.surfaceMuted}`, alignItems: 'center', fontSize: 13, color: colors.textMuted }}>
                      <span style={{ padding: '10px 16px', fontWeight: 500 }}>{u.type}</span>
                      <span style={{ padding: '10px 8px' }}>{u.size}</span>
                      <span style={{ padding: '10px 8px' }}>{u.price}</span>
                      <span style={{ padding: '10px 8px' }}>{u.units}</span>
                      <span style={{ padding: '10px 8px' }}><span style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, color: colors.greenDark, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{u.comm}</span></span>
                    </div>
                  ))}
                </div>

                {/* Floor Plans */}
                <div style={card}>
                  <div style={sectionLabel}>Floor Plans</div>
                  {floorPlans.length ? (
                    <>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {floorPlans.map((fp, i) => {
                          const active = Math.min(fpIdx, floorPlans.length - 1) === i
                          return (
                            <button key={i} onClick={() => setFpIdx(i)} style={{ height: 30, padding: '0 12px', background: active ? colors.ink : '#fff', border: `1px solid ${active ? colors.ink : colors.border}`, borderRadius: 7, fontSize: 12, fontWeight: 500, color: active ? '#fff' : colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>{fp.label || `Floor Plan ${i + 1}`}</button>
                          )
                        })}
                      </div>
                      {activeFp && (
                        <>
                          <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.surfaceMuted }}>
                            <img src={activeFp.url} alt={activeFp.label || 'Floor plan'} onClick={() => setLightbox({ list: [activeFp.url], idx: 0 })} style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', cursor: 'zoom-in' }} />
                          </div>
                          <a href={activeFp.url} target="_blank" rel="noreferrer" download style={{ display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: 12, color: colors.textMuted, marginTop: 10, textDecoration: 'none', border: `1px solid ${colors.border}`, borderRadius: 7, padding: '6px 12px' }}>
                            <Icon name="download" size={13} color={colors.textMuted} />Download
                          </a>
                        </>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: colors.textFaint }}>No floor plans uploaded.</div>
                  )}
                </div>

                {/* Documents */}
                <div style={card}>
                  <div style={sectionLabel}>Documents</div>
                  {docRows.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {docRows.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 10px' }}>
                          <Icon name="fileText" size={16} color={colors.textFaint} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                            {fileSize(d.size) && <div style={{ fontSize: 11, color: colors.textFaint }}>{fileSize(d.size)}</div>}
                          </div>
                          <button onClick={() => setPreviewDoc({ title: d.name, filename: d.filename, url: d.url, mimeType: d.mimeType })} style={{ height: 28, padding: '0 10px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Icon name="eye" size={13} color={colors.textMuted} />Preview
                          </button>
                          <a href={d.url} target="_blank" rel="noreferrer" download style={{ height: 28, padding: '0 10px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Icon name="download" size={13} color={colors.textMuted} />Download
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: colors.textFaint }}>No documents uploaded.</div>
                  )}
                </div>

                {/* Content */}
                <div style={card}>
                  <div style={sectionLabel}>Content</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>About the project</div>
                  <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.7 }}>{project.description || 'No description provided.'}</div>
                </div>
              </div>

              {/* RIGHT */}
              <div style={{ flex: 1, minWidth: 250, position: 'sticky', top: 0 }}>
                <div style={card}>
                  <div style={rLabel}>Review Status</div>
                  <div style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={st.stroke} strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                    <span style={{ fontSize: 16, fontWeight: 700, color: st.color }}>{st.label}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {[['Submitted', joinedLabel(project.createdAt)], ['Developer', project.developerName || '—'], ['Leads', String(project.leadCount ?? 0)], ['Commission', project.commissionPct != null ? `${project.commissionPct}%` : '—']].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: colors.textFaint }}>{l}</span><span style={{ fontSize: 12, color: colors.textMuted }}>{v}</span></div>
                    ))}
                  </div>
                </div>

                <div style={card}>
                  <div style={rLabel}>Developer</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: colors.surfaceMuted, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: colors.textMuted }}>{initials(project.developerName)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{project.developerName || '—'}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{project.developerEmail || '—'}</div>
                    </div>
                  </div>
                  <div onClick={() => navigate('/admin/developers')} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer', marginTop: 10 }}>View Developers →</div>
                </div>

                <div style={card}>
                  <div style={rLabel}>Commission Preview</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 10 }}>If a unit sells at {money(sample)}:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.textMuted }}><span>Gross ({pct}%)</span><span>{money(gross)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.textFaint, marginTop: 4 }}><span>Platform (15%)</span><span>{money(platformCut)}</span></div>
                  <div style={{ height: 1, background: colors.surfaceMuted, margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}><span>Realtor receives</span><span>{money(realtorNet)}</span></div>
                </div>

                <div style={{ ...card, marginBottom: 0 }} className="wa-form">
                  <div style={{ ...rLabel, marginBottom: 10 }}>Review Notes</div>
                  <textarea placeholder="Add review notes..." style={{ width: '100%', height: 80, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', resize: 'none' }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button style={{ height: 28, padding: '0 10px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Save</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky action bar — status-aware */}
          <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, padding: '12px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }} className="wa-form">
            <div style={{ flex: 1, maxWidth: 420 }}>
              {isPending && (
                <input value={rejectReason} onChange={(e) => { setRejectReason(e.target.value); setReasonError(false) }} placeholder="Rejection reason (required if rejecting)..." style={{ width: '100%', height: 34, border: `1px solid ${reasonError ? colors.redTintBorder : colors.border}`, borderRadius: 7, padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={() => navigate('/admin/projects')} style={{ height: 34, padding: '0 14px', background: 'transparent', border: 'none', fontSize: 12, color: colors.textSoft, fontFamily: 'inherit', cursor: 'pointer' }}>← Back</button>

              {isPending && (
                <>
                  <button onClick={tryReject} disabled={working} style={{ height: 36, padding: '0 16px', background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: colors.red, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: hasReason && !working ? 1 : 0.5 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>Reject &amp; Notify Developer
                  </button>
                  <button onClick={() => setModal('approve')} disabled={working} style={{ height: 36, padding: '0 20px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: working ? 0.6 : 1 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>Approve &amp; Publish
                  </button>
                </>
              )}

              {project.status === 'LIVE' && (
                <>
                  <button onClick={() => run('DRAFT', 'Project unpublished — moved to Draft.')} disabled={working} style={{ height: 36, padding: '0 16px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>Unpublish</button>
                  <button onClick={() => run('SOLD_OUT', 'Project marked as sold out.')} disabled={working} style={{ height: 36, padding: '0 20px', background: colors.ink, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>Mark Sold Out</button>
                </>
              )}

              {project.status === 'DRAFT' && (
                <button onClick={() => run('LIVE', 'Project published — now live.')} disabled={working} style={{ height: 36, padding: '0 20px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: working ? 0.6 : 1 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>Publish
                </button>
              )}

              {project.status === 'SOLD_OUT' && (
                <button onClick={() => run('LIVE', 'Project re-published — now live.')} disabled={working} style={{ height: 36, padding: '0 20px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>Re-publish</button>
              )}
            </div>
          </div>

          {/* Approve modal */}
          {modal === 'approve' && (
            <div onClick={close} style={modalShell}>
              <div onClick={(e) => e.stopPropagation()} style={modalCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}><div><div style={{ fontSize: 14, fontWeight: 600 }}>Approve &amp; publish project?</div><div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>{project.title}</div></div><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
                <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l2.5 2.5L16 9" /></svg>
                  <span style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>Project will go live immediately. {project.developerName || 'The developer'} and all active realtors will be notified by email.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button onClick={close} style={btnGhost}>Cancel</button><button onClick={() => run('LIVE', 'Project approved and published!', { goList: true })} disabled={working} style={{ height: 34, padding: '0 14px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Publishing…' : 'Approve & Publish ✓'}</button></div>
              </div>
            </div>
          )}

          {/* Reject modal */}
          {modal === 'reject' && (
            <div onClick={close} style={modalShell}>
              <div onClick={(e) => e.stopPropagation()} style={modalCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}><div><div style={{ fontSize: 14, fontWeight: 600 }}>Reject project?</div><div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>{project.title}</div></div><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
                <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}><div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>Rejection reason:</div><div style={{ fontSize: 13, color: colors.textMuted }}>{rejectReason.trim() || '—'}</div></div>
                <div style={{ fontSize: 12, color: colors.textSoft, marginBottom: 14 }}>The project will be moved back to Draft so {project.developerName || 'the developer'} can revise and resubmit.</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button onClick={close} style={btnGhost}>Cancel</button><button onClick={() => run('DRAFT', 'Project rejected — moved to Draft.', { goList: true })} disabled={working} style={{ height: 34, padding: '0 14px', background: colors.red, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Rejecting…' : 'Reject & Notify'}</button></div>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div style={{ position: 'fixed', bottom: 84, right: 22, zIndex: 60, background: '#fff', border: `1px solid ${toast.tone === 'error' ? colors.redTintBorder : colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={toast.tone === 'error' ? colors.red : colors.green} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d={toast.tone === 'error' ? 'M15 9l-6 6M9 9l6 6' : 'M8 12l2.5 2.5L16 9'} /></svg>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{toast.text}</span>
            </div>
          )}

          {/* Fullscreen image lightbox */}
          {lightbox && lightbox.list[lightbox.idx] && (
            <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 18, right: 22, cursor: 'pointer' }}>
                <Icon name="x" size={26} color="#fff" strokeWidth={2} />
              </span>
              {lightbox.list.length > 1 && (
                <span onClick={(e) => { e.stopPropagation(); setLightbox((lb) => ({ ...lb, idx: lb.idx > 0 ? lb.idx - 1 : lb.list.length - 1 })) }} style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>
                  <Icon name="chevronLeft" size={36} color="#fff" strokeWidth={2} />
                </span>
              )}
              <img onClick={(e) => e.stopPropagation()} src={lightbox.list[lightbox.idx]} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
              {lightbox.list.length > 1 && (
                <span onClick={(e) => { e.stopPropagation(); setLightbox((lb) => ({ ...lb, idx: lb.idx < lb.list.length - 1 ? lb.idx + 1 : 0 })) }} style={{ position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>
                  <Icon name="chevronRight" size={36} color="#fff" strokeWidth={2} />
                </span>
              )}
              {lightbox.list.length > 1 && (
                <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', borderRadius: 999, padding: '4px 12px', fontSize: 12, color: '#fff' }}>{lightbox.idx + 1} / {lightbox.list.length}</div>
              )}
            </div>
          )}

          {/* Document preview modal */}
          {previewDoc && <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
        </>
      )}
    </>
  )
}
