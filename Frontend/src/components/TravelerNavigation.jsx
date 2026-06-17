import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { getNotifications } from '../apiClient'
import TravelerSidebar from './TravelerSidebar'

export default function TravelerNavigation() {
  const userId = localStorage.getItem('userId')
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  return (
    <>
      {/* Top Navbar Header */}
      <header className="site-header traveler-navbar">
        <div className="brand">
          <Link to="/" className="brand-link">
            TripoBD <span className="traveler-role-tag">Traveler</span>
          </Link>
        </div>
        <div className="header-actions traveler-top-actions">
          <NavLink
            to="/traveler/profile"
            className={({ isActive }) =>
              isActive ? 'top-action-link top-active' : 'top-action-link'
            }
          >
            👤 Profile
          </NavLink>
          <NavLink
            to="/traveler/notifications"
            className={({ isActive }) =>
              isActive ? 'top-action-link top-active' : 'top-action-link'
            }
          >
            🔔 Alerts
            {unreadCount > 0 && (
              <span className="navbar-unread-badge">{unreadCount}</span>
            )}
          </NavLink>
          <button className="button button-tertiary traveler-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {/* Left Sidebar Navigation */}
      <TravelerSidebar />

      <style>{`
        /* Top Navbar styling */
        .traveler-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: #1e293b !important;
          border-bottom: 1px solid #334155;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 1.5rem;
          z-index: 1000;
        }
        .traveler-navbar .brand-link {
          color: white !important;
          font-weight: 900;
          font-size: 1.4rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .traveler-role-tag {
          font-size: 0.7rem;
          font-weight: 800;
          background: #3b82f6;
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .traveler-top-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .top-action-link {
          color: #cbd5e1 !important;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.15s;
          padding: 0.35rem 0.65rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .top-action-link:hover {
          color: white !important;
          background: #334155;
        }
        .top-active {
          color: white !important;
          background: #3b82f6 !important;
        }
        .traveler-logout-btn {
          color: #cbd5e1 !important;
          font-size: 0.85rem;
          font-weight: 700;
          background: transparent;
          border: 1px solid #334155;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .traveler-logout-btn:hover {
          background: #3b82f6;
          color: white !important;
          border-color: #3b82f6;
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
    </>
  )
}

function handleLogout() {
  fetch('http://localhost:8000/api/auth/logout/', { method: 'POST', credentials: 'include' })
    .then(() => {
      localStorage.removeItem('userId')
      localStorage.removeItem('userType')
      localStorage.removeItem('username')
      localStorage.removeItem('isAdmin')
      window.location.href = '/'
    })
    .catch(() => {
      localStorage.removeItem('userId')
      localStorage.removeItem('userType')
      localStorage.removeItem('username')
      localStorage.removeItem('isAdmin')
      window.location.href = '/'
    })
}
