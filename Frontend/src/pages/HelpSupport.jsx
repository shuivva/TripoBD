import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function HelpSupport() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('faq')
  const [showTicketModal, setShowTicketModal] = useState(false)
  
  const userId = searchParams.get('user_id')

  const faqData = [
    {
      question: 'How do I create a tour room?',
      answer: 'Go to the Tour Rooms page and click "Create Tour Room". Fill in the details like destination, dates, and invite your friends to start planning together.'
    },
    {
      question: 'How can I join a tour group?',
      answer: 'Browse available tour groups in the Community page. Click on a group you\'re interested in and select "Join Group" to become a member.'
    },
    {
      question: 'How do I book a tour guide?',
      answer: 'Visit the Tour Guides page, browse available guides, and click "Book Guide" to schedule a guide for your trip.'
    },
    {
      question: 'Can I cancel my booking?',
      answer: 'Yes, you can cancel bookings from the My Bookings section. Cancellation policies may apply depending on the service provider.'
    },
    {
      question: 'How do I write a review?',
      answer: 'Go to the Reviews & Trip Stories page and click "Write Review" to share your experience with destinations and services.'
    },
    {
      question: 'How does the cost splitter work in tour rooms?',
      answer: 'In a tour room, members can add expenses and the system automatically calculates each person\'s share based on the number of participants.'
    }
  ]

  const handleSubmitTicket = async (ticketData) => {
    try {
      const response = await fetch('http://localhost:8000/api/support-tickets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ticketData, user: userId })
      })
      if (response.ok) {
        alert('Support ticket submitted successfully!')
        setShowTicketModal(false)
      }
    } catch (err) {
      alert('Failed to submit ticket')
    }
  }

  return (
    <>
      <main className="help-support-page">
        <div className="help-support-container">
          <header className="help-header">
            <h1>Help & Support</h1>
            <p>We're here to help you with any questions or issues.</p>
          </header>

          <div className="help-tabs">
            <button className={`help-tab ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => setActiveTab('faq')}>
              FAQ
            </button>
            <button className={`help-tab ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>
              Contact Us
            </button>
            <button className={`help-tab ${activeTab === 'ticket' ? 'active' : ''}`} onClick={() => setShowTicketModal(true)}>
              Submit Ticket
            </button>
          </div>

          {activeTab === 'faq' && (
            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqData.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="contact-section">
              <h2>Contact Us</h2>
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon">📧</div>
                  <div>
                    <h3>Email</h3>
                    <p>support@tripobd.com</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📞</div>
                  <div>
                    <h3>Phone</h3>
                    <p>+880 1234-567890</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📍</div>
                  <div>
                    <h3>Address</h3>
                    <p>Dhaka, Bangladesh</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">⏰</div>
                  <div>
                    <h3>Working Hours</h3>
                    <p>Sunday - Thursday: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showTicketModal && (
            <TicketModal
              onClose={() => setShowTicketModal(false)}
              onSubmit={handleSubmitTicket}
            />
          )}
        </div>
      </main>

      <style>{`
        .help-support-page { padding: 2rem; max-width: 1000px; margin: 0 auto; }
        .help-support-container { display: flex; flex-direction: column; gap: 2rem; }
        .help-header { padding: 1.5rem 2rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .help-header h1 { margin: 0 0 0.25rem 0; font-size: 2rem; color: #1f2937; }
        .help-header p { margin: 0; color: #6b7280; font-size: 0.875rem; }
        .help-tabs { display: flex; gap: 0.5rem; padding: 1rem; background: white; border-radius: 12px; }
        .help-tab { padding: 0.75rem 1.5rem; background: transparent; border: none; border-radius: 8px; cursor: pointer; color: #6b7280; }
        .help-tab.active { background: #3b82f6; color: white; }
        .faq-section { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .faq-section h2 { margin: 0 0 1.5rem 0; font-size: 1.5rem; color: #1f2937; }
        .faq-list { display: flex; flex-direction: column; gap: 1rem; }
        .faq-item { padding: 1.5rem; background: #f9fafb; border-radius: 8px; }
        .faq-item h3 { margin: 0 0 0.5rem 0; font-size: 1rem; color: #1f2937; }
        .faq-item p { margin: 0; color: #6b7280; line-height: 1.6; }
        .contact-section { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .contact-section h2 { margin: 0 0 1.5rem 0; font-size: 1.5rem; color: #1f2937; }
        .contact-info { display: flex; flex-direction: column; gap: 1rem; }
        .contact-item { display: flex; gap: 1rem; padding: 1.5rem; background: #f9fafb; border-radius: 8px; align-items: center; }
        .contact-icon { width: 50px; height: 50px; border-radius: 50%; background: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
        .contact-item h3 { margin: 0 0 0.25rem 0; font-size: 1rem; color: #1f2937; }
        .contact-item p { margin: 0; color: #6b7280; font-size: 0.875rem; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }
        .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.875rem; color: #6b7280; font-weight: 500; }
        .form-group input, .form-group textarea, .form-group select { padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; }
        .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }
        .btn-primary { padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; }
        .btn-secondary { padding: 0.75rem 1.5rem; background: #f3f4f6; color: #1f2937; border: none; border-radius: 6px; cursor: pointer; }
      `}</style>
    </>
  )
}

function TicketModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    description: '',
    priority: 'medium'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Submit Support Ticket</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="general">General Inquiry</option>
              <option value="booking">Booking Issue</option>
              <option value="technical">Technical Issue</option>
              <option value="payment">Payment Issue</option>
              <option value="account">Account Issue</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Submit Ticket</button>
          </div>
        </form>
      </div>
    </div>
  )
}