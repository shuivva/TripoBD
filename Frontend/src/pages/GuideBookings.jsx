import { useEffect, useState } from 'react'
import { getGuideDashboard, updateGuideBookingStatus } from '../apiClient'

export default function GuideBookings() {
  const userId = localStorage.getItem('userId')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('requested') // requested (pending), confirmed, completed, cancelled
  
  // Detail modal state
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [internalNotes, setInternalNotes] = useState('')
  const [agreedFeeEdit, setAgreedFeeEdit] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [replyText, setReplyText] = useState('')
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [showAcceptForm, setShowAcceptForm] = useState(false)
  const [agreedFeeInput, setAgreedFeeInput] = useState('')

  const loadBookings = async () => {
    if (!userId) {
      setError('Please sign in as a service provider.')
      setLoading(false)
      return
    }
    try {
      const data = await getGuideDashboard(userId)
      // combine calendar (confirmed) + inbox (requested/pending) + completing/cancelled bookings
      // To get all bookings, we can merge lists from stats dashboard or we can fetch a full bookings list.
      // Since getGuideDashboard returns stats with inbox (requested), calendar (confirmed), and recent reviews,
      // let's fetch earnings data which has completed bookings, or we can make a query.
      // Actually, we can fetch all bookings directly. Let's write a robust fetch to get all bookings.
      const res = await fetch(`http://localhost:8000/api/traveler/${userId}/bookings/`)
      if (res.ok) {
        const list = await res.json()
        setBookings(list)
      } else {
        // Fallback: merge dashboard lists
        const inbox = data.inbox || []
        const calendar = data.calendar || []
        setBookings([...inbox, ...calendar])
      }
    } catch {
      setError('Failed to load bookings log.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [userId])

  const handleBookingAction = async (bookingId, action, payload = {}) => {
    setMessage('')
    setError('')
    try {
      const res = await updateGuideBookingStatus(bookingId, { action, ...payload })
      setMessage(`Booking request updated successfully.`)
      setSelectedBooking(null)
      loadBookings()
    } catch {
      setError('Failed to update booking.')
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedBooking) return
    try {
      await updateGuideBookingStatus(selectedBooking.id, { action: 'update_notes', internal_notes: internalNotes })
      setMessage('Internal trip preparation notes saved!')
      setSelectedBooking(null)
      loadBookings()
    } catch {
      setError('Failed to save trip notes.')
    }
  }

  const filteredBookings = bookings.filter(b => b.status === activeTab)

  return (
    <main className="page-shell guide-bookings">
      {message && <div className="guide-alert success">{message}</div>}
      {error && <div className="guide-alert error">{error}</div>}

      <header className="bookings-header">
        <h1>Booking Management</h1>
        <p>Keep track of requested itineraries, traveler details, internal notes, and confirm completed trips.</p>
      </header>

      {/* Tabs */}
      <div className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'requested' ? 'active' : ''}`} onClick={() => setActiveTab('requested')}>
          Pending Requests ({bookings.filter(b => b.status === 'requested').length})
        </button>
        <button className={`tab-btn ${activeTab === 'confirmed' ? 'active' : ''}`} onClick={() => setActiveTab('confirmed')}>
          Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
        </button>
        <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
          Completed ({bookings.filter(b => b.status === 'completed').length})
        </button>
        <button className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')}>
          Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
        </button>
      </div>

      {/* Bookings Table / List */}
      <section className="bookings-panel">
        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings matching this status logs.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Traveler Name</th>
                  <th>Dates</th>
                  <th>Group Size</th>
                  <th>Agreed Fee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>
                      <strong>{b.customer_name}</strong>
                      <div className="sub-desc">@{b.customer_username}</div>
                    </td>
                    <td>{b.start_date} to {b.end_date}</td>
                    <td>{b.group_size} travelers</td>
                    <td>৳{b.agreed_fee ? b.agreed_fee.toLocaleString() : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button className="button button-secondary compact" onClick={() => {
                          setSelectedBooking(b)
                          setInternalNotes(b.internal_notes || '')
                          setAgreedFeeEdit(b.agreed_fee || '')
                          setRejectionReason(b.rejection_reason || '')
                        }}>
                          Details
                        </button>
                        {activeTab === 'requested' && (
                          <>
                            <button className="button button-primary compact" onClick={() => {
                              setSelectedBooking(b)
                              setAgreedFeeInput(b.agreed_fee || '3000')
                              setShowAcceptForm(true)
                            }}>
                              Approve
                            </button>
                            <button className="button button-secondary compact" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => {
                              setSelectedBooking(b)
                              setDeclineReason('I am unavailable on these dates.')
                              setShowDeclineForm(true)
                            }}>
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Details Modal */}
      {selectedBooking && !showDeclineForm && !showAcceptForm && (
        <div className="crop-modal">
          <div className="crop-modal-content booking-details-modal">
            <h3>Booking Detail: #{selectedBooking.id}</h3>
            <p className="community-muted">Review traveler specifications and coordinate pre-trip checks.</p>

            <div className="details-info-section">
              <div className="details-row"><span>Traveler Name</span><strong>{selectedBooking.customer_name} (@{selectedBooking.customer_username})</strong></div>
              <div className="details-row"><span>Contact Phone</span><strong>{selectedBooking.customer_phone || 'N/A'}</strong></div>
              <div className="details-row"><span>Contact Email</span><strong>{selectedBooking.customer_email || 'N/A'}</strong></div>
              <div className="details-row"><span>Trip Dates</span><strong>{selectedBooking.start_date} to {selectedBooking.end_date}</strong></div>
              <div className="details-row"><span>Group Size</span><strong>{selectedBooking.group_size} travelers</strong></div>
              {selectedBooking.specific_requirements && <div className="details-row requirements-box"><span>Requirements</span><p>"{selectedBooking.specific_requirements}"</p></div>}
              {selectedBooking.message && <div className="details-row requirements-box"><span>Message</span><p>"{selectedBooking.message}"</p></div>}
              <div className="details-row"><span>Agreed Fee</span><strong>৳{selectedBooking.agreed_fee || '-'}</strong></div>
            </div>

            {/* Note Editor */}
            <div className="internal-notes-editor">
              <label>
                📝 Internal Pre-trip Preparation Notes
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="e.g. Remember to buy ferry permits, bring mosquito repellent, call homestay owner..."
                  rows="3"
                />
              </label>
            </div>

            {/* Rejection / Cancellation Info */}
            {selectedBooking.status === 'cancelled' && selectedBooking.rejection_reason && (
              <div className="details-row requirements-box rejection-alert">
                <span>Declined Reason</span>
                <p>"{selectedBooking.rejection_reason}"</p>
              </div>
            )}

            {/* Actions */}
            <div className="modal-actions-buttons">
              <button className="button button-tertiary" onClick={() => setSelectedBooking(null)}>Close</button>
              
              {selectedBooking.status === 'requested' && (
                <>
                  <button className="button button-secondary" onClick={() => {
                    setDeclineReason('I am unavailable on these dates.')
                    setShowDeclineForm(true)
                  }}>
                    Decline Request
                  </button>
                  <button className="button button-primary" onClick={() => {
                    setAgreedFeeInput(agreedFeeEdit || '3000')
                    setShowAcceptForm(true)
                  }}>
                    Accept & Confirm
                  </button>
                </>
              )}

              {selectedBooking.status === 'confirmed' && (
                <>
                  <button className="button button-secondary" onClick={() => handleBookingAction(selectedBooking.id, 'complete')}>
                    Mark Completed
                  </button>
                  <button className="button button-primary" onClick={handleSaveNotes}>
                    Save Notes
                  </button>
                </>
              )}

              {selectedBooking.status === 'completed' && (
                <button className="button button-primary" onClick={handleSaveNotes}>
                  Save Notes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Decline Booking Modal */}
      {showDeclineForm && selectedBooking && (
        <div className="crop-modal">
          <div className="crop-modal-content" style={{ maxWidth: '440px' }}>
            <h3>Decline Booking Request</h3>
            <p className="community-muted">Specify the reason for declining booking #{selectedBooking.id}. This will be sent directly to the traveler.</p>
            
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
                <button type="button" className="button button-secondary" onClick={() => setShowDeclineForm(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="button leave-room-danger-btn"
                  onClick={() => {
                    handleBookingAction(selectedBooking.id, 'decline', { reason: declineReason })
                    setShowDeclineForm(false)
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
      {showAcceptForm && selectedBooking && (
        <div className="crop-modal">
          <div className="crop-modal-content" style={{ maxWidth: '440px' }}>
            <h3>Approve Booking Request</h3>
            <p className="community-muted">Verify or update the agreed fee for booking #{selectedBooking.id} before confirming.</p>
            
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
                <button type="button" className="button button-secondary" onClick={() => setShowAcceptForm(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    handleBookingAction(selectedBooking.id, 'accept', { agreed_fee: parseFloat(agreedFeeInput) || 0 })
                    setShowAcceptForm(false)
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

        .guide-bookings {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .bookings-header h1 { font-size: 2.25rem; font-weight: 850; margin: 0 0 0.5rem 0; color: #0f172a; }
        .bookings-header p { font-size: 1.05rem; color: #64748b; margin: 0; }
        
        .tabs-nav {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.5rem;
          flex-wrap: wrap;
        }
        .tab-btn {
          border: none;
          background: none;
          padding: 0.6rem 1.25rem;
          font-weight: 700;
          font-size: 0.9rem;
          color: #64748b;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .tab-btn:hover { background: #f1f5f9; color: #0f172a; }
        .tab-btn.active { background: #a855f7; color: white; }
        
        .bookings-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        
        .empty-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; font-size: 0.9rem; }
        
        .bookings-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .bookings-table th { padding: 0.85rem 1rem; border-bottom: 2px solid #f1f5f9; color: #475569; font-size: 0.85rem; text-transform: uppercase; font-weight: 800; }
        .bookings-table td { padding: 1.1rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; }
        .bookings-table tr:last-child td { border: none; }
        .sub-desc { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
        
        .booking-details-modal { max-width: 500px; width: 95%; }
        .details-info-section { display: flex; flex-direction: column; gap: 0.6rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin: 1rem 0; }
        .details-row { display: flex; justify-content: space-between; font-size: 0.88rem; color: #475569; }
        .details-row.requirements-box { flex-direction: column; gap: 0.35rem; }
        .details-row.requirements-box p { margin: 0; font-size: 0.82rem; line-height: 1.4; font-style: italic; background: white; border: 1px solid #e2e8f0; padding: 0.5rem; border-radius: 6px; }
        .rejection-alert { background: #fee2e2; border-color: #fecaca; }
        .rejection-alert span { color: #991b1b; font-weight: 700; }
        
        .internal-notes-editor label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.88rem; font-weight: 700; color: #334155; }
        .internal-notes-editor textarea { padding: 0.6rem 0.8rem; border: 1.5px solid #cbd5e1; border-radius: 8px; outline: none; font-size: 0.88rem; }
        .internal-notes-editor textarea:focus { border-color: #a855f7; }
        
        .modal-actions-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }
      `}</style>
    </main>
  )
}
