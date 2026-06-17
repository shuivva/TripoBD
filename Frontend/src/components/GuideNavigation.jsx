import { Link, NavLink } from 'react-router-dom'

export default function GuideNavigation() {
  const navLinks = [
    { label: '📊 Dashboard', to: '/guide/dashboard' },
    { label: '👤 Edit Profile', to: '/guide/profile' },
    { label: '📅 Bookings Inbox', to: '/guide/bookings' },
    { label: '💰 Earnings & Payments', to: '/guide/earnings' },
    { label: '⚙️ Settings & Support', to: '/guide/settings' },
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
    <header className="site-header guide-navbar">
      <div className="brand">
        <Link to="/guide/dashboard" className="brand-link">
          TripoBD <span className="role-tag">Guide Portal</span>
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
      </nav>
      <div className="header-actions">
        <button className="guide-logout-btn" onClick={handleLogout}>Log out</button>
      </div>

      <style>{`
        .guide-navbar {
          background: rgba(15, 23, 42, 0.85) !important;
          border: 1px solid rgba(168, 85, 247, 0.2) !important;
          backdrop-filter: blur(10px) saturate(1.06);
        }
        .guide-navbar .brand-link {
          color: white !important;
          font-weight: 900;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .role-tag {
          font-size: 0.7rem;
          font-weight: 800;
          background: #a855f7;
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .guide-navbar .nav-link {
          color: #94a3b8 !important;
          font-size: 0.88rem;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 10px;
          transition: all 180ms ease;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .guide-navbar .nav-link:hover {
          background: rgba(168, 85, 247, 0.1) !important;
          color: #c084fc !important;
          transform: translateY(-2px);
        }
        .guide-navbar .nav-active {
          background: linear-gradient(90deg, #a855f7, #c084fc) !important;
          color: white !important;
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.18);
        }
        .guide-logout-btn {
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
        .guide-logout-btn:hover {
          background: #ef4444;
          color: white !important;
          border-color: #ef4444;
        }
      `}</style>
    </header>
  )
}
