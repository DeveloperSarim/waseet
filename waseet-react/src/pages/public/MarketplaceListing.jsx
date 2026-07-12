import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { useHover } from '../../hooks/useHover'
import { realtorApi } from '../../lib/api'
import { cityImage } from '../../lib/cityImages'
import { PublicUserMenu } from '../../components/PublicUserMenu'
import { useAuth } from '../../context/AuthContext'
import { portalNavLinks } from '../../lib/portalNav'
import { fmtPriceRange, bedText, sizeText, projLoc, matchesFilters, sortProjects, SORT_OPTS } from '../../lib/projectFormat'

const coverFallback = `linear-gradient(135deg, ${colors.greenDarker} 0%, ${colors.ink} 100%)`
const cats = ['All projects', 'Apartments', 'Villas', 'Offices', 'Townhouses', 'Land']
const commissionOptions = [{ label: 'Any commission', value: '' }, { label: '2%+', value: '2' }, { label: '3%+', value: '3' }, { label: '4%+', value: '4' }]
const priceOptions = [{ label: 'Any price', value: 'any' }, { label: 'Under SAR 1M', value: 'u1' }, { label: 'SAR 1M – 5M', value: '1-5' }, { label: 'SAR 5M+', value: '5p' }]
const PAGE_SIZE = 12

function isNew(p) {
  if (!p.createdAt) return false
  return Date.now() - new Date(p.createdAt).getTime() < 14 * 864e5
}

function TopNavLink({ label, active, onClick }) {
  const [h, hp] = useHover()
  return (
    <span {...hp} onClick={onClick} style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active || h ? colors.ink : colors.textSoft, cursor: 'pointer', position: 'relative' }}>
      {label}
      {active && <span style={{ position: 'absolute', bottom: -19, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: colors.green }} />}
    </span>
  )
}

