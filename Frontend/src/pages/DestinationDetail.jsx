import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MapView from '../components/MapView'
import { getDestinationDetail, getRoutes, getGuides } from '../apiClient'

const accommodationOptions = ['Standard', 'Comfort', 'Premium']

export default function DestinationDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [destination, setDestination] = useState(null)
  const [details, setDetails] = useState(null)
  const [transportOptions, setTransportOptions] = useState([])
  const [guides, setGuides] = useState([])

  useEffect(() => {
    if (!slug) return
    getDestinationDetail(slug)
      .then((data) => {
        setDetails(data)
        // build a lightweight destination object for hero and coords
        setDestination({ slug: data.slug, name: data.name, hero: data.hero, region: data.region, coords_lat: data.coords_lat, coords_lng: data.coords_lng })
        // fetch transport routes to this destination
        getRoutes({ to: data.name }).then((r) => setTransportOptions(r)).catch(() => setTransportOptions([]))
      })
      .catch(() => {
        setDetails(null)
        setDestination(null)
      })

    getGuides().then((g) => setGuides(g)).catch(() => setGuides([]))
  }, [slug])
  const [groupSize, setGroupSize] = useState(4)
  const [duration, setDuration] = useState(3)
  const [accommodation, setAccommodation] = useState('Comfort')

  // transportOptions state is loaded from API

  const estimate = useMemo(() => {
    const base = 1200 + duration * 800 + (accommodation === 'Premium' ? 1200 : accommodation === 'Comfort' ? 800 : 500)
    const transport = Math.round(base * 0.28)
    const food = Math.round(base * 0.22)
    const stay = Math.round(base * 0.3)
    const activities = base - transport - food - stay
    return { transport, food, stay, activities, total: transport + food + stay + activities }
  }, [groupSize, duration, accommodation])

  if (!details || !destination) {
    return (
      <main className="page-shell page-detail">
        <div className="panel">
          <h1>Destination not found</h1>
          <button className="button button-secondary" onClick={() => navigate('/discover')}>
            Back to Discover
          </button>
        </div>
      </main>
    )
  }

  const journeyPins = [
    { label: destination.name, coords: destination.coords_lat && destination.coords_lng ? [destination.coords_lat, destination.coords_lng] : [23.7, 90.4], description: destination.region },
  ]

  return (
    <main className="page-shell page-detail">
      <section className="detail-hero" style={{ backgroundImage: `linear-gradient(rgba(7, 14, 31, 0.35), rgba(7, 14, 31, 0.35)), url(${destination.hero})` }}>
        <div className="detail-hero-copy">
          <span className="eyebrow">Destination detail</span>
          <h1>{destination.name}</h1>
          <p>{details.description}</p>
          <div className="hero-actions">
            <button className="button button-primary">Save to wishlist</button>
            <button className="button button-secondary">Share destination</button>
          </div>
        </div>
      </section>

      <section className="detail-grid">
        <div className="detail-column">
          <div className="gallery-grid">
            <div className="gallery-item" style={{ backgroundImage: `url(${destination.hero})` }} />
            <div className="gallery-item" style={{ backgroundImage: `url(${destination.hero})` }} />
            <div className="gallery-item" style={{ backgroundImage: `url(${destination.hero})` }} />
          </div>
          <div className="overview-panel">
            <h2>Overview</h2>
            <p>{details.description}</p>
            <div className="info-grid">
              <div>
                <strong>Highlights</strong>
                <ul>{details.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div>
                <strong>Best time to visit</strong>
                <p>{details.bestTime}</p>
              </div>
              <div>
                <strong>What to pack</strong>
                <p>{details.pack.join(', ')}</p>
              </div>
              <div>
                <strong>Local tips</strong>
                <ul>{details.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
              </div>
            </div>
          </div>

          <div className="estimator-panel">
            <div className="panel-head">
              <span className="eyebrow">Budget estimator</span>
              <h2>Estimate your trip cost</h2>
            </div>
            <div className="estimator-form">
              <label>
                Group size
                <input type="number" min="2" max="12" value={groupSize} onChange={(e) => setGroupSize(Number(e.target.value))} />
              </label>
              <label>
                Duration (days)
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </label>
              <label>
                Accommodation
                <select value={accommodation} onChange={(e) => setAccommodation(e.target.value)}>
                  {accommodationOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="estimate-summary">
              <div><span>Transport</span><strong>৳{estimate.transport}</strong></div>
              <div><span>Food</span><strong>৳{estimate.food}</strong></div>
              <div><span>Stay</span><strong>৳{estimate.stay}</strong></div>
              <div><span>Activities</span><strong>৳{estimate.activities}</strong></div>
              <div className="estimate-total"><span>Total</span><strong>৳{estimate.total}</strong></div>
            </div>
          </div>
        </div>

        <aside className="detail-sidebar">
          <section className="detail-card">
            <h2>Transport & Routes</h2>
              {transportOptions.length ? (
                transportOptions.map((route) => (
                  <div key={route.id || route.operator} className="route-item">
                    <div>
                      <strong>{route.mode}</strong>
                      <p>{route.operator}</p>
                    </div>
                    <div>
                      <span>৳{route.fare}</span>
                      <small>{route.duration}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p>No transport routes available yet.</p>
              )}
          </section>

          <section className="detail-card">
            <h2>Places to visit</h2>
            <ul>{details.attractions.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section className="detail-card">
            <h2>Food guide</h2>
            <p>{details.food.join(', ')}</p>
            <h3>Recommended eateries</h3>
            <ul>{details.eateries.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section className="detail-card">
            <h2>Verified local guides</h2>
            {guides.length ? guides.map((guide) => (
              <div key={guide.id || guide.name} className="guide-card">
                <div>
                  <strong>{guide.name}</strong>
                  <p>{guide.location}</p>
                </div>
                <button className="button button-secondary" onClick={() => alert('Login required to book this guide')}>
                  Book
                </button>
              </div>
            )) : <p>No guides found.</p>}
          </section>

          <section className="detail-card">
            <h2>Open tour groups</h2>
            {details.groups.map((group) => (
              <div key={group.name} className="group-card">
                <div>
                  <strong>{group.name}</strong>
                  <p>{group.members} members · {group.departure}</p>
                </div>
                <button className="button button-secondary" onClick={() => alert('Login required to join')}>
                  Join
                </button>
              </div>
            ))}
          </section>
        </aside>
      </section>

      <section className="detail-map-panel">
        <h2>Destination map</h2>
        <MapView pins={journeyPins} />
      </section>

      <section className="detail-review-panel">
        <div>
          <h2>Community Reviews</h2>
          <div className="review-grid">
            {details.reviews.map((review) => (
              <div className="review-card" key={review.author}>
                <strong>{review.author}</strong>
                <span>{review.score} ★</span>
                <p>{review.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
