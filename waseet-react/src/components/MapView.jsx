import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { colors } from '../theme/tokens'

const pinIcon = L.divIcon({
  className: 'wa-pin',
  html: '<svg width="28" height="38" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.4 18.6 0 12 0z" fill="#16A34A"/><circle cx="12" cy="12" r="4.5" fill="#fff"/></svg>',
  iconSize: [28, 38],
  iconAnchor: [14, 38],
})

// Read-only map with a single marker. Renders nothing if no coords.
export function MapView({ lat, lng, label, height = 260, mapLink }) {
  const el = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (lat == null || lng == null || !el.current || mapRef.current) return
    const map = L.map(el.current, { center: [lat, lng], zoom: 15, scrollWheelZoom: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map)
    const m = L.marker([lat, lng], { icon: pinIcon }).addTo(map)
    if (label) m.bindPopup(label)
    setTimeout(() => map.invalidateSize(), 50)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  if (lat == null || lng == null) return null

  return (
    <div>
      <div ref={el} style={{ height, width: '100%', borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}`, zIndex: 0 }} />
      <a
        href={mapLink || `https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: colors.greenDark, textDecoration: 'none' }}
      >
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.greenDark} strokeWidth={1.9}><path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>
        Open in Google Maps ↗
      </a>
    </div>
  )
}

export default MapView
