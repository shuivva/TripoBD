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

  return (
    <header className="site-header">
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
      <div className="header-actions">
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
      </div>
    </header>
  )
}
