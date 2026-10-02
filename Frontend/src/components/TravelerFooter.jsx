import { Link } from 'react-router-dom'

const footerLinks = {
  company: [
    { label: 'About Us', to: '/about' },
    { label: 'Blog', to: '/' },
    { label: 'Careers', to: '/' },
    { label: 'Press', to: '/' },
  ],
  support: [
    { label: 'Help Center', to: '/' },
    { label: 'Contact Us', to: '/' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Community', to: '/traveler/community' },
  ],
  legal: [
    { label: 'Privacy Policy', to: '/' },
    { label: 'Terms & Conditions', to: '/' },
    { label: 'Cookie Policy', to: '/' },
    { label: 'Disclaimer', to: '/' },
  ],
  social: [
    {
      label: 'Facebook',
      url: '#',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: 'Instagram',
      url: '#',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      label: 'Twitter',
      url: '#',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: 'YouTube',
      url: '#',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ],
}

export default function TravelerFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="traveler-site-footer">
      <div className="traveler-footer-brand">
        <h3>TripoBD</h3>
        <p>Plan Smart. Travel Together.</p>
        <p className="footer-tagline">Your ultimate Bangladesh travel companion</p>
      </div>

      <div className="traveler-footer-section">
        <h4>Company</h4>
        <ul className="footer-links">
          {footerLinks.company.map((link) => (
            <li key={link.label}>
              <Link to={link.to} className="footer-link">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="traveler-footer-section">
        <h4>Support</h4>
        <ul className="footer-links">
          {footerLinks.support.map((link) => (
            <li key={link.label}>
              <Link to={link.to} className="footer-link">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="traveler-footer-section">
        <h4>Legal</h4>
        <ul className="footer-links">
          {footerLinks.legal.map((link) => (
            <li key={link.label}>
              <Link to={link.to} className="footer-link">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="traveler-footer-bottom">
        <div className="traveler-follow-us">
          <h4>Follow Us</h4>
          <div className="social-links">
            {footerLinks.social.map((link) => (
              <a
                key={link.label}
                href={link.url}
                className="social-link"
                title={link.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="traveler-copyright-container">
          <p className="footer-copyright">
            © {currentYear} TripoBD. All rights reserved.
          </p>
          <p className="footer-tagline">
            Made with ❤️ for travelers | Designed for Bangladesh
          </p>
        </div>
      </div>

      <style>{`
        .traveler-site-footer {
          margin-left: calc(264px + 2rem) !important;
          margin-right: 2rem !important;
          width: calc(100% - 264px - 4rem) !important;
          max-width: none !important;
          box-sizing: border-box;
          background: linear-gradient(135deg, rgba(91,140,255,0.08), rgba(110,231,183,0.06));
          border: 1px solid rgba(91,140,255,0.16);
          border-radius: 20px;
          padding: 3.5rem 3rem 2.5rem;
          display: grid;
          grid-template-columns: 1.6fr repeat(3, 1fr);
          gap: 2.5rem;
          margin-top: 4rem;
          margin-bottom: 2.5rem;
          backdrop-filter: blur(10px);
        }

        .traveler-footer-brand h3 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-h, #0f172a);
          margin-bottom: 0.5rem;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .traveler-footer-brand p {
          color: var(--text-muted, #64748b);
          margin: 0;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .traveler-footer-brand .footer-tagline {
          font-size: 0.88rem;
          color: var(--text-muted, #64748b);
          margin-top: 0.5rem;
          opacity: 0.85;
        }

        .traveler-footer-section h4 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-h, #0f172a);
          margin-bottom: 1rem;
          position: relative;
        }

        .traveler-footer-section h4::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 30px;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          border-radius: 1px;
        }

        .traveler-footer-bottom {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          padding-top: 2rem;
          margin-top: 1rem;
          border-top: 1px solid rgba(91,140,255,0.12);
          text-align: center;
        }

        .traveler-follow-us {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .traveler-follow-us h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-h, #0f172a);
          margin: 0;
          position: relative;
        }

        .traveler-follow-us h4::after {
          content: '';
          display: block;
          width: 28px;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          margin: 4px auto 0;
          border-radius: 1px;
        }

        .traveler-footer-bottom .social-links {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .traveler-footer-bottom .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(91,140,255,0.12), rgba(110,231,183,0.08));
          color: #2563eb;
          transition: all 0.3s ease;
          border: 1px solid rgba(91,140,255,0.12);
        }

        .traveler-footer-bottom .social-link:hover {
          background: linear-gradient(90deg, #3b82f6, #10b981);
          color: #fff;
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(59,130,246,0.3);
        }

        .traveler-copyright-container .footer-copyright {
          color: var(--text-h, #0f172a);
          font-weight: 600;
          font-size: 0.88rem;
          margin: 0 0 0.35rem 0;
        }

        .traveler-copyright-container .footer-tagline {
          margin: 0;
          font-size: 0.82rem;
          color: var(--text-muted, #64748b);
        }

        /* Dark mode support */
        [data-theme="dark"] .traveler-site-footer {
          background: rgba(15, 23, 42, 0.75) !important;
          border-top-color: rgba(255, 255, 255, 0.08) !important;
        }
        [data-theme="dark"] .traveler-footer-brand h3,
        [data-theme="dark"] .traveler-footer-section h4,
        [data-theme="dark"] .traveler-follow-us h4,
        [data-theme="dark"] .traveler-copyright-container .footer-copyright {
          color: #f8fafc;
        }
        [data-theme="dark"] .traveler-footer-bottom {
          border-top-color: rgba(255, 255, 255, 0.08) !important;
        }
        [data-theme="dark"] .traveler-footer-brand p,
        [data-theme="dark"] .traveler-footer-brand .footer-tagline,
        [data-theme="dark"] .traveler-copyright-container .footer-tagline {
          color: #94a3b8;
        }
        [data-theme="dark"] .traveler-footer-bottom .social-link {
          color: #60a5fa;
          border-color: rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 1024px) {
          .traveler-site-footer {
            margin-left: calc(80px + 1.5rem) !important;
            margin-right: 1.5rem !important;
            width: calc(100% - 80px - 3rem) !important;
            grid-template-columns: 1fr 1fr;
            padding: 2.5rem 2rem 1.5rem;
            gap: 2rem;
          }
        }

        @media (max-width: 768px) {
          .traveler-site-footer {
            margin-left: 1rem !important;
            margin-right: 1rem !important;
            width: calc(100% - 2rem) !important;
            grid-template-columns: 1fr;
            padding: 2rem 1.5rem 1.5rem;
            gap: 1.5rem;
          }
        }
      `}</style>
    </footer>
  )
}
