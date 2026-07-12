import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { adminApi } from '../../lib/api'

const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px' }
const capLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }
const rLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }
const softLabel = { fontSize: 9, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }

const statusMeta = {
  OPEN: { label: 'Open', color: '#991B1B', tint: colors.redTint, tintBorder: colors.redTintBorder, stroke: colors.red, icon: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></> },
  UNDER_REVIEW: { label: 'Under Review', color: colors.amberText, tint: colors.amberTint, tintBorder: colors.amberTintBorder, stroke: colors.amber, icon: <><circle cx="12" cy="12" r="10" /><path d="M12 7v5l3 2" /></> },
  RESOLVED: { label: 'Resolved ✓', color: colors.greenDark, tint: colors.greenTint, tintBorder: colors.greenTintBorder, stroke: colors.green, icon: <><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></> },
  REJECTED: { label: 'Rejected', color: colors.textMuted, tint: colors.surfaceMuted, tintBorder: colors.border, stroke: colors.textMuted, icon: <><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></> },
}

const roleLabel = (r) => (r ? r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() : '—')
const fmtDateTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return `${d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
const initials = (name) => {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase()
}

export default function AdminDisputeDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [dispute, setDispute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [note, setNote] = useState('')
  const [working, setWorking] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setNotFound(false)
    try {
      const d = await adminApi.getDispute(id)
      setDispute(d)
      setNote(d.resolution || '')
    } catch (e) {
      if (e.status === 404) setNotFound(true)
      else setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const resolve = async (status) => {
    if (working) return
    setWorking(status)
    try {
      await adminApi.resolveDispute(id, { status, resolution: note.trim() })
      const verb = status === 'UNDER_REVIEW' ? 'moved to under review' : status === 'RESOLVED' ? 'resolved' : 'rejected'
      setToast(`Dispute ${dispute?.ref || ''} ${verb}. Both parties notified.`)
      setTimeout(() => setToast(''), 5000)
      await load()
    } catch (e) {
      setToast(e.message || 'Action failed')
      setTimeout(() => setToast(''), 5000)
    } finally {
      setWorking('')
    }
  }

  if (loading) {
    return (
      <>
        <Topbar left={<span style={{ fontSize: 13, color: colors.textFaint }}>Disputes</span>} />
        <div style={{ flex: 1, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: colors.textFaint }}>Loading dispute…</div>
      </>
    )
  }

  if (notFound || !dispute) {
    return (
      <>
        <Topbar
          left={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span onClick={() => navigate('/admin/disputes')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Disputes</span></div>}
        />
        <div style={{ flex: 1, background: colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Dispute not found</div>
          <div style={{ fontSize: 13, color: colors.textFaint }}>It may have been removed or the link is invalid.</div>
          <span onClick={() => navigate('/admin/disputes')} style={{ fontSize: 13, color: colors.greenDark, cursor: 'pointer', marginTop: 4 }}>← Back to disputes</span>
        </div>
      </>
    )
  }

  const sm = statusMeta[dispute.status] || statusMeta.OPEN

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span onClick={() => navigate('/admin/disputes')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Disputes</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>
            <span style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>Dispute {dispute.ref}</span>
          </div>
        }
        actions={<button onClick={() => navigate('/admin/disputes')} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>Back to list</button>}
      />

      {/* Status banner */}
      <div style={{ background: sm.tint, borderBottom: `1px solid ${sm.tintBorder}`, padding: '10px 22px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={sm.stroke} strokeWidth={2} style={{ flexShrink: 0 }}>{sm.icon}</svg>
        <span style={{ fontSize: 13, fontWeight: 600, color: sm.color }}>Dispute {dispute.ref} · {sm.label}</span>
        <span style={{ color: colors.borderStrong }}>·</span>
        <span style={{ fontSize: 13, color: sm.color }}>Raised {fmtDateTime(dispute.createdAt)}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        <div className="rp-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* LEFT */}
          <div style={{ flex: 2.5, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Overview */}
            <div style={card}>
              <div style={capLabel}>Dispute Overview</div>
              <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ flex: 1, padding: '12px 14px', background: colors.redTint, borderRight: `1px solid ${colors.redTintBorder}` }}>
                  <div style={softLabel}>Raised By</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: colors.surfaceMuted, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: colors.textMuted }}>{initials(dispute.raisedByName)}</div>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{dispute.raisedByName || '—'}</div><div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{roleLabel(dispute.raisedByRole)}</div></div>
                  </div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 8 }}>Raised: {fmtDateTime(dispute.createdAt)}</div>
                </div>
                <div style={{ flex: 1, padding: '12px 14px' }}>
                  <div style={softLabel}>Amount in Dispute</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{dispute.amount != null ? `SAR ${dispute.amount.toLocaleString()}` : '—'}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 6 }}>Last updated: {fmtDateTime(dispute.updatedAt)}</div>
                </div>
              </div>

              <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                <div style={softLabel}>Related Records</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint }}>Commission</div>
                    {dispute.commissionId
                      ? <div onClick={() => navigate('/admin/commissions/' + dispute.commissionId)} style={{ fontSize: 13, color: colors.greenDark, marginTop: 2, cursor: 'pointer' }}>{dispute.commissionId} →</div>
                      : <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>—</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint }}>Lead</div>
                    {dispute.leadId
                      ? <div onClick={() => navigate('/admin/leads')} style={{ fontSize: 13, color: colors.greenDark, marginTop: 2, cursor: 'pointer' }}>{dispute.leadId} →</div>
                      : <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>—</div>}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 4 }}>
                <div style={{ ...softLabel, marginBottom: 10 }}>Subject</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{dispute.subject || '—'}</div>
                <div style={{ ...softLabel, marginBottom: 10 }}>Reason for Dispute</div>
                <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '12px 14px', fontSize: 13, color: colors.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{dispute.description || 'No description provided.'}</div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Status */}
            <div style={card}>
              <div style={rLabel}>Dispute Status</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 16, fontWeight: 700, borderRadius: 8, padding: '8px 12px', color: sm.color, background: sm.tint, border: `1px solid ${sm.tintBorder}` }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={sm.stroke} strokeWidth={2}>{sm.icon}</svg>
                {sm.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {[['Reference:', dispute.ref], ['Raised by:', `${dispute.raisedByName || '—'} (${roleLabel(dispute.raisedByRole)})`], ['Opened:', fmtDateTime(dispute.createdAt)], ['Last updated:', fmtDateTime(dispute.updatedAt)]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ fontSize: 11, color: colors.textFaint, flexShrink: 0 }}>{l}</span><span style={{ fontSize: 12, color: colors.textMuted, textAlign: 'right' }}>{v}</span></div>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div style={card} className="wa-form">
              <div style={rLabel}>Resolve Dispute</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Resolution note (sent to both parties):</div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain the decision…" style={{ width: '100%', height: 90, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <button onClick={() => resolve('UNDER_REVIEW')} disabled={!!working} style={{ width: '100%', height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: working ? 'default' : 'pointer', background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, color: colors.amberText, opacity: working && working !== 'UNDER_REVIEW' ? 0.6 : 1 }}>{working === 'UNDER_REVIEW' ? 'Saving…' : 'Mark under review'}</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => resolve('RESOLVED')} disabled={!!working} style={{ flex: 1, height: 36, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: working ? 'default' : 'pointer', background: colors.green, opacity: working && working !== 'RESOLVED' ? 0.6 : 1 }}>{working === 'RESOLVED' ? 'Saving…' : 'Resolve'}</button>
                  <button onClick={() => resolve('REJECTED')} disabled={!!working} style={{ flex: 1, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: working ? 'default' : 'pointer', background: '#fff', border: `1px solid ${colors.redTintBorder}`, color: colors.red, opacity: working && working !== 'REJECTED' ? 0.6 : 1 }}>{working === 'REJECTED' ? 'Saving…' : 'Reject'}</button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 10, lineHeight: 1.5 }}>Both parties are notified by email with the resolution note.</div>
            </div>

            {dispute.resolution && (
              <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>Current resolution note:</div>
                <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{dispute.resolution}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success toast */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{toast}</span>
        </div>
      )}
    </>
  )
}
