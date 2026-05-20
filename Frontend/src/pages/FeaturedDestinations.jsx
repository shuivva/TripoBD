import { Link } from 'react-router-dom'
import { featuredDestinations } from '../data'

const DESTINATION_GUIDE = {
  sundarbans: {
    tagline: 'UNESCO mangrove wilderness',
    bestFor: 'Wildlife lovers, photographers, and eco-travelers',
    highlights: ['Sunrise boat safari', 'Watchtower wildlife spotting', 'Mangrove trail walk'],
    tips: 'Book a licensed guide and keep at least one full day for river exploration.',
  },
  'coxs-bazar': {
    tagline: 'The longest sea beach experience',
    bestFor: 'Family holidays and relaxed beach escapes',
    highlights: ['Laboni and Inani Beach', 'Marine Drive sunset views', 'Fresh seafood markets'],
    tips: 'Visit in the early morning for quieter beaches and better photo light.',
  },
  sajek: {
    tagline: 'Cloud-kissed valley retreat',
    bestFor: 'Couples, friends, and weekend mountain seekers',
    highlights: ['Konglak viewpoint', 'Misty sunrise', 'Local village culture'],
    tips: 'Start your final uphill ride before noon to avoid low-visibility weather.',
  },
  bandarban: {
    tagline: 'Adventure in the hill tracts',
    bestFor: 'Trekkers and nature adventure groups',
    highlights: ['Nilgiri viewpoint', 'Waterfall trekking', 'Tribal village visits'],
    tips: 'Carry grip-friendly shoes and verify road conditions before departure.',
  },
  sreemangal: {
    tagline: 'Tea capital of Bangladesh',
    bestFor: 'Slow travel, nature walks, and family-friendly trips',
    highlights: ['Tea estate cycling', 'Lawachara forest trails', 'Seven-layer tea tasting'],
    tips: 'Plan a two-night stay to cover both tea gardens and forest areas comfortably.',
  },
}

const fallbackGuide = {
  tagline: 'Featured destination',
  bestFor: 'All traveler types',
  highlights: ['Local culture', 'Nature experience', 'Memorable views'],
  tips: 'Travel early and reserve your stay in advance for smoother planning.',
}

export default function FeaturedDestinations() {
  return (
    <main className="page-shell fd-page">
      <section className="fd-hero">
        <div className="fd-hero-overlay" />
        <div className="fd-hero-content">
          <span className="fd-eyebrow">Featured destinations</span>
          <h1>Beautiful places to explore in Bangladesh</h1>
          <p>
            From Sundarbans mangrove adventures to beach escapes and hill retreats, discover
            informative picks with practical travel tips to plan your next trip confidently.
          </p>
        </div>
      </section>

      <section className="fd-grid-wrap">
        <div className="fd-grid">
          {featuredDestinations.map((destination) => {
            const guide = DESTINATION_GUIDE[destination.slug] || fallbackGuide

            return (
              <article key={destination.slug} className="fd-card">
                <div
                  className="fd-card-media"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.08), rgba(2, 6, 23, 0.65)), url(${destination.hero})`,
                  }}
                >
                  <span className="fd-rating">{destination.rating} ★</span>
                  <span className="fd-category">{destination.category}</span>
                </div>
                <div className="fd-card-body">
                  <div className="fd-head">
                    <h2>{destination.name}</h2>
                    <p>{guide.tagline}</p>
                  </div>
                  <p className="fd-summary">{destination.summary}</p>

                  <div className="fd-meta">
                    <span>📍 {destination.region}</span>
                    <span>🗓 {destination.duration}</span>
                    <span>🌤 Best season: {destination.season}</span>
                  </div>

                  <div className="fd-info-panels">
                    <div>
                      <h3>Best for</h3>
                      <p>{guide.bestFor}</p>
                    </div>
                    <div>
                      <h3>Highlights</h3>
                      <ul>
                        {guide.highlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3>Travel tip</h3>
                      <p>{guide.tips}</p>
                    </div>
                  </div>

                  <div className="fd-actions">
                    <Link to={`/destination/${destination.slug}`} className="fd-btn fd-btn-primary">
                      View destination
                    </Link>
                    <Link to="/discover" className="fd-btn fd-btn-secondary">
                      Explore more
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <style>{`
        .fd-page { padding-bottom: 2rem; }
        .fd-hero {
          position: relative;
          overflow: hidden;
          border-radius: 1.5rem;
          min-height: 340px;
          margin-bottom: 2rem;
          background: linear-gradient(120deg, #0f172a 0%, #1e293b 50%, #0b3b5a 100%);
          display: grid;
          place-items: center;
        }
        .fd-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.25) 0%, transparent 38%),
            radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.2) 0%, transparent 40%);
        }
        .fd-hero-content {
          position: relative;
          z-index: 1;
          max-width: 760px;
          text-align: center;
          color: #fff;
          padding: 2rem 1.25rem;
        }
        .fd-eyebrow {
          display: inline-block;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: #67e8f9;
        }
        .fd-hero-content h1 {
          margin: 0;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          line-height: 1.2;
        }
        .fd-hero-content p {
          margin: 0.9rem auto 0;
          color: rgba(255, 255, 255, 0.86);
          font-size: 1rem;
          line-height: 1.6;
        }

        .fd-grid-wrap {
          background: linear-gradient(145deg, #f8fafc 0%, #f0fdfa 100%);
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: clamp(1rem, 2.5vw, 2rem);
        }
        .fd-grid {
          display: grid;
          gap: 1.25rem;
        }
        .fd-card {
          background: #fff;
          border-radius: 1.2rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.06);
        }
        .fd-card-media {
          min-height: 210px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 0.9rem;
        }
        .fd-rating,
        .fd-category {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0.25rem 0.7rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: #fff;
        }
        .fd-rating { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .fd-category { background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(255, 255, 255, 0.28); }

        .fd-card-body { padding: 1.2rem 1.2rem 1.35rem; }
        .fd-head h2 {
          margin: 0;
          color: #0f172a;
          font-size: 1.35rem;
          line-height: 1.2;
        }
        .fd-head p {
          margin: 0.35rem 0 0;
          color: #0f766e;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .fd-summary {
          margin: 0.8rem 0 0.95rem;
          color: #475569;
          line-height: 1.62;
        }
        .fd-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          margin-bottom: 0.95rem;
        }
        .fd-meta span {
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 0.28rem 0.64rem;
        }
        .fd-info-panels {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 1rem;
        }
        .fd-info-panels > div {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.8rem;
          padding: 0.75rem;
        }
        .fd-info-panels h3 {
          margin: 0 0 0.38rem;
          color: #0f172a;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .fd-info-panels p,
        .fd-info-panels ul {
          margin: 0;
          color: #475569;
          font-size: 0.88rem;
          line-height: 1.5;
        }
        .fd-info-panels ul {
          padding-left: 1rem;
        }
        .fd-actions {
          display: flex;
          gap: 0.7rem;
          flex-wrap: wrap;
        }
        .fd-btn {
          text-decoration: none;
          border-radius: 0.72rem;
          padding: 0.58rem 1rem;
          font-weight: 700;
          font-size: 0.88rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .fd-btn-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }
        .fd-btn-secondary {
          border: 1px solid #cbd5e1;
          color: #334155;
          background: #fff;
        }
        .fd-btn:hover { opacity: 0.9; }

        @media (max-width: 860px) {
          .fd-info-panels {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}
