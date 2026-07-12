import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { statusTones } from '../../data/mock'
import { realtorApi } from '../../lib/api'
import { countryName, initials } from '../../lib/adminFormat'

const offPlan = { background: '#FEF9EC', borderRadius: 5, padding: '2px 8px', fontSize: 11, color: '#92763A', fontWeight: 500 }
const ready = { background: '#F0FDF4', borderRadius: 5, padding: '2px 8px', fontSize: 11, color: '#15803D', fontWeight: 500 }
const underC = { background: '#F3F4F6', borderRadius: 5, padding: '2px 8px', fontSize: 11, color: '#374151', fontWeight: 500 }

// map the project status to one of the design's pill styles via its tone
const toneStyle = { green: ready, amber: offPlan, gray: underC, blue: underC, red: underC }
const pillFor = (status) => toneStyle[statusTones[status]] || underC

const money = (n) => (typeof n === 'number' ? `SAR ${n.toLocaleString()}` : null)
const priceRange = (p) => {
  if (typeof p.priceFrom === 'number' && typeof p.priceTo === 'number') return `${money(p.priceFrom)}–${p.priceTo.toLocaleString()}`
  return money(p.priceFrom) || money(p.priceTo) || '—'
}

const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 9px)'

export default function SavedProjects() {
  const navigate = useNavigate()
  const [view, setView] = useState('grid')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const isGrid = view === 'grid'

  useEffect(() => {
    let alive = true
    realtorApi
      .listSaved()
      .then((rows) => { if (alive) setProjects(rows || []) })
      .catch(() => { if (alive) setProjects([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const unsave = async (id) => {
    const prev = projects
    setProjects((cur) => cur.filter((p) => p.id !== id)) // optimistic removal
    try {
      await realtorApi.unsaveProject(id)
    } catch {
      setProjects(prev) // restore on failure
    }
  }

  const openListing = (p) => { if (p.mapLink) window.open(p.mapLink, '_blank', 'noopener') }

  const q = search.trim().toLowerCase()
  const cards = projects.filter(
    (p) => !q || (p.title || '').toLowerCase().includes(q) || (p.city || '').toLowerCase().includes(q) || (p.developerName || '').toLowerCase().includes(q),
  )

  const segActive = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, cursor: 'pointer', background: '#0A0A0A', color: '#fff' }
  const segIdle = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, cursor: 'pointer', background: '#fff', color: '#9CA3AF' }

  const filterChip = { height: 34, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#fff' }

  const chevron = (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
  const checkCircle = (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  )

  const locationOf = (p) => p.location || `${p.city || ''}${p.country ? `, ${countryName(p.country)}` : ''}`

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Saved Projects</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{projects.length} saved</span>
          </div>
        }
        actions={
          <button
            onClick={() => navigate('/realtor/browse')}
            style={{ height: 34, padding: '0 14px', background: colors.green, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            Browse marketplace →
          </button>
        }
      />

      {/* FILTER BAR */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 260, position: 'relative' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search saved projects..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <span style={filterChip}>City {chevron}</span>
        <span style={filterChip}>Type {chevron}</span>
        <span style={{ ...filterChip, marginLeft: 'auto' }}>Recently saved {chevron}</span>
        <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden' }}>
          <span onClick={() => setView('grid')} style={isGrid ? segActive : segIdle}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </span>
          <span onClick={() => setView('list')} style={!isGrid ? segActive : segIdle}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: colors.textSoft, fontSize: 13 }}>Loading saved projects…</div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: colors.textSoft }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.6} style={{ display: 'block', margin: '0 auto 12px' }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>No saved projects yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Browse the marketplace and bookmark projects to see them here.</div>
          </div>
        ) : (
          <>
            {/* GRID VIEW */}
            {isGrid && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, gridAutoRows: '1fr' }}>
                {cards.map((c) => (
                  <div key={c.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 200ms', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 180, background: '#F3F4F6', backgroundImage: c.image ? undefined : hatch, position: 'relative', overflow: 'hidden' }}>
                      {c.image && <img src={c.image} alt={c.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <div
                        onClick={() => unsave(c.id)}
                        style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <svg width={15} height={15} viewBox="0 0 24 24" fill="#16A34A" stroke="#16A34A" strokeWidth={1.5}>
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div style={{ position: 'absolute', bottom: 10, right: 10, background: '#0A0A0A', borderRadius: 6, padding: '4px 10px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{c.commissionPct}% Commission</span>
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{c.title}</div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8}>
                          <path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" />
                          <circle cx="12" cy="11" r="2" />
                        </svg>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{locationOf(c)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#F3F4F6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 600, color: '#374151' }}>{initials(c.developerName)}</span>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>{c.developerName}</span>
                        {checkCircle}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{priceRange(c)}</div>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
                        {c.type && <span style={{ background: '#F3F4F6', borderRadius: 5, padding: '2px 8px', fontSize: 11, color: '#374151', fontWeight: 500 }}>{c.type}</span>}
                        {c.bedrooms != null && <span style={{ background: '#F3F4F6', borderRadius: 5, padding: '2px 8px', fontSize: 11, color: '#374151', fontWeight: 500 }}>{c.bedrooms} BR</span>}
                        {c.status && <span style={pillFor(c.status)}>{c.status}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        <button onClick={() => openListing(c)} style={{ flex: 1, height: 32, background: '#16A34A', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>Submit Lead</button>
                        <button onClick={() => openListing(c)} style={{ flex: 1, height: 32, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: '#374151', fontFamily: 'inherit', cursor: 'pointer' }}>View Project</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LIST VIEW */}
            {!isGrid && (
              <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {cards.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: '1px solid #F3F4F6', minHeight: 60 }}>
                    <div style={{ width: 52, height: 38, borderRadius: 6, background: '#F3F4F6', backgroundImage: c.image ? undefined : 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 8px)', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, ...(c.image ? { backgroundImage: `url(${c.image})` } : {}) }} />
                    <div style={{ flex: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{locationOf(c)}</div>
                    </div>
                    <div style={{ flex: 0.8, display: 'flex', gap: 5 }}>
                      {c.type && <span style={{ background: '#F3F4F6', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: '#374151' }}>{c.type}</span>}
                    </div>
                    <div style={{ flex: 0.5, textAlign: 'center' }}>
                      <span style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', borderRadius: 4, padding: '3px 8px', fontSize: 13, fontWeight: 700 }}>{c.commissionPct}%</span>
                    </div>
                    <div style={{ flex: 0.8, fontSize: 12, color: '#9CA3AF' }}>{priceRange(c)}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span onClick={() => openListing(c)} style={{ height: 28, padding: '0 8px', background: '#16A34A', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>Submit Lead</span>
                      <svg onClick={() => unsave(c.id)} width={16} height={16} viewBox="0 0 24 24" fill="#16A34A" stroke="#16A34A" strokeWidth={1.5} style={{ cursor: 'pointer' }}>
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Showing {cards.length} of {projects.length} saved projects</span>
            </div>
          </>
        )}
      </div>
    </>
  )
}
