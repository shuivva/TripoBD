import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { getNotifications } from '../apiClient'

export default function TravelerNavigation() {
  const userId = localStorage.getItem('userId')
  const [unreadCount, setUnreadCount] = useState(0)

  // Load unread notifications count
  useEffect(() => {
    if (!userId) return
    const fetchUnread = async () => {
      try {
        const notifs = await getNotifications(userId)
        const unread = notifs.filter(n => !n.is_read).length
        setUnreadCount(unread)
      } catch {
        // ignore
      }
    }
    fetchUnread()
    // Poll every 15 seconds to keep navigation badge updated
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [userId])

  const navLinks = [
    { label: 'Dashboard', to: '/traveler/dashboard' },
    { label: 'Profile', to: '/traveler/profile' },
    { label: 'Room', to: '/traveler/room' },
    { label: 'Community', to: '/traveler/community' },
    { label: '🤖 AI Chat', to: '/traveler/ai' },
    { label: '🤠 Bookings', to: '/traveler/bookings' },
    { label: '✍️ Reviews & Stories', to: '/traveler/reviews-stories' },
  ]

  return (
    <header className="site-header traveler-navbar">
      <div className="brand">
        <Link to="/traveler/dashboard" className="brand-link">
          TripoBD
        </Link>
      </div>
      <nav className="main-nav">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'nav-link nav-active' : 'nav-link'
            }
          >
            {link.label}
          </NavLink>
        ))}
        <NavLink
          to="/traveler/notifications"
          className={({ isActive }) =>
            isActive ? 'nav-link nav-active notif-nav-link' : 'nav-link notif-nav-link'
          }
        >
          🔔 Alerts
          {unreadCount > 0 && (
            <span className="navbar-unread-badge">{unreadCount}</span>
          )}
        </NavLink>
      </nav>
      <div className="header-actions">
        <button className="button button-tertiary" onClick={handleLogout}>Log out</button>
      </div>

      <style>{`
        .traveler-navbar {
          background: #0f172a !important;
          border-bottom: 1px solid #1e293b;
        }
        .traveler-navbar .brand-link {
          color: white !important;
          font-weight: 900;
          font-size: 1.4rem;
        }
        .traveler-navbar .nav-link {
          color: #94a3b8 !important;
          font-size: 0.88rem;
          font-weight: 700;
          transition: color 0.15s;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .traveler-navbar .nav-link:hover {
          color: #f1f5f9 !important;
        }
        .traveler-navbar .nav-active {
          color: #38bdf8 !important;
          border-bottom: 2.5px solid #38bdf8;
          padding-bottom: 0.2rem;
        }
        .notif-nav-link {
          position: relative;
        }
        .navbar-unread-badge {
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.1rem 0.4rem;
          border-radius: 99px;
          display: inline-block;
          margin-left: 0.2rem;
          line-height: 1.1;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
        }
      `}</style>
    </header>
  )
}

function handleLogout() {
  fetch('http://localhost:8000/api/auth/logout/', { method: 'POST', credentials: 'include' })
    .then(() => {
      window.location.href = '/'
    })
    .catch(() => {
      window.location.href = '/'
    })
}
