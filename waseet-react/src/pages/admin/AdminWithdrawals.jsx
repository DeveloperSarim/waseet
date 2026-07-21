import React, { useState, useEffect, useCallback } from 'react'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { FilterMenu } from '../../components/admin/FilterMenu'
import { adminApi } from '../../lib/api'
import { initials, joinedLabel } from '../../lib/adminFormat'

const money = (n) => `SAR ${Number(n || 0).toLocaleString('en-US')}`
const headCell = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }

const STATUS = {
  REQUESTED: { label: 'Requested', bg: '#FEF9EC', color: '#92400E', border: '#F3E2B8' },
  PROCESSING: { label: 'Processing', bg: '#EEF3FF', color: '#1B4FD8', border: '#BFDBFE' },
  PAID: { label: 'Paid ✓', bg: colors.greenTint, color: colors.greenDark, border: colors.greenTintBorder },
  REJECTED: { label: 'Rejected', bg: colors.redTint, color: colors.red, border: colors.redTintBorder },
}
const tabDefs = ['All', 'REQUESTED', 'PAID', 'REJECTED']
const TAB_LABEL = { All: 'All', REQUESTED: 'Requested', PAID: 'Paid', REJECTED: 'Rejected' }

export default function AdminWithdrawals() {
  const [data, setData] = useState({ withdrawals: [], counts: {}, pendingTotal: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('All')
  const [working, setWorking] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await adminApi.listWithdrawals()) }
    catch (e) { setError(e.message || 'Could not load withdrawals') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }
  const markPaid = async (w) => {
    if (working) return
    if (!window.confirm(`Confirm you have paid ${money(w.amount)} to ${w.realtorName} (${w.realtorIban || 'IBAN on file'})?`)) return
    setWorking(w.id)
    try { await adminApi.markWithdrawalPaid(w.id); flash(`${w.reference} marked paid`); await load() }
    catch (e) { flash(e.message || 'Failed') } finally { setWorking('') }
  }
  const reject = async (w) => {
    if (working) return
    const reason = window.prompt('Reason for rejecting this withdrawal (the realtor will see this):')
    if (reason === null) return
    setWorking(w.id)
    try { await adminApi.rejectWithdrawal(w.id, reason || undefined); flash(`${w.reference} rejected`); await load() }
    catch (e) { flash(e.message || 'Failed') } finally { setWorking('') }
  }

  const rows = tab === 'All' ? data.withdrawals : data.withdrawals.filter((w) => w.status === tab)
  const counts = data.counts || {}

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Withdrawals</span>
            <span className="wa-hide-sm" style={{ fontSize: 13, color: colors.textFaint }}>{data.withdrawals.length} total</span>
          </div>
        }
        actions={<span style={{ fontSize: 12, color: colors.textFaint }}>Pending payout: <b style={{ color: colors.ink }}>{money(data.pendingTotal)}</b></span>}
      />

      {/* Tabs */}
      <div className="pd-tabs" style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex', overflowX: 'auto' }}>
        {tabDefs.map((id) => {
          const on = tab === id
          const n = id === 'All' ? counts.all : id === 'REQUESTED' ? counts.requested : id === 'PAID' ? counts.paid : data.withdrawals.filter((w) => w.status === id).length
          return (
            <div key={id} onClick={() => setTab(id)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>
              {TAB_LABEL[id]}<span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: on ? colors.ink : colors.surfaceMuted, color: on ? '#fff' : colors.textSoft }}>{n ?? 0}</span>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '16px 22px' }}>
        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{error}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}
        <div className="wa-scroll-x">
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', minWidth: 820 }}>
          <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ flex: 1.4, ...headCell }}>Realtor</span>
            <span style={{ flex: 1, ...headCell }}>Reference</span>
            <span style={{ flex: 1.6, ...headCell }}>Bank</span>
            <span style={{ flex: 0.9, ...headCell }}>Amount</span>
            <span style={{ flex: 0.8, ...headCell }}>Requested</span>
            <span style={{ flex: 0.8, ...headCell }}>Status</span>
            <span style={{ width: 170, ...headCell, textAlign: 'right' }}>Action</span>
          </div>
          {loading && <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading withdrawals…</div>}
          {!loading && rows.length === 0 && <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>No withdrawal requests{tab !== 'All' ? ' in this state' : ' yet'}.</div>}
          {rows.map((w) => {
            const st = STATUS[w.status] || STATUS.REQUESTED
            return (
              <div key={w.id} style={{ borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '12px 16px', display: 'flex', alignItems: 'center', minHeight: 58 }}>
                <div style={{ flex: 1.4, display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: colors.textMuted, flexShrink: 0 }}>{initials(w.realtorName)}</div>
                  <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.realtorName || '—'}</div><div style={{ fontSize: 11, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.realtorEmail || ''}</div></div>
                </div>
                <div style={{ flex: 1, fontSize: 12, color: colors.textMuted }}>{w.reference || '—'}</div>
                <div style={{ flex: 1.6, minWidth: 0 }}><div style={{ fontSize: 12, color: colors.textMuted }}>{w.realtorBank || '—'}</div><div style={{ fontSize: 11, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.realtorIban || '—'}</div></div>
                <div style={{ flex: 0.9, fontSize: 14, fontWeight: 700 }}>{money(w.amount)}</div>
                <div style={{ flex: 0.8, fontSize: 12, color: colors.textFaint }}>{joinedLabel(w.createdAt)}</div>
                <div style={{ flex: 0.8 }}><span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{st.label}</span></div>
                <div style={{ width: 170, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  {(w.status === 'REQUESTED' || w.status === 'PROCESSING') ? (
                    <>
                      <span onClick={() => !working && markPaid(w)} style={{ fontSize: 11, color: '#fff', background: colors.green, borderRadius: 6, padding: '5px 10px', cursor: working ? 'default' : 'pointer', fontWeight: 600 }}>Mark paid</span>
                      <span onClick={() => !working && reject(w)} style={{ fontSize: 11, color: colors.red, border: `1px solid ${colors.redTintBorder}`, background: '#fff', borderRadius: 6, padding: '5px 10px', cursor: working ? 'default' : 'pointer', fontWeight: 600 }}>Reject</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: colors.textFaint }}>{w.paidAt ? joinedLabel(w.paidAt) : '—'}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>
      </div>
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 70, background: colors.ink, color: '#fff', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}
    </>
  )
}
