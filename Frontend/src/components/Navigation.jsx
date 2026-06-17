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
          TripoBD <span className="home-role-tag">Home</span>
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
        .home-navbar .brand-link {
          color: white !important;
          font-weight: 900;
          font-size: 1.4rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .home-role-tag {
          font-size: 0.7rem;
          font-weight: 800;
          background: #10b981;
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .home-navbar .nav-link {
          color: #cbd5e1 !important;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.15s;
          padding: 0.35rem 0.65rem;
          border-radius: 6px;
        }
        .home-navbar .nav-link:hover {
          color: white !important;
          background: #334155;
        }
        .home-navbar .nav-active {
          color: white !important;
          background: #10b981 !important;
        }
        .home-header-actions {
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
        .home-logout-btn {
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
        .home-logout-btn:hover {
          background: #10b981;
          color: white !important;
          border-color: #10b981;
        }
      `}</style>
    </header>
  )
}
