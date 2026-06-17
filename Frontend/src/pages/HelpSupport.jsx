import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getTravelerSupportTickets,
  submitTravelerSupportTicket,
  getTravelerSupportTicketDetail,
  submitTravelerFeedback,
  submitTravelerBugReport,
  getFaqsList,
  getFaqCategories,
  getVideoTutorials,
} from '../apiClient'

export default function HelpSupport() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')
  
  const [activeTab, setActiveTab] = useState('faq')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // FAQ
  const [faqCategories, setFaqCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [faqs, setFaqs] = useState([])
  const [faqSearch, setFaqSearch] = useState('')
  
  // Support Tickets
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  })
  
  // Feedback
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    feedback: '',
    category: 'general',
  })
  
  // Bug Report
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    screenshot: null,
  })
  
  // Video Tutorials
  const [tutorials, setTutorials] = useState([])
  
  useEffect(() => {
    if (!userId) {
      navigate('/signin')
      return
    }
    loadFaqCategories()
    loadFaqs()
    loadTickets()
    loadTutorials()
  }, [userId])
  
  useEffect(() => {
    loadFaqs()
  }, [selectedCategory, faqSearch])
  
  const loadFaqCategories = async () => {
    try {
      const data = await getFaqCategories()
      setFaqCategories(data)
    } catch (err) {
      console.error('Failed to load FAQ categories')
    }
  }
  
  const loadFaqs = async () => {
    try {
      const data = await getFaqsList({ category: selectedCategory, search: faqSearch })
      setFaqs(data)
    } catch (err) {
      console.error('Failed to load FAQs')
      setFaqs([]) // Set empty array to prevent crashes
    }
  }
  
  const loadTickets = async () => {
    try {
      const data = await getTravelerSupportTickets(userId)
      setTickets(data)
    } catch (err) {
      console.error('Failed to load support tickets')
      setTickets([]) // Set empty array to prevent crashes
    }
  }
  
  const loadTicketDetail = async (ticketId) => {
    try {
      const data = await getTravelerSupportTicketDetail(userId, ticketId)
      setSelectedTicket(data)
    } catch (err) {
      setError('Failed to load ticket details')
    }
  }
  
  const loadTutorials = async () => {
    try {
      const data = await getVideoTutorials()
      setTutorials(data)
    } catch (err) {
      console.error('Failed to load video tutorials')
      setTutorials([]) // Set empty array to prevent crashes
    }
  }
  
  const handleSubmitTicket = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      await submitTravelerSupportTicket(userId, ticketForm)
      setSuccessMsg('Support ticket submitted successfully!')
      setTicketForm({ subject: '', description: '', category: 'general', priority: 'medium' })
      loadTickets()
    } catch (err) {
      setError('Failed to submit support ticket')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      await submitTravelerFeedback(userId, feedbackForm)
      setSuccessMsg('Thank you for your feedback!')
      setFeedbackForm({ rating: 5, feedback: '', category: 'general' })
    } catch (err) {
      setError('Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmitBugReport = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('title', bugForm.title)
      formData.append('description', bugForm.description)
      formData.append('severity', bugForm.severity)
      if (bugForm.screenshot) {
        formData.append('screenshot', bugForm.screenshot)
      }
      
      await submitTravelerBugReport(userId, formData)
      setSuccessMsg('Bug report submitted successfully!')
      setBugForm({ title: '', description: '', severity: 'medium', screenshot: null })
    } catch (err) {
      setError('Failed to submit bug report')
    } finally {
      setLoading(false)
    }
  }
  
  if (!userId) return null
  
  return (
    <main className="page-shell help-support-page-shell">
      {error && <div className="profile-alert error">{error}</div>}
      {successMsg && <div className="profile-alert success">{successMsg}</div>}

      <header className="help-support-page-header">
        <h1>Help & Support</h1>
        <p>Get help with your TripoBD experience</p>
      </header>

      <div className="help-support-container">
        <aside className="help-sidebar">
          <h2>Help & Support</h2>
          <nav>
            <button 
              className={activeTab === 'faq' ? 'active' : ''} 
              onClick={() => setActiveTab('faq')}
            >
              ❓ FAQ
            </button>
            <button 
              className={activeTab === 'tickets' ? 'active' : ''} 
              onClick={() => setActiveTab('tickets')}
            >
              🎫 Support Tickets
            </button>
            <button 
              className={activeTab === 'tutorials' ? 'active' : ''} 
              onClick={() => setActiveTab('tutorials')}
            >
              📹 Video Tutorials
            </button>
            <button 
              className={activeTab === 'feedback' ? 'active' : ''} 
              onClick={() => setActiveTab('feedback')}
            >
              ⭐ Rate App
            </button>
            <button 
              className={activeTab === 'bug' ? 'active' : ''} 
              onClick={() => setActiveTab('bug')}
            >
              🐛 Report Bug
            </button>
            <button 
              className={activeTab === 'contact' ? 'active' : ''} 
              onClick={() => setActiveTab('contact')}
            >
              📧 Contact Us
            </button>
          </nav>
        </aside>
        
        <section className="help-content">
          {activeTab === 'faq' && (
            <div className="help-section">
              <h3>Frequently Asked Questions</h3>
              
              <div className="faq-controls">
                <div className="faq-search">
                  <input 
                    type="text"
                    placeholder="Search FAQs..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                  />
                </div>
                <div className="faq-categories">
                  <button 
                    className={selectedCategory === 'All' ? 'active' : ''}
                    onClick={() => setSelectedCategory('All')}
                  >
                    All
                  </button>
                  {faqCategories.map((cat) => (
                    <button 
                      key={cat.id}
                      className={selectedCategory === cat.name ? 'active' : ''}
                      onClick={() => setSelectedCategory(cat.name)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="faq-list">
                {faqs.length === 0 ? (
                  <p className="community-muted">No FAQs found</p>
                ) : (
                  faqs.map((faq) => (
                    <div key={faq.id} className="faq-item">
                      <h4>{faq.question}</h4>
                      <p>{faq.answer}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'tickets' && (
            <div className="help-section">
              <h3>Support Tickets</h3>
              
              {selectedTicket ? (
                <div className="ticket-detail">
                  <button className="back-button" onClick={() => setSelectedTicket(null)}>
                    ← Back to Tickets
                  </button>
                  <div className="ticket-header">
                    <h4>{selectedTicket.subject}</h4>
                    <span className={`ticket-status ${selectedTicket.status}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="ticket-meta">
                    <span>Category: {selectedTicket.category}</span>
                    <span>Priority: {selectedTicket.priority}</span>
                    <span>Created: {new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="ticket-description">
                    <h5>Description</h5>
                    <p>{selectedTicket.description}</p>
                  </div>
                  {selectedTicket.conversation && selectedTicket.conversation.length > 0 && (
                    <div className="ticket-conversation">
                      <h5>Conversation</h5>
                      {selectedTicket.conversation.map((msg, idx) => (
                        <div key={idx} className={`conversation-message ${msg.role}`}>
                          <strong>{msg.role}:</strong>
                          <p>{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="ticket-form">
                    <h4>Submit New Ticket</h4>
                    <form onSubmit={handleSubmitTicket}>
                      <div className="form-group">
                        <label>Subject</label>
                        <input 
                          type="text"
                          placeholder="Brief description of your issue"
                          value={ticketForm.subject}
                          onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Category</label>
                          <select 
                            value={ticketForm.category}
                            onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                          >
                            <option value="general">General</option>
                            <option value="booking">Booking</option>
                            <option value="payment">Payment</option>
                            <option value="technical">Technical</option>
                            <option value="account">Account</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Priority</label>
                          <select 
                            value={ticketForm.priority}
                            onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea 
                          placeholder="Detailed description of your issue"
                          value={ticketForm.description}
                          onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                          rows="5"
                          required
                        />
                      </div>
                      <button type="submit" className="button button-primary" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Ticket'}
                      </button>
                    </form>
                  </div>
                  
                  <div className="tickets-list">
                    <h4>My Tickets ({tickets.length})</h4>
                    {tickets.length === 0 ? (
                      <p className="community-muted">No support tickets yet</p>
                    ) : (
                      tickets.map((ticket) => (
                        <div key={ticket.id} className="ticket-item" onClick={() => loadTicketDetail(ticket.id)}>
                          <div className="ticket-item-header">
                            <h5>{ticket.subject}</h5>
                            <span className={`ticket-status ${ticket.status}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="ticket-item-meta">
                            <span>{ticket.category}</span>
                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          {activeTab === 'tutorials' && (
            <div className="help-section">
              <h3>Video Tutorials</h3>
              
              <div className="tutorials-grid">
                {tutorials.length === 0 ? (
                  <p className="community-muted">No tutorials available</p>
                ) : (
                  tutorials.map((tutorial) => (
                    <div key={tutorial.id} className="tutorial-card">
                      <div className="tutorial-thumbnail">
                        <img src={tutorial.thumbnail} alt={tutorial.title} />
                        <span className="tutorial-duration">{tutorial.duration}</span>
                      </div>
                      <div className="tutorial-info">
                        <h4>{tutorial.title}</h4>
                        <p>{tutorial.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'feedback' && (
            <div className="help-section">
              <h3>Rate the App</h3>
              
              <form onSubmit={handleSubmitFeedback}>
                <div className="form-group">
                  <label>Overall Rating</label>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={star <= feedbackForm.rating ? 'active' : ''}
                        onClick={() => setFeedbackForm({...feedbackForm, rating: star})}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm({...feedbackForm, category: e.target.value})}
                  >
                    <option value="general">General</option>
                    <option value="features">Features</option>
                    <option value="ui">User Interface</option>
                    <option value="performance">Performance</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Your Feedback</label>
                  <textarea 
                    placeholder="Tell us what you think about TripoBD..."
                    value={feedbackForm.feedback}
                    onChange={(e) => setFeedbackForm({...feedbackForm, feedback: e.target.value})}
                    rows="5"
                    required
                  />
                </div>
                <button type="submit" className="button button-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          )}
          
          {activeTab === 'bug' && (
            <div className="help-section">
              <h3>Report a Bug</h3>
              
              <form onSubmit={handleSubmitBugReport}>
                <div className="form-group">
                  <label>Bug Title</label>
                  <input 
                    type="text"
                    placeholder="Brief title of the bug"
                    value={bugForm.title}
                    onChange={(e) => setBugForm({...bugForm, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Severity</label>
                  <select 
                    value={bugForm.severity}
                    onChange={(e) => setBugForm({...bugForm, severity: e.target.value})}
                  >
                    <option value="low">Low - Minor inconvenience</option>
                    <option value="medium">Medium - Affects functionality</option>
                    <option value="high">High - Major issue</option>
                    <option value="critical">Critical - App unusable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    placeholder="Describe the bug in detail, including steps to reproduce..."
                    value={bugForm.description}
                    onChange={(e) => setBugForm({...bugForm, description: e.target.value})}
                    rows="5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Screenshot (Optional)</label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        setBugForm({...bugForm, screenshot: file})
                      }
                    }}
                  />
                  <small>Upload a screenshot to help us understand the issue better</small>
                </div>
                <button type="submit" className="button button-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Bug Report'}
                </button>
              </form>
            </div>
          )}
          
          {activeTab === 'contact' && (
            <div className="help-section">
              <h3>Contact Us</h3>
              
              <div className="contact-info">
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <div>
                    <h4>Email</h4>
                    <p>support@tripobd.com</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <div>
                    <h4>Phone</h4>
                    <p>+880 1234-567890</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🕐</span>
                  <div>
                    <h4>Support Hours</h4>
                    <p>Saturday - Thursday: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
              
              <div className="social-links">
                <h4>Follow Us</h4>
                <div className="social-buttons">
                  <a href="https://facebook.com/tripobd" target="_blank" rel="noopener noreferrer">
                    Facebook
                  </a>
                  <a href="https://twitter.com/tripobd" target="_blank" rel="noopener noreferrer">
                    Twitter
                  </a>
                  <a href="https://instagram.com/tripobd" target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                  <a href="https://youtube.com/tripobd" target="_blank" rel="noopener noreferrer">
                    YouTube
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      
      <style>{`
        main.help-support-page-shell {
          margin-top: 60px !important;
          margin-left: 240px !important;
          width: calc(100% - 240px) !important;
          max-width: none !important;
          padding: 2rem !important;
          min-height: calc(100vh - 60px);
          box-sizing: border-box;
        }
        .help-support-page-header h1 {
          margin: 0 0 0.35rem 0;
          font-size: 2.2rem;
          font-weight: 850;
          color: #0f172a;
        }
        .help-support-page-header p {
          margin: 0;
          font-size: 1.05rem;
          color: #64748b;
        }
        .help-support-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          main.help-support-page-shell {
            margin-left: 70px !important;
            width: calc(100% - 70px) !important;
          }
        }
        
        .help-sidebar {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          height: fit-content;
        }
        
        .help-sidebar h2 {
          margin: 0 0 1.5rem;
          font-size: 1.25rem;
          color: #0f172a;
        }
        
        .help-sidebar nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .help-sidebar nav button {
          text-align: left;
          padding: 0.85rem 1rem;
          border: 1px solid var(--border);
          background: white;
          border-radius: 12px;
          font-size: 0.95rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .help-sidebar nav button:hover {
          background: rgba(91, 140, 255, 0.1);
          transform: translateY(-2px);
        }
        
        .help-sidebar nav button.active {
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          color: white;
          border-color: transparent;
        }
        
        .help-content {
          background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,252,255,0.85));
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 2rem;
          box-shadow: var(--elev);
        }
        
        .help-section h3 {
          margin: 0 0 2rem;
          font-size: 1.5rem;
          color: #0f172a;
        }
        
        .help-section h4 {
          margin: 2rem 0 1rem;
          font-size: 1.1rem;
          color: #334155;
        }
        
        .faq-controls {
          margin-bottom: 2rem;
        }
        
        .faq-search input {
          width: 100%;
          padding: 0.85rem 1rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          margin-bottom: 1rem;
        }
        
        .faq-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .faq-categories button {
          padding: 0.5rem 1rem;
          border: 1.5px solid #e2e8f0;
          background: white;
          border-radius: 20px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .faq-categories button:hover {
          border-color: #10b981;
        }
        
        .faq-categories button.active {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }
        
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .faq-item {
          background: #f8fafc;
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .faq-item h4 {
          margin: 0 0 0.5rem;
          color: #0f172a;
          font-size: 1rem;
        }
        
        .faq-item p {
          margin: 0;
          color: #475569;
          font-size: 0.9rem;
          line-height: 1.6;
        }
        
        .ticket-form {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #10b981;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .tickets-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .ticket-item {
          background: #f1f5f9;
          padding: 1rem;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .ticket-item:hover {
          background: #e2e8f0;
        }
        
        .ticket-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .ticket-item-header h5 {
          margin: 0;
          color: #0f172a;
          font-size: 0.95rem;
        }
        
        .ticket-status {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .ticket-status.open {
          background: #dbeafe;
          color: #1d4ed8;
        }
        
        .ticket-status.in_progress {
          background: #fef3c7;
          color: #b45309;
        }
        
        .ticket-status.resolved {
          background: #d1fae5;
          color: #047857;
        }
        
        .ticket-status.closed {
          background: #f1f5f9;
          color: #64748b;
        }
        
        .ticket-item-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.82rem;
          color: #64748b;
        }
        
        .ticket-detail {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 12px;
        }
        
        .back-button {
          background: none;
          border: none;
          color: #10b981;
          cursor: pointer;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          padding: 0;
        }
        
        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .ticket-header h4 {
          margin: 0;
          color: #0f172a;
        }
        
        .ticket-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 1.5rem;
        }
        
        .ticket-description h5,
        .ticket-conversation h5 {
          margin: 1rem 0 0.5rem;
          color: #334155;
          font-size: 0.95rem;
        }
        
        .ticket-description p {
          color: #475569;
          line-height: 1.6;
        }
        
        .conversation-message {
          background: white;
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 0.75rem;
          border: 1px solid #e2e8f0;
        }
        
        .conversation-message strong {
          color: #0f172a;
          font-size: 0.85rem;
        }
        
        .conversation-message p {
          margin: 0.5rem 0 0;
          color: #475569;
          font-size: 0.9rem;
        }
        
        .tutorials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        
        .tutorial-card {
          background: #f8fafc;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        
        .tutorial-thumbnail {
          position: relative;
          height: 160px;
          background: #e2e8f0;
        }
        
        .tutorial-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .tutorial-duration {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }
        
        .tutorial-info {
          padding: 1rem;
        }
        
        .tutorial-info h4 {
          margin: 0 0 0.5rem;
          color: #0f172a;
          font-size: 0.95rem;
        }
        
        .tutorial-info p {
          margin: 0;
          color: #64748b;
          font-size: 0.82rem;
          line-height: 1.5;
        }
        
        .rating-stars {
          display: flex;
          gap: 0.25rem;
        }
        
        .rating-stars button {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #cbd5e1;
          padding: 0;
          transition: color 0.2s;
        }
        
        .rating-stars button:hover {
          color: #fbbf24;
        }
        
        .rating-stars button.active {
          color: #fbbf24;
        }
        
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
        }
        
        .contact-icon {
          font-size: 2rem;
        }
        
        .contact-item h4 {
          margin: 0 0 0.25rem;
          color: #0f172a;
          font-size: 0.95rem;
        }
        
        .contact-item p {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }
        
        .social-links {
          margin-top: 2rem;
        }
        
        .social-links h4 {
          margin: 0 0 1rem;
          color: #334155;
        }
        
        .social-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .social-buttons a {
          padding: 0.75rem 1.25rem;
          background: #10b981;
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 600;
          transition: background 0.2s;
        }
        
        .social-buttons a:hover {
          background: #059669;
        }
        
        @media (max-width: 768px) {
          .help-support-container {
            grid-template-columns: 1fr;
          }
          
          .help-sidebar {
            margin-bottom: 1rem;
          }
          
          .help-sidebar nav {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 0.5rem;
          }
          
          .help-sidebar nav button {
            white-space: nowrap;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .tutorials-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}
