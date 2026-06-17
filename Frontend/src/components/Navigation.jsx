import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Featured', to: '/featured-destinations' },
  { label: 'Discover', to: '/discover' },
  { label: 'Routes', to: '/routes' },
  { label: 'FAQ', to: '/faq' },
  { label: 'About', to: '/about' },
]

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [registerDropdownOpen, setRegisterDropdownOpen] = useState(false)

  const userId = localStorage.getItem('userId')
  const userType = localStorage.getItem('userType') || 'traveler'
  const isAdmin = localStorage.getItem('isAdmin') === 'true'

  let profilePath = '/traveler/profile'
  if (isAdmin) {
    profilePath = '/admin/profile'
  } else if (userType === 'service_provider') {
    profilePath = '/guide/profile'
  }

  const handleLogout = () => {
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

  return (
    <header className="site-header home-navbar">
      <div className="brand">
        <Link to="/" className="brand-link">
          TripoBD
        </Link>
      </div>
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {mobileMenuOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>
      <nav className={`main-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'nav-link nav-active' : 'nav-link'
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="header-actions home-header-actions">
        {userId ? (
          <>
            <Link to={profilePath} className="top-action-link">
              👤 Profile
            </Link>
            <button className="home-logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <div className="register-dropdown">
              <button
                className="button button-outline register-toggle"
                onClick={() => setRegisterDropdownOpen(!registerDropdownOpen)}
              >
                Register
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {registerDropdownOpen && (
                <div className="register-dropdown-menu">
                  <Link to="/register/traveler" className="register-dropdown-item" onClick={() => setRegisterDropdownOpen(false)}>
                    Traveler Register
                  </Link>
                  <Link to="/register/service-provider" className="register-dropdown-item" onClick={() => setRegisterDropdownOpen(false)}>
                    Provider Register
                  </Link>
                </div>
              )}
            </div>
            <Link to="/signin" className="button button-primary">
              Sign In
            </Link>
          </>
        )}
      </div>

      <style>{`
        /* Home Navbar styling */
        .home-navbar {
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
        .home-navbar .brand-link {
          color: #0f172a !important;
          font-weight: 800;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .home-navbar .nav-link {
          color: #475569 !important;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          padding: 0.5rem 0.75rem;
          border-radius: 999px;
        }
        .home-navbar .nav-link:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #0f172a !important;
        }
        .home-navbar .nav-active {
          color: #0f172a !important;
          background: rgba(0, 0, 0, 0.04) !important;
        }
        .home-header-actions {
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
        .home-logout-btn {
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
        .home-logout-btn:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .home-navbar .register-toggle {
          padding: 0.35rem 0.75rem !important;
          font-size: 0.85rem !important;
          font-weight: 700;
          border-radius: 999px !important;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: linear-gradient(135deg, #10b981, #059669) !important;
          border: none !important;
          color: white !important;
          cursor: pointer;
          height: auto !important;
          transition: background 0.2s;
        }
        .home-navbar .register-toggle:hover {
          background: linear-gradient(135deg, #059669, #047857) !important;
        }
        .home-navbar .button-primary {
          padding: 0.35rem 0.85rem !important;
          font-size: 0.85rem !important;
          font-weight: 700;
          border-radius: 999px !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--accent) !important;
          color: white !important;
          cursor: pointer;
          height: auto !important;
          transition: background 0.2s, opacity 0.2s;
        }
        .home-navbar .button-primary:hover {
          opacity: 0.95;
          background: var(--accent-2) !important;
        }

        /* Dark mode support */
        [data-theme="dark"] .home-navbar {
          background: rgba(30, 41, 59, 0.75) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
        }
        [data-theme="dark"] .home-navbar .brand-link {
          color: #ffffff !important;
        }
        [data-theme="dark"] .home-navbar .nav-link {
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .home-navbar .nav-link:hover,
        [data-theme="dark"] .home-navbar .nav-active {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }
        [data-theme="dark"] .top-action-link {
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .top-action-link:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }
        [data-theme="dark"] .home-logout-btn {
          background: #1e293b !important;
          border-color: #334155 !important;
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .home-logout-btn:hover {
          background: #334155 !important;
          color: #ffffff !important;
        }
      `}</style>
    </header>
  )
}
