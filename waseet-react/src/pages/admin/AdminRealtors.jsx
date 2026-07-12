import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { adminApi } from '../../lib/api'
import { STATUS_CAT, countryFlag, initials, joinedLabel, timeAgo, statusCounts } from '../../lib/adminFormat'

// map a backend User → the row shape this table renders.
const toRow = (u) => ({
  id: u.id,
  initials: initials(u.fullName),
  name: u.fullName,
  email: u.email,
  agency: u.agency || u.city || '—',
  license: u.licenseNumber || '—',
  expiry: '',
  expiryState: 'ok',
  country: countryFlag(u.country),
  badgeEmoji: u.badge?.emoji || '',
  badge: u.badge?.name || '—',
  leads: u.leads != null ? String(u.leads) : '—',
  deals: u.deals != null ? String(u.deals) : '—',
  joined: joinedLabel(u.createdAt),
  joinedAgo: timeAgo(u.createdAt),
  cat: STATUS_CAT[u.status] || 'Pending',
})

const tabDefs = ['All', 'Pending', 'Active', 'Suspended', 'Rejected']

const ST = {
  Pending: { label: 'Pending Review', bg: '#FEF9EC', color: '#92400E', border: '#F3E2B8' },
  Active: { label: 'Active', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  Suspended: { label: 'Suspended', bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' },
  Rejected: { label: 'Rejected', bg: '#FFF5F5', color: '#991B1B', border: '#FECACA' },
}

const chevron = <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>

function CheckBox({ checked, onClick }) {
  return (
    <span onClick={onClick} style={{ width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, background: checked ? colors.green : '#fff', border: checked ? `1px solid ${colors.green}` : `1.5px solid ${colors.borderStrong}` }}>
      {checked && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg>}
    </span>
  )
}

const headCell = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }

export default function AdminRealtors() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState('All')
  const [selected, setSelected] = useState({})
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState(false)
  const [toastText, setToastText] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const users = await adminApi.listUsers({ role: 'REALTOR' })
      setData(users.map(toRow))
    } catch (e) {
      setLoadError(e.message || 'Could not load realtors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const counts = statusCounts(data)

  const setTabFn = (t) => { setTab(t); setSelected({}) }
  const visible = tab === 'All' ? data : data.filter((r) => r.cat === tab)
  const visibleIds = visible.map((r) => r.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected[id])

  const toggleRow = (id) => setSelected((s) => { const sel = { ...s }; if (sel[id]) delete sel[id]; else sel[id] = true; return sel })
  const toggleAll = () => {
    if (allSelected) setSelected({})
    else { const sel = {}; visibleIds.forEach((id) => { sel[id] = true }); setSelected(sel) }
  }
  const clearSel = () => setSelected({})
  const openBulkApprove = () => { setBulkApproveOpen(true); setBulkMode('approve') }
  const openBulkReject = () => { setBulkRejectOpen(true); setBulkMode('reject'); setRejectReason('') }
  const closeModals = () => { if (!working) { setBulkApproveOpen(false); setBulkRejectOpen(false) } }
  const stop = (e) => e.stopPropagation()
  const doBulk = async () => {
    const ids = Object.keys(selected)
    if (ids.length === 0 || working) return
    setWorking(true)
    try {
      if (bulkMode === 'approve') {
        await Promise.all(ids.map((id) => adminApi.approveUser(id)))
      } else {
        await Promise.all(ids.map((id) => adminApi.rejectUser(id, rejectReason.trim() || undefined)))
      }
      const n = ids.length
      const txt = bulkMode === 'approve' ? (n + ' realtor(s) approved — credentials emailed') : (n + ' realtor(s) rejected — notified by email')
      setBulkApproveOpen(false); setBulkRejectOpen(false); setSelected({}); setToast(true); setToastText(txt)
      setTimeout(() => setToast(false), 4000)
      await load()
    } catch (e) {
      setToast(true); setToastText(e.message || 'Action failed')
      setTimeout(() => setToast(false), 4000)
    } finally {
      setWorking(false)
    }
  }

  const selectedKeys = Object.keys(selected)
  const selectedCount = selectedKeys.length
  const selectedRows = data.filter((r) => selected[r.id])

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Realtors</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{data.length} total</span>
          </div>
        }
        actions={
          <button style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.8}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>Export CSV
          </button>
        }
      />

      {/* TABS */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex' }}>
        {tabDefs.map((id) => {
          const on = tab === id
          const amber = id === 'Pending'
          let badgeStyle
          if (on) badgeStyle = { background: colors.ink, color: '#fff' }
          else if (amber) badgeStyle = { background: '#FEF9EC', border: '1px solid #F3E2B8', color: '#92400E' }
          else badgeStyle = { background: colors.surfaceMuted, color: colors.textSoft }
          return (
            <div key={id} onClick={() => setTabFn(id)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>
              {id}
              <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, ...badgeStyle }}>{counts[id]}</span>
            </div>
          )
        })}
      </div>

      {/* FILTER BAR */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center' }}>
        {selectedCount === 0 ? (
          <>
            <div style={{ flex: 1, maxWidth: 280, position: 'relative' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
              <input placeholder="Search by name or email..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
            </div>
            <span style={{ height: 34, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#fff' }}>All badges {chevron}</span>
            <span style={{ height: 34, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#fff' }}>Country {chevron}</span>
            <span style={{ height: 34, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#fff' }}>Date joined {chevron}</span>
          </>
        ) : (
          <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 7, padding: '6px 12px', display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: colors.greenDark }}>{selectedCount} selected</span>
            <button onClick={openBulkApprove} style={{ height: 28, padding: '0 10px', background: colors.green, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Approve selected</button>
            <button onClick={openBulkReject} style={{ height: 28, padding: '0 10px', background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 6, fontSize: 11, color: colors.red, fontFamily: 'inherit', cursor: 'pointer' }}>Reject selected</button>
            <span onClick={clearSel} style={{ fontSize: 11, color: colors.textFaint, marginLeft: 'auto', cursor: 'pointer' }}>Clear</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
        {loadError && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderLeft: '3px solid #DC2626', borderRadius: 8, padding: '10px 14px', margin: '16px 22px 0', display: 'flex', gap: 10, alignItems: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.9} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{loadError}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}

        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', margin: '16px 22px' }}>
          {/* HEADER */}
          <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckBox checked={allSelected} onClick={toggleAll} />
            <span style={{ flex: 2, ...headCell }}>Realtor</span>
            <span style={{ flex: 1.2, ...headCell }}>License</span>
            <span style={{ flex: 0.8, ...headCell }}>Country</span>
            <span style={{ flex: 0.8, ...headCell }}>Badge</span>
            <span style={{ flex: 0.6, ...headCell }}>Leads</span>
            <span style={{ flex: 0.6, ...headCell }}>Deals</span>
            <span style={{ flex: 0.8, ...headCell }}>Joined</span>
            <span style={{ flex: 1, ...headCell }}>Status</span>
            <span style={{ flex: 0.8, textAlign: 'right', ...headCell }}>Actions</span>
          </div>
          {/* ROWS */}
          {visible.map((r) => {
            const pending = r.cat === 'Pending'
            const expired = r.expiryState === 'expired'
            const isSel = !!selected[r.id]
            const bg = isSel ? '#F0FDF4' : (expired ? '#FFF5F5' : (pending ? '#FFFEF5' : '#fff'))
            const expiryColor = r.expiryState === 'expired' ? '#DC2626' : (r.expiryState === 'soon' ? '#D97706' : '#9CA3AF')
            const st = ST[r.cat]
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '12px 16px', minHeight: 58, cursor: 'pointer', background: bg }}>
                <CheckBox checked={isSel} onClick={() => toggleRow(r.id)} />
                <div style={{ flex: 2, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: colors.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{r.initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>{r.agency}</div>
                  </div>
                </div>
                <div style={{ flex: 1.2 }}>
                  <div style={{ fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {r.license}
                    {expired && <span style={{ background: '#FFF5F5', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 4, padding: '0 5px', fontSize: 9, fontWeight: 600 }}>Expired</span>}
                  </div>
                  <div style={{ fontSize: 10, color: expiryColor }}>{r.expiry}</div>
                </div>
                <div style={{ flex: 0.8, fontSize: 12, color: colors.textMuted }}>{r.country}</div>
                <div style={{ flex: 0.8, display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 14 }}>{r.badgeEmoji}</span>
                  <span style={{ fontSize: 11, color: colors.textMuted }}>{r.badge}</span>
                </div>
                <div style={{ flex: 0.6, fontSize: 13, fontWeight: 600 }}>{r.leads}</div>
                <div style={{ flex: 0.6, fontSize: 13, color: r.deals === '0' ? '#9CA3AF' : '#16A34A' }}>{r.deals}</div>
                <div style={{ flex: 0.8 }}>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{r.joined}</div>
                  <div style={{ fontSize: 10, color: colors.textFaint }}>{r.joinedAgo}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                </div>
                <div style={{ flex: 0.8, display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span onClick={() => navigate('/admin/realtors/' + r.id)} style={{ fontSize: 11, color: colors.greenDark, cursor: 'pointer' }}>{r.cat === 'Pending' ? 'Review →' : 'View →'}</span>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill={colors.textFaint}><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
                  </span>
                </div>
              </div>
            )
          })}
          {loading && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading realtors…</div>
          )}
          {!loading && visible.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>No realtors {tab !== 'All' ? `in "${tab}"` : 'yet'}</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>New registrations will appear here for review.</div>
            </div>
          )}
        </div>

        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.textSoft }}>Showing {visible.length} of {data.length} realtors</span>
        </div>
      </div>

      {/* BULK APPROVE MODAL */}
      {bulkApproveOpen && (
        <div onClick={closeModals} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stop} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 440, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Approve {selectedCount} realtors?</span>
              <span onClick={closeModals} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 14 }}>The following realtors will receive login credentials by email:</div>
            <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '12px 14px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedRows.map((r) => (
                <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: colors.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{r.initials}</div>
                  <div style={{ flex: 1 }}><span style={{ fontSize: 13, color: colors.textMuted }}>{r.name}</span></div>
                  <span style={{ fontSize: 11, color: colors.textFaint }}>{r.email}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeModals} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={doBulk} disabled={working} style={{ height: 34, padding: '0 14px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: working ? 'default' : 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Approving…' : `Approve All ${selectedCount}`}</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK REJECT MODAL */}
      {bulkRejectOpen && (
        <div onClick={closeModals} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stop} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 440, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Reject {selectedCount} realtors?</span>
              <span onClick={closeModals} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Rejection reason (sent to all):</div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. License could not be verified. Please resubmit." style={{ width: '100%', height: 90, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={closeModals} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={doBulk} disabled={working} style={{ height: 34, padding: '0 14px', background: colors.red, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: working ? 'default' : 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Rejecting…' : `Reject All ${selectedCount}`}</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{toastText}</span>
        </div>
      )}
    </>
  )
}
