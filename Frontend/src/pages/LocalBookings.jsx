import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getServiceProviders,
  getServiceProviderDetail,
  bookServiceProvider,
  getMyBookings,
  updateBookingStatus,
  submitServiceProviderReview,
} from '../apiClient'

export default function LocalBookings() {
  const navigate = useNavigate()
  const location = useLocation()
  const userId = localStorage.getItem('userId')

  // Tabs: 'browse' | 'my-bookings'
  const [activeTab, setActiveTab] = useState('browse')

  // Transport Route Booking state
  const [selectedRoute, setSelectedRoute] = useState(location.state?.route || null)
  const [transportDate, setTransportDate] = useState('')
  const [transportGroupSize, setTransportGroupSize] = useState(1)
  const [transportNotes, setTransportNotes] = useState('')
  const [transportSubmitting, setTransportSubmitting] = useState(false)

  const [localTransportBookings, setLocalTransportBookings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('localTransportBookings') || '[]')
    } catch {
      return []
    }
  })

  // Browse state
  const [providers, setProviders] = useState([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [filterType, setFilterType] = useState('') // all, tour_guide, boat_operator, vehicle_rental, photography
  const [filterDest, setFilterDest] = useState('')
  const [filterLang, setFilterLang] = useState('')

  // Detail / Booking Modal state
  const [selectedSp, setSelectedSp] = useState(null)
  const [loadingSpDetail, setLoadingSpDetail] = useState(false)
  const [showBookForm, setShowBookForm] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [groupSize, setGroupSize] = useState(1)
  const [requirements, setRequirements] = useState('')
  const [bookMessage, setBookMessage] = useState('')
  const [bookSubmitting, setBookSubmitting] = useState(false)
  const [offeredFee, setOfferedFee] = useState('')

  // My bookings state
  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  // Review modal state
  const [reviewSp, setReviewSp] = useState(null)
  const [reviewBookingId, setReviewBookingId] = useState(null)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  // Feedback alerts
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load service providers
  const loadProviders = async () => {
    setLoadingProviders(true)
    setError('')
    try {
      const data = await getServiceProviders(filterType, filterDest, filterLang)
      setProviders(data)
    } catch {
      setError('Failed to load local service providers.')
    } finally {
      setLoadingProviders(false)
    }
  }

  // Load user bookings
  const loadBookings = async () => {
    if (!userId) return
    setLoadingBookings(true)
    setError('')
    try {
      const data = await getMyBookings(userId)
      setBookings(data)
    } catch {
      setError('Failed to load your booking history.')
    } finally {
      setLoadingBookings(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'browse') {
      loadProviders()
    } else {
      loadBookings()
    }
  }, [activeTab, filterType, filterDest, filterLang])

  // Open provider detail modal
  const handleViewDetail = async (spId) => {
    setLoadingSpDetail(true)
    setError('')
    try {
      const details = await getServiceProviderDetail(spId)
      setSelectedSp(details)
      setShowBookForm(false)
    } catch {
      setError('Failed to load service provider detail.')
    } finally {
      setLoadingSpDetail(false)
    }
  }

  // Submit booking request
  const handleRequestBooking = async (e) => {
    e.preventDefault()
    if (!selectedSp || !startDate || !endDate || !userId) return
    setBookSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        customer_id: parseInt(userId),
        start_date: startDate,
        end_date: endDate,
        group_size: groupSize,
        specific_requirements: requirements,
        message: bookMessage,
        agreed_fee: parseFloat(offeredFee) || 0,
      }
      await bookServiceProvider(selectedSp.id, payload)
      setSuccess('Booking request sent successfully to organizer!')
      setShowBookForm(false)
      setSelectedSp(null)
      setOfferedFee('')
      // Switch to my-bookings to view status
      setActiveTab('my-bookings')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to submit booking request.')
    } finally {
      setBookSubmitting(false)
    }
  }

  // Cancel or complete booking status
  const handleUpdateStatus = async (bookingId, newStatus) => {
    if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return
    setError('')
    try {
      await updateBookingStatus(bookingId, newStatus)
      setSuccess(`Booking successfully updated to ${newStatus}.`)
      loadBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to update booking status.')
    }
  }

  // Submit guide review
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!reviewSp || !userId) return
    setReviewSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        booking_id: reviewBookingId,
        author_id: parseInt(userId),
        rating: rating,
        text_review: reviewText,
      }
      await submitServiceProviderReview(reviewSp.id, payload)
      setSuccess('Thank you! Your feedback review has been submitted.')
      setReviewSp(null)
      setReviewBookingId(null)
      setReviewText('')
      setRating(5)
      loadBookings()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to submit provider review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleRequestTransportBooking = (e) => {
    e.preventDefault()
    if (!selectedRoute || !transportDate || !userId) return
    setTransportSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const newBooking = {
        id: `transport-${Date.now()}`,
        is_transport: true,
        status: 'confirmed',
        operator: selectedRoute.operator,
        mode: selectedRoute.mode,
        from: selectedRoute.from,
        to: selectedRoute.to,
        fare: selectedRoute.fare,
        start_date: transportDate,
        group_size: transportGroupSize,
        notes: transportNotes,
        agreed_fee: selectedRoute.fare * transportGroupSize,
        travel_class: selectedRoute.travelClass || selectedRoute.travel_class || 'Standard'
      }

      const updated = [newBooking, ...localTransportBookings]
      setLocalTransportBookings(updated)
      localStorage.setItem('localTransportBookings', JSON.stringify(updated))

      setSuccess(`Transport booking request for ${selectedRoute.operator} submitted successfully!`)
      setSelectedRoute(null)
      navigate(location.pathname, { replace: true, state: {} })
      setActiveTab('my-bookings')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError('Failed to book transport ticket.')
    } finally {
      setTransportSubmitting(false)
    }
  }

  const handleCancelTransportBooking = (id) => {
    if (!confirm('Are you sure you want to cancel this transport booking?')) return
    const updated = localTransportBookings.filter(b => b.id !== id)
    setLocalTransportBookings(updated)
    localStorage.setItem('localTransportBookings', JSON.stringify(updated))
    setSuccess('Transport booking successfully cancelled.')
    setTimeout(() => setSuccess(''), 3000)
  }

  if (!userId) {
    return (
      <main className="page-shell text-center">
        <p className="community-error">Please sign in to browse and book local services.</p>
        <button className="button button-primary" onClick={() => navigate('/signin')}>Sign In</button>
      </main>
    )
  }

  return (
    <main className="page-shell bookings-page-shell">
      {error && <div className="profile-alert error">{error}</div>}
      {success && <div className="profile-alert success">{success}</div>}

      <header className="bookings-page-header">
        <h1>Local Guides & Rental Bookings</h1>
        <p>Book local tour guides, boat operators, vehicle rentals, and photographers directly with verified local hosts.</p>
      </header>

      {/* Main Tab bar */}
      <nav className="bookings-tabs-bar">
        <button className={`tab-nav-btn ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
          🧭 Browse Hosts & Rentals
        </button>
        <button className={`tab-nav-btn ${activeTab === 'my-bookings' ? 'active' : ''}`} onClick={() => setActiveTab('my-bookings')}>
          📅 My Bookings & Requests
        </button>
      </nav>

      {/* Tab 1: Browse Hosts */}
      {activeTab === 'browse' && (
        <section className="browse-layout">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar-card">
            <h3>🔍 Search Filters</h3>
            <div className="filter-group">
              <label>Service Category</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All Services</option>
                <option value="tour_guide">🤠 Tour Guides</option>
                <option value="boat_operator">⛵ Boat Operators</option>
                <option value="vehicle_rental">🚗 Vehicle Rentals</option>
                <option value="photography">📷 Photography</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Service Area / Destination</label>
              <input
                type="text"
                placeholder="e.g. Bandarban, Sajek..."
                value={filterDest}
                onChange={e => setFilterDest(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Language Spoken</label>
              <input
                type="text"
                placeholder="e.g. English, Bangla..."
                value={filterLang}
                onChange={e => setFilterLang(e.target.value)}
              />
            </div>
            <button className="button button-secondary" onClick={() => { setFilterType(''); setFilterDest(''); setFilterLang('') }}>
              Reset Filters
            </button>
          </aside>

          {/* Providers Grid */}
          <div className="providers-grid-column">
            {loadingProviders ? (
              <p className="loading-text">Searching active service providers...</p>
            ) : providers.length === 0 ? (
              <div className="empty-results-box">
                <span>🤠</span>
                <h4>No Service Providers Match Filters</h4>
                <p>Try clearing your destination filters or checking back later.</p>
              </div>
            ) : (
              <div className="providers-grid">
                {providers.map(sp => (
                  <div key={sp.id} className="provider-item-card">
                    <div className="sp-header-row">
                      <div className="sp-avatar-circle">
                        {sp.user?.full_name ? sp.user.full_name[0] : '🤠'}
                      </div>
                      <div>
                        <h4>{sp.user?.full_name || 'Verified Provider'}</h4>
                        <span className="sp-service-tag">{sp.service_type_label || sp.service_type}</span>
                      </div>
                    </div>
                    <div className="sp-info-rows">
                      <p>📍 Areas: <strong>{sp.specialized_destinations}</strong></p>
                      <p>🗣️ Languages: <strong>{sp.languages_offered}</strong></p>
                      <p>💼 Experience: <strong>{sp.years_of_experience} years</strong></p>
                      <p className="sp-price">💵 Rates: <strong>{sp.fee_range}</strong></p>
                    </div>
                    <button className="button button-primary view-sp-details-btn" onClick={() => handleViewDetail(sp.id)}>
                      View Profile & Book ➔
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 2: My Bookings & Requests */}
      {activeTab === 'my-bookings' && (
        <section className="bookings-history-section">
          <h3>Your Tour Booking Ledger</h3>
          {loadingBookings ? (
            <p className="loading-text">Retrieving booking logs...</p>
          ) : (localTransportBookings.length === 0 && bookings.length === 0) ? (
            <div className="empty-results-box">
              <span>📅</span>
              <h4>No Active Bookings Scheduled</h4>
              <p>Your guide and transportation requests will display here after submitting requests.</p>
            </div>
          ) : (
            <div className="bookings-table-list">
              {[...localTransportBookings, ...bookings].map(b => {
                if (b.is_transport) {
                  return (
                    <div key={b.id} className="booking-log-item-card" style={{ borderLeft: '4px solid #10b981' }}>
                      <div className="booking-log-header">
                        <div>
                          <h4>🎫 Transport Ticket: {b.operator}</h4>
                          <span className="booking-log-category">{b.mode} · {b.travel_class}</span>
                        </div>
                        <span className="booking-status-badge confirmed" style={{ background: '#d1fae5', color: '#059669' }}>
                          CONFIRMED
                        </span>
                      </div>

                      <div className="booking-log-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        <p>📍 Route: <strong>{b.from} → {b.to}</strong></p>
                        <p>📅 Travel Date: <strong>{b.start_date}</strong></p>
                        <p>👥 Tickets: <strong>{b.group_size} travelers</strong></p>
                        <p>💵 Total Cost: <strong>৳{b.agreed_fee.toLocaleString()}</strong></p>
                        {b.notes && <p style={{ gridColumn: '1 / -1' }}>📝 Special Requests: <em>{b.notes}</em></p>}
                      </div>

                      <div className="booking-log-actions">
                        <button className="button leave-room-danger-btn" onClick={() => handleCancelTransportBooking(b.id)}>
                          Cancel Ticket
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={b.id} className="booking-log-item-card">
                    <div className="booking-log-header">
                      <div>
                        <h4>Booking with {b.service_provider?.user?.full_name}</h4>
                        <span className="booking-log-category">{b.service_provider?.service_type_label || b.service_provider?.service_type}</span>
                      </div>
                      <span className={`booking-status-badge ${b.status}`}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="booking-log-details">
                      <p>📅 Dates: <strong>{b.start_date} to {b.end_date}</strong></p>
                      <p>👥 Group Size: <strong>{b.group_size} travelers</strong></p>
                      {b.specific_requirements && <p>📝 Requirements: <em>{b.specific_requirements}</em></p>}
                      {b.message && <p>💬 Notes: <em>{b.message}</em></p>}
                      {b.status === 'cancelled' && b.rejection_reason && (
                        <div className="rejection-reason-box" style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem',
                          backgroundColor: '#fef2f2',
                          border: '1.5px dashed #fecaca',
                          borderRadius: '8px',
                          color: '#991b1b',
                          fontSize: '0.85rem'
                        }}>
                          <strong>🚫 Reason for Decline:</strong> "{b.rejection_reason}"
                        </div>
                      )}
                    </div>

                    <div className="booking-log-actions">
                      {(b.status === 'requested' || b.status === 'confirmed') && (
                        <button className="button leave-room-danger-btn" onClick={() => handleUpdateStatus(b.id, 'cancelled')}>
                          Cancel Request
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button className="button button-primary" onClick={() => handleUpdateStatus(b.id, 'completed')}>
                          Mark Completed
                        </button>
                      )}
                      {b.status === 'completed' && !b.review && (
                        <button className="button button-secondary" onClick={() => { setReviewSp(b.service_provider); setReviewBookingId(b.id) }}>
                          ✍️ Leave Review
                        </button>
                      )}
                      {b.status === 'completed' && b.review && (
                        <div className="completed-review-feedback">
                          ⭐⭐⭐⭐⭐ Rated {b.review.rating}/5
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Provider Details & Booking Modal */}
      {selectedSp && (
        <div className="crop-modal">
          <div className="crop-modal-content sp-details-modal-card">
            {!showBookForm ? (
              <div className="sp-details-view">
                <header className="sp-details-header">
                  <div className="sp-details-avatar">
                    {selectedSp.user?.full_name ? selectedSp.user.full_name[0] : '🤠'}
                  </div>
                  <div>
                    <h2>{selectedSp.user?.full_name}</h2>
                    <span className="sp-service-tag large">{selectedSp.service_type_label || selectedSp.service_type}</span>
                  </div>
                </header>

                <div className="sp-details-grid">
                  <div className="sp-detail-stat">
                    <span>Experience</span>
                    <strong>{selectedSp.years_of_experience} Years</strong>
                  </div>
                  <div className="sp-detail-stat">
                    <span>Price Range</span>
                    <strong>{selectedSp.fee_range}</strong>
                  </div>
                  <div className="sp-detail-stat">
                    <span>Verified Host</span>
                    <strong>{selectedSp.is_verified ? '✅ Verified' : '⏳ Pending'}</strong>
                  </div>
                </div>

                <div className="sp-text-details">
                  <h4>Service Region Coverage:</h4>
                  <p>{selectedSp.specialized_destinations}</p>

                  <h4>Languages Spoken:</h4>
                  <p>{selectedSp.languages_offered}</p>
                </div>

                <div className="crop-modal-actions">
                  <button className="button button-secondary" onClick={() => setSelectedSp(null)}>
                    Close Profile
                  </button>
                  <button className="button button-primary" onClick={() => setShowBookForm(true)}>
                    Request Booking ➔
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestBooking} className="sp-booking-form">
                <h3>Request Booking with {selectedSp.user?.full_name}</h3>
                <p className="community-muted">The guide will review your itinerary dates and group size before confirming.</p>

                <div className="double-inputs">
                  <label>
                    Start Date
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  </label>
                  <label>
                    End Date
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  </label>
                </div>

                <div className="double-inputs">
                  <label>
                    Group Size (People)
                    <input type="number" min="1" max="100" value={groupSize} onChange={e => setGroupSize(parseInt(e.target.value) || 1)} required />
                  </label>
                  <label>
                    Offered Fee (BDT)
                    <input type="number" min="1" value={offeredFee} onChange={e => setOfferedFee(e.target.value)} required placeholder="e.g. 3000..." />
                  </label>
                </div>

                <label>
                  Introduce Your Group / Trip Goal
                  <textarea value={bookMessage} onChange={e => setBookMessage(e.target.value)} placeholder="Introduce your trip plan..." />
                </label>

                <label>
                  Special Requirements
                  <textarea value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Specify any food, accessibility or scheduling needs..." />
                </label>

                <div className="crop-modal-actions" style={{ marginTop: '1rem' }}>
                  <button type="button" className="button button-secondary" onClick={() => setShowBookForm(false)} disabled={bookSubmitting}>
                    ← Back
                  </button>
                  <button type="submit" className="button button-primary" disabled={bookSubmitting}>
                    {bookSubmitting ? 'Submitting Request...' : 'Send Booking Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Transport Route Booking Modal */}
      {selectedRoute && (
        <div className="crop-modal">
          <div className="crop-modal-content sp-booking-form-card" style={{ maxWidth: '480px' }}>
            <form onSubmit={handleRequestTransportBooking} className="sp-booking-form">
              <h3>🎫 Request Transport Ticket</h3>
              <p className="community-muted">
                Book tickets for <strong>{selectedRoute.operator}</strong> ({selectedRoute.mode}) from <strong>{selectedRoute.from}</strong> to <strong>{selectedRoute.to}</strong>.
              </p>

              <div className="double-inputs">
                <label>
                  Travel Date
                  <input type="date" value={transportDate} onChange={e => setTransportDate(e.target.value)} required />
                </label>
                <label>
                  Travelers Count
                  <input type="number" min="1" max="50" value={transportGroupSize} onChange={e => setTransportGroupSize(parseInt(e.target.value) || 1)} required />
                </label>
              </div>

              <div className="filter-group">
                <label>Ticket Fare Class</label>
                <input type="text" readOnly value={selectedRoute.travelClass || selectedRoute.travel_class || 'Standard'} style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
              </div>

              <div className="filter-group">
                <label>Estimated Total Cost</label>
                <div style={{ padding: '0.65rem', background: '#f0fdf4', color: '#166534', fontWeight: 800, borderRadius: '8px', fontSize: '1.1rem', border: '1px solid #bbf7d0' }}>
                  ৳{(selectedRoute.fare * transportGroupSize).toLocaleString()} BDT
                </div>
              </div>

              <label>
                Special Booking Requests
                <textarea value={transportNotes} onChange={e => setTransportNotes(e.target.value)} placeholder="Specify seat preference, diet or timings request..." />
              </label>

              <div className="crop-modal-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="button button-secondary" onClick={() => { setSelectedRoute(null); navigate(location.pathname, { replace: true, state: {} }) }} disabled={transportSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={transportSubmitting}>
                  {transportSubmitting ? 'Requesting Ticket...' : 'Confirm Ticket Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewSp && (
        <div className="crop-modal">
          <div className="crop-modal-content write-review-modal-card">
            <h3>Write Post-Trip Review</h3>
            <p className="community-muted">Leave stars and share your feedback on {reviewSp.user?.full_name}.</p>
            
            <form onSubmit={handleSubmitReview} className="provider-review-form">
              <label>
                Star Rating
                <select value={rating} onChange={e => setRating(parseInt(e.target.value))}>
                  <option value="5">⭐⭐⭐⭐⭐ Excellent (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ Good (4/5)</option>
                  <option value="3">⭐⭐⭐ Average (3/5)</option>
                  <option value="2">⭐⭐ Fair (2/5)</option>
                  <option value="1">⭐ Poor (1/5)</option>
                </select>
              </label>

              <label>
                Written Review
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share details of your experience with this guide..."
                  required
                />
              </label>

              <div className="crop-modal-actions" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="button button-secondary" onClick={() => { setReviewSp(null); setReviewBookingId(null) }} disabled={reviewSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={reviewSubmitting || !reviewText.trim()}>
                  {reviewSubmitting ? 'Posting Review...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .bookings-page-shell {
          margin-top: 98px !important;
          margin-left: 264px !important;
          width: calc(100% - 264px) !important;
          max-width: none !important;
          padding: 0 2rem 2rem 2rem !important;
          min-height: calc(100vh - 98px);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .bookings-page-shell {
            margin-left: 80px !important;
            width: calc(100% - 80px) !important;
          }
        }
        .bookings-page-header h1 {
          margin: 0 0 0.35rem 0;
          font-size: 2.2rem;
          font-weight: 850;
          color: #0f172a;
        }
        .bookings-page-header p {
          margin: 0;
          font-size: 1.05rem;
          color: #64748b;
          max-width: 800px;
        }

        .bookings-tabs-bar {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }
        .tab-nav-btn {
          background: transparent;
          border: none;
          padding: 0.75rem 1.25rem;
          font-size: 0.95rem;
          font-weight: 750;
          color: #64748b;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .tab-nav-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }
        .tab-nav-btn.active {
          background: #e0f2fe;
          color: #0369a1;
        }

        /* Browse Hosts Layout */
        .browse-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .browse-layout { grid-template-columns: 1fr; }
        }

        .filters-sidebar-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: fit-content;
        }
        .filters-sidebar-card h3 { margin: 0; font-size: 1.05rem; font-weight: 850; color: #1e293b; }
        .filter-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .filter-group label { font-size: 0.8rem; font-weight: 750; color: #475569; }
        .filter-group select,
        .filter-group input {
          padding: 0.6rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.88rem;
          outline: none;
        }

        .providers-grid-column {
          display: flex;
          flex-direction: column;
        }
        .providers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .provider-item-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 1.25rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .provider-item-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .sp-header-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .sp-avatar-circle {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #e0f2fe;
          color: #0369a1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 800;
        }
        .sp-header-row h4 { margin: 0 0 0.15rem; font-size: 1.05rem; font-weight: 850; color: #0f172a; }
        .sp-service-tag {
          font-size: 0.72rem;
          font-weight: 750;
          background: #f1f5f9;
          color: #475569;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
          text-transform: uppercase;
        }
        .sp-service-tag.large {
          font-size: 0.85rem;
          padding: 0.25rem 0.60rem;
        }
        .sp-info-rows p { margin: 0 0 0.4rem; font-size: 0.85rem; color: #475569; }
        .sp-price { border-top: 1px solid #f1f5f9; padding-top: 0.6rem; margin-top: 0.4rem !important; }
        .view-sp-details-btn { margin-top: auto; }

        .empty-results-box {
          text-align: center;
          padding: 4rem 2rem;
          background: #f8fafc;
          border: 1.5px dashed #cbd5e1;
          border-radius: 18px;
          color: #64748b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .empty-results-box span { font-size: 3rem; }
        .empty-results-box h4 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #334155; }
        .empty-results-box p { margin: 0; font-size: 0.88rem; max-width: 320px; }

        /* Bookings Logs */
        .bookings-table-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .booking-log-item-card {
          background: white;
          border: 1.5px solid #f1f5f9;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.01);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .booking-log-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1.5px solid #f1f5f9;
          padding-bottom: 0.75rem;
        }
        .booking-log-header h4 { margin: 0 0 0.15rem; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
        .booking-log-category { font-size: 0.82rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .booking-status-badge {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
        }
        .booking-status-badge.requested { background: #fef3c7; color: #d97706; }
        .booking-status-badge.confirmed { background: #d1fae5; color: #059669; }
        .booking-status-badge.completed { background: #dbeafe; color: #2563eb; }
        .booking-status-badge.cancelled { background: #fee2e2; color: #dc2626; }

        .booking-log-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem 1rem; }
        .booking-log-details p { margin: 0; font-size: 0.88rem; color: #475569; }
        .booking-log-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          border-top: 1px solid #f1f5f9;
          padding-top: 1rem;
        }

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
          max-width: 480px;
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

        /* Detail Modal card */
        .sp-details-modal-card { max-width: 480px; }
        .sp-details-view { display: flex; flex-direction: column; gap: 1.25rem; }
        .sp-details-header { display: flex; align-items: center; gap: 1rem; }
        .sp-details-avatar { width: 60px; height: 60px; border-radius: 50%; background: #e0f2fe; color: #0369a1; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 800; }
        .sp-details-header h2 { margin: 0 0 0.25rem; font-size: 1.4rem; font-weight: 850; color: #0f172a; }
        .sp-details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; background: #f8fafc; border-radius: 12px; padding: 1rem; border: 1px solid #e2e8f0; }
        .sp-detail-stat { text-align: center; }
        .sp-detail-stat span { display: block; font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
        .sp-detail-stat strong { display: block; font-size: 0.92rem; color: #1e293b; font-weight: 800; margin-top: 0.2rem; }
        .sp-text-details h4 { margin: 0 0 0.35rem; font-size: 0.88rem; font-weight: 800; color: #334155; }
        .sp-text-details p { margin: 0 0 1rem; font-size: 0.88rem; color: #475569; }

        /* Review and booking forms */
        .sp-booking-form, .provider-review-form { display: flex; flex-direction: column; gap: 0.85rem; width: 100%; }
        .sp-booking-form label, .provider-review-form label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.82rem; font-weight: 750; color: #475569; }
        .sp-booking-form input, .sp-booking-form select, .sp-booking-form textarea,
        .provider-review-form select, .provider-review-form textarea {
          padding: 0.65rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; outline: none; background: white;
        }
        .sp-booking-form textarea, .provider-review-form textarea { height: 80px; resize: vertical; }
      `}</style>
    </main>
  )
}
