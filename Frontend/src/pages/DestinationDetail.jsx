import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MapView from '../components/MapView'
import { getDestinationDetail, getRoutes, getGuides } from '../apiClient'
import { destinations } from '../data'

const accommodationOptions = ['Standard', 'Comfort', 'Premium']
const DEFAULT_COORDS = [23.7, 90.4]

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
                  {(details.highlights || ['Scenic photography spots', 'Vibrant local markets', 'Traditional heritage sights']).map((item) => (
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
                <p>{(details.pack || ['Comfortable walking shoes', 'Umbrella / Raincoat', 'Sunscreen & Sunglasses', 'Hydration flask']).join(', ')}</p>
              </div>
              <div className="info-item-card">
                <strong>💡 Local Tips</strong>
                <ul>
                  {(details.tips || ['Hire a verified guide for forest safaris', 'Respect local traditions', 'Keep cash handy for local boat operators']).map((tip) => (
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
            </div>
            <div className="estimator-form">
              <label>
                Travelers Group Size
                <input type="number" min="1" max="50" value={groupSize} onChange={(e) => setGroupSize(Math.max(1, Number(e.target.value)))} />
              </label>
              <label>
                Duration (Days)
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  <option value={2}>2 Days</option>
                  <option value={3}>3 Days</option>
                  <option value={4}>4 Days</option>
                  <option value={5}>5 Days</option>
                  <option value={7}>7 Days</option>
                </select>
              </label>
              <label>
                Hotel Accommodation Class
                <select value={accommodation} onChange={(e) => setAccommodation(e.target.value)}>
                  {accommodationOptions.map((option) => (
                    <option key={option} value={option}>{option} Stay</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="estimate-summary">
              <div className="est-row"><span>Transport Share</span><strong>৳{estimate.transport}</strong></div>
              <div className="est-row"><span>Food allowance</span><strong>৳{estimate.food}</strong></div>
              <div className="est-row"><span>Accommodation Stay</span><strong>৳{estimate.stay}</strong></div>
              <div className="est-row"><span>Sightseeing & Activities</span><strong>৳{estimate.activities}</strong></div>
              <div className="estimate-total">
                <span>Estimated Total Cost</span>
                <strong>৳{estimate.total.toLocaleString()}</strong>
              </div>
            </div>
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

        /* Estimator Panel */
        .estimator-panel {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 2rem;
        }
        .estimator-form {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin: 1.5rem 0;
        }
        @media (max-width: 600px) {
          .estimator-form { grid-template-columns: 1fr; }
        }
        .estimator-form label {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.82rem;
          font-weight: 750;
          color: #475569;
        }
        .estimator-form input, .estimator-form select {
          padding: 0.65rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          outline: none;
        }
        .estimate-summary {
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .est-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: #64748b;
        }
        .est-row strong {
          color: #1e293b;
        }
        .estimate-total {
          border-top: 1.5px dashed #cbd5e1;
          padding-top: 0.75rem;
          margin-top: 0.4rem;
          display: flex;
          justify-content: space-between;
          font-size: 1.05rem;
          font-weight: 850;
          color: #0d9488;
        }

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
