import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  submitDestinationReview,
  submitAccommodationReview,
  createOrUpdateTripStory,
  deleteTripStory,
  getMyReviews,
  deleteReview,
  getTravelerLeaderboard,
  getDestinations,
} from '../apiClient'

const PRESET_ACCOMMODATIONS = [
  { id: 1, name: 'Sajek Resort (Sajek Valley)' },
  { id: 2, name: 'Sayeman Beach Resort (Cox\'s Bazar)' },
  { id: 3, name: 'Nilgiri Hill Resort (Bandarban)' },
  { id: 4, name: 'Grand Sultan Tea Resort (Sreemangal)' },
  { id: 5, name: 'Sundarban Tiger Roar Resort (Sundarbans)' },
]

export default function ReviewsAndStories() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')

  // Sub-tabs: 'stories' | 'reviews' | 'leaderboard'
  const [activeTab, setActiveTab] = useState('stories')

  // Data states
  const [destinations, setDestinations] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [myReviews, setMyReviews] = useState({ destinations: [], accommodations: [] })
  const [myStoriesList, setMyStoriesList] = useState([])

  // Loading states
  const [loading, setLoading] = useState(false)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  // Feedback alerts
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 1. Stories Form State
  const [storyId, setStoryId] = useState(null)
  const [storyTitle, setStoryTitle] = useState('')
  const [storyDestSlug, setStoryDestSlug] = useState('')
  const [storyContent, setStoryContent] = useState('')
  const [storyCover, setStoryCover] = useState('')
  const [storyStatus, setStoryStatus] = useState('draft')
  const [storySubmitting, setStorySubmitting] = useState(false)

  // 2. Reviews Form State
  const [reviewTarget, setReviewTarget] = useState('destination') // 'destination' | 'accommodation'
  const [destSlug, setDestSlug] = useState('')
  const [accomId, setAccomId] = useState(1)

  // Categories ratings for destinations
  const [destRatings, setDestRatings] = useState({
    accessibility: 5,
    safety: 5,
    value: 5,
    scenery: 5,
    food: 5,
  })
  // Categories ratings for accommodations
  const [accomRatings, setAccomRatings] = useState({
    cleanliness: 5,
    staff: 5,
    accessibility: 5,
    safety: 5,
    value: 5,
    scenery: 5,
    food: 5,
  })
  const [reviewText, setReviewText] = useState('')
  const [reviewPhotos, setReviewPhotos] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  // Fetch list of destinations to populate forms
  const loadDestinationsList = async () => {
    try {
      const data = await getDestinations()
      setDestinations(data)
      if (data.length > 0) {
        setStoryDestSlug(data[0].slug)
        setDestSlug(data[0].slug)
      }
    } catch {
      // ignore
    }
  }

  // Load user stories and reviews
  const loadUserContent = async () => {
    if (!userId) return
    setLoading(true)
    try {
      // Fetch reviews
      const reviews = await getMyReviews(userId)
      setMyReviews(reviews)
      
      // Fetch user's profile to extract stories (or reload leaderboard/community items)
      // Since trip stories is loaded on community or profile, we query traveler profile
      const res = await fetch(`http://localhost:8000/api/traveler/profile/${userId}/`)
      if (res.ok) {
        const data = await res.json()
        setMyStoriesList(data.trip_stories || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // Load Leaderboard
  const loadLeaderboardData = async () => {
    setLeaderboardLoading(true)
    try {
      const rankings = await getTravelerLeaderboard()
      setLeaderboard(rankings)
    } catch {
      // ignore
    } finally {
      setLeaderboardLoading(false)
    }
  }

  useEffect(() => {
    loadDestinationsList()
  }, [])

  useEffect(() => {
    if (activeTab === 'stories' || activeTab === 'reviews') {
      loadUserContent()
    } else if (activeTab === 'leaderboard') {
      loadLeaderboardData()
    }
  }, [activeTab, userId])

  // Story handler
  const handleSaveStory = async (e) => {
    e.preventDefault()
    if (!storyTitle.trim() || !storyContent.trim() || !storyDestSlug || !userId) return
    setStorySubmitting(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        id: storyId,
        title: storyTitle,
        content: storyContent,
        destination_slug: storyDestSlug,
        cover_photo: storyCover || 'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=800',
        status: storyStatus,
      }
      await createOrUpdateTripStory(userId, payload)
      setSuccess(storyStatus === 'published' ? 'Trip story published to feed!' : 'Draft story saved.')
      
      // Reset form
      setStoryId(null)
      setStoryTitle('')
      setStoryContent('')
      setStoryCover('')
      setStoryStatus('draft')
      
      loadUserContent()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save story.')
    } finally {
      setStorySubmitting(false)
    }
  }

  const handleEditStory = (story) => {
    setStoryId(story.id)
    setStoryTitle(story.title)
    setStoryDestSlug(story.destination?.slug || '')
    setStoryContent(story.content)
    setStoryCover(story.cover_photo || (story.photos && story.photos[0]) || '')
    setStoryStatus(story.status)
    // scroll form to view
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteStory = async (storyId) => {
    if (!confirm('Are you sure you want to delete this trip story?')) return
    setError('')
    try {
      await deleteTripStory(storyId)
      setSuccess('Story deleted successfully.')
      loadUserContent()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to delete story.')
    }
  }

  // Reviews Handler
  const handlePostReview = async (e) => {
    e.preventDefault()
    if (!reviewText.trim() || !userId) return
    setReviewSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const photosArray = reviewPhotos.trim() ? [reviewPhotos] : []
      if (reviewTarget === 'destination') {
        const payload = {
          user_id: parseInt(userId),
          rating_accessibility: destRatings.accessibility,
          rating_safety: destRatings.safety,
          rating_value: destRatings.value,
          rating_scenery: destRatings.scenery,
          rating_food: destRatings.food,
          text_review: reviewText,
          photos: photosArray,
        }
        await submitDestinationReview(destSlug, payload)
      } else {
        const payload = {
          user_id: parseInt(userId),
          rating_cleanliness: accomRatings.cleanliness,
          rating_staff: accomRatings.staff,
          rating_accessibility: accomRatings.accessibility,
          rating_safety: accomRatings.safety,
          rating_value: accomRatings.value,
          rating_scenery: accomRatings.scenery,
          rating_food: accomRatings.food,
          text_review: reviewText,
          photos: photosArray,
        }
        await submitAccommodationReview(accomId, payload)
      }
      setSuccess('Category review posted successfully!')
      setReviewText('')
      setReviewPhotos('')
      loadUserContent()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to post category review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleDeleteReviewItem = async (type, id) => {
    if (!confirm('Delete this review post?')) return
    setError('')
    try {
      await deleteReview(type, id)
      setSuccess('Review deleted successfully.')
      loadUserContent()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to delete review.')
    }
  }

  if (!userId) {
    return (
      <main className="page-shell text-center">
        <p className="community-error">Please sign in to view ratings, reviews, and stories.</p>
        <button className="button button-primary" onClick={() => navigate('/signin')}>Sign In</button>
      </main>
    )
  }

  return (
    <main className="page-shell stories-page-shell">
      {error && <div className="profile-alert error">{error}</div>}
      {success && <div className="profile-alert success">{success}</div>}

      <header className="stories-page-header">
        <h1>Reviews, Stories & Scoreboard</h1>
        <p>Log your travel adventures, evaluate services based on safety/accessibility, and compete on the leaderboard.</p>
      </header>

      {/* Main Tab bar */}
      <nav className="bookings-tabs-bar">
        <button className={`tab-nav-btn ${activeTab === 'stories' ? 'active' : ''}`} onClick={() => setActiveTab('stories')}>
          ✍️ My Trip Stories
        </button>
        <button className={`tab-nav-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
          ⭐ Detailed Star Reviews
        </button>
        <button className={`tab-nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          🏆 Traveler Leaderboard
        </button>
      </nav>

      {/* Tab 1: Stories Planner */}
      {activeTab === 'stories' && (
        <section className="tab-grid-split">
          <div className="stories-main-column">
            <h3>📝 Write a Trip Story</h3>
            <form onSubmit={handleSaveStory} className="story-composer-form">
              <label>
                Story Title
                <input
                  type="text"
                  value={storyTitle}
                  onChange={e => setStoryTitle(e.target.value)}
                  placeholder="e.g. A Magical Night under the Stars in Sajek..."
                  required
                />
              </label>

              <div className="double-inputs">
                <label>
                  Destination Tag
                  <select value={storyDestSlug} onChange={e => setStoryDestSlug(e.target.value)} required>
                    {destinations.map(d => (
                      <option key={d.slug} value={d.slug}>{d.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Cover Image URL
                  <input
                    type="text"
                    value={storyCover}
                    onChange={e => setStoryCover(e.target.value)}
                    placeholder="e.g. http://site.com/image.jpg"
                  />
                </label>
              </div>

              <label>
                Adventure Story content
                <textarea
                  value={storyContent}
                  onChange={e => setStoryContent(e.target.value)}
                  placeholder="Narrate your itinerary experience, roads taken, scenic points, and local food reviews..."
                  required
                />
              </label>

              <div className="story-form-actions">
                <label className="checkbox-item-row">
                  <input
                    type="checkbox"
                    checked={storyStatus === 'published'}
                    onChange={e => setStoryStatus(e.target.checked ? 'published' : 'draft')}
                  />
                  Publish directly to community feed (Leave unchecked to keep as draft)
                </label>
                <div className="btn-row">
                  {storyId && (
                    <button type="button" className="button button-secondary" onClick={() => {
                      setStoryId(null)
                      setStoryTitle('')
                      setStoryContent('')
                      setStoryCover('')
                    }}>
                      Cancel Edit
                    </button>
                  )}
                  <button type="submit" className="button button-primary" disabled={storySubmitting}>
                    {storySubmitting ? 'Saving...' : storyId ? 'Update Story' : 'Save Story'}
                  </button>
                </div>
              </div>
            </form>

            <div className="my-stories-section">
              <h3>My Stories Directory</h3>
              {loading ? (
                <p>Loading your stories...</p>
              ) : myStoriesList.length === 0 ? (
                <p className="empty-state-text">No stories written yet. Use the composer above to log your first adventure!</p>
              ) : (
                <div className="stories-grid-list">
                  {myStoriesList.map(story => (
                    <div key={story.id} className="story-profile-card">
                      <div className="story-banner" style={{ backgroundImage: `url(${story.cover_photo || (story.photos && story.photos[0]) || 'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=800'})` }} />
                      <div className="story-details">
                        <span className="story-status-tag">{story.status}</span>
                        <h4>{story.title}</h4>
                        <p>{story.content.substring(0, 120)}...</p>
                        <div className="story-actions">
                          <button className="button button-secondary edit-btn" onClick={() => handleEditStory(story)}>Edit</button>
                          <button className="button leave-room-danger-btn delete-btn" onClick={() => handleDeleteStory(story.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="stories-sidebar">
            <div className="stats-indicator-card">
              <h4>✍️ Story Guidelines</h4>
              <p>Keep your reviews helpful! Authentic blogs cover:</p>
              <ul>
                <li>Route options & costs</li>
                <li>Best photography spots</li>
                <li>Local delicacies tried</li>
                <li>Culture & safety advice</li>
              </ul>
            </div>
          </aside>
        </section>
      )}

      {/* Tab 2: Detailed Star Reviews */}
      {activeTab === 'reviews' && (
        <section className="tab-grid-split">
          <div className="reviews-main-column">
            <h3>⭐ Post Star-Rated Category Review</h3>
            <div className="target-toggle-row">
              <button className={`toggle-btn ${reviewTarget === 'destination' ? 'active' : ''}`} onClick={() => setReviewTarget('destination')}>
                📍 Review Destination
              </button>
              <button className={`toggle-btn ${reviewTarget === 'accommodation' ? 'active' : ''}`} onClick={() => setReviewTarget('accommodation')}>
                🏨 Review Hotel/Resort
              </button>
            </div>

            <form onSubmit={handlePostReview} className="detailed-review-form">
              {reviewTarget === 'destination' ? (
                <div className="form-sub-block">
                  <label>
                    Select Destination
                    <select value={destSlug} onChange={e => setDestSlug(e.target.value)} required>
                      {destinations.map(d => (
                        <option key={d.slug} value={d.slug}>{d.name}</option>
                      ))}
                    </select>
                  </label>

                  <div className="ratings-sliders-grid">
                    {Object.keys(destRatings).map(cat => (
                      <label key={cat} className="slider-row">
                        <span className="slider-label">{cat.toUpperCase()}: ⭐ {destRatings[cat]}/5</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={destRatings[cat]}
                          onChange={e => setDestRatings({ ...destRatings, [cat]: parseInt(e.target.value) })}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="form-sub-block">
                  <label>
                    Select Hotel / Accommodation
                    <select value={accomId} onChange={e => setAccomId(parseInt(e.target.value))} required>
                      {PRESET_ACCOMMODATIONS.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </label>

                  <div className="ratings-sliders-grid">
                    {Object.keys(accomRatings).map(cat => (
                      <label key={cat} className="slider-row">
                        <span className="slider-label">{cat.toUpperCase()}: ⭐ {accomRatings[cat]}/5</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={accomRatings[cat]}
                          onChange={e => setAccomRatings({ ...accomRatings, [cat]: parseInt(e.target.value) })}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label>
                Written Review
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share accessibility parameters, safety details, value proposition..."
                  required
                />
              </label>

              <label>
                Review Photo URL (Optional)
                <input
                  type="text"
                  value={reviewPhotos}
                  onChange={e => setReviewPhotos(e.target.value)}
                  placeholder="e.g. http://site.com/hotel.jpg"
                />
              </label>

              <button type="submit" className="button button-primary" disabled={reviewSubmitting}>
                {reviewSubmitting ? 'Posting Review...' : 'Submit Category Review'}
              </button>
            </form>

            <div className="my-reviews-directory">
              <h3>My Submitted Reviews</h3>
              {loading ? (
                <p>Loading reviews...</p>
              ) : (
                <div className="reviews-summary-list">
                  {myReviews.destinations?.length === 0 && myReviews.accommodations?.length === 0 ? (
                    <p className="empty-state-text">No reviews recorded yet.</p>
                  ) : (
                    <>
                      {myReviews.destinations?.map(rev => (
                        <div key={rev.id} className="submitted-review-card">
                          <div className="card-header-row">
                            <h4>📍 {rev.destination?.name}</h4>
                            <button className="delete-rev-btn" onClick={() => handleDeleteReviewItem('destination', rev.id)}>×</button>
                          </div>
                          <div className="review-meta-scores">
                            <span>Accessibility: ⭐{rev.rating_accessibility}</span>
                            <span>Safety: ⭐{rev.rating_safety}</span>
                            <span>Scenery: ⭐{rev.rating_scenery}</span>
                            <span>Value: ⭐{rev.rating_value}</span>
                          </div>
                          <p className="rev-text">"{rev.text_review}"</p>
                        </div>
                      ))}
                      {myReviews.accommodations?.map(rev => (
                        <div key={rev.id} className="submitted-review-card">
                          <div className="card-header-row">
                            <h4>🏨 {rev.accommodation?.name || 'Hotel Accommodation'}</h4>
                            <button className="delete-rev-btn" onClick={() => handleDeleteReviewItem('accommodation', rev.id)}>×</button>
                          </div>
                          <div className="review-meta-scores">
                            <span>Cleanliness: ⭐{rev.rating_cleanliness}</span>
                            <span>Staff: ⭐{rev.rating_staff}</span>
                            <span>Safety: ⭐{rev.rating_safety}</span>
                            <span>Value: ⭐{rev.rating_value}</span>
                          </div>
                          <p className="rev-text">"{rev.text_review}"</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="reviews-sidebar">
            <div className="stats-indicator-card text-center">
              <h4>⭐ Core Review Metrics</h4>
              <p>Ratings are aggregated into indices to help disabled, solo, or budget travelers navigate Bangladesh with safety insights.</p>
            </div>
          </aside>
        </section>
      )}

      {/* Tab 3: Traveler Leaderboard */}
      {activeTab === 'leaderboard' && (
        <section className="leaderboard-section">
          <h3>🏆 Community Traveler Rankings</h3>
          <p className="community-muted">Earn XP points by logging completed trips (+10 XP), posting stories (+5 XP), and writing category reviews (+2 XP).</p>
          
          {leaderboardLoading ? (
            <p>Fetching rankings scoreboard...</p>
          ) : leaderboard.length === 0 ? (
            <p className="empty-state-text">No rankings available yet.</p>
          ) : (
            <div className="leaderboard-table-wrapper">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Traveler Name</th>
                    <th>Trips Logged</th>
                    <th>Stories Posted</th>
                    <th>Reviews Written</th>
                    <th>Total XP Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map(row => (
                    <tr key={row.rank} className={row.name === localStorage.getItem('username') ? 'current-user-row' : ''}>
                      <td className="rank-col">
                        {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                      </td>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.trips} trips</td>
                      <td>{row.stories} stories</td>
                      <td>{row.reviews} reviews</td>
                      <td><span className="xp-badge">{row.score} XP</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <style>{`
        .stories-page-shell {
          margin-top: 60px !important;
          margin-left: 240px !important;
          width: calc(100% - 240px) !important;
          max-width: none !important;
          padding: 2rem !important;
          min-height: calc(100vh - 60px);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .stories-page-shell {
            margin-left: 70px !important;
            width: calc(100% - 70px) !important;
          }
        }
        .stories-page-header h1 {
          margin: 0 0 0.35rem 0;
          font-size: 2.2rem;
          font-weight: 850;
          color: #0f172a;
        }
        .stories-page-header p {
          margin: 0;
          font-size: 1.05rem;
          color: #64748b;
          max-width: 800px;
        }

        /* composer form */
        .story-composer-form, .detailed-review-form {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .story-composer-form label, .detailed-review-form label {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 750;
          color: #475569;
        }
        .story-composer-form input,
        .story-composer-form select,
        .story-composer-form textarea,
        .detailed-review-form select,
        .detailed-review-form textarea,
        .detailed-review-form input {
          padding: 0.7rem 0.85rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.92rem;
          outline: none;
          background: white;
        }
        .story-composer-form textarea { height: 160px; resize: vertical; }
        .detailed-review-form textarea { height: 100px; resize: vertical; }

        .story-form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .btn-row { display: flex; gap: 0.5rem; }

        /* Stories directory list */
        .stories-grid-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .story-profile-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
        }
        .story-banner {
          height: 140px;
          background-size: cover;
          background-position: center;
        }
        .story-details {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .story-status-tag {
          align-self: flex-start;
          background: #e0f2fe;
          color: #0369a1;
          font-size: 0.68rem;
          font-weight: 750;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .story-details h4 { margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; }
        .story-details p { margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.4; }
        .story-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: auto;
          padding-top: 0.75rem;
          border-top: 1px solid #f1f5f9;
        }
        .story-actions button { flex: 1; padding: 0.35rem; font-size: 0.78rem; }

        .stories-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .stats-indicator-card {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          padding: 1.5rem;
        }
        .stats-indicator-card h4 { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 800; color: #1e293b; }
        .stats-indicator-card p { margin: 0 0 0.75rem; font-size: 0.85rem; color: #64748b; line-height: 1.4; }
        .stats-indicator-card ul { margin: 0; padding-left: 1.25rem; font-size: 0.82rem; color: #475569; display: flex; flex-direction: column; gap: 0.35rem; }

        /* Rating sliders */
        .target-toggle-row {
          display: flex;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }
        .toggle-btn {
          flex: 1;
          padding: 0.6rem;
          border: 1.5px solid #cbd5e1;
          background: white;
          color: #475569;
          font-weight: 750;
          font-size: 0.88rem;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .toggle-btn.active {
          background: #e0e7ff;
          color: #4338ca;
          border-color: #818cf8;
        }
        .ratings-sliders-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.85rem 1.5rem;
          margin: 1rem 0;
          background: white;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
        }
        @media (max-width: 600px) {
          .ratings-sliders-grid { grid-template-columns: 1fr; }
        }
        .slider-row {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .slider-label { font-size: 0.78rem; font-weight: 800; color: #1e293b; }

        /* Submitted reviews */
        .my-reviews-directory { margin-top: 2rem; }
        .reviews-summary-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
        .submitted-review-card {
          border: 1.5px solid #f1f5f9;
          border-radius: 14px;
          padding: 1.25rem;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.01);
          position: relative;
        }
        .card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .card-header-row h4 { margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; }
        .delete-rev-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 1.25rem; }
        .delete-rev-btn:hover { color: #ef4444; }
        .review-meta-scores { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem; }
        .review-meta-scores span { font-size: 0.78rem; font-weight: 700; color: #0369a1; background: #e0f2fe; padding: 0.2rem 0.5rem; border-radius: 4px; }
        .rev-text { margin: 0; font-size: 0.88rem; line-height: 1.5; color: #334155; font-style: italic; }

        /* Leaderboard Scoreboard table */
        .leaderboard-table-wrapper {
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          overflow: hidden;
          background: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .leaderboard-table th {
          background: #f8fafc;
          padding: 1rem;
          font-size: 0.85rem;
          font-weight: 800;
          color: #475569;
          border-bottom: 1.5px solid #cbd5e1;
        }
        .leaderboard-table td {
          padding: 1rem;
          font-size: 0.9rem;
          color: #1e293b;
          border-bottom: 1px solid #e2e8f0;
        }
        .leaderboard-table tr:last-child td { border-bottom: none; }
        .rank-col { font-size: 1.1rem; text-align: center; width: 60px; }
        .xp-badge {
          background: #ecfdf5;
          color: #047857;
          font-weight: 800;
          padding: 0.35rem 0.75rem;
          border-radius: 99px;
          font-size: 0.82rem;
        }
        .current-user-row { background: #f0fdf4; }
      `}</style>
    </main>
  )
}
