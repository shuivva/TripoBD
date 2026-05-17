import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Discover', to: '/discover' },
  { label: 'Routes', to: '/routes' },
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
        <Link to="/signin" className="button button-outline" style={{ marginRight: '10px' }}>
          Sign In
        </Link>
        <Link to="/signup" className="button button-primary">
          Sign Up
        </Link>
      </div>
    </header>
  )
}
