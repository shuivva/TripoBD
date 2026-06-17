import { useEffect, useRef } from 'react'

const BD_SPOTS = [
  { label: "Cox's Bazar",         description: "World's longest sea beach · Beach",       coords: [21.4272, 92.0058] },
  { label: "Sundarbans",          description: "UNESCO Mangrove Forest · Forest",         coords: [21.9497, 89.1833] },
  { label: "Sajek Valley",        description: "Misty hill valley · Hill Tracts",         coords: [23.3826, 92.2936] },
  { label: "Bandarban",           description: "Tallest peaks of BD · Hill Tracts",       coords: [22.1953, 92.2184] },
  { label: "Sreemangal",          description: "Tea capital of Bangladesh · Forest",      coords: [24.3060, 91.7288] },
  { label: "Rangamati",           description: "Lake district & CHT · Hill Tracts",       coords: [22.6522, 92.1715] },
  { label: "Kuakata",             description: "Sunrise & sunset beach · Beach",          coords: [21.8644, 90.1202] },
  { label: "Paharpur",            description: "Buddhist Vihara ruins · Heritage",        coords: [25.0307, 88.9767] },
  { label: "Ahsan Manzil",        description: "Pink Palace, Dhaka · Heritage",           coords: [23.7107, 90.4066] },
  { label: "Lalbagh Fort",        description: "Mughal fort, Dhaka · Heritage",           coords: [23.7181, 90.3888] },
  { label: "Haor Wetlands",       description: "Floating villages & birds · Haor",       coords: [24.5700, 91.3500] },
  { label: "Kaptai Lake",         description: "Largest artificial lake · Hill Tracts",   coords: [22.5000, 92.2200] },
  { label: "Mahasthangarh",       description: "Oldest city ruins · Heritage",            coords: [24.9700, 89.3700] },
  { label: "Sylhet City",         description: "Tea gardens & Shrines · City Tour",       coords: [24.8949, 91.8687] },
  { label: "Ratargul Swamp",      description: "Freshwater swamp forest · Forest",       coords: [25.0100, 91.9500] },
  { label: "Tanguar Haor",        description: "Ramsar wetland site · Haor",             coords: [25.1600, 91.0400] },
  { label: "Saint Martin Island", description: "Only coral island of BD · Beach",        coords: [20.6270, 92.3190] },
  { label: "Khulna City",         description: "Gateway to Sundarbans · City Tour",      coords: [22.8456, 89.5403] },
  { label: "Patenga Beach",       description: "Chittagong sea beach · Beach",           coords: [22.2350, 91.8340] },
  { label: "Jaflong",             description: "Stone-clear river & hills · Hill Tracts", coords: [25.1667, 92.2167] },
]

const CAT_COLOR = {
  Beach:         '#2196f3',
  Forest:        '#4caf50',
  'Hill Tracts': '#ff9800',
  Heritage:      '#9c27b0',
  'City Tour':   '#f44336',
  Haor:          '#00bcd4',
  Hill:          '#ff9800',
  default:       '#5b8cff',
}

function getCatColor(desc = '') {
  for (const [k, c] of Object.entries(CAT_COLOR)) {
    if (desc.includes(k)) return c
  }
  return CAT_COLOR.default
}

