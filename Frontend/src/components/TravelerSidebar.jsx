import { NavLink } from 'react-router-dom'

export default function TravelerSidebar() {
  const sidebarLinks = [
    { label: '📊 Dashboard', to: '/traveler/dashboard' },
    { label: '🚪 Room Planner', to: '/traveler/room' },
    { label: '💬 Community Feed', to: '/traveler/community' },
    { label: '🤖 AI Travel Assistant', to: '/traveler/ai' },
    { label: '🤠 Local Bookings', to: '/traveler/bookings' },
    { label: '✍️ Reviews & Stories', to: '/traveler/reviews-stories' },
    { label: '⚙️ Settings', to: '/traveler/settings' },
    { label: '🛟 Help & Support', to: '/traveler/help' },
  ]

  return (
    <aside className="traveler-sidebar">
      <div className="sidebar-nav-title">Traveler Menu</div>
      <nav className="sidebar-nav-list">
        {sidebarLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'sidebar-nav-link sidebar-active' : 'sidebar-nav-link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <style>{`
        .traveler-sidebar {
          position: fixed;
          top: 98px !important;
          left: 24px !important;
          width: 240px !important;
          max-height: calc(100vh - 122px) !important;
          height: fit-content;
          background: #ffffff !important;
          border: 1px solid rgba(0, 0, 0, 0.06) !important;
          border-radius: 20px !important;
          z-index: 900;
          overflow-y: auto;
          padding: 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.03) !important;
        }
        .sidebar-nav-title {
          font-size: 0.75rem;
          font-weight: 850;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0 1.25rem;
          margin-bottom: 0.25rem;
        }
        .sidebar-nav-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0 0.75rem;
        }
        .sidebar-nav-link {
          color: #475569 !important;
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .sidebar-nav-link:hover {
          color: #2563eb !important;
          background: rgba(91, 140, 255, 0.06);
          transform: translateX(4px);
        }
        .sidebar-active {
          color: white !important;
          background: linear-gradient(135deg, #3b82f6, #10b981) !important;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25) !important;
        }

        /* Dark mode support */
        [data-theme="dark"] .traveler-sidebar {
          background: rgba(30, 41, 59, 0.8) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2) !important;
        }
        [data-theme="dark"] .sidebar-nav-link {
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] .sidebar-nav-link:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
        }
        [data-theme="dark"] .sidebar-active {
          color: white !important;
          background: linear-gradient(135deg, #10b981, #059669) !important;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25) !important;
        }

        @media (max-width: 1024px) {
          .traveler-sidebar {
            width: 70px !important;
            left: 14px !important;
            top: 98px !important;
          }
          .sidebar-nav-title {
            display: none;
          }
          .sidebar-nav-link {
            justify-content: center;
            padding: 0.75rem;
            font-size: 1.1rem;
          }
          .sidebar-nav-link {
            font-size: 1.2rem;
            width: 44px;
            height: 44px;
            padding: 0;
            justify-content: center;
            margin: 0 auto;
          }
        }
      `}</style>
    </aside>
  )
}
