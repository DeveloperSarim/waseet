import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { Avatar } from '../../components/ui'
import { developerApi } from '../../lib/api'
import { initials, joinedLabel } from '../../lib/adminFormat'

const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 8px)'
const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 12 }
const sectionLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }
const rLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }

const stepLabels = ['New', 'Contacted', 'Site Visit', 'Negotiation', 'Closed', 'Lost']
const STATUS_ORDER = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATING', 'CLOSED', 'LOST']
const ENUM_TO_LABEL = { NEW: 'New', CONTACTED: 'Contacted', VIEWING: 'Site Visit', NEGOTIATING: 'Negotiation', CLOSED: 'Closed', LOST: 'Lost' }
const LABEL_TO_ENUM = { New: 'NEW', Contacted: 'CONTACTED', 'Site Visit': 'VIEWING', Negotiation: 'NEGOTIATING', Lost: 'LOST' }

const modalShell = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
const modalCard = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 440, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }
const btnGhost = { height: 34, padding: '0 16px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }
const inputStyle = { width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }
const modalFieldLabel = { fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }

const fmt = (raw) => {
  const d = String(raw).replace(/[^\d]/g, '')
  return d ? Number(d).toLocaleString('en-US') : ''
}
const sar = (n) => 'SAR ' + Number(n || 0).toLocaleString('en-US')
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
const budgetOf = (b) => {
  if (b == null || b === '') return 0
  if (typeof b === 'number') return b
  return Number(String(b).replace(/[^\d]/g, '')) || 0
}

export default function DeveloperLeadDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [paid, setPaid] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [statusChoice, setStatusChoice] = useState('')
  const [updating, setUpdating] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closeErr, setCloseErr] = useState('')
  const [closedInfo, setClosedInfo] = useState(null)
  const [toast, setToast] = useState('')
  const timers = useRef([])

  const load = useCallback(() => {
    setLoading(true)
    developerApi.getLead(id)
      .then((l) => {
        if (l) { setLead(l); setNotFound(false) } else { setNotFound(true) }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // keep the status dropdown + close price in sync with the loaded lead
  useEffect(() => {
    if (!lead) return
    setStatusChoice(ENUM_TO_LABEL[lead.status] || 'New')
    const b = budgetOf(lead.budget)
    if (b) setPrice(b.toLocaleString('en-US'))
  }, [lead])

  const showToast = (msg) => {
    setToast(msg)
    timers.current.push(setTimeout(() => setToast(''), 5000))
  }

  const updateStatus = async () => {
    const en = LABEL_TO_ENUM[statusChoice]
    if (!en || !lead) return
    setUpdating(true)
    try {
      await developerApi.updateLeadStatus(lead.id, en)
      showToast(`Status updated to ${statusChoice}`)
      load()
    } catch (e) {
      showToast(e?.message || 'Could not update status.')
    } finally {
      setUpdating(false)
    }
  }

  const priceNum = Number(String(price).replace(/[^\d]/g, '')) || 0
  const comm = Math.round(priceNum * 0.03)
  const fee = Math.round(comm * 0.15)
  const net = comm - fee

  const confirmClose = async () => {
    if (!lead) return
    if (!comm) { setCloseErr('Enter a valid sale price.'); return }
    setClosing(true); setCloseErr('')
    try {
      const res = await developerApi.closeDeal(lead.id, comm)
      setClosedInfo(res)
      setCloseOpen(false); setPaid(false)
      showToast(`Deal closed — commission ${sar(comm)} created for the realtor`)
      load()
    } catch (e) {
      setCloseErr(e?.message || 'Could not close the deal.')
    } finally {
      setClosing(false)
    }
  }

  const tabStyle = (on) => ({ padding: '5px 11px', fontSize: 12, borderRadius: 6, ...(on ? { background: '#fff', color: colors.ink, fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } : { color: colors.textSoft }) })

  if (loading) {
    return (
      <>
        <Topbar left={<span onClick={() => navigate('/developer/leads')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>← All Leads</span>} />
        <div style={{ flex: 1, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: colors.textFaint }}>Loading lead…</div>
      </>
    )
  }
  if (notFound || !lead) {
    return (
      <>
        <Topbar left={<span onClick={() => navigate('/developer/leads')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>← All Leads</span>} />
        <div style={{ flex: 1, background: colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Lead not found</div>
          <button onClick={() => navigate('/developer/leads')} style={{ height: 34, padding: '0 16px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>← Back to leads</button>
        </div>
      </>
    )
  }

  const label = ENUM_TO_LABEL[lead.status] || lead.status
  const view = lead.status === 'CLOSED' ? 'closed' : lead.status === 'LOST' ? 'lost' : 'neg'
  const currentIdx = STATUS_ORDER.indexOf(lead.status)
  const budgetNum = budgetOf(lead.budget)
  const budgetLabel = budgetNum ? sar(budgetNum) : '—'

  const clientFields = [
    ['Email', lead.clientEmail || '—'],
    ['Budget', budgetLabel],
    ['Unit Interest', lead.unit || '—'],
    ['Lead ID', `#${lead.id}`],
    ['Submitted', fmtDate(lead.createdAt)],
    ['Last Updated', fmtDate(lead.updatedAt)],
  ]

  const closedCommission = closedInfo?.commission?.gross ?? closedInfo?.commission?.amount ?? lead?.commission?.gross ?? (budgetNum ? Math.round(budgetNum * 0.03) : null)

  const timeline = stepLabels.map((stLabel, i) => {
    const isDone = i < currentIdx
    const isCurrent = i === currentIdx
    return {
      label: stLabel,
      date: i === 0 ? fmtDate(lead.createdAt) : isCurrent ? fmtDate(lead.updatedAt) : '—',
      sub: i === 0 ? `Lead submitted${lead.realtorName ? ' by ' + lead.realtorName : ''}` : isCurrent ? 'Current status' : '',
      showCheck: isDone || (isCurrent && view === 'closed'),
      showDot: isCurrent && view !== 'closed',
      circleBg: isDone ? colors.green : isCurrent ? (view === 'lost' ? colors.red : view === 'closed' ? colors.green : colors.ink) : '#fff',
      circleBorder: isDone || isCurrent ? 'none' : `1.5px solid ${colors.border}`,
      hasLine: i < stepLabels.length - 1,
      lineColor: i < currentIdx ? colors.green : colors.border,
      weight: isCurrent ? 600 : 500,
      color: isDone || isCurrent ? colors.ink : colors.textFaint,
    }
  })

  const previewComm = Math.round(budgetNum * 0.03)
  const previewFee = Math.round(previewComm * 0.15)

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: colors.ink, color: '#fff', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}
      <Topbar
        left={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span onClick={() => navigate('/developer/leads')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>All Leads</span>
            <Icon name="chevronRight" size={14} color={colors.borderStrong} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{lead.clientName} · {lead.projectName}</span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, background: colors.surfaceMuted, borderRadius: 8, padding: 3 }}>
              <span style={tabStyle(view === 'neg')}>Negotiation</span>
              <span style={tabStyle(view === 'closed')}>Closed</span>
              <span style={tabStyle(view === 'lost')}>Lost</span>
            </div>
            <button onClick={() => navigate('/developer/leads')} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>← Back to leads</button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        <div className="rp-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* LEFT */}
          <div style={{ flex: 2, minWidth: 0 }}>
            {/* Client info */}
            <div style={card}>
              <div style={sectionLabel}>Client Information</div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <Avatar initials={initials(lead.clientName)} size={52} fontSize={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>{lead.clientName}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Icon name="phone" size={15} color={colors.green} strokeWidth={1.8} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{lead.clientPhone || '—'}</span>
                    <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}`, borderRadius: 6, cursor: 'pointer' }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.7}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#25D366', borderRadius: 999, padding: '5px 12px', cursor: 'pointer' }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2z" /></svg>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>WhatsApp</span>
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                {clientFields.map(([fLabel, value]) => (
                  <div key={fLabel}>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{fLabel}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: colors.textMuted }}>{initials(lead.realtorName)}</div>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{lead.realtorName || '—'}</div><div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>Realtor</div></div>
                <span onClick={() => navigate('/developer/network')} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer', marginLeft: 'auto' }}>View Realtor</span>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>Realtor notes</div>
                <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: colors.textMuted, lineHeight: 1.6, fontStyle: 'italic' }}>
                  {lead.notes || 'No notes provided.'}
                </div>
              </div>
            </div>

            {/* Project */}
            <div style={card}>
              <div style={{ ...sectionLabel, marginBottom: 12 }}>Project</div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 64, height: 48, minWidth: 64, borderRadius: 8, background: colors.surfaceMuted, backgroundImage: hatch }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{lead.projectName}</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Icon name="mapPin" size={12} color={colors.textFaint} strokeWidth={1.8} />
                    <span style={{ fontSize: 12, color: colors.textFaint }}>{lead.unit ? `Unit: ${lead.unit}` : '—'}</span>
                  </div>
                  {budgetNum > 0 && <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Budget: {budgetLabel}</div>}
                </div>
              </div>
            </div>

            {/* Internal notes */}
            <div style={card} className="wa-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Internal notes</span>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              </div>
              <div style={{ fontSize: 12, color: colors.textFaint, padding: '4px 0 12px' }}>No internal notes yet.</div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <textarea placeholder="Add an internal note..." style={{ width: '100%', height: 70, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button style={{ height: 30, padding: '0 12px', background: colors.green, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Save Note</button>
                </div>
              </div>
            </div>

            {/* Dispute */}
            <div style={{ ...card, marginBottom: 0 }}>
              <div style={rLabel}>Dispute</div>
              <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.6, marginBottom: 12 }}>If there's an issue with this lead or commission, raise a dispute.</div>
              <button onClick={() => setDisputeOpen(true)} style={{ width: '100%', height: 34, background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, fontSize: 13, color: colors.red, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.8}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" /></svg>Raise Dispute
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 250, position: 'sticky', top: 0 }}>
            {/* Lead status */}
            <div style={card}>
              <div style={rLabel}>Lead Status</div>

              {view === 'closed' ? (
                paid ? (
                  <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth={1.8} style={{ marginBottom: 8 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.amberText }}>Payment proof uploaded</div>
                    <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>Awaiting Waseet verification</div>
                  </div>
                ) : (
                  <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={{ marginBottom: 8 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l2.5 2.5L16 9" /></svg>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Deal Closed! 🎉</div>
                    <div style={{ fontSize: 13, color: colors.textSoft, marginTop: 2 }}>{closedCommission != null ? `${sar(closedCommission)} commission due` : 'Commission recorded'}</div>
                    <div style={{ fontSize: 12, color: colors.amber, marginTop: 4 }}>Payment due within 7 days</div>
                    <button onClick={() => setPaid(true)} style={{ width: '100%', height: 36, marginTop: 10, background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Upload Payment Proof</button>
                  </div>
                )
              ) : (
                <div className="wa-form">
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 700, ...(view === 'lost' ? { background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, color: '#991B1B' } : { background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, color: colors.amberText }) }}>{label}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 6 }}>Since {joinedLabel(lead.updatedAt)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>Update status:</div>
                  <select value={statusChoice} onChange={(e) => setStatusChoice(e.target.value)} style={{ width: '100%', height: 36, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', color: colors.textMuted, background: '#fff' }}>
                    <option>New</option><option>Contacted</option><option>Site Visit</option><option>Negotiation</option><option>Lost</option>
                  </select>
                  <button onClick={updateStatus} disabled={updating} style={{ width: '100%', height: 34, marginTop: 8, background: colors.green, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: updating ? 'default' : 'pointer', opacity: updating ? 0.7 : 1 }}>{updating ? 'Updating…' : 'Update Status'}</button>
                  <button onClick={() => { setCloseErr(''); setCloseOpen(true) }} style={{ width: '100%', height: 36, marginTop: 10, background: colors.ink, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}><path d="M11 17a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M13 7a5 5 0 0 0-7 0L3 10a5 5 0 0 0 7 7l1-1" /></svg>Mark as Closed Deal
                  </button>
                </div>
              )}
            </div>

            {/* Status history */}
            <div style={card}>
              <div style={{ ...rLabel, marginBottom: 14 }}>Status History</div>
              {timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.circleBg, border: t.circleBorder }}>
                      {t.showCheck && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M5 12l4 4L19 7" /></svg>}
                      {t.showDot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    {t.hasLine && <div style={{ width: 1.5, height: 32, background: t.lineColor, margin: '2px 0' }} />}
                  </div>
                  <div style={{ paddingBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: t.weight, color: t.color }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{t.date}</div>
                    {t.sub && <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 1 }}>{t.sub}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Commission preview */}
            {view !== 'lost' && budgetNum > 0 && (
              <div style={{ ...card, marginBottom: 0 }}>
                <div style={rLabel}>Commission Preview</div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 10 }}>If closed at {sar(budgetNum)}{lead.unit ? ` (${lead.unit})` : ''}:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.textMuted, padding: '6px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><span>Sale Price</span><span>{sar(budgetNum)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.textMuted, padding: '6px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><span>Commission (3%)</span><span>{sar(previewComm)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.textFaint, padding: '6px 0' }}><span>Platform fee (15%)</span><span>{sar(previewFee)}</span></div>
                <div style={{ height: 1, background: colors.surfaceMuted, margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, paddingTop: 6 }}><span>You owe Waseet</span><span>{sar(previewComm)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.textSoft, marginTop: 4 }}><span>Realtor receives</span><span>{sar(previewComm - previewFee)}</span></div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 10, lineHeight: 1.5 }}>Payment due within 7 days of marking deal as closed.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close deal modal */}
      {closeOpen && (
        <div onClick={() => setCloseOpen(false)} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={modalCard} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Mark deal as closed</span><span onClick={() => setCloseOpen(false)} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}><div style={{ fontSize: 13, color: colors.textMuted }}>{lead.clientName} · {lead.projectName}{lead.unit ? ` ${lead.unit}` : ''}</div><div style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>#{lead.id}{lead.realtorName ? ` · ${lead.realtorName}` : ''}</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><div style={modalFieldLabel}>Unit Number</div><input defaultValue={lead.unit || ''} placeholder="e.g. 401" style={inputStyle} /></div>
              <div><div style={modalFieldLabel}>Final Sale Price *</div>
                <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden', height: 34 }}>
                  <span style={{ background: colors.bg, borderRight: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, color: colors.textSoft }}>SAR</span>
                  <input value={price} onChange={(e) => setPrice(fmt(e.target.value))} placeholder="900,000" style={{ flex: 1, border: 'none', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', minWidth: 0 }} />
                </div>
              </div>
              <div><div style={modalFieldLabel}>Closing Date</div><input placeholder="DD / MM / YYYY" style={inputStyle} /></div>
            </div>
            <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 12px', marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.textMuted }}><span>Commission (3%)</span><span>{sar(comm)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.textFaint, marginTop: 4 }}><span>Platform (15%)</span><span>{sar(fee)}</span></div>
              <div style={{ height: 1, background: colors.border, margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}><span>Realtor receives</span><span>{sar(net)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.textFaint, marginTop: 6 }}><span>Commission created</span><span>{sar(comm)}</span></div>
            </div>
            {closeErr && <div style={{ fontSize: 12, color: colors.red, marginTop: 10 }}>{closeErr}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setCloseOpen(false)} style={btnGhost}>Cancel</button>
              <button onClick={confirmClose} disabled={closing || !comm} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: (closing || !comm) ? 'default' : 'pointer', opacity: (closing || !comm) ? 0.7 : 1 }}>{closing ? 'Closing…' : 'Confirm & Close ✓'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute modal */}
      {disputeOpen && (
        <div onClick={() => setDisputeOpen(false)} style={modalShell}>
          <div onClick={(e) => e.stopPropagation()} style={modalCard} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Raise a dispute</span><span onClick={() => setDisputeOpen(false)} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span></div>
            <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}><div style={{ fontSize: 13, color: colors.textMuted }}>{lead.clientName} · {lead.projectName}{lead.unit ? ` ${lead.unit}` : ''}</div><div style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>Lead #{lead.id}</div></div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Reason for dispute *</div>
            <textarea placeholder="Describe the issue clearly..." style={{ width: '100%', height: 100, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 10 }}>Our team reviews disputes within 48 hours and notifies both parties.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={() => setDisputeOpen(false)} style={btnGhost}>Cancel</button>
              <button onClick={() => setDisputeOpen(false)} style={{ height: 34, padding: '0 14px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Submit Dispute</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
