import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { developerApi } from '../../lib/api'
import { joinedLabel, initials } from '../../lib/adminFormat'

const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 8px)'
const money = (n) => (n == null ? '—' : `SAR ${Number(n).toLocaleString()}`)

// status enum → pill presentation
const badgeStyle = (status) => {
  const map = {
    PENDING: { background: '#FEF9EC', border: '1px solid #F3E2B8', color: '#92400E', label: 'Pending' },
    PROCESSING: { background: '#EEF3FF', border: '1px solid #BFDBFE', color: '#1B4FD8', label: 'Processing' },
    PAID: { background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', label: 'Paid' },
    FAILED: { background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, color: '#991B1B', label: 'Failed' },
  }
  const m = map[status] || map.PENDING
  return { style: { borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, background: m.background, border: m.border, color: m.color }, label: m.label }
}

const TAB_STATUS = { Pending: 'PENDING', Processing: 'PROCESSING', Paid: 'PAID' }

const th = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }

export default function CommissionHistory() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [commissions, setCommissions] = useState([])
  const [totalOwed, setTotalOwed] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [counts, setCounts] = useState({ all: 0, pending: 0, processing: 0, paid: 0, failed: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [payTarget, setPayTarget] = useState(null)
  const [paying, setPaying] = useState(false)
  const [issueTarget, setIssueTarget] = useState(null)
  const [issueReason, setIssueReason] = useState('')
  const [savingIssue, setSavingIssue] = useState(false)
  const [toast, setToast] = useState('')

  const [exportState, setExportState] = useState('idle')
  const [exportToast, setExportToast] = useState(false)
  const timers = useRef([])

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const data = await developerApi.listCommissions()
      setCommissions(data.commissions || [])
      setTotalOwed(data.totalOwed || 0)
      setTotalPaid(data.totalPaid || 0)
      setCounts(data.counts || { all: 0, pending: 0, processing: 0, paid: 0, failed: 0 })
    } catch (e) {
      setLoadError(e.message || 'Could not load commissions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const confirmPay = async () => {
    if (!payTarget || paying) return
    setPaying(true)
    try {
      await developerApi.payCommission(payTarget.id)
      setPayTarget(null)
      showToast('Payment sent')
      await load()
    } catch (e) {
      showToast(e.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const submitIssue = async () => {
    if (!issueTarget || savingIssue || !issueReason.trim()) return
    setSavingIssue(true)
    try {
      await developerApi.markCommissionFailed(issueTarget.id, issueReason.trim())
      setIssueTarget(null)
      setIssueReason('')
      showToast('Payment issue reported')
      await load()
    } catch (e) {
      showToast(e.message || 'Could not report issue')
    } finally {
      setSavingIssue(false)
    }
  }

  const doExport = () => {
    if (exportState !== 'idle') return
    setExportState('loading')
    timers.current.push(setTimeout(() => { setExportState('done'); setExportToast(true) }, 1000))
    timers.current.push(setTimeout(() => { setExportState('idle'); setExportToast(false) }, 4500))
  }

  const es = exportState
  const exportLabel = es === 'loading' ? 'Preparing…' : es === 'done' ? 'Downloaded ✓' : 'Export CSV'
  const exportColor = es === 'done' ? colors.greenDark : colors.textMuted
  const exportBg = es === 'done' ? colors.greenTint : '#fff'
  const exportBorder = es === 'done' ? colors.greenTintBorder : colors.border

  const summaryCards = [
    { icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10', label: 'Total Owed', value: money(totalOwed), sub: 'pending to realtors' },
    { icon: 'M8 11l3 3 5-6M20 6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z', label: 'Total Paid', value: money(totalPaid), sub: 'all time to realtors' },
    { icon: 'M3 3v18h18M7 16l4-6 4 3 5-7', label: 'Commissions', value: String(counts.all), sub: 'across all deals' },
    { icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2', label: 'Pending', value: String(counts.pending), sub: 'awaiting payment' },
  ]

  const tabDefs = [['All', counts.all], ['Pending', counts.pending], ['Processing', counts.processing], ['Paid', counts.paid]]
  const visible = tab === 'All' ? commissions : commissions.filter((c) => c.status === TAB_STATUS[tab])

  const sum = (fn) => commissions.reduce((a, c) => a + (fn(c) || 0), 0)
  const totalGross = sum((c) => c.gross)
  const totalFee = sum((c) => (c.gross || 0) - (c.net || 0))
  const totalNet = sum((c) => c.net)

  const chip = { height: 34, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#fff' }

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }} onClick={() => navigate('/developer/commissions')}>Commissions</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>
            <span style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>History</span>
          </div>
        }
        actions={
          <button onClick={doExport} className="wa-hide-sm" style={{ height: 34, padding: '0 14px', background: exportBg, border: `1px solid ${exportBorder}`, borderRadius: 7, fontSize: 12, color: exportColor, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={exportColor} strokeWidth={1.8}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>{exportLabel}</button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
        {/* SUMMARY CARDS */}
        <div style={{ padding: '18px 22px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {summaryCards.map((c, i) => (
            <div key={i} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={1.8}><path d={c.icon} /></svg></div>
              <div style={{ fontSize: 10, color: colors.textFaint, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{c.value}</div>
              <div style={{ fontSize: 10, color: colors.textSoft, marginTop: 3 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* STATUS TABS */}
        <div style={{ background: '#fff', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex', marginTop: 16 }}>
          {tabDefs.map(([label, count]) => {
            const on = tab === label
            return (
              <div key={label} onClick={() => setTab(label)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>
                {label}
                <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: on ? colors.ink : colors.surfaceMuted, color: on ? '#fff' : colors.textSoft }}>{count}</span>
              </div>
            )
          })}
        </div>

        {loadError && (
          <div style={{ margin: '16px 22px 0', background: '#FFF5F5', border: '1px solid #FECACA', borderLeft: '3px solid #DC2626', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.9} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{loadError}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}

        {/* TABLE */}
        <div className="wa-scroll-x" style={{ margin: '16px 22px' }}>
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', minWidth: 880 }}>
          <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 0.8, ...th }}>Deal</span>
            <span style={{ flex: 1.8, ...th }}>Project · Unit</span>
            <span style={{ flex: 1.2, ...th }}>Realtor</span>
            <span style={{ flex: 1, textAlign: 'right', ...th }}>Gross</span>
            <span style={{ flex: 1, textAlign: 'right', ...th }}>Platform Fee</span>
            <span style={{ flex: 1, textAlign: 'right', ...th }}>Net</span>
            <span style={{ flex: 0.9, ...th }}>Status</span>
            <span style={{ flex: 0.8, ...th }}>Closed</span>
            <span style={{ flex: 1.1, textAlign: 'center', ...th }}>Action</span>
          </div>

          {loading && (
            <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading commissions…</div>
          )}

          {!loading && visible.map((c) => {
            const b = badgeStyle(c.status)
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '12px 16px', minHeight: 56 }}>
                <div style={{ flex: 0.8 }}><div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{c.dealRef}</div><div style={{ fontSize: 10, color: colors.textFaint, marginTop: 2 }}>{joinedLabel(c.closedAt)}</div></div>
                <div style={{ flex: 1.8, display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width: 36, height: 26, borderRadius: 5, background: colors.surfaceMuted, backgroundImage: hatch, flexShrink: 0 }} /><div><div style={{ fontSize: 13, fontWeight: 500 }}>{c.projectName}</div>{c.unit && <div style={{ fontSize: 10, color: colors.textFaint }}>{c.unit}</div>}</div></div>
                <div style={{ flex: 1.2, display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: colors.surfaceMuted, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: colors.textMuted, flexShrink: 0 }}>{initials(c.realtorName)}</span><div><div style={{ fontSize: 12, color: colors.textMuted }}>{c.realtorName}</div><div style={{ fontSize: 10, color: colors.textFaint }}>Realtor</div></div></div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: 13, color: colors.textMuted }}>{money(c.gross)}</div>
                <div style={{ flex: 1, textAlign: 'right' }}><div style={{ fontSize: 12, color: colors.textFaint }}>− {money((c.gross || 0) - (c.net || 0))}</div><div style={{ fontSize: 10, color: colors.textFaint, marginTop: 1 }}>({c.platformPct}%)</div></div>
                <div style={{ flex: 1, textAlign: 'right' }}><div style={{ fontSize: 13, fontWeight: 700 }}>{money(c.net)}</div><div style={{ fontSize: 10, color: colors.textFaint, marginTop: 1 }}>to realtor</div></div>
                <div style={{ flex: 0.9 }}><span style={b.style}>{b.label}</span></div>
                <div style={{ flex: 0.8, fontSize: 12, color: colors.textMuted }}>{joinedLabel(c.closedAt)}</div>
                <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {c.status === 'PENDING' ? (
                    <>
                      <button onClick={() => setPayTarget(c)} style={{ height: 30, padding: '0 14px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Pay</button>
                      <span onClick={() => { setIssueTarget(c); setIssueReason('') }} style={{ fontSize: 10, color: colors.textFaint, cursor: 'pointer' }}>Report issue</span>
                    </>
                  ) : c.status === 'PROCESSING' ? (
                    <span style={{ fontSize: 11, color: '#1B4FD8' }}>Processing…</span>
                  ) : c.status === 'PAID' ? (
                    <span style={{ fontSize: 11, color: colors.green }}>Paid ✓</span>
                  ) : (
                    <span style={{ fontSize: 11, color: colors.red }}>Failed</span>
                  )}
                </div>
              </div>
            )
          })}

          {!loading && visible.length === 0 && (
            <div style={{ padding: '48px 16px', textAlign: 'center' }}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={1.6} style={{ marginBottom: 10 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1.1 1.5-2.5 1.5-2.5.5-2.5 1.5 1.1 1.5 2.5 1.5 2.5-.5 2.5-1.5" /></svg>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{tab === 'All' ? 'No commissions yet' : `No ${tab.toLowerCase()} commissions`}</div>
              <div style={{ fontSize: 13, color: colors.textSoft, marginTop: 6 }}>Commissions owed to realtors will appear here after deals close.</div>
            </div>
          )}

          {/* TOTALS */}
          {!loading && visible.length > 0 && (
            <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ flex: 0.8, fontSize: 12, color: colors.textFaint }}>{counts.all} deals total</span>
              <span style={{ flex: 1.8 }} />
              <span style={{ flex: 1.2 }} />
              <div style={{ flex: 1, textAlign: 'right' }}><div style={{ fontSize: 13, fontWeight: 700 }}>{money(totalGross)}</div><div style={{ fontSize: 10, color: colors.textFaint }}>Total commission</div></div>
              <div style={{ flex: 1, textAlign: 'right' }}><div style={{ fontSize: 12, color: colors.textFaint }}>{money(totalFee)}</div><div style={{ fontSize: 10, color: colors.textFaint }}>Platform total</div></div>
              <div style={{ flex: 1, textAlign: 'right' }}><div style={{ fontSize: 13, fontWeight: 700 }}>{money(totalNet)}</div><div style={{ fontSize: 10, color: colors.textFaint }}>Net to realtors</div></div>
              <span style={{ flex: 0.9 }} />
              <span style={{ flex: 0.8 }} />
              <span style={{ flex: 1.1 }} />
            </div>
          )}
        </div>
        </div>

        {/* PAGINATION */}
        {!loading && visible.length > 0 && (
          <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: colors.textSoft }}>Showing 1–{visible.length} of {visible.length} commissions</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ height: 30, minWidth: 30, borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: colors.ink, color: '#fff' }}>1</span>
            </div>
          </div>
        )}
      </div>

      {/* PAY CONFIRM MODAL */}
      {payTarget && (
        <div onClick={() => !paying && setPayTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Pay commission</span>
              <span onClick={() => !paying && setPayTarget(null)} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: colors.greenDark, fontWeight: 600 }}>Net to {payTarget.realtorName}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: colors.greenDark }}>{money(payTarget.net)}</div>
              <div style={{ fontSize: 11, color: colors.textSoft, marginTop: 2 }}>{payTarget.projectName}{payTarget.unit ? ` · ${payTarget.unit}` : ''} · {payTarget.dealRef}</div>
            </div>
            <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 14, lineHeight: 1.6 }}>You are paying this commission through the Waseet platform. The realtor will be notified once payment is processing.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setPayTarget(null)} disabled={paying} style={{ height: 36, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmPay} disabled={paying} style={{ height: 36, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: paying ? 'default' : 'pointer', opacity: paying ? 0.6 : 1 }}>{paying ? 'Sending…' : `Pay ${money(payTarget.net)}`}</button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT ISSUE MODAL */}
      {issueTarget && (
        <div onClick={() => !savingIssue && setIssueTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Report payment issue</span>
              <span onClick={() => !savingIssue && setIssueTarget(null)} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 10, lineHeight: 1.6 }}>Flag a problem with this commission ({issueTarget.dealRef} · {money(issueTarget.net)}). This marks the payment as failed for review.</div>
            <textarea value={issueReason} onChange={(e) => setIssueReason(e.target.value)} placeholder="Describe the issue…" rows={4} style={{ width: '100%', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', marginBottom: 14 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setIssueTarget(null)} disabled={savingIssue} style={{ height: 36, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitIssue} disabled={savingIssue || !issueReason.trim()} style={{ height: 36, padding: '0 16px', background: colors.red, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: savingIssue || !issueReason.trim() ? 'default' : 'pointer', opacity: savingIssue || !issueReason.trim() ? 0.6 : 1 }}>{savingIssue ? 'Reporting…' : 'Report issue'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION TOAST */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 70, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{toast}</span>
        </div>
      )}

      {/* EXPORT TOAST */}
      {exportToast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>waseet_commissions.csv downloaded · {counts.all} deals</span>
        </div>
      )}
    </>
  )
}
