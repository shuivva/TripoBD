import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTravelerDashboard } from '../apiClient'

const quickActions = [
  { icon: '🧭', label: 'Explore Destinations', color: 'from-blue-500 to-cyan-400', to: '/discover' },
  { icon: '📅', label: 'Plan a Trip', color: 'from-purple-500 to-pink-400', to: '/discover' },
  { icon: '👥', label: 'Join a Group', color: 'from-green-500 to-emerald-400', to: '/traveler/community?tab=browse' },
  { icon: '🤖', label: 'Chat with AI', color: 'from-orange-500 to-amber-400', to: null },
  { icon: '👨‍🏫', label: 'Book a Guide', color: 'from-indigo-500 to-violet-400', to: '/discover' },
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

  const openAiChat = () => setShowChat(true)

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
            if (action.label === 'Chat with AI') {
              return (
                <button key={action.label} type="button" className={className} onClick={openAiChat}>
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
              <Link to="/traveler/community" className="view-all">View All</Link>
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
              <p>Ask me anything about your trips!</p>
            </div>
            <div className="chat-messages">
              <div className="message bot">
                <p>{ai_assistant?.greeting}</p>
              </div>
            </div>
            <div className="chat-input">
              <input type="text" placeholder="Type your message..." />
              <button type="button">Send</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
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

        .message p {
          margin: 0;
          font-size: 0.9rem;
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
      `}</style>
    </main>
  )
}
