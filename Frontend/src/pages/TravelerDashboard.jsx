import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTravelerDashboard, createTourRoom, getDestinations, sendGeminiMessage } from '../apiClient'

const quickActions = [
  { icon: '🧭', label: 'Explore Destinations', color: 'from-blue-500 to-cyan-400', to: '/discover' },
  { icon: '📅', label: 'Plan a Trip', color: 'from-blue-500 to-cyan-400', to: null, action: 'plan_trip' },
  { icon: '👥', label: 'Join a Group', color: 'from-blue-500 to-cyan-400', to: '/traveler/community?tab=browse' },
  { icon: '🤖', label: 'Chat with AI', color: 'from-blue-500 to-cyan-400', to: '/traveler/ai' },
  { icon: '👨‍🏫', label: 'Book a Guide', color: 'from-blue-500 to-cyan-400', to: '/traveler/bookings' },
]

function computeCountdown(targetDate) {
  const target = new Date(`${targetDate}T00:00:00`)
  const now = new Date()
  let diff = Math.max(0, target - now)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  diff -= days * 1000 * 60 * 60 * 24
  const hours = Math.floor(diff / (1000 * 60 * 60))
  diff -= hours * 1000 * 60 * 60
  const minutes = Math.floor(diff / (1000 * 60))
  diff -= minutes * 1000 * 60
  const seconds = Math.floor(diff / 1000)
  return { days, hours, minutes, seconds }
}

