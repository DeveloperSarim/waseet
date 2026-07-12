import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { colors } from '../theme/tokens'

// Red pin as an inline SVG divIcon (avoids Leaflet's broken default-marker paths).
const pinIcon = L.divIcon({
  className: 'wa-pin',
  html: '<svg width="30" height="40" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.4 18.6 0 12 0z" fill="#DC2626"/><circle cx="12" cy="12" r="4.5" fill="#fff"/></svg>',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
})

const DEFAULT = { lat: 24.7136, lng: 46.6753 } // Riyadh

// Extract lat/lng from a pasted Google Maps URL or a raw "lat,lng" string.
export function parseLatLng(input) {
  if (!input) return null
  const s = String(input).trim()
  const pats = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, // .../@21.54,39.17,15z
    /[?&](?:q|query|ll|center|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // ?q=lat,lng
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // !3dlat!4dlng
    /^\s*(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)\s*$/, // bare "lat,lng"
  ]
  for (const p of pats) {
    const m = s.match(p)
    if (m) {
      const lat = parseFloat(m[1]); const lng = parseFloat(m[2])
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }
    }
  }
  return null
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { Accept: 'application/json' } })
    const d = await res.json()
    return d.display_name || null
  } catch { return null }
}

const inputStyle = { width: '100%', height: 38, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '0 12px 0 34px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }

// value: { lat, lng, address } | null ; onChange(value)
export function MapPicker({ value, onChange, height = 300 }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [linkInput, setLinkInput] = useState('')
  const [linkErr, setLinkErr] = useState('')
  const [busy, setBusy] = useState(false)

  const setPoint = async (lat, lng, addr, { pan = true } = {}) => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
      if (pan) mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 14))
    }
    const address = addr ?? (await reverseGeocode(lat, lng))
    onChange && onChange({ lat: +lat.toFixed(6), lng: +lng.toFixed(6), address })
  }

  // init map once
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return
    const start = value?.lat != null ? [value.lat, value.lng] : [DEFAULT.lat, DEFAULT.lng]
    const map = L.map(mapEl.current, { center: start, zoom: value?.lat != null ? 15 : 11, scrollWheelZoom: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map)
    const marker = L.marker(start, { icon: pinIcon, draggable: true }).addTo(map)
    marker.on('dragend', () => { const p = marker.getLatLng(); setPoint(p.lat, p.lng) })
    map.on('click', (e) => setPoint(e.latlng.lat, e.latlng.lng, null, { pan: false }))
    mapRef.current = map
    markerRef.current = marker
    // Leaflet needs a size recalc once its container is laid out
    setTimeout(() => map.invalidateSize(), 50)
    return () => { map.remove(); mapRef.current = null; markerRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep marker synced if value changes externally
  useEffect(() => {
    if (value?.lat != null && markerRef.current) markerRef.current.setLatLng([value.lat, value.lng])
  }, [value?.lat, value?.lng])

  const doSearch = async (e) => {
    e?.preventDefault?.()
    if (!search.trim()) return
    setBusy(true); setResults([])
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(search)}`, { headers: { Accept: 'application/json' } })
      setResults(await res.json())
    } catch { setResults([]) } finally { setBusy(false) }
  }

  const pickResult = (r) => { setResults([]); setSearch(r.display_name); setPoint(parseFloat(r.lat), parseFloat(r.lon), r.display_name) }

  const applyLink = () => {
    setLinkErr('')
    const p = parseLatLng(linkInput)
    if (!p) { setLinkErr('Could not read coordinates. Paste a full Google Maps link or "lat,lng".'); return }
    setPoint(p.lat, p.lng)
  }

  return (
    <div>
      {/* search */}
      <form onSubmit={doSearch} style={{ position: 'relative', marginBottom: 8 }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for an address, area or landmark…" style={inputStyle} />
        {results.length > 0 && (
          <div style={{ position: 'absolute', top: 42, left: 0, right: 0, zIndex: 1000, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto' }}>
            {results.map((r) => (
              <div key={r.place_id} onClick={() => pickResult(r)} style={{ padding: '8px 12px', fontSize: 12, color: colors.textMuted, cursor: 'pointer', borderBottom: `1px solid ${colors.surfaceMuted}` }} onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceMuted)} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>{r.display_name}</div>
            ))}
          </div>
        )}
      </form>

      {/* paste google maps link */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={linkInput} onChange={(e) => { setLinkInput(e.target.value); setLinkErr('') }} placeholder="Paste Google Maps link or lat,lng" style={{ ...inputStyle, padding: '0 12px' }} />
        <button type="button" onClick={applyLink} style={{ height: 38, padding: '0 14px', background: colors.ink, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>Set pin</button>
      </div>
      {linkErr && <div style={{ fontSize: 11, color: colors.red, marginBottom: 8 }}>{linkErr}</div>}

      {/* map */}
      <div ref={mapEl} style={{ height, width: '100%', borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}`, zIndex: 0 }} />

      {/* footer: coords + address */}
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.9} style={{ flexShrink: 0, marginTop: 2 }}><path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>{value?.address || 'Click on the map, drag the pin, search, or paste a Google Maps link.'}</div>
          {value?.lat != null && <div style={{ fontSize: 11, color: colors.textFaint, fontFamily: 'monospace', marginTop: 2 }}>{value.lat}, {value.lng}</div>}
        </div>
        {busy && <span style={{ fontSize: 11, color: colors.textFaint }}>Searching…</span>}
      </div>
    </div>
  )
}

export default MapPicker
