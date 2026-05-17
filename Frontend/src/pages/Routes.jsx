import { useMemo, useState } from 'react'
import MapView from '../components/MapView'
import { transportRoutes } from '../data'

const popularRoutes = [
  { label: 'Dhaka → Cox’s Bazar', from: 'Dhaka', to: 'Cox’s Bazar' },
  { label: 'Dhaka → Sundarbans', from: 'Dhaka', to: 'Sundarbans' },
  { label: 'Dhaka → Sajek', from: 'Dhaka', to: 'Sajek Valley' },
]

const modes = ['Bus', 'Train', 'Launch', 'Air', 'Mixed']

export default function Routes() {
  const [from, setFrom] = useState('Dhaka')
  const [to, setTo] = useState('Cox’s Bazar')
  const [mode, setMode] = useState('Bus')

  const results = useMemo(() => {
    return transportRoutes.filter((route) => {
      const matchesFrom = route.from === from
      const matchesTo = route.to === to
      const matchesMode = mode === 'Mixed' ? true : route.mode === mode
      return matchesFrom && matchesTo && matchesMode
    })
  }, [from, to, mode])

  const selected = results[0] || transportRoutes.find((route) => route.from === from && route.to === to)
  const path = selected?.path || []

  return (
    <main className="page-shell page-routes">
      <section className="routes-hero">
        <span className="eyebrow">Route & fare guide</span>
        <h1>Compare transport routes and choose the best way to travel.</h1>
        <div className="route-search-panel">
          <label>
            From
            <input value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To
            <input value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label>
            Mode
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {modes.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="popular-routes">
        <h2>Popular routes</h2>
        <div className="route-pill-row">
          {popularRoutes.map((item) => (
            <button key={item.label} type="button" className="pill" onClick={() => { setFrom(item.from); setTo(item.to)}}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="routes-main">
        <div className="routes-results">
          <h2>Results</h2>
          {results.length ? (
            <div className="route-table">
              <div className="route-table-head">
                <span>Operator</span>
                <span>Fare</span>
                <span>Duration</span>
                <span>Departure</span>
                <span>Class</span>
              </div>
              {results.map((route) => (
                <div key={route.id} className="route-table-row">
                  <span>{route.operator}</span>
                  <span>৳{route.fare}</span>
                  <span>{route.duration}</span>
                  <span>{route.departure}</span>
                  <span>{route.travelClass}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No exact matches found. Try selecting another mode or route.</p>
          )}
        </div>

        <div className="route-sidepanel">
          <div className="detail-card">
            <h2>Interactive route map</h2>
            <MapView path={path} />
          </div>
          {selected && (
            <div className="detail-card">
              <h2>Fare comparison</h2>
              <div className="fare-grid">
                <div>
                  <strong>Mode</strong>
                  <p>{selected.mode}</p>
                </div>
                <div>
                  <strong>Fare</strong>
                  <p>৳{selected.fare}</p>
                </div>
                <div>
                  <strong>Duration</strong>
                  <p>{selected.duration}</p>
                </div>
              </div>
            </div>
          )}
          {selected && (
            <div className="detail-card">
              <h2>Travel tips</h2>
              <p>{selected.tips}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
