import { useState, useEffect } from 'react'
import { getFaqsList, getFaqCategories, getVideoTutorials } from '../apiClient'

const fallbackCategories = [
  'All', 'Registration', 'Trip Planning', 'Payments', 'Tour Groups',
  'Local Guides', 'Safety', 'Permits', 'Transport', 'App'
]

const fallbackFaqs = [
  { id: 1, category: 'Registration', question: 'How do I create an account on TripoBD?', answer: 'Click the "Sign Up" button in the top right corner of the homepage. Fill in your name, email address, and create a password. You\'ll receive a verification email to activate your account.' },
  { id: 2, category: 'Registration', question: 'Is registration free?', answer: 'Yes, creating an account on TripoBD is completely free. You can browse destinations, plan trips, and join groups without any subscription fees.' },
  { id: 3, category: 'Trip Planning', question: 'How do I search for destinations?', answer: 'Use the search bar on the homepage to enter your desired destination. You can filter by category (Beaches, Hills, Forests, City) and browse through our curated list of destinations across Bangladesh.' },
  { id: 4, category: 'Trip Planning', question: 'Can I save my favorite destinations?', answer: 'Yes! Simply click the "Save" button on any destination card. Your saved destinations will appear in your profile under "Saved Trips" for easy access later.' },
  { id: 5, category: 'Payments', question: 'What payment methods do you accept?', answer: 'We accept bKash, Nagad, Rocket, credit/debit cards (Visa, Mastercard), and bank transfers. All transactions are secured with SSL encryption.' },
  { id: 6, category: 'Payments', question: 'Is my payment information secure?', answer: 'Absolutely. We use industry-standard SSL encryption and comply with PCI DSS standards. We never store your complete card details on our servers.' },
  { id: 7, category: 'Tour Groups', question: 'How do I join a tour group?', answer: 'Browse available tour groups on the Discover page, select one that matches your preferences, and click "Join Group". You\'ll need to be logged in to participate.' },
  { id: 8, category: 'Tour Groups', question: 'Can I create my own tour group?', answer: 'Yes! After logging in, go to "My Groups" and click "Create New Group". You can invite friends, set trip dates, and coordinate your travel plans together.' },
  { id: 9, category: 'Local Guides', question: 'How do I book a local guide?', answer: 'On the destination detail page, you\'ll find available local guides with ratings and reviews. Select your preferred guide, choose your dates, and complete the booking process.' },
  { id: 10, category: 'Local Guides', question: 'Are local guides verified?', answer: 'All local guides on TripoBD undergo a verification process including ID verification, background checks, and skills assessment to ensure quality and safety.' },
  { id: 11, category: 'Safety', question: 'What safety measures does TripoBD recommend?', answer: 'We recommend traveling in groups, keeping emergency contacts handy, using verified guides, and checking travel advisories. Each destination page includes specific safety tips.' },
  { id: 12, category: 'Safety', question: 'What should I do in case of an emergency?', answer: 'In emergencies, call Bangladesh\'s national emergency number 999. For travel-specific issues, contact our 24/7 support hotline or use the in-app emergency feature.' },
  { id: 13, category: 'App', question: 'Is TripoBD available on mobile?', answer: 'Yes! Download our app from Google Play or the App Store. The mobile app offers all features of the website plus offline maps and real-time notifications.' },
  { id: 14, category: 'App', question: 'Can I use the app offline?', answer: 'The app supports offline mode for saved destinations and downloaded maps. You\'ll need an internet connection for booking, real-time updates, and group collaboration.' },
  { id: 15, category: 'Permits', question: 'Do I need a permit to visit the Chittagong Hill Tracts?', answer: 'Yes, foreign nationals require a permit from the Deputy Commissioner\'s office to visit Rangamati, Bandarban, and Khagrachhari. TripoBD assists in arranging these permits for our tour group members. Local tourists generally do not need permits for Sajek or Nilgiri but should carry valid National ID.' },
  { id: 16, category: 'Permits', question: 'How do I get permission for the Sundarbans?', answer: 'To visit the Sundarbans, you need a permit from the Divisional Forest Officer. If you book a TripoBD tour or guide, we handle all necessary permissions and boat clearances for you.' },
  { id: 17, category: 'Transport', question: 'Can I book train or launch tickets through TripoBD?', answer: 'Yes! We partner with Bangladesh Railway and major launch operators. When planning your trip, you can seamlessly book AC/Snigdha train tickets and premium cabin launches directly through the platform.' },
  { id: 18, category: 'Trip Planning', question: 'When is the best time to visit Bangladesh?', answer: 'The ideal tourist season is from October to March (Winter), offering pleasant weather. For the Sundarbans, November to January is best. If you love lush greenery and waterfalls in Sajek or Bandarban, the monsoon (June-September) is beautiful, but expect heavy rain.' },
]

