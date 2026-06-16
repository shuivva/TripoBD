import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getGuideDashboard, updateGuideBookingStatus } from '../apiClient'

export default function GuideDashboard() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Action modals states
  const [decliningBooking, setDecliningBooking] = useState(null)
  const [declineReason, setDeclineReason] = useState('')
  const [confirmingBooking, setConfirmingBooking] = useState(null)
  const [agreedFeeInput, setAgreedFeeInput] = useState('')

  const loadData = async () => {
    if (!userId) {
      setError('Please sign in as a service provider.')
      setLoading(false)
      return
    }
    try {
      const data = await getGuideDashboard(userId)
      setStats(data)
    } catch {
      setError('Failed to retrieve dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userId])

  const handleBookingAction = async (bookingId, action, payload = {}) => {
    setMessage('')
    setError('')
    try {
      await updateGuideBookingStatus(bookingId, { action, ...payload })
      setMessage(`Booking request successfully updated!`)
      loadData()
    } catch {
      setError('Failed to update booking.')
    }
  }

  if (loading) {
    return <main className="page-shell"><p className="guide-status">Loading dashboard...</p></main>
  }

  if (error && !stats) {
    return (
      <main className="page-shell">
        <p className="guide-status guide-error">{error}</p>
        <button className="button button-primary" onClick={() => navigate('/signin')}>Sign In</button>
      </main>
    )
  }

  return (
    <main className="page-shell guide-dashboard">
      {message && <div className="guide-alert success">{message}</div>}
      {error && <div className="guide-alert error">{error}</div>}

      <header className="guide-header">
        <h1>Welcome Back, Provider!</h1>
        <p>Manage your bookings, availability, and earnings in one secure place.</p>
      </header>

      {/* Summary Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">🛡️</span>
          <div className="stat-info">
            <span>Status</span>
            <strong>{stats?.verification_status}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-info">
            <span>Active Bookings</span>
            <strong>{stats?.active_bookings}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📩</span>
          <div className="stat-info">
            <span>Pending Requests</span>
            <strong>{stats?.pending_requests}</strong>
          </div>
        </div>
        <div className="stat-card font-green">
          <span className="stat-icon">৳</span>
          <div className="stat-info">
            <span>Completed Earnings</span>
            <strong>৳{stats?.total_earnings?.toLocaleString()}</strong>
          </div>
        </div>
        <div className="stat-card font-amber">
          <span className="stat-icon">⭐</span>
          <div className="stat-info">
            <span>Average Rating</span>
            <strong>{stats?.avg_rating}/5.0</strong>
          </div>
        </div>
      </section>

      {/* Completeness Nudge */}
      {(!stats?.verification_status || stats?.verification_status.includes('Pending')) && (
        <div className="nudge-banner">
          <span className="nudge-icon">💡</span>
          <div className="nudge-text">
            <h4>Complete Your Provider Profile</h4>
            <p>Add pricing options, upload certifications, and verify specialized destinations to receive more traveler requests.</p>
          </div>
          <Link to="/guide/profile" className="button button-primary compact">Go to Profile</Link>
        </div>
      )}

      {/* Dashboard Main Content */}
      <div className="dashboard-layout">
        {/* Left: Pending Inbox */}
        <div className="dashboard-col">
          <section className="panel-card">
            <h3>📩 Pending Booking Requests ({stats?.inbox?.length || 0})</h3>
            {stats?.inbox?.length === 0 ? (
              <p className="empty-state-text">No pending traveler requests. You'll be alerted when travelers choose your service!</p>
            ) : (
              <div className="requests-list">
                {stats?.inbox?.map((b) => (
                  <div key={b.id} className="request-item">
                    <div className="req-header">
                      <strong>👤 {b.customer_name}</strong>
                      <span className="req-date">Created {new Date(b.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="req-details">
                      <p>🗓️ **Dates:** {b.start_date} to {b.end_date}</p>
                      <p>👥 **Group Size:** {b.group_size} travelers</p>
                      {b.specific_requirements && <p>✍️ **Special Request:** "{b.specific_requirements}"</p>}
                      {b.message && <p>💬 **Message:** "{b.message}"</p>}
                    </div>
                    <div className="req-actions">
                      <button className="button button-secondary compact" onClick={() => {
                        setDecliningBooking(b)
                        setDeclineReason('I am unavailable on these dates.')
                      }}>
                        Decline
                      </button>
                      <button className="button button-primary compact" onClick={() => {
                        setConfirmingBooking(b)
                        setAgreedFeeInput(b.agreed_fee || '3000')
                      }}>
                        Accept & Confirm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: Confirmed and Reviews */}
        <div className="dashboard-col">
          <section className="panel-card">
            <h3>📅 Upcoming Confirmed Bookings ({stats?.calendar?.length || 0})</h3>
            {stats?.calendar?.length === 0 ? (
              <p className="empty-state-text">No upcoming bookings scheduled.</p>
            ) : (
              <div className="confirmed-list">
                {stats?.calendar?.map((b) => (
                  <div key={b.id} className="confirmed-item">
                    <div>
                      <h4>{b.customer_name}</h4>
                      <p className="item-subtext">🗓️ {b.start_date} to {b.end_date} ({b.group_size} travelers)</p>
                      <p className="item-subtext font-weight-bold">Agreed Fee: ৳{b.agreed_fee}</p>
                    </div>
                    <button className="button button-secondary compact" onClick={() => handleBookingAction(b.id, 'complete')}>
                      Mark Completed
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel-card" style={{ marginTop: '1.5rem' }}>
            <h3>⭐ Recent Traveler Reviews</h3>
            {stats?.recent_reviews?.length === 0 ? (
              <p className="empty-state-text">No reviews received yet.</p>
            ) : (
              <div className="reviews-list-vertical">
                {stats?.recent_reviews?.map((r) => (
                  <div key={r.id} className="review-bubble">
                    <div className="review-meta">
                      <strong>@{r.author}</strong>
                      <span>⭐ {r.rating}/5</span>
                    </div>
                    <p className="review-text">"{r.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Decline Booking Modal */}
      {decliningBooking && (
        <div className="crop-modal">
          <div className="crop-modal-content" style={{ maxWidth: '440px' }}>
            <h3>Decline Booking Request</h3>
            <p className="community-muted">Specify the reason for declining booking #{decliningBooking.id}. This will be sent directly to the traveler.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.25rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>
                Decline Reason
                <textarea
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  placeholder="e.g. I have a scheduling conflict / fully booked..."
                  rows="3"
                  style={{
                    padding: '0.65rem',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: 'white',
                    resize: 'vertical'
                  }}
                  required
                />
              </label>

              <div className="modal-actions-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="button button-secondary" onClick={() => setDecliningBooking(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="button leave-room-danger-btn"
                  onClick={() => {
                    handleBookingAction(decliningBooking.id, 'decline', { reason: declineReason })
                    setDecliningBooking(null)
                  }}
                  disabled={!declineReason.trim()}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Decline Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Booking Modal */}
      {confirmingBooking && (
        <div className="crop-modal">
          <div className="crop-modal-content" style={{ maxWidth: '440px' }}>
            <h3>Approve Booking Request</h3>
            <p className="community-muted">Verify or update the agreed fee for booking #{confirmingBooking.id} before confirming.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.25rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>
                Agreed Fee (BDT)
                <input
                  type="number"
                  value={agreedFeeInput}
                  onChange={e => setAgreedFeeInput(e.target.value)}
                  placeholder="3000"
                  style={{
                    padding: '0.65rem',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: 'white'
                  }}
                  required
                />
              </label>

              <div className="modal-actions-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="button button-secondary" onClick={() => setConfirmingBooking(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    handleBookingAction(confirmingBooking.id, 'accept', { agreed_fee: parseFloat(agreedFeeInput) || 0 })
                    setConfirmingBooking(null)
                  }}
                  disabled={!agreedFeeInput || parseFloat(agreedFeeInput) <= 0}
                  style={{
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Confirm & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Floating Modal styling */
        .crop-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: 2rem 1rem;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }
        .crop-modal-content {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
          animation: slideUp 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-actions-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }
        .community-muted { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; }

        .guide-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .guide-alert {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          font-weight: 500;
        }
        .guide-alert.success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .guide-alert.error { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .guide-header h1 { font-size: 2.25rem; font-weight: 850; margin: 0 0 0.5rem 0; color: #0f172a; }
        .guide-header p { font-size: 1.05rem; color: #64748b; margin: 0; }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
        }
        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .stat-icon { font-size: 1.8rem; }
        .stat-info span { display: block; font-size: 0.82rem; color: #64748b; margin-bottom: 0.15rem; }
        .stat-info strong { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
        .font-green strong { color: #166534; }
        .font-amber strong { color: #d97706; }

        .nudge-banner {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: #faf5ff;
          border: 1px solid #f3e8ff;
          padding: 1.25rem 1.5rem;
          border-radius: 18px;
        }
        .nudge-icon { font-size: 1.5rem; }
        .nudge-text { flex: 1; }
        .nudge-text h4 { margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 800; color: #581c87; }
        .nudge-text p { margin: 0; font-size: 0.88rem; color: #6b21a8; }
        
        .dashboard-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .dashboard-layout { grid-template-columns: 1fr; }
        }
        .panel-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        .panel-card h3 { font-size: 1.15rem; font-weight: 800; margin: 0 0 1.25rem 0; color: #0f172a; }
        .empty-state-text { font-size: 0.88rem; color: #94a3b8; line-height: 1.5; margin: 0; text-align: center; padding: 2rem 0; }
        
        .requests-list { display: flex; flex-direction: column; gap: 1rem; }
        .request-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; }
        .req-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .req-date { font-size: 0.75rem; color: #94a3b8; }
        .req-details { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.88rem; color: #475569; margin-bottom: 1rem; }
        .req-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
        
        .confirmed-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .confirmed-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 1rem;
          border-radius: 12px;
        }
        .confirmed-item h4 { margin: 0 0 0.2rem 0; font-size: 0.95rem; font-weight: 800; color: #1e293b; }
        .item-subtext { margin: 0; font-size: 0.78rem; color: #64748b; }
        
        .reviews-list-vertical { display: flex; flex-direction: column; gap: 0.75rem; }
        .review-bubble { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; }
        .review-meta { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .review-text { margin: 0; font-size: 0.85rem; font-style: italic; color: #475569; }

        .guide-status { text-align: center; padding: 3rem; color: #64748b; }
        .guide-error { color: #dc2626; }
      `}</style>
    </main>
  )
}
