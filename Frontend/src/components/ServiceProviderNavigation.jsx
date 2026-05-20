import { useState, useCallback } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const navLinks = [
  { label: 'Dashboard', to: '/service-provider/dashboard', icon: '📊' },
  { label: 'Profile', to: '/service-provider/profile', icon: '👤' },
  { label: 'Listings', to: '/service-provider/listings', icon: '🏨' },
  { label: 'Bookings', to: '/service-provider/bookings', icon: '📦' },
]

export default function ServiceProviderNavigation() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = useCallback(async () => {
    if (loggingOut) return // prevent double-click

    const confirmed = window.confirm('Are you sure you want to log out?')
    if (!confirmed) return

    setLoggingOut(true)
    try {
      await fetch(`${API_BASE}/api/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout API failed:', err)
    } finally {
      // Clear provider specific data
      localStorage.removeItem('providerToken')
      localStorage.removeItem('providerData')
      setLoggingOut(false)
      
      // Hard refresh clears all in-memory React state/context
      window.location.href = '/'
    }
  }, [loggingOut])

  return (
    <>
      <header className="spn-header" role="banner">
        {/* ── Brand ── */}
        <div className="spn-brand">
          <Link to="/service-provider/dashboard" className="spn-brand-link" aria-label="Provider Home">
            <span className="spn-brand-icon" aria-hidden="true">🌿</span>
            TripoBD <span className="spn-brand-sub">Provider</span>
          </Link>
        </div>

        {/* ── Desktop Nav ── */}
        <nav className="spn-nav" aria-label="Provider navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `spn-link ${isActive ? 'spn-link-active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* ── Actions ── */}
        <div className="spn-actions">
          <button
            className="spn-notif"
            aria-label="Notifications"
            title="Notifications"
          >
            🔔
          </button>

          <button
            className="spn-logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Log out"
          >
            {loggingOut ? '⏳ Logging out…' : 'Log out'}
          </button>

          {/* ── Mobile Hamburger ── */}
          <button
            className="spn-hamburger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="spn-mobile-nav"
          >
            <span className={`spn-hamburger-line ${mobileOpen ? 'open' : ''}`} />
            <span className={`spn-hamburger-line ${mobileOpen ? 'open' : ''}`} />
            <span className={`spn-hamburger-line ${mobileOpen ? 'open' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <nav
          id="spn-mobile-nav"
          className="spn-mobile-nav"
          aria-label="Provider navigation (mobile)"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `spn-mobile-link ${isActive ? 'spn-mobile-link-active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span aria-hidden="true">{link.icon}</span> {link.label}
            </NavLink>
          ))}
          <button
            className="spn-mobile-logout"
            onClick={() => { setMobileOpen(false); handleLogout() }}
          >
            🚪 Log out
          </button>
        </nav>
      )}

      {/* ── Overlay ── */}
      {mobileOpen && (
        <div
          className="spn-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <style>{`
        /* ── Header ── */
        .spn-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 65px;
          background: linear-gradient(180deg, #0f3460 0%, #16213e 100%);
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        /* ── Brand ── */
        .spn-brand-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          font-size: 1.35rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .spn-brand-icon { font-size: 1.4rem; }
        .spn-brand-sub {
          font-size: 0.75rem;
          font-weight: 600;
          color: #ffc107; /* Yellow accent for Provider */
          background: rgba(255,193,7,0.15);
          padding: 2px 8px;
          border-radius: 999px;
          margin-left: 4px;
          vertical-align: middle;
        }

        /* ── Desktop Nav Links ── */
        .spn-nav {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .spn-link {
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }
        .spn-link:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .spn-link-active {
          background: rgba(255,255,255,0.12);
          color: #fff;
          font-weight: 700;
        }

        /* ── Actions ── */
        .spn-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .spn-notif {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: rgba(255,255,255,0.7);
          transition: color 0.2s;
          padding: 4px;
        }
        .spn-notif:hover { color: #fff; }

        .spn-logout-btn {
          background: rgba(229,57,53,0.15);
          border: 1px solid rgba(229,57,53,0.25);
          color: #ef9a9a;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.45rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .spn-logout-btn:hover:not(:disabled) {
          background: rgba(229,57,53,0.3);
          color: #ffcdd2;
        }
        .spn-logout-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Hamburger (hidden on desktop) ── */
        .spn-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }
        .spn-hamburger-line {
          display: block;
          width: 22px;
          height: 2px;
          background: #fff;
          border-radius: 2px;
          transition: transform 0.25s, opacity 0.25s;
        }
        .spn-hamburger-line.open:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }
        .spn-hamburger-line.open:nth-child(2) {
          opacity: 0;
        }
        .spn-hamburger-line.open:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        /* ── Mobile Drawer ── */
        .spn-mobile-nav {
          display: none;
          flex-direction: column;
          position: fixed;
          top: 65px;
          right: 0;
          width: 260px;
          height: calc(100vh - 65px);
          background: #16213e;
          padding: 1.5rem 1rem;
          gap: 0.25rem;
          z-index: 49;
          box-shadow: -4px 0 20px rgba(0,0,0,0.3);
          animation: spnSlideIn 0.2s ease-out;
        }
        @keyframes spnSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .spn-mobile-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }
        .spn-mobile-link:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .spn-mobile-link-active {
          background: rgba(255,255,255,0.12);
          color: #fff;
          font-weight: 700;
        }
        .spn-mobile-logout {
          margin-top: auto;
          background: rgba(229,57,53,0.15);
          border: 1px solid rgba(229,57,53,0.25);
          color: #ef9a9a;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          text-align: left;
        }
        .spn-mobile-logout:hover {
          background: rgba(229,57,53,0.3);
          color: #ffcdd2;
        }

        /* ── Overlay ── */
        .spn-overlay {
          display: none;
          position: fixed;
          inset: 0;
          top: 65px;
          background: rgba(0,0,0,0.4);
          z-index: 48;
        }

        /* ── Mobile Breakpoint ── */
        @media (max-width: 768px) {
          .spn-header { padding: 0 1rem; }
          .spn-nav { display: none; }
          .spn-brand-sub { display: none; }
          .spn-logout-btn { display: none; }
          .spn-hamburger { display: flex; }
          .spn-mobile-nav { display: flex; }
          .spn-overlay { display: block; }
        }
      `}</style>
    </>
  )
}