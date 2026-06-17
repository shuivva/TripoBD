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

  const sidebarLinks = [
    { emoji: '📊', label: 'Dashboard', to: '/traveler/dashboard' },
    { emoji: '🚪', label: 'Room Planner', to: '/traveler/room' },
    { emoji: '💬', label: 'Community Feed', to: '/traveler/community' },
    { emoji: '🤖', label: 'AI Travel Assistant', to: '/traveler/ai' },
    { emoji: '🤠', label: 'Local Bookings', to: '/traveler/bookings' },
    { emoji: '✍️', label: 'Reviews & Stories', to: '/traveler/reviews-stories' },
    { emoji: '🛟', label: 'Help & Support', to: '/traveler/support' },
  ]

  const handleLogout = () => {
    fetch('http://localhost:8000/api/auth/logout/', { method: 'POST', credentials: 'include' })
      .then(() => {
        localStorage.removeItem('userId')
        window.location.href = '/'
      })
      .catch(() => {
        localStorage.removeItem('userId')
        window.location.href = '/'
      })
  }

  return (
    <>
      {/* Top Navbar Header */}
      <header className="site-header traveler-navbar">
        <div className="brand">
          <Link to="/traveler/dashboard" className="brand-link">
            TripoBD
          </Link>
        </div>
        <div className="header-actions">
          <NavLink
            to="/traveler/profile"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-active' : 'nav-link'
            }
          >
            👤 Profile
          </NavLink>
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
          <button className="button button-tertiary" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      {/* Left Sidebar Navigation */}
      <aside className="traveler-sidebar">
        <div className="sidebar-brand-sub">Traveler Menu</div>
        <nav className="sidebar-nav-list">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'sidebar-nav-link sidebar-active' : 'sidebar-nav-link'
              }
            >
              <span className="sidebar-emoji">{link.emoji}</span>
              <span className="sidebar-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <style>{`
        /* Traveler Sidebar Layout */
        .traveler-sidebar {
          position: fixed;
          top: 110px; /* Start below the top sticky navbar */
          left: 14px;
          bottom: 14px;
          width: 230px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.65));
          border: 1px solid rgba(91, 140, 255, 0.15);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(18, 49, 108, 0.05);
          backdrop-filter: blur(10px) saturate(1.06);
          z-index: 100;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-sizing: border-box;
        }

        .sidebar-brand-sub {
          font-size: 0.72rem;
          font-weight: 850;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0 0.5rem;
          margin-bottom: 0.25rem;
        }

        .sidebar-nav-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .sidebar-nav-link {
          color: #475569 !important;
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          transition: background 180ms ease, color 180ms ease, transform 180ms ease;
        }

        .sidebar-nav-link:hover {
          background: rgba(91, 140, 255, 0.08);
          color: var(--accent) !important;
          transform: translateX(4px);
        }

        .sidebar-active {
          background: linear-gradient(90deg, var(--accent), var(--accent-2)) !important;
          color: white !important;
          box-shadow: 0 8px 20px rgba(91, 140, 255, 0.15);
        }

        .sidebar-emoji {
          font-size: 1.1rem;
        }

        /* Shifting Traveler Pages */
        main.page-shell {
          margin-left: 260px !important;
          width: calc(100% - 260px) !important;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }

        .traveler-navbar {
          position: sticky;
          top: 14px;
          transition: all 0.3s ease;
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

        .notif-nav-link {
          position: relative;
        }

        /* Hide footer on all traveler pages to maximize workspace */
        body:has(.traveler-sidebar) footer {
          display: none !important;
        }

        /* Adjust responsive layouts for smaller screens */
        @media (max-width: 900px) {
          .traveler-sidebar {
            width: 70px;
            padding: 1.5rem 0.5rem;
            align-items: center;
          }
          .sidebar-brand-sub {
            display: none;
          }
          .sidebar-nav-link {
            justify-content: center;
            padding: 0.65rem 0;
            width: 44px;
            height: 44px;
            border-radius: 50%;
          }
          .sidebar-label {
            display: none;
          }
          main.page-shell {
            margin-left: 100px !important;
            width: calc(100% - 100px) !important;
          }
        }
      `}</style>
    </>
  )
}
