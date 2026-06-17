import { useEffect, useState } from 'react'
import { getAdminHomeData, updateAdminHomeData } from '../apiClient'

export default function AdminHome() {
  const adminId = localStorage.getItem('userId')
  const [stats, setStats] = useState([])
  const [valueCards, setValueCards] = useState([])
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('stats') // stats, cards, stories

  const [newStory, setNewStory] = useState({ title: '', summary: '', location: '', image: '', rating: 4.8 })

  const loadData = async () => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getAdminHomeData(adminId)
      setStats(data.stats || [])
      setValueCards(data.value_cards || [])
      setStories(data.landing_stories || [])
    } catch (err) {
      setError('Failed to load home config data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [adminId])

  const handleStatChange = (id, val) => {
    setStats(prev => prev.map(s => s.id === id ? { ...s, value: Number(val) } : s))
  }

  const handleCardChange = (id, field, val) => {
    setValueCards(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c))
  }

  const handleStoryChange = (idx, field, val) => {
    setStories(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  const deleteStory = (idx) => {
    setStories(prev => prev.filter((_, i) => i !== idx))
  }

  const addStory = () => {
    if (!newStory.title.trim() || !newStory.location.trim()) {
      alert('Title and Location are required!')
      return
    }
    setStories(prev => [...prev, newStory])
    setNewStory({ title: '', summary: '', location: '', image: '', rating: 4.8 })
  }

  const handleSave = async () => {
    setMessage('')
    setError('')
    try {
      await updateAdminHomeData(adminId, {
        stats,
        value_cards: valueCards,
        landing_stories: stories
      })
      setMessage('Home page configurations updated successfully!')
      loadData()
    } catch (err) {
      setError('Failed to update home configurations.')
    }
  }

  if (loading) {
    return <main className="page-shell"><p className="admin-status">Loading configurations...</p></main>
  }

  return (
    <main className="page-shell admin-home">
      <header className="ah-header">
        <div>
          <span className="ah-eyebrow">✦ Page Manager</span>
          <h1>Home Page Manager</h1>
          <p>Configure statistics, values, and community stories displayed on the public landing page.</p>
        </div>
        <button className="ah-save-btn" onClick={handleSave}>
          💾 Save Changes
        </button>
      </header>

      {message && <div className="admin-alert success">{message}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      <div className="ah-tabs">
        <button className={`ah-tab-btn${activeTab === 'stats' ? ' active' : ''}`} onClick={() => setActiveTab('stats')}>
          📈 Application Stats
        </button>
        <button className={`ah-tab-btn${activeTab === 'cards' ? ' active' : ''}`} onClick={() => setActiveTab('cards')}>
          🛡️ Value Cards
        </button>
        <button className={`ah-tab-btn${activeTab === 'stories' ? ' active' : ''}`} onClick={() => setActiveTab('stories')}>
          📸 Community Stories
        </button>
      </div>

      <div className="ah-tab-content">
        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <section className="ah-tab-pane">
            <h2>Manage Stats Counters</h2>
            <div className="ah-stats-grid">
              {stats.map(s => (
                <div key={s.id} className="ah-stat-card">
                  <span className="ah-stat-label">{s.label}</span>
                  <input
                    type="number"
                    value={s.value}
                    onChange={(e) => handleStatChange(s.id, e.target.value)}
                    className="ah-input"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* VALUE CARDS TAB */}
        {activeTab === 'cards' && (
          <section className="ah-tab-pane">
            <h2>Configure Value Cards</h2>
            <div className="ah-cards-list">
              {valueCards.map(c => (
                <div key={c.id} className="ah-config-card">
                  <div className="ah-field">
                    <label>Card Title</label>
                    <input
                      type="text"
                      value={c.title}
                      onChange={(e) => handleCardChange(c.id, 'title', e.target.value)}
                      className="ah-input"
                    />
                  </div>
                  <div className="ah-field">
                    <label>Card Description</label>
                    <textarea
                      value={c.description}
                      onChange={(e) => handleCardChange(c.id, 'description', e.target.value)}
                      className="ah-textarea"
                      rows="3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STORIES TAB */}
        {activeTab === 'stories' && (
          <section className="ah-tab-pane">
            <h2>Community Trip Stories</h2>
            <div className="ah-stories-list">
              {stories.map((st, index) => (
                <div key={index} className="ah-config-card story-card-admin">
                  <div className="story-card-header">
                    <h4>Story #{index + 1}</h4>
                    <button className="story-delete-btn" onClick={() => deleteStory(index)}>Delete</button>
                  </div>
                  <div className="story-card-grid">
                    <div className="ah-field">
                      <label>Journey Title</label>
                      <input
                        type="text"
                        value={st.title}
                        onChange={(e) => handleStoryChange(index, 'title', e.target.value)}
                        className="ah-input"
                      />
                    </div>
                    <div className="ah-field">
                      <label>Location</label>
                      <input
                        type="text"
                        value={st.location}
                        onChange={(e) => handleStoryChange(index, 'location', e.target.value)}
                        className="ah-input"
                      />
                    </div>
                    <div className="ah-field">
                      <label>Rating (e.g. 4.8)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={st.rating}
                        onChange={(e) => handleStoryChange(index, 'rating', e.target.value)}
                        className="ah-input"
                      />
                    </div>
                    <div className="ah-field">
                      <label>Banner Image URL</label>
                      <input
                        type="text"
                        value={st.image}
                        onChange={(e) => handleStoryChange(index, 'image', e.target.value)}
                        className="ah-input"
                      />
                    </div>
                    <div className="ah-field full-width">
                      <label>Adventure Summary</label>
                      <textarea
                        value={st.summary}
                        onChange={(e) => handleStoryChange(index, 'summary', e.target.value)}
                        className="ah-textarea"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ah-add-box">
              <h3>📸 Add Journey Story</h3>
              <div className="story-card-grid">
                <div className="ah-field">
                  <label>Journey Title</label>
                  <input
                    type="text"
                    value={newStory.title}
                    onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))}
                    className="ah-input"
                    placeholder="e.g. Sailing the Mangroves"
                  />
                </div>
                <div className="ah-field">
                  <label>Location</label>
                  <input
                    type="text"
                    value={newStory.location}
                    onChange={(e) => setNewStory(prev => ({ ...prev, location: e.target.value }))}
                    className="ah-input"
                    placeholder="e.g. Sundarbans, Khulna"
                  />
                </div>
                <div className="ah-field">
                  <label>Rating (e.g. 4.9)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newStory.rating}
                    onChange={(e) => setNewStory(prev => ({ ...prev, rating: Number(e.target.value) }))}
                    className="ah-input"
                  />
                </div>
                <div className="ah-field">
                  <label>Banner Image URL</label>
                  <input
                    type="text"
                    value={newStory.image}
                    onChange={(e) => setNewStory(prev => ({ ...prev, image: e.target.value }))}
                    className="ah-input"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="ah-field full-width">
                  <label>Adventure Summary</label>
                  <textarea
                    value={newStory.summary}
                    onChange={(e) => setNewStory(prev => ({ ...prev, summary: e.target.value }))}
                    className="ah-textarea"
                    rows="3"
                    placeholder="Brief journey highlights..."
                  />
                </div>
              </div>
              <button className="ah-add-btn" onClick={addStory}>
                ＋ Add Story to List
              </button>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .admin-home {
          padding-bottom: 3rem;
        }
        .ah-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .ah-eyebrow {
          display: inline-block;
          color: #10b981;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .ah-header h1 {
          margin: 0;
          font-size: 2rem;
          color: #0f172a;
        }
        .ah-header p {
          margin: 0.25rem 0 0;
          color: #64748b;
          font-size: 0.95rem;
        }
        .ah-save-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 1.5rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        .ah-save-btn:hover {
          opacity: 0.95;
          transform: translateY(-2px);
        }
        
        .admin-alert {
          padding: 1rem 1.25rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .admin-alert.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        .admin-alert.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .ah-tabs {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        .ah-tab-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.65rem 1.25rem;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ah-tab-btn:hover {
          border-color: #cbd5e1;
          color: #334155;
        }
        .ah-tab-btn.active {
          background: #10b981;
          color: #fff;
          border-color: #10b981;
        }

        .ah-tab-content {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
        }
        .ah-tab-pane h2 {
          margin: 0 0 1.5rem;
          font-size: 1.35rem;
          color: #0f172a;
        }

        .ah-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.5rem;
        }
        .ah-stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1.25rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .ah-stat-label {
          font-weight: 700;
          color: #475569;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        
        .ah-input, .ah-textarea {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.65rem 0.85rem;
          font-size: 0.95rem;
          font-family: inherit;
          color: #0f172a;
          background: #f8fafc;
          box-sizing: border-box;
          transition: border-color 0.2s, background 0.2s;
        }
        .ah-input:focus, .ah-textarea:focus {
          outline: none;
          border-color: #10b981;
          background: #fff;
        }

        .ah-cards-list, .ah-stories-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .ah-config-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1.25rem;
          padding: 1.75rem;
        }
        .ah-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }
        .ah-field:last-child {
          margin-bottom: 0;
        }
        .ah-field label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }
        
        /* Story card grid */
        .story-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.75rem;
        }
        .story-card-header h4 {
          margin: 0;
          font-size: 1.05rem;
          color: #0f172a;
        }
        .story-delete-btn {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fee2e2;
          border-radius: 0.5rem;
          padding: 0.4rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .story-delete-btn:hover {
          background: #fee2e2;
        }
        .story-card-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .full-width {
          grid-column: 1 / -1;
        }

        .ah-add-box {
          margin-top: 2rem;
          background: #fff;
          border: 2px dashed #cbd5e1;
          border-radius: 1.25rem;
          padding: 2rem;
        }
        .ah-add-box h3 {
          margin: 0 0 1.25rem;
          font-size: 1.15rem;
          color: #0f172a;
        }
        .ah-add-btn {
          margin-top: 1.25rem;
          background: #0f172a;
          color: #fff;
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 1.5rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ah-add-btn:hover {
          background: #1e293b;
        }

        @media (max-width: 640px) {
          .story-card-grid {
            grid-template-columns: 1fr;
          }
          .ah-tab-content {
            padding: 1.25rem;
          }
        }
      `}</style>
    </main>
  )
}
