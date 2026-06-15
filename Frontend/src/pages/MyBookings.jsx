import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../apiClient'
import './my-bookings.css'

const MyBookings = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('guides')
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }
      
      // Try to fetch profile to verify session
      await apiClient.get(`/traveler/profile/${userId}/`)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Authentication check failed:', error)
      // If 401, clear localStorage and show login
      if (error.message.includes('401')) {
        localStorage.removeItem('userId')
        setIsAuthenticated(false)
      } else {
        // For other errors (like 404), still allow access if userId exists
        // This handles the case where profile doesn't exist but user is logged in
        setIsAuthenticated(true)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated === false) {
      setLoading(false)
      return
    }

    if (isAuthenticated === true) {
      if (activeTab === 'guides') {
        fetchGuideBookings()
      } else if (activeTab === 'boats') {
        fetchBoatCharterBookings()
      } else if (activeTab === 'vehicles') {
        fetchVehicleRentalBookings()
      }
    }
  }, [activeTab, isAuthenticated])

  const fetchGuideBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get('/tour-guides/bookings/')
      setBookings(res || [])
    } catch (error) {
      console.error('Error fetching guide bookings:', error)
      if (error.message.includes('401')) {
        setIsAuthenticated(false)
        localStorage.removeItem('userId')
      }
      setError('Failed to load bookings. Please try again.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBoatCharterBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get('/boat-charters/bookings/')
      setBookings(res || [])
    } catch (error) {
      console.error('Error fetching boat charter bookings:', error)
      if (error.message.includes('401')) {
        setIsAuthenticated(false)
        localStorage.removeItem('userId')
      }
      setError('Failed to load bookings. Please try again.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicleRentalBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get('/vehicle-rentals/bookings/')
      setBookings(res || [])
    } catch (error) {
      console.error('Error fetching vehicle rental bookings:', error)
      if (error.message.includes('401')) {
        setIsAuthenticated(false)
        localStorage.removeItem('userId')
      }
      setError('Failed to load bookings. Please try again.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId, type) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return

    try {
      let endpoint
      if (type === 'guides') {
        endpoint = `/tour-guides/bookings/${bookingId}/`
      } else if (type === 'boats') {
        endpoint = `/boat-charters/bookings/${bookingId}/`
      } else if (type === 'vehicles') {
        endpoint = `/vehicle-rentals/bookings/${bookingId}/`
      }

      await apiClient.delete(endpoint)
      alert('Booking cancelled successfully!')
      
      // Refresh bookings
      if (activeTab === 'guides') {
        fetchGuideBookings()
      } else if (activeTab === 'boats') {
        fetchBoatCharterBookings()
      } else if (activeTab === 'vehicles') {
        fetchVehicleRentalBookings()
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking. Please try again.')
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'requested':
        return 'status-requested'
      case 'confirmed':
        return 'status-confirmed'
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return ''
    }
  }

  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<span key={i} className="star filled">★</span>)
      } else {
        stars.push(<span key={i} className="star">★</span>)
      }
    }
    return stars
  }

  const upcomingBookings = bookings.filter(b => 
    ['requested', 'confirmed'].includes(b.status) && new Date(b.start_date) >= new Date()
  )
  const pastBookings = bookings.filter(b => 
    ['completed', 'cancelled'].includes(b.status) || new Date(b.end_date) < new Date()
  )

  if (loading) {
    return <div className="loading">Loading bookings...</div>
  }

  if (isAuthenticated === false) {
    return (
      <div className="my-bookings-page">
        <div className="container">
          <div className="no-bookings" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Please Sign In</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>You need to sign in to view your bookings.</p>
            <button
              className="button button-primary"
              onClick={() => navigate('/signin')}
              style={{ padding: '12px 30px', fontSize: '1rem' }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-bookings-page">
        <div className="container">
          <div className="no-bookings" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Error</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>{error}</p>
            <button
              className="button button-primary"
              onClick={() => window.location.reload()}
              style={{ padding: '12px 30px', fontSize: '1rem' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-bookings-page">
      <div className="container">
        <h1>My Bookings</h1>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'guides' ? 'active' : ''}`}
            onClick={() => setActiveTab('guides')}
          >
            Tour Guides
          </button>
          <button
            className={`tab ${activeTab === 'boats' ? 'active' : ''}`}
            onClick={() => setActiveTab('boats')}
          >
            Boat Charters
          </button>
          <button
            className={`tab ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            Vehicle Rentals
          </button>
        </div>

        <div className="bookings-section">
          <h2>Upcoming Bookings ({upcomingBookings.length})</h2>
          {upcomingBookings.length === 0 ? (
            <div className="no-bookings">No upcoming bookings.</div>
          ) : (
            <div className="bookings-list">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h3>
                      {activeTab === 'guides' && booking.guide_name}
                      {activeTab === 'boats' && booking.charter_name}
                      {activeTab === 'vehicles' && booking.rental_name}
                    </h3>
                    <span className={`status ${getStatusClass(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="booking-details">
                    <div className="detail-item">
                      <span className="label">Start Date:</span>
                      <span className="value">{new Date(booking.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">End Date:</span>
                      <span className="value">{new Date(booking.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Group Size:</span>
                      <span className="value">{booking.group_size} people</span>
                    </div>
                    {booking.total_price && (
                      <div className="detail-item">
                        <span className="label">Total Price:</span>
                        <span className="value price">৳{booking.total_price}</span>
                      </div>
                    )}
                  </div>
                  {booking.requirements && (
                    <div className="booking-requirements">
                      <strong>Requirements:</strong> {booking.requirements}
                    </div>
                  )}
                  {booking.message && (
                    <div className="booking-message">
                      <strong>Message:</strong> {booking.message}
                    </div>
                  )}
                  {booking.status === 'requested' && (
                    <button
                      className="cancel-button"
                      onClick={() => handleCancelBooking(booking.id, activeTab)}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <h2>Past Bookings ({pastBookings.length})</h2>
          {pastBookings.length === 0 ? (
            <div className="no-bookings">No past bookings.</div>
          ) : (
            <div className="bookings-list">
              {pastBookings.map((booking) => (
                <div key={booking.id} className="booking-card past">
                  <div className="booking-header">
                    <h3>
                      {activeTab === 'guides' && booking.guide_name}
                      {activeTab === 'boats' && booking.charter_name}
                      {activeTab === 'vehicles' && booking.rental_name}
                    </h3>
                    <span className={`status ${getStatusClass(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="booking-details">
                    <div className="detail-item">
                      <span className="label">Start Date:</span>
                      <span className="value">{new Date(booking.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">End Date:</span>
                      <span className="value">{new Date(booking.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Group Size:</span>
                      <span className="value">{booking.group_size} people</span>
                    </div>
                    {booking.total_price && (
                      <div className="detail-item">
                        <span className="label">Total Price:</span>
                        <span className="value price">৳{booking.total_price}</span>
                      </div>
                    )}
                  </div>
                  {booking.status === 'completed' && activeTab === 'guides' && (
                    <button
                      className="review-button"
                      onClick={() => navigate(`/tour-guides/${booking.guide}`)}
                    >
                      Leave a Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyBookings
