import React, { useState, useEffect, useRef } from 'react'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { settingsApi } from '../../lib/api'

const settingsNav = [
  { id: 'commission', label: 'Commission', d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10' },
  { id: 'email', label: 'Email settings', d: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6' },
  { id: 'security', label: 'Security', d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'info', label: 'Platform info', d: 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4' },
  { id: 'danger', label: 'Danger zone', d: 'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01' },
]

const emailFields = [
  { key: 'from', label: 'From email (no-reply)', desc: 'All platform emails sent from this address', placeholder: 'noreply@waseet.io' },
  { key: 'support', label: 'Support email', desc: 'Shown to users for support inquiries', placeholder: 'support@waseet.io' },
  { key: 'admin', label: 'Admin alert email', desc: 'Receives critical alerts and system notifications', placeholder: 'admin@waseet.io' },
  { key: 'backup', label: 'Emergency backup email', desc: 'Secondary contact for critical issues', placeholder: 'backup@waseet.io' },
]

const lockoutOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
]
const sessionOptions = [
  { value: 1, label: '1 hour' },
  { value: 8, label: '8 hours' },
  { value: 24, label: '24 hours' },
]

const mailIcon = 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6'
const chevronDownD = 'M6 9l6 6 6-6'

const money = (n) => `SAR ${Number(n || 0).toLocaleString()}`
const fmtDate = (iso) => {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (isNaN(d)) return 'Never'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
const fmtDateTime = (iso) => {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (isNaN(d)) return 'Never'
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
const fmtBytes = (b) => {
  if (b == null) return '—'
  const gb = b / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = b / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${(b / 1024).toFixed(0)} KB`
}

function LockIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}>
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function Toggle({ on, onClick, disabled }) {
  return (
    <span
      onClick={disabled ? undefined : onClick}
      style={{ position: 'relative', width: 36, height: 20, borderRadius: 999, display: 'inline-block', cursor: disabled ? 'default' : 'pointer', background: on ? colors.green : colors.border, opacity: disabled ? 0.6 : 1, transition: 'background 0.15s' }}
    >
      <span style={{ position: 'absolute', top: 2, ...(on ? { right: 2 } : { left: 2 }), width: 16, height: 16, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </span>
  )
}

function Dropdown({ value, onChange, options, width }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={onChange}
        style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', height: 34, padding: '0 30px 0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', width: width || 'auto' }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} style={{ position: 'absolute', right: 10, pointerEvents: 'none' }}><path d={chevronDownD} /></svg>
    </span>
  )
}

export default function AdminSettings() {
  const [section, setSection] = useState('commission')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  const [dbRegions, setDbRegions] = useState([])
  const [stats, setStats] = useState(null)
  const [developers, setDevelopers] = useState([])
  const [backups, setBackups] = useState([])

  // editable drafts
  const [defaultPct, setDefaultPct] = useState('')
  const [emailDraft, setEmailDraft] = useState({ from: '', support: '', admin: '', backup: '' })
  const [maxFailed, setMaxFailed] = useState('')
  const [addName, setAddName] = useState('')
  const [addPct, setAddPct] = useState('')
  const [testTo, setTestTo] = useState('')

  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const [toast, setToast] = useState(null) // { msg, sub, type }
  const [lastSaved, setLastSaved] = useState(null)
  const [maintModal, setMaintModal] = useState(false)
  const [maintScope, setMaintScope] = useState('maintenance') // 'maintenance' | 'marketplaceMaintenance'
  const [maintForm, setMaintForm] = useState({
    etaMinutes: 30,
    message: "We're performing scheduled maintenance to improve your experience. The platform will be back shortly.",
    items: [
      { label: 'Database performance optimizations', status: 'done' },
      { label: 'New commission tracking features', status: 'active' },
      { label: 'Improved notification system', status: 'pending' },
      { label: 'Final testing and verification', status: 'pending' },
    ],
  })
  const toastTimer = useRef()

  const showToast = (msg, sub, type = 'success') => {
    setToast({ msg, sub, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // ---- data loading ----
  const load = async () => {
    setLoading(true)
    try {
      const data = await settingsApi.get()
      setSettings(data.settings)
      setDbRegions(data.dbRegions || [])
      setDefaultPct(String(data.settings?.commission?.defaultPct ?? ''))
      setEmailDraft({
        from: data.settings?.emails?.from || '',
        support: data.settings?.emails?.support || '',
        admin: data.settings?.emails?.admin || '',
        backup: data.settings?.emails?.backup || '',
      })
      setMaxFailed(String(data.settings?.security?.maxFailedLogins ?? ''))
    } catch (e) {
      showToast('Failed to load settings', e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = async () => {
    try { setStats(await settingsApi.getStats()) } catch { /* ignore */ }
  }
  const refreshBackups = async () => {
    try { setBackups(await settingsApi.listBackups()) } catch { /* ignore */ }
  }

  useEffect(() => {
    load()
    refreshStats()
    refreshBackups()
    settingsApi.listDevelopers().then(setDevelopers).catch(() => {})
    return () => clearTimeout(toastTimer.current)
  }, [])

  // ---- mutation helpers ----
  const patchAndToast = async (fn, msg = 'Settings saved') => {
    try {
      await fn()
      setLastSaved(new Date())
      showToast(msg, 'Changes applied immediately', 'success')
    } catch (e) {
      showToast('Action failed', e.message, 'error')
    }
  }

  const doSave = async (fn, successMsg = 'Settings saved') => {
    if (saveState === 'saving') return
    setSaveState('saving')
    try {
      await fn()
      setSaveState('saved')
      setLastSaved(new Date())
      showToast(successMsg, 'Changes applied immediately', 'success')
      setTimeout(() => setSaveState('idle'), 3000)
    } catch (e) {
      setSaveState('idle')
      showToast('Save failed', e.message, 'error')
    }
  }

  const setSection_ = (name, value) => setSettings((s) => ({ ...s, [name]: value }))

  const saveDefaultPct = () => doSave(async () => {
    const v = await settingsApi.updateSection('commission', { defaultPct: Number(defaultPct) })
    setSection_('commission', v)
  })

  const saveAllEmails = () => doSave(async () => {
    const v = await settingsApi.updateSection('emails', { ...emailDraft })
    setSection_('emails', v)
  })
  const saveEmailField = (key) => patchAndToast(async () => {
    const v = await settingsApi.updateSection('emails', { [key]: emailDraft[key] })
    setSection_('emails', v)
  })

  const sendTest = () => {
    if (!testTo.trim()) { showToast('Enter an address', 'Provide an email to send the test to', 'error'); return }
    patchAndToast(async () => { await settingsApi.testEmail(testTo.trim()) }, 'Test email sent')
  }

  const saveMaxFailed = () => patchAndToast(async () => {
    const v = await settingsApi.updateSection('security', { maxFailedLogins: Number(maxFailed) })
    setSection_('security', v)
  })
  const saveSecurity = (patch) => patchAndToast(async () => {
    const v = await settingsApi.updateSection('security', patch)
    setSection_('security', v)
  })

  const removeOverride = (name) => patchAndToast(async () => {
    const v = await settingsApi.removeOverride(name)
    setSection_('commission', v)
  }, 'Override removed')
  const addOverride = () => {
    if (!addName.trim()) { showToast('Enter a developer', 'Type a developer name to add an override', 'error'); return }
    patchAndToast(async () => {
      const v = await settingsApi.addOverride({ name: addName.trim(), pct: Number(addPct) })
      setSection_('commission', v)
      setAddName(''); setAddPct('')
    }, 'Override added')
  }
  const updateOverridePct = (o, val) => {
    const next = Number(val)
    if (val === '' || next === Number(o.pct)) return
    patchAndToast(async () => {
      const v = await settingsApi.addOverride({ name: o.name, pct: next })
      setSection_('commission', v)
    }, 'Override updated')
  }

  const saveDbRegion = (region) => patchAndToast(async () => {
    const v = await settingsApi.updateSection('platform', { dbRegion: region })
    setSection_('platform', v)
    refreshStats()
  }, 'Database region updated')

  const maint = !!settings?.maintenance?.enabled
  const mpMaint = !!settings?.marketplaceMaintenance?.enabled
  // Opens the modal to switch a scope ON, or turns it straight OFF.
  const toggleMaintScope = (scope) => {
    const isOn = scope === 'marketplaceMaintenance' ? mpMaint : maint
    if (!isOn) {
      const m = settings?.[scope]
      if (m) setMaintForm({
        etaMinutes: m.etaMinutes ?? 30,
        message: m.message ?? maintForm.message,
        items: Array.isArray(m.items) && m.items.length ? m.items : maintForm.items,
      })
      setMaintScope(scope)
      setMaintModal(true)
    } else patchAndToast(async () => {
      const v = await settingsApi.updateSection(scope, { enabled: false })
      setSection_(scope, v)
    }, `${scope === 'marketplaceMaintenance' ? 'Marketplace maintenance' : 'Maintenance mode'} disabled`)
  }
  const toggleMaint = () => toggleMaintScope('maintenance')
  const toggleMpMaint = () => toggleMaintScope('marketplaceMaintenance')
  const confirmMaint = () => {
    setMaintModal(false)
    const scope = maintScope
    patchAndToast(async () => {
      const v = await settingsApi.updateSection(scope, {
        enabled: true,
        etaMinutes: Number(maintForm.etaMinutes) || 30,
        message: maintForm.message,
        items: maintForm.items.filter((i) => i.label.trim()),
      })
      setSection_(scope, v)
    }, `${scope === 'marketplaceMaintenance' ? 'Marketplace maintenance' : 'Maintenance mode'} enabled`)
  }
  const cycleItemStatus = (s) => (s === 'pending' ? 'active' : s === 'active' ? 'done' : 'pending')
  const setItem = (i, patch) => setMaintForm((f) => ({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }))
  const addItem = () => setMaintForm((f) => ({ ...f, items: [...f.items, { label: '', status: 'pending' }] }))
  const removeItem = (i) => setMaintForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }))

  // danger zone
  const resetOverrides = () => {
    if (!window.confirm('Remove ALL per-developer commission overrides? All developers will revert to the global default. This cannot be undone.')) return
    patchAndToast(async () => {
      const v = await settingsApi.resetOverrides()
      setSection_('commission', v)
    }, 'Commission overrides reset')
  }
  const clearAnnouncements = () => {
    if (!window.confirm('Clear all announcement history?')) return
    showToast('No announcement history to clear', 'Nothing was deleted', 'success')
  }
  const exportAll = () => { window.open(settingsApi.exportUrl(), '_blank') }

  // backups
  const createBackup = () => patchAndToast(async () => {
    await settingsApi.createBackup()
    await refreshBackups()
    refreshStats()
  }, 'Backup created')
  const downloadBackup = (id) => { window.open(settingsApi.backupDownloadUrl(id), '_blank') }
  const restoreBackup = (b) => {
    if (!window.confirm(`Restore backup "${b.filename}"?\n\nThis REPLACES all current platform data with the contents of this backup. This cannot be undone.`)) return
    patchAndToast(async () => {
      await settingsApi.restoreBackup(b.id)
      await load()
      refreshStats()
      refreshBackups()
    }, 'Backup restored')
  }
  const deleteBackup = (b) => {
    if (!window.confirm(`Delete backup "${b.filename}"? This cannot be undone.`)) return
    patchAndToast(async () => {
      await settingsApi.deleteBackup(b.id)
      await refreshBackups()
    }, 'Backup deleted')
  }

  const saveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save'
  const saveBtnStyle = {
    height: 32, padding: '0 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
    ...(saveState === 'saved'
      ? { background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, color: colors.greenDark }
      : { background: colors.green, border: 'none', color: '#fff' }),
  }

  // commission example (base SAR 27,000)
  const pctNum = Number(defaultPct) || 0
  const exBase = 27000
  const exPlatform = Math.round((exBase * pctNum) / 100)
  const exRealtor = exBase - exPlatform

  const overrides = settings?.commission?.overrides || []
  const emails = settings?.emails || {}
  const security = settings?.security || {}

  return (
    <>
      <style>{`@keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } } @media (max-width: 900px) { .set-cols { flex-direction: column !important; } .set-nav { position: static !important; width: 100% !important; } }`}</style>
      <Topbar
        title="Platform Settings"
        right={<span className="wa-hide-sm" style={{ fontSize: 11, color: colors.textFaint }}>Last saved: {lastSaved ? fmtDateTime(lastSaved.toISOString()) : 'June 28 · 9:32 AM'}</span>}
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        <div className="set-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* SETTINGS NAV */}
          <div className="set-nav" style={{ width: 200, flexShrink: 0, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '10px 8px', position: 'sticky', top: 0 }}>
            {settingsNav.map((n) => {
              const on = section === n.id
              return (
                <div key={n.id} onClick={() => setSection(n.id)} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 1, fontSize: 12, ...(on ? { background: colors.greenTint, color: colors.greenDark } : { color: colors.textMuted }) }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={on ? colors.green : colors.textFaint} strokeWidth={1.7}><path d={n.d} /></svg>
                  <span>{n.label}</span>
                </div>
              )
            })}
          </div>

          {/* CONTENT */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {loading || !settings ? (
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading settings…</div>
            ) : (
            <>

            {/* COMMISSION */}
            {section === 'commission' && (
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Commission settings</span>
                  <button onClick={saveDefaultPct} style={saveBtnStyle}>{saveLabel}</button>
                </div>
                <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 18 }}>Platform commission rates and overrides.</div>
                <div style={{ paddingBottom: 16, borderBottom: `1px solid ${colors.surfaceMuted}`, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Global default commission</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 12 }}>Applied to all new developers unless overridden individually.</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: colors.textMuted }}>Platform takes:</span>
                    <input value={defaultPct} onChange={(e) => setDefaultPct(e.target.value)} style={{ width: 80, height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 8px', fontSize: 14, fontWeight: 600, textAlign: 'right', fontFamily: 'inherit' }} />
                    <span style={{ fontSize: 12, color: colors.textMuted }}>% of developer commission</span>
                    <button onClick={saveDefaultPct} style={{ marginLeft: 'auto', height: 30, padding: '0 10px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Save default</button>
                  </div>
                  <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>Example: If developer commission = {money(exBase)}</div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>Platform earns: <span style={{ color: colors.textMuted }}>{money(exPlatform)}</span></span>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>Realtor receives: <span style={{ fontWeight: 600 }}>{money(exRealtor)}</span></span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Per-developer overrides</div>
                <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 12 }}>These override the global default for specific developers.</div>
                <div className="wa-scroll-x">
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden', minWidth: 520 }}>
                  <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ flex: 2, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Developer</span>
                    <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Override %</span>
                    <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Applied since</span>
                    <span style={{ width: 70, textAlign: 'right', fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Remove</span>
                  </div>
                  {overrides.length === 0 && (
                    <div style={{ padding: '14px', fontSize: 12, color: colors.textFaint, textAlign: 'center' }}>No overrides yet.</div>
                  )}
                  {overrides.map((o) => (
                    <div key={o.name} style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.surfaceMuted}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ flex: 2, fontSize: 13, color: colors.textMuted }}>{o.name}</span>
                      <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          defaultValue={o.pct}
                          onBlur={(e) => updateOverridePct(o, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                          style={{ width: 60, height: 30, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '0 8px', fontSize: 13, textAlign: 'right', fontFamily: 'inherit' }}
                        />
                        <span style={{ fontSize: 12, color: colors.textMuted }}>%</span>
                      </span>
                      <span style={{ flex: 1, fontSize: 11, color: colors.textFaint }}>{fmtDate(o.since)}</span>
                      <span onClick={() => removeOverride(o.name)} style={{ width: 70, textAlign: 'right', fontSize: 11, color: colors.red, cursor: 'pointer' }}>Remove ×</span>
                    </div>
                  ))}
                  <div style={{ padding: '10px 14px', borderTop: `1px solid ${colors.surfaceMuted}`, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input list="dev-suggestions" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Search developer..." style={{ flex: 1, height: 30, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '0 10px', fontSize: 11, fontFamily: 'inherit' }} />
                    <datalist id="dev-suggestions">
                      {developers.map((d) => <option key={d.id} value={d.name} />)}
                    </datalist>
                    <input value={addPct} onChange={(e) => setAddPct(e.target.value)} placeholder="%" style={{ width: 60, height: 30, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '0 8px', fontSize: 13, textAlign: 'right', fontFamily: 'inherit' }} />
                    <span onClick={addOverride} style={{ height: 28, padding: '0 10px', background: colors.green, borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>+ Add</span>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* EMAIL */}
            {section === 'email' && (
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Email settings</span>
                  <button onClick={saveAllEmails} style={saveBtnStyle}>{saveLabel}</button>
                </div>
                <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 18 }}>Platform email addresses for notifications and support.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {emailFields.map((f) => (
                    <div key={f.key}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint, margin: '2px 0 6px' }}>{f.desc}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><path d={mailIcon} /></svg>
                          <input value={emailDraft[f.key] || ''} onChange={(e) => setEmailDraft((d) => ({ ...d, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 13, fontFamily: 'inherit' }} />
                        </div>
                        <span onClick={() => saveEmailField(f.key)} style={{ height: 34, padding: '0 10px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fff' }}>Save</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}`, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>Test platform emails:</span>
                  <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="your@email.com" style={{ flex: 1, height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }} />
                  <span onClick={sendTest} style={{ height: 30, padding: '0 10px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fff' }}>Send test email</span>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {section === 'security' && (
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Security settings</div>
                <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 18 }}>Platform-wide security configuration.</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Max failed login attempts</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>Lock account after X failed attempts</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input value={maxFailed} onChange={(e) => setMaxFailed(e.target.value)} style={{ width: 70, height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, textAlign: 'center', fontSize: 13, fontFamily: 'inherit' }} />
                    <span onClick={saveMaxFailed} style={{ height: 28, padding: '0 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 11, color: colors.textMuted, display: 'flex', alignItems: 'center', cursor: 'pointer', marginLeft: 8, background: '#fff' }}>Save</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Account lockout duration</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>How long accounts stay locked</div>
                  </div>
                  <Dropdown value={security.lockoutMinutes ?? 30} options={lockoutOptions} onChange={(e) => saveSecurity({ lockoutMinutes: Number(e.target.value) })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Session timeout</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>Auto-logout inactive users after</div>
                  </div>
                  <Dropdown value={security.sessionTimeoutHours ?? 24} options={sessionOptions} onChange={(e) => saveSecurity({ sessionTimeoutHours: Number(e.target.value) })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Require 2FA for admin</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>All admin accounts must use 2FA</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Toggle on={!!security.require2fa} onClick={() => saveSecurity({ require2fa: !security.require2fa })} />
                    <LockIcon />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Phone reveal logging</div>
                    <div style={{ fontSize: 11, color: colors.textFaint }}>Log all phone number reveal actions</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Toggle on={!!security.phoneRevealLogging} onClick={() => saveSecurity({ phoneRevealLogging: !security.phoneRevealLogging })} />
                    <LockIcon />
                  </div>
                </div>
              </div>
            )}

            {/* PLATFORM INFO */}
            {section === 'info' && (
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Platform information</div>
                <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 18 }}>Read-only platform details.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Platform name</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{stats?.platformName || settings.platform?.name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Environment</div>
                    <div style={{ fontSize: 13, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>{stats?.environment || settings.platform?.environment || '—'} <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.green, animation: 'pulse-dot 1.6s infinite' }} /><span style={{ fontSize: 10, color: colors.green }}>Live</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Version</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{stats?.version || settings.platform?.version || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Database region</div>
                    <Dropdown value={settings.platform?.dbRegion || ''} options={dbRegions.map((r) => ({ value: r, label: r }))} onChange={(e) => saveDbRegion(e.target.value)} width="100%" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Last backup</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{stats?.lastBackup ? fmtDateTime(stats.lastBackup) : 'Never'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Storage used</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{stats?.storage ? `${stats.storage.used} / ${stats.storage.quotaGb} GB` : '—'}</div>
                    <div style={{ height: 3, background: colors.surfaceMuted, borderRadius: 999, overflow: 'hidden', marginTop: 4 }}><div style={{ height: '100%', width: `${stats?.storage?.usedPct || 0}%`, background: colors.green, borderRadius: 999 }} /></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>API calls today</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{stats?.apiCallsToday != null ? stats.apiCallsToday.toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', marginBottom: 2 }}>Uptime</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{stats?.uptime || '—'}</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Maintenance mode</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 10 }}>Enable to show maintenance page to all users.</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Toggle on={maint} onClick={toggleMaint} />
                    {!maint && (
                      <span style={{ fontSize: 12, color: colors.green, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.green, animation: 'pulse-dot 1.6s infinite' }} />Platform is live</span>
                    )}
                    {maint && (
                      <span style={{ fontSize: 12, color: colors.red }}>Platform in maintenance</span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Marketplace maintenance</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 10 }}>Take only the marketplace offline for realtors. Dashboards, leads &amp; commissions stay online.</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Toggle on={mpMaint} onClick={toggleMpMaint} disabled={maint} />
                    {maint ? (
                      <span style={{ fontSize: 12, color: colors.textFaint }}>Included in full-platform maintenance</span>
                    ) : !mpMaint ? (
                      <span style={{ fontSize: 12, color: colors.green, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.green, animation: 'pulse-dot 1.6s infinite' }} />Marketplace is live</span>
                    ) : (
                      <span style={{ fontSize: 12, color: colors.red }}>Marketplace in maintenance</span>
                    )}
                  </div>
                </div>

                {/* BACKUPS */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Backups</div>
                    <span onClick={createBackup} style={{ height: 30, padding: '0 12px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>Create backup</span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 10 }}>Download, restore, or delete platform snapshots.</div>
                  <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    {backups.length === 0 && (
                      <div style={{ padding: '14px', fontSize: 12, color: colors.textFaint, textAlign: 'center' }}>No backups yet.</div>
                    )}
                    {backups.map((b) => (
                      <div key={b.id} style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.surfaceMuted}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.filename}</div>
                          <div style={{ fontSize: 11, color: colors.textFaint }}>{fmtDateTime(b.createdAt)} · {fmtBytes(b.sizeBytes)}{b.note ? ` · ${b.note}` : ''}</div>
                        </div>
                        <span onClick={() => downloadBackup(b.id)} style={{ fontSize: 11, color: colors.textMuted, cursor: 'pointer' }}>Download</span>
                        <span onClick={() => restoreBackup(b)} style={{ fontSize: 11, color: colors.green, cursor: 'pointer' }}>Restore</span>
                        <span onClick={() => deleteBackup(b)} style={{ fontSize: 11, color: colors.red, cursor: 'pointer' }}>Delete</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DANGER ZONE */}
            {section === 'danger' && (
              <div style={{ background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.red, marginBottom: 4 }}>Danger zone</div>
                <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 18 }}>These actions are irreversible. Proceed with extreme caution.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Reset commission overrides</div>
                      <div style={{ fontSize: 11, color: colors.textFaint, lineHeight: 1.4 }}>Remove all per-developer overrides. All developers revert to default {settings.commission?.defaultPct ?? 15}%.</div>
                    </div>
                    <span onClick={resetOverrides} style={{ height: 32, padding: '0 12px', border: `1px solid ${colors.redTintBorder}`, borderRadius: 7, fontSize: 11, color: colors.red, display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fff', flexShrink: 0 }}>Reset</span>
                  </div>
                  <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Clear all announcement history</div>
                      <div style={{ fontSize: 11, color: colors.textFaint, lineHeight: 1.4 }}>Permanently delete all sent announcement records.</div>
                    </div>
                    <span onClick={clearAnnouncements} style={{ height: 32, padding: '0 12px', border: `1px solid ${colors.redTintBorder}`, borderRadius: 7, fontSize: 11, color: colors.red, display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fff', flexShrink: 0 }}>Clear</span>
                  </div>
                  <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Export all platform data</div>
                      <div style={{ fontSize: 11, color: colors.textFaint, lineHeight: 1.4 }}>Download complete platform backup including all users, leads, commissions.</div>
                    </div>
                    <span onClick={exportAll} style={{ height: 32, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fff', flexShrink: 0 }}>Export all</span>
                  </div>
                </div>
              </div>
            )}

            </>
            )}

          </div>
        </div>
      </div>

      {/* MAINTENANCE MODAL */}
      {maintModal && (
        <div onClick={() => setMaintModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 480, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }} className="wa-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{maintScope === 'marketplaceMaintenance' ? 'Enable marketplace maintenance' : 'Enable maintenance mode'}</span>
              <span onClick={() => setMaintModal(false)} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 12.5, color: '#991B1B', lineHeight: 1.5 }}>{maintScope === 'marketplaceMaintenance' ? 'The marketplace will be blocked for realtors immediately. Dashboards, leads and commissions stay online. Admins keep full access. These details show on the marketplace maintenance page.' : 'Realtors, developers and the marketplace will be blocked immediately. Admins keep full access. These details show on the maintenance page.'}</div>

            {/* ETA */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>Estimated duration</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[15, 30, 60, 120, 240].map((m) => (
                  <span key={m} onClick={() => setMaintForm((f) => ({ ...f, etaMinutes: m }))} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: Number(maintForm.etaMinutes) === m ? `1.5px solid ${colors.green}` : `1px solid ${colors.border}`, background: Number(maintForm.etaMinutes) === m ? colors.greenTint : '#fff', color: Number(maintForm.etaMinutes) === m ? colors.greenDark : colors.textMuted, fontWeight: Number(maintForm.etaMinutes) === m ? 600 : 400 }}>{m < 60 ? `${m} min` : `${m / 60}h`}</span>
                ))}
                <input type="number" value={maintForm.etaMinutes} onChange={(e) => setMaintForm((f) => ({ ...f, etaMinutes: e.target.value }))} style={{ width: 70, height: 32, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '0 8px', fontSize: 12, fontFamily: 'inherit' }} />
                <span style={{ fontSize: 12, color: colors.textFaint, alignSelf: 'center' }}>minutes</span>
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>Message shown to users</div>
              <textarea value={maintForm.message} onChange={(e) => setMaintForm((f) => ({ ...f, message: e.target.value }))} style={{ width: '100%', height: 64, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            </div>

            {/* What's being updated */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>What's being updated</span>
                <span onClick={addItem} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer', fontWeight: 500 }}>+ Add item</span>
              </div>
              {maintForm.items.map((it, i) => {
                const st = it.status || 'pending'
                const stColor = st === 'done' ? colors.green : st === 'active' ? colors.amber : colors.borderStrong
                const stLabel = st === 'done' ? 'Done' : st === 'active' ? 'In progress' : 'Pending'
                return (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    <span onClick={() => setItem(i, { status: cycleItemStatus(st) })} title="Click to change status" style={{ flexShrink: 0, width: 92, textAlign: 'center', padding: '5px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: `1px solid ${stColor}`, color: stColor }}>{stLabel}</span>
                    <input value={it.label} onChange={(e) => setItem(i, { label: e.target.value })} placeholder="What's being updated…" style={{ flex: 1, height: 32, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12.5, fontFamily: 'inherit' }} />
                    <span onClick={() => removeItem(i)} style={{ flexShrink: 0, fontSize: 16, color: colors.textFaint, cursor: 'pointer', padding: '0 4px' }}>×</span>
                  </div>
                )
              })}
              <div style={{ fontSize: 10.5, color: colors.textFaint, marginTop: 4 }}>Click a status chip to cycle Pending → In progress → Done.</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setMaintModal(false)} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmMaint} style={{ height: 34, padding: '0 14px', background: colors.red, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>{maintScope === 'marketplaceMaintenance' ? 'Enable Marketplace Maintenance' : 'Enable Maintenance'}</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${toast.type === 'error' ? colors.redTintBorder : colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: 320 }}>
          {toast.type === 'error' ? (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
          ) : (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          )}
          <div><div style={{ fontSize: 13, fontWeight: 500 }}>{toast.msg}</div><div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{toast.sub}</div></div>
        </div>
      )}
    </>
  )
}
