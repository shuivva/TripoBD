import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { label: 'Dashboard', to: '/traveler/dashboard' },
  { label: 'Profile', to: '/traveler/profile' },
  { label: 'Tour Room', to: '/traveler/room' },
  { label: 'Community', to: '/traveler/community' },
  { label: 'AI Assistant', to: '/traveler/ai-assistant' },
  { label: 'Tour Guides', to: '/traveler/tour-guides' },
  { label: 'Reviews & Stories', to: '/traveler/reviews-stories' },
  { label: 'Notifications', to: '/traveler/notifications' },
  { label: 'Wishlist', to: '/traveler/wishlist' },
  { label: 'Settings', to: '/traveler/settings' },
  { label: 'Help', to: '/traveler/help' },
]

export default function TravelerNavigation() {
  return (
    <header className="site-header">
      <div className="brand">
        <Link to="/traveler/dashboard" className="brand-link">
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
        <button className="button button-tertiary" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  )
}

function handleLogout() {
  fetch('http://localhost:8000/api/auth/logout/', { method: 'POST', credentials: 'include' })
    .then(() => {
      // redirect to home
      window.location.href = '/'
    })
    .catch(() => {
      window.location.href = '/'
    })
}