export default function TravelerDashboard() {
  const navigate = useNavigate()
  const userId = useMemo(() => localStorage.getItem('userId'), [])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  // ── Plan a Trip Modal state ──
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planStep, setPlanStep] = useState(1)
  const [destinations, setDestinations] = useState([])
  const [planForm, setPlanForm] = useState({
    name: '',
    destination: '',
    start_date: '',
    end_date: '',
    max_members: 6,
    description: '',
  })
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')

  useEffect(() => {
    if (!userId) {
      setError('Please sign in to view your dashboard.')
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getTravelerDashboard(userId)
        setDashboard(data)
      } catch {
        setError('Unable to load dashboard. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const upcomingTrip = dashboard?.upcoming_trip

  useEffect(() => {
    if (!upcomingTrip?.start_date) return undefined
    const tick = () => setCountdown(computeCountdown(upcomingTrip.start_date))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [upcomingTrip?.start_date])

  const openAiChat = () => {
    if (chatMessages.length === 0) {
      setChatMessages([{ role: 'assistant', content: ai_assistant?.greeting || 'Hi! I\'m your AI travel assistant. Ask me anything about Bangladesh travel!' }])
    }
    setShowChat(true)
  }

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      const response = await sendGeminiMessage('dashboard-chat', userMessage, chatMessages)
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.content }])
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, showChat])

  // Load destinations for Plan a Trip modal
  useEffect(() => {
    getDestinations().then(data => setDestinations(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const openPlanModal = () => {
    console.log('Opening Plan a Trip modal')
    setPlanStep(1)
    setPlanForm({ name: '', destination: '', start_date: '', end_date: '', max_members: 6, description: '' })
    setPlanError('')
    setShowPlanModal(true)
    console.log('showPlanModal set to true')
  }

  const handlePlanSubmit = async () => {
    console.log('Submitting plan form:', planForm)
    if (!planForm.name.trim() || !planForm.destination || !planForm.start_date || !planForm.end_date) {
      setPlanError('Please fill in all required fields.')
      return
    }
    setPlanLoading(true)
    setPlanError('')
    try {
      console.log('Calling createTourRoom with userId:', userId)
      const result = await createTourRoom(userId, {
        name: planForm.name,
        destination: planForm.destination,
        start_date: planForm.start_date,
        end_date: planForm.end_date,
        max_members: planForm.max_members,
        description: planForm.description,
      })
      console.log('Tour room created:', result)
      setShowPlanModal(false)
      navigate(`/traveler/room?id=${result.id}`)
    } catch (err) {
      console.error('Error creating tour room:', err)
      setPlanError(err.message || 'Failed to create trip. Please try again.')
    } finally {
      setPlanLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <p className="dashboard-status">Loading your dashboard…</p>
      </main>
    )
  }

  if (error || !dashboard) {
    return (
      <main className="page-shell">
        <p className="dashboard-status dashboard-error">{error || 'Dashboard unavailable.'}</p>
        {!userId && (
          <button type="button" className="button button-primary" onClick={() => navigate('/signin')}>
            Sign In
          </button>
        )}
      </main>
    )
  }

  const { welcome, recommended_destinations, tour_rooms, notifications, trending_destinations, trip_stories, wishlist, ai_assistant } = dashboard

  return (
    <main className="page-shell">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-content">
          <div className="avatar-section">
            {welcome.avatar_url ? (
              <img src={welcome.avatar_url} alt="" className="avatar avatar-image" />
            ) : (
              <div className="avatar">{welcome.avatar_initials}</div>
            )}
            <div className="welcome-text">
              <h1>Welcome back, {welcome.first_name}!</h1>
              <p>Ready for your next adventure?</p>
            </div>
          </div>
          <div className="welcome-stats">
            <div className="stat">
              <strong>{welcome.stats.trips}</strong>
              <span>Trips</span>
            </div>
            <div className="stat">
              <strong>{welcome.stats.countries}</strong>
              <span>Countries</span>
            </div>
            <div className="stat">
              <strong>{welcome.stats.connections}</strong>
              <span>Connections</span>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Trip Card */}
      {upcomingTrip && (
        <section className="upcoming-trip-section">
          <div className="upcoming-trip-card">
            <div
              className="trip-image"
              style={{ backgroundImage: `url(${upcomingTrip.image})` }}
            >
              <div className="trip-badge">Upcoming Trip</div>
            </div>
            <div className="trip-details">
              <h2>{upcomingTrip.title}</h2>
              <p className="trip-dates">{upcomingTrip.date_label}</p>
              <div className="countdown">
                <div className="countdown-item">
                  <span className="countdown-value">{countdown.days}</span>
                  <span className="countdown-label">Days</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-value">{countdown.hours}</span>
                  <span className="countdown-label">Hours</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-value">{countdown.minutes}</span>
                  <span className="countdown-label">Minutes</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-value">{countdown.seconds}</span>
                  <span className="countdown-label">Seconds</span>
                </div>
              </div>
              <Link
                to={upcomingTrip.destination_slug ? `/destination/${upcomingTrip.destination_slug}` : '/traveler/room'}
                className="button button-primary"
              >
                View Trip Details
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action) => {
            const className = `quick-action-card bg-gradient-to-r ${action.color}`
            if (action.action === 'plan_trip') {
              return (
                <button key={action.label} type="button" className={className} onClick={openPlanModal}>
                  <span className="action-icon">{action.icon}</span>
                  <span className="action-label">{action.label}</span>
                </button>
              )
            }
            if (action.to) {
              return (
                <Link key={action.label} to={action.to} className={className}>
                  <span className="action-icon">{action.icon}</span>
                  <span className="action-label">{action.label}</span>
                </Link>
              )
            }
            return (
              <button key={action.label} type="button" className={className}>
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Main Grid */}
      <div className="dashboard-main-grid">
        <div className="dashboard-left">
          <section className="dashboard-section">
            <div className="section-header">
              <h3>Recommended for You</h3>
              <Link to="/discover" className="view-all">View All</Link>
            </div>
            {recommended_destinations.length === 0 ? (
              <p className="empty-hint">Set travel preferences in your profile to get recommendations.</p>
            ) : (
              <div className="destinations-row">
                {recommended_destinations.map((dest) => (
                  <Link
                    key={dest.slug}
                    to={`/destination/${dest.slug}`}
                    className="destination-card-mini"
                  >
                    <div className="dest-image" style={{ backgroundImage: `url(${dest.image})` }} />
                    <div className="dest-info">
                      <h4>{dest.name}</h4>
                      <p>{dest.country}</p>
                      <div className="dest-rating">⭐ {dest.rating}</div>
                    </div>
                  </Link>
                ))}
                <Link
                  to="/destination/rangamati"
                  className="destination-card-mini"
                >
                  <div className="dest-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1645985926275-d2184d7c2d5c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)' }} />
                  <div className="dest-info">
                    <h4>Rangamati</h4>
                    <p>Bangladesh</p>
                    <div className="dest-rating">⭐ 4.5</div>
                  </div>
                </Link>
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h3>Active Tour Rooms</h3>
              <Link to="/traveler/room" className="view-all">View All</Link>
            </div>
            {tour_rooms.length === 0 ? (
              <p className="empty-hint">You have not joined any tour rooms yet.</p>
            ) : (
              <div className="tour-rooms-list">
                {tour_rooms.map((room) => (
                  <Link key={room.id} to="/traveler/room" className="tour-room-item">
                    <div className="room-avatar" style={{ backgroundImage: `url(${room.image})` }} />
                    <div className="room-info">
                      <h4>{room.name}</h4>
                      <p>{room.members} members</p>
                    </div>
                    {room.unread > 0 && <div className="unread-badge">{room.unread}</div>}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h3>Recent Notifications</h3>
            </div>
            {notifications.length === 0 ? (
              <p className="empty-hint">No notifications yet.</p>
            ) : (
              <div className="notifications-list">
                {notifications.map((notif) => {
                  const content = (
                    <>
                      <span className="notif-icon">{notif.icon}</span>
                      <div className="notif-content">
                        <p>{notif.message}</p>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                    </>
                  )
                  if (notif.link) {
                    return (
                      <Link
                        key={notif.id}
                        to={notif.link}
                        className="notification-item notification-link"
                      >
                        {content}
                      </Link>
                    )
                  }
                  return (
                    <div key={notif.id} className="notification-item">
                      {content}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <div className="dashboard-right">
          <section className="dashboard-section">
            <div className="section-header">
              <h3>Trending This Week</h3>
              <Link to="/discover" className="view-all">View All</Link>
            </div>
            <div className="trending-grid">
              {trending_destinations.map((dest) => (
                <Link key={dest.slug} to={`/destination/${dest.slug}`} className="trending-card">
                  <div className="trending-image" style={{ backgroundImage: `url(${dest.image})` }} />
                  <div className="trending-info">
                    <h4>{dest.name}</h4>
                    <p>{dest.country}</p>
                    <span className="trending-views">👁️ {dest.views} views</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h3>Trip Stories</h3>
              <Link to="/traveler/stories" className="view-all">View All</Link>
            </div>
            {trip_stories.length === 0 ? (
              <p className="empty-hint">No trip stories from the community yet.</p>
            ) : (
              <div className="stories-grid">
                {trip_stories.map((story) => (
                  <div key={story.id} className="story-card-mini">
                    <div className="story-image" style={{ backgroundImage: `url(${story.image})` }} />
                    <div className="story-info">
                      <p className="story-author">by {story.author}</p>
                      <h4>{story.destination}</h4>
                      <span className="story-likes">❤️ {story.likes}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h3>Your Wishlist</h3>
              <Link to="/traveler/profile" className="view-all">View All</Link>
            </div>
            {wishlist.length === 0 ? (
              <p className="empty-hint">Save destinations to build your wishlist.</p>
            ) : (
              <div className="wishlist-grid">
                {wishlist.map((item) => (
                  <Link key={item.slug} to={`/destination/${item.slug}`} className="wishlist-item">
                    <div className="wishlist-image" style={{ backgroundImage: `url(${item.image})` }} />
                    <div className="wishlist-info">
                      <h4>{item.name}</h4>
                      <p>{item.country}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* AI Travel Assistant Chat Bubble */}
      <div className={`ai-chat-bubble ${showChat ? 'open' : ''}`}>
        <button type="button" className="chat-toggle" onClick={() => setShowChat(!showChat)}>
          {showChat ? '✕' : '🤖'}
        </button>
        {showChat && (
          <div className="chat-window">
            <div className="chat-header">
              <h4>AI Travel Assistant</h4>
              <p>Ask me anything about Bangladesh travel!</p>
            </div>
            <div className="chat-messages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  <p>{msg.content}</p>
                </div>
              ))}
              {chatLoading && (
                <div className="message bot typing">
                  <p>...</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input">
              <input 
                type="text" 
                placeholder="Type your message..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                disabled={chatLoading}
              />
              <button 
                type="button" 
                onClick={handleChatSend}
                disabled={chatLoading || !chatInput.trim()}
              >
                {chatLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Plan a Trip Modal ── */}
      {showPlanModal && (
        <div className="shared-modal-overlay" onClick={(e) => e.target.classList.contains('shared-modal-overlay') && setShowPlanModal(false)}>
          <div className="shared-modal-content pt-modal">
            {/* Header */}
            <div className="shared-modal-header">
              <div>
                <span className="pt-eyebrow">✦ Trip Planner</span>
                <h2 className="shared-modal-title">Plan Your Next Adventure</h2>
              </div>
              <button className="pt-close" style={{background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem 0.5rem'}} onClick={() => setShowPlanModal(false)}>✕</button>
            </div>

            {/* Step indicators */}
            <div className="pt-steps" style={{padding: '0 1.5rem', marginTop: '1rem'}}>
              {['Destination', 'Dates & Group', 'Details'].map((s, i) => (
                <div key={s} className={`pt-step ${planStep > i + 1 ? 'pt-step-done' : ''} ${planStep === i + 1 ? 'pt-step-active' : ''}`}>
                  <div className="pt-step-num">{planStep > i + 1 ? '✓' : i + 1}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* Step 1 – Destination */}
            {planStep === 1 && (
              <div className="shared-modal-body">
                <p className="pt-step-desc">Where do you want to go?</p>
                <div className="pt-dest-grid">
                  {(destinations.length > 0 ? destinations : [
                    { slug: 'sundarbans', name: 'Sundarbans', region: 'Khulna' },
                    { slug: 'coxs-bazar', name: "Cox's Bazar", region: 'Chittagong' },
                    { slug: 'sajek', name: 'Sajek Valley', region: 'Chittagong' },
                    { slug: 'bandarban', name: 'Bandarban', region: 'Chittagong' },
                    { slug: 'sreemangal', name: 'Sreemangal', region: 'Sylhet' },
                    { slug: 'kuakata', name: 'Kuakata', region: 'Barisal' },
                  ]).slice(0, 8).map(d => (
                    <button
                      key={d.slug}
                      className={`pt-dest-card ${planForm.destination === d.slug ? 'pt-dest-selected' : ''}`}
                      onClick={() => setPlanForm(f => ({ ...f, destination: d.slug, name: f.name || `${d.name} Trip` }))}
                    >
                      <span className="pt-dest-emoji">📍</span>
                      <strong>{d.name}</strong>
                      <small>{d.region}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {planStep === 1 && (
              <div className="shared-modal-footer">
                <button
                  className="button button-primary" disabled={!planForm.destination}
                  onClick={() => setPlanStep(2)}
                >Next: Set Dates →</button>
              </div>
            )}

            {/* Step 2 – Dates & Group */}
            {planStep === 2 && (
              <div className="shared-modal-body">
                <p className="pt-step-desc">When are you going and who's coming?</p>
                <div className="pt-form-grid">
                  <div className="form-group">
                    <label className="form-label">📅 Start Date</label>
                    <input type="date" className="form-control" value={planForm.start_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setPlanForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">📅 End Date</label>
                    <input type="date" className="form-control" value={planForm.end_date}
                      min={planForm.start_date || new Date().toISOString().split('T')[0]}
                      onChange={e => setPlanForm(f => ({ ...f, end_date: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{gridColumn: '1 / -1'}}>
                    <label className="form-label">👥 Max Group Size</label>
                    <div className="pt-counter">
                      <button type="button" onClick={() => setPlanForm(f => ({ ...f, max_members: Math.max(2, f.max_members - 1) }))}>−</button>
                      <span>{planForm.max_members} people</span>
                      <button type="button" onClick={() => setPlanForm(f => ({ ...f, max_members: Math.min(50, f.max_members + 1) }))}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {planStep === 2 && (
              <div className="shared-modal-footer">
                <button className="button button-secondary" onClick={() => setPlanStep(1)}>← Back</button>
                <button
                  className="button button-primary"
                  disabled={!planForm.start_date || !planForm.end_date}
                  onClick={() => setPlanStep(3)}
                >Next: Details →</button>
              </div>
            )}

            {/* Step 3 – Details & Create */}
            {planStep === 3 && (
              <div className="shared-modal-body">
                <p className="pt-step-desc">Give your trip a name and optional description.</p>
                <div className="pt-form-col">
                  <div className="form-group">
                    <label className="form-label required">✏️ Trip Name</label>
                    <input
                      className="form-control"
                      type="text" placeholder="e.g. Sundarbans Adventure 2025"
                      value={planForm.name}
                      onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">📝 Description (optional)</label>
                    <textarea
                      className="form-control"
                      placeholder="What are the main goals or vibes of this trip?"
                      value={planForm.description}
                      onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </div>
                {planError && <div className="profile-alert error" style={{marginTop: '1rem'}}>{planError}</div>}
              </div>
            )}
            {planStep === 3 && (
              <div className="shared-modal-footer">
                <button className="button button-secondary" onClick={() => setPlanStep(2)} disabled={planLoading}>← Back</button>
                <button
                  className="button button-primary"
                  onClick={handlePlanSubmit}
                  disabled={!planForm.name.trim() || planLoading}
                >
                  {planLoading ? 'Creating...' : 'Create Trip ✨'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        main.page-shell {
          margin-top: 98px !important;
          margin-left: 264px !important;
          width: calc(100% - 264px) !important;
          max-width: none !important;
          padding: 0 2rem 2rem 2rem !important;
          min-height: calc(100vh - 98px);
          box-sizing: border-box;
        }
        .dashboard-status {
          text-align: center;
          padding: 48px 16px;
          color: var(--text-muted);
        }
        .dashboard-error {
          color: #dc2626;
        }
        .empty-hint {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .avatar-image {
          object-fit: cover;
          background: none;
        }
        .quick-action-card {
          text-decoration: none;
        }
        .destination-card-mini,
        .tour-room-item,
        .trending-card,
        .wishlist-item {
          text-decoration: none;
          color: inherit;
        }
        .welcome-banner {
          background: linear-gradient(135deg, rgba(91,140,255,0.15), rgba(110,231,183,0.1));
          border: 1px solid rgba(91,140,255,0.2);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
          backdrop-filter: blur(10px);
        }

        @media (max-width: 1024px) {
          main.page-shell {
            margin-left: 80px !important;
            width: calc(100% - 80px) !important;
          }
        }

        .welcome-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }

        .avatar-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5b8cff, #6ee7b7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          box-shadow: 0 8px 24px rgba(91,140,255,0.3);
        }

        .welcome-text h1 {
          font-size: 2rem;
          margin: 0 0 8px 0;
          color: var(--text-h);
        }

        .welcome-text p {
          margin: 0;
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .welcome-stats {
          display: flex;
          gap: 40px;
        }

        .stat {
          text-align: center;
        }

        .stat strong {
          display: block;
          font-size: 2rem;
          color: var(--accent);
          margin-bottom: 4px;
        }

        .stat span {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .upcoming-trip-section {
          margin-bottom: 32px;
        }

        .upcoming-trip-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
        }

        .trip-image {
          min-height: 300px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .trip-badge {
          position: absolute;
          top: 20px;
          left: 20px;
          background: linear-gradient(90deg, #5b8cff, #6ee7b7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .trip-details {
          padding: 40px;
          background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,252,255,0.95));
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .trip-details h2 {
          font-size: 1.8rem;
          color: var(--text-h);
          margin: 0;
        }

        .trip-dates {
          color: var(--text-muted);
          font-size: 1.1rem;
          margin: 0;
        }

        .countdown {
          display: flex;
          gap: 20px;
          margin: 8px 0;
        }

        .countdown-item {
          text-align: center;
          flex: 1;
        }

        .countdown-value {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: var(--accent);
        }

        .countdown-label {
          color: var(--text-muted);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quick-actions-section {
          margin-bottom: 32px;
        }

        .quick-actions-section h2 {
          font-size: 1.5rem;
          margin-bottom: 20px;
          color: var(--text-h);
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .quick-action-card {
          padding: 24px;
          border-radius: 16px;
          border: none;
          color: #0f1724;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }

        .quick-action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.15);
        }

        .action-icon {
          font-size: 2rem;
        }

        .action-label {
          font-weight: 600;
          font-size: 0.95rem;
          text-align: center;
        }

        .dashboard-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .dashboard-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h3 {
          font-size: 1.3rem;
          color: var(--text-h);
          margin: 0;
        }

        .view-all {
          color: var(--accent);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .view-all:hover {
          text-decoration: underline;
        }

        .destinations-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .destination-card-mini {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          transition: transform 0.2s;
        }

        .destination-card-mini:hover {
          transform: translateY(-4px);
        }

        .dest-image {
          height: 140px;
          background-size: cover;
          background-position: center;
        }

        .dest-info {
          padding: 16px;
        }

        .dest-info h4 {
          margin: 0 0 4px 0;
          color: var(--text-h);
          font-size: 1rem;
        }

        .dest-info p {
          margin: 0 0 8px 0;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .dest-rating {
          font-size: 0.85rem;
          color: #f59e0b;
        }

        .tour-rooms-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tour-room-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: white;
          border-radius: 12px;
          border: 1px solid rgba(91,140,255,0.1);
          position: relative;
        }

        .room-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
        }

        .room-info h4 {
          margin: 0 0 4px 0;
          color: var(--text-h);
          font-size: 0.95rem;
        }

        .room-info p {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        .unread-badge {
          margin-left: auto;
          background: #ef4444;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 12px;
          border: 1px solid rgba(91,140,255,0.08);
        }

        .notification-link {
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s;
        }

        .notification-link:hover {
          background: #f0f7ff;
          box-shadow: 0 2px 8px rgba(91, 140, 255, 0.12);
        }

        .notif-icon {
          font-size: 1.2rem;
        }

        .notif-content p {
          margin: 0 0 4px 0;
          color: var(--text-h);
          font-size: 0.9rem;
        }

        .notif-time {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .trending-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .trending-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }

        .trending-image {
          height: 120px;
          background-size: cover;
          background-position: center;
        }

        .trending-info {
          padding: 12px;
        }

        .trending-info h4 {
          margin: 0 0 4px 0;
          color: var(--text-h);
          font-size: 0.95rem;
        }

        .trending-info p {
          margin: 0 0 8px 0;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        .trending-views {
          font-size: 0.75rem;
          color: var(--accent);
        }

        .stories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .story-card-mini {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }

        .story-image {
          height: 120px;
          background-size: cover;
          background-position: center;
        }

        .story-info {
          padding: 12px;
        }

        .story-author {
          margin: 0 0 4px 0;
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .story-info h4 {
          margin: 0 0 8px 0;
          color: var(--text-h);
          font-size: 0.95rem;
        }

        .story-likes {
          font-size: 0.8rem;
          color: #ef4444;
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .wishlist-item {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }

        .wishlist-image {
          height: 100px;
          background-size: cover;
          background-position: center;
        }

        .wishlist-info {
          padding: 10px;
        }

        .wishlist-info h4 {
          margin: 0 0 4px 0;
          color: var(--text-h);
          font-size: 0.85rem;
        }

        .wishlist-info p {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .ai-chat-bubble {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 1000;
        }

        .chat-toggle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5b8cff, #6ee7b7);
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(91,140,255,0.4);
          transition: transform 0.2s;
        }

        .chat-toggle:hover {
          transform: scale(1.1);
        }

        .chat-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .chat-header {
          background: linear-gradient(135deg, #5b8cff, #6ee7b7);
          padding: 20px;
          color: white;
        }

        .chat-header h4 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
        }

        .chat-header p {
          margin: 0;
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .chat-messages {
          padding: 20px;
          max-height: 300px;
          overflow-y: auto;
          background: #f8fafc;
        }

        .message {
          padding: 12px 16px;
          border-radius: 16px;
          margin-bottom: 12px;
          max-width: 85%;
        }

        .message.bot {
          background: linear-gradient(135deg, #e7f0ff, #f7f9ff);
          color: var(--text-h);
        }

        .message.user {
          background: linear-gradient(135deg, #5b8cff, #6ee7b7);
          color: white;
          margin-left: auto;
        }

        .message.typing p {
          animation: pulse 1.5s infinite;
        }

        .message p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .chat-input {
          display: flex;
          gap: 8px;
          padding: 16px;
          background: white;
          border-top: 1px solid rgba(0,0,0,0.1);
        }

        .chat-input input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .chat-input button {
          padding: 12px 20px;
          background: linear-gradient(135deg, #5b8cff, #6ee7b7);
          color: white;
          border: none;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .upcoming-trip-card {
            grid-template-columns: 1fr;
          }

          .dashboard-main-grid {
            grid-template-columns: 1fr;
          }

          .welcome-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .welcome-stats {
            width: 100%;
            justify-content: space-around;
          }

          .chat-window {
            width: 300px;
            right: -20px;
          }
        }

        /* Plan a Trip Modal Styles */
        .pt-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .pt-modal {
          background: white;
          border-radius: 20px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .pt-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 32px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .pt-eyebrow {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pt-modal-title {
          font-size: 1.8rem;
          margin: 0;
          color: var(--text-h);
        }

        .pt-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-muted);
          padding: 8px;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .pt-close:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .pt-steps {
          display: flex;
          justify-content: center;
          gap: 40px;
          padding: 24px 32px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .pt-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          opacity: 0.5;
          transition: opacity 0.3s;
        }

        .pt-step-active {
          opacity: 1;
        }

        .pt-step-done {
          opacity: 1;
        }

        .pt-step-num {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .pt-step-active .pt-step-num {
          background: linear-gradient(135deg, #5b8cff, #6ee7b7);
          color: white;
        }

        .pt-step-done .pt-step-num {
          background: #10b981;
          color: white;
        }

        .pt-step span {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .pt-step-active span {
          color: var(--text-h);
        }

        .pt-step-body {
          padding: 32px;
        }

        .pt-step-desc {
          font-size: 1.1rem;
          color: var(--text-h);
          margin: 0 0 24px 0;
          font-weight: 600;
        }

        .pt-dest-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .pt-dest-card {
          padding: 16px;
          border: 2px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .pt-dest-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .pt-dest-selected {
          border-color: var(--accent);
          background: rgba(16, 185, 129, 0.05);
        }

        .pt-dest-emoji {
          font-size: 1.5rem;
        }

        .pt-dest-card strong {
          font-size: 0.95rem;
          color: var(--text-h);
          text-align: center;
        }

        .pt-dest-card small {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .pt-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .pt-form-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }

        .pt-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pt-field label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-h);
        }

        .pt-field input,
        .pt-field textarea {
          padding: 12px 16px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: inherit;
        }

        .pt-field input:focus,
        .pt-field textarea:focus {
          outline: none;
          border-color: var(--accent);
        }

        .pt-counter {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 10px;
        }

        .pt-counter button {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 6px;
          cursor: pointer;
          font-size: 1.2rem;
          font-weight: 600;
          transition: background 0.2s;
        }

        .pt-counter button:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .pt-counter span {
          font-weight: 600;
          color: var(--text-h);
        }

        .pt-summary {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .pt-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .pt-summary-row:last-child {
          border-bottom: none;
        }

        .pt-summary-row span {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .pt-summary-row strong {
          color: var(--text-h);
          font-weight: 600;
        }

        .pt-error {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }

        .pt-btn-row {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .pt-back-btn,
        .pt-next-btn,
        .pt-create-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pt-back-btn {
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-h);
        }

        .pt-back-btn:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .pt-next-btn,
        .pt-create-btn {
          background: linear-gradient(135deg, #5b8cff, #6ee7b7);
          color: white;
        }

        .pt-next-btn:hover,
        .pt-create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(91, 140, 255, 0.3);
        }

        .pt-next-btn:disabled,
        .pt-create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </main>
  )
}
