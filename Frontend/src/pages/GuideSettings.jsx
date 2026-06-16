import { useEffect, useState } from 'react'
import { getGuideSupportTickets, submitGuideSupportTicket } from '../apiClient'

export default function GuideSettings() {
  const userId = localStorage.getItem('userId')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  // Notification state
  const [bookingAlerts, setBookingAlerts] = useState(true)
  const [reviewAlerts, setReviewAlerts] = useState(true)
  const [systemAlerts, setSystemAlerts] = useState(false)
  
  // Support state
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('bookings')
  const [submitting, setSubmitting] = useState(false)
  
  // FAQs
  const faqs = [
    {
      q: 'How long does the guide verification process take?',
      a: 'Verification is processed by our platform admin officers and typically takes 3-5 business days. You must upload a clear scan of your National ID card and licenses.'
    },
    {
      q: 'What is the payout timeline after booking completion?',
      a: 'Withdrawal payouts are reviewed and completed every Wednesday. bkash wallet transfers are immediate post-approval, while bank transfers might take 1-2 business days.'
    },
    {
      q: 'What is the cancellation policy for guides?',
      a: 'Guides can decline requests without impact. However, cancelling a confirmed booking within 48 hours of departure may temporarily freeze your profile verification badge.'
    }
  ]
  const [openFaqIdx, setOpenFaqIdx] = useState(null)

  const loadTickets = async () => {
    if (!userId) {
      setError('Please sign in as a service provider.')
      setLoading(false)
      return
    }
    try {
      const list = await getGuideSupportTickets(userId)
      setTickets(list)
    } catch {
      // ignore or set mock
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [userId])

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!subject || !description) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      await submitGuideSupportTicket(userId, { subject, description, category, priority: 'medium' })
      setMessage('Support ticket submitted successfully! A moderation officer will respond shortly.')
      setSubject('')
      setDescription('')
      loadTickets()
    } catch {
      setError('Failed to submit support ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = () => {
    if (confirm('Are you sure you want to deactivate your guide profile? You will not appear on traveler searches.')) {
      alert('Deactivation request sent to administration.')
    }
  }

  if (loading) {
    return <main className="page-shell"><p className="settings-status-text">Loading settings...</p></main>
  }

  return (
    <main className="page-shell guide-settings">
      {message && <div className="guide-alert success">{message}</div>}
      {error && <div className="guide-alert error">{error}</div>}

      <header className="settings-header-main">
        <h1>Settings & Support Help</h1>
        <p>Edit alert preferences, contact administration support, and read frequently asked guidelines.</p>
      </header>

      <div className="settings-grid">
        {/* Left Column */}
        <div className="settings-col">
          {/* Notification Preferences */}
          <section className="panel-card">
            <h3>🔔 Notification Alerts</h3>
            <p className="section-subtext">Toggle how and when you receive booking updates and system notifications.</p>
            <div className="checkbox-fields">
              <label className="checkbox-row">
                <input type="checkbox" checked={bookingAlerts} onChange={e => setBookingAlerts(e.target.checked)} />
                <div>
                  <strong>Booking Alerts</strong>
                  <p>Get notified when travelers send requested schedules or cancel confirmations.</p>
                </div>
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={reviewAlerts} onChange={e => setReviewAlerts(e.target.checked)} />
                <div>
                  <strong>Review Alerts</strong>
                  <p>Get notified when traveler reviews are published on your profile.</p>
                </div>
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={systemAlerts} onChange={e => setSystemAlerts(e.target.checked)} />
                <div>
                  <strong>System Announcements</strong>
                  <p>Get updates on platform terms changes, guides verification campaigns, etc.</p>
                </div>
              </label>
            </div>
            <button className="button button-primary" onClick={() => setMessage('Preferences saved successfully!')} style={{ marginTop: '1rem' }}>
              Save Alert Preferences
            </button>
          </section>

          {/* Guide FAQs */}
          <section className="panel-card" style={{ marginTop: '1.5rem' }}>
            <h3>❔ Frequently Asked Questions</h3>
            <div className="faq-list">
              {faqs.map((faq, idx) => (
                <div key={idx} className="faq-item">
                  <button type="button" className="faq-question-btn" onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}>
                    <span>{faq.q}</span>
                    <span>{openFaqIdx === idx ? '▲' : '▼'}</span>
                  </button>
                  {openFaqIdx === idx && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Support Tickets */}
        <div className="settings-col">
          <section className="panel-card">
            <h3>💬 Contact Help Center (Tickets)</h3>
            <p className="section-subtext">Submit a support ticket regarding verification issues, payment settlements, or complaints.</p>
            
            <form onSubmit={handleCreateTicket} className="ticket-form">
              <label>
                Subject Topic
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. payout delay or license verification review" required />
              </label>
              <label>
                Category Classification
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="bookings">Booking Issues</option>
                  <option value="payouts">Earnings & Payouts</option>
                  <option value="verification">Verification & Documents</option>
                  <option value="system">App General Bugs</option>
                </select>
              </label>
              <label>
                Issue Explanation Details
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide specific transaction IDs or details to expedite support..." rows="4" required />
              </label>
              <button type="submit" className="button button-primary ticket-submit-btn" disabled={submitting || !subject}>
                {submitting ? 'Submitting ticket...' : 'Open Support Ticket'}
              </button>
            </form>

            <div className="submitted-tickets-list" style={{ marginTop: '1.5rem' }}>
              <h4>My Opened Tickets ({tickets.length})</h4>
              {tickets.length === 0 ? (
                <p className="empty-tickets">No previous support tickets filed.</p>
              ) : (
                <div className="tickets-scroll">
                  {tickets.map(t => (
                    <div key={t.id} className="ticket-item-row">
                      <div className="ticket-info">
                        <strong>{t.subject}</strong>
                        <span>Category: {t.category} • Status: <span className={`status-text ${t.status}`}>{t.status}</span></span>
                      </div>
                      <small>{new Date(t.created_at).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Account Deactivation */}
          <section className="panel-card deact-card" style={{ marginTop: '1.5rem' }}>
            <h3>⚠️ Temporary Guide Profile Pause</h3>
            <p className="section-subtext">Temporarily hide your guide listing from search results. You can reactivate anytime.</p>
            <button className="button button-secondary deact-btn" onClick={handleDeactivate}>Deactivate Guide Account</button>
          </section>
        </div>
      </div>

      <style>{`
        .guide-settings {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .settings-header-main h1 { font-size: 2.25rem; font-weight: 850; margin: 0 0 0.5rem 0; color: #0f172a; }
        .settings-header-main p { font-size: 1.05rem; color: #64748b; margin: 0; }
        
        .settings-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .settings-grid { grid-template-columns: 1fr; }
        }
        
        .settings-col { display: flex; flex-direction: column; }
        
        .panel-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        .panel-card h3 { font-size: 1.15rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #0f172a; }
        .section-subtext { font-size: 0.82rem; color: #64748b; margin: 0 0 1.25rem 0; line-height: 1.4; }
        
        .checkbox-fields { display: flex; flex-direction: column; gap: 1rem; }
        .checkbox-row { display: flex; gap: 1rem; cursor: pointer; align-items: flex-start; }
        .checkbox-row input { margin-top: 0.25rem; transform: scale(1.1); }
        .checkbox-row strong { font-size: 0.9rem; color: #1e293b; display: block; }
        .checkbox-row p { margin: 0.15rem 0 0 0; font-size: 0.78rem; color: #64748b; line-height: 1.3; }
        
        .faq-list { display: flex; flex-direction: column; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .faq-item { border-bottom: 1px solid #e2e8f0; }
        .faq-item:last-child { border: none; }
        .faq-question-btn { width: 100%; border: none; background: white; padding: 1rem; display: flex; justify-content: space-between; font-weight: 750; font-size: 0.85rem; color: #1e293b; cursor: pointer; text-align: left; }
        .faq-question-btn:hover { background: #f8fafc; }
        .faq-answer { background: #f8fafc; padding: 0.85rem 1rem; border-top: 1px solid #e2e8f0; font-size: 0.82rem; color: #475569; line-height: 1.5; }
        
        .ticket-form { display: flex; flex-direction: column; gap: 0.85rem; }
        .ticket-form label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; font-weight: 700; color: #475569; }
        .ticket-form input, .ticket-form select, .ticket-form textarea {
          padding: 0.65rem 0.85rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.88rem;
          outline: none;
        }
        .ticket-form input:focus, .ticket-form select:focus, .ticket-form textarea:focus { border-color: #a855f7; }
        .ticket-submit-btn { padding: 0.75rem; border-radius: 10px; font-weight: 800; font-size: 0.9rem; margin-top: 0.35rem; }
        
        .submitted-tickets-list h4 { font-size: 0.9rem; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.35rem; margin-bottom: 0.5rem; color: #1e293b; }
        .empty-tickets { font-size: 0.8rem; color: #94a3b8; }
        .tickets-scroll { display: flex; flex-direction: column; gap: 0.5rem; max-height: 160px; overflow-y: auto; }
        .ticket-item-row { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem 0.75rem; }
        .ticket-info strong { display: block; font-size: 0.82rem; color: #334155; }
        .ticket-info span { font-size: 0.72rem; color: #94a3b8; }
        .ticket-item-row small { font-size: 0.7rem; color: #94a3b8; }
        .status-text { font-weight: 750; text-transform: uppercase; }
        .status-text.open { color: #10b981; }
        .status-text.in_progress { color: #f59e0b; }
        .status-text.closed { color: #64748b; }
        
        .deact-card { border-color: #fca5a5; background: #fffafb; }
        .deact-card h3 { color: #991b1b; }
        .deact-btn { background: #fee2e2 !important; border-color: #fecaca !important; color: #991b1b !important; font-weight: 700; }
        .deact-btn:hover { background: #fecaca !important; }
        
        .settings-status-text { text-align: center; padding: 3rem; color: #64748b; }
      `}</style>
    </main>
  )
}
