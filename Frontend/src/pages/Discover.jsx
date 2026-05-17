import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryQuickLinks } from '../data'
import MapView from '../components/MapView'
import { getDestinations, getFilters } from '../apiClient'

const initialFilter = {
  search: '',
  region: '',
  category: '',
  season: '',
  duration: '',
  budget: 200,
}

export default function Discover() {
  const [filter, setFilter] = useState(initialFilter)
  const [showMap, setShowMap] = useState(false)
  const [layout, setLayout] = useState('grid')
  const [items, setItems] = useState([])
  const [options, setOptions] = useState({ regions: [], categories: [], seasons: [], durations: [], budgets: [] })

  useEffect(() => {
    getFilters()
      .then((data) => setOptions(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const q = {}
    if (filter.search) q.search = filter.search
    if (filter.region) q.region = filter.region
    if (filter.category) q.category = filter.category
    if (filter.season) q.season = filter.season
    if (filter.duration) q.duration = filter.duration
    if (filter.budget) q.budget = filter.budget
    getDestinations(q)
      .then((data) => setItems(data))
      .catch(() => setItems([]))
  }, [filter])

  const filtered = items

  const activePins = filtered.map((item) => ({
    label: item.name,
    description: `${item.region} • ${item.category}`,
    coords: item.coords_lat && item.coords_lng ? [item.coords_lat, item.coords_lng] : (item.coords || [23.7, 90.4]),
  }))

  return (
    <main className="page-shell page-discover">
      <section className="discover-hero" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div>
          <span className="eyebrow">Destination discovery</span>
          <h1>Where do you want to go?</h1>
          <p>Search Bangladesh destinations, filter by region, category and budget, and plan your next group trip.</p>
        </div>
        <div className="hero-search" style={{ margin: '1.5rem auto 0', maxWidth: '400px', display: 'flex', gap: '8px' }}>
          <input
            style={{ flex: 1 }}
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            placeholder="Search destinations"
          />
          <button className="button button-primary">Search</button>
        </div>
      </section>

      <section className="discover-layout">
        <aside className="filter-panel">
          <div className="panel-head">
            <h2>Filters</h2>
            <button className="button button-tertiary" onClick={() => setFilter(initialFilter)}>
              Reset
            </button>
          </div>
          <label>
            Region
            <select value={filter.region} onChange={(e) => setFilter({ ...filter, region: e.target.value })}>
              <option value="">All</option>
              {(options.regions || []).map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
              <option value="">All</option>
              {categoryQuickLinks.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </label>
          <label>
            Budget range
            <input
              type="range"
              min="100"
              max="300"
              step="100"
              value={filter.budget}
              onChange={(e) => setFilter({ ...filter, budget: Number(e.target.value) })}
            />
            <span className="range-label">Up to {filter.budget} / night</span>
          </label>
          <label>
            Duration
            <select value={filter.duration} onChange={(e) => setFilter({ ...filter, duration: e.target.value })}>
              <option value="">Any</option>
              {(options.durations || []).map((duration) => (
                <option key={duration} value={duration}>{duration}</option>
              ))}
            </select>
          </label>
          <label>
            Best season
            <select value={filter.season} onChange={(e) => setFilter({ ...filter, season: e.target.value })}>
              <option value="">Any</option>
              {(options.seasons || []).map((season) => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
          </label>
          <div className="quick-links">
            <h3>Quick categories</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categoryQuickLinks.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={filter.category === item.value ? 'pill pill-active' : 'pill'}
                  onClick={() => setFilter({ ...filter, category: item.value })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="discover-content">
          <div className="discover-toolbar">
            <div className="toolbar-info">
              <span>{filtered.length} destinations found</span>
              <strong>Trending destinations this week</strong>
            </div>
            <div className="toolbar-actions">
              <button className={layout === 'grid' ? 'layout-button active' : 'layout-button'} onClick={() => setLayout('grid')}>
                Grid
              </button>
              <button className={layout === 'list' ? 'layout-button active' : 'layout-button'} onClick={() => setLayout('list')}>
                List
              </button>
              <button className="button button-secondary" onClick={() => setShowMap((value) => !value)}>
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>
          </div>

          {showMap && <MapView pins={activePins} />}

          <div className={layout === 'grid' ? 'destination-grid' : 'destination-list'}>
            {filtered.map((item) => (
              <article key={item.slug} className="destination-card">
                <div className="destination-image" style={{ backgroundImage: `url(${item.hero})` }} />
                <div className="destination-copy">
                  <span className="badge">{item.category}</span>
                  <h3>{item.name}</h3>
                  <p>{item.summary}</p>
                  <div className="destination-meta">
                    <span>{item.region}</span>
                    <span>{item.rating} ★</span>
                    <span>{item.budget} budget</span>
                  </div>
                  <Link to={`/destination/${item.slug}`} className="button button-primary">
                    Quick view
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
