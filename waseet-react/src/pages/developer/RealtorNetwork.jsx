import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { developerApi } from '../../lib/api'
import { countryName, initials } from '../../lib/adminFormat'

const convPct = (leads, deals) => {
  const l = Number(leads) || 0
  const d = Number(deals) || 0
  if (l <= 0) return '0%'
  return `${((d / l) * 100).toFixed(1).replace(/\.0$/, '')}%`
}

export default function RealtorNetwork() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [realtors, setRealtors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await developerApi.network()
        if (!alive) return
        setRealtors(data || [])
      } catch { /* leave empty */ }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [])

  const withDeals = realtors.filter((r) => (Number(r.deals) || 0) > 0)
  const tabDefs = [['All', realtors.length], ['With Deals', withDeals.length]]

  let visible = tab === 'With Deals' ? withDeals : realtors
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    visible = visible.filter((r) => (r.name || '').toLowerCase().includes(q))
  }

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Realtor Network</span>
            <span style={{ fontSize: 13, color: colors.textFaint }}>{realtors.length} active realtor{realtors.length === 1 ? '' : 's'}</span>
          </div>
        }
        actions={<span style={{ fontSize: 12, color: colors.textFaint, textAlign: 'right', maxWidth: 200, lineHeight: 1.4 }}>Realtors who submitted leads on your projects</span>}
      />

      {/* FILTER BAR */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 280, position: 'relative' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by realtor name..." style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden', marginLeft: 12 }}>
          {tabDefs.map(([id, count]) => {
            const on = tab === id
            return (
              <div key={id} onClick={() => setTab(id)} style={{ padding: '0 14px', height: 34, display: 'flex', alignItems: 'center', fontSize: 12, cursor: 'pointer', ...(on ? { background: colors.ink, color: '#fff' } : { background: '#fff', color: colors.textSoft }) }}>{id} ({count})</div>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '56px 20px', fontSize: 13, color: colors.textFaint }}>Loading realtors…</div>
        )}

        {!loading && visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={1.6} style={{ marginBottom: 12 }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No realtors yet</div>
            <div style={{ fontSize: 13, color: colors.textSoft, marginTop: 6 }}>Realtors who submit leads on your projects will appear here.</div>
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, alignItems: 'start' }}>
            {visible.map((r) => (
              <div key={r.realtorId} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: colors.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials(r.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{r.name}</span>
                      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8}><path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" /><circle cx="12" cy="11" r="2" /></svg><span style={{ fontSize: 11, color: colors.textFaint }}>{[r.city, countryName(r.country)].filter(Boolean).join(' · ')}</span></span>
                      {r.agency && <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg><span style={{ fontSize: 11, color: colors.textFaint }}>{r.agency}</span></span>}
                      {r.license && <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h4M7 13h6M15 8h2M15 12h2" /></svg><span style={{ fontSize: 11, color: colors.textFaint }}>License {r.license}</span></span>}
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${colors.surfaceMuted}`, marginBottom: 12 }} />
                <div style={{ display: 'flex', border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', borderRight: `1px solid ${colors.surfaceMuted}` }}><span style={{ fontSize: 15, fontWeight: 700 }}>{r.leads}</span><span style={{ fontSize: 9, color: colors.textFaint, marginTop: 2 }}>Leads</span></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', borderRight: `1px solid ${colors.surfaceMuted}` }}><span style={{ fontSize: 15, fontWeight: 700 }}>{r.deals}</span><span style={{ fontSize: 9, color: colors.textFaint, marginTop: 2 }}>Deals</span></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}><span style={{ fontSize: 15, fontWeight: 700 }}>{convPct(r.leads, r.deals)}</span><span style={{ fontSize: 9, color: colors.textFaint, marginTop: 2 }}>Conv.</span></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                  <button onClick={() => navigate('/developer/leads')} style={{ flex: 1, height: 32, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', cursor: 'pointer' }}><span style={{ fontSize: 11, color: colors.textMuted }}>View Leads</span><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: 12, color: colors.textSoft }}>Showing 1–{visible.length} of {visible.length} realtors</span>
          </div>
        )}
      </div>
    </>
  )
}
