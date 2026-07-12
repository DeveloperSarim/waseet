import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { realtorApi } from '../../lib/api'
import { joinedLabel } from '../../lib/adminFormat'

const money = (n) => (n == null ? '—' : `SAR ${Number(n).toLocaleString()}`)

const badgeStyle = (kind) => {
  const map = {
    Pending: { background: '#FEF9EC', border: '1px solid #F3E2B8', color: '#92400E' },
    Processing: { background: '#EEF3FF', border: '1px solid #BFDBFE', color: '#1B4FD8' },
    Paid: { background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' },
    Failed: { background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, color: '#991B1B' },
  }
  return { borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, ...map[kind] }
}

const trackLabels = ['Deal closed', 'Dev pays', 'Verified', 'You receive']
const makeTrack = (filled) =>
  trackLabels.map((label, i) => ({
    label,
    fill: i < filled ? colors.green : colors.borderStrong,
    hasLine: i < 3,
    lineColor: i < filled - 1 ? colors.green : colors.borderStrong,
  }))

// status enum → card presentation (labels + existing colors + timeline fill)
const STATUS_META = {
  PENDING: { group: 'Pending', statusText: 'Pending Payment', filled: 1, netColor: colors.ink, msg: 'Waiting for developer payment', msgColor: colors.textFaint },
  PROCESSING: { group: 'Processing', statusText: 'Processing', filled: 3, netColor: colors.ink, msg: 'Payment processing', msgColor: colors.textSoft },
  PAID: { group: 'Paid', statusText: 'Paid ✓', filled: 4, netColor: colors.green, msg: 'Commission paid', msgColor: colors.green },
  FAILED: { group: 'Failed', statusText: 'Payment Failed', filled: 3, netColor: colors.red, msg: 'Payment failed', msgColor: colors.red },
}

// tab label → status enum for client-side filtering
const TAB_STATUS = { Pending: 'PENDING', Processing: 'PROCESSING', Paid: 'PAID' }

const flow = [
  'Deal closes', 'Developer pays (7 days)', 'Waseet verifies (1–2 days)', 'You receive (3–5 days)',
]

const emptyMap = {
  Pending: { title: 'No pending commissions', sub: 'All your commissions have been processed.', subColor: colors.green },
  Processing: { title: 'Nothing processing', sub: 'Commissions being paid out will show here.', subColor: colors.textSoft },
  Paid: { title: 'No paid commissions yet', sub: 'Commission payments will appear here after deals close.', subColor: colors.textSoft },
  All: { title: 'No commissions yet', sub: 'Submit leads and close deals to start earning commissions.', subColor: colors.textSoft },
}

export default function RealtorCommissions() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [tipOpen, setTipOpen] = useState(false)
  const [commissions, setCommissions] = useState([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [counts, setCounts] = useState({ all: 0, pending: 0, processing: 0, paid: 0, failed: 0 })
  const [failedPayment, setFailedPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [wallet, setWallet] = useState(null)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawMethod, setWithdrawMethod] = useState('bank')
  const [withdrawing, setWithdrawing] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const [data, w] = await Promise.all([realtorApi.listCommissions(), realtorApi.getWallet()])
      setCommissions(data.commissions || [])
      setTotalEarned(data.totalEarned || 0)
      setCounts(data.counts || { all: 0, pending: 0, processing: 0, paid: 0, failed: 0 })
      setFailedPayment(data.failedPayment || null)
      setWallet(w)
    } catch (e) {
      setLoadError(e.message || 'Could not load commissions')
    } finally {
      setLoading(false)
    }
  }, [])

  const submitWithdrawal = async () => {
    if (withdrawing || !wallet || wallet.available <= 0) return
    setWithdrawing(true)
    try {
      const w = await realtorApi.requestWithdrawal({ method: withdrawMethod })
      setWithdrawOpen(false)
      setToast(`Withdrawal of ${money(w.amount)} requested (${w.reference})`)
      setTimeout(() => setToast(''), 4000)
      await load()
    } catch (e) {
      setToast(e.message || 'Withdrawal failed')
      setTimeout(() => setToast(''), 4000)
    } finally {
      setWithdrawing(false)
    }
  }

  useEffect(() => { load() }, [load])

  const tabDefs = [['All', counts.all], ['Pending', counts.pending], ['Processing', counts.processing], ['Paid', counts.paid]]

  const visible = tab === 'All' ? commissions : commissions.filter((c) => c.status === TAB_STATUS[tab])
  const em = emptyMap[tab]

  return (
    <>
      <Topbar
        left={<span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>My Commissions</span>}
        right={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 10, color: colors.textFaint }}>Total earned</span>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{money(totalEarned)}</span>
          </div>
        }
      />

      {/* Tabs */}
      <div className="pd-tabs" style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex', overflowX: 'auto' }}>
        {tabDefs.map(([label, count]) => {
          const on = tab === label
          return (
            <div key={label} onClick={() => setTab(label)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>
              {label}
              <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: on ? colors.ink : colors.surfaceMuted, color: on ? '#fff' : colors.textSoft }}>{count}</span>
            </div>
          )
        })}
      </div>

      {/* Timeline banner */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textSoft} strokeWidth={1.8} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        <span style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>Commission timeline:</span>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          {flow.map((f, i) => (
            <span key={f} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: colors.textSoft }}>{f}</span>
              {i < flow.length - 1 && <span style={{ fontSize: 10, color: colors.borderStrong, margin: '0 6px' }}>→</span>}
            </span>
          ))}
        </div>
        <div style={{ position: 'relative', marginLeft: 'auto' }} onMouseEnter={() => setTipOpen(true)} onMouseLeave={() => setTipOpen(false)}>
          <span style={{ width: 28, height: 28, border: `1px solid ${colors.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: colors.textFaint, cursor: 'pointer' }}>?</span>
          {tipOpen && (
            <div style={{ position: 'absolute', right: 0, top: 34, zIndex: 30, background: colors.ink, borderRadius: 10, padding: '12px 14px', width: 260, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.6 }}>Total expected time: 7–14 days after the deal is marked closed.</div>
              <div style={{ fontSize: 12, color: '#60A5FA', marginTop: 8, cursor: 'pointer' }}>Questions? Contact support →</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '16px 22px' }}>
        {/* Wallet — available (developer-paid) / pending / paid out + withdraw */}
        {wallet && (
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8}><path d="M3 7h18v12H3zM3 10h18M16 15h2" /></svg>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>Wallet</span>
              </div>
              <button
                onClick={() => { setWithdrawMethod('bank'); setWithdrawOpen(true) }}
                disabled={wallet.available <= 0}
                style={{ height: 34, padding: '0 16px', background: wallet.available > 0 ? colors.green : colors.surfaceMuted, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: wallet.available > 0 ? '#fff' : colors.textFaint, fontFamily: 'inherit', cursor: wallet.available > 0 ? 'pointer' : 'default' }}
              >
                Withdraw {wallet.available > 0 ? money(wallet.available) : ''}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: colors.greenDark, fontWeight: 600, marginBottom: 4 }}>Available to withdraw</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.greenDark }}>{money(wallet.available)}</div>
                <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 2 }}>Paid by developer · ready</div>
              </div>
              <div style={{ background: '#FEFCF5', border: '1px solid #F3E2B8', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, marginBottom: 4 }}>Pending from developers</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#92400E' }}>{money(wallet.pending)}</div>
                <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 2 }}>Awaiting developer payment</div>
              </div>
              <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, marginBottom: 4 }}>Total paid out</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.ink }}>{money(wallet.paidOut)}</div>
                <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 2 }}>Settled to your account</div>
              </div>
            </div>
            {wallet.inProgress > 0 && (
              <div style={{ fontSize: 11, color: colors.textSoft, marginTop: 10 }}>{money(wallet.inProgress)} in withdrawal — being processed.</div>
            )}
            {wallet.withdrawals && wallet.withdrawals.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Withdrawal history</div>
                {wallet.withdrawals.slice(0, 4).map((w) => {
                  const ws = { REQUESTED: { l: 'Requested', c: '#92400E', bg: '#FEF9EC', b: '#F3E2B8' }, PROCESSING: { l: 'Processing', c: '#1B4FD8', bg: '#EEF3FF', b: '#BFDBFE' }, PAID: { l: 'Paid', c: '#15803D', bg: '#F0FDF4', b: '#BBF7D0' }, REJECTED: { l: 'Rejected', c: '#991B1B', bg: colors.redTint, b: colors.redTintBorder } }[w.status] || {}
                  return (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{money(w.amount)}</span>
                        <span style={{ fontSize: 11, color: colors.textFaint }}>{w.reference} · {joinedLabel(w.createdAt)}</span>
                      </div>
                      <span style={{ borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600, background: ws.bg, color: ws.c, border: `1px solid ${ws.b}` }}>{ws.l}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Failed alert — only when there is a failed payment */}
        {failedPayment && (
          <div style={{ background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderLeft: `3px solid ${colors.red}`, borderRadius: 8, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>Commission payment could not be processed</div>
              <div style={{ fontSize: 12, color: colors.red, lineHeight: 1.6, marginBottom: 8 }}>{failedPayment.failureReason || `We tried to transfer ${money(failedPayment.net)} to your bank but failed. Our team will contact you within 24 hours.`}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span onClick={() => navigate('/realtor/settings')} style={{ fontSize: 11, color: colors.red, border: `1px solid ${colors.redTintBorder}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>Update Bank Details</span>
                <span style={{ fontSize: 11, color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>Contact Support</span>
              </div>
            </div>
          </div>
        )}

        {loadError && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderLeft: '3px solid #DC2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.9} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{loadError}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((c) => {
            const meta = STATUS_META[c.status] || STATUS_META.PENDING
            const track = makeTrack(meta.filled)
            const msg = c.status === 'FAILED' ? (c.failureReason || meta.msg) : meta.msg
            return (
              <div key={c.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>Deal #{c.dealRef}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{c.projectName}{c.unit ? ` · ${c.unit}` : ''}</div>
                      <div style={{ fontSize: 12, color: colors.textSoft }}>Developer: {c.developerName || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                      <span style={badgeStyle(meta.group)}>{meta.statusText}</span>
                      <span style={{ fontSize: 11, color: colors.textFaint }}>Closed: {joinedLabel(c.closedAt)}</span>
                    </div>
                  </div>
                  <div style={{ height: 1, background: colors.surfaceMuted, margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div><div style={{ fontSize: 10, color: colors.textFaint, marginBottom: 2 }}>Gross</div><div style={{ fontSize: 13, fontWeight: 600 }}>{money(c.gross)}</div></div>
                      <div><div style={{ fontSize: 10, color: colors.textFaint, marginBottom: 2 }}>Platform ({c.platformPct}%)</div><div style={{ fontSize: 13, fontWeight: 600, color: colors.textFaint }}>− {money(c.gross - c.net)}</div></div>
                      <div><div style={{ fontSize: 10, color: colors.textFaint, marginBottom: 2 }}>You receive</div><div style={{ fontSize: 15, fontWeight: 700 }}>{money(c.net)}</div></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: meta.netColor }}>{money(c.net)}</div>
                    </div>
                  </div>
                </div>
                <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {track.map((d, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 56 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill }} />
                            <span style={{ fontSize: 9, color: colors.textFaint, whiteSpace: 'nowrap' }}>{d.label}</span>
                          </div>
                          {d.hasLine && <span style={{ width: 20, height: 2, background: d.lineColor, marginBottom: 12 }} />}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: meta.msgColor, marginTop: 5 }}>{msg}</div>
                  </div>
                  <span onClick={() => navigate(`/realtor/commissions/${c.id}`)} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>View Details →</span>
                </div>
              </div>
            )
          })}

          {loading && (
            <div style={{ textAlign: 'center', padding: '56px 20px', fontSize: 13, color: colors.textFaint }}>Loading commissions…</div>
          )}

          {!loading && visible.length === 0 && (
            <div style={{ textAlign: 'center', padding: '56px 20px' }}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={1.6} style={{ marginBottom: 12 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1.1 1.5-2.5 1.5-2.5.5-2.5 1.5 1.1 1.5 2.5 1.5 2.5-.5 2.5-1.5" /></svg>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{em.title}</div>
              <div style={{ fontSize: 13, color: em.subColor, marginTop: 6, lineHeight: 1.6 }}>{em.sub}</div>
            </div>
          )}
        </div>

        {!loading && visible.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 12, color: colors.textSoft }}>Showing {visible.length} of {tab === 'All' ? counts.all : visible.length} commissions</span>
          </div>
        )}
      </div>

      {/* Withdraw modal */}
      {withdrawOpen && wallet && (
        <div onClick={() => !withdrawing && setWithdrawOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Withdraw funds</span>
              <span onClick={() => !withdrawing && setWithdrawOpen(false)} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: colors.greenDark, fontWeight: 600 }}>Available to withdraw</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: colors.greenDark }}>{money(wallet.available)}</div>
              <div style={{ fontSize: 11, color: colors.textSoft, marginTop: 2 }}>Only developer-paid commissions are withdrawable.</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 6 }}>Payout method</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['bank', 'Bank transfer'], ['wallet', 'Wallet']].map(([v, l]) => (
                <span key={v} onClick={() => setWithdrawMethod(v)} style={{ flex: 1, textAlign: 'center', padding: '9px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: withdrawMethod === v ? `1.5px solid ${colors.green}` : `1px solid ${colors.border}`, background: withdrawMethod === v ? colors.greenTint : '#fff', color: withdrawMethod === v ? colors.greenDark : colors.textMuted, fontWeight: withdrawMethod === v ? 600 : 400 }}>{l}</span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 14 }}>Funds are sent to your saved bank details. Processing takes 3–5 business days.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setWithdrawOpen(false)} disabled={withdrawing} style={{ height: 36, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitWithdrawal} disabled={withdrawing || wallet.available <= 0} style={{ height: 36, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: withdrawing ? 'default' : 'pointer', opacity: withdrawing ? 0.6 : 1 }}>{withdrawing ? 'Requesting…' : `Withdraw ${money(wallet.available)}`}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 70, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{toast}</span>
        </div>
      )}
    </>
  )
}
