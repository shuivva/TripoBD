import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function AllStories() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')

  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStory, setSelectedStory] = useState(null)

  const loadStories = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:8000/api/traveler/stories/')
      if (res.ok) {
        const data = await res.json()
        setStories(data)
      } else {
        setError('Failed to load community trip stories.')
      }
    } catch {
      setError('Connection to backend failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStories()
  }, [])

  const filteredStories = stories.filter(s => {
    const q = searchQuery.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q) ||
      (s.destination_name || '').toLowerCase().includes(q) ||
      (s.author_name || '').toLowerCase().includes(q)
    );
  })

  if (!userId) {
    return (
      <main className="page-shell text-center">
        <p className="stories-error">Please sign in to read community trip stories.</p>
        <button className="button button-primary" onClick={() => navigate('/signin')}>Sign In</button>
      </main>
    )
  }

  return (
    <main className="page-shell all-stories-page">
      <header className="stories-header">
        <div className="header-titles">
          <h1>📖 Community Trip Stories</h1>
          <p>Read detailed itineraries, tips, and personal adventure logs shared by travelers across Bangladesh.</p>
        </div>
        <Link to="/traveler/reviews-stories" className="button button-primary write-story-btn">
          ✍️ Share Your Story
        </Link>
      </header>

      {/* Filter / Search Bar */}
      <section className="search-filter-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search stories by title, destination, content, or author..."
          className="search-input"
        />
      </section>

      {/* Stories Grid */}
      <section className="stories-container">
        {loading ? (
          <div className="stories-status">
            <div className="spinner"></div>
            <p>Gathering tales from the road...</p>
          </div>
        ) : error ? (
          <div className="stories-status stories-error-box">
            <p>⚠️ {error}</p>
            <button className="button button-secondary compact" onClick={loadStories}>Try Again</button>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="stories-status empty-box">
            <span>📭</span>
            <h3>No Trip Stories Found</h3>
            <p>Try refining your search keyword or write the first story for this location!</p>
          </div>
        ) : (
          <div className="stories-cards-grid">
            {filteredStories.map((story) => {
              const coverImg = story.cover_photo || 
                               (story.photos && story.photos[0]) || 
                               'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=800'
              return (
                <article key={story.id} className="story-card">
                  <div 
                    className="story-card-banner" 
                    style={{ backgroundImage: `url(${coverImg})` }}
                  />
                  <div className="story-card-content">
                    <div className="story-meta-tags">
                      <span className="story-dest-badge">📍 {story.destination_name}</span>
                      <span className="story-date">{new Date(story.published_at || story.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <h3 className="story-card-title">{story.title}</h3>
                    
                    <p className="story-card-snippet">
                      {story.content.substring(0, 160)}...
                    </p>

                    <div className="story-card-footer">
                      <div className="author-info">
                        <span className="author-avatar">{story.author_name ? story.author_name[0] : '🤠'}</span>
                        <div className="author-text">
                          <strong className="author-name">{story.author_name || 'Anonymous'}</strong>
                          <span className="author-username">@{story.author_username || 'traveler'}</span>
                        </div>
                      </div>
                      <button 
                        className="button button-secondary compact read-story-action-btn"
                        onClick={() => setSelectedStory(story)}
                      >
                        Read Full Story
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Floating Story Reader Modal */}
      {selectedStory && (
        <div className="crop-modal">
          <div className="crop-modal-content story-reader-modal-card">
            <header className="story-reader-header">
              <span className="reader-dest-badge">📍 {selectedStory.destination_name}</span>
              <button className="close-reader-btn" onClick={() => setSelectedStory(null)}>×</button>
            </header>

            <div className="story-reader-body">
              {/* Cover */}
              <div 
                className="story-reader-cover"
                style={{ 
                  backgroundImage: `url(${
                    selectedStory.cover_photo || 
                    (selectedStory.photos && selectedStory.photos[0]) || 
                    'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=800'
                  })` 
                }}
              />

              <h2 className="story-reader-title">{selectedStory.title}</h2>

              <div className="story-reader-author-row">
                <div className="reader-author-profile">
                  <span className="reader-author-avatar">{selectedStory.author_name ? selectedStory.author_name[0] : '🤠'}</span>
                  <div className="reader-author-names">
                    <strong>{selectedStory.author_name || 'Anonymous'}</strong>
                    <span>@{selectedStory.author_username || 'traveler'}</span>
                  </div>
                </div>
                <div className="reader-publish-date">
                  📅 Published {new Date(selectedStory.published_at || selectedStory.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="story-reader-text">
                {selectedStory.content.split('\n').map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>

            <footer className="story-reader-footer">
              <button className="button button-secondary" onClick={() => setSelectedStory(null)}>Close Story</button>
            </footer>
          </div>
        </div>
      )}

      <style>{`
        .all-stories-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        }

        .stories-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .header-titles h1 {
          font-size: 2.4rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }
        .header-titles p {
          font-size: 1.05rem;
          color: #64748b;
          margin: 0;
        }
        .write-story-btn {
          font-size: 0.95rem;
          padding: 0.75rem 1.5rem;
          box-shadow: 0 10px 20px rgba(56, 189, 248, 0.15);
        }

        /* Search Filter */
        .search-filter-bar {
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 0.5rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.015);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-filter-bar:focus-within {
          border-color: #38bdf8;
          box-shadow: 0 4px 20px rgba(56, 189, 248, 0.08);
        }
        .search-icon {
          font-size: 1.25rem;
          color: #94a3b8;
        }
        .search-input {
          flex: 1;
          border: none !important;
          outline: none;
          font-size: 1rem;
          padding: 0.6rem 0;
          color: #0f172a;
          background: transparent;
        }

        /* Grid */
        .stories-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 2rem;
        }
        @media (max-width: 450px) {
          .stories-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Card design */
        .story-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.015);
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .story-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05);
        }
        .story-card-banner {
          height: 200px;
          background-size: cover;
          background-position: center;
          transition: transform 0.3s ease;
        }
        .story-card-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }
        .story-meta-tags {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.78rem;
        }
        .story-dest-badge {
          background: #f0fdf4;
          color: #166534;
          font-weight: 800;
          padding: 0.25rem 0.65rem;
          border-radius: 99px;
          border: 1px solid #dcfce7;
        }
        .story-date {
          color: #94a3b8;
          font-weight: 550;
        }
        .story-card-title {
          font-size: 1.25rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0;
          line-height: 1.35;
          letter-spacing: -0.015em;
        }
        .story-card-snippet {
          font-size: 0.88rem;
          color: #475569;
          line-height: 1.55;
          margin: 0;
        }
        .story-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 1.25rem;
          border-top: 1.5px solid #f1f5f9;
        }
        .author-info {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .author-avatar {
          width: 38px;
          height: 38px;
          background: #f1f5f9;
          border: 1.5px solid #cbd5e1;
          color: #475569;
          border-radius: 99px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.05rem;
          text-transform: uppercase;
        }
        .author-text {
          display: flex;
          flex-direction: column;
        }
        .author-name {
          font-size: 0.82rem;
          color: #0f172a;
          font-weight: 750;
        }
        .author-username {
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .read-story-action-btn {
          font-size: 0.8rem;
          padding: 0.45rem 0.9rem;
        }

        /* Statuses */
        .stories-status {
          text-align: center;
          padding: 5rem 1.5rem;
          color: #64748b;
        }
        .stories-status.empty-box span {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }
        .stories-status.empty-box h3 {
          font-size: 1.35rem;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          font-weight: 800;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #38bdf8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .stories-error-box {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          border-radius: 16px;
          color: #991b1b;
          padding: 2.5rem;
          max-width: 500px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .stories-error-box p {
          margin: 0;
          font-weight: 600;
        }

        /* Floating reader Modal styling */
        .crop-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: 2.5rem 1rem;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }
        .story-reader-modal-card {
          background: white;
          border-radius: 28px;
          padding: 2rem;
          width: 90%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 60px rgba(15, 23, 42, 0.2);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .story-reader-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.75rem;
          border-bottom: 1.5px solid #f1f5f9;
        }
        .reader-dest-badge {
          background: #f0fdf4;
          color: #166534;
          font-weight: 800;
          font-size: 0.8rem;
          padding: 0.3rem 0.75rem;
          border-radius: 99px;
          border: 1px solid #dcfce7;
        }
        .close-reader-btn {
          background: none;
          border: none;
          font-size: 1.75rem;
          color: #94a3b8;
          cursor: pointer;
          line-height: 1;
          transition: color 0.15s;
        }
        .close-reader-btn:hover {
          color: #ef4444;
        }

        .story-reader-body {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .story-reader-cover {
          height: 260px;
          border-radius: 16px;
          background-size: cover;
          background-position: center;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.02);
        }
        .story-reader-title {
          font-size: 1.6rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }
        .story-reader-author-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          padding: 0.75rem 1rem;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .reader-author-profile {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .reader-author-avatar {
          width: 32px;
          height: 32px;
          background: #e2e8f0;
          color: #475569;
          border-radius: 99px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          text-transform: uppercase;
        }
        .reader-author-names {
          display: flex;
          flex-direction: column;
        }
        .reader-author-names strong {
          font-size: 0.8rem;
          color: #0f172a;
        }
        .reader-author-names span {
          font-size: 0.7rem;
          color: #94a3b8;
        }
        .reader-publish-date {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 550;
        }
        
        .story-reader-text {
          font-size: 0.98rem;
          color: #334155;
          line-height: 1.7;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .story-reader-text p {
          margin: 0;
        }

        .story-reader-footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 1.25rem;
          border-top: 1.5px solid #f1f5f9;
        }
      `}</style>
    </main>
  )
}
