import { useState } from 'react'

const faqCategories = [
  'All',
  'Registration',
  'Trip Planning',
  'Payments',
  'Tour Groups',
  'Local Guides',
  'Safety',
  'App'
]

const faqData = [
  {
    id: 1,
    category: 'Registration',
    question: 'How do I create an account on TripoBD?',
    answer: 'Click the "Sign Up" button in the top right corner of the homepage. Fill in your name, email address, and create a password. You\'ll receive a verification email to activate your account.'
  },
  {
    id: 2,
    category: 'Registration',
    question: 'Is registration free?',
    answer: 'Yes, creating an account on TripoBD is completely free. You can browse destinations, plan trips, and join groups without any subscription fees.'
  },
  {
    id: 3,
    category: 'Trip Planning',
    question: 'How do I search for destinations?',
    answer: 'Use the search bar on the homepage to enter your desired destination. You can filter by category (Beaches, Hills, Forests, City) and browse through our curated list of destinations across Bangladesh.'
  },
  {
    id: 4,
    category: 'Trip Planning',
    question: 'Can I save my favorite destinations?',
    answer: 'Yes! Simply click the "Save" button on any destination card. Your saved destinations will appear in your profile under "Saved Trips" for easy access later.'
  },
  {
    id: 5,
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept bKash, Nagad, Rocket, credit/debit cards (Visa, Mastercard), and bank transfers. All transactions are secured with SSL encryption.'
  },
  {
    id: 6,
    category: 'Payments',
    question: 'Is my payment information secure?',
    answer: 'Absolutely. We use industry-standard SSL encryption and comply with PCI DSS standards. We never store your complete card details on our servers.'
  },
  {
    id: 7,
    category: 'Tour Groups',
    question: 'How do I join a tour group?',
    answer: 'Browse available tour groups on the Discover page, select one that matches your preferences, and click "Join Group". You\'ll need to be logged in to participate.'
  },
  {
    id: 8,
    category: 'Tour Groups',
    question: 'Can I create my own tour group?',
    answer: 'Yes! After logging in, go to "My Groups" and click "Create New Group". You can invite friends, set trip dates, and coordinate your travel plans together.'
  },
  {
    id: 9,
    category: 'Local Guides',
    question: 'How do I book a local guide?',
    answer: 'On the destination detail page, you\'ll find available local guides with ratings and reviews. Select your preferred guide, choose your dates, and complete the booking process.'
  },
  {
    id: 10,
    category: 'Local Guides',
    question: 'Are local guides verified?',
    answer: 'All local guides on TripoBD undergo a verification process including ID verification, background checks, and skills assessment to ensure quality and safety.'
  },
  {
    id: 11,
    category: 'Safety',
    question: 'What safety measures does TripoBD recommend?',
    answer: 'We recommend traveling in groups, keeping emergency contacts handy, using verified guides, and checking travel advisories. Each destination page includes specific safety tips.'
  },
  {
    id: 12,
    category: 'Safety',
    question: 'What should I do in case of an emergency?',
    answer: 'In emergencies, call Bangladesh\'s national emergency number 999. For travel-specific issues, contact our 24/7 support hotline or use the in-app emergency feature.'
  },
  {
    id: 13,
    category: 'App',
    question: 'Is TripoBD available on mobile?',
    answer: 'Yes! Download our app from Google Play or the App Store. The mobile app offers all features of the website plus offline maps and real-time notifications.'
  },
  {
    id: 14,
    category: 'App',
    question: 'Can I use the app offline?',
    answer: 'The app supports offline mode for saved destinations and downloaded maps. You\'ll need an internet connection for booking, real-time updates, and group collaboration.'
  }
]

