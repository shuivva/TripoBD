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
            TripoBD
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
          top: 14px !important;
          left: 24px !important;
          right: 24px !important;
          width: auto !important;
          height: 70px !important;
          background: rgba(255, 255, 255, 0.72) !important;
          backdrop-filter: blur(16px) saturate(1.2) !important;
          -webkit-backdrop-filter: blur(16px) saturate(1.2) !important;
          border: 1px solid rgba(0, 0, 0, 0.06) !important;
          border-radius: 20px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03) !important;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2rem !important;
          z-index: 1000;
        }
        .traveler-navbar .brand-link {
          color: #0f172a !important;
          font-weight: 800;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .traveler-top-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .top-action-link {
          color: #475569 !important;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          padding: 0.5rem 0.75rem;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .top-action-link:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #0f172a !important;
        }
        .top-active {
          background: rgba(0, 0, 0, 0.04) !important;
          color: #0f172a !important;
        }
        .traveler-logout-btn {
          color: #475569 !important;
          font-size: 0.85rem;
          font-weight: 700;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          padding: 0.5rem 1.25rem !important;
          border-radius: 999px !important;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02) !important;
        }
        .traveler-logout-btn:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
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

        /* Dark mode support */
        [data-theme="dark"] .traveler-navbar {
          background: rgba(30, 41, 59, 0.75) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
        }
        [data-theme="dark"] .traveler-navbar .brand-link {
          color: #ffffff !important;
        }
        [data-theme="dark"] .top-action-link {
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .top-action-link:hover,
        [data-theme="dark"] .top-active {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }
        [data-theme="dark"] .traveler-logout-btn {
          background: #1e293b !important;
          border-color: #334155 !important;
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .traveler-logout-btn:hover {
          background: #334155 !important;
          color: #ffffff !important;
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
