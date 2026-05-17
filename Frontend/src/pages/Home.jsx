import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { valueCards, appStats, featuredDestinations, landingStories } from '../data'

export default function Home() {
  const [carouselIndex, setCarouselIndex] = useState(0)
  const carouselItem = featuredDestinations[carouselIndex]
  const total = featuredDestinations.length
  const nextSlide = () => setCarouselIndex((index) => (index + 1) % total)
  const prevSlide = () => setCarouselIndex((index) => (index - 1 + total) % total)
  const previewItems = useMemo(() => featuredDestinations.slice(0, 3), [])

  return (
    <main className="page-shell">
      <section className="hero-panel hero-tripadvisor">
        <div className="hero-bg">
          <img className="hero-bg-img md-block" src="https://images.pexels.com/photos/32692905/pexels-photo-32692905.jpeg" alt="hero background" />
          <div className="hero-bg-overlay" />
        </div>

        <div className="hero-copy">
          <span className="eyebrow">Explore Bangladesh</span>
          <h1>Plan Smart. Travel Together. Explore Bangladesh.</h1>
          <p>
            TripoBD helps you discover destinations, compare reviews, find top routes, and book with local confidence.
          </p>

          <div className="hero-search">
            <div className="search-bar">
              <span className="search-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <input className="search-input" placeholder="Where are you going? e.g. Cox's Bazar, Sundarbans" />
              <select className="search-select">
                <option>All</option>
                <option>Beaches</option>
                <option>Hills</option>
                <option>Forests</option>
                <option>City</option>
              </select>
              <button className="search-button button-primary">Search</button>
            </div>
            <div className="search-suggestions">
              <button className="pill">Top picks</button>
              <button className="pill">Budget trips</button>
              <button className="pill">Family friendly</button>
              <button className="pill">Weekend getaways</button>
            </div>
          </div>

          <div className="hero-actions">
            <div className="cta-gradient-group">
              <div className="cta-gradient" />
              <Link to="/discover" className="button button-secondary cta-main">
                Explore Destinations
              </Link>
            </div>
            <Link to="/discover" className="button button-tertiary">
              Join a Group
            </Link>
          </div>
        </div>
      </section>

      <section className="feature-cards categories-row">
        {valueCards.map((card) => (
          <article key={card.title} className="feature-card category-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="carousel-section">
        <div className="section-intro">
          <span className="eyebrow">Featured destinations</span>
          <h2>Discover Bangladesh’s most loved routes.</h2>
        </div>
        <div className="carousel-card featured-card">
          <div className="carousel-image" style={{ backgroundImage: `url(${carouselItem.hero})` }}>
            <div className="carousel-badge">{carouselItem.region}</div>
            <div className="rating-badge">{carouselItem.rating} ★</div>
          </div>
          <div className="carousel-copy">
            <h3>{carouselItem.name}</h3>
            <p>{carouselItem.summary}</p>
            <div className="destination-meta">
              <div className="meta-left">
                <span className="badge">{carouselItem.category}</span>
                <span className="rating small">{carouselItem.rating} · {carouselItem.reviews || 120} reviews</span>
              </div>
              <Link to={`/destination/${carouselItem.slug}`} className="button button-primary">
                View Details
              </Link>
            </div>
          </div>
        </div>
        <div className="carousel-controls">
          <button onClick={prevSlide} className="icon-button">‹</button>
          <span>{carouselIndex + 1} / {total}</span>
          <button onClick={nextSlide} className="icon-button">›</button>
        </div>
        <div className="carousel-preview top-picks">
          {previewItems.map((item) => (
            <div key={item.slug} className="preview-item" onClick={() => setCarouselIndex(featuredDestinations.indexOf(item))}>
              <div className="preview-thumb" style={{ backgroundImage: `url(${item.hero})` }} />
              <div>
                <strong>{item.name}</strong>
                <p>{item.region}</p>
                <div className="rating small">{item.rating} ★</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="steps-section">
        <div className="section-intro">
          <span className="eyebrow">How it works</span>
          <h2>Plan your trip in three easy steps.</h2>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <strong>01</strong>
            <h3>Discover</h3>
            <p>Search destinations, compare routes and find the right plan.</p>
          </div>
          <div className="step-card">
            <strong>02</strong>
            <h3>Plan with Group</h3>
            <p>Invite friends, assign tasks and coordinate bookings together.</p>
          </div>
          <div className="step-card">
            <strong>03</strong>
            <h3>Book & Explore</h3>
            <p>Reserve guides, accommodations and set off with confidence.</p>
          </div>
        </div>
        
        <section className="top-choices">
          <div className="section-intro">
            <span className="eyebrow">Top choices</span>
            <h2>Traveler favorites and highly rated spots.</h2>
          </div>
          <div className="destination-grid">
            {featuredDestinations.map((d) => (
              <article key={d.slug} className="destination-card">
                <div className="destination-image" style={{ backgroundImage: `url(${d.hero})` }} />
                <div className="destination-copy">
                  <h3>{d.name}</h3>
                  <div className="destination-meta">
                    <span className="rating">{d.rating} ★</span>
                    <span className="badge">{d.category}</span>
                    <small className="meta-text">{d.region}</small>
                  </div>
                  <p>{d.summary}</p>
                  <div className="card-actions">
                    <Link to={`/destination/${d.slug}`} className="button button-primary">View</Link>
                    <button className="button button-tertiary">Save</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="stats-section">
        {appStats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <strong>{stat.value.toLocaleString()}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="stories-section">
        <div className="section-intro">
          <span className="eyebrow">Community trip stories</span>
          <h2>Recent journeys shared by travelers.</h2>
        </div>
        <div className="story-grid">
          {landingStories.map((story) => (
            <article key={story.id} className="story-card" style={{ backgroundImage: `url(${story.image})` }}>
              <div className="story-overlay">
                <h3>{story.title}</h3>
                <p>{story.summary}</p>
                <div className="story-meta">
                  <span className="rating small">{story.rating || 4.8} ★</span>
                  <span className="meta-text">{story.location}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="chat-teaser">
        <div>
          <span className="eyebrow">AI Travel Assistant</span>
          <h2>Get instant recommendations for routes, budget and local tips.</h2>
          <p>Ask the assistant for destination ideas, itinerary suggestions and transport guidance.</p>
        </div>
        <div className="chat-card">
          <div className="chat-message chat-user">What is the best 4-day group route from Dhaka?</div>
          <div className="chat-message chat-bot">
            Try a mix of Dhaka → Sajek → Rangamati with one night in the hills and two nights by the lake. Add a group boat ride and local hill village guide.
          </div>
        </div>
      </section>

      <section className="download-banner">
        <div>
          <span className="eyebrow">Download the App</span>
          <h2>Take your Bangladesh travel plans with you, wherever you go.</h2>
          <p>Available on Google Play and the App Store for easy planning on mobile.</p>
        </div>
        <div className="download-buttons">
          <a href="#" className="button button-secondary">Google Play</a>
          <a href="#" className="button button-secondary">App Store</a>
        </div>
      </section>
    </main>
  )
}