const fallbackTutorials = [
  { id: 1, title: 'Getting Started with TripoBD', duration: '3:45', thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg', description: 'Learn how to create an account and navigate the platform' },
  { id: 2, title: 'Planning Your First Trip', duration: '5:20', thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg', description: 'Step-by-step guide to searching and booking destinations' },
  { id: 3, title: 'Using Tour Groups', duration: '4:15', thumbnail: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg', description: 'How to join or create travel groups with friends' },
]

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [categories, setCategories] = useState([])
  const [faqs, setFaqs] = useState([])
  const [tutorials, setTutorials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getFaqCategories().catch(e => { console.error(e); return [] }),
      getFaqsList().catch(e => { console.error(e); return [] }),
      getVideoTutorials().catch(e => { console.error(e); return [] })
    ]).then(([cats, items, tuts]) => {
      let catNames = cats.map(c => c.name)
      if (catNames.length) {
        if (!catNames.includes('All')) {
          catNames = ['All', ...catNames]
        }
        setCategories(catNames)
      } else {
        setCategories(fallbackCategories)
      }
      setFaqs(items.length ? items : fallbackFaqs)
      setTutorials(tuts.length ? tuts : fallbackTutorials)
      setLoading(false)
    })
  }, [])

  const filteredFaqs = faqs.filter(faq => {
    const catName = typeof faq.category === 'object' && faq.category ? faq.category.name : faq.category
    const matchesCategory = selectedCategory === 'All' || catName === selectedCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const suggestions = searchQuery.length > 0
    ? faqs
        .filter(faq => 
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(faq => faq.question)
        .slice(0, 5)
    : []

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  const handleSuggestionClick = (text) => {
    setSearchQuery(text)
    setShowSuggestions(false)
  }

  return (
    <main className="page-shell faq-page">
      {/* ── HERO ── */}
      <section className="faq-hero">
        <div className="faq-hero-bg">
          <div className="faq-hero-overlay" />
        </div>
        <div className="faq-hero-body">
          <span className="faq-eyebrow">✦ Help Center</span>
          <h1>How can we help you?</h1>
          <p>Find answers to your questions about traveling in Bangladesh, booking trips, and using TripoBD.</p>
          
          <div className="faq-search-wrap">
            <div className="faq-search-bar">
              <span className="faq-search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2.2"/>
                </svg>
              </span>
              <input
                className="faq-search-input"
                placeholder="Search for answers... e.g. permits, payments"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              <button className="faq-search-btn" onClick={() => setShowSuggestions(false)}>Search</button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="faq-suggestions-dropdown">
                {suggestions.map((sug, i) => (
                  <button 
                    key={i} 
                    className="faq-suggestion-item"
                    onMouseDown={() => handleSuggestionClick(sug)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
                      <circle cx="11" cy="11" r="6"/>
                    </svg>
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="faq-categories">
        <div className="faq-cats-inner">
          {categories.map((category) => (
            <button
              key={category}
              className={`faq-pill${selectedCategory === category ? ' faq-pill-active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="faq-content">
        <div className="faq-list">
          <div className="faq-list-header">
            <span className="faq-list-eyebrow">✦ FAQ</span>
            <h2>Frequently Asked Questions</h2>
          </div>
          
          {filteredFaqs.length > 0 ? (
            <div className="faq-items">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className={`faq-item${expandedFaq === faq.id ? ' faq-item-open' : ''}`}>
                  <button
                    className="faq-question"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={expandedFaq === faq.id}
                  >
                    <span className="faq-category-badge">
                      {typeof faq.category === 'object' && faq.category ? faq.category.name : faq.category}
                    </span>
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
            <div className="faq-empty">
              <div className="faq-empty-icon">🔍</div>
              <h3>No FAQs found</h3>
              <p>Try adjusting your search term or category filter.</p>
            </div>
          )}
        </div>

        <aside className="faq-sidebar">
          <div className="faq-sidebar-card faq-sidebar-dark">
            <div className="faq-sidebar-intro">
              <span className="faq-sidebar-eyebrow">🎬 Learn</span>
              <h3>Video Tutorials</h3>
            </div>
            <div className="video-tutorials">
              {tutorials.map((video) => (
                <div key={video.id} className="video-card">
                  <div
                    className="video-thumbnail"
                    style={{ backgroundImage: `url(${video.thumbnail})` }}
                  >
                    <div className="video-play-button">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
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

          <div className="faq-sidebar-card">
            <div className="faq-sidebar-intro">
              <span className="faq-sidebar-eyebrow">📑 Resources</span>
              <h3>User Guide</h3>
            </div>
            <p className="faq-sidebar-desc">Download our comprehensive user guide for detailed instructions on using TripoBD and traveling across Bangladesh.</p>
            <a href="#" className="faq-guide-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF Guide
            </a>
          </div>

          <div className="faq-sidebar-card faq-sidebar-dark faq-contact-card">
            <div className="faq-sidebar-intro">
              <span className="faq-sidebar-eyebrow">🛟 Support</span>
              <h3>Still need help?</h3>
            </div>
            <p className="faq-sidebar-desc">Our support team is available 24/7 to assist you with your Bangladesh travel plans.</p>
            <div className="contact-options">
              <a href="mailto:support@tripobd.com" className="contact-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                support@tripobd.com
              </a>
              <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="contact-link whatsapp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Support
              </a>
            </div>
            <div className="social-links">
              <span>Follow us:</span>
              <a href="#" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
              <a href="#" aria-label="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>
          </div>
        </aside>
      </section>

      {/* ════════════ STYLES ════════════ */}
      <style>{`
        /* ── HERO ── */
        .faq-hero {
          position: relative; border-radius: 1.5rem; overflow: hidden;
          min-height: 420px; display: flex; align-items: center;
          justify-content: center; text-align: center; margin-bottom: 2.5rem;
          box-shadow: 0 12px 48px rgba(0,0,0,.2);
        }
        .faq-hero-bg {
          position: absolute; inset: 0; z-index: 0;
          /* Customer Support / Help Desk Themed Image */
          background-image: url('https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1920');
          background-size: cover; background-position: center;
          filter: brightness(0.4) saturate(1.2);
        }
        .faq-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(6,10,40,.65) 0%, rgba(6,10,40,.4) 55%, rgba(6,10,40,.8) 100%);
        }
        .faq-hero-body {
          position: relative; z-index: 2; padding: 4rem 2rem;
          width: 100%; max-width: 780px; color: #fff;
          display: flex; flex-direction: column; align-items: center;
        }
        .faq-eyebrow {
          display: inline-block; background: linear-gradient(90deg,#e63946,#f4a261);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.82rem; letter-spacing:.06em; text-transform:uppercase;
        }
        .faq-hero-body h1 {
          color: #fff; font-size: clamp(2rem,4vw,2.8rem);
          margin: .5rem 0 .75rem; font-weight: 800;
        }
        .faq-hero-body p {
          color: rgba(255,255,255,.85); font-size: 1.05rem;
          line-height: 1.6; margin-bottom: 2rem; max-width: 560px;
        }

        /* Search Bar & Suggestions */
        .faq-search-wrap { width: 100%; max-width: 640px; position: relative; z-index: 10; }
        .faq-search-bar {
          display: flex; align-items: center;
          background: rgba(255,255,255,.97); border-radius: 56px;
          padding: .35rem .35rem .35rem 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.15);
          gap: 0; width: 100%;
        }
        .faq-search-icon { color: #888; flex-shrink:0; display:flex; align-items:center; margin-right: .75rem; }
        .faq-search-input {
          flex: 1; border: none; outline: none; background: transparent;
          font-size: .97rem; color: #1a1a2e; padding: .5rem 0; min-width: 0;
        }
        .faq-search-input::placeholder { color: #aaa; }
        .faq-search-btn {
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff; border: none; border-radius: 40px;
          padding: .7rem 1.6rem; font-size: .92rem; font-weight: 700;
          cursor: pointer; flex-shrink:0; transition: opacity .2s, transform .15s; white-space: nowrap;
        }
        .faq-search-btn:hover { opacity:.88; transform:scale(1.03); }

        .faq-suggestions-dropdown {
          position: absolute; top: 100%; left: 0; right: 0; 
          margin-top: .5rem; background: #fff; border-radius: 1rem;
          box-shadow: 0 12px 40px rgba(0,0,0,.2); border: 1px solid #e2e8f0;
          overflow: hidden; z-index: 20;
        }
        .faq-suggestion-item {
          display: flex; align-items: center; gap: .75rem;
          padding: .85rem 1.25rem; width: 100%; text-align: left; border: none;
          background: none; cursor: pointer; font-size: .9rem; color: #334155;
          transition: background .15s;
        }
        .faq-suggestion-item svg { flex-shrink: 0; color: #94a3b8; }
        .faq-suggestion-item:hover { background: #f1f5f9; color: #0f172a; }
        .faq-suggestion-item:not(:last-child) { border-bottom: 1px solid #f1f5f9; }

        @media(max-width:600px){
          .faq-hero { min-height: 360px; }
          .faq-hero-body { padding: 2.5rem 1.25rem; }
          .faq-search-bar { border-radius:1rem; padding:.5rem; flex-wrap:wrap; gap:.4rem; }
          .faq-search-input { padding:.5rem; font-size:.9rem; }
          .faq-search-btn { width:100%; justify-content:center; border-radius:.75rem; }
          .faq-suggestions-dropdown { border-radius: .75rem; margin-top: .35rem; }
        }

        /* ── CATEGORIES ── */
        .faq-categories { margin-bottom: 2.5rem; }
        .faq-cats-inner { display: flex; flex-wrap: wrap; gap: .65rem; justify-content: center; }
        .faq-pill {
          background: #fff; border: 1.5px solid #e2e8f0;
          color: #64748b; border-radius: 999px; padding: .45rem 1.15rem; font-size: .85rem;
          font-weight: 600; cursor: pointer; transition: all .2s;
        }
        .faq-pill:hover { border-color: #10b981; color: #10b981; }
        .faq-pill-active {
          background: linear-gradient(135deg,#10b981,#059669) !important;
          border-color: #10b981 !important; color: #fff !important;
        }

        /* ── CONTENT GRID ── */
        .faq-content {
          display: grid; grid-template-columns: 1fr 380px; gap: 2.5rem;
          align-items: flex-start;
        }

        /* ── FAQ LIST ── */
        .faq-list-header { margin-bottom: 2rem; }
        .faq-list-eyebrow {
          display: inline-block; background: linear-gradient(90deg,#e63946,#f4a261);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.82rem; letter-spacing:.06em; text-transform:uppercase;
        }
        .faq-list-header h2 { font-size: clamp(1.5rem,3vw,2rem); font-weight: 800; color: #0f172a; margin: .5rem 0 0; }
        .faq-items { display: flex; flex-direction: column; gap: 1rem; }
        .faq-item {
          background: #fff; border: 1.5px solid #f1f5f9;
          border-radius: 1.25rem; overflow: hidden; transition: box-shadow .25s, border-color .25s;
        }
        .faq-item:hover { box-shadow: 0 8px 24px rgba(16,185,129,.08); border-color: rgba(16,185,129,.2); }
        .faq-item-open { border-color: rgba(16,185,129,.3); box-shadow: 0 8px 32px rgba(16,185,129,.12); }
        .faq-question {
          width: 100%; padding: 1.25rem 1.5rem; display: flex; align-items: center;
          gap: 1rem; background: none; border: none; cursor: pointer; text-align: left;
        }
        .faq-category-badge {
          background: linear-gradient(135deg,#e63946,#f4a261);
          color: #fff; padding: .25rem .75rem; border-radius: 999px;
          font-size: .7rem; font-weight: 700; white-space: nowrap; flex-shrink: 0;
        }
        .faq-question-text { flex: 1; font-weight: 600; font-size: 1rem; color: #0f172a; }
        .faq-icon {
          width: 32px; height: 32px; border-radius: 50%;
          background: #f1f5f9; display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; color: #10b981; font-weight: bold; transition: background .2s, color .2s; flex-shrink: 0;
        }
        .faq-item-open .faq-icon { background: linear-gradient(135deg,#10b981,#059669); color: #fff; }
        .faq-answer {
          padding: 0 1.5rem 1.5rem; color: #64748b; line-height: 1.7; font-size: .95rem;
          border-top: 1px solid #f1f5f9; padding-top: 1rem; margin-top: -.25rem;
        }

        /* ── EMPTY STATE ── */
        .faq-empty { text-align: center; padding: 4rem 2rem; background: #fff; border-radius: 1.5rem; border: 1.5px solid #f1f5f9; }
        .faq-empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        .faq-empty h3 { color: #0f172a; margin-bottom: .5rem; }
        .faq-empty p { color: #94a3b8; }

        /* ── SIDEBAR ── */
        .faq-sidebar { display: flex; flex-direction: column; gap: 1.5rem; position: sticky; top: 2rem; }
        .faq-sidebar-card {
          background: #fff; border: 1.5px solid #f1f5f9; border-radius: 1.5rem;
          padding: 1.75rem; box-shadow: 0 4px 20px rgba(0,0,0,.04);
        }
        .faq-sidebar-dark {
          background: linear-gradient(160deg,#0d1b2a 0%,#1b2838 100%); border-color: rgba(255,255,255,.08);
          color: #fff;
        }
        .faq-sidebar-intro { margin-bottom: 1.25rem; }
        .faq-sidebar-eyebrow {
          display: inline-block; font-size: .78rem; font-weight: 700;
          letter-spacing: .06em; text-transform: uppercase; margin-bottom: .5rem;
          color: rgba(255,255,255,.6);
        }
        .faq-sidebar-dark .faq-sidebar-eyebrow { color: #38bdf8; }
        .faq-sidebar-card h3 { font-size: 1.15rem; font-weight: 700; margin: 0; }
        .faq-sidebar-dark h3 { color: #fff; }
        .faq-sidebar-desc { color: #64748b; font-size: .9rem; line-height: 1.6; margin: 0 0 1.25rem; }
        .faq-sidebar-dark .faq-sidebar-desc { color: rgba(255,255,255,.65); }

        /* Videos */
        .video-tutorials { display: flex; flex-direction: column; gap: 1rem; }
        .video-card { display: flex; gap: 1rem; cursor: pointer; transition: transform .2s; }
        .video-card:hover { transform: translateX(4px); }
        .video-thumbnail {
          width: 110px; height: 65px; background-size: cover; background-position: center;
          border-radius: .75rem; position: relative; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; border: 1px solid rgba(255,255,255,.1);
        }
        .video-play-button {
          background: rgba(0,0,0,.6); border-radius: 50%; width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center; transition: background .2s;
          backdrop-filter: blur(4px);
        }
        .video-card:hover .video-play-button { background: rgba(230,57,70,.9); }
        .video-duration {
          position: absolute; bottom: 4px; right: 4px;
          background: rgba(0,0,0,.8); color: #fff; padding: 2px 6px;
          border-radius: 4px; font-size: .7rem; font-weight: 600;
        }
        .video-info h4 { margin: 0 0 .25rem 0; font-size: .88rem; color: #fff; }
        .video-info p { margin: 0; font-size: .78rem; color: rgba(255,255,255,.55); line-height: 1.4; }

        /* Guide Button */
        .faq-guide-btn {
          display: flex; align-items: center; justify-content: center; gap: .6rem;
          background: linear-gradient(135deg,#10b981,#059669); color: #fff !important;
          font-size: .9rem; font-weight: 700; padding: .75rem 1.25rem;
          border-radius: .75rem; text-decoration: none !important; border: none;
          transition: opacity .2s, transform .15s;
        }
        .faq-guide-btn:hover { opacity:.88; transform:scale(1.02); }

        /* Contact Options */
        .contact-options { display: flex; flex-direction: column; gap: .75rem; margin-bottom: 1.5rem; }
        .contact-link {
          display: flex; align-items: center; gap: .75rem;
          padding: .75rem 1rem; background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12); border-radius: .75rem;
          text-decoration: none; color: rgba(255,255,255,.9); font-size: .9rem; font-weight: 600;
          transition: background .2s, border-color .2s;
        }
        .contact-link:hover { background: rgba(255,255,255,.15); border-color: rgba(255,255,255,.25); }
        .contact-link.whatsapp { background: #25D366; border-color: #25D366; color: #fff; }
        .contact-link.whatsapp:hover { background: #128C7E; border-color: #128C7E; }
        
        .social-links {
          display: flex; align-items: center; gap: 1rem; padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,.12);
        }
        .social-links span { color: rgba(255,255,255,.5); font-size: .82rem; font-weight: 600; }
        .social-links a { color: rgba(255,255,255,.6); transition: color .2s; }
        .social-links a:hover { color: #fff; }

        @media(max-width:900px){
          .faq-content { grid-template-columns: 1fr; }
          .faq-sidebar { position: static; }
        }
        @media(max-width:600px){
          .faq-question { padding: 1rem; }
          .faq-answer { padding: 0 1rem 1rem; }
        }
      `}</style>
    </main>
  )
}