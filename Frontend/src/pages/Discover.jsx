import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryQuickLinks, destinations, regionOptions, seasonOptions, durationOptions } from '../data'
import Map from '../components/Map'
import { getDestinations, getFilters, toggleWishlist } from '../apiClient'

/* ─── per-destination HD images ─── */
const DEST_IMGS = {
  'bandarban':    'https://images.pexels.com/photos/35478460/pexels-photo-35478460.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'sundarbans':   'https://images.pexels.com/photos/975771/pexels-photo-975771.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'coxs-bazar':   'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'sajek':        'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'sreemangal':   'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'dhaka':        'https://images.pexels.com/photos/3582392/pexels-photo-3582392.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'kuakata':      'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'paharpur':     'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'tangail-haor': 'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'rangamati':    'https://images.pexels.com/photos/16899181/pexels-photo-16899181.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'sylhet':       'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'chittagong':   'https://images.pexels.com/photos/35478460/pexels-photo-35478460.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'ratargul':     'https://images.pexels.com/photos/975771/pexels-photo-975771.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'lawachara':    'https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'martin':       'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1600',
}
const destImg = (d) => DEST_IMGS[d.slug] || d.hero

const initialFilter = {
  search: '',
  region: '',
  category: '',
  season: '',
  duration: '',
  budget: 300,
}

