import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { adminApi } from '../../lib/api'
import { countryName, initials, joinedLabel } from '../../lib/adminFormat'
import { DocPreviewModal } from '../../components/DocPreviewModal'

const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 12 }
const sectionLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }
const rLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }
const btnGhost = { height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }
const modalShell = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
const modalCardBase = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }

// action-button variants (mirrors AdminRealtorReview styling)
const actionBase = { height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
const btnGreen = { ...actionBase, background: colors.green, border: 'none', color: '#fff' }
const btnDark = { ...actionBase, background: colors.ink, border: 'none', color: '#fff' }
const btnOutline = { ...actionBase, background: '#fff', border: `1px solid ${colors.border}`, color: colors.textMuted }
const btnAmber = { ...actionBase, background: '#fff', border: `1px solid ${colors.border}`, color: colors.amberText || '#92400E' }
const btnDanger = { ...actionBase, background: '#fff', border: `1px solid ${colors.redTintBorder}`, color: colors.red }

const roleMeta = {
  developer: { listPath: '/admin/developers', listName: 'Developers', infoLabel: 'Company Information', nameLabel: 'Company Name' },
  realtor: { listPath: '/admin/realtors', listName: 'Realtors', infoLabel: 'Realtor Information', nameLabel: 'Full Name' },
}

const DOC_LABEL = {
  PROFILE_PHOTO: 'Profile Photo',
  FAL_LICENSE: 'FAL License',
  NATIONAL_ID: 'National ID / Iqama',
  TRADE_LICENSE: 'Trade License / CR',
  REGA_CERTIFICATE: 'REGA Certificate',
  OTHER: 'Other Document',
}

const STATUS_BADGE = {
  PENDING: { label: 'Pending Review', bg: colors.amberTint, color: colors.amberText, border: colors.amberTintBorder },
  ACTIVE: { label: 'Active', bg: colors.greenTint, color: colors.greenDark, border: colors.greenTintBorder },
  SUSPENDED: { label: 'Suspended', bg: colors.surfaceMuted, color: colors.textMuted, border: colors.border },
  REJECTED: { label: 'Rejected', bg: '#FFF5F5', color: '#991B1B', border: colors.redTintBorder },
}

const BAN_OPTIONS = [['7 days', 7], ['30 days', 30], ['90 days', 90], ['Permanent', 0]]

const fmtSize = (bytes) => {
  if (!bytes && bytes !== 0) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
const fmtMeta = (d) => {
  const ext = d.mimeType === 'application/pdf' ? 'PDF' : (d.mimeType || '').includes('png') ? 'PNG' : 'JPG'
  return `${ext} · ${fmtSize(d.size)}`
}

export default function AdminReview({ role = 'developer' }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const meta = roleMeta[role] || roleMeta.developer

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // approve | reject | email | edit | deactivate | reactivate | delete | ban | passwordReset
  const [rejectReason, setRejectReason] = useState('')
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' })
  const [editForm, setEditForm] = useState(null)
  const [banForm, setBanForm] = useState({ days: 7, reason: '' })
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      setUser(await adminApi.getUser(id))
    } catch (e) {
      setError(e.message || 'Could not load this profile')
    } finally {
      setLoading(false)
    }
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
      if (opts.goList) setTimeout(() => { setToast(''); navigate(meta.listPath) }, 1100)
      else { await load(); setTimeout(() => setToast(''), 2500) }
    } catch (e) {
      setToast(e.message || 'Action failed'); setTimeout(() => setToast(''), 3500)
    } finally {
      setWorking(false)
    }
  }

  const doApprove = () => run(() => adminApi.approveUser(id), 'Approved — credentials emailed', { goList: true })
  const doReject = () => run(() => adminApi.rejectUser(id, rejectReason.trim() || undefined), 'Application rejected — applicant notified', { goList: true })
  const doDeactivate = () => run(() => adminApi.suspendUser(id, rejectReason.trim() || undefined), 'Account deactivated')
  const doReactivate = () => run(() => adminApi.reactivateUser(id), 'Account reactivated')
  const doDelete = () => run(() => adminApi.deleteUser(id), 'Account deleted', { goList: true })
  const doEmail = () => run(() => adminApi.emailUser(id, { subject: emailForm.subject, message: emailForm.message }), 'Email sent')
  const doEdit = () => run(() => adminApi.updateUser(id, editForm), 'Details updated')
  const doBan = () => run(() => adminApi.banUser(id, { days: banForm.days || undefined, reason: banForm.reason.trim() || undefined }), banForm.days ? `Account banned for ${banForm.days} days` : 'Account banned permanently')
  const doPasswordReset = () => run(() => adminApi.sendPasswordReset(id), 'Temporary password emailed')

  const openEmail = () => { setEmailForm({ subject: '', message: '' }); setModal('email') }
  const openBan = () => { setBanForm({ days: 7, reason: '' }); setModal('ban') }
  const openEdit = () => {
    setEditForm({
      companyName: user.companyName || '',
      contactName: user.contactName || '',
      website: user.website || '',
      phone: user.phone || '',
      city: user.city || '',
      licenseNumber: user.licenseNumber || '',
      bio: user.bio || '',
    })
    setModal('edit')
  }
  const setEf = (k) => (e) => setEditForm((f) => ({ ...f, [k]: e.target.value }))

  const onPickLogo = () => { if (!working) fileRef.current?.click() }
  const onLogoChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file || working) return
    setWorking(true)
    try {
      await adminApi.uploadUserAvatar(id, file)
      await load()
      setToast('Logo updated'); setTimeout(() => setToast(''), 2500)
    } catch (err) {
      setToast(err.message || 'Upload failed'); setTimeout(() => setToast(''), 3500)
    } finally {
      setWorking(false)
    }
  }

  const badge = user ? (STATUS_BADGE[user.status] || STATUS_BADGE.PENDING) : STATUS_BADGE.PENDING

  const langs = Array.isArray(user?.languages) ? user.languages.join(', ') : user?.languages
  const websiteLink = user?.website ? (
    <a href={user.website} target="_blank" rel="noreferrer" style={{ color: colors.greenDark, textDecoration: 'none' }}>{user.website}</a>
  ) : '—'
  const fields = user
    ? role === 'developer'
      ? [
          ['Company Name', user.companyName || user.fullName || '—'],
          ['Contact Person', user.contactName || '—'],
          ['Email', user.email || '—'],
          ['Phone', user.phone || '—'],
          ['Website', websiteLink],
          ['Trade License / CR', user.licenseNumber || '—'],
          ['Country', countryName(user.country)],
          ['City', user.city || '—'],
          ['Email Verified', user.emailVerified ? 'Yes' : 'No'],
        ]
      : [
          ['Full Name', user.fullName || '—'],
          ['Agency', user.agency || '—'],
          ['Specialization', user.specialization || '—'],
          ['Experience', user.experience || '—'],
          ['Languages', langs || '—'],
          ['License Type', user.licenseType || '—'],
          ['License No.', user.licenseNumber || '—'],
          ['License Expiry', user.licenseExpiry ? new Date(user.licenseExpiry).toLocaleDateString() : '—'],
          ['ID Type', user.idType || '—'],
          ['ID Number', user.idNumber || '—'],
          ['Country', countryName(user.country)],
          ['City', user.city || '—'],
          ['Email', user.email || '—'],
          ['Phone', user.phone || '—'],
          ['Email Verified', user.emailVerified ? 'Yes' : 'No'],
        ]
    : []

  const contact = user
    ? [
        ['Phone', user.phone || '—'],
        ['WhatsApp', user.phone || '—'],
        ['Email', user.email || '—'],
        ['City', user.city || '—'],
      ]
    : []

  const docs = user?.documents || []
  const companyName = user?.companyName || user?.fullName || ''
  const headerName = companyName || (loading ? 'Loading…' : 'Profile')
  const bannedUntilLabel = user?.bannedUntil ? new Date(user.bannedUntil).toLocaleDateString() : null

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span onClick={() => navigate(meta.listPath)} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>{meta.listName}</span>
            <Icon name="chevronRight" size={14} color={colors.borderStrong} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{headerName}</span>
          </div>
        }
        actions={<button onClick={() => navigate(meta.listPath)} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>← Back to list</button>}
      />
      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {loading && <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading profile…</div>}
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
            <div style={card}>
              {/* Logo + company header */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="" style={{ width: 54, height: 54, borderRadius: 12, objectFit: 'cover', border: `1px solid ${colors.border}` }} />
                  ) : (
                    <div style={{ width: 54, height: 54, borderRadius: 12, background: colors.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>{initials(companyName)}</div>
                  )}
                  <button onClick={onPickLogo} title="Change logo" style={{ position: 'absolute', right: -6, bottom: -6, width: 22, height: 22, borderRadius: '50%', background: '#fff', border: `1px solid ${colors.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: working ? 'default' : 'pointer', padding: 0 }}>
                    <Icon name="upload" size={12} color={colors.textMuted} strokeWidth={1.9} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onLogoChange} style={{ display: 'none' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{companyName || '—'}</span>
                    <span style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{badge.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textFaint }}>
                    {role === 'developer' ? 'Developer' : 'Realtor'}
                    {typeof user.projectCount === 'number' ? ` · ${user.projectCount} ${user.projectCount === 1 ? 'project' : 'projects'}` : ''}
                    <span style={{ margin: '0 6px', color: colors.borderStrong }}>·</span>
                    Member since {joinedLabel(user.createdAt)}
                  </div>
                </div>
                <span onClick={onPickLogo} style={{ fontSize: 12, color: colors.greenDark, fontWeight: 500, cursor: working ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>Change logo</span>
              </div>

              <div style={{ ...sectionLabel, marginBottom: 14 }}>{meta.infoLabel}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                {fields.map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {user.bio && (
              <div style={card}>
                <div style={{ ...sectionLabel, marginBottom: 10 }}>{role === 'developer' ? 'About the Company' : 'About'}</div>
                <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.7, margin: 0 }}>{user.bio}</p>
              </div>
            )}

            <div style={card}>
              <div style={{ ...sectionLabel, marginBottom: 14 }}>Contact</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                {contact.map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <div style={{ ...sectionLabel, marginBottom: 8 }}>Documents</div>
              {docs.length === 0 && <div style={{ padding: '12px 0', fontSize: 12, color: colors.textFaint }}>No documents uploaded.</div>}
              {docs.map((doc) => (
                <div key={doc.id} style={{ padding: '12px 0', borderBottom: `1px solid ${colors.surfaceMuted}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Icon name="fileText" size={18} color={colors.textFaint} strokeWidth={1.6} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{DOC_LABEL[doc.type] || doc.type}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint }}>{doc.filename} · {fmtMeta(doc)}</div>
                    </div>
                  </div>
                  <span style={{ background: colors.amberTint, color: colors.amberText, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{doc.status === 'VERIFIED' ? 'Verified' : doc.status === 'REJECTED' ? 'Rejected' : 'Pending'}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span onClick={() => setPreviewDoc({ ...doc, title: DOC_LABEL[doc.type] || doc.type })} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, color: colors.greenDark, border: `1px solid ${colors.greenTintBorder}`, background: colors.greenTint, borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>
                      <Icon name="eye" size={12} color={colors.greenDark} strokeWidth={1.8} />Preview
                    </span>
                    <a href={doc.url} target="_blank" rel="noreferrer" download style={{ fontSize: 11, color: colors.textMuted, border: `1px solid ${colors.border}`, background: '#fff', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', textDecoration: 'none' }}>Download ↓</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={card}>
              <div style={rLabel}>Account Status</div>
              <div style={{ background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <Icon name="clock" size={18} color={badge.color} strokeWidth={1.8} />
                <span style={{ fontSize: 18, fontWeight: 700, color: badge.color }}>{badge.label}</span>
              </div>
              {user.status === 'SUSPENDED' && bannedUntilLabel && (
                <div style={{ marginTop: 8, fontSize: 12, color: colors.red, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Icon name="shield" size={13} color={colors.red} strokeWidth={1.8} />
                  <span>Banned until {bannedUntilLabel}</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: colors.textFaint }}>Applied</span><span style={{ fontSize: 12, color: colors.textMuted }}>{joinedLabel(user.createdAt)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: colors.textFaint }}>Last login</span><span style={{ fontSize: 12, color: colors.textMuted }}>{user.lastLoginAt ? joinedLabel(user.lastLoginAt) : 'Never'}</span></div>
              </div>
            </div>

            <div style={card} className="wa-form">
              <div style={rLabel}>Internal Notes</div>
              <textarea placeholder="Add internal notes..." style={{ width: '100%', height: 90, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', resize: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button style={{ height: 30, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Save Note</button>
              </div>
            </div>

            {/* Actions — depend on the developer's status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {user.status === 'PENDING' && (
                <>
                  <button onClick={() => setModal('approve')} style={btnGreen}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>Approve &amp; Send Credentials
                  </button>
                  <button onClick={() => { setRejectReason(''); setModal('reject') }} style={btnDanger}>
                    <Icon name="xCircle" size={14} color={colors.red} strokeWidth={2} />Reject with Reason
                  </button>
                </>
              )}

              {user.status === 'ACTIVE' && (
                <>
                  <button onClick={openEdit} style={btnDark}>
                    <Icon name="edit" size={14} color="#fff" strokeWidth={1.9} />Edit Details
                  </button>
                  <button onClick={() => setModal('passwordReset')} style={btnOutline}>
                    <Icon name="key" size={14} color={colors.textMuted} strokeWidth={1.8} />Send Password Reset
                  </button>
                  <button onClick={openEmail} style={btnOutline}>
                    <Icon name="mail" size={14} color={colors.textMuted} strokeWidth={1.8} />Send Email
                  </button>
                  <button onClick={() => { setRejectReason(''); setModal('deactivate') }} style={btnAmber}>
                    <Icon name="lock" size={14} color={colors.amberText || '#92400E'} strokeWidth={1.8} />Deactivate Account
                  </button>
                  <button onClick={openBan} style={btnDanger}>
                    <Icon name="shield" size={14} color={colors.red} strokeWidth={1.8} />Ban Account
                  </button>
                </>
              )}

              {user.status === 'SUSPENDED' && (
                <>
                  <button onClick={() => setModal('reactivate')} style={btnGreen}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>Reactivate Account
                  </button>
                  <button onClick={openEdit} style={btnOutline}>
                    <Icon name="edit" size={14} color={colors.textMuted} strokeWidth={1.8} />Edit Details
                  </button>
                  <button onClick={openEmail} style={btnOutline}>
                    <Icon name="mail" size={14} color={colors.textMuted} strokeWidth={1.8} />Send Email
                  </button>
                  <button onClick={openBan} style={btnDanger}>
                    <Icon name="shield" size={14} color={colors.red} strokeWidth={1.8} />Ban Account
                  </button>
                  <button onClick={() => setModal('delete')} style={btnDanger}>
                    <Icon name="trash" size={14} color={colors.red} strokeWidth={1.8} />Delete Account
                  </button>
                </>
              )}

              {user.status === 'REJECTED' && (
                <>
                  <button onClick={() => setModal('approve')} style={btnGreen}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>Approve Instead
                  </button>
                  <button onClick={openEmail} style={btnOutline}>
                    <Icon name="mail" size={14} color={colors.textMuted} strokeWidth={1.8} />Send Email
                  </button>
                  <button onClick={() => setModal('delete')} style={btnDanger}>
                    <Icon name="trash" size={14} color={colors.red} strokeWidth={1.8} />Delete Account
                  </button>
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
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 420 }} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Approve {role} account</span>
              <span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="info" size={16} color={colors.green} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Credentials will be emailed to:</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.email}</div>
                <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 4 }}>A temporary password + a set-password link will be included.</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button onClick={doApprove} disabled={working} style={{ height: 34, padding: '0 14px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: working ? 'default' : 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Working…' : 'Approve & Send'}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'reject' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 420 }} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>Reject application</div><div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>{companyName}</div></div>
              <span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Rejection reason (sent to applicant):</div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why the application was rejected..." style={{ width: '100%', height: 90, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button disabled={working} onClick={doReject} style={{ height: 34, padding: '0 14px', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', background: colors.red, cursor: working ? 'default' : 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Working…' : 'Reject Application'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Password Reset */}
      {modal === 'passwordReset' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Send password reset</span>
              <span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6, marginBottom: 16 }}>A fresh temporary password will be emailed to <b>{user?.email}</b>. Their current password will stop working.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button onClick={doPasswordReset} disabled={working} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: working ? 'default' : 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Sending…' : 'Send Reset Email'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email */}
      {modal === 'email' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 480 }} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div><div style={{ fontSize: 15, fontWeight: 700 }}>Send email</div><div style={{ fontSize: 12, color: colors.textFaint, marginTop: 3 }}>To: {companyName} · {user?.email}</div></div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><span style={{ fontSize: 15, fontWeight: 700 }}>Edit developer details</span><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 14px' }}>
              {[['Company Name', 'companyName'], ['Contact Person', 'contactName'], ['Website', 'website'], ['Phone', 'phone'], ['City', 'city'], ['Trade License / CR', 'licenseNumber']].map(([label, key]) => (
                <div key={key}>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>{label}</div>
                  <input value={editForm[key] || ''} onChange={setEf(key)} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>Bio</div>
                <textarea value={editForm.bio || ''} onChange={setEf('bio')} placeholder="About the company…" style={{ width: '100%', height: 90, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
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
            <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: colors.amberText, lineHeight: 1.6 }}>{companyName} will be logged out and lose portal access until reactivated.</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Reason (emailed to developer, optional)</div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for deactivation…" style={{ width: '100%', height: 80, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button onClick={doDeactivate} disabled={working} style={{ height: 34, padding: '0 16px', background: '#B45309', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Working…' : 'Deactivate'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban */}
      {modal === 'ban' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 440 }} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 15, fontWeight: 700, color: colors.red }}>Ban account</span><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#991B1B', lineHeight: 1.6 }}>{companyName} will be suspended and blocked from signing in for the selected duration.</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 6 }}>Ban duration</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {BAN_OPTIONS.map(([label, days]) => {
                const active = banForm.days === days
                return (
                  <button key={label} onClick={() => setBanForm((f) => ({ ...f, days }))} style={{ height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', background: active ? colors.green : '#fff', color: active ? '#fff' : colors.textMuted, border: `1px solid ${active ? colors.green : colors.border}` }}>{label}</button>
                )
              })}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Reason (optional)</div>
            <textarea value={banForm.reason} onChange={(e) => setBanForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Reason for the ban…" style={{ width: '100%', height: 80, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={close} style={btnGhost}>Cancel</button>
              <button onClick={doBan} disabled={working} style={{ height: 34, padding: '0 16px', background: colors.red, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Banning…' : banForm.days ? `Ban ${banForm.days} days` : 'Ban Permanently'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate */}
      {modal === 'reactivate' && (
        <div onClick={close} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalCardBase, maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 15, fontWeight: 700 }}>Reactivate account</span><span onClick={close} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>{companyName} will regain full portal access.</div>
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
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: '#991B1B', lineHeight: 1.6 }}>This permanently deletes <b>{companyName}</b> ({user?.email}) and all their data (documents, projects, leads). This cannot be undone.</div>
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
