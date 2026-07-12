import React, { useState, useEffect, useCallback } from 'react'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { adminApi } from '../../lib/api'

const radioStyle = (on) => ({
  width: 18,
  height: 18,
  borderRadius: '50%',
  flexShrink: 0,
  ...(on
    ? { background: colors.ink, boxShadow: 'inset 0 0 0 3px #fff, 0 0 0 1.5px #0A0A0A' }
    : { background: '#fff', border: `1.5px solid ${colors.borderStrong}` }),
})
const optRowStyle = (on) => ({
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  border: on ? '1.5px solid #0A0A0A' : `1px solid ${colors.border}`,
  background: on ? colors.bg : '#fff',
})

const recDefs = [
  ['all', 'All users', 'Everyone on the platform'],
  ['realtors', 'All realtors only', 'Realtor accounts only'],
  ['developers', 'All developers only', 'Developer accounts only'],
]
const audienceMap = { all: 'ALL', realtors: 'REALTORS', developers: 'DEVELOPERS' }
const audienceLabel = { ALL: 'All users', REALTORS: 'Realtors', DEVELOPERS: 'Developers' }

const tools = [
  { label: 'B', weight: 700 },
  { label: 'I', fontStyle: 'italic' },
  { label: 'U' },
  { divider: true },
  { label: '☰' },
  { label: '⋮≡' },
  { divider: true },
  { label: '🔗' },
]

