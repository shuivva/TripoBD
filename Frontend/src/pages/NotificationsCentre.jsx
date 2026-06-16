import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getNotifications,
  markNotificationRead,
  deleteNotification,
  markAllNotificationsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../apiClient'

export default function NotificationsCentre() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')

  // States
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('') // '' for all, or booking, invite, review, update
  const [searchQuery, setSearchQuery] = useState('')

  // Preferences states
  const [prefs, setPrefs] = useState(null)
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Alerts
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load notification feed
  const loadNotificationsFeed = async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (activeFilter) params.category = activeFilter
      if (searchQuery.trim()) params.search = searchQuery
      
      const feed = await getNotifications(userId, params)
      setNotifications(feed)
    } catch {
      setError('Failed to load notifications feed.')
    } finally {
      setLoading(false)
    }
  }

  // Load preferences
  const loadPrefs = async () => {
    if (!userId) return
    try {
      const preferences = await getNotificationPreferences(userId)
      setPrefs(preferences)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadNotificationsFeed()
  }, [activeFilter, searchQuery, userId])

  useEffect(() => {
    loadPrefs()
  }, [userId])

  // Mark single as read
  const handleMarkRead = async (notifId, e) => {
    if (e) e.stopPropagation()
    try {
      await markNotificationRead(notifId)
      // Update local state to show read
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n))
    } catch {
      // ignore
    }
  }

  // Delete notification
  const handleDeleteNotif = async (notifId, e) => {
    if (e) e.stopPropagation()
    try {
      await deleteNotification(notifId)
      setNotifications(prev => prev.filter(n => n.id !== notifId))
    } catch {
      setError('Failed to delete notification.')
    }
  }

  // Mark all read
  const handleMarkAllRead = async () => {
    if (!userId) return
    try {
      await markAllNotificationsRead(userId)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setSuccess('All notifications marked as read.')
      setTimeout(() => setSuccess(''), 2500)
    } catch {
      setError('Failed to mark all read.')
    }
  }

  // Toggle channel preference checkbox
  const handleTogglePref = async (field, value) => {
    if (!userId || !prefs) return
    const updated = { ...prefs, [field]: value }
    setPrefs(updated)
    setSavingPrefs(true)
    try {
      await updateNotificationPreferences(userId, { [field]: value })
    } catch {
      setError('Failed to update channel preference.')
    } finally {
      setSavingPrefs(false)
    }
  }

  // Navigate notification link
  const handleNotificationClick = (notif) => {
    handleMarkRead(notif.id)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  if (!userId) {
    return (
      <main className="page-shell text-center">
        <p className="community-error">Please sign in to access the Notification Centre.</p>
        <button className="button button-primary" onClick={() => navigate('/signin')}>Sign In</button>
      </main>
    )
  }

  return (
    <main className="page-shell notif-page-shell">
      {error && <div className="profile-alert error">{error}</div>}
      {success && <div className="profile-alert success">{success}</div>}

      <header className="notif-page-header">
        <h1>Notifications Centre</h1>
        <p>Keep track of invitations, booking confirmations, replies to stories, and system reminders.</p>
      </header>

      <div className="notif-layout-grid">
        {/* Left Column: Feed */}
        <section className="notif-feed-card">
          <div className="feed-header-row">
            <div className="search-wrap">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notification alerts..."
              />
            </div>
            {notifications.some(n => !n.is_read) && (
              <button className="button button-tertiary mark-all-read-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="notif-filters-pills">
            {[
              { id: '', label: 'All Alerts' },
              { id: 'booking', label: '📅 Bookings' },
              { id: 'invite', label: '✉️ Invites' },
              { id: 'review', label: '⭐ Reviews' },
              { id: 'update', label: '🔔 System' },
            ].map(filter => (
              <button
                key={filter.id}
                className={`filter-pill-btn ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="notif-list-feed">
            {loading ? (
              <p className="loading-text">Fetching notifications...</p>
            ) : notifications.length === 0 ? (
              <div className="empty-notif-state">
                <span>🔔</span>
                <h4>No Notifications Alerting</h4>
                <p>Everything is quiet! Future travel coordination messages and reminders will display here.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-card-row ${n.is_read ? 'read' : 'unread'} ${n.link ? 'clickable' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notif-status-dot-column">
                    {!n.is_read && <span className="unread-dot" />}
                  </div>
                  <div className="notif-icon-circle">
                    {n.icon || '🔔'}
                  </div>
                  <div className="notif-body-content">
                    <p>{n.message}</p>
                    <small>{n.time}</small>
                  </div>
                  <div className="notif-actions-column">
                    {!n.is_read && (
                      <button className="mark-read-icon-btn" onClick={(e) => handleMarkRead(n.id, e)} title="Mark as read">
                        ✓
                      </button>
                    )}
                    <button className="delete-notif-icon-btn" onClick={(e) => handleDeleteNotif(n.id, e)} title="Delete alert">
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Preferences Sidebar */}
        <aside className="notif-settings-sidebar">
          <div className="preferences-card">
            <h3>⚙️ Delivery Channels</h3>
            <p className="sidebar-subtext">Toggle how notifications are sent to your phone or mailbox for each notification channel.</p>
            
            {prefs ? (
              <div className="channels-grid-list">
                {[
                  { label: '👥 Group Invites & Chat', prefix: 'group' },
                  { label: '📅 Guide & Rental Bookings', prefix: 'booking' },
                  { label: '⭐ Traveler Reviews & Feed', prefix: 'review' },
                  { label: '🗣️ Community Connections', prefix: 'community' },
                  { label: '🔔 System & Security Toggles', prefix: 'system' },
                ].map(group => (
                  <div key={group.prefix} className="preference-group-block">
                    <h4>{group.label}</h4>
                    <div className="checkboxes-row">
                      <label className="checkbox-row-lbl">
                        <input
                          type="checkbox"
                          checked={prefs[`email_${group.prefix}`] || false}
                          onChange={e => handleTogglePref(`email_${group.prefix}`, e.target.checked)}
                        />
                        <span>Email</span>
                      </label>
                      <label className="checkbox-row-lbl">
                        <input
                          type="checkbox"
                          checked={prefs[`push_${group.prefix}`] || false}
                          onChange={e => handleTogglePref(`push_${group.prefix}`, e.target.checked)}
                        />
                        <span>Push</span>
                      </label>
                      <label className="checkbox-row-lbl">
                        <input
                          type="checkbox"
                          checked={prefs[`sms_${group.prefix}`] || false}
                          onChange={e => handleTogglePref(`sms_${group.prefix}`, e.target.checked)}
                        />
                        <span>SMS</span>
                      </label>
                    </div>
                  </div>
                ))}
                {savingPrefs && <span className="saving-indicator-label">Saving delivery settings...</span>}
              </div>
            ) : (
              <p className="loading-text">Loading preferences details...</p>
            )}
          </div>
        </aside>
      </div>

      <style>{`
        .notif-page-shell {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .notif-page-header h1 {
          margin: 0 0 0.35rem 0;
          font-size: 2.2rem;
          font-weight: 850;
          color: #0f172a;
        }
        .notif-page-header p {
          margin: 0;
          font-size: 1.05rem;
          color: #64748b;
          max-width: 800px;
        }

        .notif-layout-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .notif-layout-grid { grid-template-columns: 1fr; }
        }

        .notif-feed-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .feed-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .search-wrap { flex: 1; min-width: 200px; }
        .search-wrap input {
          width: 100%;
          padding: 0.65rem 1rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.9rem;
          outline: none;
        }
        .search-wrap input:focus { border-color: #4f46e5; }
        .mark-all-read-btn { padding: 0.5rem 0.85rem; font-size: 0.82rem; }

        .notif-filters-pills {
          display: flex;
          gap: 0.4rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
        }
        .filter-pill-btn {
          background: #f1f5f9;
          border: none;
          padding: 0.45rem 1rem;
          border-radius: 99px;
          font-size: 0.82rem;
          font-weight: 750;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .filter-pill-btn:hover { background: #e2e8f0; color: #1e293b; }
        .filter-pill-btn.active {
          background: #312e81;
          color: white;
        }

        .notif-list-feed {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .notif-card-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 14px;
          border: 1.5px solid #f1f5f9;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.01);
          transition: all 0.2s;
        }
        .notif-card-row.unread {
          background: #faf5ff;
          border-color: #f3e8ff;
        }
        .notif-card-row.clickable { cursor: pointer; }
        .notif-card-row.clickable:hover {
          transform: translateY(-2px);
          border-color: #c7d2fe;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.05);
        }

        .notif-status-dot-column {
          width: 8px;
          display: flex;
          justify-content: center;
        }
        .unread-dot {
          width: 8px;
          height: 8px;
          background: #a855f7;
          border-radius: 50%;
        }
        .notif-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        .notif-card-row.unread .notif-icon-circle {
          background: #ebd5ff;
        }
        .notif-body-content { flex: 1; }
        .notif-body-content p { margin: 0 0 0.2rem 0; font-size: 0.88rem; color: #1e293b; line-height: 1.4; }
        .notif-body-content small { font-size: 0.75rem; color: #94a3b8; }

        .notif-actions-column { display: flex; gap: 0.35rem; }
        .mark-read-icon-btn, .delete-notif-icon-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: transparent;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          transition: all 0.15s;
        }
        .mark-read-icon-btn:hover { background: #e0f2fe; color: #0284c7; }
        .delete-notif-icon-btn:hover { background: #fee2e2; color: #ef4444; }

        .empty-notif-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #64748b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .empty-notif-state span { font-size: 3rem; }
        .empty-notif-state h4 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #334155; }
        .empty-notif-state p { margin: 0; font-size: 0.88rem; max-width: 320px; }

        /* Preferences card */
        .preferences-card {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .preferences-card h3 { margin: 0; font-size: 1.1rem; font-weight: 850; color: #0f172a; }
        .sidebar-subtext { margin: 0; font-size: 0.82rem; color: #64748b; line-height: 1.4; }
        
        .channels-grid-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .preference-group-block {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.85rem;
        }
        .preference-group-block:last-child { border-bottom: none; padding-bottom: 0; }
        .preference-group-block h4 { margin: 0 0 0.5rem; font-size: 0.85rem; font-weight: 800; color: #1e293b; }
        
        .checkboxes-row { display: flex; justify-content: space-between; }
        .checkbox-row-lbl {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
        }
        .checkbox-row-lbl input { cursor: pointer; }
        .saving-indicator-label { font-size: 0.72rem; color: #059669; font-weight: 750; text-align: center; }
      `}</style>
    </main>
  )
}
