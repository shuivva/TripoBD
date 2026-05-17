import { Link } from 'react-router-dom'

const links = [
  { label: 'About', to: '/' },
  { label: 'Features', to: '/' },
  { label: 'FAQ', to: '/' },
  { label: 'Contact', to: '/' },
  { label: 'Privacy Policy', to: '/' },
  { label: 'Terms', to: '/' },
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>TripoBD</strong> — Plan Smart. Travel Together.
      </div>
      <div className="footer-links">
        {links.map((link) => (
          <Link key={link.label} to={link.to} className="footer-link">
            {link.label}
          </Link>
        ))}
      </div>
      <p className="footer-note">© 2026 TripoBD. Designed for Bangladesh travel planning.</p>
    </footer>
  )
}
