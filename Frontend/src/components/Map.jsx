import { useEffect, useRef } from 'react'

/*
  Props:
    pins: Array<{
      label: string,
      description: string,
      coords: [lat, lng]
    }>
*/

// Bangladesh tour spot fallback data shown when no pins passed
const BD_SPOTS = [
  { label: "Cox's Bazar",        description: "World's longest sea beach · Beach",      coords: [21.4272, 92.0058] },
  { label: "Sundarbans",         description: "UNESCO Mangrove Forest · Forest",        coords: [21.9497, 89.1833] },
  { label: "Sajek Valley",       description: "Misty hill valley · Hill Tracts",        coords: [23.3826, 92.2936] },
  { label: "Bandarban",          description: "Tallest peaks of BD · Hill Tracts",      coords: [22.1953, 92.2184] },
  { label: "Sreemangal",         description: "Tea capital of Bangladesh · Forest",     coords: [24.3060, 91.7288] },
  { label: "Rangamati",          description: "Lake district & CHT · Hill Tracts",      coords: [22.6522, 92.1715] },
  { label: "Kuakata",            description: "Sunrise & sunset beach · Beach",         coords: [21.8644, 90.1202] },
  { label: "Paharpur",           description: "Buddhist Vihara ruins · Heritage",       coords: [25.0307, 88.9767] },
  { label: "Ahsan Manzil",       description: "Pink Palace, Dhaka · Heritage",          coords: [23.7107, 90.4066] },
  { label: "Lalbagh Fort",       description: "Mughal fort, Dhaka · Heritage",          coords: [23.7181, 90.3888] },
  { label: "Hatirjheel",         description: "Urban lake & walkway · City Tour",       coords: [23.7526, 90.4000] },
  { label: "Haor Wetlands",      description: "Floating villages & birds · Haor",      coords: [24.5700, 91.3500] },
  { label: "Kaptai Lake",        description: "Largest artificial lake · Hill Tracts",  coords: [22.5000, 92.2200] },
  { label: "Mahasthangarh",      description: "Oldest city ruins · Heritage",           coords: [24.9700, 89.3700] },
  { label: "Sylhet City",        description: "Tea gardens & Shrines · City Tour",      coords: [24.8949, 91.8687] },
  { label: "Ratargul Swamp",     description: "Freshwater swamp forest · Forest",      coords: [25.0100, 91.9500] },
  { label: "Tanguar Haor",       description: "Ramsar wetland site · Haor",            coords: [25.1600, 91.0400] },
  { label: "Saint Martin Island",description: "Only coral island of BD · Beach",       coords: [20.6270, 92.3190] },
  { label: "Khulna City",        description: "Gateway to Sundarbans · City Tour",     coords: [22.8456, 89.5403] },
  { label: "Patenga Beach",      description: "Chittagong sea beach · Beach",          coords: [22.2350, 91.8340] },
]

// Category → color map
const CAT_COLOR = {
  Beach:      '#2196f3',
  Forest:     '#4caf50',
  'Hill Tracts': '#ff9800',
  Heritage:   '#9c27b0',
  'City Tour':'#f44336',
  Haor:       '#00bcd4',
  Hill:       '#ff9800',
  default:    '#5b8cff',
}

function getCatColor(description = '') {
  for (const [key, color] of Object.entries(CAT_COLOR)) {
    if (description.includes(key)) return color
  }
  return CAT_COLOR.default
}

