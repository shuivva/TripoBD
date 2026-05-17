import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export default function MapView({ center = [23.7, 90.4], zoom = 6, pins = [], path = [], height = '380px' }) {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('leaflet-map', { zoomControl: false }).setView(center, zoom)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)
      mapRef.current = map
    }

    const map = mapRef.current
    map.invalidateSize()
    if (pins.length) {
      const layerGroup = L.layerGroup()
      pins.forEach((pin) => {
        L.marker(pin.coords)
          .addTo(layerGroup)
          .bindPopup(`<strong>${pin.label}</strong><br/>${pin.description || ''}`)
      })
      layerGroup.addTo(map)
      map.fitBounds(layerGroup.getBounds(), { padding: [24, 24], maxZoom: 10 })
      return () => {
        map.removeLayer(layerGroup)
      }
    }

    if (path.length) {
      const polyline = L.polyline(path, { color: 'var(--accent)' }).addTo(map)
      map.fitBounds(polyline.getBounds(), { padding: [24, 24] })
      return () => {
        map.removeLayer(polyline)
      }
    }
  }, [center, zoom, pins.length, path.length, JSON.stringify(pins), JSON.stringify(path)])

  return <div id="leaflet-map" style={{ height, width: '100%', borderRadius: '18px' }} />
}
