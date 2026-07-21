import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { adminApi } from '../../lib/api'
import { initials } from '../../lib/adminFormat'

const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 12 }
const capLabel = { fontSize: 9, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }
const rLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }
const boxField = { fontSize: 10, color: colors.textFaint, marginBottom: 2 }
const btnGhost = { height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }

const money = (n) => (n == null ? '—' : `SAR ${Number(n).toLocaleString()}`)
const longDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—')

// Minimal dependency-free single-page PDF (Helvetica, ASCII). Returns bytes.
function makePDF(title, lines) {
  const esc = (s) => String(s).replace(/([\\()])/g, '\\$1').replace(/[^\x20-\x7E]/g, '')
  let stream = `BT\n/F1 20 Tf\n60 780 Td\n(${esc(title)}) Tj\n/F1 12 Tf\n`
  let first = true
  for (const l of lines) { stream += `0 ${first ? -40 : -20} Td\n(${esc(l)}) Tj\n`; first = false }
  stream += 'ET'
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
    `<</Length ${stream.length}>>\nstream\n${stream}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = []
  objs.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((off) => { pdf += String(off).padStart(10, '0') + ' 00000 n \n' })
  pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`
  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  return bytes
}

// backend status → big status pill + how many timeline steps are complete
const STATUS_META = {
  PENDING: { label: 'Pending Payment', bg: '#FEF9EC', color: '#92400E', border: '#F3E2B8', doneCount: 1 },
  PROCESSING: { label: 'Processing', bg: '#EEF3FF', color: '#1B4FD8', border: '#BFDBFE', doneCount: 2 },
  PAID: { label: 'Paid · Disbursed', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', doneCount: 4 },
  FAILED: { label: 'Failed', bg: '#FFF5F5', color: '#991B1B', border: '#FECACA', doneCount: 1 },
}

export default function AdminCommissionDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [c, setC] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setNotFound(false)
    try {
      const data = await adminApi.getCommission(id)
      if (!data) setNotFound(true)
      else setC(data)
    } catch (e) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const doDisburse = async () => {
    if (working) return
    if (!window.confirm(`Confirm you have sent SAR ${Number(c.net).toLocaleString()} to ${c.realtorName}'s bank account (${c.realtorIban || 'IBAN on file'})?`)) return
    setWorking(true)
    try {
      const updated = await adminApi.disburseCommission(c.id)
      setC(updated)
      setToast('Commission disbursed — realtor notified')
      setTimeout(() => setToast(''), 3000)
    } catch (e) {
      setToast(e.message || 'Could not disburse')
      setTimeout(() => setToast(''), 3500)
    } finally { setWorking(false) }
  }

  const downloadInvoice = () => {
    if (!c) return
    const sale = c.salePrice ? `SAR ${Number(c.salePrice).toLocaleString()}` : '-'
    const lines = [
      `Invoice #: ${c.dealRef || '-'}`,
      `Issued: ${longDate(c.createdAt)}`,
      `Deal closed: ${longDate(c.closedAt)}`,
      '',
      'FROM: Waseet (support@waseet.io)',
      `TO: ${c.developerName || '-'}`,
      '',
      `Project: ${c.projectName || '-'}${c.unit ? ' - ' + c.unit : ''}`,
      `Realtor: ${c.realtorName || '-'}`,
      `Client: ${c.clientName || '-'}`,
      `Status: ${meta.label}`,
      '',
      `Sale Price: ${sale}`,
      `Gross Commission: ${money(c.gross)}`,
      `Platform Fee (${pct}): - ${money(c.platformFee)}`,
      `Total Due to Waseet: ${money(c.gross)}`,
      `Realtor Receives (net): ${money(c.net)}`,
      '',
      `Realtor Bank: ${c.realtorBank || '-'}`,
      `IBAN: ${c.realtorIban || '-'}`,
      '',
      'Waseet - private B2B real estate marketplace',
    ]
    const blob = new Blob([makePDF('Waseet - Commission Invoice', lines)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `invoice_${c.dealRef || 'commission'}.pdf`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setToast('Invoice downloaded'); setTimeout(() => setToast(''), 2500)
  }

  const fromToBox = (label, name, sub) => (
    <div style={{ flex: 1, background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ ...capLabel, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{name}</div>
      {sub ? <div style={{ fontSize: 12, color: colors.textSoft }}>{sub}</div> : null}
    </div>
  )

  if (loading) {
    return (
      <>
        <Topbar left={<span style={{ fontSize: 13, fontWeight: 500 }}>Commission</span>} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, fontSize: 13, color: colors.textFaint }}>Loading commission…</div>
      </>
    )
  }

  if (notFound || !c) {
    return (
      <>
        <Topbar
          left={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span onClick={() => navigate('/admin/commissions')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Commissions</span>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Not found</span>
            </div>
          }
          actions={<button onClick={() => navigate('/admin/commissions')} style={btnGhost}>← Back</button>}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center', background: colors.bg }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Commission not found</div>
          <div style={{ fontSize: 13, color: colors.textFaint }}>This commission may have been removed or the link is invalid.</div>
          <span onClick={() => navigate('/admin/commissions')} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer', marginTop: 4 }}>← Back to commissions</span>
        </div>
      </>
    )
  }

  const meta = STATUS_META[c.status] || STATUS_META.PENDING
  const pct = c.platformPct != null ? `${c.platformPct}%` : '—'
  const isFailed = c.status === 'FAILED'

  const dealDetails = [
    ['Project', c.projectName || '—'], ['Unit', c.unit || '—'],
    ['Realtor', c.realtorName || '—'], ['Developer', c.developerName || '—'],
    ['Client', c.clientName || '—'], ['Client phone', c.clientPhone || '—'],
    ['Sale price', money(c.salePrice)], ['Lead submitted', longDate(c.leadSubmittedAt)],
    ['Deal Closed', longDate(c.closedAt)], ['Status', meta.label],
  ]
  const breakdown = [
    ['Sale Price', money(c.salePrice), false, false],
    ['Developer Commission Rate', '3%', false, true],
    ['Gross Commission', money(c.gross), true, false],
    [`Platform Fee (${pct} of ${money(c.gross)})`, `− ${money(c.platformFee)}`, false, true],
  ]
  const realtorBank = [
    ['Bank', c.realtorBank || '—'],
    ['Account Name', c.realtorName || '—'],
    ['IBAN', c.realtorIban || '—'],
  ]

  const flowSteps = [
    { label: 'Deal closed', date: longDate(c.closedAt) },
    { label: 'Payment received', date: '—' },
    { label: 'Waseet verified', date: '—' },
    { label: 'Disbursed to realtor', date: '—' },
  ]
  const doneCount = meta.doneCount
  const flow = flowSteps.map((st, i) => {
    const isDone = i < doneCount
    const isCurrent = i === doneCount && !isFailed && c.status !== 'PAID'
    return {
      ...st, isDone, isCurrent,
      hasLine: i < flowSteps.length - 1,
      lineColor: i < doneCount - 1 ? colors.green : colors.border,
      circleBg: isDone ? colors.green : isCurrent ? colors.ink : '#fff',
      circleBorder: isDone || isCurrent ? 'none' : `1.5px solid ${colors.border}`,
      weight: isCurrent ? 600 : 500,
      color: isDone || isCurrent ? colors.ink : colors.textFaint,
    }
  })

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span onClick={() => navigate('/admin/commissions')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Commissions</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Deal #{c.dealRef || '—'}</span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={downloadInvoice} className="wa-hide-sm" style={btnGhost}>Download Invoice PDF</button>
            <button onClick={() => navigate('/admin/commissions')} style={btnGhost}>← Back</button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        <div className="rp-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* LEFT */}
          <div style={{ flex: 2.5, minWidth: 0 }}>
            {/* Invoice */}
            <div style={{ ...card, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8}><path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" /><circle cx="12" cy="11" r="2.4" /></svg>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>waseet</span><span style={{ fontSize: 12, color: colors.textFaint }}>وسيط</span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 6 }}>Commission Invoice</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Invoice #{c.dealRef || '—'}</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>Issued: {longDate(c.createdAt)}</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>Closed: {longDate(c.closedAt)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
                {fromToBox('From', 'Waseet', 'support@waseet.io')}
                {fromToBox('To', c.developerName || '—')}
              </div>
              <div style={{ ...capLabel, marginBottom: 12 }}>Deal Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 20 }}>
                {dealDetails.map(([label, value]) => (
                  <div key={label}><div style={{ fontSize: 10, color: colors.textFaint, marginBottom: 1 }}>{label}</div><div style={{ fontSize: 13, color: colors.textMuted }}>{value}</div></div>
                ))}
              </div>
              <div style={{ ...capLabel, marginBottom: 12 }}>Commission Breakdown</div>
              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '8px 14px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Description</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Amount</span>
                </div>
                {breakdown.map(([desc, amt, bold, muted]) => (
                  <div key={desc} style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.surfaceMuted}`, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: muted ? 12 : 13, color: muted ? colors.textFaint : colors.textMuted }}>{desc}</span>
                    <span style={{ fontSize: muted ? 12 : 13, fontWeight: bold ? 600 : 400, color: muted ? colors.textFaint : colors.textMuted }}>{amt}</span>
                  </div>
                ))}
                <div style={{ background: colors.bg, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Total Due to Waseet</span>
                  <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{money(c.gross)}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 8 }}>Realtor ({c.realtorName || '—'}) will receive {money(c.net)} after payment is verified.</div>
            </div>

            {/* Failure notice */}
            {isFailed && (
              <div style={{ ...card, background: '#FFF5F5', border: '1px solid #FECACA' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.9} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#991B1B', marginBottom: 3 }}>Commission failed</div>
                    <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>{c.failureReason || 'No reason provided.'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Proof (no proof data available from admin API) */}
            <div style={{ ...card, marginBottom: 0 }}>
              <div style={{ ...capLabel, marginBottom: 14 }}>Payment Proof</div>
              <div>
                <div style={{ border: `2px dashed ${colors.borderStrong}`, borderRadius: 10, padding: 24, textAlign: 'center' }}>
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={1.6} style={{ margin: '0 auto 8px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                  <div style={{ fontSize: 13, color: colors.textFaint, marginBottom: 4 }}>No payment proof on file</div>
                  <div style={{ fontSize: 12, color: colors.textFaint }}>Uploaded proofs appear here once available</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 250, position: 'sticky', top: 0 }}>
            {/* Commission status */}
            <div style={card}>
              <div style={rLabel}>Commission Status</div>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ display: 'inline-block', width: '100%', boxSizing: 'border-box', background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 700 }}>{meta.label}</div>
              </div>
              {flow.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.circleBg, border: t.circleBorder }}>
                      {t.isDone && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M5 12l4 4L19 7" /></svg>}
                      {t.isCurrent && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    {t.hasLine && <div style={{ width: 1.5, height: 26, background: t.lineColor, margin: '2px 0' }} />}
                  </div>
                  <div style={{ paddingBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: t.weight, color: t.color }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{t.date}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: colors.textFaint }}>Developer pays</span><span style={{ fontSize: 13, color: colors.textMuted }}>{money(c.gross)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: colors.textFaint }}>Platform earned</span><span style={{ fontSize: 13, color: colors.textMuted }}>{money(c.platformFee)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: colors.textFaint }}>To disburse</span><span style={{ fontSize: 13, fontWeight: 600 }}>{money(c.net)}</span></div>
              </div>
              {c.status === 'PROCESSING' && (
                <button onClick={doDisburse} disabled={working} style={{ width: '100%', height: 38, marginTop: 12, background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: working ? 'default' : 'pointer', opacity: working ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><path d="M20 6L9 17l-5-5" /></svg>
                  {working ? 'Disbursing…' : `Mark disbursed · ${money(c.net)}`}
                </button>
              )}
              {c.status === 'PAID' && (
                <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: colors.greenDark, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 8, padding: '8px' }}>Disbursed to realtor ✓</div>
              )}
            </div>

            {/* Realtor bank */}
            <div style={{ ...card, marginBottom: 0 }}>
              <div style={rLabel}>Realtor Bank Details</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: colors.textMuted }}>{initials(c.realtorName)}</div>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{c.realtorName || '—'}</div><div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{c.realtorEmail || '—'}</div></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {realtorBank.map(([label, value]) => (
                  <div key={label}><div style={boxField}>{label}</div><div style={{ fontSize: 13, color: colors.textMuted }}>{value}</div></div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 8 }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                <span style={{ fontSize: 11, color: colors.textFaint, fontStyle: 'italic' }}>Full IBAN visible only during disbursement</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 70, background: colors.ink, color: '#fff', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}
    </>
  )
}
