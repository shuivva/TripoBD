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
    { label: '🏠 Dashboard', to: '/traveler/dashboard' },
    { label: '👥 Room', to: '/traveler/room' },
    { label: '🌐 Community', to: '/traveler/community' },
    { label: '🤖 AI Chat', to: '/traveler/ai' },
    { label: '🤠 Bookings', to: '/traveler/bookings' },
    { label: '✍️ Reviews & Stories', to: '/traveler/reviews-stories' },
    { label: '⚙️ Settings', to: '/traveler/settings' },
    { label: '❓ Help', to: '/traveler/help' },
  ]

  return (
    <aside ref={sidebarRef} className="traveler-sidebar" style={{ bottom: `${sidebarBottom}px` }}>
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
          top: 60px;
          left: 0;
          width: 240px;
          background: #0f172a;
          border-right: 1px solid #1e293b;
          z-index: 900;
          overflow-y: auto;
          padding: 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: bottom 0.1s ease-out;
        }
        .sidebar-nav-title {
          font-size: 0.75rem;
          font-weight: 850;
          color: #64748b;
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
          color: #94a3b8 !important;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          transition: background 0.2s, color 0.2s;
        }
        .sidebar-nav-link:hover {
          color: white !important;
          background: #1e293b;
        }
        .sidebar-active {
          color: white !important;
          background: #ef4444 !important;
        }

        @media (max-width: 1024px) {
          .traveler-sidebar {
            width: 70px;
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
