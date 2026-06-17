import { NavLink } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'

export default function TravelerSidebar() {
  const sidebarRef = useRef(null)
  const [sidebarBottom, setSidebarBottom] = useState(0)
  const rafRef = useRef(null)
  const lastScrollY = useRef(0)

  const adjustSidebar = useCallback(() => {
    const footer = document.querySelector('.site-footer')
    const sidebar = sidebarRef.current
    
    if (!footer || !sidebar) {
      setSidebarBottom(0)
      return
    }

    const footerRect = footer.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const navbarHeight = 60

    // Calculate where sidebar should stop
    if (footerRect.top < windowHeight && footerRect.top > navbarHeight) {
      const overlap = windowHeight - footerRect.top
      setSidebarBottom(Math.max(0, overlap))
    } else if (footerRect.top <= navbarHeight) {
      // Footer is above navbar, sidebar should be hidden or minimal
      setSidebarBottom(windowHeight - navbarHeight)
    } else {
      setSidebarBottom(0)
    }

    rafRef.current = null
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      lastScrollY.current = window.scrollY
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(adjustSidebar)
      }
    }

    const handleResize = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(adjustSidebar)
      }
    }

    // Initial adjustment
    adjustSidebar()

    // Add event listeners with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [adjustSidebar])

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
    <aside ref={sidebarRef} className="traveler-sidebar" style={{ bottom: `calc(${sidebarBottom}px + 24px)` }}>
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
          background: #ffffff !important;
          border: 1px solid rgba(0, 0, 0, 0.06) !important;
          border-radius: 20px !important;
          z-index: 900;
          overflow-y: auto;
          padding: 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: bottom 0.1s ease-out;
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