function svgMarker(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <filter id="s"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,.3)"/></filter>
    <path filter="url(#s)" d="M16 2C9.4 2 4 7.4 4 14c0 9 12 26 12 26s12-17 12-26C28 7.4 22.6 2 16 2z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="14" r="5" fill="white" opacity=".9"/>
  </svg>`
}

export default function MapView({ pins, path }) {
  const mapRef     = useRef(null)
  const instance   = useRef(null)
  const markers    = useRef([])
  const polyline   = useRef(null)

  const spots = (pins && pins.length > 0) ? pins : (!path ? BD_SPOTS : [])

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const l = document.createElement('link')
      l.id = 'leaflet-css'; l.rel = 'stylesheet'
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(l)
    }

    const init = (L) => {
      if (!instance.current) {
        const map = L.map(mapRef.current, {
          center: [23.7, 90.4], zoom: 7,
          minZoom: 6, maxZoom: 16,
        })
        map.setMaxBounds([[19.5, 87.5],[27.0, 93.5]])
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap', maxZoom: 19,
        }).addTo(map)
        instance.current = map
      }
      update(L)
    }

    const update = (L) => {
      const map = instance.current
      if (!map) return

      markers.current.forEach(m => map.removeLayer(m))
      markers.current = []
      if (polyline.current) { map.removeLayer(polyline.current); polyline.current = null }

      // Route path line - validate each coordinate pair
      const validPath = (path || []).filter(coord => 
        Array.isArray(coord) && 
        coord.length >= 2 && 
        typeof coord[0] === 'number' && !isNaN(coord[0]) &&
        typeof coord[1] === 'number' && !isNaN(coord[1])
      )

      if (validPath.length >= 2) {
        polyline.current = L.polyline(validPath, {
          color: '#10b981', weight: 4, opacity: .85, dashArray: '8 6',
        }).addTo(map)

        // endpoint markers
        validPath.forEach((coord, i) => {
          const isStart = i === 0
          const icon = L.divIcon({
            className: '',
            html: svgMarker(isStart ? '#10b981' : '#e63946'),
            iconSize: [32,42], iconAnchor: [16,42], popupAnchor: [0,-44],
          })
          const m = L.marker(coord, { icon }).addTo(map)
          markers.current.push(m)
        })
        try {
          const bounds = L.polyline(validPath).getBounds()
          if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
            map.fitBounds(bounds.pad(0.25))
          }
        } catch (e) {
          console.warn('Polyline bounds error:', e)
        }
        return
      }

      // Spot pins
      spots.forEach(({ label, description='', coords }) => {
        if (!coords || coords.length < 2) return
        const lat = parseFloat(coords[0])
        const lng = parseFloat(coords[1])
        if (isNaN(lat) || isNaN(lng)) return
        
        const color = getCatColor(description)
        const icon = L.divIcon({
          className: '',
          html: svgMarker(color),
          iconSize: [32,42], iconAnchor: [16,42], popupAnchor: [0,-44],
        })
        const m = L.marker([lat, lng], { icon })
          .bindPopup(`
            <div style="font-family:'Segoe UI',sans-serif;min-width:150px;padding:4px 0">
              <div style="font-weight:700;font-size:.9rem;color:#020617;margin-bottom:3px">${label}</div>
              <div style="font-size:.78rem;color:#51606a;line-height:1.5">${description}</div>
              <div style="margin-top:6px;display:inline-block;padding:2px 9px;border-radius:999px;
                background:${color};color:white;font-size:.7rem;font-weight:700">
                ${description.split('·')[1]?.trim() || 'Spot'}
              </div>
            </div>
          `, { maxWidth:220, className:'bd-popup' })
          .addTo(map)
        markers.current.push(m)
      })

      if (pins && pins.length > 0 && markers.current.length > 0) {
        try {
          const bounds = L.featureGroup(markers.current).getBounds()
          if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
            map.fitBounds(bounds.pad(0.2))
          }
        } catch (e) {
          console.warn('Leaflet fitBounds error:', e)
        }
      }
    }

    let cleanupScript = null

    if (window.L) {
      init(window.L)
    } else {
      let script = document.getElementById('leaflet-js')
      if (!script) {
        script = document.createElement('script')
        script.id = 'leaflet-js'
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        document.body.appendChild(script)
      }
      const onLoad = () => init(window.L)
      script.addEventListener('load', onLoad)
      cleanupScript = () => {
        script.removeEventListener('load', onLoad)
      }
    }

    return () => {
      if (cleanupScript) cleanupScript()
    }
  }, [spots, path])

  useEffect(() => () => {
    if (instance.current) { instance.current.remove(); instance.current = null }
  }, [])

  return (
    <div className="bd-map-shell">
      {!path && (
        <div className="bd-map-legend">
          {Object.entries(CAT_COLOR).filter(([k]) => k !== 'default').map(([cat, color]) => (
            <span key={cat} className="bd-legend-item">
              <span className="bd-legend-dot" style={{ background: color }} />
              {cat}
            </span>
          ))}
        </div>
      )}
      <div ref={mapRef} className="bd-map-container" />
      <style>{`
        .bd-map-shell {
          width: 100%;
          border-radius: var(--radius, 16px);
          overflow: hidden;
          border: 1px solid var(--border, rgba(20,30,60,.06));
          box-shadow: var(--elev, 0 8px 30px rgba(12,20,40,.08));
          background: #f0f4f8;
          position: relative;
          /* ── KEY FIX: isolate stacking context so leaflet z-indexes don't bleed into navbar ── */
          isolation: isolate;
          z-index: 0;
        }
        .bd-map-container { width:100%; height:400px; }
        @media(max-width:768px){ .bd-map-container { height:300px; } }

        .bd-map-legend {
          display:flex; flex-wrap:wrap; gap:.4rem 1rem;
          padding:.6rem 1rem; background:rgba(255,255,255,.96);
          border-bottom:1px solid var(--border,rgba(20,30,60,.06));
        }
        .bd-legend-item {
          display:flex; align-items:center; gap:5px;
          font-size:.75rem; font-weight:600; color:#51606a;
        }
        .bd-legend-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }

        .bd-popup .leaflet-popup-content-wrapper {
          border-radius:12px !important;
          box-shadow:0 8px 24px rgba(0,0,0,.15) !important;
        }
        .bd-popup .leaflet-popup-content { margin:10px 14px !important; }
        .leaflet-container { font-family:'Segoe UI',sans-serif !important; }
      `}</style>
    </div>
  )
}