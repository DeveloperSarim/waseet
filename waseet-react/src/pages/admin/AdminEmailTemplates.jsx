import React, { useState, useEffect, useCallback } from 'react'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { adminApi, settingsApi } from '../../lib/api'

// Icon d-paths (exact from source)
const mailI = 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6'
const checkI = 'M20 6L9 17l-5-5'
const xI = 'M18 6L6 18M6 6l12 12'
const filePlus = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 12v6M9 15h6'
const coinI = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10'

// The backend exposes exactly these four editable templates. They are grouped
// to preserve the original list/editor design.
const groupsDef = [
  { label: 'Review', iconBg: '#FEF9EC', iconColor: colors.amber, items: [
    { key: 'approval', defaultName: 'Application approved', icon: checkI },
    { key: 'rejection', defaultName: 'Application rejected', icon: xI },
  ] },
  { label: 'Leads', iconBg: colors.purpleTint, iconColor: '#5B5BD6', items: [
    { key: 'lead', defaultName: 'Lead received', icon: filePlus },
  ] },
  { label: 'Commissions', iconBg: colors.greenTint, iconColor: colors.green, items: [
    { key: 'commission', defaultName: 'Commission invoice', icon: coinI },
  ] },
]
const allItems = groupsDef.flatMap((g) => g.items)

const triggerMap = {
  approval: 'Sent when an account application is approved',
  rejection: 'Sent when an account application is rejected',
  lead: 'Sent to a developer when a new lead is received',
  commission: 'Sent when a commission invoice is generated',
}
const variables = ['{{name}}', '{{email}}', '{{company_name}}', '{{login_url}}', '{{support_email}}']