const videoTutorials = [
  {
    id: 1,
    title: 'Getting Started with TripoBD',
    duration: '3:45',
    thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
    description: 'Learn how to create an account and navigate the platform'
  },
  {
    id: 2,
    title: 'Planning Your First Trip',
    duration: '5:20',
    thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
    description: 'Step-by-step guide to searching and booking destinations'
  },
  {
    id: 3,
    title: 'Using Tour Groups',
    duration: '4:15',
    thumbnail: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg',
    description: 'How to join or create travel groups with friends'
  }
]

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <main className="page-shell faq-page">
      <section className="faq-hero">
        <span className="eyebrow">Help Center</span>
        <h1>How can we help you?</h1>
        <div className="faq-search">
          <span className="search-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <input
            className="search-input"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      <section className="faq-categories">
        <div className="category-pills">
          {faqCategories.map((category) => (
            <button
              key={category}
              className={`pill ${selectedCategory === category ? 'pill-active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="faq-content">
        <div className="faq-list">
          <h2>Frequently Asked Questions</h2>
          {filteredFaqs.length > 0 ? (
            <div className="faq-items">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={expandedFaq === faq.id}
                  >
                    <span className="faq-category-badge">{faq.category}</span>
                    <span className="faq-question-text">{faq.question}</span>
                    <span className="faq-icon">{expandedFaq === faq.id ? '−' : '+'}</span>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No FAQs found matching your search. Try a different category or search term.</p>
          )}
        </div>

        <aside className="faq-sidebar">
          <div className="sidebar-card">
            <h3>Video Tutorials</h3>
            <div className="video-tutorials">
              {videoTutorials.map((video) => (
                <div key={video.id} className="video-card">
                  <div
                    className="video-thumbnail"
                    style={{ backgroundImage: `url(${video.thumbnail})` }}
                  >
                    <div className="video-play-button">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <span className="video-duration">{video.duration}</span>
                  </div>
                  <div className="video-info">
                    <h4>{video.title}</h4>
                    <p>{video.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3>User Guide</h3>
            <p>Download our comprehensive user guide for detailed instructions on using TripoBD.</p>
            <a href="#" className="button button-secondary w-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download PDF Guide
            </a>
          </div>

          <div className="sidebar-card contact-card">
            <h3>Still need help?</h3>
            <p>Our support team is available 24/7 to assist you.</p>
            <div className="contact-options">
              <a href="mailto:support@tripobd.com" className="contact-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                support@tripobd.com
              </a>
              <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="contact-link whatsapp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Support
              </a>
            </div>
            <div className="social-links">
              <span>Follow us:</span>
              <a href="#" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="#" aria-label="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </aside>
      </section>

      <style>{`
        .faq-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .faq-hero {
          text-align: center;
          padding: 3rem 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          margin-bottom: 2rem;
          color: white;
        }

        .faq-hero h1 {
          font-size: 2.5rem;
          margin: 1rem 0;
          color: white;
        }

        .faq-hero .eyebrow {
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.875rem;
        }

        .faq-search {
          max-width: 600px;
          margin: 2rem auto 0;
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          border-radius: 8px;
          padding: 0.75rem 1rem;
        }

        .faq-search .search-icon {
          color: #666;
          margin-right: 0.75rem;
        }

        .faq-search .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1rem;
          padding: 0.5rem;
        }

        .faq-categories {
          margin-bottom: 2rem;
        }

        .category-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
        }

        .category-pills .pill {
          padding: 0.625rem 1.25rem;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .category-pills .pill:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .category-pills .pill-active {
          background: #667eea;
          border-color: #667eea;
          color: white;
        }

        .faq-content {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
        }

        @media (max-width: 900px) {
          .faq-content {
            grid-template-columns: 1fr;
          }
        }

        .faq-list h2 {
          margin-bottom: 1.5rem;
          font-size: 1.75rem;
        }

        .faq-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .faq-item {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .faq-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .faq-question {
          width: 100%;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .faq-category-badge {
          background: #f0f0f0;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #666;
          white-space: nowrap;
        }

        .faq-question-text {
          flex: 1;
          font-weight: 600;
          font-size: 1rem;
        }

        .faq-icon {
          font-size: 1.5rem;
          color: #667eea;
          font-weight: bold;
        }

        .faq-answer {
          padding: 0 1.25rem 1.25rem;
          color: #666;
          line-height: 1.6;
          border-top: 1px solid #f0f0f0;
          padding-top: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #999;
        }

        .faq-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sidebar-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .sidebar-card h3 {
          margin-bottom: 1rem;
          font-size: 1.25rem;
        }

        .video-tutorials {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .video-card {
          display: flex;
          gap: 1rem;
          cursor: pointer;
        }

        .video-thumbnail {
          width: 120px;
          height: 68px;
          background-size: cover;
          background-position: center;
          border-radius: 6px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .video-play-button {
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .video-card:hover .video-play-button {
          background: rgba(0, 0, 0, 0.8);
        }

        .video-duration {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .video-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 0.9rem;
        }

        .video-info p {
          margin: 0;
          font-size: 0.8rem;
          color: #666;
        }

        .w-100 {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .contact-card p {
          margin-bottom: 1rem;
          color: #666;
        }

        .contact-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .contact-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #f8f9fa;
          border-radius: 6px;
          text-decoration: none;
          color: #333;
          transition: background 0.2s;
        }

        .contact-link:hover {
          background: #e9ecef;
        }

        .contact-link.whatsapp {
          background: #25D366;
          color: white;
        }

        .contact-link.whatsapp:hover {
          background: #128C7E;
        }

        .social-links {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }

        .social-links span {
          color: #666;
          font-size: 0.875rem;
        }

        .social-links a {
          color: #666;
          transition: color 0.2s;
        }

        .social-links a:hover {
          color: #667eea;
        }
      `}</style>
    </main>
  )
}
