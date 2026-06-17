import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MapView from '../components/MapView'
import { getDestinationDetail, getRoutes, getGuides } from '../apiClient'
import { destinations } from '../data'

const accommodationOptions = ['Standard', 'Comfort', 'Premium']
const DEFAULT_COORDS = [23.7, 90.4]

// Safely converts a string or array field from the API into a real JS array.
// Backend stores list-like data as TextField (newline or comma separated).
const toArray = (value, fallback = []) => {
  if (!value) return fallback
  if (Array.isArray(value)) return value.length ? value : fallback
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return fallback
    // Try JSON parse first (in case someone stored '[ "a", "b" ]')
    if (trimmed.startsWith('[')) {
      try { return JSON.parse(trimmed) } catch (_) { /* fall through */ }
    }
    // Split on newlines first, then commas
    const sep = trimmed.includes('\n') ? '\n' : ','
    return trimmed.split(sep).map(s => s.trim()).filter(Boolean)
  }
  return fallback
}

export default function DestinationDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [destination, setDestination] = useState(null)
  const [details, setDetails] = useState(null)
  const [transportOptions, setTransportOptions] = useState([])
  const [guides, setGuides] = useState([])
  const [errorAlert, setErrorAlert] = useState('')
  const [successAlert, setSuccessAlert] = useState('')

  useEffect(() => {
    if (!slug) return
    getDestinationDetail(slug)
      .then((data) => {
        setDetails(data)
        setDestination({
          slug: data.slug,
          name: data.name,
          hero: data.hero || 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=1200',
          region: data.region,
          coords_lat: data.coords_lat,
          coords_lng: data.coords_lng,
          rating: data.rating,
          description: data.description,
        })
        // Fetch transport routes to this destination
        getRoutes({ to: data.name })
          .then((r) => setTransportOptions(r))
          .catch(() => setTransportOptions([]))
      })
      .catch(() => {
        const fallbackDestination = destinations.find((item) => item.slug === slug)
        if (!fallbackDestination) {
          setDetails(null)
          setDestination(null)
          return
        }

        const fallback = {
          name: fallbackDestination.name,
          description: fallbackDestination.summary || 'Enjoy amazing local experiences, scenery, and culture.',
          highlights: ['Explore local sights', 'Vibrant cultural heritage', 'Scenic spot tracking'],
          bestTime: fallbackDestination.season || 'November to March',
          pack: ['Comfortable clothing', 'Water bottle', 'Camera', 'First-aid kit'],
          tips: ['Start early to avoid crowds', 'Always ask locals for food guidelines'],
          attractions: [fallbackDestination.name],
          food: ['Traditional seafood', 'Street food specials'],
          eateries: ['Popular neighborhood restaurants'],
          accommodations: [],
          reviews: [{ author: 'TripoBD Traveler', score: fallbackDestination.rating || 4.5, note: 'A great destination for your next trip.' }],
          groups: [{ name: `${fallbackDestination.name} Explorers`, members: 6, departure: 'Next week' }],
        }

        setDetails(fallback)
        setDestination({
          slug: fallbackDestination.slug,
          name: fallbackDestination.name,
          hero: fallbackDestination.hero || 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=1200',
          region: fallbackDestination.region,
          coords_lat: fallbackDestination.coords?.[0] ?? DEFAULT_COORDS[0],
          coords_lng: fallbackDestination.coords?.[1] ?? DEFAULT_COORDS[1],
        })
      })

    getGuides()
      .then((g) => setGuides(g))
      .catch(() => setGuides([]))
  }, [slug])

  const [groupSize, setGroupSize] = useState(4)
  const [duration, setDuration] = useState(3)
  const [accommodation, setAccommodation] = useState('Comfort')

  const estimate = useMemo(() => {
    const base = 1200 + duration * 800 + (accommodation === 'Premium' ? 1200 : accommodation === 'Comfort' ? 800 : 500)
    const transport = Math.round(base * 0.28)
    const food = Math.round(base * 0.22)
    const stay = Math.round(base * 0.3)
    const activities = base - transport - food - stay
    return { transport, food, stay, activities, total: (transport + food + stay + activities) * groupSize }
  }, [groupSize, duration, accommodation])

  if (!details || !destination) {
    return (
      <main className="page-shell page-detail-error">
        <div className="panel">
          <h1>Destination not found</h1>
          <p>We couldn't locate the requested destination record.</p>
          <button className="button button-secondary" onClick={() => navigate('/discover')}>
            Back to Discover
          </button>
        </div>
      </main>
    )
  }

  // Formatting attractions that can be strings or objects
  const listAttractions = (details.attractions || []).map((attr) =>
    typeof attr === 'object' ? attr.name : attr
  )

  const listAccommodations = details.accommodations || []
  const listReviews = details.reviews || []
  const listGroups = details.groups || []

  const journeyPins = [
    {
      label: destination.name,
      coords: destination.coords_lat && destination.coords_lng
        ? [destination.coords_lat, destination.coords_lng]
        : DEFAULT_COORDS,
      description: destination.region || 'Scenic Area',
    },
  ]

  const handleSaveWishlist = () => {
    setSuccessAlert('Destination successfully added to your Wishlist!')
    setTimeout(() => setSuccessAlert(''), 3000)
  }

  const handleShare = () => {
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl)
    setSuccessAlert('Destination share link copied to clipboard!')
    setTimeout(() => setSuccessAlert(''), 3000)
  }

  return (
    <main className="page-shell page-detail">
      {successAlert && <div className="profile-alert success floating-alert">{successAlert}</div>}
      {errorAlert && <div className="profile-alert error floating-alert">{errorAlert}</div>}

      {/* Hero Header Section */}
      <section className="detail-hero" style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.75)), url(${destination.hero})` }}>
        <div className="detail-hero-copy">
          <span className="eyebrow">📍 Bangladesh Travel Showcase</span>
          <h1>{destination.name}</h1>
          <p className="hero-region">{destination.region}</p>
          <p className="hero-desc">{details.description || destination.description}</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={handleSaveWishlist}>❤️ Save to Wishlist</button>
            <button className="button button-secondary" onClick={handleShare}>📋 Copy Share Link</button>
          </div>
        </div>
      </section>

      {/* Grid Layout */}
      <section className="detail-grid">
        <div className="detail-column">
          {/* Overview Panel */}
          <div className="overview-panel">
            <h2>About the Destination</h2>
            <p className="main-desc-text">{details.description || destination.description}</p>
            
            <div className="info-grid">
              <div className="info-item-card">
                <strong>✦ Key Highlights</strong>
                <ul>
                  {toArray(details.highlights, ['Scenic photography spots', 'Vibrant local markets', 'Traditional heritage sights']).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="info-item-card">
                <strong>🗓️ Best Time to Visit</strong>
                <p>{details.season || details.bestTime || 'November to March (Winter Season)'}</p>
              </div>
              <div className="info-item-card">
                <strong>🎒 What to Pack</strong>
                <p>{toArray(details.pack, ['Comfortable walking shoes', 'Umbrella / Raincoat', 'Sunscreen & Sunglasses', 'Hydration flask']).join(', ')}</p>
              </div>
              <div className="info-item-card">
                <strong>💡 Local Tips</strong>
                <ul>
                  {toArray(details.tips, ['Hire a verified guide for forest safaris', 'Respect local traditions', 'Keep cash handy for local boat operators']).map((tip) => (
                    <li key={tip}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Budget Estimator Panel */}
          <div className="estimator-panel">
            <div className="panel-head">
              <span className="eyebrow">💰 Interactive Calculator</span>
              <h2>Estimate Your Travel Budget</h2>
              <p className="estimator-subtitle">Adjust the sliders to get a real-time cost breakdown for your trip.</p>
            </div>

            {/* Controls */}
            <div className="calc-controls">
              {/* Group Size */}
              <div className="calc-control-row">
                <div className="calc-label-row">
                  <span className="calc-label">👥 Group Size</span>
                  <span className="calc-value-badge">{groupSize} {groupSize === 1 ? 'person' : 'people'}</span>
                </div>
                <input
                  type="range" min="1" max="20" value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                  className="calc-slider"
                />
                <div className="calc-slider-ticks">
                  <span>Solo</span><span>5</span><span>10</span><span>15</span><span>20</span>
                </div>
              </div>

              {/* Duration */}
              <div className="calc-control-row">
                <div className="calc-label-row">
                  <span className="calc-label">📅 Duration</span>
                  <span className="calc-value-badge">{duration} {duration === 1 ? 'day' : 'days'}</span>
                </div>
                <input
                  type="range" min="1" max="10" value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="calc-slider"
                />
                <div className="calc-slider-ticks">
                  <span>1d</span><span>3d</span><span>5d</span><span>7d</span><span>10d</span>
                </div>
              </div>

              {/* Accommodation Tier */}
              <div className="calc-control-row">
                <span className="calc-label">🏨 Accommodation</span>
                <div className="calc-tier-row">
                  {[
                    { key: 'Standard', icon: '🏕️', desc: 'Budget stay' },
                    { key: 'Comfort',  icon: '🏨', desc: 'Mid-range'   },
                    { key: 'Premium',  icon: '🏩', desc: 'Luxury stay' },
                  ].map(tier => (
                    <button
                      key={tier.key}
                      className={`calc-tier-btn${accommodation === tier.key ? ' calc-tier-active' : ''}`}
                      onClick={() => setAccommodation(tier.key)}
                    >
                      <span className="tier-icon">{tier.icon}</span>
                      <strong>{tier.key}</strong>
                      <small>{tier.desc}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="calc-breakdown">
              <p className="calc-section-label">Cost per person breakdown</p>
              {[
                { label: 'Transport',          icon: '🚌', value: estimate.transport,   color: '#3b82f6' },
                { label: 'Food & Dining',       icon: '🍛', value: estimate.food,        color: '#f59e0b' },
                { label: 'Accommodation',       icon: '🏨', value: estimate.stay,        color: '#8b5cf6' },
                { label: 'Activities & Entry',  icon: '🎟️', value: estimate.activities,  color: '#10b981' },
              ].map(item => {
                const pct = Math.round((item.value / (estimate.transport + estimate.food + estimate.stay + estimate.activities)) * 100)
                return (
                  <div key={item.label} className="calc-bar-row">
                    <div className="calc-bar-meta">
                      <span>{item.icon} {item.label}</span>
                      <strong>৳{item.value.toLocaleString()}</strong>
                    </div>
                    <div className="calc-bar-track">
                      <div
                        className="calc-bar-fill"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                    <span className="calc-bar-pct">{pct}%</span>
                  </div>
                )
              })}
            </div>

            {/* Total */}
            <div className="calc-total-box">
              <div className="calc-total-left">
                <span className="calc-total-label">Total for {groupSize} {groupSize === 1 ? 'person' : 'people'} · {duration} {duration === 1 ? 'day' : 'days'}</span>
                <div className="calc-total-amount">৳{estimate.total.toLocaleString()}</div>
                <span className="calc-per-person">৳{Math.round(estimate.total / groupSize).toLocaleString()} per person</span>
              </div>
              <div className="calc-total-icon">💰</div>
            </div>

            <p className="calc-disclaimer">* Estimates are approximate and may vary based on season, availability and personal preferences.</p>
          </div>
        </div>

        {/* Sidebar Panel */}
        <aside className="detail-sidebar">
          {/* Transport Card */}
          <div className="detail-card">
            <h3>🚌 Available Routes</h3>
            {transportOptions.length ? (
              <div className="routes-list">
                {transportOptions.map((route) => (
                  <div key={route.id || route.operator} className="route-item-row">
                    <div>
                      <strong>{route.mode} | {route.operator}</strong>
                      <p className="route-sub">{route.travel_class || 'Standard'}</p>
                    </div>
                    <div className="route-right">
                      <span className="route-fare">৳{route.fare}</span>
                      <small className="route-dur">{route.duration}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sidebar-empty-text">No route options logged for this origin city.</p>
            )}
          </div>

          {/* Attractions Card */}
          <div className="detail-card">
            <h3>🏞️ Popular Spots to Visit</h3>
            <ul className="attractions-list-bullets">
              {listAttractions.length > 0 ? (
                listAttractions.map((item) => <li key={item}>📌 {item}</li>)
              ) : (
                <li>📌 Center Point Sights</li>
              )}
            </ul>
          </div>

          {/* Food Card */}
          <div className="detail-card">
            <h3>🍲 Food Guide & Specialties</h3>
            <p className="food-list-text">{(details.food || ['Fresh river fish curries', 'Dry fish chutneys', 'Bamboo chicken']).join(', ')}</p>
            <h4 className="eateries-title">Recommended Eateries:</h4>
            <ul className="attractions-list-bullets">
              {(details.eateries || ['Kutum Bari Restaurant', 'Traditional Food Shacks']).map((item) => (
                <li key={item}>🍴 {item}</li>
              ))}
            </ul>
          </div>

          {/* Verified Guides Card */}
          <div className="detail-card">
            <h3>🤠 Verified Local Guides</h3>
            {guides.length ? (
              <div className="guides-mini-list">
                {guides.slice(0, 3).map((guide) => (
                  <div key={guide.id || guide.name} className="sidebar-guide-item">
                    <div>
                      <strong>{guide.name}</strong>
                      <p>{guide.location}</p>
                    </div>
                    <button className="button button-secondary compact-btn" onClick={() => navigate('/traveler/bookings')}>
                      Book
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sidebar-empty-text">No local guide registered here yet.</p>
            )}
          </div>
        </aside>
      </section>

      {/* Map Section */}
      <section className="detail-map-panel">
        <h2>Interactive Location Pin</h2>
        <MapView pins={journeyPins} />
      </section>

      {/* Reviews Section */}
      <section className="detail-review-panel">
        <h2>Community Traveler Reviews</h2>
        {listReviews.length ? (
          <div className="review-grid">
            {listReviews.map((review, idx) => (
              <div className="review-card" key={idx}>
                <div className="review-card-header">
                  <strong>{review.author}</strong>
                  <span className="rating-badge">⭐ {review.score || review.rating_accessibility || 5}/5</span>
                </div>
                <p className="review-text-paragraph">"{review.note || review.text_review}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-reviews-text">No traveler reviews logged for this location yet. Be the first to add one!</p>
        )}
      </section>

      <style>{`
        .page-detail {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .floating-alert {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        /* Hero */
        .detail-hero {
          border-radius: 24px;
          background-size: cover;
          background-position: center;
          color: white;
          padding: 5rem 3rem;
          box-shadow: 0 8px 32px rgba(15,23,42,0.1);
        }
        .detail-hero-copy {
          max-width: 800px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .detail-hero-copy h1 {
          font-size: 3rem;
          font-weight: 850;
          margin: 0;
          text-shadow: 0 3px 6px rgba(0,0,0,0.4);
        }
        .hero-region {
          font-size: 1.25rem;
          font-weight: 700;
          color: #38bdf8;
          margin: 0;
        }
        .hero-desc {
          font-size: 1.05rem;
          line-height: 1.6;
          color: #e2e8f0;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          margin: 0 0 1.25rem 0;
        }
        .hero-actions {
          display: flex;
          gap: 0.75rem;
        }

        /* Grid Layout */
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 2.5rem;
        }
        @media (max-width: 900px) {
          .detail-grid { grid-template-columns: 1fr; }
        }

        .detail-column {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Overview Panel */
        .overview-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 2rem;
        }
        .overview-panel h2 {
          margin: 0 0 1rem;
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
        }
        .main-desc-text {
          font-size: 0.98rem;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 2rem;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 600px) {
          .info-grid { grid-template-columns: 1fr; }
        }
        .info-item-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
        }
        .info-item-card strong {
          display: block;
          font-size: 0.9rem;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }
        .info-item-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .info-item-card li, .info-item-card p {
          font-size: 0.88rem;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }

        /* Estimator Panel — Premium Visual */
        .estimator-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 2.25rem;
          color: #0f172a;
          box-shadow: 0 8px 32px rgba(15,23,42,0.08);
        }
        .estimator-panel .panel-head h2 { color: #0f172a; }
        .estimator-panel .eyebrow {
          background: linear-gradient(90deg,#10b981,#6ee7b7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .estimator-subtitle {
          font-size: .88rem; color: #64748b; margin: .5rem 0 0; font-weight: 400;
        }

        /* Controls area */
        .calc-controls {
          display: flex; flex-direction: column; gap: 1.5rem;
          background: #f8fafc; border-radius: 16px;
          padding: 1.5rem; margin: 1.5rem 0;
          border: 1px solid #e2e8f0;
        }
        .calc-control-row { display: flex; flex-direction: column; gap: .5rem; }
        .calc-label-row { display: flex; justify-content: space-between; align-items: center; }
        .calc-label { font-size: .85rem; font-weight: 700; color: #334155; }
        .calc-value-badge {
          background: linear-gradient(135deg,#10b981,#059669);
          color: #fff; font-size: .78rem; font-weight: 700;
          padding: .22rem .75rem; border-radius: 999px;
        }

        /* Range slider */
        .calc-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 6px; border-radius: 99px;
          background: linear-gradient(to right, #10b981 var(--val, 50%), #e2e8f0 var(--val, 50%));
          outline: none; cursor: pointer;
        }
        .calc-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: linear-gradient(135deg,#10b981,#6ee7b7);
          border: 3px solid #fff;
          box-shadow: 0 2px 10px rgba(16,185,129,.5);
          cursor: pointer; transition: transform .15s;
        }
        .calc-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .calc-slider-ticks {
          display: flex; justify-content: space-between;
          font-size: .65rem; color: #64748b; padding: 0 2px;
        }

        /* Accommodation tier buttons */
        .calc-tier-row { display: flex; gap: .75rem; margin-top: .5rem; }
        .calc-tier-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: .2rem;
          background: white; border: 1.5px solid #e2e8f0;
          border-radius: 14px; padding: .85rem .5rem; cursor: pointer;
          transition: all .2s; color: #475569;
        }
        .calc-tier-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .calc-tier-active {
          background: linear-gradient(135deg,rgba(16,185,129,.1),rgba(5,150,105,.05)) !important;
          border-color: #10b981 !important;
          color: #059669 !important;
          box-shadow: 0 0 0 1px #10b981;
        }
        .tier-icon { font-size: 1.4rem; }
        .calc-tier-btn strong { font-size: .82rem; font-weight: 700; }
        .calc-tier-btn small { font-size: .68rem; color: #64748b; }

        /* Breakdown bars */
        .calc-breakdown {
          display: flex; flex-direction: column; gap: .85rem; margin-bottom: 1.5rem;
        }
        .calc-section-label {
          font-size: .75rem; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: .06em; margin-bottom: .25rem;
        }
        .calc-bar-row { display: flex; flex-direction: column; gap: .3rem; }
        .calc-bar-meta {
          display: flex; justify-content: space-between;
          font-size: .85rem; color: #475569;
        }
        .calc-bar-meta strong { color: #0f172a; font-size: .9rem; }
        .calc-bar-track {
          width: 100%; height: 8px; background: #e2e8f0;
          border-radius: 99px; overflow: hidden;
        }
        .calc-bar-fill {
          height: 100%; border-radius: 99px;
          transition: width .45s cubic-bezier(.4,0,.2,1);
        }
        .calc-bar-pct { font-size: .68rem; color: #64748b; align-self: flex-end; }

        /* Total box */
        .calc-total-box {
          display: flex; justify-content: space-between; align-items: center;
          background: linear-gradient(135deg,#10b981,#059669);
          border-radius: 18px; padding: 1.5rem 1.75rem;
          box-shadow: 0 8px 32px rgba(16,185,129,.35);
          margin-bottom: 1rem;
        }
        .calc-total-left { display: flex; flex-direction: column; gap: .3rem; }
        .calc-total-label { font-size: .82rem; color: rgba(255,255,255,.8); font-weight: 600; }
        .calc-total-amount { font-size: 2rem; font-weight: 900; color: #fff; line-height: 1.1; }
        .calc-per-person { font-size: .8rem; color: rgba(255,255,255,.75); }
        .calc-total-icon { font-size: 3rem; opacity: .5; }
        .calc-disclaimer { font-size: .72rem; color: #64748b; margin: 0; line-height: 1.5; }

        /* Sidebar Panels */
        .detail-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .detail-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 1.25rem;
        }
        .detail-card h3 {
          margin: 0 0 0.85rem 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
        }
        .sidebar-empty-text {
          font-size: 0.82rem;
          color: #94a3b8;
          margin: 0;
        }
        .routes-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .route-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          padding: 0.6rem 0.8rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        .route-item-row strong {
          font-size: 0.85rem;
          color: #1e293b;
        }
        .route-sub {
          margin: 0;
          font-size: 0.72rem;
          color: #64748b;
        }
        .route-right {
          text-align: right;
        }
        .route-fare {
          display: block;
          font-size: 0.92rem;
          font-weight: 800;
          color: #0f172a;
        }
        .route-dur {
          font-size: 0.72rem;
          color: #64748b;
        }

        .attractions-list-bullets {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .attractions-list-bullets li {
          font-size: 0.85rem;
          color: #475569;
        }
        .food-list-text {
          font-size: 0.85rem;
          color: #475569;
          line-height: 1.4;
          margin-bottom: 0.85rem;
        }
        .eateries-title {
          font-size: 0.82rem;
          font-weight: 800;
          color: #334155;
          margin: 0.5rem 0;
        }

        .guides-mini-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .sidebar-guide-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .sidebar-guide-item strong {
          font-size: 0.82rem;
          color: #1e293b;
        }
        .sidebar-guide-item p {
          margin: 0;
          font-size: 0.72rem;
          color: #64748b;
        }
        .compact-btn {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
        }

        /* Map Panel */
        .detail-map-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
        }
        .detail-map-panel h2 {
          margin: 0 0 1rem;
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
        }

        /* Review Panel */
        .detail-review-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 2rem;
        }
        .detail-review-panel h2 {
          margin: 0 0 1.25rem;
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
        }
        .review-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }
        .review-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
          background: #f8fafc;
        }
        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .review-card-header strong {
          font-size: 0.88rem;
          color: #1e293b;
        }
        .rating-badge {
          font-size: 0.78rem;
          font-weight: 750;
          color: #d97706;
          background: #fef3c7;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }
        .review-text-paragraph {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.5;
          color: #475569;
          font-style: italic;
        }
      `}</style>
    </main>
  )
}
