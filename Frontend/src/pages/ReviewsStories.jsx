import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function ReviewsStories() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('reviews')
  const [reviews, setReviews] = useState([])
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showStoryModal, setShowStoryModal] = useState(false)
  
  const userId = searchParams.get('user_id')

  useEffect(() => {
    fetchAllData()
  }, [userId])

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchReviews(),
        fetchStories()
      ])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    const response = await fetch(`http://localhost:8000/api/reviews/?user_id=${userId}`)
    const data = await response.json()
    if (response.ok) setReviews(data)
  }

  const fetchStories = async () => {
    const response = await fetch(`http://localhost:8000/api/stories/?user_id=${userId}`)
    const data = await response.json()
    if (response.ok) setStories(data)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <>
      <main className="reviews-stories-page">
        <div className="reviews-stories-container">
          <header className="reviews-header">
            <h1>Reviews & Trip Stories</h1>
            <div className="header-actions">
              <button className="btn-primary" onClick={() => setShowReviewModal(true)}>
                + Write Review
              </button>
              <button className="btn-secondary" onClick={() => setShowStoryModal(true)}>
                + Share Story
              </button>
            </div>
          </header>

          <div className="reviews-tabs">
            <button className={`reviews-tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
              My Reviews
            </button>
            <button className={`reviews-tab ${activeTab === 'stories' ? 'active' : ''}`} onClick={() => setActiveTab('stories')}>
              Trip Stories
            </button>
          </div>

          {activeTab === 'reviews' && (
            <div className="reviews-section">
              {reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <h3>{review.title}</h3>
                        <span className="rating">{review.overall_rating}★</span>
                      </div>
                      <p className="review-destination">{review.destination_name}</p>
                      <p className="review-text">{review.text}</p>
                      <div className="review-meta">
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        <span>{review.helpful_count} helpful</span>
                      </div>
                      <div className="review-actions">
                        <button className="btn-action">Edit</button>
                        <button className="btn-action danger">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">⭐</div>
                  <h2>No Reviews Yet</h2>
                  <p>Share your travel experiences by writing reviews!</p>
                  <button className="btn-primary" onClick={() => setShowReviewModal(true)}>
                    Write Your First Review
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stories' && (
            <div className="stories-section">
              {stories.length > 0 ? (
                <div className="stories-grid">
                  {stories.map(story => (
                    <div key={story.id} className="story-card">
                      {story.cover_photo && (
                        <img src={story.cover_photo} alt={story.title} className="story-cover" />
                      )}
                      <div className="story-content">
                        <h3>{story.title}</h3>
                        <p className="story-destination">{story.destination_name}</p>
                        <p className="story-excerpt">{story.content.substring(0, 150)}...</p>
                        <div className="story-meta">
                          <span>❤️ {story.likes_count}</span>
                          <span>👁️ {story.views_count}</span>
                          <span className={`story-status ${story.status}`}>{story.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h2>No Trip Stories Yet</h2>
                  <p>Share your travel adventures with the community!</p>
                  <button className="btn-primary" onClick={() => setShowStoryModal(true)}>
                    Share Your First Story
                  </button>
                </div>
              )}
            </div>
          )}

          {showReviewModal && (
            <ReviewModal
              onClose={() => setShowReviewModal(false)}
              userId={userId}
            />
          )}

          {showStoryModal && (
            <StoryModal
              onClose={() => setShowStoryModal(false)}
              userId={userId}
            />
          )}
        </div>
      </main>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .reviews-stories-page{min-height:100vh;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%);padding:2.5rem;font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
        .reviews-stories-container{max-width:1600px;margin:0 auto;display:flex;flex-direction:column;gap:2.5rem}
        .reviews-header{display:flex;justify-content:space-between;align-items:center;padding:2rem 2.5rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.5rem;box-shadow:0 8px 32px rgba(0,0,0,0.08);border:2px solid rgba(243,244,246,0.8)}
        .reviews-header h1{margin:0;font-size:2rem;font-weight:800;color:#111827;letter-spacing:-0.02em}
        .header-actions{display:flex;gap:1rem}
        .reviews-tabs{display:flex;gap:0.75rem;padding:1rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 16px rgba(0,0,0,0.06)}
        .reviews-tab{padding:0.85rem 2rem;background:transparent;border:none;border-radius:12px;cursor:pointer;color:#6b7280;font-weight:700;font-size:0.95rem;transition:all .3s}
        .reviews-tab:hover{background:#f3f4f6;color:#374151}
        .reviews-tab.active{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
        .reviews-list{display:flex;flex-direction:column;gap:1.25rem}
        .review-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border:2px solid rgba(243,244,246,0.8);border-radius:1.25rem;padding:2rem;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,0.06)}
        .review-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.1)}
        .review-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
        .review-header h3{margin:0;font-size:1.35rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .rating{font-size:1.75rem;color:#f59e0b;font-weight:800;text-shadow:0 2px 8px rgba(245,158,11,0.2)}
        .review-destination{color:#6b7280;font-size:0.9rem;margin-bottom:1rem;font-weight:600}
        .review-text{color:#374151;line-height:1.7;margin-bottom:1.25rem;font-size:1rem}
        .review-meta{display:flex;gap:1.25rem;font-size:0.85rem;color:#9ca3af;margin-bottom:1.25rem;font-weight:600}
        .review-actions{display:flex;gap:0.75rem}
        .btn-action{padding:0.6rem 1.25rem;background:transparent;border:2px solid #e5e7eb;border-radius:10px;cursor:pointer;font-size:0.9rem;font-weight:600;transition:all .2s}
        .btn-action:hover{background:#f3f4f6;border-color:#d1d5db}
        .btn-action.danger{border-color:rgba(239,68,68,0.3);color:#ef4444}
        .btn-action.danger:hover{background:#fee2e2;border-color:#ef4444}
        .stories-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:1.75rem}
        .story-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border:2px solid rgba(243,244,246,0.8);border-radius:1.25rem;overflow:hidden;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,0.06)}
        .story-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.1)}
        .story-cover{width:100%;height:220px;object-fit:cover;transition:transform .5s}
        .story-card:hover .story-cover{transform:scale(1.02)}
        .story-content{padding:1.75rem}
        .story-content h3{margin:0 0 0.75rem 0;font-size:1.25rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .story-destination{color:#6b7280;font-size:0.9rem;margin-bottom:0.75rem;font-weight:600}
        .story-excerpt{color:#4b5563;line-height:1.6;margin-bottom:1rem;font-size:0.95rem}
        .story-meta{display:flex;gap:1.25rem;font-size:0.85rem;color:#6b7280;font-weight:600}
        .story-status{padding:0.35rem 0.85rem;border-radius:999px;font-size:0.75rem;text-transform:uppercase;font-weight:800;letter-spacing:0.05em}
        .story-status.published{background:linear-gradient(135deg,#d1fae5,#a7f3d0);color:#065f46;box-shadow:0 2px 8px rgba(16,185,129,0.2)}
        .story-status.draft{background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e;box-shadow:0 2px 8px rgba(245,158,11,0.2)}
        .btn-primary{padding:0.85rem 1.75rem;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.95rem;transition:all .3s;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(59,130,246,0.4)}
        .btn-secondary{padding:0.85rem 1.75rem;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);color:#374151;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.95rem;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
        .btn-secondary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(8px)}
        .modal{background:rgba(255,255,255,0.98);backdrop-filter:blur(20px);border-radius:1.5rem;max-width:550px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,0.25);border:2px solid rgba(255,255,255,0.5)}
        .modal.large{max-width:750px}
        .modal-header{display:flex;justify-content:space-between;align-items:center;padding:2rem;border-bottom:2px solid #f3f4f6}
        .modal-header h2{margin:0;font-size:1.5rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .btn-close{background:none;border:none;font-size:1.5rem;cursor:pointer;color:#9ca3af;padding:0.5rem;border-radius:8px;transition:all .2s}
        .btn-close:hover{background:#f3f4f6;color:#374151}
        .modal-body{padding:2rem;display:flex;flex-direction:column;gap:1.25rem}
        .form-group{display:flex;flex-direction:column;gap:0.5rem}
        .form-group label{font-size:0.9rem;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
        .form-group input,.form-group textarea,.form-group select{padding:0.85rem 1rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.95rem;font-family:inherit;transition:all .2s;background:#f9fafb}
        .form-group input:focus,.form-group textarea:focus,.form-group select:focus{outline:none;border-color:#3b82f6;background:white;box-shadow:0 4px 16px rgba(59,130,246,0.15)}
        .form-actions{display:flex;gap:1rem;margin-top:1.5rem}
        .empty-state{text-align:center;padding:5rem 2rem}
        .empty-icon{font-size:5rem;margin-bottom:1.5rem}
        .empty-state h2{font-size:1.75rem;font-weight:800;color:#111827;margin:0 0 1rem}
        .empty-state p{color:#6b7280;font-size:1.1rem;margin-bottom:2rem}
        .loading{text-align:center;padding:6rem;font-size:1.5rem;color:#6b7280;font-weight:600}

        @media (max-width: 768px) {
          .reviews-stories-page{padding:1.5rem}
          .reviews-header{flex-direction:column;gap:1rem;text-align:center;padding:1.5rem}
          .reviews-header h1{font-size:1.5rem}
          .header-actions{justify-content:center}
          .reviews-tabs{flex-wrap:justify-content}
          .reviews-tab{padding:0.75rem 1.25rem;font-size:0.85rem}
          .stories-grid{grid-template-columns:1fr}
          .modal{max-width:95%}
          .modal.large{max-width:95%}
          .modal-header,.modal-body{padding:1.5rem}
        }
      `}</style>
    </>
  )
}

