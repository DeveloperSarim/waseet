import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { adminApi } from '../../lib/api'
import { STATUS_CAT, countryName, initials, joinedLabel, timeAgo, statusCounts } from '../../lib/adminFormat'

// map a backend User → developer row. The admin users endpoint now returns the
// company logo (avatar), the contact-person name, the city and the live project
// count per developer, so the table shows real data instead of placeholders.
const toRow = (u) => ({
  id: u.id,
  initials: initials(u.companyName || u.fullName),
  avatar: u.avatar || null,
  company: u.companyName || u.fullName,
  contactName: u.contactName || u.city || u.email || '—',
  email: u.email,
  city: u.city || '',
  country: countryName(u.country),
  applied: joinedLabel(u.createdAt),
  appliedAgo: timeAgo(u.createdAt),
  projectCount: u.projectCount != null ? String(u.projectCount) : '0',
  status: u.status,
  cat: STATUS_CAT[u.status] || 'Pending',
})

const sBadge = (bg, color, border) => ({ borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 600, background: bg, color, border: `1px solid ${border}` })
const ST = {
  Pending: { label: 'Pending Review', style: sBadge('#FEF9EC', '#92400E', '#F3E2B8') },
  Active: { label: 'Active', style: sBadge(colors.greenTint, colors.greenDark, colors.greenTintBorder) },
  Suspended: { label: 'Suspended', style: sBadge(colors.surfaceMuted, colors.textMuted, colors.border) },
  Rejected: { label: 'Rejected', style: sBadge('#FFF5F5', '#991B1B', colors.redTintBorder) },
}

const tabDefs = ['All', 'Pending', 'Active', 'Suspended', 'Rejected']

function CheckBox({ on, onClick }) {
  return (
    <span onClick={onClick} style={{ width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, background: on ? colors.green : '#fff', border: on ? `1px solid ${colors.green}` : `1.5px solid ${colors.borderStrong}` }}>
      {on && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg>}
    </span>
  )
}

const headCell = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }

