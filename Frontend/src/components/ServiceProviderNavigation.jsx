import { Link, NavLink, useNavigate } from 'react-router-dom'

const navLinks = [
  { label: 'Dashboard', to: '/service-provider/dashboard' },
  { label: 'Profile', to: '/service-provider/profile' },
  { label: 'Listings', to: '/service-provider/listings' },
  { label: 'Bookings', to: '/service-provider/bookings' },
]

export default function ServiceProviderNavigation() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      // Hit the backend logout endpoint to clear session/cookies
      await fetch('http://localhost:8000/api/auth/logout/', { 
        method: 'POST', 
        credentials: 'include' 
      })
    } catch (err) {
      // Silently fail or log error, still proceed with client logout
      console.error('Logout API failed:', err)
    } finally {
      // Clear any locally stored provider data
      localStorage.removeItem('providerToken')
      localStorage.removeItem('providerData')
      
      // Redirect to home/login page
      navigate('/')
      // Optional: use window.location.href = '/' if you need a hard refresh to clear all states
    }
  }

  return (
    <>
      <header className="spn-header">
        <div className="spn-brand">
          <Link to="/service-provider/dashboard" className="spn-brand-link">
            <span className="spn-brand-icon">🌿</span>
            TripoBD <span className="spn-brand-sub">Provider</span>
          </Link>
        </div>
        
        <nav className="spn-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'spn-link spn-link-active' : 'spn-link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="spn-actions">
          <div className="spn-notif">🔔</div>
          <button className="spn-logout-btn" onClick={handleLogout}>
            🚪 Log out
          </button>
        </div>
      </header>

      <style>{`
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

        .spn-brand-icon {
          font-size: 1.4rem;
        }

        .spn-brand-sub {
          font-size: 0.75rem;
          font-weight: 600;
          color: #ffc107;
          background: rgba(255, 193, 7, 0.15);
          padding: 2px 8px;
          border-radius: 999px;
          margin-left: 4px;
          vertical-align: middle;
        }

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
          background: rgba(255,255,255,0.12) !important;
          color: #fff !important;
          font-weight: 700;
        }

        .spn-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .spn-notif {
          font-size: 1.2rem;
          cursor: pointer;
          color: rgba(255,255,255,0.7);
          transition: color 0.2s;
        }

        .spn-notif:hover {
          color: #fff;
        }

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

        .spn-logout-btn:hover {
          background: rgba(229,57,53,0.3);
          color: #ffcdd2;
        }

        @media (max-width: 768px) {
          .spn-header {
            padding: 0 1rem;
          }
          .spn-nav {
            display: none; /* Hidden on mobile, assuming sidebar takes over */
          }
          .spn-brand-sub {
            display: none;
          }
        }
      `}</style>
    </>
  )
}