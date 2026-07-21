import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { Avatar } from '../../components/ui'
import { realtorApi } from '../../lib/api'
import { initials, joinedLabel } from '../../lib/adminFormat'

const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 8px)'
const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 12 }
const sectionLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }
const rLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }

// pipeline steps aligned to the Lead status enum
const stepDefs = ['New', 'Contacted', 'Viewing', 'Negotiating', 'Closed', 'Lost']
const STEP_ENUM = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATING', 'CLOSED', 'LOST']
const STEP_INDEX = { NEW: 0, CONTACTED: 1, VIEWING: 2, NEGOTIATING: 3, CLOSED: 4, LOST: 5 }
const STATUS_LABEL = { NEW: 'New', CONTACTED: 'Contacted', VIEWING: 'Viewing', NEGOTIATING: 'Negotiating', CLOSED: 'Closed', LOST: 'Lost' }

const sar = (n) => 'SAR ' + Number(n || 0).toLocaleString('en-US')
const budgetOf = (b) => { if (b == null || b === '') return 0; if (typeof b === 'number') return b; return Number(String(b).replace(/[^\d]/g, '')) || 0 }
const fmtWhen = (x) => (x ? new Date(x).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')

const modalShell = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
const btnGhost = { height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }

export default function LeadDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeErr, setDisputeErr] = useState('')
  const [submittingDispute, setSubmittingDispute] = useState(false)
  const [toast, setToast] = useState('')

  const submitDispute = async () => {
    if (submittingDispute || !lead) return
    if (!disputeReason.trim()) { setDisputeErr('Please describe the issue.'); return }
    setSubmittingDispute(true); setDisputeErr('')
    try {
      await realtorApi.createDispute({ leadId: lead.id, subject: disputeReason.trim().split('\n')[0].slice(0, 80), description: disputeReason.trim() })
      setDisputeOpen(false); setDisputeReason('')
      setToast('Dispute submitted — our team reviews within 48 hours'); setTimeout(() => setToast(''), 4000)
    } catch (e) { setDisputeErr(e.message || 'Could not submit dispute') } finally { setSubmittingDispute(false) }
  }

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setLead(await realtorApi.getLead(id)) }
    catch (e) {
      if (e.status === 404) setError('notfound')
      else setError(e.message || 'Could not load this lead')
    } finally { setLoading(false) }
  }, [id])
  useEffect(() => { load() }, [load])

  const status = lead?.status
  const isClosed = status === 'CLOSED'
  const isLost = status === 'LOST'
  const view = isClosed ? 'closed' : isLost ? 'lost' : 'neg'
  const currentIdx = STEP_INDEX[status] ?? 0
  // Per-status timestamps come from the recorded statusHistory; fall back to
  // createdAt (New) / updatedAt (current) for leads created before it existed.
  const histMap = {}
  if (Array.isArray(lead?.statusHistory)) lead.statusHistory.forEach((h) => { if (h?.status && h?.at) histMap[h.status] = h.at })
  const dates = stepDefs.map((_, i) => {
    const en = STEP_ENUM[i]
    if (histMap[en]) return fmtWhen(histMap[en])
    if (i === 0) return fmtWhen(lead?.createdAt)
    if (i === currentIdx) return fmtWhen(lead?.updatedAt)
    return '—'
  })

  // Commission math: actuals from the commission once closed, otherwise an
  // estimate from the client's budget (3% commission, 15% platform fee).
  const budgetNum = budgetOf(lead?.budget)
  const comm = lead?.commission
  const estComm = Math.round(budgetNum * 0.03)
  const estFee = Math.round(estComm * 0.15)
  const preview = (isClosed && comm)
    ? { sale: Math.round((comm.gross || 0) / 0.03), commission: comm.gross || 0, fee: (comm.gross || 0) - (comm.net || 0), receive: comm.net || 0 }
    : { sale: budgetNum, commission: estComm, fee: estFee, receive: estComm - estFee }
  const money = (n) => (n > 0 ? sar(n) : '—')

  const timeline = stepDefs.map((label, i) => {
    const isDone = i < currentIdx
    const isCurrent = i === currentIdx
    return {
      label, date: dates[i],
      isDone, isCurrent,
      showCheck: isDone || (isCurrent && view === 'closed'),
      showDot: isCurrent && view !== 'closed',
      circleBg: isDone ? colors.green : isCurrent ? (view === 'lost' ? colors.red : view === 'closed' ? colors.green : colors.ink) : '#fff',
      circleBorder: isDone || isCurrent ? 'none' : `1.5px solid ${colors.border}`,
      hasLine: i < stepDefs.length - 1,
      lineColor: i < currentIdx ? colors.green : colors.border,
      weight: isCurrent ? 600 : 500,
      color: isDone || isCurrent ? colors.ink : colors.textFaint,
    }
  })

  const clientFields = lead ? [
    ['Email', lead.clientEmail || '—'],
    ['Budget', budgetNum ? sar(budgetNum) : '—'],
    ['Unit Type', lead.unit || '—'],
    ['Submitted', fmtWhen(lead.createdAt)],
    ['Last updated', fmtWhen(lead.updatedAt)],
  ] : []

  const waHref = lead?.clientPhone ? `https://wa.me/${lead.clientPhone.replace(/[^\d]/g, '')}` : null
  const crumb = lead ? `${lead.projectName || 'Lead'} · ${lead.clientName || ''}`.trim().replace(/·\s*$/, '').trim() : (loading ? 'Loading…' : 'Lead')

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
            <span onClick={() => navigate('/realtor/leads')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer', whiteSpace: 'nowrap' }}>My Leads</span>
            <Icon name="chevronRight" size={14} color={colors.borderStrong} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{crumb}</span>
          </div>
        }
        actions={
          <button className="wa-hide-sm" onClick={() => navigate('/realtor/leads')} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>← Back to leads</button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {loading && <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading lead…</div>}
        {!loading && error === 'notfound' && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: colors.textFaint }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Lead not found</div>
            <div style={{ fontSize: 13, marginBottom: 14 }}>This lead may have been removed.</div>
            <button onClick={() => navigate('/realtor/leads')} style={btnGhost}>← Back to leads</button>
          </div>
        )}
        {!loading && error && error !== 'notfound' && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Icon name="xCircle" size={16} color={colors.red} strokeWidth={1.9} />
            <span style={{ fontSize: 13, color: colors.textMuted }}>{error}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}
        {!loading && !error && lead && (
        <div className="rp-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* LEFT */}
          <div style={{ flex: 2, minWidth: 0 }}>
            {/* Client info */}
            <div style={card}>
              <div style={sectionLabel}>Client Information</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
                <Avatar initials={initials(lead.clientName)} size={52} fontSize={16} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>{lead.clientName || '—'}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 999, padding: '3px 10px' }}>
                      <Icon name="phone" size={13} color={colors.green} strokeWidth={1.8} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: colors.greenDark }}>{lead.clientPhone || '—'}</span>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.7} style={{ cursor: 'pointer' }}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                    </span>
                    {waHref && (
                      <a href={waHref} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#25D366', borderRadius: 999, padding: '3px 10px', cursor: 'pointer', textDecoration: 'none' }}>
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.6-6c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2a.4.4 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c2.3.9 2.3.6 2.7.6a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.5-.3z" /></svg>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                {clientFields.map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>Your submission notes</div>
                <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: lead.notes ? colors.textMuted : colors.textFaint, lineHeight: 1.6, fontStyle: 'italic' }}>
                  {lead.notes || 'No notes added.'}
                </div>
              </div>
            </div>

            {/* Project */}
            <div style={card}>
              <div style={sectionLabel}>Project</div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {lead.projectImage ? (
                  <img src={lead.projectImage} alt="" style={{ width: 64, height: 48, minWidth: 64, borderRadius: 8, objectFit: 'cover', border: `1px solid ${colors.border}` }} />
                ) : (
                  <div style={{ width: 64, height: 48, minWidth: 64, borderRadius: 8, background: colors.surfaceMuted, backgroundImage: hatch }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{lead.projectName || '—'}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Icon name="mapPin" size={12} color={colors.textFaint} strokeWidth={1.8} />
                    <span style={{ fontSize: 12, color: colors.textFaint }}>{lead.developerName || '—'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Unit: {lead.unit || '—'}</div>
                </div>
                <span onClick={() => navigate('/realtor/browse')} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>View Project →</span>
              </div>
            </div>

            {/* Developer notes */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Developer notes</span>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              </div>
              <div style={{ fontSize: 13, color: colors.textFaint, padding: '8px 0', fontStyle: 'italic' }}>No developer notes yet.</div>
            </div>

            {/* Lost info */}
            {isLost && (
              <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 13, color: '#991B1B', lineHeight: 1.6 }}>
                This lead was marked as lost.
              </div>
            )}

            {/* Raise dispute */}
            <div style={{ ...card, marginBottom: 0 }}>
              <div style={rLabel}>Raise a dispute</div>
              <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.6, marginBottom: 12 }}>If you believe there is an issue with this lead or commission, you can raise a dispute.</div>
              <button onClick={() => setDisputeOpen(true)} style={{ width: '100%', height: 34, background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, fontSize: 13, color: colors.red, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.8}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" /></svg>Raise Dispute
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 250, position: 'sticky', top: 0 }}>
            {/* Lead status */}
            <div style={card}>
              <div style={{ ...rLabel, marginBottom: 16 }}>Lead Status</div>

              {view === 'closed' ? (
                <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '14px 16px', marginBottom: 14, textAlign: 'center' }}>
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={{ marginBottom: 8 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l2.5 2.5L16 9" /></svg>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Deal Closed! 🎉</div>
                  <div style={{ fontSize: 14, color: colors.greenDark, marginTop: 2 }}>Commission: {comm ? sar(comm.net) : '—'}</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>Updated {fmtWhen(lead.updatedAt)}</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'inline-block', borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 700, ...(view === 'lost' ? { background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, color: '#991B1B' } : { background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, color: colors.amberText }) }}>{STATUS_LABEL[status] || status || '—'}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 6 }}>Updated {joinedLabel(lead.updatedAt)}</div>
                </div>
              )}

              <div>
                {timeline.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.circleBg, border: t.circleBorder }}>
                        {t.showCheck && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M5 12l4 4L19 7" /></svg>}
                        {t.showDot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      {t.hasLine && <div style={{ width: 1.5, height: 28, background: t.lineColor, margin: '2px 0' }} />}
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: t.weight, color: t.color }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{t.date}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: colors.textFaint, textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>Status is updated by the developer</div>
            </div>

            {/* Commission preview */}
            {view !== 'lost' && (
              <div style={card}>
                <div style={rLabel}>{view === 'closed' ? 'Commission earned' : 'If deal closes'}</div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 10 }}>{isClosed ? 'Final commission on this deal:' : budgetNum ? `Estimated on the client's SAR ${budgetNum.toLocaleString('en-US')} budget:` : 'Add a budget to estimate your commission.'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.textMuted }}><span>Sale Price</span><span>{money(preview.sale)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.textMuted, marginTop: 4 }}><span>Commission (3%)</span><span>{money(preview.commission)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.textFaint, marginTop: 4 }}><span>Platform fee (15%)</span><span>{money(preview.fee)}</span></div>
                <div style={{ height: 1, background: colors.surfaceMuted, margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}><span>You receive</span><span style={{ color: view === 'closed' ? colors.green : colors.ink }}>{money(preview.receive)}</span></div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 10, lineHeight: 1.5 }}>{view === 'closed' ? 'Processing — paid to your bank after Waseet verifies the deal.' : 'Estimate only — the final amount depends on the price the deal closes at.'}</div>
              </div>
            )}

            {/* Actions */}
            <div style={{ ...card, marginBottom: 0 }}>
              <div style={rLabel}>Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => navigate('/realtor/browse')} style={{ height: 34, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.7}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>View Project →
                </button>
                {waHref && (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" style={{ height: 34, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 8, fontSize: 12, color: colors.greenDark, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="#25D366"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2z" /></svg>WhatsApp Client
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Dispute modal */}
      {disputeOpen && lead && (
        <div onClick={() => setDisputeOpen(false)} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Raise a dispute</span><span onClick={() => setDisputeOpen(false)} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}><div style={{ fontSize: 13, color: colors.textMuted }}>{lead.clientName || '—'} · {lead.projectName || '—'}{lead.unit ? ` ${lead.unit}` : ''}</div><div style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>Lead #{lead.id}</div></div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Reason for dispute *</div>
            <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Describe the issue clearly. e.g. I submitted this lead first but another realtor was credited..." style={{ width: '100%', height: 100, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            {disputeErr && <div style={{ fontSize: 12, color: colors.red, marginTop: 6 }}>{disputeErr}</div>}
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, margin: '10px 0 4px' }}>Evidence (optional)</div>
            <div style={{ border: `2px dashed ${colors.borderStrong}`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: colors.textFaint }}>Attach screenshots or documents</div>
              <button style={{ height: 28, padding: '0 10px', marginTop: 6, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Browse</button>
            </div>
            <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 10 }}>Our team reviews disputes within 48 hours and notifies both parties.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={() => setDisputeOpen(false)} disabled={submittingDispute} style={btnGhost}>Cancel</button>
              <button onClick={submitDispute} disabled={submittingDispute} style={{ height: 34, padding: '0 14px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: submittingDispute ? 'default' : 'pointer', opacity: submittingDispute ? 0.7 : 1 }}>{submittingDispute ? 'Submitting…' : 'Submit Dispute'}</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 80, background: colors.ink, color: '#fff', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}
    </>
  )
}