export default function AdminDevelopers() {
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
      const users = await adminApi.listUsers({ role: 'DEVELOPER' })
      setData(users.map(toRow))
    } catch (e) {
      setLoadError(e.message || 'Could not load developers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const counts = statusCounts(data)

  const visible = tab === 'All' ? data : data.filter((r) => r.cat === tab)
  const visibleIds = visible.map((r) => r.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected[id])
  const selectedKeys = Object.keys(selected)
  const selectedCount = selectedKeys.length
  const selectedRows = data.filter((r) => selected[r.id])

  const setTabAndClear = (t) => { setTab(t); setSelected({}) }
  const toggleRow = (id) => setSelected((s) => { const n = { ...s }; if (n[id]) delete n[id]; else n[id] = true; return n })
  const toggleAll = () => {
    if (allSelected) setSelected({})
    else { const n = {}; visibleIds.forEach((id) => { n[id] = true }); setSelected(n) }
  }
  const closeModals = () => { if (!working) { setBulkApproveOpen(false); setBulkRejectOpen(false) } }
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
      const txt = bulkMode === 'approve' ? `${n} developer(s) approved — credentials emailed` : `${n} developer(s) rejected — notified by email`
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

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Developers</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{data.length} total</span>
          </div>
        }
        actions={
          <button style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.8}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>Export CSV
          </button>
        }
      />

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex' }}>
        {tabDefs.map((id) => {
          const on = tab === id
          const amber = id === 'Pending'
          let badgeStyle
          if (on) badgeStyle = { borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: colors.ink, color: '#fff' }
          else if (amber) badgeStyle = { borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: '#FEF9EC', border: '1px solid #F3E2B8', color: '#92400E' }
          else badgeStyle = { borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: colors.surfaceMuted, color: colors.textSoft }
          return (
            <div key={id} onClick={() => setTabAndClear(id)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>
              {id}<span style={badgeStyle}>{counts[id]}</span>
            </div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center' }}>
        {selectedCount === 0 ? (
          <>
            <div style={{ flex: 1, maxWidth: 300, position: 'relative' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
              <input placeholder="Search by company name or email..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
            </div>
            {['Country', 'Date applied'].map((f) => (
              <span key={f} style={{ height: 34, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#fff' }}>
                {f} <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
              </span>
            ))}
          </>
        ) : (
          <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 7, padding: '6px 12px', display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: colors.greenDark }}>{selectedCount} selected</span>
            <button onClick={() => { setBulkMode('approve'); setBulkApproveOpen(true) }} style={{ height: 28, padding: '0 10px', background: colors.green, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Approve selected</button>
            <button onClick={() => { setBulkMode('reject'); setRejectReason(''); setBulkRejectOpen(true) }} style={{ height: 28, padding: '0 10px', background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 6, fontSize: 11, color: colors.red, fontFamily: 'inherit', cursor: 'pointer' }}>Reject selected</button>
            <span onClick={() => setSelected({})} style={{ fontSize: 11, color: colors.textFaint, marginLeft: 'auto', cursor: 'pointer' }}>Clear</span>
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
          {/* Header */}
          <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckBox on={allSelected} onClick={toggleAll} />
            <span style={{ flex: 2, ...headCell }}>Company</span>
            <span style={{ flex: 1.5, ...headCell }}>Contact</span>
            <span style={{ flex: 1, ...headCell }}>Country</span>
            <span style={{ flex: 1, ...headCell }}>Applied</span>
            <span style={{ flex: 0.8, textAlign: 'right', ...headCell }}>Projects</span>
            <span style={{ flex: 1, ...headCell }}>Status</span>
            <span style={{ flex: 0.8, textAlign: 'right', ...headCell }}>Actions</span>
          </div>
          {/* Rows */}
          {visible.map((r) => {
            const pending = r.cat === 'Pending'
            const isSel = !!selected[r.id]
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '12px 16px', minHeight: 60, cursor: 'pointer', background: isSel ? colors.greenTint : (pending ? '#FFFEF5' : '#fff') }}>
                <CheckBox on={isSel} onClick={() => toggleRow(r.id)} />
                <div style={{ flex: 2, minWidth: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
                  {r.avatar ? (
                    <img src={r.avatar} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: `1px solid ${colors.border}`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: colors.surfaceMuted, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: colors.textMuted, flexShrink: 0 }}>{r.initials}</div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.company}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.contactName}</div>
                  </div>
                </div>
                <div style={{ flex: 1.5, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.email}</div>
                  {r.city && <div style={{ fontSize: 11, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.city}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.country}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{r.applied}</div>
                  <div style={{ fontSize: 10, color: colors.textFaint }}>{r.appliedAgo}</div>
                </div>
                <div style={{ flex: 0.8, textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: r.projectCount === '0' ? colors.textFaint : colors.textMuted }}>{r.projectCount}</div>
                </div>
                <div style={{ flex: 1 }}><span style={ST[r.cat].style}>{ST[r.cat].label}</span></div>
                <div style={{ flex: 0.8, display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span onClick={() => navigate('/admin/developers/' + r.id)} style={{ fontSize: 11, color: colors.greenDark, cursor: 'pointer' }}>{r.cat === 'Pending' ? 'Review →' : 'View →'}</span>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill={colors.textFaint}><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
                  </span>
                </div>
              </div>
            )
          })}
          {loading && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading developers…</div>
          )}
          {!loading && visible.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>No developers {tab !== 'All' ? `in "${tab}"` : 'yet'}</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>New registrations will appear here for review.</div>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.textSoft }}>Showing {visible.length} of {data.length} developers</span>
        </div>
      </div>

      {/* Bulk approve modal */}
      {bulkApproveOpen && (
        <div onClick={closeModals} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 440, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Approve {selectedCount} developers?</span>
              <span onClick={closeModals} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 14 }}>The following developers will receive login credentials by email:</div>
            <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '12px 14px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedRows.map((r) => (
                <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fff', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: colors.textMuted }}>{r.initials}</div>
                  <div style={{ flex: 1 }}><span style={{ fontSize: 13, color: colors.textMuted }}>{r.company}</span></div>
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

      {/* Bulk reject modal */}
      {bulkRejectOpen && (
        <div onClick={closeModals} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 440, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Reject {selectedCount} developers?</span>
              <span onClick={closeModals} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Rejection reason (sent to all):</div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Documents are unclear. Please resubmit with higher quality scans." style={{ width: '100%', height: 90, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={closeModals} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={doBulk} disabled={working} style={{ height: 34, padding: '0 14px', background: colors.red, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: working ? 'default' : 'pointer', opacity: working ? 0.6 : 1 }}>{working ? 'Rejecting…' : `Reject All ${selectedCount}`}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{toastText}</span>
        </div>
      )}
    </>
  )
}
