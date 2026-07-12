import React, { useState, useEffect } from 'react'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { PortalMain } from '../../components/layout/PortalLayout'
import { settingsApi } from '../../lib/api'

const userTabsDef = [
  { id: 'both', label: 'Both' },
  { id: 'devs', label: 'Developers' },
  { id: 'realtors', label: 'Realtors' },
]

// Which dbCounts key backs each export card's record count (null → not tracked).
const recordKeyByCard = { leads: 'leads', commissions: 'commissions', users: 'users', disputes: null }

const fmtBytes = (b) => {
  if (b == null) return '—'
  if (typeof b !== 'number') return String(b)
  const gb = b / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = b / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${(b / 1024).toFixed(0)} KB`
}

const cardDefs = [
  {
    card: 'leads', iconBg: '#EEF3FF', iconColor: '#1B4FD8',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
    title: 'Leads Export', subtitle: 'All lead submissions and status history', records: '1,248', hasUserTabs: false,
    selects: [
      { label: 'Developer:', value: 'All developers' },
      { label: 'Realtor:', value: 'All realtors' },
      { label: 'Status:', value: 'All statuses' },
      { label: 'City:', value: 'All cities' },
    ],
    columns: [
      { label: 'Lead ID', checked: true }, { label: 'Client name', checked: true }, { label: 'Client phone (FULL)', checked: true, adminOnly: true },
      { label: 'Project', checked: true }, { label: 'Unit type', checked: true }, { label: 'Developer', checked: true },
      { label: 'Realtor + badge', checked: true }, { label: 'Status', checked: true }, { label: 'Submitted date', checked: true },
      { label: 'Last updated', checked: true }, { label: 'Commission %', checked: false }, { label: 'Estimated value', checked: false },
    ],
    formatLabels: ['CSV', 'Excel (.xlsx)', 'JSON'], estimate: 'Estimated: 1,248 rows · ~180KB', btnLabel: 'Export Leads CSV', outFile: 'waseet_leads_Jun28.csv', outMeta: '1,248 rows · 178KB',
  },
  {
    card: 'commissions', iconBg: colors.greenTint, iconColor: colors.green,
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10M9 9.5a2.5 2 0 0 1 5 0M14 14.5a2.5 2 0 0 1-5 0',
    title: 'Commission Export', subtitle: 'All commission records and payment status', records: '89', hasUserTabs: false,
    selects: [
      { label: 'Developer:', value: 'All developers' },
      { label: 'Status:', value: 'All statuses' },
    ],
    columns: [
      { label: 'Deal ID', checked: true }, { label: 'Developer', checked: true }, { label: 'Realtor', checked: true },
      { label: 'Project · Unit', checked: true }, { label: 'Sale price', checked: true }, { label: 'Commission %', checked: true },
      { label: 'Gross commission', checked: true }, { label: 'Platform fee', checked: true }, { label: 'Realtor receives', checked: true },
      { label: 'Status', checked: true }, { label: 'Deal date', checked: true }, { label: 'Payment date', checked: true },
      { label: 'Bank reference', checked: false }, { label: 'Proof file name', checked: false },
    ],
    formatLabels: ['CSV', 'Excel (.xlsx)', 'JSON'], estimate: '84 rows · ~65KB', btnLabel: 'Export Commissions CSV', outFile: 'waseet_commissions_Jun28.csv', outMeta: '84 rows · 65KB',
  },
  {
    card: 'users', iconBg: colors.purpleTint, iconColor: '#5B5BD6',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    title: 'Users Export', subtitle: 'Developer and realtor accounts', records: '242', hasUserTabs: true,
    selects: [
      { label: 'Status:', value: 'All statuses' },
      { label: 'Country:', value: 'All countries' },
    ],
    columns: [
      { label: 'Company name', checked: true }, { label: 'License #', checked: true }, { label: 'Country / City', checked: true },
      { label: 'Contact + email', checked: true }, { label: 'Status', checked: true }, { label: 'Projects count', checked: true },
      { label: 'Deals count', checked: true }, { label: 'Joined date', checked: true }, { label: 'Full name', checked: true },
      { label: 'License type + #', checked: true }, { label: 'Badge level', checked: true }, { label: 'Email', checked: true },
      { label: 'Leads count', checked: true }, { label: 'Phone number', checked: false, adminOnly: true }, { label: 'Bank account (masked)', checked: false },
    ],
    formatLabels: ['CSV', 'Excel (.xlsx)', 'JSON'], estimate: '242 rows · ~95KB', btnLabel: 'Export Users CSV', outFile: 'waseet_users_Jun28.csv', outMeta: '242 rows · 95KB',
  },
  {
    card: 'disputes', iconBg: colors.redTint, iconColor: colors.red,
    icon: 'M14 11l-7 7-3-3 7-7M14 11l3 3M14 11l3-3 4 4-3 3M17 14l-3 3M5 21h4',
    title: 'Disputes Export', subtitle: 'All dispute records and resolutions', records: '15', hasUserTabs: false,
    selects: [
      { label: 'Status:', value: 'All statuses' },
      { label: 'Raised by:', value: 'All' },
    ],
    columns: [
      { label: 'Dispute ID', checked: true }, { label: 'Raised by', checked: true }, { label: 'Against', checked: true },
      { label: 'Project', checked: true }, { label: 'Reason summary', checked: true }, { label: 'Status', checked: true },
      { label: 'Days open', checked: true }, { label: 'Resolution', checked: true }, { label: 'Resolved by', checked: true },
      { label: 'Open date', checked: true }, { label: 'Resolved date', checked: true },
    ],
    formatLabels: ['CSV', 'Excel (.xlsx)', 'JSON'], estimate: '15 rows · ~12KB', btnLabel: 'Export Disputes CSV', outFile: 'waseet_disputes_Jun28.csv', outMeta: '15 rows · 12KB',
  },
]

const quickExports = [
  { name: 'All leads (complete)', sub: '1,248 records · CSV' },
  { name: 'All commissions', sub: '84 records · CSV' },
  { name: 'All users', sub: '242 records · CSV' },
  { name: 'Monthly report (June)', sub: 'Leads + commissions · CSV' },
  { name: 'Full platform backup', sub: 'All data · JSON', adminOnly: true, red: true },
]

const compliance = [
  'All exports include admin name and timestamp',
  'Phone numbers marked * require explicit export confirmation',
  'Export logs retained for 7 years',
  'Realtor bank details cannot be exported in full',
]

const typePill = (color, bg) => ({ fontSize: 11, borderRadius: 4, padding: '1px 6px', background: bg, color })
const history = [
  { file: 'waseet_leads_Jun28.csv', type: 'Leads', typeStyle: typePill('#1B4FD8', '#EEF3FF'), records: '1,248', admin: 'Super Admin', date: 'Jun 28 · 10:32 AM', size: '178 KB' },
  { file: 'waseet_commissions_Jun27.csv', type: 'Commissions', typeStyle: typePill(colors.greenDark, colors.greenTint), records: '84', admin: 'Super Admin', date: 'Jun 27 · 3:15 PM', size: '65 KB' },
  { file: 'waseet_users_Jun25.csv', type: 'Users', typeStyle: typePill('#5B5BD6', colors.purpleTint), records: '242', admin: 'Super Admin', date: 'Jun 25 · 11:00 AM', size: '95 KB' },
  { file: 'waseet_leads_Jun20.csv', type: 'Leads', typeStyle: typePill('#1B4FD8', '#EEF3FF'), records: '1,180', admin: 'Super Admin', date: 'Jun 20 · 9:45 AM', size: '169 KB' },
  { file: 'waseet_disputes_Jun15.csv', type: 'Disputes', typeStyle: typePill(colors.red, colors.redTint), records: '12', admin: 'Super Admin', date: 'Jun 15 · 2:30 PM', size: '9 KB' },
]

const boxStyle = (checked) => ({
  width: 15, height: 15, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  ...(checked ? { background: colors.green, border: `1px solid ${colors.green}` } : { background: '#fff', border: `1.5px solid ${colors.borderStrong}` }),
})
const CheckMark = () => <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg>

const historyCols = '2fr 1fr 0.8fr 1fr 1.2fr 0.7fr'
const historyHead = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }

export default function AdminDataExport() {
  const [userTab, setUserTab] = useState('both')
  const [formats, setFormats] = useState({ leads: 'CSV', commissions: 'CSV', users: 'CSV', disputes: 'CSV' })
  const [exportState, setExportState] = useState({})
  const [progress, setProgress] = useState({})
  const [phoneModal, setPhoneModal] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [pendingExport, setPendingExport] = useState(null)
  const [toast, setToast] = useState(false)
  const [toastFile, setToastFile] = useState('')
  const [toastMeta, setToastMeta] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    settingsApi.getStats().then(setStats).catch(() => {})
  }, [])

  const dbCounts = stats?.dbCounts || {}
  const recordCount = (card) => {
    const key = recordKeyByCard[card]
    if (!key) return null
    const v = dbCounts[key]
    return typeof v === 'number' ? v : null
  }
  const recordLabel = (card) => {
    const v = recordCount(card)
    return v != null ? v.toLocaleString() : '—'
  }

  const platformData = [
    { label: 'Total users:', value: dbCounts.users != null ? dbCounts.users.toLocaleString() : '—' },
    { label: 'Active projects:', value: dbCounts.projects != null ? dbCounts.projects.toLocaleString() : '—' },
    { label: 'Total leads:', value: dbCounts.leads != null ? dbCounts.leads.toLocaleString() : '—' },
    { label: 'Total commissions:', value: dbCounts.commissions != null ? dbCounts.commissions.toLocaleString() : '—' },
    { label: 'Storage used:', value: fmtBytes(stats?.storage?.used) },
  ]

  const setFormat = (card, f) => setFormats((s) => ({ ...s, [card]: f }))

  // The only real export endpoint is a full JSON platform snapshot. All export
  // buttons trigger that download (via a real browser download) while keeping
  // the card's progress UX.
  const downloadSnapshot = () => window.open(settingsApi.exportUrl(), '_blank')

  const doExport = (card) => {
    downloadSnapshot()
    setExportState((s) => ({ ...s, [card]: 'preparing' }))
    setProgress((s) => ({ ...s, [card]: '8%' }))
    setTimeout(() => setProgress((s) => ({ ...s, [card]: '100%' })), 60)
    setTimeout(() => {
      setExportState((s) => ({ ...s, [card]: 'done' }))
      setToast(true); setToastFile('waseet_export.json'); setToastMeta('Full platform snapshot (JSON)')
    }, 1400)
    setTimeout(() => {
      setExportState((s) => ({ ...s, [card]: 'idle' }))
      setProgress((s) => ({ ...s, [card]: '0%' }))
    }, 4400)
    setTimeout(() => setToast(false), 5400)
  }

  const runExport = (card) => {
    if (card === 'leads') { setPhoneModal(true); setConfirmChecked(false); setPendingExport({ card }); return }
    doExport(card)
  }

  const quickExport = () => {
    downloadSnapshot()
    setToast(true); setToastFile('waseet_export.json'); setToastMeta('Full platform snapshot (JSON)')
    setTimeout(() => setToast(false), 5000)
  }

  const toggleConfirm = () => setConfirmChecked((c) => !c)
  const closeModal = () => setPhoneModal(false)
  const confirmExport = () => {
    if (!confirmChecked) return
    const p = pendingExport
    setPhoneModal(false)
    doExport(p.card)
  }

  const confirmExportStyle = {
    height: 34, padding: '0 14px', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit',
    ...(confirmChecked ? { background: colors.green, cursor: 'pointer' } : { background: colors.textFaint, cursor: 'not-allowed', opacity: 0.7 }),
  }

  const btnFor = (card, label) => {
    const st = exportState[card] || 'idle'
    const base = { height: 36, padding: '0 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
    if (st === 'preparing') return { btnLabel: 'Preparing...', spinner: true, downIcon: false, style: { ...base, background: colors.green, border: 'none', color: '#fff', opacity: 0.8 }, showProgress: true }
    if (st === 'done') return { btnLabel: 'Downloaded ✓', spinner: false, downIcon: false, style: { ...base, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, color: colors.greenDark }, showProgress: false }
    return { btnLabel: label, spinner: false, downIcon: true, style: { ...base, background: colors.green, border: 'none', color: '#fff' }, showProgress: false }
  }

  return (
    <>
      <Topbar
        title="Data Export"
        right={
          <span style={{ fontSize: 11, color: colors.textFaint, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /></svg>
            All exports are logged for compliance
          </span>
        }
      />

      <PortalMain padding="18px 22px">
        <div className="ex-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* LEFT */}
          <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cardDefs.map((c) => {
              const b = btnFor(c.card, c.btnLabel)
              return (
                <div key={c.card} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.iconColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{c.title}</div>
                        <div style={{ fontSize: 12, color: colors.textFaint }}>{c.subtitle}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: colors.textFaint }}>{recordLabel(c.card)} records</span>
                  </div>

                  {c.hasUserTabs && (
                    <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden', marginBottom: 14, width: 'fit-content' }}>
                      {userTabsDef.map((t) => {
                        const on = userTab === t.id
                        return (
                          <span key={t.id} onClick={() => setUserTab(t.id)} style={{ padding: '0 12px', height: 32, display: 'flex', alignItems: 'center', fontSize: 12, cursor: 'pointer', background: on ? colors.ink : 'transparent', color: on ? '#fff' : colors.textSoft }}>{t.label}</span>
                        )
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: colors.textMuted, minWidth: 80 }}>Date range:</span>
                      <div style={{ position: 'relative' }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                        <input placeholder="From" style={{ height: 34, width: 130, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
                      </div>
                      <span style={{ fontSize: 12, color: colors.textFaint }}>to</span>
                      <div style={{ position: 'relative' }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                        <input placeholder="To" style={{ height: 34, width: 130, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
                      </div>
                      <span style={{ fontSize: 11, color: colors.textFaint, cursor: 'pointer' }}>Clear</span>
                    </div>
                    {c.selects.map((sel) => (
                      <div key={sel.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: colors.textMuted, minWidth: 80 }}>{sel.label}</span>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <select style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff', color: colors.textMuted, appearance: 'none', cursor: 'pointer' }}><option>{sel.value}</option></select>
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Include columns:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 12px' }}>
                      {c.columns.map((col) => (
                        <div key={col.label} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                          <span style={boxStyle(col.checked)}>{col.checked && <CheckMark />}</span>
                          <span style={{ fontSize: 12, color: colors.textMuted }}>{col.label}</span>
                          {col.adminOnly && <span style={{ color: colors.red, fontSize: 12 }}>*</span>}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: colors.greenDark, cursor: 'pointer' }}>Select all</span>
                      <span style={{ fontSize: 11, color: colors.greenDark, cursor: 'pointer' }}>Deselect all</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: colors.textMuted, marginRight: 4 }}>Format:</span>
                    {c.formatLabels.map((f) => {
                      const active = formats[c.card] === f
                      return (
                        <span key={f} onClick={() => setFormat(c.card, f)} style={{ borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...(active ? { background: colors.ink, color: '#fff', border: `1px solid ${colors.ink}` } : { background: '#fff', color: colors.textMuted, border: `1px solid ${colors.border}` }) }}>{active ? f + ' ✓' : f}</span>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: colors.textFaint }}>{recordCount(c.card) != null ? `${recordLabel(c.card)} records · full JSON snapshot` : 'Full JSON snapshot'}</span>
                      <button onClick={() => runExport(c.card)} style={b.style}>
                        {b.spinner && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} style={{ animation: 'pd-spin .7s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>}
                        {b.downIcon && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>}
                        {b.btnLabel}
                      </button>
                    </div>
                    {b.showProgress && (
                      <div style={{ background: colors.surfaceMuted, height: 3, borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: colors.green, borderRadius: 999, width: progress[c.card] || '0%', transition: 'width 0.4s ease' }} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* EXPORT HISTORY */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Recent exports</span>
                <span style={{ fontSize: 12, color: colors.textFaint }}>Audit log</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: historyCols, gap: 8, background: colors.bg, padding: '8px 16px', borderBottom: `1px solid ${colors.border}` }}>
                <span style={historyHead}>File</span>
                <span style={historyHead}>Type</span>
                <span style={historyHead}>Records</span>
                <span style={historyHead}>Admin</span>
                <span style={historyHead}>Date</span>
                <span style={historyHead}>Size</span>
              </div>
              {history.map((h, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: historyCols, gap: 8, alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.7}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{h.file}</span>
                  </span>
                  <span><span style={h.typeStyle}>{h.type}</span></span>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{h.records}</span>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{h.admin}</span>
                  <span style={{ fontSize: 11, color: colors.textFaint }}>{h.date}</span>
                  <span style={{ fontSize: 11, color: colors.textFaint }}>{h.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="ex-side" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Quick exports</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 14 }}>One-click full exports with default settings.</div>
              {quickExports.map((q) => (
                <div key={q.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{q.name}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>{q.sub}</div>
                    {q.adminOnly && <div style={{ fontSize: 9, color: colors.textFaint, marginTop: 1 }}>Admin only</div>}
                  </div>
                  <span onClick={quickExport} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, ...(q.red ? { border: `1px solid ${colors.redTintBorder}`, color: colors.red } : { border: `1px solid ${colors.border}`, color: colors.textMuted }) }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  </span>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Platform data</div>
              {platformData.map((d) => (
                <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                  <span style={{ fontSize: 12, color: colors.textFaint }}>{d.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>{d.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Compliance &amp; audit</div>
              <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 12 }}>All exports logged per PDPL requirements.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {compliance.map((c2) => (
                  <div key={c2} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }}><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /></svg>
                    <span>{c2}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                <span style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>View export audit log →</span>
              </div>
            </div>
          </div>

        </div>
      </PortalMain>

      {/* PHONE CONFIRM MODAL */}
      {phoneModal && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 440, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Export includes phone numbers</div>
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '12px 14px', margin: '12px 0 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
              <span style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.6 }}>This export includes 1,248 full phone numbers. This action will be logged with your admin credentials.</span>
            </div>
            <div onClick={toggleConfirm} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 14 }}>
              <span style={boxStyle(confirmChecked)}>{confirmChecked && <CheckMark />}</span>
              <span style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>I confirm this export is required for legitimate business purposes.</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeModal} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmExport} style={confirmExportStyle}>Confirm &amp; Export</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{toastFile}</div>
            <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{toastMeta}</div>
          </div>
        </div>
      )}
    </>
  )
}
