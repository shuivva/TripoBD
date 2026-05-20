import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function TravelerCommunity() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('groups')
  const [tourGroups, setTourGroups] = useState([])
  const [myGroups, setMyGroups] = useState([])
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const userId = searchParams.get('user_id')

  useEffect(() => {
    fetchAllData()
  }, [userId])

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchTourGroups(),
        fetchMyGroups(),
        fetchStories()
      ])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTourGroups = async () => {
    const response = await fetch('http://localhost:8000/api/tour-groups/')
    const data = await response.json()
    if (response.ok) setTourGroups(data)
  }

  const fetchMyGroups = async () => {
    if (userId) {
      const response = await fetch(`http://localhost:8000/api/tour-groups/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) setMyGroups(data)
    }
  }

  const fetchStories = async () => {
    const response = await fetch('http://localhost:8000/api/stories/')
    const data = await response.json()
    if (response.ok) setStories(data)
  }

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/tour-groups/${groupId}/join/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      if (response.ok) {
        fetchTourGroups()
        fetchMyGroups()
      }
    } catch (err) {
      alert('Failed to join group')
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <main className="community-page">
      <div className="community-container">
        {/* Header */}
        <header className="community-header">
          <h1>Tour Groups & Community</h1>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create Group
          </button>
        </header>

        {/* Tabs */}
        <div className="community-tabs">
          <button className={`community-tab ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>
            Browse Groups
          </button>
          <button className={`community-tab ${activeTab === 'my-groups' ? 'active' : ''}`} onClick={() => setActiveTab('my-groups')}>
            My Groups
          </button>
          <button className={`community-tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
            Community Feed
          </button>
        </div>

        {/* Browse Groups Tab */}
        {activeTab === 'groups' && (
          <div className="groups-section">
            <div className="groups-grid">
              {tourGroups.map(group => (
                <div key={group.id} className="group-card">
                  <div className="group-cover">
                    {group.cover_photo ? (
                      <img src={group.cover_photo} alt={group.name} />
                    ) : (
                      <div className="group-placeholder">{group.destination.charAt(0)}</div>
                    )}
                    {!group.is_open && <span className="group-badge closed">Closed</span>}
                  </div>
                  <div className="group-info">
                    <h3>{group.name}</h3>
                    <p>📍 {group.destination}</p>
                    <p>📅 {group.start_date} - {group.end_date}</p>
                    <p>👥 {group.member_count}/{group.max_members} members</p>
                    {group.membership_fee > 0 && (
                      <p className="fee">💰 ৳{group.membership_fee.toLocaleString()}</p>
                    )}
                    <p className="organizer">Organized by: {group.created_by}</p>
                    <button
                      className="btn-primary"
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={group.member_count >= group.max_members}
                    >
                      {group.member_count >= group.max_members ? 'Full' : 'Join Group'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Groups Tab */}
        {activeTab === 'my-groups' && (
          <div className="groups-section">
            {myGroups.length > 0 ? (
              <div className="groups-grid">
                {myGroups.map(group => (
                  <div key={group.id} className="group-card">
                    <div className="group-cover">
                      {group.cover_photo ? (
                        <img src={group.cover_photo} alt={group.name} />
                      ) : (
                        <div className="group-placeholder">{group.destination.charAt(0)}</div>
                      )}
                    </div>
                    <div className="group-info">
                      <h3>{group.name}</h3>
                      <p>📍 {group.destination}</p>
                      <p>📅 {group.start_date} - {group.end_date}</p>
                      <p>👥 {group.member_count}/{group.max_members} members</p>
                      <button className="btn-secondary">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h2>No Groups Yet</h2>
                <p>Join a tour group or create your own to connect with fellow travelers!</p>
                <button className="btn-primary" onClick={() => setActiveTab('groups')}>
                  Browse Groups
                </button>
              </div>
            )}
          </div>
        )}

        {/* Community Feed Tab */}
        {activeTab === 'feed' && (
          <div className="feed-section">
            <div className="feed-list">
              {stories.map(story => (
                <div key={story.id} className="story-card">
                  {story.cover_photo && (
                    <img src={story.cover_photo} alt={story.title} className="story-cover" />
                  )}
                  <div className="story-content">
                    <div className="story-header">
                      <div className="story-author">
                        <div className="author-avatar">{story.user?.charAt(0) || 'U'}</div>
                        <div className="author-info">
                          <h4>{story.user || 'Traveler'}</h4>
                          <small>{new Date(story.created_at).toLocaleDateString()}</small>
                        </div>
                      </div>
                      <span className="story-destination">{story.destination_name}</span>
                    </div>
                    <h3>{story.title}</h3>
                    <p className="story-excerpt">{story.content.substring(0, 200)}...</p>
                    <div className="story-actions">
                      <button className="btn-action">❤️ {story.likes_count}</button>
                      <button className="btn-action">💬 Comment</button>
                      <button className="btn-action">📤 Share</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            userId={userId}
          />
        )}
      </div>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .community-page{min-height:100vh;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%);padding:2.5rem;font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
        .community-container{max-width:1600px;margin:0 auto;display:flex;flex-direction:column;gap:2.5rem}
        .community-header{display:flex;justify-content:space-between;align-items:center;padding:2rem 2.5rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.5rem;box-shadow:0 8px 32px rgba(0,0,0,0.08);border:2px solid rgba(243,244,246,0.8)}
        .community-header h1{margin:0;font-size:2rem;font-weight:800;color:#111827;letter-spacing:-0.02em}
        .community-tabs{display:flex;gap:0.75rem;padding:1rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 16px rgba(0,0,0,0.06)}
        .community-tab{padding:0.85rem 2rem;background:transparent;border:none;border-radius:12px;cursor:pointer;color:#6b7280;font-weight:700;font-size:0.95rem;transition:all .3s}
        .community-tab:hover{background:#f3f4f6;color:#374151}
        .community-tab.active{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
        .groups-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:1.75rem}
        .group-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border:2px solid rgba(243,244,246,0.8);border-radius:1.5rem;overflow:hidden;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,0.06)}
        .group-card:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(0,0,0,0.12);border-color:rgba(59,130,246,0.3)}
        .group-cover{position:relative;height:220px;overflow:hidden}
        .group-cover img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
        .group-card:hover .group-cover img{transform:scale(1.05)}
        .group-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#8b5cf6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:5rem;font-weight:800;color:white}
        .group-badge{position:absolute;top:1rem;right:1rem;padding:0.4rem 1rem;border-radius:999px;font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em}
        .group-badge.closed{background:linear-gradient(135deg,#ef4444,#dc2626);color:white;box-shadow:0 4px 12px rgba(239,68,68,0.3)}
        .group-info{padding:1.75rem}
        .group-info h3{margin:0 0 1rem 0;font-size:1.35rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .group-info p{margin:0.35rem 0;color:#6b7280;font-size:0.9rem;font-weight:500}
        .group-info .fee{color:#059669;font-weight:700;font-size:0.95rem}
        .group-info .organizer{color:#9ca3af;font-size:0.85rem;margin-top:0.75rem}
        .feed-list{display:flex;flex-direction:column;gap:2rem}
        .story-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border:2px solid rgba(243,244,246,0.8);border-radius:1.5rem;overflow:hidden;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,0.06)}
        .story-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.1)}
        .story-cover{width:100%;height:320px;object-fit:cover;transition:transform .5s}
        .story-card:hover .story-cover{transform:scale(1.02)}
        .story-content{padding:2rem}
        .story-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem}
        .story-author{display:flex;gap:1rem;align-items:center}
        .author-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.1rem;box-shadow:0 4px 12px rgba(59,130,246,0.3)}
        .author-info h4{margin:0;font-size:1rem;font-weight:700;color:#111827}
        .author-info small{color:#9ca3af;font-size:0.85rem;font-weight:600}
        .story-destination{background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:#065f46;padding:0.5rem 1rem;border-radius:999px;font-size:0.85rem;font-weight:700}
        .story-content h3{margin:0 0 1rem 0;font-size:1.5rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .story-excerpt{color:#6b7280;line-height:1.7;margin-bottom:1.5rem;font-size:1rem}
        .story-actions{display:flex;gap:1rem}
        .btn-action{padding:0.6rem 1.25rem;background:#f3f4f6;color:#374151;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:0.9rem;transition:all .2s}
        .btn-action:hover{background:#e5e7eb;transform:translateY(-1px)}
        .btn-primary{padding:0.85rem 1.75rem;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.95rem;transition:all .3s;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(59,130,246,0.4)}
        .btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none}
        .btn-secondary{padding:0.85rem 1.75rem;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);color:#374151;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.95rem;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
        .btn-secondary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(8px)}
        .modal{background:rgba(255,255,255,0.98);backdrop-filter:blur(20px);border-radius:1.5rem;max-width:550px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,0.25);border:2px solid rgba(255,255,255,0.5)}
        .modal-header{display:flex;justify-content:space-between;align-items:center;padding:2rem;border-bottom:2px solid #f3f4f6}
        .modal-header h2{margin:0;font-size:1.5rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .btn-close{background:none;border:none;font-size:1.5rem;cursor:pointer;color:#9ca3af;padding:0.5rem;border-radius:8px;transition:all .2s}
        .btn-close:hover{background:#f3f4f6;color:#374151}
        .modal-body{padding:2rem;display:flex;flex-direction:column;gap:1.25rem}
        .form-group{display:flex;flex-direction:column;gap:0.5rem}
        .form-group label{font-size:0.9rem;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
        .form-group input,.form-group textarea,.form-group select{padding:0.85rem 1rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.95rem;font-family:inherit;transition:all .2s;background:#f9fafb}
        .form-group input:focus,.form-group textarea:focus,.form-group select:focus{outline:none;border-color:#3b82f6;background:white;box-shadow:0 4px 16px rgba(59,130,246,0.15)}
        .date-inputs{display:flex;gap:1rem}
        .date-inputs .form-group{flex:1}
        .form-actions{display:flex;gap:1rem;margin-top:1.5rem}
        .form-group.checkbox{flex-direction:row;align-items:center;gap:0.75rem}
        .form-group.checkbox input{width:auto;margin:0}
        .form-group.checkbox label{margin:0;text-transform:none;letter-spacing:normal;font-size:0.95rem;color:#374151}
        .empty-state{text-align:center;padding:5rem 2rem}
        .empty-icon{font-size:5rem;margin-bottom:1.5rem}
        .empty-state h2{font-size:1.75rem;font-weight:800;color:#111827;margin:0 0 1rem}
        .empty-state p{color:#6b7280;font-size:1.1rem;margin-bottom:2rem}
        .loading{text-align:center;padding:6rem;font-size:1.5rem;color:#6b7280;font-weight:600}

        @media (max-width: 768px) {
          .community-page{padding:1.5rem}
          .community-header{flex-direction:column;gap:1rem;text-align:center;padding:1.5rem}
          .community-header h1{font-size:1.5rem}
          .community-tabs{flex-wrap:justify-content}
          .community-tab{padding:0.75rem 1.25rem;font-size:0.85rem}
          .groups-grid{grid-template-columns:1fr}
          .feed-list{gap:1.5rem}
          .story-cover{height:250px}
          .story-content{padding:1.5rem}
          .modal{max-width:95%}
          .modal-header,.modal-body{padding:1.5rem}
        }
      `}</style>
    </main>
  )
}

function CreateGroupModal({ onClose, userId }) {
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    start_date: '',
    end_date: '',
    description: '',
    max_members: 20,
    membership_fee: 0,
    is_open: true,
    contact_method: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/tour-groups/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, created_by: userId })
      })
      if (response.ok) {
        alert('Group created successfully!')
        onClose()
      }
    } catch (err) {
      alert('Failed to create group')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Create Tour Group</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Destination</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Travel Dates</label>
            <div className="date-inputs">
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Max Members</label>
            <input
              type="number"
              value={formData.max_members}
              onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
              min="2"
              max="100"
              required
            />
          </div>
          <div className="form-group">
            <label>Membership Fee (BDT)</label>
            <input
              type="number"
              value={formData.membership_fee}
              onChange={(e) => setFormData({ ...formData, membership_fee: parseFloat(e.target.value) })}
              min="0"
              step="100"
            />
          </div>
          <div className="form-group">
            <label>Contact Method</label>
            <input
              type="text"
              value={formData.contact_method}
              onChange={(e) => setFormData({ ...formData, contact_method: e.target.value })}
              placeholder="Phone number or email"
            />
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.is_open}
                onChange={(e) => setFormData({ ...formData, is_open: e.target.checked })}
              />
              <span>Open for anyone to join</span>
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create Group</button>
          </div>
        </form>
      </div>
    </div>
  )
}