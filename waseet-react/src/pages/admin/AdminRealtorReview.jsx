import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { adminApi } from '../../lib/api'
import { countryName, initials, joinedLabel } from '../../lib/adminFormat'
import { DocPreviewModal } from '../../components/DocPreviewModal'

const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 12 }
const sectionLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }
const rLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }
const fieldLabel = { fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }
const btnGhost = { height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }
const modalShell = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
const modalCardBase = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }

const DOC_LABEL = {
  PROFILE_PHOTO: 'Profile Photo', FAL_LICENSE: 'FAL License', NATIONAL_ID: 'National ID / Iqama',
  TRADE_LICENSE: 'Trade License / CR', REGA_CERTIFICATE: 'REGA Certificate', OTHER: 'Other Document',
}
const STATUS_BADGE = {
  PENDING: { label: 'Pending Review', bg: '#FEF9EC', color: '#92400E', border: '#F3E2B8' },
  ACTIVE: { label: 'Active', bg: colors.greenTint, color: colors.greenDark, border: colors.greenTintBorder },
  SUSPENDED: { label: 'Suspended', bg: colors.surfaceMuted, color: colors.textMuted, border: colors.border },
  REJECTED: { label: 'Rejected', bg: '#FFF5F5', color: '#991B1B', border: colors.redTintBorder },
}
const fmtSize = (b) => (b == null ? '' : b / 1048576 >= 0.1 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const docMeta = (d) => `${d.mimeType === 'application/pdf' ? 'PDF' : (d.mimeType || '').includes('png') ? 'PNG' : 'JPG'} · ${fmtSize(d.size)}`

export default function AdminRealtorReview() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // approve | reject | email | edit | deactivate | reactivate | delete
  const [rejectReason, setRejectReason] = useState('')
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' })
  const [editForm, setEditForm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setUser(await adminApi.getUser(id)) }
    catch (e) { setError(e.message || 'Could not load this realtor') }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { load() }, [load])

  const close = () => { if (!working) setModal(null) }

  const run = async (fn, successMsg, opts = {}) => {
    if (working) return
    setWorking(true)
    try {
      await fn()
      setModal(null)
      setToast(successMsg)
      if (opts.goList) setTimeout(() => { setToast(''); navigate('/admin/realtors') }, 1000)
      else { await load(); setTimeout(() => setToast(''), 2500) }
    } catch (e) {
      setToast(e.message || 'Action failed'); setTimeout(() => setToast(''), 3500)
    } finally { setWorking(false) }
  }

  const doApprove = () => run(() => adminApi.approveUser(id), 'Approved — credentials emailed', { goList: true })
  const doReject = () => run(() => adminApi.rejectUser(id, rejectReason.trim() || undefined), 'Application rejected — realtor notified', { goList: true })
  const doDeactivate = () => run(() => adminApi.suspendUser(id, rejectReason.trim() || undefined), 'Account deactivated — realtor notified')
  const doReactivate = () => run(() => adminApi.reactivateUser(id), 'Account reactivated')
  const doDelete = () => run(() => adminApi.deleteUser(id), 'Account deleted', { goList: true })
  const doEmail = () => run(() => adminApi.emailUser(id, { subject: emailForm.subject, message: emailForm.message }), 'Email sent to realtor')
  const doEdit = () => run(() => adminApi.updateUser(id, editForm), 'Details updated')
  // verify / reject a KYC document; rejecting suspends the realtor's access
  const doDocStatus = (docId, status) => run(async () => {
    let reason
    if (status === 'REJECTED') { reason = window.prompt('Reason for rejecting this document (realtor will see this):') || undefined }
    setUser(await adminApi.setDocumentStatus(docId, status, reason))
  }, status === 'VERIFIED' ? 'Document verified' : 'Document rejected — realtor access paused')

  const openEmail = () => { setEmailForm({ subject: '', message: '' }); setModal('email') }
  const openEdit = () => {
    setEditForm({
      fullName: user.fullName || '', phone: user.phone || '', country: user.country || 'SA', city: user.city || '',
      agency: user.agency || '', licenseNumber: user.licenseNumber || '', specialization: user.specialization || '', experience: user.experience || '',
      languages: user.languages || '', licenseType: user.licenseType || '', licenseExpiry: user.licenseExpiry || '', idType: user.idType || '', idNumber: user.idNumber || '',
    })
    setModal('edit')
  }
  const setEf = (k) => (e) => setEditForm((f) => ({ ...f, [k]: e.target.value }))

  const badge = user ? (STATUS_BADGE[user.status] || STATUS_BADGE.PENDING) : STATUS_BADGE.PENDING
  const docs = user?.documents || []

  const personal = user ? [
    { label: 'Full Name', value: user.fullName || '—' },
    { label: 'Country', value: countryName(user.country) },
    { label: 'City', value: user.city || '—' },
    { label: 'Email', value: user.email || '—' },
    { label: 'Phone', value: user.phone || '—' },
    { label: 'WhatsApp', value: user.phone || '—' },
  ] : []

  const professional = user ? [
    { label: 'Agency', value: user.agency || '—' },
    { label: 'Specialization', value: user.specialization || '—' },
    { label: 'Languages', value: user.languages || '—' },
    { label: 'Experience', value: user.experience || '—' },
  ] : []

  const licenseInfo = user ? [
    { label: 'License Type', value: user.licenseType || '—' },
    { label: 'License Number', value: user.licenseNumber || '—' },
    { label: 'ID Type', value: user.idType || '—' },
    { label: 'ID Number', value: user.idNumber || '—' },
    { label: 'License Expiry', value: (() => { const v = user.licenseExpiry; if (!v) return '—'; const d = new Date(v); return (!Number.isNaN(d.getTime()) && /^\d{4}-\d{2}/.test(v)) ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : v })() },
  ] : []

  const stats = [
    { value: '0', label: 'Total Leads' },
    { value: '0', label: 'Deals Closed' },
    { value: '0%', label: 'Conversion' },
    { value: 'SAR 0', label: 'Total Earned' },
  ]

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span onClick={() => navigate('/admin/realtors')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Realtors</span>
            <Icon name="chevronRight" size={14} color={colors.borderStrong} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{user?.fullName || (loading ? 'Loading…' : 'Realtor')}</span>
          </div>
        }
        actions={<button onClick={() => navigate('/admin/realtors')} style={btnGhost}>← Back to list</button>}
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {loading && <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading realtor…</div>}
        {!loading && error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Icon name="xCircle" size={16} color={colors.red} strokeWidth={1.9} />
            <span style={{ fontSize: 13, color: colors.textMuted }}>{error}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}
        {!loading && !error && user && (
        <div className="rp-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* LEFT */}
          <div style={{ flex: 2.5, minWidth: 0 }}>
            {/* Profile */}
            <div style={{ ...card, padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: colors.ink, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff' }}>{initials(user.fullName)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{user.fullName}</span>
                    <span style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{badge.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>Realtor</span>
                    <span style={{ fontSize: 10, color: colors.borderStrong }}>·</span>
                    <span style={{ fontSize: 12, color: colors.textFaint }}>Member since {joinedLabel(user.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.7}><path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" /></svg>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>{user.city ? `${user.city}, ` : ''}{countryName(user.country)}</span>
                    </span>
                    <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.7}><path d="M3 5h18v14H3zM3 7l9 6 9-6" /></svg>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>{user.email}</span>
                    </span>
                    {user.phone && (
                      <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.7}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
                        <span style={{ fontSize: 12, color: colors.textMuted }}>{user.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                {stats.map((st, i) => (
                  <div key={st.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRight: i < stats.length - 1 ? `1px solid ${colors.surfaceMuted}` : 'none' }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{st.value}</div>
                    <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 3 }}>{st.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: colors.textFaint, textAlign: 'center', marginTop: 8 }}>Activity metrics populate once the leads &amp; commissions modules go live.</div>
            </div>

            {/* Personal info */}
            <div style={card}>
              <div style={sectionLabel}>Personal Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                {personal.map((f) => (
                  <div key={f.label}>
                    <div style={fieldLabel}>{f.label}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional info */}
            <div style={card}>
              <div style={sectionLabel}>Professional Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                {professional.map((f) => (
                  <div key={f.label} style={f.label === 'Specialization' || f.label === 'Languages' ? { gridColumn: 'span 2' } : null}>
                    <div style={fieldLabel}>{f.label}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* License & verification */}
            <div style={card}>
              <div style={sectionLabel}>License &amp; Verification</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                {licenseInfo.map((f) => (
                  <div key={f.label}>
                    <div style={fieldLabel}>{f.label}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div style={{ ...card, marginBottom: 0 }}>
              <div style={{ ...sectionLabel, marginBottom: 8 }}>Documents</div>
              {docs.length === 0 && <div style={{ padding: '12px 0', fontSize: 12, color: colors.textFaint }}>No documents uploaded.</div>}
              {docs.map((doc) => (
                <div key={doc.id} style={{ padding: '12px 0', borderBottom: `1px solid ${colors.surfaceMuted}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
                    {doc.type === 'PROFILE_PHOTO' ? (
                      <img src={doc.url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: `1px solid ${colors.border}` }} />
                    ) : (
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.6} style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{DOC_LABEL[doc.type] || doc.type}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint }}>{doc.filename} · {docMeta(doc)}</div>
                    </div>
                  </div>
                  {(() => {
                    const s = doc.status === 'VERIFIED' ? { bg: colors.greenTint, fg: colors.greenDark, bd: colors.greenTintBorder, label: 'Verified ✓' } : doc.status === 'REJECTED' ? { bg: colors.redTint, fg: colors.red, bd: colors.redTintBorder, label: 'Rejected' } : { bg: colors.amberTint, fg: colors.amberText, bd: colors.amberTintBorder, label: 'Pending' }
                    return <span style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{s.label}</span>
                  })()}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span onClick={() => setPreviewDoc({ ...doc, title: DOC_LABEL[doc.type] || doc.type })} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, color: colors.greenDark, border: `1px solid ${colors.greenTintBorder}`, background: colors.greenTint, borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.greenDark} strokeWidth={1.8}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>Preview
                    </span>
                    <a href={doc.url} target="_blank" rel="noreferrer" download style={{ fontSize: 11, color: colors.textMuted, border: `1px solid ${colors.border}`, background: '#fff', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', textDecoration: 'none' }}>Download ↓</a>
                    {doc.type !== 'PROFILE_PHOTO' && doc.status !== 'VERIFIED' && (
                      <span onClick={() => !working && doDocStatus(doc.id, 'VERIFIED')} style={{ fontSize: 11, color: '#fff', background: colors.green, borderRadius: 5, padding: '3px 8px', cursor: working ? 'default' : 'pointer', fontWeight: 600 }}>Verify ✓</span>
                    )}
                    {doc.type !== 'PROFILE_PHOTO' && doc.status !== 'REJECTED' && (
                      <span onClick={() => !working && doDocStatus(doc.id, 'REJECTED')} style={{ fontSize: 11, color: colors.red, border: `1px solid ${colors.redTintBorder}`, background: '#fff', borderRadius: 5, padding: '3px 8px', cursor: working ? 'default' : 'pointer', fontWeight: 600 }}>Reject</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 240 }}>
            {/* Account status */}
            <div style={card}>
              <div style={rLabel}>Account Status</div>
              <div style={{ background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={badge.color} strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                <span style={{ fontSize: 18, fontWeight: 700, color: badge.color }}>{badge.label}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: colors.textFaint }}>Applied</span><span style={{ fontSize: 12, color: colors.textMuted }}>{joinedLabel(user.createdAt)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: colors.textFaint }}>Email verified</span><span style={{ fontSize: 12, color: colors.textMuted }}>{user.emailVerified ? 'Yes' : 'No'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: colors.textFaint }}>Last login</span><span style={{ fontSize: 12, color: colors.textMuted }}>{user.lastLoginAt ? joinedLabel(user.lastLoginAt) : 'Never'}</span></div>
              </div>
            </div>

            {/* Internal notes */}
            <div style={card} className="wa-form">
              <div style={rLabel}>Internal Notes</div>
              <textarea placeholder="Add internal notes..." style={{ width: '100%', height: 90, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', resize: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button style={{ height: 30, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Save Note</button>
              </div>
            </div>

            {/* Actions — depend on the realtor's status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {user.status === 'PENDING' && (
                <>
                  <button onClick={() => setModal('approve')} style={{ height: 36, background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>Approve &amp; Send Credentials
                  </button>
                  <button onClick={() => { setRejectReason(''); setModal('reject') }} style={{ height: 36, background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: colors.red, fontFamily: 'inherit', cursor: 'pointer' }}>Reject with Reason</button>
                </>
              )}

              {user.status === 'ACTIVE' && (
                <>
                  <button onClick={openEdit} style={{ height: 36, background: colors.ink, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>Edit Details
                  </button>
                  <button onClick={openEmail} style={{ height: 36, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.8}><path d="M3 5h18v14H3zM3 7l9 6 9-6" /></svg>Send Email
                  </button>
                  <button onClick={() => { setRejectReason(''); setModal('deactivate') }} style={{ height: 36, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: colors.amberText || '#92400E', fontFamily: 'inherit', cursor: 'pointer' }}>Deactivate Account</button>
                  <button onClick={() => setModal('delete')} style={{ height: 36, background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: colors.red, fontFamily: 'inherit', cursor: 'pointer' }}>Delete Account</button>
                </>
              )}

              {user.status === 'SUSPENDED' && (
                <>
                  <button onClick={() => setModal('reactivate')} style={{ height: 36, background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Reactivate Account</button>
                  <button onClick={openEmail} style={{ height: 36, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Send Email</button>
                  <button onClick={openEdit} style={{ height: 36, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Edit Details</button>
                  <button onClick={() => setModal('delete')} style={{ height: 36, background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: colors.red, fontFamily: 'inherit', cursor: 'pointer' }}>Delete Account</button>
                </>
              )}

              {user.status === 'REJECTED' && (
                <>
                  <button onClick={() => setModal('approve')} style={{ height: 36, background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Approve Instead</button>
                  <button onClick={openEmail} style={{ height: 36, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Send Email</button>
                  <button onClick={() => setModal('delete')} style={{ height: 36, background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: colors.red, fontFamily: 'inherit', cursor: 'pointer' }}>Delete Account</button>
                </>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* MODALS */}
      {modal === 'approve' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Approve realtor account</span><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              <div><div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Credentials will be emailed to:</div><div style={{ fontSize: 13, fontWeight: 600 }}>{user?.email}</div><div style={{ fontSize: 12, color: colors.textSoft, marginTop: 4 }}>A temporary password + a set-password link will be included.</div></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button onClick={close} style={btnGhost}>Cancel</button><button onClick={doApprove} disabled={working} style={{ height: 34, padding: '0 14px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: working ? 'default' : 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Working…' : 'Approve & Send Email'}</button></div>
          </div>
        </div>
      )}

      {modal === 'reject' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 420 }} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}><div><div style={{ fontSize: 14, fontWeight: 600 }}>Reject application</div><div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>{user?.fullName}</div></div><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Rejection reason</div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. License could not be verified with REGA." style={{ width: '100%', height: 90, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ fontSize: 11, color: colors.textFaint, fontStyle: 'italic', marginTop: 6 }}>This reason will be emailed to the applicant</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button disabled={working} onClick={doReject} style={{ height: 34, padding: '0 14px', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', background: colors.red, cursor: working ? 'default' : 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Working…' : 'Reject & Notify'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email */}
      {modal === 'email' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 480 }} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div><div style={{ fontSize: 15, fontWeight: 700 }}>Send email</div><div style={{ fontSize: 12, color: colors.textFaint, marginTop: 3 }}>To: {user?.fullName} · {user?.email}</div></div>
              <span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Subject</div>
            <input value={emailForm.subject} onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))} placeholder="e.g. Update on your Waseet account" style={{ width: '100%', height: 36, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', marginBottom: 12 }} />
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Message</div>
            <textarea value={emailForm.message} onChange={(e) => setEmailForm((f) => ({ ...f, message: e.target.value }))} placeholder="Write your message…" style={{ width: '100%', height: 130, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button onClick={doEmail} disabled={working || !emailForm.subject.trim() || !emailForm.message.trim()} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: (working || !emailForm.subject.trim() || !emailForm.message.trim()) ? 0.6 : 1 }}>{working ? 'Sending…' : 'Send Email'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details */}
      {modal === 'edit' && editForm && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 520 }} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><span style={{ fontSize: 15, fontWeight: 700 }}>Edit realtor details</span><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 14px' }}>
              {[['Full name', 'fullName', 'text'], ['Phone', 'phone', 'text'], ['City', 'city', 'text'], ['Agency', 'agency', 'text'], ['Specialization', 'specialization', 'text'], ['Languages', 'languages', 'text'], ['Experience', 'experience', 'text'], ['License type', 'licenseType', 'text'], ['License number', 'licenseNumber', 'text'], ['License expiry', 'licenseExpiry', 'text'], ['ID type', 'idType', 'text'], ['ID number', 'idNumber', 'text']].map(([label, key]) => (
                <div key={key}>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>{label}</div>
                  <input value={editForm[key] || ''} onChange={setEf(key)} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>Country</div>
                <select value={editForm.country || 'SA'} onChange={setEf('country')} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 8px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="SA">Saudi Arabia</option><option value="AE">UAE</option><option value="PK">Pakistan</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button onClick={doEdit} disabled={working} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate */}
      {modal === 'deactivate' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 420 }} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 15, fontWeight: 700 }}>Deactivate account</span><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: colors.amberText, lineHeight: 1.6 }}>{user?.fullName} will be logged out and lose portal access until reactivated.</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Reason (emailed to realtor, optional)</div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for deactivation…" style={{ width: '100%', height: 80, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button onClick={doDeactivate} disabled={working} style={{ height: 34, padding: '0 16px', background: '#B45309', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Working…' : 'Deactivate'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate */}
      {modal === 'reactivate' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 15, fontWeight: 700 }}>Reactivate account</span><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>{user?.fullName} will regain full portal access.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button onClick={doReactivate} disabled={working} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Working…' : 'Reactivate'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete */}
      {modal === 'delete' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 15, fontWeight: 700, color: colors.red }}>Delete account</span><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: '#991B1B', lineHeight: 1.6 }}>This permanently deletes <b>{user?.fullName}</b> ({user?.email}) and all their data (documents, leads, commissions). This cannot be undone.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button onClick={doDelete} disabled={working} style={{ height: 34, padding: '0 16px', background: colors.red, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Deleting…' : 'Delete Permanently'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{toast}</span>
        </div>
      )}

      <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </>
  )
}
