import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

export default function TravelerDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('Overview')
  const [profileData, setProfileData] = useState(null)
  const [tourRooms, setTourRooms] = useState([])
  const [notifications, setNotifications] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [stories, setStories] = useState([])
  const [destinations, setDestinations] = useState([])
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  
  const userId = searchParams.get('user_id')

  useEffect(() => {
    if (userId) {
      fetchAllData()
    } else {
      setLoading(false)
    }
  }, [userId])

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchProfileData(),
        fetchTourRooms(),
        fetchNotifications(),
        fetchWishlist(),
        fetchStories(),
        fetchDestinations(),
        fetchPreferences()
      ])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfileData = async () => {
    const response = await fetch(`http://localhost:8000/api/traveler/profile/?user_id=${userId}`)
    const data = await response.json()
    if (response.ok) setProfileData(data)
  }

  const fetchTourRooms = async () => {
    const response = await fetch(`http://localhost:8000/api/tour-rooms/?user_id=${userId}`)
    const data = await response.json()
    if (response.ok) setTourRooms(data)
  }

  const fetchNotifications = async () => {
    const response = await fetch(`http://localhost:8000/api/notifications/?user_id=${userId}`)
    const data = await response.json()
    if (response.ok) setNotifications(data)
  }

  const fetchWishlist = async () => {
    const response = await fetch(`http://localhost:8000/api/wishlist/?user_id=${userId}`)
    const data = await response.json()
    if (response.ok) setWishlist(data)
  }

  const fetchStories = async () => {
    const response = await fetch(`http://localhost:8000/api/stories/?user_id=${userId}`)
    const data = await response.json()
    if (response.ok) setStories(data)
  }

  const fetchDestinations = async () => {
    const response = await fetch('http://localhost:8000/api/destinations/')
    const data = await response.json()
    if (response.ok) setDestinations(data)
  }

  const fetchPreferences = async () => {
    const response = await fetch(`http://localhost:8000/api/travel-preferences/?user_id=${userId}`)
    const data = await response.json()
    if (response.ok && data.length > 0) setPreferences(data[0])
  }

  const handleLogout = () => {
    fetch('http://localhost:8000/api/auth/logout/', { method: 'POST', credentials: 'include' })
      .then(() => navigate('/signin'))
      .catch(() => navigate('/signin'))
  }

  const daysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date()
    return Math.max(0, Math.ceil(diff / 86400000))
  }

  const nextTrip = tourRooms
    .filter(tr => new Date(tr.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0]

  const recommendedDestinations = preferences?.interests
    ? destinations.filter(d => 
        preferences.interests.some(interest => 
          d.category?.toLowerCase().includes(interest.toLowerCase())
        )
      ).slice(0, 3)
    : destinations.slice(0, 3)

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return <div className="td-loading">Loading...</div>
  }

  return (
    <div className="td-root">
      {sidebarOpen && <div className="td-backdrop" onClick={() => setSidebarOpen(false)} />}
      
      <div className="td-main">
        <header className="td-topbar">
          <button className="td-hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="td-topbar-title">Dashboard</div>
          <div className="td-topbar-right">
            <button className="td-notif-btn" onClick={() => setActiveTab('Overview')}>
              🔔
              {unreadCount > 0 && <span className="td-notif-badge">{unreadCount}</span>}
            </button>
            <div className="td-topbar-avatar">{profileData?.full_name?.charAt(0) || 'T'}</div>
          </div>
        </header>

        <div className="td-content">
          {activeTab === 'Overview' && (
            <div className="td-section">
              {/* Personalised Welcome Banner */}
              <div className="td-welcome-banner">
                <div className="td-welcome-left">
                  <div className="td-welcome-avatar">{profileData?.full_name?.charAt(0) || 'T'}</div>
                  <div>
                    <p className="td-welcome-sub">Welcome back 👋</p>
                    <h1 className="td-welcome-name">{profileData?.full_name || 'Traveler'}</h1>
                    {preferences?.interests && (
                      <div className="td-welcome-tags">
                        {preferences.interests.map((pref, i) => (
                          <span key={i} className="td-pref-tag">{pref}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Link to="/discover" className="td-primary-btn">Explore Destinations →</Link>
              </div>

              {/* Upcoming Trip Card with Countdown */}
              {nextTrip && (
                <div className="td-next-trip-card">
                  <div className="td-next-trip-left">
                    <span className="td-next-trip-label">⏳ Next Trip</span>
                    <h2>{nextTrip.name}</h2>
                    <p>📍 {nextTrip.destination} · 📅 {nextTrip.start_date} - {nextTrip.end_date}</p>
                    <p>👥 {nextTrip.member_count}/{nextTrip.max_members} members</p>
                  </div>
                  <div className="td-countdown">
                    <div className="td-countdown-val">{daysUntil(nextTrip.start_date)}</div>
                    <div className="td-countdown-label">days away</div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h2 className="td-section-title">Quick Actions</h2>
                <div className="td-quick-actions">
                  <Link to="/discover" className="td-action-card">
                    <span className="td-action-icon">🗺️</span>
                    <span>Explore Destinations</span>
                  </Link>
                  <Link to="/traveler/room" className="td-action-card">
                    <span className="td-action-icon">📅</span>
                    <span>Plan a Trip</span>
                  </Link>
                  <Link to="/traveler/community" className="td-action-card">
                    <span className="td-action-icon">👥</span>
                    <span>Join a Group</span>
                  </Link>
                  <Link to="/traveler/ai-assistant" className="td-action-card">
                    <span className="td-action-icon">🤖</span>
                    <span>Chat with AI</span>
                  </Link>
                  <Link to="/traveler/tour-guides" className="td-action-card">
                    <span className="td-action-icon">🧭</span>
                    <span>Book a Guide</span>
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="td-stats-grid">
                <div className="td-stat-card">
                  <span className="td-stat-icon">🗺️</span>
                  <div className="td-stat-value">{tourRooms.length}</div>
                  <div className="td-stat-label">Tour Rooms</div>
                </div>
                <div className="td-stat-card">
                  <span className="td-stat-icon">📅</span>
                  <div className="td-stat-value">{tourRooms.filter(tr => new Date(tr.start_date) > new Date()).length}</div>
                  <div className="td-stat-label">Upcoming Trips</div>
                </div>
                <div className="td-stat-card">
                  <span className="td-stat-icon">❤️</span>
                  <div className="td-stat-value">{wishlist.length}</div>
                  <div className="td-stat-label">Saved Places</div>
                </div>
                <div className="td-stat-card">
                  <span className="td-stat-icon">📝</span>
                  <div className="td-stat-value">{stories.filter(s => s.status === 'published').length}</div>
                  <div className="td-stat-label">Stories Posted</div>
                </div>
              </div>

              {/* Recommended Destinations */}
              <div>
                <div className="td-card-head-row">
                  <h2 className="td-section-title">Recommended for You</h2>
                  <Link to="/discover" className="td-link-btn">See all →</Link>
                </div>
                <div className="td-recommend-grid">
                  {recommendedDestinations.map(dest => (
                    <Link key={dest.id} to={`/destination/${dest.slug}`} className="td-recommend-card">
                      <div className="td-recommend-img" style={{backgroundImage: `url(${dest.hero_image || '/placeholder.jpg'})`}}>
                        <div className="td-recommend-overlay" />
                        <span className="td-recommend-rating">{dest.rating || 4.5} ★</span>
                      </div>
                      <div className="td-recommend-info">
                        <strong>{dest.name}</strong>
                        <span className="td-recommend-cat">{dest.category || 'Destination'}</span>
                        <p className="td-recommend-reason">💡 Based on your preferences</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Active Tour Rooms with Unread Count */}
              <div>
                <div className="td-card-head-row">
                  <h2 className="td-section-title">Active Tour Rooms</h2>
                  <Link to="/traveler/room" className="td-link-btn">View all →</Link>
                </div>
                <div className="td-rooms-grid">
                  {tourRooms.slice(0, 3).map(room => (
                    <div key={room.id} className="td-room-card">
                      <div className="td-room-img" style={{backgroundImage: `url(${room.cover_photo || '/placeholder.jpg'})`}}>
                        {room.unread_count > 0 && <span className="td-room-unread">{room.unread_count} new</span>}
                      </div>
                      <div className="td-room-info">
                        <strong>{room.name}</strong>
                        <p>📍 {room.destination}</p>
                        <p>📅 {room.start_date} - {room.end_date}</p>
                        <div className="td-room-members">
                          <span>👥 {room.member_count}/{room.max_members}</span>
                          <Link to="/traveler/room" className="td-room-btn">Open</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Notifications (Last 5) */}
              <div>
                <div className="td-card-head-row">
                  <h2 className="td-section-title">Recent Notifications</h2>
                  {unreadCount > 0 && <span className="td-unread-badge">{unreadCount} unread</span>}
                </div>
                <div className="td-card td-notif-list">
                  {notifications.slice(0, 5).map(notif => (
                    <div key={notif.id} className={`td-notif-item${notif.is_read ? ' td-notif-read' : ''}`}>
                      <span className="td-notif-icon">{notif.category === 'booking' ? '📅' : notif.category === 'group' ? '👥' : notif.category === 'review' ? '⭐' : '🔔'}</span>
                      <div className="td-notif-body">
                        <strong>{notif.title}</strong>
                        <p>{notif.message}</p>
                      </div>
                      <span className="td-notif-time">{new Date(notif.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending This Week */}
              <div>
                <div className="td-card-head-row">
                  <h2 className="td-section-title">🔥 Trending This Week</h2>
                  <Link to="/discover" className="td-link-btn">Discover →</Link>
                </div>
                <div className="td-trending-grid">
                  {destinations.slice(0, 4).map(dest => (
                    <Link key={dest.id} to={`/destination/${dest.slug}`} className="td-trending-card">
                      <div className="td-trending-img" style={{backgroundImage: `url(${dest.hero_image || '/placeholder.jpg'})`}}>
                        <div className="td-trending-overlay" />
                        <span className="td-trending-tag">🔥 Hot</span>
                        <div className="td-trending-copy">
                          <strong>{dest.name}</strong>
                          <span>📍 {dest.region || 'Bangladesh'} · {dest.rating || 4.5} ★</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Trip Stories Feed */}
                <h2 className="td-section-title" style={{marginTop: '1.5rem'}}>Community Stories</h2>
                <div className="td-stories-feed">
                  {stories.slice(0, 3).map(story => (
                    <div key={story.id} className="td-story-card">
                      <div className="td-story-img" style={{backgroundImage: `url(${story.cover_photo || '/placeholder.jpg'})`}} />
                      <div className="td-story-info">
                        <strong>{story.title}</strong>
                        <p>📍 {story.destination_name}</p>
                        <div className="td-story-meta">
                          <span>✍️ {story.user || 'Traveler'}</span>
                          <span>❤️ {story.likes_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wishlist Preview */}
              <div>
                <div className="td-card-head-row">
                  <h2 className="td-section-title">❤️ Wishlist</h2>
                  <Link to="/traveler/wishlist" className="td-link-btn">View all →</Link>
                </div>
                <div className="td-saved-grid">
                  {wishlist.slice(0, 4).map(item => (
                    <div key={item.id} className="td-saved-card">
                      <div className="td-saved-img" style={{backgroundImage: `url(${item.destination_hero || '/placeholder.jpg'})`}}>
                        <div className="td-saved-img-overlay" />
                        <span className="td-saved-badge">{item.rating || 4.5} ★</span>
                      </div>
                      <div className="td-saved-content">
                        <div className="td-saved-head">
                          <h3>{item.destination_name}</h3>
                          <span className="td-type-badge">{item.destination_region || 'Bangladesh'}</span>
                        </div>
                        <div className="td-saved-actions">
                          <Link to={`/destination/${item.destination_slug || 'bandarban'}`} className="td-view-btn" style={{flex: 1, textAlign: 'center'}}>View Details</Link>
                          <button className="td-remove-btn">❤️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Travel Assistant Shortcut Chat Bubble */}
              <div className="td-ai-bubble-section">
                <div className="td-ai-bubble-header">
                  <span className="td-ai-icon">🤖</span>
                  <div>
                    <h2 className="td-section-title" style={{margin: 0}}>AI Travel Assistant</h2>
                    <p className="td-ai-sub">Ask anything — routes, budget, local tips</p>
                  </div>
                  <Link to="/traveler/ai-assistant" className="td-link-btn">Full chat →</Link>
                </div>
                <div className="td-ai-chat-box">
                  <div className="td-ai-msg td-ai-bot">
                    <span className="td-ai-bot-icon">🤖</span>
                    <div className="td-ai-bubble">Hi! Ask me anything about Bangladesh travel — routes, budget, or group tips 🗺️</div>
                  </div>
                </div>
                <div className="td-ai-input-row">
                  <input className="td-ai-input" placeholder="Ask about Bangladesh destinations…" />
                  <Link to="/traveler/ai-assistant" className="td-ai-send">Chat →</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="td-modal-overlay">
          <div className="td-modal">
            <h3>Log out?</h3>
            <p>You'll be redirected to the login page.</p>
            <div className="td-modal-btns">
              <button className="td-outline-btn" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="td-danger-btn" onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .td-root{display:flex;min-height:100vh;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%);font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
        .td-main{flex:1;display:flex;flex-direction:column;min-width:0}
        .td-topbar{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-bottom:1px solid rgba(229,231,235,0.5);padding:0 2rem;height:72px;display:flex;align-items:center;gap:1.5rem;position:sticky;top:0;z-index:50;box-shadow:0 4px 20px rgba(0,0,0,0.05)}
        .td-hamburger{display:none;background:none;border:none;font-size:1.5rem;cursor:pointer;color:#374151;padding:0.5rem;border-radius:8px;transition:background .2s}
        .td-hamburger:hover{background:#f3f4f6}
        .td-topbar-title{font-size:1.1rem;font-weight:800;color:#111827;flex:1;letter-spacing:-0.02em}
        .td-topbar-right{display:flex;align-items:center;gap:1rem}
        .td-notif-btn{position:relative;font-size:1.3rem;cursor:pointer;background:none;border:none;padding:0.5rem;border-radius:10px;transition:background .2s}
        .td-notif-btn:hover{background:#f3f4f6}
        .td-notif-badge{position:absolute;top:-2px;right:-2px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;font-size:0.65rem;padding:2px 6px;border-radius:999px;font-weight:800;box-shadow:0 2px 8px rgba(239,68,68,0.3)}
        .td-topbar-avatar{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#10b981,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:0.9rem;font-weight:800;color:white;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.3);transition:transform .2s}
        .td-topbar-avatar:hover{transform:scale(1.05)}
        .td-content{padding:2.5rem;flex:1;max-width:1600px;margin:0 auto;width:100%}
        .td-section{display:flex;flex-direction:column;gap:2rem}
        .td-section-title{font-size:1.15rem;font-weight:800;color:#111827;margin:0 0 1rem;letter-spacing:-0.01em}
        .td-card-head-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
        .td-link-btn{background:none;border:none;color:#10b981;font-size:0.9rem;font-weight:700;cursor:pointer;text-decoration:none;padding:0.5rem 1rem;border-radius:8px;transition:background .2s}
        .td-link-btn:hover{background:#ecfdf5}
        .td-loading{text-align:center;padding:6rem;font-size:1.25rem;color:#6b7280}
        .td-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:40;backdrop-filter:blur(4px)}

        .td-welcome-banner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.5rem;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%);border-radius:1.5rem;padding:2.5rem;box-shadow:0 20px 60px rgba(15,23,42,0.4);position:relative;overflow:hidden}
        .td-welcome-banner::before{content:'';position:absolute;top:-50%;right:-50%;width:100%;height:100%;background:radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 70%);pointer-events:none}
        .td-welcome-left{display:flex;align-items:center;gap:1.5rem;position:relative;z-index:1}
        .td-welcome-avatar{width:72px;height:72px;border-radius:20px;flex-shrink:0;background:linear-gradient(135deg,#10b981,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:white;box-shadow:0 8px 24px rgba(16,185,129,0.4);border:3px solid rgba(255,255,255,0.1)}
        .td-welcome-sub{color:rgba(255,255,255,0.7);font-size:0.9rem;margin:0 0 0.3rem;font-weight:500}
        .td-welcome-name{font-size:1.75rem;font-weight:800;color:white;margin:0 0 0.75rem;letter-spacing:-0.02em}
        .td-welcome-tags{display:flex;gap:0.5rem;flex-wrap:wrap}
        .td-pref-tag{background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.9);font-size:0.75rem;font-weight:600;padding:0.35rem 0.85rem;border-radius:999px;border:1px solid rgba(255,255,255,0.2);backdrop-filter:blur(10px)}
        .td-primary-btn{background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:12px;padding:0.85rem 1.75rem;font-size:0.95rem;font-weight:700;cursor:pointer;transition:all .3s;text-decoration:none;display:inline-block;text-align:center;box-shadow:0 4px 16px rgba(16,185,129,0.3);position:relative;z-index:1}
        .td-primary-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(16,185,129,0.4)}

        .td-next-trip-card{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.5rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;padding:2rem 2.5rem;border-left:6px solid #10b981;box-shadow:0 8px 32px rgba(0,0,0,0.08);transition:transform .3s,box-shadow .3s}
        .td-next-trip-card:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,0.12)}
        .td-next-trip-label{font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#10b981;display:block;margin-bottom:0.5rem}
        .td-next-trip-card h2{font-size:1.5rem;font-weight:800;color:#111827;margin:0 0 0.5rem;letter-spacing:-0.02em}
        .td-next-trip-card p{font-size:0.95rem;color:#6b7280;margin:0 0 0.4rem}
        .td-countdown{text-align:center;background:linear-gradient(135deg,#ecfdf5,#d1fae5);padding:1.5rem 2rem;border-radius:16px;box-shadow:0 4px 16px rgba(16,185,129,0.15)}
        .td-countdown-val{font-size:3.5rem;font-weight:900;color:#10b981;line-height:1;letter-spacing:-0.02em}
        .td-countdown-label{font-size:0.75rem;color:#065f46;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-top:0.25rem}

        .td-quick-actions{display:grid;grid-template-columns:repeat(5,1fr);gap:1rem}
        .td-action-card{display:flex;flex-direction:column;align-items:center;gap:0.75rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;padding:1.5rem 1rem;border:2px solid rgba(243,244,246,0.8);text-decoration:none;color:#374151;font-size:0.85rem;font-weight:700;text-align:center;transition:all .3s;box-shadow:0 4px 16px rgba(0,0,0,0.04)}
        .td-action-card:hover{border-color:#10b981;transform:translateY(-4px);box-shadow:0 12px 32px rgba(16,185,129,0.15);background:white}
        .td-action-icon{font-size:2rem;display:filter;transition:transform .3s}
        .td-action-card:hover .td-action-icon{transform:scale(1.1)}

        .td-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem}
        .td-stat-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;padding:2rem;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 20px rgba(0,0,0,0.06);text-align:center;transition:all .3s}
        .td-stat-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,0.1);border-color:rgba(16,185,129,0.3)}
        .td-stat-icon{font-size:2rem;display:block;margin-bottom:0.75rem}
        .td-stat-value{font-size:2.25rem;font-weight:900;color:#111827;margin-bottom:0.25rem;letter-spacing:-0.02em}
        .td-stat-label{font-size:0.85rem;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}

        .td-recommend-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}
        .td-recommend-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;overflow:hidden;border:2px solid rgba(243,244,246,0.8);text-decoration:none;color:#111827;transition:all .3s;display:flex;flex-direction:column;box-shadow:0 4px 20px rgba(0,0,0,0.06)}
        .td-recommend-card:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(0,0,0,0.12);border-color:rgba(16,185,129,0.3)}
        .td-recommend-img{position:relative;height:160px;background-size:cover;background-position:center;transition:transform .5s}
        .td-recommend-card:hover .td-recommend-img{transform:scale(1.05)}
        .td-recommend-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 60%)}
        .td-recommend-rating{position:absolute;bottom:0.75rem;right:0.75rem;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;font-size:0.75rem;font-weight:800;padding:0.3rem 0.75rem;border-radius:999px;box-shadow:0 4px 12px rgba(245,158,11,0.3)}
        .td-recommend-info{padding:1.25rem;flex:1}
        .td-recommend-info strong{display:block;font-size:1.05rem;font-weight:800;margin-bottom:0.35rem;letter-spacing:-0.01em}
        .td-recommend-cat{font-size:0.8rem;color:#10b981;font-weight:700}
        .td-recommend-reason{font-size:0.82rem;color:#9ca3af;margin:0.5rem 0 0;line-height:1.5}

        .td-rooms-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}
        .td-room-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;overflow:hidden;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 20px rgba(0,0,0,0.06);transition:all .3s}
        .td-room-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.1)}
        .td-room-img{position:relative;height:150px;background-size:cover;background-position:center;transition:transform .5s}
        .td-room-card:hover .td-room-img{transform:scale(1.05)}
        .td-room-unread{position:absolute;top:0.75rem;right:0.75rem;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;font-size:0.7rem;font-weight:800;padding:0.3rem 0.75rem;border-radius:999px;box-shadow:0 4px 12px rgba(239,68,68,0.3)}
        .td-room-info{padding:1.25rem}
        .td-room-info strong{display:block;font-size:1rem;font-weight:800;color:#111827;margin-bottom:0.5rem;letter-spacing:-0.01em}
        .td-room-info p{font-size:0.85rem;color:#6b7280;margin:0.2rem 0}
        .td-room-members{display:flex;align-items:center;justify-content:space-between;margin-top:0.75rem}
        .td-room-members span{font-size:0.85rem;color:#6b7280;font-weight:600}
        .td-room-btn{background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:#065f46;border:none;border-radius:8px;padding:0.5rem 1rem;font-size:0.8rem;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block;transition:all .2s;box-shadow:0 2px 8px rgba(16,185,129,0.2)}
        .td-room-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(16,185,129,0.3)}

        .td-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;padding:2rem;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 20px rgba(0,0,0,0.06)}
        .td-notif-list{display:flex;flex-direction:column;gap:0;padding:0}
        .td-notif-item{display:flex;align-items:flex-start;gap:1rem;padding:1rem 0;border-bottom:1px solid #f9fafb;transition:background .2s;border-radius:8px;padding:1rem}
        .td-notif-item:hover{background:#f9fafb}
        .td-notif-item:last-child{border-bottom:none;padding-bottom:0}
        .td-notif-read{opacity:0.5}
        .td-notif-icon{font-size:1.4rem;flex-shrink:0;margin-top:0.15rem}
        .td-notif-body{flex:1}
        .td-notif-body strong{font-size:0.95rem;font-weight:800;color:#111827;display:block;margin-bottom:0.3rem;letter-spacing:-0.01em}
        .td-notif-body p{font-size:0.85rem;color:#6b7280;margin:0;line-height:1.6}
        .td-notif-time{font-size:0.78rem;color:#9ca3af;white-space:nowrap;flex-shrink:0;font-weight:600}
        .td-unread-badge{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;font-size:0.75rem;font-weight:800;padding:0.3rem 0.75rem;border-radius:999px;box-shadow:0 2px 8px rgba(59,130,246,0.3)}

        .td-trending-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem}
        .td-trending-card{border-radius:1.25rem;overflow:hidden;text-decoration:none;display:block;box-shadow:0 4px 20px rgba(0,0,0,0.08);transition:all .3s}
        .td-trending-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,0.15)}
        .td-trending-img{position:relative;height:200px;background-size:cover;background-position:center;transition:transform .5s}
        .td-trending-card:hover .td-trending-img{transform:scale(1.08)}
        .td-trending-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.2) 50%,transparent 100%)}
        .td-trending-tag{position:absolute;top:0.75rem;left:0.75rem;background:rgba(255,255,255,0.2);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.3);color:white;font-size:0.75rem;font-weight:800;padding:0.35rem 0.85rem;border-radius:999px}
        .td-trending-copy{position:absolute;bottom:1rem;left:1rem;right:1rem;color:white}
        .td-trending-copy strong{display:block;font-size:1rem;font-weight:800;margin-bottom:0.25rem;letter-spacing:-0.01em}
        .td-trending-copy span{font-size:0.8rem;color:rgba(255,255,255,0.8);font-weight:600}

        .td-stories-feed{display:flex;flex-direction:column;gap:1rem}
        .td-story-card{display:flex;gap:1.25rem;align-items:center;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;overflow:hidden;border:2px solid rgba(243,244,246,0.8);transition:all .3s;box-shadow:0 4px 16px rgba(0,0,0,0.06);padding:0.75rem}
        .td-story-card:hover{transform:translateX(4px);box-shadow:0 8px 32px rgba(0,0,0,0.1)}
        .td-story-img{width:120px;height:85px;flex-shrink:0;border-radius:10px;overflow:hidden;background-size:cover;background-position:center}
        .td-story-info{flex:1;padding:0.5rem 0}
        .td-story-info strong{display:block;font-size:1rem;font-weight:800;color:#111827;margin-bottom:0.3rem;letter-spacing:-0.01em}
        .td-story-info p{font-size:0.85rem;color:#6b7280;margin:0.15rem 0}
        .td-story-meta{display:flex;gap:1.25rem;font-size:0.8rem;color:#9ca3af;margin-top:0.4rem;font-weight:600}

        .td-saved-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1.25rem}
        .td-saved-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;overflow:hidden;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 20px rgba(0,0,0,0.06);display:flex;flex-direction:column;transition:all .3s}
        .td-saved-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.1)}
        .td-saved-img{position:relative;width:100%;height:0;padding-bottom:55%;background-size:cover;background-position:center;border-radius:1.25rem 1.25rem 0 0;overflow:hidden}
        .td-saved-img-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 60%)}
        .td-saved-badge{position:absolute;top:0.75rem;right:0.75rem;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;font-size:0.75rem;font-weight:800;padding:0.35rem 0.85rem;border-radius:999px;box-shadow:0 4px 12px rgba(245,158,11,0.3)}
        .td-saved-content{padding:1.25rem;flex:1;display:flex;flex-direction:column}
        .td-saved-head{display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:1rem}
        .td-saved-head h3{font-size:1.05rem;font-weight:800;color:#111827;margin:0;letter-spacing:-0.01em}
        .td-type-badge{background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:#065f46;font-size:0.75rem;font-weight:800;padding:0.3rem 0.85rem;border-radius:999px;white-space:nowrap}
        .td-saved-actions{display:flex;gap:0.75rem;margin-top:auto}
        .td-remove-btn{background:linear-gradient(135deg,#fee2e2,#fecaca);color:#991b1b;border:none;border-radius:8px;padding:0.6rem 1rem;cursor:pointer;font-size:0.85rem;font-weight:700;transition:all .2s;box-shadow:0 2px 8px rgba(239,68,68,0.2)}
        .td-remove-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(239,68,68,0.3)}
        .td-view-btn{background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:#065f46;border:none;border-radius:8px;padding:0.5rem 1rem;font-size:0.8rem;cursor:pointer;font-weight:700;text-decoration:none;display:inline-block;transition:all .2s;box-shadow:0 2px 8px rgba(16,185,129,0.2);flex:1;text-align:center}
        .td-view-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(16,185,129,0.3)}

        .td-ai-bubble-section{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.5rem;padding:2.25rem;border:2px solid rgba(14,165,233,0.2);box-shadow:0 8px 32px rgba(14,165,233,0.12);position:relative;overflow:hidden}
        .td-ai-bubble-section::before{content:'';position:absolute;top:-50%;left:-50%;width:100%;height:100%;background:radial-gradient(circle,rgba(14,165,233,0.08) 0%,transparent 70%);pointer-events:none}
        .td-ai-bubble-header{display:flex;align-items:center;gap:1.25rem;margin-bottom:1.5rem;flex-wrap:wrap;position:relative;z-index:1}
        .td-ai-icon{font-size:2.5rem}
        .td-ai-sub{font-size:0.9rem;color:#6b7280;margin:0.25rem 0 0;font-weight:600}
        .td-ai-chat-box{display:flex;flex-direction:column;gap:1rem;max-height:250px;overflow-y:auto;background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:1rem;padding:1.25rem;margin-bottom:1.25rem;position:relative;z-index:1}
        .td-ai-msg{display:flex;align-items:flex-end;gap:0.75rem}
        .td-ai-bot-icon{width:32px;height:32px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.1rem;background:linear-gradient(135deg,#0ea5e9,#38bdf8);box-shadow:0 4px 12px rgba(14,165,233,0.3)}
        .td-ai-bubble{max-width:75%;padding:0.85rem 1.1rem;border-radius:1.25rem;font-size:0.92rem;line-height:1.6;background:white;border:2px solid #e5e7eb;border-radius:1.25rem 1.25rem 1.25rem 0.25rem;color:#374151;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
        .td-ai-input-row{display:flex;gap:0.75rem;position:relative;z-index:1}
        .td-ai-input{flex:1;border:2px solid #e5e7eb;border-radius:1rem;padding:0.85rem 1.25rem;font-size:0.95rem;color:#111827;background:white;font-family:inherit;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
        .td-ai-input:focus{outline:none;border-color:#10b981;box-shadow:0 4px 16px rgba(16,185,129,0.15)}
        .td-ai-send{background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:1rem;padding:0.85rem 1.5rem;font-size:0.95rem;font-weight:800;cursor:pointer;transition:all .2s;text-decoration:none;display:inline-block;text-align:center;white-space:nowrap;box-shadow:0 4px 16px rgba(16,185,129,0.3)}
        .td-ai-send:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(16,185,129,0.4)}

        .td-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(8px)}
        .td-modal{background:rgba(255,255,255,0.98);backdrop-filter:blur(20px);border-radius:1.5rem;padding:2.5rem;max-width:400px;width:90%;box-shadow:0 32px 80px rgba(0,0,0,0.25);border:2px solid rgba(255,255,255,0.5)}
        .td-modal h3{font-size:1.25rem;font-weight:800;color:#111827;margin:0 0 0.75rem;letter-spacing:-0.01em}
        .td-modal p{font-size:0.95rem;color:#6b7280;margin:0 0 2rem;line-height:1.6}
        .td-modal-btns{display:flex;gap:1rem;justify-content:flex-end}
        .td-outline-btn{background:white;color:#374151;border:2px solid #e5e7eb;border-radius:12px;padding:0.75rem 1.5rem;font-size:0.95rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
        .td-outline-btn:hover{border-color:#9ca3af;transform:translateY(-1px)}
        .td-danger-btn{background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:12px;padding:0.75rem 1.5rem;font-size:0.95rem;font-weight:800;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(239,68,68,0.3)}
        .td-danger-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(239,68,68,0.4)}

        @media (max-width: 1100px) {
          .td-trending-grid{grid-template-columns:repeat(2,1fr)}
          .td-quick-actions{grid-template-columns:repeat(3,1fr)}
          .td-stats-grid{grid-template-columns:repeat(2,1fr)}
          .td-recommend-grid,.td-rooms-grid{grid-template-columns:repeat(2,1fr)}
        }
        @media (max-width: 768px) {
          .td-hamburger{display:block}
          .td-content{padding:1.5rem}
          .td-quick-actions{grid-template-columns:repeat(2,1fr)}
          .td-stats-grid{grid-template-columns:repeat(2,1fr)}
          .td-recommend-grid,.td-rooms-grid,.td-trending-grid{grid-template-columns:1fr}
          .td-welcome-banner{flex-direction:column;align-items:flex-start}
          .td-saved-grid{grid-template-columns:1fr}
        }
        @media (max-width: 480px) {
          .td-stats-grid{grid-template-columns:repeat(2,1fr)}
          .td-trending-grid{grid-template-columns:1fr 1fr}
          .td-quick-actions{grid-template-columns:repeat(2,1fr)}
          .td-welcome-left{flex-direction:column;gap:1rem}
          .td-content{padding:1rem}
          .td-welcome-banner{padding:1.75rem}
          .td-next-trip-card{padding:1.5rem}
        }
      `}</style>
    </div>
  )
}