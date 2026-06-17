import { Link, NavLink } from 'react-router-dom'

export default function AdminNavigation() {
  const sidebarLinks = [
    { label: '📊 Dashboard', to: '/admin/dashboard' },
    { label: '👥 Users', to: '/admin/users' },
    { label: '🏅 Guides Application', to: '/admin/guides' },
    { label: '📍 Destinations', to: '/admin/destinations' },
    { label: '🛡️ Moderation', to: '/admin/moderation' },
    { label: '👥 Group Monitor', to: '/admin/groups' },
    { label: '💬 Support & Complaints', to: '/admin/support' },
    { label: '📢 Announcements', to: '/admin/notifications' },
    { label: '📈 Reports', to: '/admin/reports' },
    { label: '📁 Logs', to: '/admin/logs' },
  ]

  const handleLogout = () => {
    fetch('http://localhost:8000/api/auth/logout/', { method: 'POST' })
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
      <header className="site-header admin-navbar">
        <div className="brand">
          <Link to="/admin/dashboard" className="brand-link">
            TripoBD <span className="admin-role-tag">Admin Panel</span>
          </Link>
        </div>
        <div className="header-actions admin-top-actions">
          <NavLink
            to="/admin/config"
            className={({ isActive }) =>
              isActive ? 'top-action-link top-active' : 'top-action-link'
            }
          >
            ⚙️ Config
          </NavLink>
          <NavLink
            to="/admin/profile"
            className={({ isActive }) =>
              isActive ? 'top-action-link top-active' : 'top-action-link'
            }
          >
            👤 Profile
          </NavLink>
          <button className="button button-tertiary admin-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {/* Left Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-nav-title">Operations Control</div>
        <nav className="sidebar-nav-list">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'sidebar-nav-link sidebar-active' : 'sidebar-nav-link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <style>{`
        .admin-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: rgba(30, 41, 59, 0.85) !important;
          border-bottom: 1px solid rgba(239, 68, 68, 0.2);
          backdrop-filter: blur(10px) saturate(1.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 40px;
          z-index: 1000;
        }
        .admin-navbar .brand-link {
          color: white !important;
          font-weight: 900;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .admin-role-tag {
          font-size: 0.7rem;
          font-weight: 800;
          background: #ef4444;
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .admin-top-actions {
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
        }
        .top-action-link:hover {
          color: white !important;
          background: #334155;
        }
        .top-active {
          color: white !important;
          background: #ef4444 !important;
        }
        .admin-logout-btn {
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
        .admin-logout-btn:hover {
          background: #ef4444;
          color: white !important;
          border-color: #ef4444;
        }

        /* Left Sidebar styling */
        .admin-sidebar {
          position: fixed;
          top: 60px;
          left: 0;
          bottom: 0;
          width: 240px;
          background: #0f172a;
          border-right: 1px solid #1e293b;
          z-index: 990;
          overflow-y: auto;
          padding: 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .sidebar-nav-title {
          font-size: 0.75rem;
          font-weight: 850;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0 1.25rem;
          margin-bottom: 0.25rem;
        }
        .sidebar-nav-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0 0.75rem;
        }
        .sidebar-nav-link {
          color: #94a3b8 !important;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          transition: background 0.2s, color 0.2s;
        }
        .sidebar-nav-link:hover {
          color: white !important;
          background: #1e293b;
        }
        .sidebar-active {
          color: white !important;
          background: #ef4444 !important;
        }

        /* Shift all admin page main elements to make space for top navbar & sidebar */
        main.admin-dashboard,
        main.admin-users,
        main.admin-guides,
        main.admin-destinations,
        main.admin-moderation,
        main.admin-groups,
        main.admin-support,
        main.admin-notifications,
        main.admin-reports,
        main.admin-config,
        main.admin-logs,
        main.admin-profile {
          margin-top: 60px !important;
          margin-left: 240px !important;
          width: calc(100% - 240px) !important;
          max-width: none !important;
          padding: 2rem !important;
          min-height: calc(100vh - 60px);
          box-sizing: border-box;
        }

        /* Adjust responsive layouts for smaller screens */
        @media (max-width: 900px) {
          .admin-sidebar {
            width: 70px;
          }
          .sidebar-nav-title {
            display: none;
          }
          .sidebar-nav-link {
            justify-content: center;
            padding: 0.75rem;
            font-size: 1.1rem;
          }
          /* Hide labels in icons */
          .sidebar-nav-link {
            font-size: 1.2rem;
            width: 44px;
            height: 44px;
            padding: 0;
            justify-content: center;
            margin: 0 auto;
          }
          main.admin-dashboard,
          main.admin-users,
          main.admin-guides,
          main.admin-destinations,
          main.admin-moderation,
          main.admin-groups,
          main.admin-support,
          main.admin-notifications,
          main.admin-reports,
          main.admin-config,
          main.admin-logs,
          main.admin-profile {
            margin-left: 70px !important;
            width: calc(100% - 70px) !important;
          }
        }

        /* Hide footer on all admin pages to maximize screen space */
        body:has(.admin-sidebar) footer,
        body:has(.admin-navbar) footer {
          display: none !important;
        }
      `}</style>
    </>
  )
}
