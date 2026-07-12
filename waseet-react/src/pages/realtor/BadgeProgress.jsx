import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { realtorApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { joinedLabel } from '../../lib/adminFormat'

const check = 'M20 6L9 17l-5-5'
const circle = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z'
const lockI = 'M5 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z'

const reqDone = (label) => ({ label, color: '#16A34A', textColor: '#374151', icon: check, hasBar: false })
const reqTodo = (label) => ({ label, color: '#9CA3AF', textColor: '#9CA3AF', icon: circle, hasBar: false })
const req = (label, done) => (done ? reqDone(label) : reqTodo(label))
const unlockDone = (label) => ({ label, color: '#16A34A', textColor: '#374151', icon: check })
const unlockLocked = (label) => ({ label, color: '#9CA3AF', textColor: '#9CA3AF', icon: lockI })

const achievedStatus = { display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#15803D' }
const currentStatus = { display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#15803D' }
const lockedStatus = { display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#374151' }

const cardBase = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }

// Static tier definitions. Achievement, requirements, and notes are computed from live stats.
const TIER_META = [
  { idx: 0, emoji: '🥉', name: 'Bronze Realtor', short: 'Bronze', tagline: 'Starting badge', pos: '0%',
    unlocks: ['Access to all marketplace projects', 'Submit unlimited client leads', 'Real-time lead status tracking'] },
  { idx: 1, emoji: '🥈', name: 'Silver Realtor', short: 'Silver', tagline: '5+ leads or 1 closed deal', pos: '33%',
    unlocks: ['Priority new project notifications', 'Lead submission limit increased', 'Access to project analytics summary'] },
  { idx: 2, emoji: '🥇', name: 'Gold Realtor', short: 'Gold', tagline: '3+ closed deals', pos: '60%',
    unlocks: ['Full project analytics access', 'Higher priority in developer search', 'Dedicated support channel', 'Gold badge displayed on all leads'] },
  { idx: 3, emoji: '💎', name: 'Platinum Realtor', short: 'Platinum', tagline: '10 closed deals', pos: '100%',
    unlocks: ['Direct developer contact (WhatsApp)', 'Fastest commission disbursement', 'Platinum badge — premium positioning', 'Priority customer support', 'Exclusive platform invitations'] },
]

// Deals needed to reach each tier (Silver can also be reached via 5+ leads).
const dealThreshold = { 0: 0, 1: 1, 2: 3, 3: 10 }

// Compute the highest achieved tier index from live stats.
function computeTier(stats) {
  const d = stats?.deals || 0
  const l = stats?.leads || 0
  if (d >= 10) return 3
  if (d >= 3) return 2
  if (l >= 5 || d >= 1) return 1
  return 0
}

function moneyLabel(n) {
  if (n >= 1000) return `SAR ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return `SAR ${n}`
}

const milestones = [
  { title: 'Reached Gold Realtor badge', date: 'March 2026', emoji: '🥇' },
  { title: 'Closed deal #5 — Silver unlocked', date: 'February 2026', emoji: '🥈' },
  { title: 'First closed deal!', date: 'January 2026', emoji: '🎉' },
  { title: 'First lead submitted', date: 'January 2026', emoji: '⭐' },
]

// confetti particles
const confettiColors = ['#16A34A', '#ffffff', '#D1D5DB', '#BBF7D0']
const confetti = []
for (let i = 0; i < 80; i++) {
  const c = confettiColors[i % confettiColors.length]
  const left = Math.round((i * 1.25) % 100)
  const dur = (2.5 + (i % 5) * 0.6).toFixed(1)
  const delay = ((i % 7) * 0.35).toFixed(2)
  confetti.push({ left: `${left}%`, background: c, animationDuration: `${dur}s`, animationDelay: `${delay}s` })
}

const bpKeyframes = `
@keyframes bp-pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes bp-badge-pop { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes bp-confetti-fall { 0% { transform: translateY(-20vh) rotate(0); opacity: 1; } 100% { transform: translateY(100vh) rotate(540deg); opacity: 0; } }
.bp-confetti { position: absolute; width: 9px; height: 9px; border-radius: 2px; animation-name: bp-confetti-fall; animation-timing-function: linear; animation-iteration-count: infinite; }
`

export default function BadgeProgress() {
  const navigate = useNavigate()
  const { user } = useAuth() || {}
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [celebrating, setCelebrating] = useState(false)

  // Fetch live realtor stats on mount.
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await realtorApi.dashboard()
        if (alive) setStats(data.stats || null)
      } catch (e) {
        // leave stats null on failure
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // Rank-up celebration: fire only when the stored tier is lower than the computed one.
  useEffect(() => {
    if (!stats || !user?.id) return
    const tier = computeTier(stats)
    const key = `waseet_seen_tier_${user.id}`
    const raw = localStorage.getItem(key)
    if (raw === null) {
      // First visit: record silently so we don't celebrate for everyone.
      localStorage.setItem(key, String(tier))
      return
    }
    const seen = parseInt(raw, 10)
    if (!isNaN(seen) && tier > seen) {
      setCelebrating(true)
      localStorage.setItem(key, String(tier))
    }
  }, [stats, user])

  const deals = stats?.deals || 0
  const leads = stats?.leads || 0
  const totalEarned = stats?.totalEarned || 0

  const silverAchieved = leads >= 5 || deals >= 1
  const goldAchieved = deals >= 3
  const currentTier = computeTier(stats)
  const currentMeta = TIER_META[currentTier]

  const conversion = `${leads > 0 ? (deals / leads * 100).toFixed(1) : '0.0'}%`

  // Next-tier progress (by deals). Null when already at Platinum.
  const nextMeta = currentTier < 3 ? TIER_META[currentTier + 1] : null
  const nextThreshold = nextMeta ? dealThreshold[nextMeta.idx] : dealThreshold[3]
  const moreNeeded = nextMeta ? Math.max(0, nextThreshold - deals) : 0
  const pct = nextMeta ? Math.min(100, Math.round((deals / nextThreshold) * 100)) : 100

  const nextEmoji = nextMeta ? nextMeta.emoji : '💎'
  const nextShort = nextMeta ? nextMeta.short : 'Platinum'
  const progTitle = nextMeta ? `Progress to ${nextShort} ${nextEmoji}` : `Top tier reached ${nextEmoji}`
  const progLeft = nextMeta ? `${deals} of ${nextThreshold} deals` : `${deals} deals closed`
  const progRight = nextMeta ? `${moreNeeded} more deals` : 'Max tier'
  const bottomTitle = nextMeta ? nextMeta.name : 'Platinum Realtor'
  const bottomSub = nextMeta ? `${moreNeeded} more closed deals required` : "You've unlocked every benefit"

  // Top stepper markers reflect real achievement.
  const markers = TIER_META.map((m) => ({
    left: m.pos,
    color: currentTier >= m.idx ? '#16A34A' : '#D1D5DB',
    label: currentTier >= m.idx ? `${m.short} ✓` : m.short,
  }))

  // Build tier cards from live stats.
  const tiers = TIER_META.map((m) => {
    const achieved = currentTier >= m.idx
    const isCurrent = currentTier === m.idx
    const locked = currentTier < m.idx
    const threshold = dealThreshold[m.idx]
    const dealsToUnlock = Math.max(0, threshold - deals)

    let cardStyle = { ...cardBase, borderLeft: `3px solid ${isCurrent ? '#16A34A' : '#E5E7EB'}` }
    if (locked) cardStyle = { ...cardStyle, opacity: 0.88 }

    let statusStyle = achievedStatus
    let statusText = '✓ Achieved'
    let statusDot = false
    if (isCurrent) {
      statusStyle = currentStatus
      statusText = 'Your current badge'
      statusDot = true
    } else if (locked) {
      statusStyle = lockedStatus
      statusText = `🔒 ${dealsToUnlock} deals to unlock`
    }

    let reqs
    if (m.idx === 0) {
      reqs = [reqDone('New approved realtor account'), reqDone('License verified by Waseet')]
    } else if (m.idx === 1) {
      reqs = [
        req('5 leads submitted, or 1 deal closed', silverAchieved),
        req(`You have ${deals} deal${deals === 1 ? '' : 's'} · ${leads} lead${leads === 1 ? '' : 's'}`, silverAchieved),
      ]
    } else if (m.idx === 2) {
      reqs = [
        req(`3 deals closed (you have ${deals})`, deals >= 3),
        req('All previous requirements met', silverAchieved),
      ]
    } else {
      reqs = [
        { label: '10 deals closed', color: deals >= 10 ? '#16A34A' : '#D97706', textColor: '#374151', icon: deals >= 10 ? check : circle, hasBar: true, barLabel: `${deals} / 10`, barPct: Math.min(100, Math.round((deals / 10) * 100)) },
        req('All previous requirements met', goldAchieved),
      ]
    }

    const unlocks = m.unlocks.map((u) => (achieved ? unlockDone(u) : unlockLocked(u)))

    let hasNote = false
    let note = ''
    let noteColor = '#374151'
    if (isCurrent && m.idx > 0) {
      hasNote = true
      note = `Achieved ${joinedLabel(user?.createdAt)} · ${deals} deal${deals === 1 ? '' : 's'} closed total`
      noteColor = '#15803D'
    } else if (m.idx === currentTier + 1) {
      hasNote = true
      note = `🎯 Close ${dealsToUnlock} more deal${dealsToUnlock === 1 ? '' : 's'} to unlock ${m.short} and all its exclusive benefits.`
      noteColor = '#374151'
    }

    return { ...m, cardStyle, statusStyle, statusText, statusDot, reqs, unlocks, hasNote, note, noteColor }
  })

  const perfStats = [
    { icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', value: String(leads), label: 'Leads · All time' },
    { icon: 'M8 11l3 3 5-6M20 6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z', value: String(deals), label: 'Deals · All time' },
    { icon: 'M19 5L5 19M6.5 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', value: conversion, label: 'Conversion' },
    { icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10', value: moneyLabel(totalEarned), label: 'Total earned' },
  ]

  const perks = currentMeta.unlocks.slice(0, 3)

  return (
    <>
      <style>{bpKeyframes}</style>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span onClick={() => navigate('/realtor/profile')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer', whiteSpace: 'nowrap' }}>My Profile</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2} style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6" /></svg>
            <span style={{ fontSize: 13, color: colors.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Badge Progress</span>
          </div>
        }
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="wa-hide-sm" style={{ fontSize: 11, color: colors.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8}><path d="M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.8-3.4L23 10M1 14l4.7 4.4A9 9 0 0 0 20.5 15" /></svg>
              Updated in real time
            </span>
            <button onClick={() => setCelebrating(true)} style={{ height: 30, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer' }}>▶ Preview celebration</button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {loading ? (
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '60px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading your badge progress…</div>
        ) : (
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* HERO */}
          <div className="pd-cols" style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 20px', borderRight: `1px solid ${colors.surfaceMuted}` }}>
              <div style={{ fontSize: 56, marginBottom: 8, lineHeight: 1 }}>{currentMeta.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>{currentMeta.name}</div>
              <div style={{ fontSize: 12, color: colors.textFaint }}>Since {joinedLabel(user?.createdAt)}</div>
              <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                {[[String(deals), 'Deals'], [String(leads), 'Leads'], [conversion, 'Conversion']].map(([v, l]) => (
                  <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{v}</span>
                    <span style={{ fontSize: 10, color: colors.textFaint, marginTop: 2 }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{progTitle}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: colors.textMuted }}>{progLeft}</span>
                <span style={{ fontSize: 12, color: colors.green, fontWeight: 500 }}>{progRight}</span>
              </div>
              <div style={{ position: 'relative', marginBottom: 28 }}>
                <div style={{ background: colors.surfaceMuted, height: 8, borderRadius: 999, overflow: 'hidden' }}><div style={{ background: colors.green, height: '100%', width: `${pct}%`, transition: 'width 600ms ease' }} /></div>
                {markers.map((m) => (
                  <div key={m.label} style={{ position: 'absolute', top: -2, left: m.left, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', border: `2px solid ${m.color}` }} />
                    <span style={{ fontSize: 9, color: colors.textFaint, marginTop: 4, whiteSpace: 'nowrap' }}>{m.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 24 }}>{nextEmoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{bottomTitle}</div>
                  <div style={{ fontSize: 12, color: colors.textSoft }}>{bottomSub}</div>
                </div>
              </div>
            </div>
          </div>

          {/* TIER CARDS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {tiers.map((t) => (
              <div key={t.name} style={t.cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 28 }}>{t.emoji}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>{t.tagline}</div>
                    </div>
                  </div>
                  <span style={t.statusStyle}>
                    {t.statusDot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', animation: 'bp-pulse-dot 1.6s infinite' }} />}
                    {t.statusText}
                  </span>
                </div>
                <div style={{ padding: '14px 18px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Requirements</div>
                    {t.reqs.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth={2} style={{ flexShrink: 0 }}><path d={r.icon} /></svg>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, color: r.textColor }}>{r.label}</span>
                          {r.hasBar && (
                            <div style={{ marginTop: 5 }}>
                              <div style={{ fontSize: 11, color: '#D97706', marginBottom: 3 }}>{r.barLabel}</div>
                              <div style={{ background: colors.surfaceMuted, height: 3, borderRadius: 999, overflow: 'hidden', maxWidth: 120 }}><div style={{ background: colors.green, height: '100%', width: `${r.barPct}%` }} /></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>What you unlock</div>
                    {t.unlocks.map((u, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={u.color} strokeWidth={2} style={{ flexShrink: 0 }}><path d={u.icon} /></svg>
                        <span style={{ fontSize: 12, color: u.textColor }}>{u.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {t.hasNote && (
                  <div style={{ margin: '0 18px 14px' }}>
                    <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: t.noteColor, lineHeight: 1.5 }}>{t.note}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PERFORMANCE */}
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>My Performance</span>
              <span style={{ height: 30, padding: '0 10px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                Last 30 days <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {perfStats.map((p) => (
                <div key={p.label} style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: colors.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8}><path d={p.icon} /></svg>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{p.value}</div>
                  <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 2 }}>{p.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.surfaceMuted}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 10 }}>Recent milestones</div>
              {milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={1.8} style={{ flexShrink: 0 }}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM5 9H3a2 2 0 0 1-2-2V5h4M19 9h2a2 2 0 0 0 2-2V5h-4" /></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{m.date}</div>
                  </div>
                  <span style={{ fontSize: 14 }}>{m.emoji}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
        )}
      </div>

      {/* CELEBRATION OVERLAY */}
      {celebrating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', padding: '0 20px' }}>
          {confetti.map((c, i) => (
            <span key={i} className="bp-confetti" style={{ left: c.left, background: c.background, animationDuration: c.animationDuration, animationDelay: c.animationDelay }} />
          ))}
          <div style={{ fontSize: 80, lineHeight: 1, animation: 'bp-badge-pop 600ms ease' }}>{currentMeta.emoji}</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginTop: 16, marginBottom: 4 }}>Congratulations!</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>You've reached {currentMeta.name}!</div>
          <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '18px 24px', marginBottom: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>You've unlocked:</div>
            {perks.map((p) => (
              <div key={p} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} style={{ flexShrink: 0 }}><path d="M20 6L9 17l-5-5" /></svg>
                <span style={{ fontSize: 13, color: '#fff' }}>{p}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setCelebrating(false)} style={{ height: 48, padding: '0 28px', background: colors.green, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Continue to Dashboard</button>
          <div onClick={() => setCelebrating(false)} style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12, cursor: 'pointer' }}>Dismiss</div>
        </div>
      )}
    </>
  )
}
