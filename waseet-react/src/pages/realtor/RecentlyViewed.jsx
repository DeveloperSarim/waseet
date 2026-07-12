import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'

// Bookmark icon (filled when saved)
function Bookmark({ saved }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill={saved ? '#16A34A' : 'none'} stroke={saved ? '#16A34A' : '#6B7280'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

const rawData = [
  { group: 'Today', cards: [
    { id: 1, name: 'Palm Residence', featured: true, location: 'Al Rawdhah, Jeddah', developer: 'Al Faisal Dev', devInitials: 'AF', price: 'SAR 650k–1.2M', type: 'Apartments', status: 'Off-plan', commission: '3% Commission', viewed: 'Viewed 2h ago', leadStatus: 'Negotiation' },
    { id: 2, name: 'Al Noor Tower', isNew: true, location: 'Al Hamra, Riyadh', developer: 'Noor Group', devInitials: 'NG', price: 'SAR 1.1M–3M', type: 'Villas', status: 'Off-plan', commission: '4% Commission', viewed: 'Viewed 4h ago' },
    { id: 3, name: 'Marina Heights', location: 'Dubai Marina, UAE', developer: 'Marina Corp', devInitials: 'MC', price: 'AED 800k–2M', type: 'Offices', status: 'Ready', commission: '2.5% Commission', viewed: 'Viewed 6h ago', leadStatus: 'Closed' },
  ] },
  { group: 'Yesterday', cards: [
    { id: 4, name: 'Green Valley', location: 'Islamabad, PK', developer: 'Emerald Builders', devInitials: 'EB', price: 'PKR 45M–80M', type: 'Townhouses', status: 'Under Const.', commission: '3.5% Commission', viewed: 'Yesterday 3:15 PM' },
    { id: 5, name: 'Corniche Suites', featured: true, location: 'Jeddah, SA', developer: 'Coast Dev', devInitials: 'CD', price: 'SAR 900k–1.8M', type: 'Apartments', status: 'Ready', commission: '3% Commission', viewed: 'Yesterday 11:30 AM' },
    { id: 6, name: 'Business Bay Tower', location: 'Dubai, UAE', developer: 'Bay Developers', devInitials: 'BD', price: 'AED 1.2M–3.5M', type: 'Offices', status: 'Off-plan', commission: '2% Commission', viewed: 'Yesterday 9:00 AM', leadStatus: 'Site Visit' },
  ] },
  { group: 'This week', cards: [
    { id: 7, name: 'Al Hamra Gardens', location: 'Riyadh, SA', developer: 'Al Hamra Dev', devInitials: 'AH', price: 'SAR 550k–950k', type: 'Apartments', status: 'Off-plan', commission: '3.5% Commission', viewed: 'Jun 26' },
    { id: 8, name: 'Pearl Tower', location: 'Abu Dhabi, UAE', developer: 'Pearl Developers', devInitials: 'PD', price: 'AED 650k–1.4M', type: 'Apartments', status: 'Under Const.', commission: '3% Commission', viewed: 'Jun 25' },
    { id: 9, name: 'Gulberg Heights', location: 'Lahore, PK', developer: 'Heights Corp', devInitials: 'HC', price: 'PKR 35M–60M', type: 'Villas', status: 'Off-plan', commission: '4% Commission', viewed: 'Jun 24' },
  ] },
  { group: 'Older', cards: [
    { id: 10, name: 'King Abdullah Tower', location: 'Jeddah, SA', developer: 'KAT Dev', devInitials: 'KA', price: 'SAR 2M–5M', type: 'Offices', status: 'Off-plan', commission: '2.5% Commission', viewed: 'Jun 20', muted: true },
    { id: 11, name: 'Madinah Views', location: 'Madinah, SA', developer: 'Views Corp', devInitials: 'VC', price: 'SAR 380k–650k', type: 'Apartments', status: 'Ready', commission: '3% Commission', viewed: 'Jun 18', muted: true },
    { id: 12, name: 'Karachi Harbour', location: 'Karachi, PK', developer: 'Harbour Dev', devInitials: 'HD', price: 'PKR 55M–90M', type: 'Villas', status: 'Off-plan', commission: '3.5% Commission', viewed: 'Jun 15', muted: true },
  ] },
]

const timeDefs = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
]

export default function RecentlyViewed() {
  const navigate = useNavigate()
  const [removed, setRemoved] = useState({})
  const [saved, setSaved] = useState({ 1: true, 5: true })
  const [cleared, setCleared] = useState(false)
  const [showClear, setShowClear] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastUndo, setToastUndo] = useState(false)
  const [lastRemoved, setLastRemoved] = useState(null)
  const [timeFilter, setTimeFilter] = useState('all')
  const timer = useRef(null)

  const toast = (msg, undo) => {
    clearTimeout(timer.current)
    setToastMsg(msg)
    setToastUndo(!!undo)
    setShowToast(true)
    timer.current = setTimeout(() => setShowToast(false), undo ? 5000 : 2000)
  }

  const removeCard = (id) => {
    setRemoved((r) => ({ ...r, [id]: true }))
    setLastRemoved(id)
    toast('Removed from recently viewed', true)
  }

  const undo = () => {
    setRemoved((r) => {
      const next = { ...r }
      if (lastRemoved != null) delete next[lastRemoved]
      return next
    })
    setLastRemoved(null)
    setShowToast(false)
  }

  const toggleSave = (id) => setSaved((s) => ({ ...s, [id]: !s[id] }))

  // build visible groups (filter removed)
  let totalVisible = 0
  const groups = []
  if (!cleared) {
    rawData.forEach((g) => {
      const cards = g.cards.filter((c) => !removed[c.id])
      totalVisible += cards.length
      if (cards.length) groups.push({ label: g.group, cards })
    })
  }

  const isEmpty = cleared || totalVisible === 0

  return (
    <>
      <style>{`
        @keyframes wsk-toast { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .rv-card { transition: all 200ms; }
        .rv-card:hover { border-color: #D1D5DB !important; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }
        .rv-card .rv-remove { opacity: 0; transition: opacity 150ms; }
        .rv-card:hover .rv-remove { opacity: 1; }
        .rv-remove:hover { border-color: #FECACA !important; }
        .rv-clear:hover { color: #DC2626 !important; }
        .rv-browse:hover { background: #15803D !important; }
        .rv-primary:hover { background: #15803D !important; }
        .rv-ghost:hover { background: #F9FAFB !important; }
        .rv-danger:hover { background: #B91C1C !important; }
      `}</style>

      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Recently Viewed</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{totalVisible} projects</span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="rv-clear" onClick={() => setShowClear(true)} style={{ height: 34, padding: '0 14px', background: 'transparent', border: 'none', borderRadius: 8, fontSize: 12, color: colors.textFaint, fontFamily: 'inherit', cursor: 'pointer' }}>Clear history</button>
            <button className="rv-browse" onClick={() => navigate('/realtor/browse')} style={{ height: 34, padding: '0 14px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Browse marketplace →</button>
          </div>
        }
      />

      {/* filter bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: colors.textMuted, marginRight: 4 }}>Time:</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {timeDefs.map((t) => {
            const active = timeFilter === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTimeFilter(t.key)}
                style={{ border: `1px solid ${active ? colors.ink : colors.border}`, borderRadius: 999, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', background: active ? colors.ink : '#fff', color: active ? '#fff' : colors.textMuted }}
              >
                {active && t.key === 'all' ? 'All time ✓' : t.label}
              </button>
            )
          })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${colors.border}`, borderRadius: 8, height: 34, padding: '0 12px', cursor: 'pointer', background: '#fff' }}>
          <span style={{ fontSize: 12, color: colors.textMuted }}>Most recent</span>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>

      {/* content */}
      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>

        {/* EMPTY STATE */}
        {isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <div style={{ fontSize: 16, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>No recently viewed projects</div>
            <div style={{ fontSize: 13, color: colors.textSoft, marginBottom: 20, maxWidth: 320, lineHeight: 1.5 }}>Projects you view in the marketplace will appear here for quick access.</div>
            <button className="rv-primary" onClick={() => navigate('/realtor/browse')} style={{ height: 38, padding: '0 20px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Browse Marketplace</button>
          </div>
        )}

        {/* GROUPS */}
        {!isEmpty && (
          <div>
            {groups.map((g) => (
              <div key={g.label} style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{g.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'stretch', gridAutoRows: '1fr' }}>
                  {g.cards.map((c) => {
                    const hasLead = !!c.leadStatus
                    return (
                      <div key={c.id} className="rv-card" style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%', opacity: c.muted ? 0.72 : 1 }}>

                        {/* image */}
                        <div style={{ height: 160, position: 'relative', backgroundColor: colors.surfaceMuted, backgroundImage: 'repeating-linear-gradient(45deg, #ECECEE 0, #ECECEE 1px, transparent 1px, transparent 9px)' }}>
                          {/* top-left pills */}
                          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                            {c.featured && <span style={{ background: colors.ink, color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Featured</span>}
                            {c.isNew && <span style={{ background: colors.green, color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>New</span>}
                          </div>
                          {/* remove (hover) */}
                          <button className="rv-remove" onClick={() => removeCard(c.id)} title="Remove" style={{ position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.9)', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                          {/* bookmark */}
                          <button onClick={() => toggleSave(c.id)} style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.9)', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                            <span style={{ display: 'flex' }}><Bookmark saved={!!saved[c.id]} /></span>
                          </button>
                          {/* timestamp */}
                          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 999, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            <span style={{ fontSize: 9, color: '#fff' }}>{c.viewed}</span>
                          </div>
                          {/* commission */}
                          <div style={{ position: 'absolute', bottom: 10, right: 10, background: colors.ink, borderRadius: 6, padding: '4px 10px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{c.commission}</span>
                          </div>
                        </div>

                        {/* body */}
                        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, marginBottom: 3 }}>{c.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            <span style={{ fontSize: 12, color: colors.textFaint }}>{c.location}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <div style={{ width: 18, height: 18, borderRadius: 4, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: colors.greenDark }}>{c.devInitials}</div>
                            <span style={{ fontSize: 11, color: colors.textSoft }}>{c.developer}</span>
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>{c.price}</div>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                            <span style={{ fontSize: 10, fontWeight: 500, color: colors.textMuted, background: colors.surfaceMuted, borderRadius: 5, padding: '3px 8px' }}>{c.type}</span>
                            <span style={{ fontSize: 10, fontWeight: 500, color: colors.textMuted, background: colors.surfaceMuted, borderRadius: 5, padding: '3px 8px' }}>{c.status}</span>
                          </div>

                          {/* lead status */}
                          {hasLead && (
                            <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 7, padding: '6px 10px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                              <span style={{ fontSize: 12, fontWeight: 500, color: colors.greenDark }}>Lead: {c.leadStatus}</span>
                              <span onClick={() => navigate('/realtor/leads')} style={{ fontSize: 11, color: colors.greenDark, marginLeft: 'auto', cursor: 'pointer' }}>View →</span>
                            </div>
                          )}

                          {/* actions */}
                          <div style={{ marginTop: 'auto' }}>
                            {hasLead ? (
                              <button className="rv-primary" onClick={() => navigate('/realtor/leads')} style={{ width: '100%', height: 32, background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>View Lead →</button>
                            ) : (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="rv-primary" onClick={() => navigate('/project/' + c.id)} style={{ flex: 1, height: 32, background: colors.green, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Submit Lead</button>
                                <button className="rv-ghost" onClick={() => navigate('/project/' + c.id)} style={{ flex: 1, height: 32, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>View Project</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* load more */}
            <button className="rv-ghost" style={{ width: '100%', height: 34, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', marginTop: 4 }}>Load more history</button>
            <div style={{ fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: 8 }}>Showing {totalVisible} of 47 viewed projects</div>
          </div>
        )}

      </div>

      {/* CLEAR MODAL */}
      {showClear && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 24 }}>
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', maxWidth: 400, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>Clear viewing history?</span>
              <button onClick={() => setShowClear(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6, marginBottom: 14 }}>This will remove all {totalVisible} projects from your recently viewed list. Your leads and saved projects will <strong>NOT</strong> be affected.</div>
            <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 16 }}>This cannot be undone.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="rv-ghost" onClick={() => setShowClear(false)} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button className="rv-danger" onClick={() => { setCleared(true); setShowClear(false); toast('Viewing history cleared', false) }} style={{ height: 34, padding: '0 14px', background: colors.red, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Clear history</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {showToast && (
        <div style={{ position: 'fixed', bottom: 22, right: 22, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'center', animation: 'wsk-toast 300ms ease-out', zIndex: 80 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>{toastMsg}</span>
          {toastUndo && (
            <button onClick={undo} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: colors.greenDark, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Undo</button>
          )}
        </div>
      )}
    </>
  )
}