const tabActive = { padding: '0 12px', height: 32, display: 'flex', alignItems: 'center', fontSize: 12, cursor: 'pointer', background: colors.ink, color: '#fff' }
const tabIdle = { padding: '0 12px', height: 32, display: 'flex', alignItems: 'center', fontSize: 12, cursor: 'pointer', background: 'transparent', color: colors.textSoft }

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('approval')
  const [mode, setMode] = useState('edit') // edit | preview
  const [device, setDevice] = useState('desktop') // desktop | mobile
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const [toast, setToast] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const t = await adminApi.getEmailTemplates()
      setTemplates(t)
    } catch {
      setTemplates({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Sync the editable drafts to the selected template whenever it or the loaded
  // data changes (also resets drafts to the saved version after a save).
  useEffect(() => {
    if (!templates) return
    const t = templates[active]
    setSubject(t?.subject || '')
    setBody(t?.body || '')
  }, [active, templates])

  const cur = allItems.find((t) => t.key === active) || allItems[0]
  const tplName = templates?.[active]?.name || cur.defaultName
  const tplTrigger = triggerMap[active] || ''
  const isEdit = mode === 'edit'
  const isPreview = mode === 'preview'
  const templateCount = templates ? allItems.filter((i) => templates[i.key]).length : 0

  const save = async () => {
    if (saveState === 'saving') return
    setSaveState('saving')
    try {
      const t = await adminApi.updateEmailTemplate(active, { subject, body })
      setTemplates(t)
      setSaveState('saved'); setToast(true)
      setTimeout(() => { setSaveState('idle'); setToast(false) }, 3000)
    } catch {
      setSaveState('idle')
    }
  }

  const openTest = () => { setTestOpen(true); setTestSent(false); setTestTo('') }
  const sendTest = async () => {
    if (testSending || !testTo.trim()) return
    setTestSending(true)
    try {
      await settingsApi.testEmail(testTo.trim())
      setTestSent(true)
    } catch {
      setTestSent(true)
    } finally {
      setTestSending(false)
    }
  }
  const openReset = () => setResetOpen(true)
  const doReset = () => {
    // Revert unsaved edits back to the last saved version from the server.
    const t = templates?.[active]
    setSubject(t?.subject || '')
    setBody(t?.body || '')
    setResetOpen(false)
  }
  const closeModals = () => { setTestOpen(false); setResetOpen(false); setTestSent(false) }
  const stop = (e) => e.stopPropagation()

  const saveLabel = saveState === 'saved' ? 'Saved ✓' : saveState === 'saving' ? 'Saving…' : 'Save Changes'
  const saveBtnStyle = {
    height: 34, padding: '0 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: saveState === 'saving' ? 'default' : 'pointer',
    ...(saveState === 'saved'
      ? { background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, color: colors.greenDark }
      : { background: colors.green, border: 'none', color: '#fff', opacity: saveState === 'saving' ? 0.7 : 1 }),
  }
  const previewWidth = device === 'mobile' ? '375px' : '100%'

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Email Templates</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{templateCount} templates</span>
          </div>
        }
        actions={
          <button onClick={openTest} className="wa-hide-sm" style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.8}><path d={mailI} /></svg>Send test email
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* LEFT: TEMPLATE LIST */}
          <div style={{ width: 280, maxWidth: '100%', flexShrink: 0, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Templates</span>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ cursor: 'pointer' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
            </div>
            {groupsDef.map((g) => (
              <div key={g.label}>
                <div style={{ padding: '8px 14px', background: colors.bg, borderBottom: `1px solid ${colors.surfaceMuted}`, fontSize: 9, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{g.label}</div>
                {g.items.map((t) => {
                  const on = active === t.key
                  const name = templates?.[t.key]?.name || t.defaultName
                  return (
                    <div key={t.key} onClick={() => setActive(t.key)} style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.surfaceMuted}`, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', ...(on ? { background: colors.greenTint, borderLeft: `3px solid ${colors.green}` } : {}) }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: on ? colors.greenTint : g.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={on ? colors.green : g.iconColor} strokeWidth={1.8}><path d={t.icon} /></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 1, color: on ? colors.greenDark : colors.ink }}>{name}</div>
                        <div style={{ fontSize: 10, color: colors.textFaint }}>{templates?.[t.key] ? 'Editable' : 'Unavailable'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* RIGHT: EDITOR */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{tplName}</div>
                  <div style={{ fontSize: 12, color: colors.textFaint }}>{tplTrigger}</div>
                </div>
                <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden' }}>
                  <span onClick={() => setMode('edit')} style={isEdit ? tabActive : tabIdle}>Edit</span>
                  <span onClick={() => setMode('preview')} style={isPreview ? tabActive : tabIdle}>Preview</span>
                </div>
              </div>

              {loading && <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading template…</div>}

              {/* EDIT MODE */}
              {!loading && isEdit && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Subject</div>
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>Available variables:</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {variables.map((v) => (
                        <span key={v} style={{ background: '#EEF3FF', border: `1px solid ${colors.blueTintBorder}`, borderRadius: 4, padding: '2px 7px', fontSize: 11, color: '#1B4FD8', fontFamily: 'monospace' }}>{v}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 4 }}>Variables are replaced with real values when the email is sent.</div>
                  </div>
                  <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderBottom: 'none', borderRadius: '8px 8px 0 0', padding: '7px 10px', display: 'flex', gap: 2, alignItems: 'center' }}>
                    <span style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textFaint, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>B</span>
                    <span style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textFaint, cursor: 'pointer', fontSize: 13, fontStyle: 'italic' }}>I</span>
                    <span style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textFaint, cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>U</span>
                    <span style={{ width: 1, height: 16, background: colors.border, margin: '0 4px' }} />
                    <span style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textFaint, cursor: 'pointer' }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg></span>
                  </div>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Email body…" style={{ width: '100%', minHeight: 280, border: `1px solid ${colors.border}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '12px 14px', fontSize: 13, color: colors.textMuted, lineHeight: 1.8, fontFamily: 'monospace', resize: 'vertical' }} />
                  <div style={{ border: `1px solid ${colors.border}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', marginTop: -8 }}>
                    <span style={{ fontSize: 11, color: colors.textFaint }}>{'{{name}} will be replaced with the actual value'}</span>
                    <span style={{ fontSize: 10, color: colors.textFaint }}>Characters: {body.length}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button onClick={save} style={saveBtnStyle}>{saveLabel}</button>
                    <button onClick={openReset} style={{ height: 34, padding: '0 14px', background: 'transparent', border: 'none', fontSize: 12, color: colors.textFaint, fontFamily: 'inherit', cursor: 'pointer' }}>Reset changes</button>
                    <button onClick={openTest} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Send test email</button>
                  </div>
                </>
              )}

              {/* PREVIEW MODE */}
              {!loading && isPreview && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Email preview</span>
                    <span style={{ fontSize: 12, color: colors.textFaint }}>Variables shown as-is</span>
                  </div>
                  <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden', marginBottom: 12, width: 'fit-content' }}>
                    <span onClick={() => setDevice('desktop')} style={device === 'desktop' ? tabActive : tabIdle}>Desktop</span>
                    <span onClick={() => setDevice('mobile')} style={device === 'mobile' ? tabActive : tabIdle}>Mobile</span>
                  </div>
                  <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden', maxWidth: previewWidth, margin: '0 auto' }}>
                    <div style={{ background: colors.ink, padding: '16px 24px' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>waseet</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 6 }}>وسيط</span>
                    </div>
                    <div style={{ background: colors.surfaceMuted, padding: '8px 24px', borderBottom: `1px solid ${colors.border}` }}>
                      <div style={{ fontSize: 11, color: colors.textFaint }}>From: noreply@waseet.io</div>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Subject: {subject || '—'}</div>
                    </div>
                    <div style={{ background: '#fff', padding: '24px 32px', fontSize: 14, color: colors.textMuted, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{body || 'No content.'}</div>
                    <div style={{ background: colors.surfaceMuted, borderTop: `1px solid ${colors.border}`, padding: '14px 24px' }}>
                      <div style={{ fontSize: 11, color: colors.textFaint }}>© 2026 Waseet · waseet.io</div>
                      <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>Unsubscribe</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* TEST MODAL */}
      {testOpen && (
        <div onClick={closeModals} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stop} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            {!testSent ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Send test email</span>
                  <span onClick={closeModals} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
                </div>
                <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 3 }}>Template:</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{tplName}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Send to:</div>
                <div style={{ position: 'relative' }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><path d={mailI} /></svg>
                  <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="admin@waseet.io" style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 13, fontFamily: 'inherit' }} />
                </div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 8 }}>A test email will be delivered to this address.</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                  <button onClick={closeModals} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={sendTest} disabled={testSending || !testTo.trim()} style={{ height: 34, padding: '0 14px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: (testSending || !testTo.trim()) ? 'default' : 'pointer', opacity: (testSending || !testTo.trim()) ? 0.6 : 1 }}>{testSending ? 'Sending…' : 'Send test'}</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={{ marginBottom: 10 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Test email sent!</div>
                <div style={{ fontSize: 12, color: colors.textSoft }}>Delivered to {testTo}</div>
                <button onClick={closeModals} style={{ width: '100%', height: 34, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', marginTop: 14 }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESET MODAL */}
      {resetOpen && (
        <div onClick={closeModals} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stop} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Discard changes?</div>
                <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>{tplName}</div>
              </div>
              <span onClick={closeModals} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: colors.amberText, lineHeight: 1.6 }}>Your unsaved edits to this template will be replaced with the last saved version.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeModals} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={doReset} style={{ height: 34, padding: '0 14px', background: colors.red, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Discard changes</button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE TOAST */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Template saved</div>
            <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{tplName} template updated</div>
          </div>
        </div>
      )}
    </>
  )
}
