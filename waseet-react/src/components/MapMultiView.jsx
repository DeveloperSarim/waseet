import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { colors } from '../theme/tokens'

const pin = (color) => L.divIcon({
  className: 'wa-pin',
  html: `<svg width="26" height="34" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.4 18.6 0 12 0z" fill="${color}"/><circle cx="12" cy="12" r="4.5" fill="#fff"/></svg>`,
  iconSize: [26, 34],
  iconAnchor: [13, 34],
})
const GREEN = pin('#16A34A')
const DARK = pin('#0A0A0A')

// Plots every project (with coords) as a marker; fits bounds; selecting one
// pans to it. onSelect(id) fires when a marker is clicked.
export function MapMultiView({ projects = [], selectedId, onSelect, height = '100%' }) {
  const el = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef({})

  const pts = projects.filter((p) => p.latitude != null && p.longitude != null)

  // init map once
  useEffect(() => {
    if (mapRef.current || !el.current) return
    const map = L.map(el.current, { center: [24.7136, 46.6753], zoom: 5, scrollWheelZoom: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map)
    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 60)
    return () => { map.remove(); mapRef.current = null; markersRef.current = {} }
  }, [])

  // (re)draw markers when the project set changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}
    if (!pts.length) return
    const bounds = []
    pts.forEach((p) => {
      const m = L.marker([p.latitude, p.longitude], { icon: p.id === selectedId ? GREEN : DARK }).addTo(map)
      m.bindPopup(`<b>${p.title || 'Project'}</b><br>${p.city || ''}`)
      m.on('click', () => onSelect && onSelect(p.id))
      markersRef.current[p.id] = m
      bounds.push([p.latitude, p.longitude])
    })
    if (bounds.length === 1) map.setView(bounds[0], 13)
    else map.fitBounds(bounds, { padding: [40, 40] })
    setTimeout(() => map.invalidateSize(), 60)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.map((p) => p.id).join(',')])

  // highlight + pan to the selected marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    Object.entries(markersRef.current).forEach(([id, m]) => m.setIcon(id === selectedId ? GREEN : DARK))
    const sel = pts.find((p) => p.id === selectedId)
    if (sel) { map.panTo([sel.latitude, sel.longitude]); markersRef.current[selectedId]?.openPopup() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <div ref={el} style={{ height: '100%', width: '100%', zIndex: 0 }} />
      {pts.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: colors.textFaint, background: colors.surfaceMuted }}>No project locations to show yet.</div>
      )}
    </div>
  )
}

export default MapMultiView
