import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { valueCards, appStats, featuredDestinations, landingStories } from '../data'

const DEST_IMGS = {
  'bandarban':    'https://images.pexels.com/photos/35478460/pexels-photo-35478460.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',
  'sundarbans':   'https://images.pexels.com/photos/975771/pexels-photo-975771.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'coxs-bazar':   'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'sajek':        'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'sreemangal':   'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'dhaka':        'https://images.pexels.com/photos/3582392/pexels-photo-3582392.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'kuakata':      'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'paharpur':     'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'tangail-haor': 'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1600',
}
const STORY_IMGS = [
  'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800',
]

/* ─── Story Overrides ─── */
const STORY_OVERRIDE_IMGS = {
  'Sundarbans': 'https://images.pexels.com/photos/975771/pexels-photo-975771.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Sreemangal': 'https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?auto=compress&cs=tinysrgb&w=800',
  "Cox": 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=800',
}
const STORY_OVERRIDE_RATINGS = {
  'Sundarbans': 4.9,
  'Sreemangal': 4.7,
}

const destImg = (d) => DEST_IMGS[d.slug] || d.hero
const STAT_ICONS = ['🗺️','👥','🧭','🌍']

export default function Home() {
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [savedCards, setSavedCards] = useState({})
  const carouselItem = featuredDestinations[carouselIndex]
  const total = featuredDestinations.length
  const nextSlide = () => setCarouselIndex((i) => (i + 1) % total)
  const prevSlide = () => setCarouselIndex((i) => (i - 1 + total) % total)
  const previewItems = useMemo(() => featuredDestinations.slice(0, 3), [])
  const toggleSave = (slug) => setSavedCards((prev) => ({ ...prev, [slug]: !prev[slug] }))

  return (
    <main className="page-shell">

      {/* ════ HERO ════ */}
      <section className="hero-panel hero-tripadvisor">
        <div className="hero-bg">
          <img className="hero-bg-img md-block"
            src="https://images.pexels.com/photos/32692905/pexels-photo-32692905.jpeg"
            alt="Bangladesh landscape" />
          <div className="hero-bg-overlay" />
        </div>
        <div className="hero-copy">
          <span className="eyebrow">✦ Explore Bangladesh</span>
          <h1>Plan Smart. Travel Together.<br/>Explore Bangladesh.</h1>
          <p>TripoBD helps you discover destinations, compare reviews, find top routes, and book with local confidence.</p>

          <div className="hero-search hs-wrap">
            <div className="search-bar hs-bar">
              <span className="search-icon hs-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2.2"/>
                </svg>
              </span>
              <input className="search-input hs-input" placeholder="Where in Bangladesh? e.g. Cox's Bazar, Sundarbans…" />
              <div className="hs-divider" />
              <select className="search-select hs-select">
                <option>All types</option>
                <option>Beach</option>
                <option> Hills</option>
                <option> Forest</option>
                <option> Heritage</option>
                <option> City</option>
              </select>
              <button className="hs-search-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2.5"/>
                </svg>
                Search
              </button>
            </div>
            <div className="search-suggestions hs-pills">
              <span className="hs-pill-label">Popular:</span>
              {['Top picks','Budget trips','Family friendly','Weekend getaways'].map(p => (
                <button key={p} className="pill hs-pill">{p}</button>
              ))}
            </div>
          </div>

          <div className="hero-actions">
            <div className="cta-gradient-group">
              <div className="cta-gradient" />
              <Link to="/discover" className="button button-secondary cta-main">Explore Destinations</Link>
            </div>
            <Link to="/discover" className="button button-tertiary">Join a Group</Link>
          </div>
        </div>
      </section>

      {/* ════ VALUE CARDS ════ */}
      <section className="feature-cards categories-row">
        {valueCards.map((card) => (
          <article key={card.title} className="feature-card category-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      {/* ════ CAROUSEL ════ */}
      <section className="fc-section">
        <div className="fc-intro">
          <div className="fc-intro-top">
            <span className="fc-eyebrow">✦ Featured destinations</span>
            <Link to="/featured-destinations" className="fc-all-btn">Explore all featured</Link>
          </div>
          <h2>Discover Bangladesh's most loved routes.</h2>
        </div>
        <div className="fc-card">
          <div className="fc-card-img" style={{ backgroundImage: `url(${destImg(carouselItem)})` }}>
            <div className="fc-img-overlay" />
            <span className="fc-badge-region">{carouselItem.region}</span>
            <span className="fc-badge-rating">{carouselItem.rating} ★</span>
          </div>
          <div className="fc-card-body">
            <span className="fc-cat-tag">{carouselItem.category}</span>
            <h3 className="fc-title">{carouselItem.name}</h3>
            <p className="fc-summary">{carouselItem.summary}</p>
            <div className="fc-meta">
              <span className="fc-reviews">⭐ {carouselItem.rating} · {carouselItem.reviews || 120} reviews</span>
              <Link to={`/destination/${carouselItem.slug}`} className="fc-detail-btn">View Details →</Link>
            </div>
          </div>
        </div>
        <div className="fc-controls">
          <button onClick={prevSlide} className="fc-arrow" aria-label="Previous">‹</button>
          <div className="fc-dots">
            {featuredDestinations.map((_, i) => (
              <button key={i} className={`fc-dot${i === carouselIndex ? ' fc-dot-active' : ''}`}
                onClick={() => setCarouselIndex(i)} aria-label={`Slide ${i+1}`} />
            ))}
          </div>
          <button onClick={nextSlide} className="fc-arrow" aria-label="Next">›</button>
        </div>
        <div className="fc-strip">
          {previewItems.map((item) => (
            <div key={item.slug} className="fc-prev"
              onClick={() => setCarouselIndex(featuredDestinations.indexOf(item))}>
              <div className="fc-prev-thumb" style={{ backgroundImage: `url(${destImg(item)})` }} />
              <div className="fc-prev-info">
                <strong>{item.name}</strong>
                <span>{item.region}</span>
                <em>{item.rating} ★</em>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section className="hw-section">
        <div className="hw-intro">
          <span className="hw-eyebrow">✦ How it works</span>
          <h2>Plan your trip in three easy steps.</h2>
        </div>
        <div className="hw-grid">
          {[
            { n:'01', icon:'🔍', t:'Discover', d:'Search destinations, compare routes and find the right plan.' },
            { n:'02', icon:'👥', t:'Plan with Group', d:'Invite friends, assign tasks and coordinate bookings together.' },
            { n:'03', icon:'✈️', t:'Book & Explore', d:'Reserve guides, accommodations and set off with confidence.' },
          ].map(s => (
            <div key={s.n} className="hw-card">
              <div className="hw-num">{s.n}</div>
              <div className="hw-icon">{s.icon}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════ TOP CHOICES ════ */}
      <section className="tc-section">
        <div className="tc-intro">
          <span className="tc-eyebrow">✦ Top choices</span>
          <h2>Traveler favorites and highly rated spots.</h2>
        </div>
        <div className="tc-grid">
          {featuredDestinations.map((d) => {
            const isBandarban = d.slug === 'bandarban'
            const isSundarbans = d.slug === 'sundarbans'
            const img = destImg(d)
            const isSaved = !!savedCards[d.slug]
            return (
              <article key={d.slug} className="tc-card">
                <div className="tc-img-wrap">
                  <div className="tc-img" style={{ backgroundImage: `url(${img})` }}>
                    <div className="tc-img-overlay" />
                    <span className="tc-rating-badge">{d.rating} ★</span>
                    {isBandarban && <span className="tc-badge-gold">✦ Nilgiri Hills</span>}
                    {isSundarbans && <span className="tc-badge-green">🌿 UNESCO Site</span>}
                  </div>
                </div>
                <div className="tc-content">
                  <div className="tc-header">
                    <h3 className="tc-name">{d.name}</h3>
                    <span className="tc-cat">{d.category}</span>
                  </div>
                  <p className="tc-region">📍 {d.region}</p>
                  <div className="tc-actions">
                    {isBandarban ? (
                      <a href="https://www.amazingtoursbd.com/nilgiri-bandarban-hills-of-bangladesh"
                        target="_blank" rel="noopener noreferrer" className="tc-btn-view">View</a>
                    ) : isSundarbans ? (
                      <a href="https://archive.roar.media/bangla/main/travel/beautiful-ratargul-swamp-forest"
                        target="_blank" rel="noopener noreferrer" className="tc-btn-view">View</a>
                    ) : (
                      <Link to={`/destination/${d.slug}`} className="tc-btn-view">View</Link>
                    )}
                    <button className={`tc-btn-save${isSaved ? ' tc-btn-saved' : ''}`}
                      onClick={() => toggleSave(d.slug)}>
                      {isSaved ? '❤️' : '🤍'} Save
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ════ STATS ════ */}
      <section className="st-section">
        {appStats.map((stat, i) => (
          <div key={stat.label} className="st-card">
            <span className="st-icon">{STAT_ICONS[i] || '📊'}</span>
            <strong className="st-val">{stat.value.toLocaleString()}</strong>
            <span className="st-label">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* ════ STORIES ════ */}
      <section className="hs-stories">
        <div className="hs-intro">
          <span className="hs-eyebrow">📸 Community Trip Stories</span>
          <h2>Recent journeys shared by travelers.</h2>
          <p className="hs-sub">Real adventures. Real people. Real Bangladesh.</p>
        </div>
        <div className="hs-grid">
          {landingStories.map((story, i) => {
            const locKey = Object.keys(STORY_OVERRIDE_IMGS).find(k => story.location && story.location.includes(k));
            const bg = locKey ? STORY_OVERRIDE_IMGS[locKey] : (story.image || STORY_IMGS[i % STORY_IMGS.length]);
            const rating = locKey ? STORY_OVERRIDE_RATINGS[locKey] : (story.rating || 4.8);
            
            return (
              <article key={story.id} className="hs-card" style={{ backgroundImage: `url(${bg})` }}>
                <div className="hs-overlay">
                  <span className="hs-loc-pill">📍 {story.location}</span>
                  <h3>{story.title}</h3>
                  <p>{story.summary}</p>
                  <div className="hs-meta">
                    <span className="hs-stars">{'★'.repeat(Math.floor(rating))}</span>
                    <span className="hs-rnum">{rating}</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ════ BANDARBAN SPOTLIGHT ════ */}
      <section className="bs-section">
        <div className="bs-img-wrap">
          <img src="https://images.pexels.com/photos/35478460/pexels-photo-35478460.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop"
            alt="Nilgiri Hills Bandarban" className="bs-img" />
          <div className="bs-img-overlay" />
        </div>
        <div className="bs-copy">
          <span className="eyebrow">Destination spotlight</span>
          <h2>Nilgiri Hills, Bandarban</h2>
          <p>Perched at 2,200 ft above sea level, Nilgiri offers some of Bangladesh's most breathtaking panoramic views — misty peaks, lush hill tribe villages, and golden sunrises above the clouds.</p>
          <div className="bs-meta">
            <span className="badge">Hill Tracts</span>
            <span className="badge">4.8 ★</span>
            <span className="badge">Chittagong</span>
          </div>
          <a href="https://www.amazingtoursbd.com/nilgiri-bandarban-hills-of-bangladesh"
            target="_blank" rel="noopener noreferrer" className="bs-cta-btn">
            Explore Nilgiri →
          </a>
        </div>
      </section>

      {/* ════ AI CHAT ════ */}
      <section className="hc-section">
        <div className="hc-bg" />
        <div className="hc-intro">
          <span className="hc-eyebrow">🤖 AI Travel Assistant</span>
          <h2>Get instant recommendations for routes, budget and local tips.</h2>
          <p>Ask the assistant for destination ideas, itinerary suggestions and transport guidance.</p>
        </div>
        <div className="hc-card">
          <div className="hc-row">
            <div className="hc-avatar hc-avatar-user">You</div>
            <div className="hc-bubble hc-bubble-user">What is the best 4-day group route from Dhaka?</div>
          </div>
          <div className="hc-row hc-row-bot">
            <div className="hc-avatar hc-avatar-bot">🤖</div>
            <div className="hc-bubble hc-bubble-bot">Try a mix of Dhaka → Sajek → Rangamati with one night in the hills and two nights by the lake. Add a group boat ride and local hill village guide.</div>
          </div>
          <div className="hc-typing"><span /><span /><span /></div>
        </div>
        <div className="hc-cta-row">
          <Link to="/chat" className="hc-cta-btn">Try the AI Assistant →</Link>
        </div>
      </section>

      {/* ════ DOWNLOAD ════ */}
      <section className="hd-section">
        <div className="hd-text">
          <span className="hd-eyebrow">📱 Download the App</span>
          <h2>Take your Bangladesh travel plans with you, wherever you go.</h2>
          <p>Available on Google Play and the App Store for easy planning on mobile.</p>
          <ul className="hd-features">
            <li>✓ Offline maps &amp; guides</li>
            <li>✓ Group trip coordination</li>
            <li>✓ Real-time destination updates</li>
          </ul>
        </div>
        <div className="hd-visual">
          <div className="hd-phone-mock">
            <div className="hd-screen-content">
              <div className="hd-screen-bar" />
              <div className="hd-screen-card" />
              <div className="hd-screen-card hd-sc2" />
              <div className="hd-screen-row">
                <div className="hd-dot" /><div className="hd-dot" />
                <div className="hd-dot hd-dot-accent" />
              </div>
            </div>
          </div>
        </div>
        <div className="hd-buttons-wrap">
          <a href="#" className="hd-store-btn">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
            </svg>
            <div><span className="hd-sl">GET IT ON</span><span className="hd-sn">Google Play</span></div>
          </a>
          <a href="#" className="hd-store-btn">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
            </svg>
            <div><span className="hd-sl">Download on the</span><span className="hd-sn">App Store</span></div>
          </a>
          <p className="hd-note">Free · No ads · Updated weekly</p>
        </div>
      </section>

      {/* ════════════ STYLES ════════════ */}
      <style>{`
        /* ══ SEARCH BAR ══ */
        .hs-wrap { margin-top: 1.75rem; }
        .hs-bar {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.97);
          border-radius: 56px;
          padding: .35rem .35rem .35rem 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.12);
          gap: 0; max-width: 720px;
        }
        .hs-icon { color: #888; flex-shrink:0; display:flex; align-items:center; }
        .hs-input {
          flex: 1; border: none; outline: none; background: transparent;
          font-size: .97rem; color: #1a1a2e; padding: .5rem .75rem; min-width: 0;
        }
        .hs-input::placeholder { color: #aaa; }
        .hs-divider { width: 1px; height: 24px; background: #ddd; flex-shrink:0; }
        .hs-select {
          border: none; outline: none; background: transparent;
          font-size: .88rem; color: #444; padding: .5rem .75rem;
          cursor: pointer; flex-shrink:0;
          -webkit-appearance: none; appearance: none;
        }
        .hs-search-btn {
          display: flex; align-items: center; gap: .5rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff; border: none; border-radius: 40px;
          padding: .7rem 1.4rem; font-size: .92rem; font-weight: 700;
          cursor: pointer; flex-shrink:0;
          transition: opacity .2s, transform .15s; white-space: nowrap;
        }
        .hs-search-btn:hover { opacity:.88; transform:scale(1.03); }
        .hs-pills { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; margin-top:.9rem; }
        .hs-pill-label { color:rgba(255,255,255,.65); font-size:.8rem; }
        .hs-pill {
          background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.3);
          color:#fff; border-radius:999px; padding:.3rem .85rem; font-size:.8rem;
          cursor:pointer; transition:background .2s; backdrop-filter:blur(4px);
        }
        .hs-pill:hover { background:rgba(255,255,255,.28); }
        @media(max-width:600px){
          .hs-bar { border-radius:1rem; padding:.5rem; flex-wrap:wrap; gap:.4rem; }
          .hs-divider,.hs-select { display:none; }
          .hs-input { padding:.5rem .5rem; font-size:.9rem; }
          .hs-search-btn { width:100%; justify-content:center; border-radius:.75rem; }
        }

        /* ══ FEATURED CAROUSEL ══ */
        .fc-section {
          padding: 5rem clamp(1.5rem,5vw,6rem);
          background: linear-gradient(145deg, #fef7f0 0%, #fdf2e9 40%, #f7f9fc 100%);
          margin: 2rem 0;
        }
        .fc-intro { text-align: center; margin-bottom: 2.5rem; }
        .fc-intro-top {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .fc-eyebrow {
          display: inline-block;
          background: linear-gradient(90deg,#e63946,#f4a261);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text; font-weight:700;
          font-size: .82rem; letter-spacing: .06em; text-transform: uppercase;
        }
        .fc-all-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          padding: 0.35rem 0.85rem;
          font-size: 0.78rem;
          color: #334155;
          text-decoration: none;
          background: #fff;
          font-weight: 700;
        }
        .fc-all-btn:hover { border-color: #10b981; color: #047857; }
        .fc-intro h2 { font-size: clamp(1.5rem,3vw,2.2rem); font-weight: 800; color: #0f172a; margin: .5rem 0 0; }
        .fc-card {
          display: flex; border-radius: 1.5rem; overflow: hidden; background: #fff;
          box-shadow: 0 12px 48px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
          border: 1.5px solid rgba(230,57,70,.08);
        }
        .fc-card-img {
          position: relative; flex: 0 0 55%; min-height: 420px;
          background-size: cover; background-position: center;
        }
        .fc-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.5) 0%, transparent 55%),
                      linear-gradient(to right, transparent 50%, rgba(0,0,0,.08) 100%);
          pointer-events: none;
        }
        .fc-badge-region {
          position: absolute; top: 1rem; left: 1rem;
          background: rgba(0,0,0,.5); backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,.25); color: #fff;
          font-size: .75rem; font-weight: 600; padding: .3rem .85rem; border-radius: 999px;
          display: inline-flex; align-items: center;
        }
        .fc-badge-rating {
          position: absolute; bottom: 1rem; left: 1rem;
          background: linear-gradient(135deg,#f59e0b,#d97706); color: #fff;
          font-size: .8rem; font-weight: 700; padding: .3rem .85rem; border-radius: 999px;
          box-shadow: 0 2px 10px rgba(0,0,0,.3); display: inline-flex; align-items: center;
        }
        .fc-card-body { flex: 1; padding: 2.5rem 2.25rem; display: flex; flex-direction: column; justify-content: center; }
        .fc-cat-tag {
          display: inline-block; background: linear-gradient(135deg,#e63946,#f4a261); color: #fff;
          font-size: .7rem; font-weight: 700; padding: .25rem .75rem; border-radius: 999px;
          margin-bottom: 1rem; width: fit-content;
        }
        .fc-title { font-size: 1.65rem; font-weight: 800; color: #0f172a; margin: 0 0 .65rem; line-height: 1.2; }
        .fc-summary { color: #64748b; font-size: .97rem; line-height: 1.65; margin: 0 0 1.5rem; }
        .fc-meta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; }
        .fc-reviews { color: #94a3b8; font-size: .88rem; }
        .fc-detail-btn {
          display: inline-flex; align-items: center;
          background: linear-gradient(135deg,#10b981,#059669); color: #fff !important;
          font-size: .9rem; font-weight: 700; padding: .65rem 1.5rem; border-radius: 999px;
          text-decoration: none !important; border: none; transition: opacity .2s, transform .15s;
        }
        .fc-detail-btn:hover { opacity:.88; transform:scale(1.03); }
        .fc-controls { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
        .fc-arrow {
          width: 44px; height: 44px; border-radius: 50%; background: #fff; border: 1.5px solid #e2e8f0;
          font-size: 1.5rem; color: #334155; cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,.08); transition: background .2s, border-color .2s; line-height: 1;
        }
        .fc-arrow:hover { background:#f1f5f9; border-color:#cbd5e1; }
        .fc-dots { display: flex; gap: .45rem; }
        .fc-dot { width: 9px; height: 9px; border-radius: 50%; background: #cbd5e1; border: none; cursor: pointer; transition: background .2s, transform .2s; }
        .fc-dot-active { background: #e63946; transform: scale(1.35); }
        .fc-strip { display: flex; gap: 1rem; margin-top: 1.75rem; flex-wrap: wrap; }
        .fc-prev {
          display: flex; align-items: center; gap: .8rem; background: #fff; border-radius: 1rem;
          padding: .65rem; cursor: pointer; flex: 1; min-width: 190px; border: 1.5px solid #e2e8f0;
          transition: border-color .2s, box-shadow .2s;
        }
        .fc-prev:hover { border-color:#10b981; box-shadow:0 4px 16px rgba(16,185,129,.12); }
        .fc-prev-thumb { width: 60px; height: 60px; border-radius: .75rem; flex-shrink: 0; background-size: cover; background-position: center; }
        .fc-prev-info { display: flex; flex-direction: column; }
        .fc-prev-info strong { font-size: .88rem; color: #1e293b; }
        .fc-prev-info span { font-size: .75rem; color: #94a3b8; }
        .fc-prev-info em { font-size: .75rem; color: #f59e0b; font-weight: 600; font-style: normal; }
        @media(max-width:768px){
          .fc-card { flex-direction: column; } .fc-card-img { flex: none; min-height: 240px; }
          .fc-card-body { padding: 1.5rem; } .fc-title { font-size: 1.3rem; }
        }

        /* ══ HOW IT WORKS ══ */
        .hw-section {
          background: linear-gradient(135deg, #042f2e 0%, #064e3b 50%, #022c22 100%);
          padding: 5rem clamp(1.5rem,5vw,6rem); margin: 2rem 0;
        }
        .hw-intro { text-align: center; margin-bottom: 2.5rem; }
        .hw-eyebrow {
          display: inline-block; background: linear-gradient(90deg,#38bdf8,#818cf8);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.82rem; letter-spacing:.06em; text-transform:uppercase;
        }
        .hw-intro h2 { color:#fff; font-size:clamp(1.5rem,3vw,2.2rem); font-weight:800; margin:.5rem 0 0; }
        .hw-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2rem; }
        .hw-card {
          background: linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
          border:1px solid rgba(255,255,255,.12); border-radius:1.5rem; padding:2.5rem 2rem;
          text-align:center; color:#fff; transition:background .25s, transform .25s, box-shadow .25s;
          position: relative; overflow: hidden;
        }
        .hw-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background: linear-gradient(90deg,#10b981,#38bdf8); border-radius: 1.5rem 1.5rem 0 0;
        }
        .hw-card:hover {
          background:linear-gradient(145deg, rgba(255,255,255,.12), rgba(255,255,255,.05));
          transform:translateY(-6px); box-shadow: 0 16px 48px rgba(16,185,129,.15);
        }
        .hw-num { font-size:.75rem; font-weight:800; color:#38bdf8; letter-spacing:.1em; margin-bottom:.5rem; }
        .hw-icon { font-size:2.2rem; margin-bottom:.85rem; }
        .hw-card h3 { font-size:1.1rem; font-weight:700; margin:0 0 .5rem; color:#f1f5f9; }
        .hw-card p  { font-size:.9rem; color:rgba(255,255,255,.6); line-height:1.6; margin:0; }
        @media(max-width:640px){ .hw-grid { grid-template-columns:1fr; } }

        /* ══ TOP CHOICES ══ */
        .tc-section {
          padding: 5rem clamp(1.5rem,5vw,6rem);
          background: linear-gradient(145deg, #fef7f0 0%, #fdf2e9 40%, #f7f9fc 100%); margin: 2rem 0;
        }
        .tc-intro { text-align:center; margin-bottom:2.5rem; }
        .tc-eyebrow {
          display:inline-block; background:linear-gradient(90deg,#e63946,#f4a261);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.82rem; letter-spacing:.06em; text-transform:uppercase;
        }
        .tc-intro h2 { font-size:clamp(1.5rem,3vw,2.2rem); font-weight:800; color:#0f172a; margin:.5rem 0 0; }
        .tc-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1.75rem; }
        .tc-card {
          background:#fff; border-radius:1.5rem; overflow:hidden;
          box-shadow:0 4px 16px rgba(0,0,0,.07); transition:transform .25s, box-shadow .25s;
          border:1.5px solid rgba(230,57,70,.06); display:flex; flex-direction:column;
        }
        .tc-card:hover { transform:translateY(-6px); box-shadow:0 16px 48px rgba(230,57,70,.12); }
        .tc-img-wrap { position:relative; width:100%; }
        .tc-img { position:relative; width:100%; height:0; padding-bottom:65%; background-size:cover; background-position:center; }
        .tc-img-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.55) 0%,transparent 55%); }
        .tc-rating-badge {
          position:absolute; top:.75rem; right:.75rem; background:linear-gradient(135deg,#f59e0b,#d97706);
          color:#fff; font-size:.72rem; font-weight:700; padding:.25rem .65rem; border-radius:999px;
          box-shadow:0 2px 8px rgba(0,0,0,.25);
        }
        .tc-badge-gold {
          position:absolute; top:.75rem; left:.75rem; background:linear-gradient(135deg,#d4a017,#f0c040);
          color:#1a0e00; font-size:.68rem; font-weight:700; padding:.25rem .65rem; border-radius:999px; z-index:2;
        }
        .tc-badge-green {
          position:absolute; top:.75rem; left:.75rem; background:linear-gradient(135deg,#16a34a,#4ade80);
          color:#fff; font-size:.68rem; font-weight:700; padding:.25rem .65rem; border-radius:999px; z-index:2;
        }
        .tc-content { padding:1.25rem 1.4rem 1.4rem; flex:1; display:flex; flex-direction:column; }
        .tc-header { display:flex; align-items:center; justify-content:space-between; gap:.5rem; margin-bottom:.4rem; }
        .tc-name { font-size:1.08rem; font-weight:700; color:#0f172a; margin:0; line-height:1.3; }
        .tc-cat {
          background:linear-gradient(135deg,#e63946,#f4a261) !important; color:#fff !important;
          font-size:.65rem; font-weight:700; padding:.22rem .6rem; border-radius:999px; border:none !important;
          white-space:nowrap; flex-shrink:0;
        }
        .tc-region { font-size:.85rem; color:#64748b; margin:0 0 .9rem; display:flex; align-items:center; gap:.25rem; }
        .tc-actions { display:flex; gap:.6rem; align-items:center; margin-top:auto; padding-top:.75rem; border-top:1px solid #f1f5f9; }
        .tc-btn-view {
          flex:1; text-align:center; background:linear-gradient(135deg,#10b981,#059669); color:#fff;
          font-size:.84rem; font-weight:700; border:none; border-radius:.65rem; padding:.6rem .75rem;
          cursor:pointer; transition:opacity .2s, transform .15s; text-decoration:none;
          display:flex; align-items:center; justify-content:center;
        }
        .tc-btn-view:hover { opacity:.85; transform:scale(1.02); }
        .tc-btn-save {
          display:flex; align-items:center; gap:.3rem; border:1.5px solid #e2e8f0; background:transparent;
          color:#64748b; font-size:.8rem; font-weight:600; border-radius:.65rem; padding:.55rem .7rem;
          cursor:pointer; white-space:nowrap; transition:background .2s, color .2s, border-color .2s;
        }
        .tc-btn-save:hover { border-color:#e63946; color:#e63946; background:rgba(230,57,70,.04); }
        .tc-btn-saved { border-color:#e63946 !important; color:#e63946 !important; background:rgba(230,57,70,.06) !important; }
        @media(max-width:768px){ .tc-grid { grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1.25rem; } }
        @media(max-width:480px){ .tc-grid { grid-template-columns:1fr; } }

        /* ══ STATS ══ */
        .st-section {
          display:grid; grid-template-columns:repeat(4,1fr); gap:0;
          background:linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #0e7490 100%);
          padding:0; margin: 2rem 0; border-radius: 1.5rem; overflow: hidden;
          box-shadow: 0 12px 48px rgba(13,148,136,.3);
        }
        .st-card {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:2.75rem 1.5rem; text-align:center; color:#fff;
          border-right:1px solid rgba(255,255,255,.15); transition:background .2s; position:relative;
        }
        .st-card:last-child { border-right:none; }
        .st-card:hover { background:rgba(255,255,255,.08); }
        .st-icon { font-size:1.75rem; margin-bottom:.5rem; }
        .st-val { font-size:clamp(1.75rem,3.5vw,2.75rem); font-weight:900; line-height:1; margin-bottom:.3rem; display:block; }
        .st-label { font-size:.82rem; color:rgba(255,255,255,.8); font-weight:500; }
        @media(max-width:700px){
          .st-section { grid-template-columns:repeat(2,1fr); }
          .st-card { border-bottom:1px solid rgba(255,255,255,.15); }
          .st-card:nth-child(2n){ border-right:none; }
          .st-card:nth-child(3),.st-card:nth-child(4){ border-bottom:none; }
        }
        @media(max-width:400px){ .st-section { grid-template-columns:1fr; } }

        /* ══ STORIES ══ */
        .hs-stories {
          padding:5rem clamp(1.5rem,5vw,6rem);
          background:linear-gradient(160deg,#0d1b2a 0%,#1b2838 100%);
          position:relative; margin: 2rem 0; border-radius: 1.5rem; overflow: hidden;
        }
        .hs-stories::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(ellipse at 20% 80%,rgba(13,148,136,.1) 0%,transparent 55%),
                      radial-gradient(ellipse at 80% 10%,rgba(244,162,97,.08) 0%,transparent 50%);
          pointer-events:none;
        }
        .hs-intro { text-align:center; margin-bottom:2.5rem; position:relative; z-index:1; }
        .hs-eyebrow {
          display:inline-block; background:linear-gradient(90deg,#f4a261,#e63946);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.82rem; letter-spacing:.06em; text-transform:uppercase;
        }
        .hs-intro h2 { color:#fff; font-size:clamp(1.5rem,3vw,2.2rem); font-weight:800; margin:.5rem 0 0; }
        .hs-sub { color:rgba(255,255,255,.5); font-size:.92rem; margin-top:.25rem; }
        .hs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1.5rem; position:relative; z-index:1; }
        .hs-card {
          position:relative; border-radius:1.5rem; overflow:hidden; height:340px;
          background-size:cover; background-position:center; cursor:pointer;
          transition:transform .3s, box-shadow .3s; border: 1px solid rgba(255,255,255,.08);
        }
        .hs-card:hover { transform:scale(1.025); box-shadow:0 16px 48px rgba(0,0,0,.45); }
        .hs-overlay {
          position:absolute; inset:0;
          background:linear-gradient(to top,rgba(10,15,25,.88) 0%,rgba(10,15,25,.18) 60%,transparent 100%);
          display:flex; flex-direction:column; justify-content:flex-end; padding:1.5rem; color:#fff;
        }
        .hs-loc-pill {
          display:inline-block; background:rgba(255,255,255,.15); backdrop-filter:blur(6px);
          border:1px solid rgba(255,255,255,.2); border-radius:999px; font-size:.7rem; font-weight:600;
          padding:.25rem .75rem; margin-bottom:.75rem; width:fit-content;
        }
        .hs-overlay h3 { font-size:1.1rem; font-weight:700; margin:0 0 .35rem; line-height:1.3; }
        .hs-overlay p  {
          font-size:.84rem; color:rgba(255,255,255,.7); margin:0 0 .75rem; line-height:1.5;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
        }
        .hs-meta { display:flex; align-items:center; gap:.4rem; }
        .hs-stars { color:#f4a261; font-size:.88rem; }
        .hs-rnum  { font-size:.78rem; color:rgba(255,255,255,.55); }
        @media(max-width:480px){ .hs-grid { grid-template-columns:1fr; } .hs-card { height:260px; } }

        /* ══ BANDARBAN ══ */
        .bs-section {
          display:flex; align-items:center; gap:3rem; padding:5rem clamp(1.5rem,5vw,6rem);
          background:linear-gradient(135deg,#0a1628 0%,#0f2644 60%,#0a1e36 100%);
          position:relative; overflow:hidden; margin: 2rem 0; border-radius: 1.5rem;
          border: 1px solid rgba(212,160,23,.1);
        }
        .bs-section::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(ellipse at 30% 50%,rgba(212,160,23,.15) 0%,transparent 60%),
                      radial-gradient(ellipse at 80% 20%,rgba(30,100,200,.12) 0%,transparent 50%);
          pointer-events:none;
        }
        .bs-img-wrap {
          flex:0 0 50%; border-radius:1.5rem; overflow:hidden;
          box-shadow:0 20px 60px rgba(0,0,0,.45); position:relative;
        }
        .bs-img { width:100%; height:420px; object-fit:cover; display:block; transition:transform .5s; }
        .bs-img-wrap:hover .bs-img { transform:scale(1.04); }
        .bs-img-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(10,22,40,.5) 0%,transparent 60%); }
        .bs-copy { flex:1; color:#fff; position:relative; z-index:1; }
        .bs-copy h2 {
          font-size:clamp(2rem,4vw,3rem); font-weight:800; line-height:1.15; margin:.5rem 0 1rem;
          background:linear-gradient(135deg,#fff 40%,#d4a017);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .bs-copy p { color:rgba(255,255,255,.75); font-size:1.05rem; line-height:1.7; margin-bottom:1.5rem; }
        .bs-meta { display:flex; gap:.6rem; flex-wrap:wrap; margin-bottom:2rem; }
        .bs-cta-btn {
          display:inline-flex; align-items:center; background:linear-gradient(135deg,#10b981,#059669);
          color:#fff !important; font-size:.95rem; font-weight:700; padding:.75rem 1.75rem;
          border-radius:999px; text-decoration:none !important; border:none; transition:opacity .2s, transform .15s;
        }
        .bs-cta-btn:hover { opacity:.88; transform:scale(1.03); }
        @media(max-width:860px){
          .bs-section { flex-direction:column; padding:3rem 1.5rem; }
          .bs-img-wrap { flex:none; width:100%; } .bs-img { height:260px; }
        }

        /* ══ AI CHAT ══ */
        .hc-section {
          position:relative; overflow:hidden; padding:5rem clamp(1.5rem,5vw,6rem);
          background:linear-gradient(160deg,#0f172a 0%,#1a2744 50%,#0f172a 100%);
          margin: 2rem 0; border-radius: 1.5rem; border: 1px solid rgba(99,102,241,.1);
        }
        .hc-bg {
          position:absolute; inset:0; pointer-events:none;
          background:radial-gradient(ellipse at 10% 50%,rgba(99,102,241,.15) 0%,transparent 50%),
                      radial-gradient(ellipse at 90% 20%,rgba(34,211,238,.08) 0%,transparent 45%);
        }
        .hc-intro { text-align:center; margin-bottom:2rem; position:relative; z-index:1; }
        .hc-eyebrow {
          display:inline-block; background:linear-gradient(90deg,#818cf8,#38bdf8);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.82rem; letter-spacing:.06em; text-transform:uppercase;
        }
        .hc-intro h2 { color:#fff; font-size:clamp(1.5rem,3vw,2.2rem); font-weight:800; margin:.5rem 0 0; }
        .hc-intro p  { color:rgba(255,255,255,.6); font-size:.95rem; margin-top:.5rem; }
        .hc-card {
          position:relative; z-index:1; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1);
          border-radius:1.5rem; padding:2rem; max-width:600px; margin:0 auto; backdrop-filter:blur(10px);
          box-shadow:0 8px 32px rgba(0,0,0,.3); display:flex; flex-direction:column; gap:.75rem;
        }
        .hc-row { display:flex; align-items:flex-end; gap:.75rem; }
        .hc-row-bot { flex-direction:row-reverse; }
        .hc-avatar { flex-shrink:0; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.7rem; font-weight:700; }
        .hc-avatar-user { background:linear-gradient(135deg,#6366f1,#818cf8); color:#fff; }
        .hc-avatar-bot  { background:linear-gradient(135deg,#0ea5e9,#38bdf8); font-size:1rem; }
        .hc-bubble { padding:.8rem 1rem; font-size:.92rem; line-height:1.5; max-width: 85%; }
        .hc-bubble-user { background:linear-gradient(135deg,#4f46e5,#6366f1); color:#fff; border-radius:1rem 1rem 1rem .25rem; box-shadow:0 4px 16px rgba(99,102,241,.3); }
        .hc-bubble-bot { background:rgba(255,255,255,.08); color:rgba(255,255,255,.9); border:1px solid rgba(255,255,255,.12); border-radius:1rem 1rem .25rem 1rem; }
        .hc-typing { display:flex; gap:.3rem; padding:.2rem .5rem; }
        .hc-typing span { width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,.3); animation:hc-blink 1.2s infinite ease-in-out; }
        .hc-typing span:nth-child(2){animation-delay:.2s} .hc-typing span:nth-child(3){animation-delay:.4s}
        @keyframes hc-blink{0%,80%,100%{opacity:.3}40%{opacity:1}}
        .hc-cta-row { position:relative; z-index:1; display:flex; justify-content:center; margin-top:2rem; }
        .hc-cta-btn {
          background:linear-gradient(135deg,#6366f1,#818cf8); color:#fff; border:none;
          padding:.85rem 2.2rem; font-size:1rem; font-weight:700; border-radius:999px;
          box-shadow:0 6px 24px rgba(99,102,241,.4); transition:transform .2s, box-shadow .2s;
          text-decoration:none; display:inline-block;
        }
        .hc-cta-btn:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(99,102,241,.5); }

        /* ══ DOWNLOAD ══ */
        .hd-section {
          display:grid; grid-template-columns:1fr auto auto; gap:3rem; align-items:center;
          padding:5rem clamp(1.5rem,5vw,6rem); background:linear-gradient(135deg,#020617 0%,#0f172a 50%,#1e1b4b 100%);
          position:relative; overflow:hidden; margin: 2rem 0; border-radius: 1.5rem; border: 1px solid rgba(99,102,241,.08);
        }
        .hd-section::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(ellipse at 70% 50%,rgba(99,102,241,.12) 0%,transparent 55%),
                      radial-gradient(ellipse at 10% 80%,rgba(230,57,70,.08) 0%,transparent 45%);
          pointer-events:none;
        }
        .hd-text { position:relative; z-index:1; }
        .hd-eyebrow {
          display:inline-block; background:linear-gradient(90deg,#a78bfa,#ec4899);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.82rem; letter-spacing:.06em; text-transform:uppercase;
        }
        .hd-text h2 { color:#fff; font-size:clamp(1.5rem,3vw,2.2rem); line-height:1.2; margin:.5rem 0 .6rem; }
        .hd-text p  { color:rgba(255,255,255,.55); margin-bottom:1.1rem; font-size:.95rem; }
        .hd-features { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:.35rem; }
        .hd-features li { color:rgba(255,255,255,.7); font-size:.88rem; }
        .hd-visual { position:relative; z-index:1; }
        .hd-phone-mock {
          width:145px; height:260px; background:linear-gradient(160deg,#1e293b,#0f172a);
          border:2px solid rgba(255,255,255,.12); border-radius:2rem; padding:.85rem .65rem;
          box-shadow:0 20px 60px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08);
        }
        .hd-screen-content { display:flex; flex-direction:column; gap:.5rem; }
        .hd-screen-bar { height:7px; background:linear-gradient(90deg,#e63946,#f4a261); border-radius:999px; }
        .hd-screen-card { height:52px; background:linear-gradient(135deg,rgba(230,57,70,.2),rgba(244,162,97,.15)); border-radius:.4rem; border:1px solid rgba(255,255,255,.07); }
        .hd-sc2 { height:38px; background:linear-gradient(135deg,rgba(99,102,241,.2),rgba(56,189,248,.12)); }
        .hd-screen-row { display:flex; gap:.35rem; }
        .hd-dot { width:18px; height:18px; border-radius:50%; background:rgba(255,255,255,.1); }
        .hd-dot-accent { background:linear-gradient(135deg,#e63946,#f4a261); }
        .hd-buttons-wrap { position:relative; z-index:1; display:flex; flex-direction:column; gap:.85rem; }
        .hd-store-btn {
          background:rgba(255,255,255,.07) !important; border:1.5px solid rgba(255,255,255,.18) !important;
          border-radius:1rem !important; padding:.85rem 1.3rem !important; color:#fff !important;
          backdrop-filter:blur(8px); transition:background .2s,border-color .2s,transform .15s;
          display:flex; align-items:center; gap:.7rem; min-width:195px; text-decoration:none;
        }
        .hd-store-btn:hover { background:rgba(255,255,255,.13) !important; border-color:rgba(255,255,255,.35) !important; transform:translateY(-2px); }
        .hd-sl { display:block; font-size:.65rem; color:rgba(255,255,255,.55); }
        .hd-sn { display:block; font-size:1rem; font-weight:700; }
        .hd-note { color:rgba(255,255,255,.3); font-size:.72rem; text-align:center; }
        @media(max-width:960px){ .hd-section { grid-template-columns:1fr 1fr; } .hd-text { grid-column:1/-1; } }
        @media(max-width:580px){
          .hd-section { grid-template-columns:1fr; padding:3rem 1.25rem; }
          .hd-visual { display:flex; justify-content:center; }
          .hd-store-btn { min-width:unset; width:100%; justify-content:center; }
        }
      `}</style>
    </main>
  )
}