import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { Avatar } from '../../components/ui'
import { adminApi } from '../../lib/api'
import { initials } from '../../lib/adminFormat'

const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 12 }
const sectionLabel = { fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }
const rLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }

const stepDefs = ['New', 'Contacted', 'Viewing', 'Negotiating', 'Closed', 'Lost']
const STEP_ENUM = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATING', 'CLOSED', 'LOST']
const STEP_INDEX = { NEW: 0, CONTACTED: 1, VIEWING: 2, NEGOTIATING: 3, CLOSED: 4, LOST: 5 }
const STATUS_LABEL = { NEW: 'New', CONTACTED: 'Contacted', VIEWING: 'Viewing', NEGOTIATING: 'Negotiating', CLOSED: 'Closed', LOST: 'Lost' }
const COMM_LABEL = { PENDING: 'Awaiting developer payment', PROCESSING: 'Paid by developer — in realtor wallet', PAID: 'Paid out to realtor', FAILED: 'Payment failed' }

const sar = (n) => 'SAR ' + Number(n || 0).toLocaleString('en-US')
const budgetOf = (b) => { if (b == null || b === '') return 0; if (typeof b === 'number') return b; return Number(String(b).replace(/[^\d]/g, '')) || 0 }
const fmtWhen = (x) => (x ? new Date(x).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—')
const fmtDay = (x) => (x ? new Date(x).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')

export default function AdminLeadDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setLead(await adminApi.getLead(id)) }
    catch (e) { setError(e.status === 404 ? 'notfound' : (e.message || 'Could not load this lead')) }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { load() }, [load])

  const status = lead?.status
  const isClosed = status === 'CLOSED'
  const isLost = status === 'LOST'
  const view = isClosed ? 'closed' : isLost ? 'lost' : 'neg'
  const currentIdx = STEP_INDEX[status] ?? 0

  const histMap = {}
  if (Array.isArray(lead?.statusHistory)) lead.statusHistory.forEach((h) => { if (h?.status && h?.at) histMap[h.status] = h.at })
  const dates = stepDefs.map((_, i) => {
    const en = STEP_ENUM[i]
    if (histMap[en]) return fmtWhen(histMap[en])
    if (i === 0) return fmtWhen(lead?.createdAt)
    if (i === currentIdx) return fmtWhen(lead?.updatedAt)
    return '—'
  })

  const budgetNum = budgetOf(lead?.budget)
  const comm = lead?.commission
  const estComm = Math.round(budgetNum * 0.03)
  const estFee = Math.round(estComm * 0.15)
  const preview = (isClosed && comm)
    ? { sale: Math.round((comm.gross || 0) / 0.03), commission: comm.gross || 0, fee: (comm.gross || 0) - (comm.net || 0), receive: comm.net || 0 }
    : { sale: budgetNum, commission: estComm, fee: estFee, receive: estComm - estFee }
  const money = (n) => (n > 0 ? sar(n) : '—')

  const clientFields = lead ? [
    ['Email', lead.clientEmail || '—'],
    ['Budget', budgetNum ? sar(budgetNum) : '—'],
    ['Unit', lead.unit || '—'],
    ['Lead ID', `#${lead.id}`],
    ['Submitted', fmtWhen(lead.createdAt)],
    ['Last updated', fmtWhen(lead.updatedAt)],
  ] : []

  const timeline = stepDefs.map((label, i) => {
    const isDone = i < currentIdx
    const isCurrent = i === currentIdx
    return {
      label, date: dates[i], isCurrent,
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

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
            <span onClick={() => navigate('/admin/leads')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer', whiteSpace: 'nowrap' }}>All Leads</span>
            <Icon name="chevronRight" size={14} color={colors.borderStrong} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead ? `${lead.clientName || 'Lead'} · ${lead.projectName || ''}`.replace(/·\s*$/, '').trim() : (loading ? 'Loading…' : 'Lead')}</span>
          </div>
        }
        actions={<button onClick={() => navigate('/admin/leads')} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>← Back to leads</button>}
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {loading && <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading lead…</div>}
        {!loading && error === 'notfound' && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: colors.textFaint }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Lead not found</div>
            <button onClick={() => navigate('/admin/leads')} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', marginTop: 8 }}>← Back to leads</button>
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
            <div style={card}>
              <div style={sectionLabel}>Client Information</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
                <Avatar initials={initials(lead.clientName)} size={52} fontSize={16} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>{lead.clientName || '—'}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted }}>{lead.clientPhone || '—'}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                {clientFields.map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted, wordBreak: 'break-all' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                <div><div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Realtor</div><div style={{ fontSize: 13, color: colors.textMuted }}>{lead.realtorName || '—'}</div></div>
                <div><div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Developer</div><div style={{ fontSize: 13, color: colors.textMuted }}>{lead.developerName || '—'}</div></div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>Realtor notes</div>
                <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: lead.notes ? colors.textMuted : colors.textFaint, lineHeight: 1.6, fontStyle: 'italic' }}>{lead.notes || 'No notes provided.'}</div>
              </div>
            </div>

            <div style={{ ...card, marginBottom: 0 }}>
              <div style={sectionLabel}>Project</div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {lead.projectImage ? (
                  <img src={lead.projectImage} alt="" style={{ width: 64, height: 48, minWidth: 64, borderRadius: 8, objectFit: 'cover', border: `1px solid ${colors.border}` }} />
                ) : (
                  <div style={{ width: 64, height: 48, minWidth: 64, borderRadius: 8, background: colors.surfaceMuted, backgroundImage: 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 8px)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{lead.projectName || '—'}</div>
                  <div style={{ fontSize: 12, color: colors.textFaint }}>{lead.developerName || '—'}{lead.unit ? ` · Unit ${lead.unit}` : ''}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={card}>
              <div style={{ ...rLabel, marginBottom: 16 }}>Lead Status</div>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ display: 'inline-block', borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 700, ...(view === 'lost' ? { background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, color: '#991B1B' } : view === 'closed' ? { background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, color: colors.greenDark } : { background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, color: colors.amberText }) }}>{STATUS_LABEL[status] || status || '—'}</div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 6 }}>Updated {fmtDay(lead.updatedAt)}</div>
              </div>
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
            </div>

            <div style={{ ...card, marginBottom: 0 }}>
              <div style={rLabel}>{isClosed ? 'Commission' : 'Commission estimate'}</div>
              <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 10 }}>{isClosed ? 'Final commission on this deal:' : budgetNum ? `Estimated on the client's SAR ${budgetNum.toLocaleString('en-US')} budget:` : 'No budget provided.'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.textMuted }}><span>Sale Price</span><span>{money(preview.sale)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.textMuted, marginTop: 4 }}><span>Commission (3%)</span><span>{money(preview.commission)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.textFaint, marginTop: 4 }}><span>Platform fee (15%)</span><span>{money(preview.fee)}</span></div>
              <div style={{ height: 1, background: colors.surfaceMuted, margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}><span>Realtor receives</span><span style={{ color: isClosed ? colors.green : colors.ink }}>{money(preview.receive)}</span></div>
              {comm && <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 10 }}>Status: {COMM_LABEL[comm.status] || comm.status}</div>}
            </div>
          </div>
        </div>
        )}
      </div>
    </>
  )
}
