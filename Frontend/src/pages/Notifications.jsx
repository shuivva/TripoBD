import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function Notifications() {
  const [searchParams] = useSearchParams()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  
  const userId = searchParams.get('user_id')

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/notifications/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) setNotifications(data)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}/read/`, {
        method: 'POST'
      })
      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ))
      }
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/mark-all-read/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications.filter(n => !n.is_read)
      : notifications.filter(n => n.category === filter)

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <>
      <main className="notifications-page">
        <div className="notifications-container">
          <header className="notifications-header">
            <div>
              <h1>Notifications</h1>
              <p>You have {unreadCount} unread notifications</p>
            </div>
            {unreadCount > 0 && (
              <button className="btn-secondary" onClick={handleMarkAllAsRead}>
                Mark All as Read
              </button>
            )}
          </header>

          <div className="notifications-filters">
            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              All
            </button>
            <button className={`filter-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
              Unread
            </button>
            <button className={`filter-btn ${filter === 'booking' ? 'active' : ''}`} onClick={() => setFilter('booking')}>
              Bookings
            </button>
            <button className={`filter-btn ${filter === 'group' ? 'active' : ''}`} onClick={() => setFilter('group')}>
              Groups
            </button>
            <button className={`filter-btn ${filter === 'review' ? 'active' : ''}`} onClick={() => setFilter('review')}>
              Reviews
            </button>
            <button className={`filter-btn ${filter === 'system' ? 'active' : ''}`} onClick={() => setFilter('system')}>
              System
            </button>
          </div>

          <div className="notifications-list">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {notification.category === 'booking' && '📅'}
                    {notification.category === 'group' && '👥'}
                    {notification.category === 'review' && '⭐'}
                    {notification.category === 'system' && '🔔'}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.created_at).toLocaleString()}</small>
                  </div>
                  {!notification.is_read && <div className="unread-dot"></div>}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <h2>No Notifications</h2>
                <p>You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .notifications-page{min-height:100vh;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%);padding:2.5rem;font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
        .notifications-container{max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:2.5rem}
        .notifications-header{display:flex;justify-content:space-between;align-items:center;padding:2rem 2.5rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.5rem;box-shadow:0 8px 32px rgba(0,0,0,0.08);border:2px solid rgba(243,244,246,0.8)}
        .notifications-header h1{margin:0 0 0.35rem 0;font-size:2rem;font-weight:800;color:#111827;letter-spacing:-0.02em}
        .notifications-header p{margin:0;color:#6b7280;font-size:0.95rem;font-weight:600}
        .notifications-filters{display:flex;gap:0.75rem;flex-wrap:wrap;padding:1rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 16px rgba(0,0,0,0.06)}
        .filter-btn{padding:0.6rem 1.5rem;background:transparent;border:2px solid #e5e7eb;border-radius:999px;cursor:pointer;font-size:0.9rem;color:#6b7280;font-weight:600;transition:all .3s}
        .filter-btn:hover{background:#f3f4f6;border-color:#d1d5db}
        .filter-btn.active{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border-color:#3b82f6;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
        .notifications-list{display:flex;flex-direction:column;gap:1rem}
        .notification-item{display:flex;gap:1.25rem;padding:1.5rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border:2px solid rgba(243,244,246,0.8);border-radius:1.25rem;cursor:pointer;transition:all .3s;box-shadow:0 4px 16px rgba(0,0,0,0.06)}
        .notification-item:hover{transform:translateX(4px);box-shadow:0 8px 32px rgba(0,0,0,0.1)}
        .notification-item.unread{background:linear-gradient(135deg,#eff6ff,#dbeafe);border-color:rgba(59,130,246,0.4);box-shadow:0 4px 16px rgba(59,130,246,0.15)}
        .notification-icon{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.08)}
        .notification-content{flex:1}
        .notification-content h4{margin:0 0 0.5rem 0;font-size:1.1rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .notification-content p{margin:0 0 0.75rem 0;font-size:0.95rem;color:#6b7280;line-height:1.6;font-weight:500}
        .notification-content small{font-size:0.85rem;color:#9ca3af;font-weight:600}
        .unread-dot{width:12px;height:12px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:50%;flex-shrink:0;box-shadow:0 2px 8px rgba(59,130,246,0.4)}
        .btn-secondary{padding:0.85rem 1.75rem;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);color:#374151;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.95rem;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
        .btn-secondary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        .empty-state{text-align:center;padding:5rem 2rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.5rem;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 20px rgba(0,0,0,0.06)}
        .empty-icon{font-size:5rem;margin-bottom:1.5rem}
        .empty-state h2{font-size:1.75rem;font-weight:800;color:#111827;margin:0 0 1rem}
        .empty-state p{color:#6b7280;font-size:1.1rem}
        .loading{text-align:center;padding:6rem;font-size:1.5rem;color:#6b7280;font-weight:600}

        @media (max-width: 768px) {
          .notifications-page{padding:1.5rem}
          .notifications-header{flex-direction:column;gap:1rem;text-align:center;padding:1.5rem}
          .notifications-header h1{font-size:1.5rem}
          .notifications-filters{justify-content:center}
          .filter-btn{padding:0.5rem 1.25rem;font-size:0.85rem}
          .notification-item{padding:1.25rem}
          .notification-icon{width:44px;height:44px;font-size:1.25rem}
        }
      `}</style>
    </>
  )
}