import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getGuideSupportTickets,
  submitSupportTicketWithScreenshot,
  replySupportTicket,
} from '../apiClient'

const faqCategories = [
  'All', 'Registration', 'Trip Planning', 'Payments', 'Tour Groups',
  'Local Guides', 'Safety', 'Permits', 'Transport', 'App'
]

const faqData = [
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
  { id: 15, category: 'Permits', question: 'Do I need a permit to visit the Chittagong Hill Tracts?', answer: 'Yes, foreign nationals require a permit from the Deputy Commissioner\'s office to visit Rangamati, Bandarban, and Khagrachhari. TripoBD assists in arranging these permits for our tour group members.' },
  { id: 16, category: 'Permits', question: 'How do I get permission for the Sundarbans?', answer: 'To visit the Sundarbans, you need a permit from the Divisional Forest Officer. If you book a TripoBD tour or guide, we handle all necessary permissions and boat clearances for you.' },
  { id: 17, category: 'Transport', question: 'Can I book train or launch tickets through TripoBD?', answer: 'Yes! We partner with Bangladesh Railway and major launch operators. When planning your trip, you can seamlessly book AC/Snigdha train tickets and premium cabin launches directly through the platform.' }
]

export default function TravelerSupport() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')

  const [activeSubTab, setActiveSubTab] = useState('faq') // faq, submit_ticket, my_tickets, rate_app, report_bug, contact
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // 1. FAQ state
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('All')
  const [faqSearchQuery, setFaqSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)

  // 2. Submit ticket state
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketDesc, setTicketDesc] = useState('')
  const [ticketCategory, setTicketCategory] = useState('Trip Planning')
  const [ticketPriority, setTicketPriority] = useState('medium')
  const [ticketScreenshot, setTicketScreenshot] = useState(null)
  const [ticketSubmitting, setTicketSubmitting] = useState(false)

  // 3. My tickets state
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)

  // 4. Rate app state
  const [ratingStars, setRatingStars] = useState(5)
  const [hoverStars, setHoverStars] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  // 5. Report bug state
  const [bugSubject, setBugSubject] = useState('')
  const [bugDesc, setBugDesc] = useState('')
  const [bugScreenshot, setBugScreenshot] = useState(null)
  const [bugSubmitting, setBugSubmitting] = useState(false)

  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!userId) {
      navigate('/signin')
    }
  }, [userId, navigate])

  // Load User tickets
  const loadUserTickets = async () => {
    if (!userId) return
    setTicketsLoading(true)
    setErrorMsg('')
    try {
      const data = await getGuideSupportTickets(userId)
      // Sort by newest created_at first
      const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setTickets(sorted)
      // Keep selected ticket updated with conversation
      if (selectedTicket) {
        const fresh = sorted.find(t => t.id === selectedTicket.id)
        if (fresh) setSelectedTicket(fresh)
      }
    } catch (err) {
      setErrorMsg('Failed to load your support tickets.')
    } finally {
      setTicketsLoading(false)
    }
  }

  useEffect(() => {
    if (activeSubTab === 'my_tickets') {
      loadUserTickets()
    }
  }, [activeSubTab])

  // Poll for message updates on selected ticket
  useEffect(() => {
    if (activeSubTab === 'my_tickets' && selectedTicket && selectedTicket.status !== 'closed') {
      const interval = setInterval(() => {
        loadUserTickets()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [activeSubTab, selectedTicket])

  // Scroll to bottom of chat conversation
  useEffect(() => {
    if (selectedTicket) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedTicket?.conversation])

  // FAQ filtering
  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = selectedFaqCategory === 'All' || faq.category === selectedFaqCategory
    const matchesSearch = faq.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(faqSearchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Submit support ticket handler
  const handleTicketSubmit = async (e) => {
    e.preventDefault()
    if (!ticketSubject.trim() || !ticketDesc.trim()) return
    setTicketSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const formData = new FormData()
      formData.append('subject', ticketSubject)
      formData.append('description', ticketDesc)
      formData.append('category', ticketCategory)
      formData.append('priority', ticketPriority)
      if (ticketScreenshot) {
        formData.append('screenshot', ticketScreenshot)
      }

      await submitSupportTicketWithScreenshot(userId, formData)
      setSuccessMsg('Your support ticket has been filed successfully. Our team will review it shortly.')
      setTicketSubject('')
      setTicketDesc('')
      setTicketCategory('Trip Planning')
      setTicketPriority('medium')
      setTicketScreenshot(null)
      // Reset file input
      const fileInput = document.getElementById('ticket-screenshot-file')
      if (fileInput) fileInput.value = ''
      
      // Auto redirect to history
      setTimeout(() => {
        setSuccessMsg('')
        setActiveSubTab('my_tickets')
      }, 2000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit support ticket.')
    } finally {
      setTicketSubmitting(false)
    }
  }

  // Submit user reply handler
  const handleUserReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicket) return
    setReplySubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const updated = await replySupportTicket(userId, {
        ticket_id: selectedTicket.id,
        action: 'reply',
        reply_text: replyText
      })
      setReplyText('')
      setSelectedTicket(updated)
      // Update in main list
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reply.')
    } finally {
      setReplySubmitting(false)
    }
  }

  // Submit app rating feedback handler
  const handleRatingSubmit = async (e) => {
    e.preventDefault()
    setRatingSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const formData = new FormData()
      formData.append('subject', `App Rating: ${ratingStars} / 5 Stars`)
      formData.append('description', ratingFeedback || 'No written comments provided.')
      formData.append('category', 'App Feedback')
      formData.append('priority', 'low')

      await submitSupportTicketWithScreenshot(userId, formData)
      setSuccessMsg('Thank you for rating our application! We appreciate your valuable feedback.')
      setRatingFeedback('')
      setRatingStars(5)
      
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit rating feedback.')
    } finally {
      setRatingSubmitting(false)
    }
  }

  // Submit bug report handler
  const handleBugSubmit = async (e) => {
    e.preventDefault()
    if (!bugSubject.trim() || !bugDesc.trim()) return
    setBugSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const formData = new FormData()
      formData.append('subject', `Bug Report: ${bugSubject}`)
      formData.append('description', bugDesc)
      formData.append('category', 'Bug Report')
      formData.append('priority', 'high')
      if (bugScreenshot) {
        formData.append('screenshot', bugScreenshot)
      }

      await submitSupportTicketWithScreenshot(userId, formData)
      setSuccessMsg('Thank you for reporting this issue. Our engineers will look into it as soon as possible.')
      setBugSubject('')
      setBugDesc('')
      setBugScreenshot(null)
      // Reset file input
      const fileInput = document.getElementById('bug-screenshot-file')
      if (fileInput) fileInput.value = ''
      
      setTimeout(() => {
        setSuccessMsg('')
        setActiveSubTab('my_tickets')
      }, 2000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to file bug report.')
    } finally {
      setBugSubmitting(false)
    }
  }

  return (
    <main className="page-shell tr-support-shell">
      <div className="support-banner">
        <div className="banner-bg" />
        <div className="banner-content">
          <h1>🛟 Traveler Help & Support Desk</h1>
          <p>Browse detailed FAQs, get in touch with our operators, file safety tickets, or share your valuable application suggestions.</p>
        </div>
      </div>

      <div className="support-nav-container">
        <div className="support-tabs-bar">
          <button onClick={() => setActiveSubTab('faq')} className={`tab-nav-btn ${activeSubTab === 'faq' ? 'active' : ''}`}>
            ❓ In-App FAQ
          </button>
          <button onClick={() => setActiveSubTab('submit_ticket')} className={`tab-nav-btn ${activeSubTab === 'submit_ticket' ? 'active' : ''}`}>
            ➕ Submit Ticket
          </button>
          <button onClick={() => setActiveSubTab('my_tickets')} className={`tab-nav-btn ${activeSubTab === 'my_tickets' ? 'active' : ''}`}>
            📋 My Tickets {tickets.length > 0 && `(${tickets.length})`}
          </button>
          <button onClick={() => setActiveSubTab('rate_app')} className={`tab-nav-btn ${activeSubTab === 'rate_app' ? 'active' : ''}`}>
            ⭐ Rate App
          </button>
          <button onClick={() => setActiveSubTab('report_bug')} className={`tab-nav-btn ${activeSubTab === 'report_bug' ? 'active' : ''}`}>
            🐛 Report Bug
          </button>
          <button onClick={() => setActiveSubTab('contact')} className={`tab-nav-btn ${activeSubTab === 'contact' ? 'active' : ''}`}>
            📞 Contact Us
          </button>
        </div>
      </div>

      {errorMsg && <div className="support-alert error-alert">{errorMsg}</div>}
      {successMsg && <div className="support-alert success-alert">{successMsg}</div>}

      <div className="support-pane-wrapper">
        {/* SUB-TAB 1: FAQs */}
        {activeSubTab === 'faq' && (
          <div className="tab-pane-content faq-pane">
            <div className="faq-search-wrapper">
              <input
                type="text"
                placeholder="Search FAQs... e.g. payments, permits, safety"
                value={faqSearchQuery}
                onChange={e => setFaqSearchQuery(e.target.value)}
                className="faq-input-bar"
              />
            </div>
            
            <div className="faq-categories-row">
              {faqCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedFaqCategory(cat)}
                  className={`faq-cat-pill ${selectedFaqCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="faq-items-list">
              {filteredFaqs.length === 0 ? (
                <p className="no-items-text">No FAQ matches found. Try searching for other keywords.</p>
              ) : (
                filteredFaqs.map(faq => (
                  <div key={faq.id} className={`faq-collapsible-item ${expandedFaq === faq.id ? 'open' : ''}`}>
                    <button onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)} className="faq-trigger-btn">
                      <span className="faq-cat-badge">{faq.category}</span>
                      <span className="faq-q-text">{faq.question}</span>
                      <span className="faq-arrow">{expandedFaq === faq.id ? '▲' : '▼'}</span>
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="faq-body-content">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUB-TAB 2: SUBMIT TICKET */}
        {activeSubTab === 'submit_ticket' && (
          <div className="tab-pane-content form-pane">
            <div className="support-card-form">
              <h3>Create a New Support Ticket</h3>
              <p className="form-subtext">Is something not working, or do you have a regional permit safety emergency? Drop a ticket to our 24/7 admin desk.</p>
              
              <form onSubmit={handleTicketSubmit} className="ticket-form">
                <div className="form-row">
                  <label>
                    Ticket Category
                    <select value={ticketCategory} onChange={e => setTicketCategory(e.target.value)}>
                      <option value="Registration">Registration</option>
                      <option value="Trip Planning">Trip Planning</option>
                      <option value="Payments">Payments</option>
                      <option value="Tour Groups">Tour Groups</option>
                      <option value="Local Guides">Local Guides</option>
                      <option value="Safety">Safety & Permits</option>
                      <option value="Transport">Transport</option>
                      <option value="General">Other / General</option>
                    </select>
                  </label>

                  <label>
                    Priority level
                    <select value={ticketPriority} onChange={e => setTicketPriority(e.target.value)}>
                      <option value="low">Low (Standard Question)</option>
                      <option value="medium">Medium (Issue Preventing Action)</option>
                      <option value="high">High (Payments or Safety Emergency)</option>
                    </select>
                  </label>
                </div>

                <label>
                  Issue Subject
                  <input
                    type="text"
                    required
                    placeholder="e.g. Double Payment deduction via bKash"
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                  />
                </label>

                <label>
                  Describe Your Problem
                  <textarea
                    rows={6}
                    required
                    placeholder="Provide detailed description of what happened..."
                    value={ticketDesc}
                    onChange={e => setTicketDesc(e.target.value)}
                  ></textarea>
                </label>

                <label className="file-upload-wrapper">
                  Attach Screenshot (Optional)
                  <input
                    id="ticket-screenshot-file"
                    type="file"
                    accept="image/*"
                    onChange={e => setTicketScreenshot(e.target.files[0])}
                  />
                </label>

                <button type="submit" disabled={ticketSubmitting} className="button button-primary submit-btn">
                  {ticketSubmitting ? 'Filing Ticket...' : 'File Support Ticket'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: MY TICKETS */}
        {activeSubTab === 'my_tickets' && (
          <div className="tab-pane-content tickets-ledger-pane">
            {ticketsLoading && tickets.length === 0 ? (
              <p className="loading-txt">Loading your support tickets log...</p>
            ) : tickets.length === 0 ? (
              <div className="empty-ledger-view">
                <span className="icon">🎫</span>
                <h4>No support history found</h4>
                <p>You haven't submitted any support requests yet. When you file a ticket, it will appear here.</p>
              </div>
            ) : (
              <div className="tickets-ledger-grid">
                {/* Left pane: tickets list */}
                <div className="ledger-sidebar">
                  {tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`ledger-item-card ${selectedTicket?.id === ticket.id ? 'active' : ''}`}
                    >
                      <div className="item-header">
                        <span className={`badge priority-${ticket.priority}`}>{ticket.priority}</span>
                        <span className="date">{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4>{ticket.subject}</h4>
                      <div className="item-footer">
                        <span className="category">{ticket.category}</span>
                        <span className={`badge status-${ticket.status}`}>{ticket.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right pane: ticket active thread */}
                <div className="active-thread-container">
                  {selectedTicket ? (
                    <div className="active-thread-details">
                      <div className="thread-header">
                        <div>
                          <h2>{selectedTicket.subject}</h2>
                          <div className="meta">
                            <span>Ticket ID: <strong>#{selectedTicket.id}</strong></span>
                            <span>Category: <strong>{selectedTicket.category}</strong></span>
                          </div>
                        </div>
                        <span className={`badge status-pill-${selectedTicket.status}`}>{selectedTicket.status}</span>
                      </div>

                      <div className="description-callout">
                        <h5>Your Initial Complaint:</h5>
                        <p>"{selectedTicket.description}"</p>
                        {selectedTicket.screenshot && (
                          <div className="attached-screenshot">
                            <span className="label">Attached File:</span>
                            <a href={selectedTicket.screenshot} target="_blank" rel="noopener noreferrer">
                              <img src={selectedTicket.screenshot} alt="Attachment" />
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="messages-history">
                        {selectedTicket.conversation && selectedTicket.conversation.length > 0 ? (
                          selectedTicket.conversation.map((msg, idx) => (
                            <div key={idx} className={`msg-card-row ${msg.sender === 'admin' ? 'admin' : 'user'}`}>
                              <div className="msg-card">
                                <div className="card-top">
                                  <strong>{msg.sender === 'admin' ? 'TripoBD Support' : 'You'}</strong>
                                  <span>{new Date(msg.timestamp).toLocaleString()}</span>
                                </div>
                                <p>{msg.message}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-thread">
                            <p>No chat history yet. A support agent will review your issue shortly.</p>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {selectedTicket.status !== 'closed' ? (
                        <form onSubmit={handleUserReply} className="thread-reply-form">
                          <textarea
                            rows={3}
                            required
                            placeholder="Type a follow-up reply to support..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                          ></textarea>
                          <button type="submit" disabled={replySubmitting || !replyText.trim()} className="button button-primary">
                            {replySubmitting ? 'Sending...' : 'Send Reply'}
                          </button>
                        </form>
                      ) : (
                        <div className="ticket-closed-callout">
                          🔒 This support ticket is marked as resolved and closed. If you have further issues, please submit a new ticket.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-ticket-selected">
                      <span className="icon">💬</span>
                      <h4>No Support Ticket Selected</h4>
                      <p>Select a ticket from the list on the left to see conversation messages and write follow-up replies.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 4: RATE THE APP */}
        {activeSubTab === 'rate_app' && (
          <div className="tab-pane-content rate-pane">
            <div className="support-card-form rating-card">
              <h3>Enjoying TripoBD? Rate Our App!</h3>
              <p className="form-subtext">We are continuously tuning the platform to make traveling across Bangladesh easy. Share your experience with us.</p>
              
              <form onSubmit={handleRatingSubmit} className="rating-form">
                <div className="stars-row-container">
                  {[1, 2, 3, 4, 5].map(starNum => {
                    const isActive = hoverStars ? starNum <= hoverStars : starNum <= ratingStars
                    return (
                      <span
                        key={starNum}
                        onMouseEnter={() => setHoverStars(starNum)}
                        onMouseLeave={() => setHoverStars(0)}
                        onClick={() => setRatingStars(starNum)}
                        className={`star-icon ${isActive ? 'filled' : ''}`}
                      >
                        ★
                      </span>
                    )
                  })}
                </div>
                <p className="rating-desc-label">
                  {ratingStars === 5 && '😍 Outstanding! I love using TripoBD.'}
                  {ratingStars === 4 && '😊 Great! Works smoothly.'}
                  {ratingStars === 3 && '😐 Average. Could be improved.'}
                  {ratingStars === 2 && '🙁 Poor. Needs many fixes.'}
                  {ratingStars === 1 && '😡 Very Bad. It is unusable.'}
                </p>

                <label>
                  Tell us what you think (Optional)
                  <textarea
                    rows={4}
                    placeholder="What features do you like? Where can we do better?"
                    value={ratingFeedback}
                    onChange={e => setRatingFeedback(e.target.value)}
                  ></textarea>
                </label>

                <button type="submit" disabled={ratingSubmitting} className="button button-primary submit-btn">
                  {ratingSubmitting ? 'Submitting...' : 'Submit App Rating'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SUB-TAB 5: REPORT A BUG */}
        {activeSubTab === 'report_bug' && (
          <div className="tab-pane-content form-pane">
            <div className="support-card-form bug-card">
              <h3>Report a Platform Bug</h3>
              <p className="form-subtext">Help us make TripoBD bug-free. Describe what you were trying to do, what happened, and attach a screenshot if you can.</p>

              <form onSubmit={handleBugSubmit} className="bug-form">
                <label>
                  Bug Title / Summary
                  <input
                    type="text"
                    required
                    placeholder="e.g. Recommended cards overlap on mobile screens"
                    value={bugSubject}
                    onChange={e => setBugSubject(e.target.value)}
                  />
                </label>

                <label>
                  Describe the Bug & Steps to Reproduce
                  <textarea
                    rows={5}
                    required
                    placeholder="1. Navigate to dashboard&#10;2. Click on custom room...&#10;3. The page crashed"
                    value={bugDesc}
                    onChange={e => setBugDesc(e.target.value)}
                  ></textarea>
                </label>

                <label className="file-upload-wrapper">
                  Screenshot of the Bug (Optional)
                  <input
                    id="bug-screenshot-file"
                    type="file"
                    accept="image/*"
                    onChange={e => setBugScreenshot(e.target.files[0])}
                  />
                </label>

                <button type="submit" disabled={bugSubmitting} className="button button-primary submit-btn">
                  {bugSubmitting ? 'Submitting Bug Report...' : 'File Bug Report'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SUB-TAB 6: CONTACT CARDS */}
        {activeSubTab === 'contact' && (
          <div className="tab-pane-content contact-pane">
            <div className="contact-headline">
              <h3>Get In Touch Directly</h3>
              <p>Still need help? Our support team is online 24/7 to solve your travel concerns.</p>
            </div>

            <div className="contact-methods-grid">
              <div className="contact-card border-card">
                <div className="icon-wrap">📧</div>
                <h4>Email Support</h4>
                <p>Drop a detailed email with attachments and booking receipts.</p>
                <a href="mailto:support@tripobd.com" className="contact-action-btn">
                  support@tripobd.com
                </a>
              </div>

              <div className="contact-card whatsapp-card">
                <div className="icon-wrap">💬</div>
                <h4>WhatsApp Live</h4>
                <p>Chat directly with our Dhaka-based dispatch agents.</p>
                <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="contact-action-btn">
                  Open WhatsApp Chat
                </a>
              </div>
            </div>

            <div className="social-follow-card">
              <h4>Follow TripoBD on Social Media</h4>
              <p>Get the latest updates on regional travel restrictions, hiking permit requirements, and seasonal discounts.</p>
              <div className="social-links-row">
                <a href="#" className="social-icon fb" aria-label="Facebook">Facebook</a>
                <a href="#" className="social-icon insta" aria-label="Instagram">Instagram</a>
                <a href="#" className="social-icon yt" aria-label="YouTube">YouTube</a>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .tr-support-shell {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        /* Banner styling */
        .support-banner {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          padding: 3.5rem 2rem;
          color: white;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .support-banner .banner-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          z-index: 0;
        }
        .support-banner .banner-content {
          position: relative;
          z-index: 1;
          max-width: 700px;
        }
        .support-banner h1 {
          font-size: 2.2rem;
          font-weight: 850;
          margin: 0 0 0.50rem 0;
          letter-spacing: -0.02em;
        }
        .support-banner p {
          font-size: 1.05rem;
          color: #94a3b8;
          line-height: 1.5;
          margin: 0;
        }

        /* Navigation Tab Bar */
        .support-nav-container {
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        }
        .support-tabs-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .tab-nav-btn {
          background: transparent;
          border: none;
          padding: 0.6rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 750;
          color: #64748b;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .tab-nav-btn:hover {
          background: #f8fafc;
          color: #0f172a;
        }
        .tab-nav-btn.active {
          background: linear-gradient(90deg, #5b8cff, #6ee7b7);
          color: white;
          box-shadow: 0 4px 12px rgba(91, 140, 255, 0.25);
        }

        /* Common Alerts */
        .support-alert {
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 2rem;
          font-weight: 700;
          font-size: 0.95rem;
        }
        .error-alert {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fca5a5;
        }
        .success-alert {
          background: #dcfce7;
          color: #16a34a;
          border: 1px solid #86efac;
        }

        /* Pane Wrapper */
        .support-pane-wrapper {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
          min-height: 480px;
        }

        /* 1. FAQ Tab Styles */
        .faq-search-wrapper {
          margin-bottom: 1.5rem;
        }
        .faq-input-bar {
          width: 100%;
          padding: 0.85rem 1.25rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          outline: none;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .faq-input-bar:focus {
          border-color: #5b8cff;
        }
        .faq-categories-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2rem;
          justify-content: center;
        }
        .faq-cat-pill {
          background: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 700;
          border-radius: 99px;
          padding: 0.45rem 1.1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .faq-cat-pill:hover {
          border-color: #5b8cff;
          color: #5b8cff;
        }
        .faq-cat-pill.active {
          background: #0f172a;
          border-color: #0f172a;
          color: white;
        }
        .faq-items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .faq-collapsible-item {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .faq-collapsible-item:hover {
          border-color: #cbd5e1;
        }
        .faq-collapsible-item.open {
          border-color: #5b8cff;
        }
        .faq-trigger-btn {
          width: 100%;
          padding: 1.2rem;
          background: white;
          border: none;
          display: flex;
          align-items: center;
          gap: 1rem;
          text-align: left;
          cursor: pointer;
        }
        .faq-cat-badge {
          background: #f1f5f9;
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .faq-q-text {
          flex: 1;
          font-weight: 750;
          font-size: 0.98rem;
          color: #0f172a;
        }
        .faq-arrow {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .faq-body-content {
          padding: 1rem 1.2rem 1.2rem 1.2rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          font-size: 0.92rem;
          line-height: 1.6;
          color: #475569;
        }

        /* Forms Layout (Submit ticket & Bug) */
        .support-card-form {
          max-width: 680px;
          margin: 0 auto;
        }
        .support-card-form h3 {
          font-size: 1.5rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 0.4rem 0;
        }
        .form-subtext {
          color: #64748b;
          font-size: 0.92rem;
          margin: 0 0 2rem 0;
          line-height: 1.5;
        }
        .ticket-form, .bug-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .form-row {
          display: flex;
          gap: 1rem;
        }
        .form-row label {
          flex: 1;
        }
        label {
          display: flex;
          flex-direction: column;
          font-weight: 800;
          font-size: 0.88rem;
          color: #475569;
          gap: 0.5rem;
        }
        input, select, textarea {
          padding: 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
          background: white;
          transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
          border-color: #5b8cff;
        }
        .file-upload-wrapper input {
          border: 1px dashed #cbd5e1;
          background: #f8fafc;
          padding: 1rem;
          cursor: pointer;
          border-radius: 8px;
        }
        .submit-btn {
          align-self: flex-start;
          padding: 0.85rem 1.8rem;
          font-weight: 800;
          margin-top: 1rem;
        }

        /* 3. My Tickets Ledger Tab Styles */
        .tickets-ledger-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          background: white;
          min-height: 520px;
        }
        .ledger-sidebar {
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          padding: 1rem;
          overflow-y: auto;
          max-height: 580px;
        }
        .ledger-item-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ledger-item-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        }
        .ledger-item-card.active {
          border-color: #5b8cff;
          background: #f3f7ff;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .item-header .date {
          color: #94a3b8;
        }
        .ledger-item-card h4 {
          font-size: 0.9rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          line-height: 1.35;
        }
        .item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
        }
        .item-footer .category {
          color: #8b5cf6;
          font-weight: 700;
        }
        .badge {
          font-size: 0.65rem;
          font-weight: 850;
          text-transform: uppercase;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
        }
        .priority-high { background: #fee2e2; color: #dc2626; }
        .priority-medium { background: #fef3c7; color: #d97706; }
        .priority-low { background: #f1f5f9; color: #475569; }
        
        .status-open { color: #22c55e; font-weight: 800; }
        .status-in_progress { color: #f59e0b; font-weight: 800; }
        .status-closed { color: #64748b; font-weight: 800; }

        /* Active Thread (Right Panel) */
        .active-thread-container {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .no-ticket-selected {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #94a3b8;
          padding: 3rem;
        }
        .no-ticket-selected .icon { font-size: 3.5rem; margin-bottom: 1rem; }
        .no-ticket-selected h4 { color: #334155; font-size: 1.2rem; margin-bottom: 0.5rem; }

        .active-thread-details {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: 100%;
        }
        .thread-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1rem;
        }
        .thread-header h2 { font-size: 1.25rem; font-weight: 850; margin: 0 0 0.35rem 0; }
        .thread-header .meta { display: flex; gap: 1rem; font-size: 0.78rem; color: #64748b; }
        
        .status-pill-open { background: #dcfce7; color: #15803d; }
        .status-pill-in_progress { background: #fef3c7; color: #b45309; }
        .status-pill-closed { background: #f1f5f9; color: #475569; }

        .description-callout {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
        }
        .description-callout h5 { font-size: 0.8rem; font-weight: 800; color: #475569; margin: 0 0 0.35rem 0; text-transform: uppercase; }
        .description-callout p { margin: 0 0 0.75rem 0; font-size: 0.92rem; color: #334155; line-height: 1.45; }
        
        .attached-screenshot img {
          max-width: 140px;
          max-height: 90px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          margin-top: 0.35rem;
          cursor: pointer;
        }
        .attached-screenshot .label { display: block; font-size: 0.75rem; color: #64748b; font-weight: 700; }

        .messages-history {
          flex: 1;
          overflow-y: auto;
          max-height: 280px;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .msg-card-row { display: flex; width: 100%; }
        .msg-card-row.admin { justify-content: justify; }
        .msg-card-row.user { justify-content: flex-end; }
        .msg-card {
          max-width: 85%;
          background: white;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .msg-card-row.admin .msg-card {
          background: #f3f4f6;
          border-left: 3px solid #5b8cff;
        }
        .msg-card-row.user .msg-card {
          background: #0f172a;
          color: white;
        }
        .card-top { display: flex; justify-content: space-between; font-size: 0.68rem; margin-bottom: 0.25rem; opacity: 0.75; font-weight: 700; gap: 1.5rem; }
        .msg-card p { margin: 0; font-size: 0.88rem; line-height: 1.4; white-space: pre-wrap; }

        .thread-reply-form {
          border-top: 1px solid #e2e8f0;
          padding-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .thread-reply-form textarea { width: 100%; resize: none; }
        .thread-reply-form button { align-self: flex-end; padding: 0.55rem 1.4rem; font-weight: 850; }
        
        .ticket-closed-callout {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          padding: 0.85rem 1.25rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 750;
        }

        /* 4. Rating stars tab */
        .rating-card { text-align: center; }
        .stars-row-container {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin: 1.5rem 0 0.5rem 0;
        }
        .star-icon {
          font-size: 3rem;
          color: #cbd5e1;
          cursor: pointer;
          user-select: none;
          transition: color 0.15s, transform 0.1s;
        }
        .star-icon:hover {
          transform: scale(1.15);
        }
        .star-icon.filled {
          color: #f59e0b;
        }
        .rating-desc-label {
          font-size: 1.05rem;
          font-weight: 750;
          color: #1e293b;
          margin-bottom: 2rem;
        }
        .rating-form { text-align: left; max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.2rem; }

        /* 6. Contact Cards */
        .contact-headline { text-align: center; margin-bottom: 2.5rem; }
        .contact-headline h3 { font-size: 1.6rem; font-weight: 850; color: #0f172a; margin-bottom: 0.5rem; }
        .contact-headline p { color: #64748b; font-size: 0.95rem; }

        .contact-methods-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .contact-card {
          padding: 2rem;
          text-align: center;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .contact-card.border-card { border: 1.5px solid #e2e8f0; }
        .contact-card.whatsapp-card {
          border: 1.5px solid #22c55e;
          background: #f0fdf4;
        }
        .contact-card .icon-wrap { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .contact-card h4 { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; }
        .contact-card p { font-size: 0.88rem; color: #64748b; line-height: 1.45; margin: 0 0 1.5rem 0; }
        
        .contact-action-btn {
          display: inline-block;
          padding: 0.65rem 1.5rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        .border-card .contact-action-btn { background: #0f172a; color: white !important; }
        .border-card .contact-action-btn:hover { background: #334155; }
        
        .whatsapp-card .contact-action-btn { background: #22c55e; color: white !important; }
        .whatsapp-card .contact-action-btn:hover { background: #16a34a; }

        .social-follow-card {
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 2rem;
        }
        .social-follow-card h4 { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 0.35rem; }
        .social-follow-card p { color: #64748b; font-size: 0.88rem; max-width: 600px; margin: 0 auto 1.5rem auto; line-height: 1.45; }
        .social-links-row { display: flex; justify-content: center; gap: 1rem; }
        .social-icon {
          display: inline-block;
          padding: 0.5rem 1.2rem;
          border-radius: 8px;
          font-weight: 750;
          font-size: 0.85rem;
          text-decoration: none;
          background: #f1f5f9;
          color: #475569 !important;
          transition: all 0.2s;
        }
        .social-icon:hover { background: #e2e8f0; color: #0f172a !important; }

        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 1.2rem; }
          .contact-methods-grid { grid-template-columns: 1fr; }
          .tickets-ledger-grid { grid-template-columns: 1fr; }
          .ledger-sidebar { max-height: 240px; border-right: none; border-bottom: 1px solid #e2e8f0; }
        }
      `}</style>
    </main>
  )
}