function svgMarker(color) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <filter id="shadow" x="-30%" y="-10%" width="160%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
      <path filter="url(#shadow)"
        d="M16 2C9.37 2 4 7.37 4 14c0 9 12 26 12 26s12-17 12-26C28 7.37 22.63 2 16 2z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="14" r="5" fill="white" opacity="0.9"/>
    </svg>
  `
}

export default function MapView({ pins }) {
  const mapRef    = useRef(null)
  const instanceRef = useRef(null)
  const markersRef  = useRef([])

  const spots = (pins && pins.length > 0) ? pins : BD_SPOTS

  useEffect(() => {
    // Load Leaflet CSS once
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id   = 'leaflet-css'
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const initMap = (L) => {
      if (instanceRef.current) {
        // Map already init — just update markers
        updateMarkers(L)
        return
      }

      const map = L.map(mapRef.current, {
        center: [23.7, 90.4],   // Bangladesh center
        zoom: 7,
        minZoom: 6,
        maxZoom: 16,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      // Restrict pan to Bangladesh bounds (roughly)
      map.setMaxBounds([
        [19.5, 87.5],
        [27.0, 93.5],
      ])

      // Tile layer — OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      instanceRef.current = map
      updateMarkers(L)
    }

    const updateMarkers = (L) => {
      const map = instanceRef.current
      if (!map) return

      // Remove old markers
      markersRef.current.forEach((m) => map.removeLayer(m))
      markersRef.current = []

      spots.forEach(({ label, description = '', coords }) => {
        if (!coords || coords.length < 2) return
        const color = getCatColor(description)

        const icon = L.divIcon({
          className: '',
          html: svgMarker(color),
          iconSize:   [32, 42],
          iconAnchor: [16, 42],
          popupAnchor:[0, -44],
        })

        const marker = L.marker(coords, { icon })
          .bindPopup(`
            <div style="
              font-family: 'Segoe UI', sans-serif;
              min-width: 160px;
              padding: 4px 0;
            ">
              <div style="
                font-weight: 700;
                font-size: 0.95rem;
                color: #020617;
                margin-bottom: 4px;
              ">${label}</div>
              <div style="
                font-size: 0.8rem;
                color: #51606a;
                line-height: 1.5;
              ">${description}</div>
              <div style="
                margin-top: 8px;
                display: inline-block;
                padding: 3px 10px;
                border-radius: 999px;
                background: ${color};
                color: white;
                font-size: 0.72rem;
                font-weight: 600;
              ">${description.split('·')[1]?.trim() || 'Spot'}</div>
            </div>
          `, {
            maxWidth: 240,
            className: 'bd-popup',
          })
          .addTo(map)

        markersRef.current.push(marker)
      })

      // Fit map to all markers if custom pins passed
      if (pins && pins.length > 0 && markersRef.current.length > 0) {
        try {
          const group = L.featureGroup(markersRef.current)
          const bounds = group.getBounds()
          if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
            map.fitBounds(bounds.pad(0.2))
          }
        } catch (e) {
          console.warn('Leaflet fitBounds error in Map.jsx:', e)
        }
      }
    }

    // Load Leaflet JS
    if (window.L) {
      initMap(window.L)
    } else {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => initMap(window.L)
      document.body.appendChild(script)
    }

    return () => {
      // Don't destroy map on re-render — only on full unmount
    }
  }, [spots])

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="bd-map-shell">
      {/* Legend */}
      <div className="bd-map-legend">
        {Object.entries(CAT_COLOR).filter(([k]) => k !== 'default').map(([cat, color]) => (
          <span key={cat} className="bd-legend-item">
            <span className="bd-legend-dot" style={{ background: color }} />
            {cat}
          </span>
        ))}
      </div>

      {/* Map container */}
      <div ref={mapRef} className="bd-map-container" />

      <style>{`
        .bd-map-shell {
          width: 100%;
          border-radius: var(--radius, 20px);
          overflow: hidden;
          border: 1px solid var(--border, rgba(20,30,60,0.06));
          box-shadow: var(--elev, 0 8px 30px rgba(12,20,40,0.08));
          background: #f0f4f8;
          position: relative;
        }
        .bd-map-container {
          width: 100%;
          height: 560px;
        }
        @media (max-width: 768px) {
          .bd-map-container { height: 420px; }
        }
        @media (max-width: 480px) {
          .bd-map-container { height: 320px; }
        }

        /* Legend bar */
        .bd-map-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1.2rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255,255,255,0.96);
          border-bottom: 1px solid var(--border, rgba(20,30,60,0.06));
          backdrop-filter: blur(8px);
        }
        .bd-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #51606a;
          white-space: nowrap;
        }
        .bd-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Leaflet popup style override */
        .bd-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
          padding: 0 !important;
        }
        .bd-popup .leaflet-popup-content {
          margin: 12px 16px !important;
        }
        .bd-popup .leaflet-popup-tip {
          box-shadow: none !important;
        }
        .leaflet-container {
          font-family: 'Segoe UI', sans-serif !important;
        }
      `}</style>
    </div>
  )
}