function ReviewModal({ onClose, userId }) {
  const [formData, setFormData] = useState({
    title: '',
    destination_name: '',
    overall_rating: 5,
    text: '',
    helpful_count: 0
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user: userId })
      })
      if (response.ok) {
        alert('Review submitted successfully!')
        onClose()
      }
    } catch (err) {
      alert('Failed to submit review')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Write a Review</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Destination</label>
            <input
              type="text"
              value={formData.destination_name}
              onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Rating</label>
            <select
              value={formData.overall_rating}
              onChange={(e) => setFormData({ ...formData, overall_rating: parseInt(e.target.value) })}
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Terrible</option>
            </select>
          </div>
          <div className="form-group">
            <label>Your Review</label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              rows={5}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Submit Review</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StoryModal({ onClose, userId }) {
  const [formData, setFormData] = useState({
    title: '',
    destination_name: '',
    content: '',
    status: 'draft',
    likes_count: 0,
    views_count: 0
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/stories/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user: userId })
      })
      if (response.ok) {
        alert('Story saved successfully!')
        onClose()
      }
    } catch (err) {
      alert('Failed to save story')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal large">
        <div className="modal-header">
          <h2>Share Your Trip Story</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Destination</label>
            <input
              type="text"
              value={formData.destination_name}
              onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Your Story</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              required
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="draft">Save as Draft</option>
              <option value="published">Publish Now</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Story</button>
          </div>
        </form>
      </div>
    </div>
  )
}