const tips = [
  'Keep subject under 60 characters for best email open rates',
  'Start with the most important information first',
  'Include a clear call-to-action if linking to a feature',
  'Avoid sending more than 2 announcements per week',
]

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export default function AdminAnnouncements() {
  const [recipient, setRecipient] = useState('all')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [sendOpen, setSendOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentRecipients, setSentRecipients] = useState(0)
  const [sendError, setSendError] = useState('')

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [clearOpen, setClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await adminApi.listAnnouncements()
      setHistory(list || [])
    } catch {
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const canSend = subject.trim().length > 0 && message.trim().length > 0
  const openSend = () => { if (canSend) { setSendOpen(true); setSent(false); setSendError('') } }
  const closeSend = () => {
    setSendOpen(false)
    if (sent) { setSubject(''); setMessage(''); setLink(''); setRecipient('all') }
    setSent(false); setSendError('')
  }

  const doSend = async () => {
    if (sending) return
    setSending(true); setSendError('')
    try {
      const res = await adminApi.createAnnouncement({ title: subject.trim(), body: message.trim(), audience: audienceMap[recipient] })
      setSentRecipients(res?.recipients ?? 0)
      setSent(true)
      setToast(`Sent to ${res?.recipients ?? 0} recipient${res?.recipients === 1 ? '' : 's'}`)
      setTimeout(() => setToast(''), 4000)
      await load()
    } catch (e) {
      setSendError(e.message || 'Could not send announcement')
    } finally {
      setSending(false)
    }
  }

  const doClear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await adminApi.clearAnnouncements()
      setClearOpen(false)
      setToast('Announcement history cleared')
      setTimeout(() => setToast(''), 4000)
      await load()
    } catch (e) {
      setToast(e.message || 'Could not clear history')
      setTimeout(() => setToast(''), 4000)
    } finally {
      setClearing(false)
    }
  }

  const audienceEnum = audienceMap[recipient]
  const summaryRecipients = audienceLabel[audienceEnum]

  const subj = subject || 'New feature: Project analytics'
  const msg = message || 'Write your announcement here...'
  const previewSubjectShort = subj.length > 40 ? subj.slice(0, 40) + '…' : subj
  const hasLink = link.trim().length > 0

  const sendBtnStyle = {
    height: 36,
    padding: '0 18px',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    fontFamily: 'inherit',
    background: canSend ? colors.green : colors.textFaint,
    cursor: canSend ? 'pointer' : 'not-allowed',
  }

  return (
    <>
      <style>{`@media (max-width: 900px) { .an-cols { flex-direction: column !important; } }`}</style>
      <Topbar title="Announcements" />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        <div className="an-cols" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* LEFT: COMPOSE */}
          <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>New announcement</div>

              <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Send to *</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {recDefs.map(([id, label, count]) => {
                  const on = recipient === id
                  return (
                    <div key={id} onClick={() => setRecipient(id)} style={optRowStyle(on)}>
                      <span style={radioStyle(on)}></span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 1 }}>{label}</div>
                        <div style={{ fontSize: 11, color: colors.textFaint }}>{count}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Subject *</div>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. New feature: Project analytics" maxLength={80} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }} />
                <span style={{ position: 'absolute', right: 4, bottom: -16, fontSize: 10, color: colors.textFaint }}>{subject.length} / 80</span>
              </div>

              <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, margin: '8px 0 4px' }}>Message *</div>
              <div style={{ border: `1px solid ${colors.border}`, borderRadius: '7px 7px 0 0', borderBottom: `1px solid ${colors.surfaceMuted}`, padding: '7px 10px', display: 'flex', gap: 2, background: colors.bg, alignItems: 'center' }}>
                {tools.map((t, i) =>
                  t.divider ? (
                    <span key={i} style={{ width: 1, height: 16, background: colors.border, margin: '0 4px' }}></span>
                  ) : (
                    <span key={i} style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textFaint, cursor: 'pointer', fontSize: 13, fontWeight: t.weight || 400, fontStyle: t.fontStyle || 'normal' }}>{t.label}</span>
                  )
                )}
              </div>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement here..." maxLength={1000} style={{ width: '100%', minHeight: 160, border: `1px solid ${colors.border}`, borderTop: 'none', borderRadius: '0 0 7px 7px', padding: '12px 14px', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.7, resize: 'vertical' }} />
              <div style={{ textAlign: 'right', fontSize: 10, color: colors.textFaint, marginTop: 4 }}>{message.length} / 1000 characters</div>

              <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, margin: '14px 0 4px' }}>Link (optional)</div>
              <div style={{ position: 'relative' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z" /></svg>
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>Appears as a button in the notification</div>
            </div>

            {/* EMAIL PREVIEW */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Email preview</span>
                <span style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>In-app preview</span>
              </div>
              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: colors.ink, padding: '14px 20px' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>waseet</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>وسيط</span>
                </div>
                <div style={{ background: colors.bg, padding: '20px 24px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Platform Announcement</div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{subj}</div>
                  <div style={{ fontSize: 14, color: colors.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg}</div>
                  {hasLink && <span style={{ display: 'inline-block', background: colors.green, color: '#fff', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, marginTop: 12 }}>Read more →</span>}
                </div>
                <div style={{ background: colors.surfaceMuted, borderTop: `1px solid ${colors.border}`, padding: '14px 24px' }}>
                  <div style={{ fontSize: 11, color: colors.textFaint }}>© 2026 Waseet · waseet.io</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>Unsubscribe from announcements</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={openSend} disabled={!canSend} style={sendBtnStyle}>Preview &amp; Send →</button>
              <button style={{ height: 36, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Save as Draft</button>
            </div>

            {/* SENT HISTORY */}
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Sent announcements</span>
                {history.length > 0 && (
                  <span onClick={() => setClearOpen(true)} style={{ fontSize: 12, color: colors.red, cursor: 'pointer', fontWeight: 500 }}>Clear history</span>
                )}
              </div>
              <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '8px 16px', display: 'flex' }}>
                <span style={{ flex: 2, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Subject</span>
                <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Audience</span>
                <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Recipients</span>
                <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Sent</span>
              </div>
              {history.map((h) => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'flex-start', padding: '10px 16px', borderBottom: `1px solid ${colors.surfaceMuted}`, minHeight: 52 }}>
                  <div style={{ flex: 2, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{h.title}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.body}</div>
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: colors.textMuted }}>{audienceLabel[h.audience] || h.audience}</span>
                  <span style={{ flex: 1, fontSize: 12, color: colors.textMuted }}>{h.recipients} recipient{h.recipients === 1 ? '' : 's'}</span>
                  <span style={{ flex: 1, fontSize: 12, color: colors.textFaint }}>{fmtDate(h.createdAt)}</span>
                </div>
              ))}
              {loading && (
                <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading announcements…</div>
              )}
              {!loading && history.length === 0 && (
                <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>No announcements sent yet</div>
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>Compose one above to notify realtors and developers.</div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Send summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: colors.textFaint }}>Recipients:</span><span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>{summaryRecipients}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: colors.textFaint }}>Channels:</span><span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>Email + In-app</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: colors.textFaint }}>Delivery:</span><span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>Send immediately</span></div>
              </div>
            </div>

            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Writing tips</div>
              {tips.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><path d="M20 6L9 17l-5-5" /></svg>
                  <span style={{ fontSize: 12, color: colors.textSoft, lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* SEND MODAL */}
      {sendOpen && (
        <div onClick={closeSend} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '20px 24px', maxWidth: 560, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', maxHeight: '90vh', overflowY: 'auto' }}>
            {!sent && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Send announcement</span>
                  <span onClick={closeSend} style={{ fontSize: 20, color: colors.textFaint, cursor: 'pointer' }}>×</span>
                </div>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ background: colors.ink, padding: '12px 18px' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>waseet</span></div>
                  <div style={{ background: colors.bg, padding: '16px 20px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Platform Announcement</div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{subj}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg}</div>
                  </div>
                </div>
                <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '12px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}><span style={{ fontSize: 11, color: colors.textFaint, width: 60 }}>To:</span><span style={{ fontSize: 12, color: colors.textMuted }}>{summaryRecipients}</span></div>
                  <div style={{ display: 'flex', gap: 8 }}><span style={{ fontSize: 11, color: colors.textFaint, width: 60 }}>Subject:</span><span style={{ fontSize: 12, color: colors.textMuted }}>{previewSubjectShort}</span></div>
                  <div style={{ display: 'flex', gap: 8 }}><span style={{ fontSize: 11, color: colors.textFaint, width: 60 }}>Send:</span><span style={{ fontSize: 12, color: colors.textMuted }}>Send immediately</span></div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth={1.9} style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                  <span style={{ fontSize: 12, color: colors.amberText, lineHeight: 1.5 }}>This sends an email and in-app notification to {summaryRecipients.toLowerCase()}. This action cannot be undone.</span>
                </div>
                {sendError && <div style={{ fontSize: 12, color: colors.red, marginBottom: 12 }}>{sendError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={closeSend} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={doSend} disabled={sending} style={{ height: 34, padding: '0 16px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}><path d="M3 11l18-5v12L3 14v-3z" /></svg>{sending ? 'Sending…' : `Send to ${summaryRecipients}`}
                  </button>
                </div>
              </>
            )}
            {sent && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={{ marginBottom: 12 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Announcement sent!</div>
                <div style={{ fontSize: 13, color: colors.textSoft, lineHeight: 1.6, marginBottom: 16 }}>Delivered to {sentRecipients} recipient{sentRecipients === 1 ? '' : 's'} via email and in-app notifications.</div>
                <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 16 }}>
                  <div><div style={{ fontSize: 18, fontWeight: 700 }}>{sentRecipients}</div><div style={{ fontSize: 11, color: colors.textFaint }}>Recipients</div></div>
                </div>
                <button onClick={closeSend} style={{ height: 36, padding: '0 24px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLEAR HISTORY MODAL */}
      {clearOpen && (
        <div onClick={() => !clearing && setClearOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 420, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Clear announcement history?</span>
              <span onClick={() => !clearing && setClearOpen(false)} style={{ fontSize: 18, color: colors.textFaint, cursor: 'pointer' }}>×</span>
            </div>
            <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#991B1B', lineHeight: 1.6 }}>This permanently removes all sent announcement records. This action cannot be undone.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setClearOpen(false)} disabled={clearing} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={doClear} disabled={clearing} style={{ height: 34, padding: '0 14px', background: colors.red, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: clearing ? 'default' : 'pointer', opacity: clearing ? 0.6 : 1 }}>{clearing ? 'Clearing…' : 'Clear history'}</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{toast}</span>
        </div>
      )}
    </>
  )
}