export default function Discover() {
  const [filter, setFilter] = useState(initialFilter)
  const [showMap, setShowMap] = useState(false)
  const [layout, setLayout] = useState('grid')
  const [savedCards, setSavedCards] = useState({})
  const [savingSlug, setSavingSlug] = useState(null)
  const [toast, setToast] = useState(null)
  const [items, setItems] = useState(destinations)
  const [options, setOptions] = useState({
    regions: regionOptions,
    categories: categoryQuickLinks,
    seasons: seasonOptions,
    durations: durationOptions,
    budgets: [],
  })

  // Load existing wishlist from DB on mount so hearts reflect saved state after refresh
  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) return
    fetch(`/api/traveler/${userId}/wishlist/toggle/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.saved_slugs) return
        const saved = {}
        data.saved_slugs.forEach(slug => { saved[slug] = true })
        setSavedCards(saved)
      })
      .catch(() => {})
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const toggleSave = async (slug) => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      showToast('Please sign in to save destinations', 'error')
      return
    }
    if (savingSlug === slug) return
    const wasSaved = !!savedCards[slug]
    setSavedCards(prev => ({ ...prev, [slug]: !wasSaved }))
    setSavingSlug(slug)
    try {
      const result = await toggleWishlist(userId, slug)
      const nowSaved = result.is_saved ?? !wasSaved
      setSavedCards(prev => ({ ...prev, [slug]: nowSaved }))
      showToast(nowSaved ? '\u2764\uFE0F Saved to your wishlist!' : '\uD83D\uDDD1\uFE0F Removed from wishlist')
    } catch {
      setSavedCards(prev => ({ ...prev, [slug]: wasSaved }))
      showToast('Failed to update wishlist. Try again.', 'error')
    } finally {
      setSavingSlug(null)
    }
  }

  useEffect(() => {
    getFilters().then((data) => setOptions(data)).catch(() => {})
  }, [])

  useEffect(() => {
    const q = {}
    if (filter.search)   q.search   = filter.search
    if (filter.region)   q.region   = filter.region
    if (filter.category) q.category = filter.category
    if (filter.season)   q.season   = filter.season
    if (filter.duration) q.duration = filter.duration
    if (filter.budget)   q.budget   = filter.budget
    getDestinations(q)
      .then((data) => setItems(data && data.length > 0 ? data : destinations))
      .catch(() => setItems(destinations))
  }, [filter])

  const filtered = items.filter((item) => {
    if (filter.search   && !item.name.toLowerCase().includes(filter.search.toLowerCase())) return false
    if (filter.region   && item.region   !== filter.region)   return false
    if (filter.category && item.category !== filter.category) return false
    if (filter.season   && item.season   !== filter.season)   return false
    if (filter.duration && item.duration !== filter.duration) return false
    if (filter.budget   && item.budget === 'High' && filter.budget < 250) return false
    return true
  })

  const activePins = filtered.map((item) => ({
    label: item.name,
    description: `${item.region} • ${item.category}`,
    coords: item.coords_lat && item.coords_lng
      ? [item.coords_lat, item.coords_lng]
      : item.coords || [23.7, 90.4],
  }))

  return (
    <main className="page-shell page-discover">

      {/* ── TOAST ── */}
      {toast && (
        <div className={`dv-toast dv-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* ── 1. HERO ── */}
      <section className="dv-hero">
        <div className="dv-hero-bg">
          <img
            src="https://images.pexels.com/photos/3769138/pexels-photo-3769138.jpeg"
            alt="Bangladesh landscape"
            className="dv-hero-img"
          />
          <div className="dv-hero-overlay" />
        </div>
        <div className="dv-hero-body">
          <span className="dv-eyebrow">Destination Discovery</span>
          <h1>Where do you want to go?</h1>
          <p>Search Bangladesh destinations, filter by region, category and budget, and plan your next group trip.</p>

          {/* Search bar */}
          <div className="dv-search-bar">
            <span className="dv-search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </span>
            <input
              className="dv-search-input"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              placeholder="Cox's Bazar, Sundarbans, Sajek…"
            />
            <div className="dv-search-divider" />
            <select
              className="dv-search-select"
              value={filter.region}
              onChange={(e) => setFilter({ ...filter, region: e.target.value })}
            >
              <option value="">All Regions</option>
              {(options.regions || []).map((r, idx) => (
                <option key={`${r}-${idx}`} value={r}>{r}</option>
              ))}
            </select>
            <button className="dv-search-btn">Search</button>
          </div>

          {/* Quick category pills */}
          <div className="dv-suggestions">
            {categoryQuickLinks.map((item) => (
              <button
                key={item.value}
                className={`dv-pill${filter.category === item.value ? ' dv-pill-active' : ''}`}
                onClick={() =>
                  setFilter({ ...filter, category: filter.category === item.value ? '' : item.value })
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. FILTER BAR ── */}
      <section className="dv-filter-bar">
        <div className="dv-filter-top">
          <h3 className="dv-filter-title">Filters</h3>
          <button className="dv-reset-btn" onClick={() => setFilter(initialFilter)}>Reset</button>
        </div>

        <div className="dv-filter-grid">
          <div className="dv-filter-field">
            <label>Region</label>
            <select value={filter.region} onChange={(e) => setFilter({ ...filter, region: e.target.value })}>
              <option value="">All</option>
              {(options.regions || []).map((r, idx) => (
                <option key={`${r}-${idx}`} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="dv-filter-field">
            <label>Category</label>
            <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
              <option value="">All</option>
              {categoryQuickLinks.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="dv-filter-field">
            <label>Budget range</label>
            <input
              type="range" min="100" max="300" step="50"
              value={filter.budget}
              onChange={(e) => setFilter({ ...filter, budget: Number(e.target.value) })}
            />
            <span className="dv-range-label">Up to ৳{filter.budget} / night</span>
          </div>
          <div className="dv-filter-field">
            <label>Duration</label>
            <select value={filter.duration} onChange={(e) => setFilter({ ...filter, duration: e.target.value })}>
              <option value="">Any</option>
              {(options.durations || []).map((d, idx) => (
                <option key={`${d}-${idx}`} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="dv-filter-field">
            <label>Best season</label>
            <select value={filter.season} onChange={(e) => setFilter({ ...filter, season: e.target.value })}>
              <option value="">Any</option>
              {(options.seasons || []).map((s, idx) => (
                <option key={`${s}-${idx}`} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="dv-quick-cats">
          <span className="dv-quick-label">Quick categories</span>
          <div className="dv-quick-row">
            {categoryQuickLinks.map((item) => (
              <button
                key={item.value} type="button"
                className={`dv-pill${filter.category === item.value ? ' dv-pill-active' : ''}`}
                onClick={() =>
                  setFilter({ ...filter, category: filter.category === item.value ? '' : item.value })
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. RESULTS ── */}
      <section className="dv-results">

        {/* Toolbar */}
        <div className="dv-toolbar">
          <div className="dv-toolbar-info">
            <span className="dv-toolbar-count">{filtered.length} destination{filtered.length !== 1 ? 's' : ''} found</span>
            <strong className="dv-toolbar-trend">Trending destinations this week</strong>
          </div>
          <div className="dv-toolbar-actions">
            <button
              className={`dv-layout-btn${layout === 'grid' ? ' dv-layout-active' : ''}`}
              onClick={() => setLayout('grid')}
            >⊞ Grid</button>
            <button
              className={`dv-layout-btn${layout === 'list' ? ' dv-layout-active' : ''}`}
              onClick={() => setLayout('list')}
            >☰ List</button>
            <button className="dv-map-btn" onClick={() => setShowMap((v) => !v)}>
              🗺 {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>
        </div>

        {/* Map */}
        {showMap && (
          <div className="dv-map-wrap">
            <Map pins={activePins} />
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="dv-empty">
            <div className="dv-empty-icon">🔍</div>
            <h3>No destinations found</h3>
            <p>Try adjusting your filters or search term.</p>
            <button className="dv-empty-btn" onClick={() => setFilter(initialFilter)}>
              Clear all filters
            </button>
          </div>
        )}

        {/* Grid view */}
        {layout === 'grid' && filtered.length > 0 && (
          <div className="dv-grid">
            {filtered.map((d) => {
              const img = destImg(d)
              const isSaved = !!savedCards[d.slug]
              return (
                <article key={d.slug} className="dv-card">
                  <div className="dv-card-img-wrap">
                    <div className="dv-card-img" style={{ backgroundImage: `url(${img})` }}>
                      <div className="dv-card-img-overlay" />
                      <span className="dv-card-rating">{d.rating} ★</span>
                    </div>
                  </div>
                  <div className="dv-card-content">
                    <div className="dv-card-header">
                      <h3 className="dv-card-name">{d.name}</h3>
                      <span className="dv-card-cat">{d.category}</span>
                    </div>
                    <p className="dv-card-region">📍 {d.region}</p>
                    <div className="dv-card-actions">
                      <Link to={`/destination/${d.slug}`} className="dv-card-view">View</Link>
                      <button
                        className={`dv-card-save${isSaved ? ' dv-card-saved' : ''}`}
                        onClick={() => toggleSave(d.slug)}
                      >
                        {isSaved ? '❤️' : '🤍'} Save
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* List view */}
        {layout === 'list' && filtered.length > 0 && (
          <div className="dv-list">
            {filtered.map((d) => {
              const img = destImg(d)
              const isSaved = !!savedCards[d.slug]
              return (
                <article key={d.slug} className="dv-list-card">
                  <div className="dv-list-img" style={{ backgroundImage: `url(${img})` }} />
                  <div className="dv-list-body">
                    <span className="dv-list-cat">{d.category}</span>
                    <h3>{d.name}</h3>
                    <p>{d.summary}</p>
                    <div className="dv-list-meta">
                      <span>📍 {d.region}</span>
                      <span>⭐ {d.rating}</span>
                      <span>💰 {d.budget} budget</span>
                    </div>
                    <div className="dv-list-actions">
                      <Link to={`/destination/${d.slug}`} className="dv-card-view">Quick view</Link>
                      <button
                        className={`dv-card-save${isSaved ? ' dv-card-saved' : ''}`}
                        onClick={() => toggleSave(d.slug)}
                      >
                        {isSaved ? '❤️' : '🤍'} Save
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ════════════ STYLES ════════════ */}
      <style>{`
        /* ── TOAST ── */
        .dv-toast {
          position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
          padding: .75rem 1.75rem; border-radius: 999px; font-size: .9rem; font-weight: 600;
          z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,.18);
          animation: dv-toastIn .3s ease; white-space: nowrap;
        }
        .dv-toast-success { background: linear-gradient(135deg,#10b981,#059669); color:#fff; }
        .dv-toast-error   { background: linear-gradient(135deg,#e63946,#c1121f); color:#fff; }
        @keyframes dv-toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(16px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        .dv-card-saving { opacity:.65; cursor:not-allowed; }

        /* ── HERO ── */
        .dv-hero {
          position: relative; border-radius: 1.5rem; overflow: hidden;
          min-height: 440px; display: flex; align-items: center;
          justify-content: center; text-align: center; margin-bottom: 2rem;
          box-shadow: 0 12px 48px rgba(0,0,0,.15);
        }
        .dv-hero-bg { position: absolute; inset: 0; z-index: 0; }
        .dv-hero-img {
          width: 100%; height: 100%; object-fit: cover;
          object-position: center 60%; filter: brightness(0.65) saturate(1.15);
        }
        .dv-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(6,10,40,.55) 0%, rgba(6,10,40,.35) 55%, rgba(6,10,40,.6) 100%);
        }
        .dv-hero-body {
          position: relative; z-index: 2; padding: 3rem 2rem;
          width: 100%; max-width: 780px; color: #fff;
          display: flex; flex-direction: column; align-items: center;
        }
        .dv-eyebrow {
          display: inline-block;
          background: linear-gradient(90deg,#e63946,#f4a261);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.82rem; letter-spacing:.06em; text-transform:uppercase;
        }
        .dv-hero-body h1 {
          color: #fff; font-size: clamp(1.8rem,3.5vw,2.8rem);
          margin: .5rem 0 .75rem; font-weight: 800;
        }
        .dv-hero-body p {
          color: rgba(255,255,255,.85); font-size: 1rem;
          line-height: 1.6; margin-bottom: 1.75rem; max-width: 540px;
        }

        /* search bar */
        .dv-search-bar {
          display: flex; align-items: center;
          background: rgba(255,255,255,.97); border-radius: 56px;
          padding: .35rem .35rem .35rem 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,.22);
          gap: 0; width: 100%; max-width: 680px; margin-bottom: 1rem;
        }
        .dv-search-icon { color: #888; flex-shrink:0; display:flex; align-items:center; }
        .dv-search-input {
          flex: 1; border: none; outline: none; background: transparent;
          font-size: .97rem; color: #1a1a2e; padding: .5rem .75rem; min-width: 0;
        }
        .dv-search-input::placeholder { color: #aaa; }
        .dv-search-divider { width: 1px; height: 24px; background: #ddd; flex-shrink:0; }
        .dv-search-select {
          border: none; outline: none; background: transparent;
          font-size: .88rem; color: #444; padding: .5rem .75rem;
          cursor: pointer; flex-shrink:0;
          -webkit-appearance: none; appearance: none;
        }
        .dv-search-btn {
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff; border: none; border-radius: 40px;
          padding: .7rem 1.5rem; font-size: .92rem; font-weight: 700;
          cursor: pointer; flex-shrink:0;
          transition: opacity .2s, transform .15s; white-space: nowrap;
        }
        .dv-search-btn:hover { opacity:.88; transform:scale(1.03); }

        /* pills */
        .dv-suggestions { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
        .dv-pill {
          background: rgba(255,255,255,.13); border: 1px solid rgba(255,255,255,.22);
          color: #fff; border-radius: 999px; padding: .3rem .85rem; font-size: .8rem;
          cursor: pointer; transition: background .2s, border-color .2s;
          backdrop-filter: blur(4px);
        }
        .dv-pill:hover { background: rgba(255,255,255,.25); }
        .dv-pill-active {
          background: linear-gradient(135deg,#10b981,#059669) !important;
          border-color: #10b981 !important; color: #fff !important;
        }

        @media(max-width:600px){
          .dv-search-bar { border-radius:1rem; padding:.5rem; flex-wrap:wrap; gap:.4rem; }
          .dv-search-divider,.dv-search-select { display:none; }
          .dv-search-input { padding:.5rem; font-size:.9rem; }
          .dv-search-btn { width:100%; justify-content:center; border-radius:.75rem; }
        }

        /* ── FILTER BAR ── */
        .dv-filter-bar {
          background: #fff; border: 1.5px solid #f1f5f9;
          border-radius: 1.5rem; padding: 1.75rem 2rem;
          margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,.06);
        }
        .dv-filter-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .dv-filter-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
        .dv-reset-btn {
          background: transparent; border: 1.5px solid #e2e8f0;
          color: #64748b; font-size: .85rem; font-weight: 600;
          border-radius: .6rem; padding: .4rem 1rem; cursor: pointer;
          transition: border-color .2s, color .2s;
        }
        .dv-reset-btn:hover { border-color: #e63946; color: #e63946; }
        .dv-filter-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr));
          gap: 1rem; margin-bottom: 1.25rem;
        }
        .dv-filter-field { display: flex; flex-direction: column; gap: 6px; }
        .dv-filter-field label {
          font-size: .78rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: .06em; color: #94a3b8;
        }
        .dv-filter-field select {
          width: 100%; border: 1px solid #e2e8f0; border-radius: .65rem;
          padding: 8px 12px; background: #fff; font: inherit;
          font-size: .88rem; color: #334155;
        }
        .dv-filter-field select:focus { outline: none; border-color: #10b981; }
        .dv-filter-field input[type="range"] {
          width: 100%; padding: 4px 0; accent-color: #10b981;
        }
        .dv-range-label { font-size: .78rem; color: #94a3b8; }
        .dv-quick-cats {
          border-top: 1px solid #f1f5f9; padding-top: 1rem;
          display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
        }
        .dv-quick-label {
          font-size: .78rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: .06em; color: #94a3b8; white-space: nowrap;
        }
        .dv-quick-row { display: flex; gap: .5rem; flex-wrap: wrap; }
        .dv-quick-cats .dv-pill {
          background: #f7f9fc; color: #64748b;
          border: 1px solid #e2e8f0; backdrop-filter: none;
        }
        .dv-quick-cats .dv-pill:hover { background: #f1f5f9; border-color: #cbd5e1; }

        /* ── RESULTS ── */
        .dv-results { display: flex; flex-direction: column; gap: 1.5rem; }

        /* toolbar */
        .dv-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .dv-toolbar-count { display: block; font-size: .85rem; color: #94a3b8; }
        .dv-toolbar-trend { font-size: .95rem; color: #0f172a; }
        .dv-toolbar-actions { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
        .dv-layout-btn {
          background: #fff; border: 1.5px solid #e2e8f0;
          color: #64748b; font-size: .85rem; font-weight: 600;
          border-radius: .6rem; padding: .45rem .85rem; cursor: pointer;
          transition: border-color .2s, color .2s, background .2s;
        }
        .dv-layout-btn:hover { border-color: #cbd5e1; color: #334155; }
        .dv-layout-active {
          background: linear-gradient(135deg,#10b981,#059669) !important;
          border-color: #10b981 !important; color: #fff !important;
        }
        .dv-map-btn {
          background: #fff; border: 1.5px solid #e2e8f0;
          color: #334155; font-size: .85rem; font-weight: 600;
          border-radius: .6rem; padding: .45rem .85rem; cursor: pointer;
          transition: border-color .2s, background .2s;
        }
        .dv-map-btn:hover { background: #f7f9fc; border-color: #cbd5e1; }

        /* map */
        .dv-map-wrap { border-radius: 1.5rem; overflow: hidden; border: 1px solid #e2e8f0; }

        /* empty */
        .dv-empty { text-align: center; padding: 4rem 2rem; }
        .dv-empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        .dv-empty h3 { color: #0f172a; margin-bottom: .5rem; }
        .dv-empty p  { color: #94a3b8; margin-bottom: 1rem; }
        .dv-empty-btn {
          background: linear-gradient(135deg,#10b981,#059669);
          color: #fff; border: none; border-radius: .65rem;
          padding: .65rem 1.5rem; font-size: .9rem; font-weight: 700;
          cursor: pointer; transition: opacity .2s;
        }
        .dv-empty-btn:hover { opacity:.88; }

        /* ── GRID CARDS ── */
        .dv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px,1fr));
          gap: 1.75rem;
        }
        .dv-card {
          background: #fff; border-radius: 1.5rem; overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,.07);
          transition: transform .25s, box-shadow .25s;
          border: 1.5px solid #f1f5f9;
          display: flex; flex-direction: column;
        }
        .dv-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(16,185,129,.12); }
        .dv-card-img-wrap { position: relative; width: 100%; }
        .dv-card-img {
          position: relative; width: 100%; height: 0; padding-bottom: 65%;
          background-size: cover; background-position: center;
        }
        .dv-card-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.5) 0%, transparent 55%);
        }
        .dv-card-rating {
          position: absolute; top: .75rem; right: .75rem;
          background: linear-gradient(135deg,#f59e0b,#d97706);
          color: #fff; font-size: .72rem; font-weight: 700;
          padding: .25rem .65rem; border-radius: 999px;
          box-shadow: 0 2px 8px rgba(0,0,0,.25);
        }
        .dv-card-content {
          padding: 1.25rem 1.4rem 1.4rem; flex: 1;
          display: flex; flex-direction: column;
        }
        .dv-card-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: .5rem; margin-bottom: .4rem;
        }
        .dv-card-name { font-size: 1.08rem; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.3; }
        .dv-card-cat {
          background: linear-gradient(135deg,#e63946,#f4a261);
          color: #fff; font-size: .65rem; font-weight: 700;
          padding: .22rem .6rem; border-radius: 999px; white-space: nowrap; flex-shrink: 0;
        }
        .dv-card-region {
          font-size: .85rem; color: #64748b; margin: 0 0 .9rem;
          display: flex; align-items: center; gap: .25rem;
        }
        .dv-card-actions {
          display: flex; gap: .6rem; align-items: center;
          margin-top: auto; padding-top: .75rem; border-top: 1px solid #f1f5f9;
        }
        .dv-card-view {
          flex: 1; text-align: center;
          background: linear-gradient(135deg,#10b981,#059669);
          color: #fff !important; font-size: .84rem; font-weight: 700;
          border: none; border-radius: .65rem; padding: .6rem .75rem;
          cursor: pointer; transition: opacity .2s, transform .15s;
          text-decoration: none !important;
          display: flex; align-items: center; justify-content: center;
        }
        .dv-card-view:hover { opacity:.85; transform:scale(1.02); }
        .dv-card-save {
          display: flex; align-items: center; gap: .3rem;
          border: 1.5px solid #e2e8f0; background: transparent;
          color: #64748b; font-size: .8rem; font-weight: 600;
          border-radius: .65rem; padding: .55rem .7rem;
          cursor: pointer; white-space: nowrap;
          transition: background .2s, color .2s, border-color .2s;
        }
        .dv-card-save:hover { border-color: #e63946; color: #e63946; background: rgba(230,57,70,.04); }
        .dv-card-saved { border-color: #e63946 !important; color: #e63946 !important; background: rgba(230,57,70,.06) !important; }

        /* ── LIST CARDS ── */
        .dv-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .dv-list-card {
          display: flex; background: #fff; border-radius: 1.5rem; overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,.07);
          border: 1.5px solid #f1f5f9; transition: transform .25s, box-shadow .25s;
        }
        .dv-list-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(16,185,129,.1); }
        .dv-list-img {
          flex: 0 0 280px; min-height: 220px;
          background-size: cover; background-position: center;
          border-radius: 1.5rem 0 0 1.5rem;
        }
        .dv-list-body { flex: 1; padding: 1.5rem; display: flex; flex-direction: column; }
        .dv-list-cat {
          display: inline-block; width: fit-content;
          background: linear-gradient(135deg,#e63946,#f4a261);
          color: #fff; font-size: .65rem; font-weight: 700;
          padding: .22rem .6rem; border-radius: 999px; margin-bottom: .5rem;
        }
        .dv-list-body h3 { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0 0 .4rem; }
        .dv-list-body p  { font-size: .9rem; color: #64748b; line-height: 1.55; margin: 0 0 .75rem; }
        .dv-list-meta {
          display: flex; gap: 1rem; font-size: .82rem; color: #94a3b8;
          margin-bottom: .75rem; flex-wrap: wrap;
        }
        .dv-list-actions { display: flex; gap: .6rem; margin-top: auto; }

        @media(max-width:768px){
          .dv-grid { grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 1.25rem; }
          .dv-list-card { flex-direction: column; }
          .dv-list-img { flex: none; min-height: 200px; border-radius: 1.5rem 1.5rem 0 0; }
        }
        @media(max-width:640px){
          .dv-hero { min-height: 340px; }
          .dv-hero-body { padding: 2rem 1.25rem; }
          .dv-filter-bar { padding: 1.25rem; }
          .dv-filter-grid { grid-template-columns: 1fr 1fr; }
          .dv-toolbar { flex-direction: column; align-items: flex-start; }
        }
        @media(max-width:480px){
          .dv-grid { grid-template-columns: 1fr; }
          .dv-filter-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  )
}