// Compact dropdown used across the filter bar.
function Dropdown({ label, options, value, onChange, accent }) {
  const [open, setOpen] = useState(false)
  const [h, hp] = useHover()
  const active = accent || (value !== '' && value !== 'any' && value != null && !String(label).startsWith('All') && label !== 'Any commission' && label !== 'Any price')
  return (
    <div style={{ position: 'relative' }}>
      <div {...hp} onClick={() => setOpen((o) => !o)} style={{ height: 34, border: `1px solid ${active ? colors.green : colors.border}`, borderRadius: 7, padding: '0 12px', fontSize: 12, color: active ? colors.greenDark : colors.textMuted, fontWeight: active ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: h && !active ? colors.surfaceAlt : '#fff', whiteSpace: 'nowrap' }}>
        {label}
        <Icon name="chevronDown" size={11} color={active ? colors.green : colors.textFaint} strokeWidth={2} />
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 29 }} />
          <div style={{ position: 'absolute', top: 38, left: 0, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 180, zIndex: 30, padding: 4 }}>
            {options.map((o) => (
              <div key={String(o.value)} onClick={() => { onChange(o.value); setOpen(false) }} style={{ height: 34, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', borderRadius: 6, fontSize: 13, color: colors.textMuted, cursor: 'pointer' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: o.value === value ? colors.green : 'transparent' }} />{o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Tab({ label, active, onClick }) {
  const [h, hp] = useHover()
  return (
    <div {...hp} onClick={onClick} style={{ padding: '10px 16px 12px', fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer', color: active ? colors.ink : h ? colors.textMuted : colors.textSoft, fontWeight: active ? 600 : 400, borderBottom: `2px solid ${active ? colors.ink : 'transparent'}`, marginBottom: -1 }}>
      {label}
    </div>
  )
}

function ListingCard({ p, navigate, onToggleSave }) {
  const [hovered, hoverProps] = useHover()
  const photo = p.image || cityImage(p.city)
  const beds = bedText(p)
  const size = sizeText(p)
  const handover = p.details?.handover
  return (
    <div
      {...hoverProps}
      onClick={() => navigate('/marketplace/' + p.id)}
      style={{ background: '#fff', border: `1px solid ${hovered ? colors.borderStrong : colors.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.06)' : 'none', transform: hovered ? 'translateY(-2px)' : 'none', transition: 'all 200ms ease' }}
    >
      <div style={{ height: 180, background: coverFallback, position: 'relative' }}>
        {photo && <img src={photo} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5 }}>
          {p.commissionPct >= 4 && <span style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, color: colors.greenDark, borderRadius: 999, padding: '3px 8px', fontSize: 10, fontWeight: 600 }}>TOP COMMISSION</span>}
          {isNew(p) && <span style={{ background: '#FEF9EC', border: '1px solid #F3E2B8', color: '#92763A', borderRadius: 999, padding: '3px 8px', fontSize: 10, fontWeight: 600 }}>NEW</span>}
        </div>
        <div
          onClick={(e) => { e.stopPropagation(); onToggleSave?.(p) }}
          style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, background: 'rgba(255,255,255,0.92)', border: `1px solid ${colors.border}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: hovered || p.saved ? 1 : 0, transition: 'opacity 150ms' }}
        >
          <Icon name="bookmark" size={15} color={p.saved ? colors.green : colors.textSoft} strokeWidth={1.8} />
        </div>
        {p.commissionPct != null && <span style={{ position: 'absolute', bottom: 10, right: 10, background: colors.ink, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>{p.commissionPct}% Commission</span>}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
          <Icon name="mapPin" size={12} color={colors.textFaint} strokeWidth={2} />
          <span style={{ fontSize: 12, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{projLoc(p)}</span>
        </div>
        {p.developerName && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: colors.textSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.developerName}</span>
            <Icon name="checkCircle" size={12} color={colors.green} strokeWidth={2} />
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{fmtPriceRange(p)}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {p.type && <span style={{ background: colors.surfaceMuted, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500, color: colors.textMuted }}>{p.type}</span>}
          {beds && <span style={{ background: colors.surfaceMuted, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500, color: colors.textMuted }}>{beds}</span>}
          {size && <span style={{ background: colors.surfaceMuted, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500, color: colors.textMuted }}>{size}</span>}
          {handover && <span style={{ background: colors.greenTint, color: colors.greenDark, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{handover}</span>}
        </div>
      </div>
    </div>
  )
}

export default function MarketplaceListing() {
  const navigate = useNavigate()
  const { user } = useAuth() || {}
  const navLinks = portalNavLinks(user?.role)
  const [params, setParams] = useSearchParams()

  // Filters seeded from the URL (so the marketplace hero can deep-link here).
  const [search, setSearch] = useState(params.get('q') || '')
  const [city, setCity] = useState(params.get('city') || 'All cities')
  const [cat, setCat] = useState(params.get('cat') || 'All projects')
  const [commission, setCommission] = useState(params.get('commission') || '')
  const [price, setPrice] = useState(params.get('price') || 'any')
  const [sort, setSort] = useState('Newest first')
  const [sortOpen, setSortOpen] = useState(false)
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    realtorApi
      .listProjects()
      .then((list) => { if (active) setItems(Array.isArray(list) ? list : []) })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Keep the URL in sync so the state survives refresh / share / back button.
  useEffect(() => {
    const next = {}
    if (search) next.q = search
    if (city !== 'All cities') next.city = city
    if (cat !== 'All projects') next.cat = cat
    if (commission) next.commission = commission
    if (price !== 'any') next.price = price
    setParams(next, { replace: true })
    setPage(1)
  }, [search, city, cat, commission, price]) // eslint-disable-line

  const cityTabs = useMemo(() => ['All cities', ...Array.from(new Set(items.map((p) => p.city).filter(Boolean)))], [items])
  const cityDropOptions = useMemo(() => cityTabs.map((c) => ({ label: c, value: c })), [cityTabs])

  const filtered = useMemo(() => {
    const f = { city, cat, commission, price, q: search }
    return sortProjects(items.filter((p) => matchesFilters(p, f)), sort)
  }, [items, city, cat, commission, price, search, sort])

  const toggleSave = (p) => {
    const next = !p.saved
    setItems((list) => list.map((x) => (x.id === p.id ? { ...x, saved: next } : x)))
    const call = next ? realtorApi.saveProject(p.id) : realtorApi.unsaveProject(p.id)
    call.catch(() => setItems((list) => list.map((x) => (x.id === p.id ? { ...x, saved: !next } : x))))
  }

  const pages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const commissionText = commission ? `${commission}%+ Commission` : 'Commission %'
  const priceText = price === 'any' ? 'Price range' : priceOptions.find((o) => o.value === price)?.label || 'Price range'

  // Carry the current filters into the dedicated map-search page.
  const openMap = () => {
    const q = new URLSearchParams()
    if (search) q.set('q', search)
    if (city !== 'All cities') q.set('city', city)
    if (cat !== 'All projects') q.set('cat', cat)
    if (commission) q.set('commission', commission)
    if (price !== 'any') q.set('price', price)
    navigate('/marketplace/map' + (q.toString() ? `?${q}` : ''))
  }

  const gridBtn = (active) => ({ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: active ? '#fff' : colors.textFaint, background: active ? colors.ink : '#fff' })

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: colors.ink, background: colors.bg, minHeight: '100vh' }}>
      {/* Navbar */}
      <div style={{ height: 56, minHeight: 56, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', position: 'sticky', top: 0, zIndex: 40 }}>
        <Link to="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" /><circle cx="12" cy="11" r="2.4" /></svg>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>waseet</span>
          <span style={{ fontSize: 11, color: colors.textFaint, marginLeft: 2 }}>وسيط</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="wa-hide-sm">
          <TopNavLink label="Marketplace" active onClick={() => navigate('/marketplace')} />
          {navLinks.map((l) => (
            <TopNavLink key={l.to} label={l.label} onClick={() => navigate(l.to)} />
          ))}
        </div>
        <PublicUserMenu />
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300, minWidth: 180 }}>
          <Icon name="search" size={14} color={colors.textFaint} strokeWidth={2} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects, developers, cities…" style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit', color: colors.ink }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Dropdown label={city} value={city} options={cityDropOptions} onChange={setCity} />
          <Dropdown label={cat === 'All projects' ? 'Property type' : cat} value={cat} options={cats.map((c) => ({ label: c, value: c }))} onChange={setCat} />
          <Dropdown label={commissionText} value={commission} options={commissionOptions} onChange={setCommission} accent />
          <Dropdown label={priceText} value={price} options={priceOptions} onChange={setPrice} />
        </div>
        <div style={{ width: 1, height: 20, background: colors.border, margin: '0 2px' }} />
        <div style={{ position: 'relative' }}>
          <div onClick={() => setSortOpen(!sortOpen)} style={{ height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 12px', fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            {sort}<Icon name="chevronDown" size={11} color={colors.textFaint} strokeWidth={2} />
          </div>
          {sortOpen && (
            <>
              <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 29 }} />
              <div style={{ position: 'absolute', top: 38, right: 0, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: 210, zIndex: 30, padding: 4 }}>
                {SORT_OPTS.map((o) => (
                  <div key={o} onClick={() => { setSort(o); setSortOpen(false) }} style={{ height: 34, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', borderRadius: 6, fontSize: 13, color: colors.textMuted, cursor: 'pointer' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: o === sort ? colors.green : 'transparent' }} />{o}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden' }}>
          <div onClick={() => setView('grid')} style={gridBtn(view === 'grid')} title="Grid view"><Icon name="grid" size={15} color="currentColor" strokeWidth={2} /></div>
          <div onClick={() => setView('list')} style={gridBtn(view === 'list')} title="List view"><Icon name="list" size={15} color="currentColor" strokeWidth={2} /></div>
          <div onClick={openMap} style={gridBtn(false)} title="Map view"><Icon name="mapPin" size={15} color="currentColor" strokeWidth={2} /></div>
        </div>
        <span style={{ fontSize: 12, color: colors.textSoft, marginLeft: 'auto' }}>{filtered.length} project{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {/* City tabs */}
      <div className="pd-tabs" style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 24px', display: 'flex', overflowX: 'auto' }}>
        {cityTabs.map((t) => <Tab key={t} label={t} active={city === t} onClick={() => setCity(t)} />)}
      </div>
      {/* Category tabs */}
      <div className="pd-tabs" style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 24px', display: 'flex', overflowX: 'auto' }}>
        {cats.map((t) => <Tab key={t} label={t} active={cat === t} onClick={() => setCat(t)} />)}
      </div>

      {/* Cards */}
      <div style={{ background: colors.bg, padding: '20px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: colors.textSoft, fontSize: 13 }}>Loading projects…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: colors.textSoft }}>
            <Icon name="search" size={28} color={colors.textFaint} style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>No projects found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters or search.</div>
          </div>
        ) : view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {pageItems.map((p) => <ListingCard key={p.id} p={p} navigate={navigate} onToggleSave={toggleSave} />)}
          </div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {pageItems.map((p) => {
              const photo = p.image || cityImage(p.city)
              return (
                <div key={p.id} onClick={() => navigate('/marketplace/' + p.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: `1px solid ${colors.surfaceMuted}`, cursor: 'pointer' }}>
                  <div style={{ width: 48, height: 40, minWidth: 48, borderRadius: 6, background: coverFallback, overflow: 'hidden', position: 'relative' }}>
                    {photo && <img src={photo} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <span style={{ flex: 2, minWidth: 0, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                  <span style={{ flex: 1, fontSize: 12, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{projLoc(p)}</span>
                  {p.type && <span style={{ background: colors.surfaceMuted, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500, color: colors.textMuted, whiteSpace: 'nowrap' }}>{p.type}</span>}
                  {bedText(p) && <span style={{ background: colors.surfaceMuted, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500, color: colors.textMuted, whiteSpace: 'nowrap' }}>{bedText(p)}</span>}
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'right' }}>{fmtPriceRange(p)}</span>
                  {p.commissionPct != null && <span style={{ background: colors.ink, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{p.commissionPct}%</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination — only when there is more than one page */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12, color: colors.textSoft }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} projects
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}`, borderRadius: 7, cursor: 'pointer', background: '#fff', color: colors.textMuted }}>‹</span>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <span key={n} onClick={() => setPage(n)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, fontSize: 13, fontWeight: n === page ? 600 : 400, border: n === page ? 'none' : `1px solid ${colors.border}`, background: n === page ? colors.ink : '#fff', color: n === page ? '#fff' : colors.textMuted, cursor: 'pointer' }}>{n}</span>
              ))}
              <span onClick={() => setPage((p) => Math.min(pages, p + 1))} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}`, borderRadius: 7, cursor: 'pointer', background: '#fff', color: colors.textMuted }}>›</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
