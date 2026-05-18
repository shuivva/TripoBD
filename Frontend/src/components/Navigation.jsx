import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Discover', to: '/discover' },
  { label: 'Routes', to: '/routes' },
  { label: 'FAQ', to: '/faq' },
  { label: 'About', to: '/about' },
]

export default function Navigation() {
  return (
    <header className="site-header">
      <div className="brand">
        <Link to="/" className="brand-link">
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
      </nav>
      <div className="header-actions">
        <Link to="/register/traveler" className="button button-outline" style={{ marginRight: '10px' }}>
          Traveler Register
        </Link>
        <Link to="/register/service-provider" className="button button-outline" style={{ marginRight: '10px' }}>
          Provider Register
        </Link>
        <Link to="/signin" className="button button-primary">
          Sign In
        </Link>
      </div>
    </header>
  )
}
