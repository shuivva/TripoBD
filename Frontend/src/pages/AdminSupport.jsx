import { useEffect, useState } from 'react'
import { getAdminTickets, replyAdminTicket } from '../apiClient'

export default function AdminSupport() {
  const adminId = localStorage.getItem('userId')
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const cannedReplies = [
    { label: 'Select a template...', value: '' },
    { label: '🎫 Policy Clarification', value: 'Hello,\n\nThank you for reaching out. Please note that according to TripoBD Guidelines, bookings cancelled less than 24 hours prior are subject to a 50% cancellation penalty. We recommend communicating directly with your tour operator for arrangements.\n\nBest regards,\nTripoBD Support Team' },
    { label: '💳 Payout Delay Inquiry', value: 'Hello,\n\nWe have verified your pending payout request. Standard bank transfers take 3-5 business days to clear, while bKash payouts are settled within 24 hours. Your request is currently in queue and will be processed shortly.\n\nBest regards,\nTripoBD Finance' },
    { label: '🏅 Guide Verification Rules', value: 'Hello,\n\nTo approve your tour guide portfolio, we require a clear photo of your NID/Passport, plus at least two verified customer reviews or certifications. Please update your profile portfolio tab so our validation officers can review your application.\n\nBest regards,\nTripoBD Verification Team' }
  ]

  useEffect(() => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }
    loadTickets()
  }, [adminId])

  const loadTickets = async () => {
    try {
      const data = await getAdminTickets(adminId)
      setTickets(data)
      // If a ticket is already selected, update it from fresh data
      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id)
        if (updated) setSelectedTicket(updated)
      }
    } catch (err) {
      setError(err.message || 'Failed to load support tickets.')
    } finally {
      setLoading(false)
    }
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicket) return

    try {
      setError('')
      setSubmitLoading(true)
      const updatedTicket = await replyAdminTicket(adminId, {
        ticket_id: selectedTicket.id,
        action: 'reply',
        reply_text: replyText
      })
      
      setReplyText('')
      setSelectedTicket(updatedTicket)
      
      // Update in main list
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t))
      setSuccessMsg('Reply added successfully.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to submit ticket reply.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!selectedTicket) return
    try {
      setError('')
      setSubmitLoading(true)
      const updatedTicket = await replyAdminTicket(adminId, {
        ticket_id: selectedTicket.id,
        action: 'close'
      })
      
      setSelectedTicket(updatedTicket)
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t))
      setSuccessMsg('Ticket closed successfully.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to close ticket.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleCannedSelect = (e) => {
    setReplyText(e.target.value)
  }

  const filteredTickets = tickets.filter(t => {
    const statusMatch = statusFilter === 'All' || t.status === statusFilter
    const priorityMatch = priorityFilter === 'All' || t.priority === priorityFilter
    return statusMatch && priorityMatch
  })

  if (loading) {
    return <main className="page-shell"><p className="admin-status">Loading support complaints & threads...</p></main>
  }

  return (
    <main className="page-shell admin-support">
      <header className="admin-header">
        <h1>💬 Support & Complaint Desk</h1>
        <p>Manage and resolve traveler complaints, operator payout concerns, and platform inquiries.</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="support-workspace">
        {/* Left Side: Tickets List */}
        <div className="tickets-sidebar">
          <div className="filters-header">
            <h3>Support Tickets ({filteredTickets.length})</h3>
            <div className="sidebar-filter-inputs">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sb-select"
              >
                <option value="All">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>

              <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="sb-select"
              >
                <option value="All">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="sidebar-tickets-list">
            {filteredTickets.length === 0 ? (
              <p className="no-tickets-text">No support tickets found.</p>
            ) : (
              filteredTickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  className={`ticket-sidebar-item ${selectedTicket?.id === ticket.id ? 'active' : ''}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="ticket-item-top">
                    <span className={`prio-tag ${ticket.priority}`}>{ticket.priority}</span>
                    <span className="ticket-date">{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4>{ticket.subject}</h4>
                  <div className="ticket-item-bottom">
                    <span className="user-desc">@{ticket.username || 'user'}</span>
                    <span className={`status-tag ${ticket.status}`}>{ticket.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Conversation Thread */}
        <div className="ticket-conversation-panel">
          {selectedTicket ? (
            <div className="conversation-full">
              <div className="convo-header">
                <div className="header-text-block">
                  <h2>{selectedTicket.subject}</h2>
                  <div className="ticket-meta-info">
                    <span>Opened by: <strong>@{selectedTicket.username}</strong></span>
                    <span>Category: <strong className="category-text">{selectedTicket.category}</strong></span>
                    <span>Ticket ID: <strong>#{selectedTicket.id}</strong></span>
                  </div>
                </div>
                <div className="header-action-block">
                  {selectedTicket.status !== 'closed' ? (
                    <button 
                      className="button button-danger btn-close-ticket" 
                      onClick={handleCloseTicket}
                      disabled={submitLoading}
                    >
                      Close Ticket
                    </button>
                  ) : (
                    <span className="closed-stamp">🔒 Resolved & Closed</span>
                  )}
                </div>
              </div>

              {/* Initial ticket description */}
              <div className="initial-description-box">
                <h4>Initial Issue Statement:</h4>
                <p>"{selectedTicket.description}"</p>
              </div>

              {/* Chat Thread */}
              <div className="chat-thread-container">
                {selectedTicket.conversation && selectedTicket.conversation.length > 0 ? (
                  selectedTicket.conversation.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble-row ${msg.sender === 'admin' ? 'admin' : 'user'}`}>
                      <div className="chat-bubble-card">
                        <div className="bubble-meta">
                          <strong>{msg.sender === 'admin' ? 'Admin' : `@${selectedTicket.username}`}</strong>
                          <span>{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="bubble-text">{msg.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-thread-txt">No conversation history. Send a reply below to begin the dialogue.</p>
                )}
              </div>

              {/* Reply Section */}
              {selectedTicket.status !== 'closed' && (
                <form className="reply-form-section" onSubmit={handleReplySubmit}>
                  <div className="reply-form-top">
                    <label>Quick Reply Editor</label>
                    <select className="canned-select" onChange={handleCannedSelect}>
                      {cannedReplies.map((reply, i) => (
                        <option key={i} value={reply.value}>{reply.label}</option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your official support response here..."
                    className="reply-textarea"
                    required
                  ></textarea>

                  <div className="reply-actions-row">
                    <button 
                      type="submit" 
                      className="button button-primary btn-submit-reply"
                      disabled={submitLoading || !replyText.trim()}
                    >
                      {submitLoading ? 'Sending...' : 'Send Official Response'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="no-conversation-selected">
              <span className="large-icon">💬</span>
              <h3>No Ticket Selected</h3>
              <p>Select a ticket from the left panel to review customer thread and submit responses.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-support {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .admin-header h1 {
          font-size: 2.25rem;
          font-weight: 850;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }
        .admin-header p {
          color: #64748b;
          margin: 0 0 2rem 0;
        }

        .alert {
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }
        .alert-danger {
          background: #fee2e2;
          color: #991b1b;
        }
        .alert-success {
          background: #dcfce7;
          color: #166534;
        }

        .support-workspace {
          display: grid;
          grid-template-columns: 320px 1fr;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          height: 640px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        @media (max-width: 850px) {
          .support-workspace {
            grid-template-columns: 1fr;
            height: auto;
          }
        }

        /* Sidebar styling */
        .tickets-sidebar {
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          height: 100%;
        }
        .filters-header {
          padding: 1.25rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .filters-header h3 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.75rem 0;
        }
        .sidebar-filter-inputs {
          display: flex;
          gap: 0.5rem;
        }
        .sb-select {
          flex: 1;
          padding: 0.45rem;
          font-size: 0.78rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          outline: none;
          font-family: inherit;
          font-weight: 700;
          background: white;
        }
        .sidebar-tickets-list {
          overflow-y: auto;
          flex: 1;
          padding: 0.75rem;
        }
        .no-tickets-text {
          font-size: 0.85rem;
          color: #94a3b8;
          text-align: center;
          padding: 2rem;
        }
        .ticket-sidebar-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ticket-sidebar-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .ticket-sidebar-item.active {
          border-color: #ef4444;
          background: #fff5f5;
        }
        .ticket-item-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .prio-tag {
          font-size: 0.65rem;
          font-weight: 850;
          text-transform: uppercase;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
        }
        .prio-tag.high {
          background: #fee2e2;
          color: #dc2626;
        }
        .prio-tag.medium {
          background: #fef3c7;
          color: #d97706;
        }
        .prio-tag.low {
          background: #f1f5f9;
          color: #475569;
        }
        .ticket-date {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .ticket-sidebar-item h4 {
          font-size: 0.88rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          line-height: 1.3;
        }
        .ticket-item-bottom {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
        }
        .user-desc {
          color: #64748b;
          font-weight: 600;
        }
        .status-tag {
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.68rem;
        }
        .status-tag.open {
          color: #22c55e;
        }
        .status-tag.in_progress {
          color: #f59e0b;
        }
        .status-tag.closed {
          color: #64748b;
        }

        /* Conversation Panel */
        .ticket-conversation-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
        }
        .no-conversation-selected {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #94a3b8;
          text-align: center;
        }
        .large-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }
        .no-conversation-selected h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #334155;
          margin-bottom: 0.5rem;
        }
        
        .conversation-full {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .convo-header {
          padding: 1.25rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-text-block h2 {
          font-size: 1.2rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 0.4rem 0;
        }
        .ticket-meta-info {
          display: flex;
          gap: 1rem;
          font-size: 0.78rem;
          color: #64748b;
        }
        .category-text {
          color: #8b5cf6;
        }
        .closed-stamp {
          font-weight: 800;
          color: #ef4444;
          font-size: 0.88rem;
          padding: 0.4rem 0.8rem;
          background: #fef2f2;
          border-radius: 8px;
        }

        .initial-description-box {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 1rem 1.25rem;
        }
        .initial-description-box h4 {
          font-size: 0.82rem;
          font-weight: 800;
          color: #475569;
          margin: 0 0 0.35rem 0;
          text-transform: uppercase;
        }
        .initial-description-box p {
          margin: 0;
          font-size: 0.92rem;
          color: #334155;
          font-style: italic;
          line-height: 1.4;
        }

        .chat-thread-container {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          background: #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .empty-thread-txt {
          font-size: 0.88rem;
          color: #64748b;
          text-align: center;
          margin: 2rem 0;
        }
        .chat-bubble-row {
          display: flex;
          width: 100%;
        }
        .chat-bubble-row.admin {
          justify-content: flex-end;
        }
        .chat-bubble-row.user {
          justify-content: flex-start;
        }
        .chat-bubble-card {
          max-width: 80%;
          background: white;
          border-radius: 16px;
          padding: 0.85rem 1.1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .chat-bubble-row.admin .chat-bubble-card {
          background: #0f172a;
          color: white;
        }
        .bubble-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          font-size: 0.7rem;
          margin-bottom: 0.35rem;
          opacity: 0.8;
          font-weight: 700;
        }
        .bubble-text {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.45;
          white-space: pre-wrap;
        }

        /* Reply Section */
        .reply-form-section {
          padding: 1.25rem;
          border-top: 1px solid #e2e8f0;
          background: white;
        }
        .reply-form-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }
        .reply-form-top label {
          font-size: 0.82rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
        }
        .canned-select {
          padding: 0.35rem;
          font-size: 0.78rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          outline: none;
          font-weight: 700;
          background: white;
          font-family: inherit;
        }
        .reply-textarea {
          width: 100%;
          padding: 0.75rem;
          font-size: 0.9rem;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          outline: none;
          font-family: inherit;
          resize: none;
          transition: border-color 0.2s;
        }
        .reply-textarea:focus {
          border-color: #ef4444;
        }
        .reply-actions-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.75rem;
        }
      `}</style>
    </main>
  )
}
