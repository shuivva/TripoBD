import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function TourGuides() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('guides')
  const [guides, setGuides] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState(null)
  
  const userId = searchParams.get('user_id')

  useEffect(() => {
    fetchAllData()
  }, [userId])

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchGuides(),
        fetchBookings()
      ])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchGuides = async () => {
    const response = await fetch('http://localhost:8000/api/guides/')
    const data = await response.json()
    if (response.ok) setGuides(data)
  }

  const fetchBookings = async () => {
    if (userId) {
      const response = await fetch(`http://localhost:8000/api/bookings/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) setBookings(data)
    }
  }

  const handleBookGuide = (guide) => {
    setSelectedGuide(guide)
    setShowBookingModal(true)
  }

  const handleCreateBooking = async (bookingData) => {
    try {
      const response = await fetch('http://localhost:8000/api/bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookingData, user: userId, service_type: 'guide' })
      })
      if (response.ok) {
        alert('Booking created successfully!')
        setShowBookingModal(false)
        fetchBookings()
      }
    } catch (err) {
      alert('Failed to create booking')
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <main className="guides-page">
      <div className="guides-container">
        <header className="guides-header">
          <h1>Tour Guides & Local Bookings</h1>
        </header>

        <div className="guides-tabs">
          <button className={`guides-tab ${activeTab === 'guides' ? 'active' : ''}`} onClick={() => setActiveTab('guides')}>
            Browse Guides
          </button>
          <button className={`guides-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            My Bookings
          </button>
        </div>

        {activeTab === 'guides' && (
          <div className="guides-section">
            <div className="guides-grid">
              {guides.map(guide => (
                <div key={guide.id} className="guide-card">
                  <div className="guide-photo">
                    {guide.photo ? (
                      <img src={guide.photo} alt={guide.name} />
                    ) : (
                      <div className="guide-placeholder">{guide.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="guide-info">
                    <h3>{guide.name}</h3>
                    <p className="guide-location">📍 {guide.location}</p>
                    <p className="guide-specialty">Specializes in: {guide.specialties}</p>
                    <div className="guide-rating">
                      <span className="stars">{'★'.repeat(Math.floor(guide.rating))}</span>
                      <span>({guide.rating})</span>
                    </div>
                    <p className="guide-price">৳{guide.hourly_rate}/hour</p>
                    <p className="guide-languages">Languages: {guide.languages}</p>
                    <button className="btn-primary" onClick={() => handleBookGuide(guide)}>
                      Book Guide
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bookings-section">
            {bookings.length > 0 ? (
              <div className="bookings-list">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <h3>{booking.service_name || 'Guide Booking'}</h3>
                      <span className={`booking-status ${booking.status}`}>{booking.status}</span>
                    </div>
                    <div className="booking-details">
                      <p>📅 {booking.booking_date}</p>
                      <p>⏰ {booking.time_slot}</p>
                      <p>👥 {booking.guests} guests</p>
                      <p>💰 ৳{booking.total_amount}</p>
                    </div>
                    <div className="booking-actions">
                      <button className="btn-secondary">View Details</button>
                      <button className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h2>No Bookings Yet</h2>
                <p>Book a tour guide or local service to get started!</p>
                <button className="btn-primary" onClick={() => setActiveTab('guides')}>
                  Browse Guides
                </button>
              </div>
            )}
          </div>
        )}

        {showBookingModal && (
          <BookingModal
            guide={selectedGuide}
            onClose={() => setShowBookingModal(false)}
            onBook={handleCreateBooking}
          />
        )}
      </div>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .guides-page{min-height:100vh;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%);padding:2.5rem;font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
        .guides-container{max-width:1600px;margin:0 auto;display:flex;flex-direction:column;gap:2.5rem}
        .guides-header{padding:2rem 2.5rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.5rem;box-shadow:0 8px 32px rgba(0,0,0,0.08);border:2px solid rgba(243,244,246,0.8)}
        .guides-header h1{margin:0;font-size:2rem;font-weight:800;color:#111827;letter-spacing:-0.02em}
        .guides-tabs{display:flex;gap:0.75rem;padding:1rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 16px rgba(0,0,0,0.06)}
        .guides-tab{padding:0.85rem 2rem;background:transparent;border:none;border-radius:12px;cursor:pointer;color:#6b7280;font-weight:700;font-size:0.95rem;transition:all .3s}
        .guides-tab:hover{background:#f3f4f6;color:#374151}
        .guides-tab.active{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
        .guides-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:1.75rem}
        .guide-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border:2px solid rgba(243,244,246,0.8);border-radius:1.5rem;overflow:hidden;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,0.06)}
        .guide-card:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(0,0,0,0.12);border-color:rgba(59,130,246,0.3)}
        .guide-photo{height:240px;overflow:hidden;position:relative}
        .guide-photo img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
        .guide-card:hover .guide-photo img{transform:scale(1.05)}
        .guide-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#f59e0b,#ef4444);display:flex;align-items:center;justify-content:center;font-size:5rem;font-weight:800;color:white}
        .guide-info{padding:1.75rem}
        .guide-info h3{margin:0 0 0.75rem 0;font-size:1.35rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .guide-info p{margin:0.35rem 0;color:#6b7280;font-size:0.9rem;font-weight:500}
        .guide-rating{display:flex;align-items:center;gap:0.5rem;margin:0.75rem 0;padding:0.5rem 0.75rem;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:8px;display:inline-block}
        .guide-rating .stars{color:#f59e0b;font-size:1.1rem;font-weight:800}
        .guide-rating span{color:#92400e;font-weight:700;font-size:0.9rem}
        .guide-price{font-weight:800;color:#059669;font-size:1.1rem;margin-top:0.5rem}
        .bookings-list{display:flex;flex-direction:column;gap:1.25rem}
        .booking-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border:2px solid rgba(243,244,246,0.8);border-radius:1.25rem;padding:2rem;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,0.06)}
        .booking-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.1)}
        .booking-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem}
        .booking-header h3{margin:0;font-size:1.25rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .booking-status{padding:0.4rem 1rem;border-radius:999px;font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em}
        .booking-status.pending{background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e;box-shadow:0 2px 8px rgba(245,158,11,0.2)}
        .booking-status.confirmed{background:linear-gradient(135deg,#d1fae5,#a7f3d0);color:#065f46;box-shadow:0 2px 8px rgba(16,185,129,0.2)}
        .booking-status.cancelled{background:linear-gradient(135deg,#fee2e2,#fecaca);color:#991b1b;box-shadow:0 2px 8px rgba(239,68,68,0.2)}
        .booking-details{display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem;margin-bottom:1.25rem}
        .booking-details p{margin:0;color:#6b7280;font-size:0.9rem;font-weight:500}
        .booking-details p strong{color:#111827;font-weight:700}
        .booking-actions{display:flex;gap:0.75rem;margin-top:1.25rem}
        .btn-primary{padding:0.85rem 1.75rem;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.95rem;transition:all .3s;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(59,130,246,0.4)}
        .btn-secondary{padding:0.85rem 1.75rem;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);color:#374151;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.95rem;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
        .btn-secondary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(8px)}
        .modal{background:rgba(255,255,255,0.98);backdrop-filter:blur(20px);border-radius:1.5rem;max-width:550px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,0.25);border:2px solid rgba(255,255,255,0.5)}
        .modal-header{display:flex;justify-content:space-between;align-items:center;padding:2rem;border-bottom:2px solid #f3f4f6}
        .modal-header h2{margin:0;font-size:1.5rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .btn-close{background:none;border:none;font-size:1.5rem;cursor:pointer;color:#9ca3af;padding:0.5rem;border-radius:8px;transition:all .2s}
        .btn-close:hover{background:#f3f4f6;color:#374151}
        .modal-body{padding:2rem;display:flex;flex-direction:column;gap:1.25rem}
        .form-group{display:flex;flex-direction:column;gap:0.5rem}
        .form-group label{font-size:0.9rem;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
        .form-group input,.form-group textarea,.form-group select{padding:0.85rem 1rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.95rem;font-family:inherit;transition:all .2s;background:#f9fafb}
        .form-group input:focus,.form-group textarea:focus,.form-group select:focus{outline:none;border-color:#3b82f6;background:white;box-shadow:0 4px 16px rgba(59,130,246,0.15)}
        .booking-summary{padding:1.5rem;background:linear-gradient(135deg,#f9fafb,#f3f4f6);border-radius:12px;border:2px solid #e5e7eb}
        .booking-summary p{margin:0.35rem 0;font-size:0.95rem;color:#6b7280;font-weight:500}
        .booking-summary p strong{color:#111827;font-weight:800}
        .form-actions{display:flex;gap:1rem;margin-top:1.5rem}
        .empty-state{text-align:center;padding:5rem 2rem}
        .empty-icon{font-size:5rem;margin-bottom:1.5rem}
        .empty-state h2{font-size:1.75rem;font-weight:800;color:#111827;margin:0 0 1rem}
        .empty-state p{color:#6b7280;font-size:1.1rem;margin-bottom:2rem}
        .loading{text-align:center;padding:6rem;font-size:1.5rem;color:#6b7280;font-weight:600}

        @media (max-width: 768px) {
          .guides-page{padding:1.5rem}
          .guides-header{padding:1.5rem}
          .guides-header h1{font-size:1.5rem}
          .guides-tabs{flex-wrap:justify-content}
          .guides-tab{padding:0.75rem 1.25rem;font-size:0.85rem}
          .guides-grid{grid-template-columns:1fr}
          .booking-details{grid-template-columns:1fr}
          .modal{max-width:95%}
          .modal-header,.modal-body{padding:1.5rem}
        }
      `}</style>
    </main>
  )
}

function BookingModal({ guide, onClose, onBook }) {
  const [formData, setFormData] = useState({
    booking_date: '',
    time_slot: '',
    guests: 1,
    notes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onBook({
      ...formData,
      service_id: guide.id,
      service_name: guide.name,
      hourly_rate: guide.hourly_rate,
      total_amount: formData.guests * guide.hourly_rate
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Book {guide.name}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.booking_date}
              onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Time Slot</label>
            <select
              value={formData.time_slot}
              onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
              required
            >
              <option value="">Select time</option>
              <option value="09:00-12:00">09:00 - 12:00</option>
              <option value="12:00-15:00">12:00 - 15:00</option>
              <option value="15:00-18:00">15:00 - 18:00</option>
              <option value="18:00-21:00">18:00 - 21:00</option>
            </select>
          </div>
          <div className="form-group">
            <label>Number of Guests</label>
            <input
              type="number"
              value={formData.guests}
              onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
              min="1"
              max="20"
              required
            />
          </div>
          <div className="form-group">
            <label>Special Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any special requirements..."
            />
          </div>
          <div className="booking-summary">
            <p><strong>Rate:</strong> ৳{guide.hourly_rate}/hour</p>
            <p><strong>Estimated Total:</strong> ৳{formData.guests * guide.hourly_rate}</p>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Confirm Booking</button>
          </div>
        </form>
      </div>
    </div>
  )
}