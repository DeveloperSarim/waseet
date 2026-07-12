import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { useHover } from '../../hooks/useHover'
import { realtorApi } from '../../lib/api'
import { cityImage } from '../../lib/cityImages'
import { MapMultiView } from '../../components/MapMultiView'
import { PublicUserMenu } from '../../components/PublicUserMenu'
import { fmtPriceRange, bedText, sizeText, projLoc, matchesFilters, sortProjects, SORT_OPTS } from '../../lib/projectFormat'

const coverFallback = `linear-gradient(135deg, ${colors.greenDarker} 0%, ${colors.ink} 100%)`
const cats = ['All projects', 'Apartments', 'Villas', 'Offices', 'Townhouses', 'Land']
const commissionOptions = [{ label: 'Any commission', value: '' }, { label: '2%+', value: '2' }, { label: '3%+', value: '3' }, { label: '4%+', value: '4' }]
const priceOptions = [{ label: 'Any price', value: 'any' }, { label: 'Under SAR 1M', value: 'u1' }, { label: 'SAR 1M – 5M', value: '1-5' }, { label: 'SAR 5M+', value: '5p' }]

// Compact filter dropdown (mirrors the listing page control).
function Dropdown({ label, options, value, onChange, accent }) {
  const [open, setOpen] = useState(false)
  const [h, hp] = useHover()
  const active = accent || (value !== '' && value !== 'any' && value != null && !String(label).startsWith('All') && !String(label).startsWith('Any'))
  return (
    <div style={{ position: 'relative' }}>
      <div {...hp} onClick={() => setOpen((o) => !o)} style={{ height: 32, border: `1px solid ${active ? colors.green : colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12, color: active ? colors.greenDark : colors.textMuted, fontWeight: active ? 600 : 400, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', background: h && !active ? colors.surfaceAlt : '#fff', whiteSpace: 'nowrap' }}>
        {label}
        <Icon name="chevronDown" size={10} color={active ? colors.green : colors.textFaint} strokeWidth={2} />
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
          <div style={{ position: 'absolute', top: 36, left: 0, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 170, zIndex: 50, padding: 4 }}>
            {options.map((o) => (
              <div key={String(o.value)} onClick={() => { onChange(o.value); setOpen(false) }} style={{ height: 32, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', borderRadius: 6, fontSize: 13, color: colors.textMuted, cursor: 'pointer' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: o.value === value ? colors.green : 'transparent' }} />{o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// One row in the right-hand results list.
function MapListRow({ p, selected, onSelect, onOpen, innerRef }) {
  const [h, hp] = useHover()
  const photo = p.image || cityImage(p.city)
  const beds = bedText(p)
  const size = sizeText(p)
  return (
    <div
      ref={innerRef}
      {...hp}
      onClick={() => onSelect(p.id)}
      style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 10, cursor: 'pointer', border: `1px solid ${selected ? colors.green : h ? colors.borderStrong : colors.border}`, background: selected ? colors.greenTint : '#fff', boxShadow: selected ? '0 2px 10px rgba(0,0,0,0.05)' : 'none', transition: 'border-color 120ms, background 120ms' }}
    >
      <div style={{ width: 96, height: 84, minWidth: 96, borderRadius: 8, background: coverFallback, position: 'relative', overflow: 'hidden' }}>
        {photo && <img src={photo} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        {p.commissionPct != null && <span style={{ position: 'absolute', bottom: 5, left: 5, background: colors.ink, borderRadius: 5, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: '#fff' }}>{p.commissionPct}%</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
          <Icon name="bookmark" size={14} color={p.saved ? colors.green : colors.textFaint} strokeWidth={1.8} />
        </div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', margin: '2px 0 4px' }}>
          <Icon name="mapPin" size={11} color={colors.textFaint} strokeWidth={2} />
          <span style={{ fontSize: 11, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{projLoc(p)}</span>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>{fmtPriceRange(p)}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {p.type && <span style={{ background: colors.surfaceMuted, borderRadius: 4, padding: '1px 6px', fontSize: 10.5, fontWeight: 500, color: colors.textMuted }}>{p.type}</span>}
          {beds && <span style={{ background: colors.surfaceMuted, borderRadius: 4, padding: '1px 6px', fontSize: 10.5, fontWeight: 500, color: colors.textMuted }}>{beds}</span>}
          {size && <span style={{ background: colors.surfaceMuted, borderRadius: 4, padding: '1px 6px', fontSize: 10.5, fontWeight: 500, color: colors.textMuted }}>{size}</span>}
          <span onClick={(e) => { e.stopPropagation(); onOpen(p.id) }} style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: colors.greenDark, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
            View <Icon name="arrowRight" size={11} color={colors.greenDark} strokeWidth={2.2} />
          </span>
        </div>
      </div>
    </div>
  )
}

export default function MarketplaceMap() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const [search, setSearch] = useState(params.get('q') || '')
  const [city, setCity] = useState(params.get('city') || 'All cities')
  const [cat, setCat] = useState(params.get('cat') || 'All projects')
  const [commission, setCommission] = useState(params.get('commission') || '')
  const [price, setPrice] = useState(params.get('price') || 'any')
  const [sort, setSort] = useState('Newest first')
  const [sortOpen, setSortOpen] = useState(false)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const rowRefs = useRef({})

  useEffect(() => {
    let active = true
    realtorApi
      .listProjects()
      .then((list) => { if (active) setItems(Array.isArray(list) ? list : []) })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const next = {}
    if (search) next.q = search
    if (city !== 'All cities') next.city = city
    if (cat !== 'All projects') next.cat = cat
    if (commission) next.commission = commission
    if (price !== 'any') next.price = price
    setParams(next, { replace: true })
  }, [search, city, cat, commission, price]) // eslint-disable-line

  const cityOptions = useMemo(() => ['All cities', ...Array.from(new Set(items.map((p) => p.city).filter(Boolean)))].map((c) => ({ label: c, value: c })), [items])

  const filtered = useMemo(() => {
    const f = { city, cat, commission, price, q: search }
    return sortProjects(items.filter((p) => matchesFilters(p, f)), sort)
  }, [items, city, cat, commission, price, search, sort])

  const mapped = filtered.filter((p) => p.latitude != null && p.longitude != null)

  // Clicking a marker highlights + scrolls its card into view.
  const handleSelect = (id) => {
    setSelectedId(id)
    const el = rowRefs.current[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const commissionText = commission ? `${commission}%+` : 'Commission %'
  const priceText = price === 'any' ? 'Price range' : priceOptions.find((o) => o.value === price)?.label || 'Price range'

  const backToList = () => {
    const q = new URLSearchParams(params)
    navigate('/browse' + (q.toString() ? `?${q}` : ''))
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: colors.ink, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: colors.bg }}>
      {/* Top bar */}
      <div style={{ minHeight: 56, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: '#fff', zIndex: 60 }}>
        <Link to="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" /><circle cx="12" cy="11" r="2.4" /></svg>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: colors.ink }}>waseet</span>
        </Link>
        <div style={{ width: 1, height: 22, background: colors.border }} />
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 280, minWidth: 150 }}>
          <Icon name="search" size={14} color={colors.textFaint} strokeWidth={2} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search area, project…" style={{ width: '100%', height: 32, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit', color: colors.ink }} />
        </div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} className="wa-hide-sm">
          <Dropdown label={city} value={city} options={cityOptions} onChange={setCity} />
          <Dropdown label={cat === 'All projects' ? 'Property type' : cat} value={cat} options={cats.map((c) => ({ label: c, value: c }))} onChange={setCat} />
          <Dropdown label={commissionText} value={commission} options={commissionOptions} onChange={setCommission} accent />
          <Dropdown label={priceText} value={price} options={priceOptions} onChange={setPrice} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={backToList} style={{ height: 32, padding: '0 12px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="list" size={14} color={colors.textSoft} strokeWidth={2} /> List view
          </button>
          <PublicUserMenu />
        </div>
      </div>

      {/* Split body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Map */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', background: colors.surfaceMuted }}>
          {mapped.length > 0 ? (
            <MapMultiView projects={mapped} selectedId={selectedId} onSelect={handleSelect} height="100%" />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textSoft, gap: 8 }}>
              <Icon name="mapPin" size={30} color={colors.textFaint} strokeWidth={1.6} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>No mapped projects</div>
              <div style={{ fontSize: 12 }}>None of the matching projects have a location set yet.</div>
            </div>
          )}
          {/* Count pill overlay */}
          <div style={{ position: 'absolute', top: 12, left: 12, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: colors.ink, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 500 }}>
            {mapped.length} on map · {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Results panel */}
        <div style={{ width: 400, minWidth: 400, maxWidth: '46vw', borderLeft: `1px solid ${colors.border}`, background: colors.bg, display: 'flex', flexDirection: 'column' }} className="wa-map-panel">
          {/* Panel header + sort */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>{filtered.length} project{filtered.length === 1 ? '' : 's'}</div>
              <div style={{ fontSize: 11, color: colors.textFaint }}>{city === 'All cities' ? 'All cities' : city}{cat !== 'All projects' ? ` · ${cat}` : ''}</div>
            </div>
            <div style={{ position: 'relative' }}>
              <div onClick={() => setSortOpen(!sortOpen)} style={{ height: 32, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {sort}<Icon name="chevronDown" size={11} color={colors.textFaint} strokeWidth={2} />
              </div>
              {sortOpen && (
                <>
                  <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                  <div style={{ position: 'absolute', top: 36, right: 0, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 200, zIndex: 50, padding: 4 }}>
                    {SORT_OPTS.map((o) => (
                      <div key={o} onClick={() => { setSort(o); setSortOpen(false) }} style={{ height: 32, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', borderRadius: 6, fontSize: 13, color: colors.textMuted, cursor: 'pointer' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: o === sort ? colors.green : 'transparent' }} />{o}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scrollable results */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: colors.textSoft, fontSize: 13 }}>Loading projects…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: colors.textSoft }}>
                <Icon name="search" size={26} color={colors.textFaint} style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>No projects match</div>
                <div style={{ fontSize: 12, marginTop: 3 }}>Adjust your filters to see more.</div>
              </div>
            ) : (
              filtered.map((p) => (
                <MapListRow
                  key={p.id}
                  p={p}
                  selected={p.id === selectedId}
                  onSelect={setSelectedId}
                  onOpen={(id) => navigate('/marketplace/' + id)}
                  innerRef={(el) => { rowRefs.current[p.id] = el }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
