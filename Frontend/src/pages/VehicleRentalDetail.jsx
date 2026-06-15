import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../apiClient'
import './vehicle-rental-detail.css'

const VehicleRentalDetail = () => {
  const { rentalId } = useParams()
  const navigate = useNavigate()
  const [rental, setRental] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    start_date: '',
    end_date: '',
    group_size: 1,
    requirements: '',
    message: ''
  })
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review_text: '',
    photo: null
  })

  useEffect(() => {
    fetchRentalDetail()
    fetchReviews()
  }, [rentalId])

  const fetchRentalDetail = async () => {
    try {
      const res = await apiClient.get(`/vehicle-rentals/${rentalId}/`)
      if (res) {
        setRental(res)
      }
    } catch (error) {
      console.error('Error fetching rental detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await apiClient.get(`/vehicle-rentals/${rentalId}/reviews/`)
      if (res) {
        setReviews(res)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    
    // Check if user is authenticated
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('Please log in to make a booking')
      navigate('/signin')
      return
    }
    
    try {
      const res = await apiClient.post(`/vehicle-rentals/bookings/`, {
        ...bookingForm,
        rental: rentalId,
        user: userId
      })
      if (res) {
        alert('Booking request submitted successfully!')
        setShowBookingModal(false)
        setBookingForm({
          start_date: '',
          end_date: '',
          group_size: 1,
          requirements: '',
          message: ''
        })
      }
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('Failed to submit booking. Please try again.')
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await apiClient.post(`/vehicle-rentals/reviews/`, {
        ...reviewForm,
        rental: rentalId
      })
      if (res) {
        alert('Review submitted successfully!')
        setShowReviewModal(false)
        setReviewForm({
          rating: 5,
          review_text: '',
          photo: null
        })
        fetchReviews()
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
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

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!rental) {
    return <div className="error">Vehicle rental not found</div>
  }

  return (
    <div className="vehicle-rental-detail-page">
      <div className="container">
        <button className="back-button" onClick={() => navigate('/traveler/local-services')}>
          ← Back to Local Services
        </button>

        <div className="rental-header">
          <h1>{rental.name}</h1>
          <div className="rental-rating">
            {renderStars(rental.rating)}
            <span className="rating-count">({rental.reviews_count || 0} reviews)</span>
          </div>
        </div>

        <div className="rental-content">
          <div className="rental-info">
            <div className="info-section">
              <h2>About</h2>
              <p>{rental.description || 'No description available'}</p>
            </div>

            <div className="info-section">
              <h2>Details</h2>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Vehicle Type:</span>
                  <span className="value">{rental.vehicle_type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Capacity:</span>
                  <span className="value">{rental.capacity} people</span>
                </div>
                <div className="detail-item">
                  <span className="label">Price:</span>
                  <span className="value price">৳{rental.price_per_day}/day</span>
                </div>
                <div className="detail-item">
                  <span className="label">Destination:</span>
                  <span className="value">{rental.destination_name}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h2>Features</h2>
              <div className="features-list">
                {rental.features_list && rental.features_list.length > 0 ? (
                  rental.features_list.map((feature, index) => (
                    <span key={index} className="feature-tag">{feature}</span>
                  ))
                ) : (
                  <p>No features listed</p>
                )}
              </div>
            </div>

            <button className="book-button" onClick={() => setShowBookingModal(true)}>
              Book Now
            </button>
          </div>

          <div className="rental-reviews">
            <h2>Reviews</h2>
            {reviews.length > 0 ? (
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <span className="reviewer-name">{review.user_name}</span>
                      <div className="review-rating">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="review-text">{review.review_text}</p>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No reviews yet</p>
            )}
            <button className="review-button" onClick={() => setShowReviewModal(true)}>
              Leave a Review
            </button>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Book {rental.name}</h2>
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  required
                  value={bookingForm.start_date}
                  onChange={(e) => setBookingForm({...bookingForm, start_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  required
                  value={bookingForm.end_date}
                  onChange={(e) => setBookingForm({...bookingForm, end_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Group Size</label>
                <input
                  type="number"
                  min="1"
                  max={rental.capacity}
                  required
                  value={bookingForm.group_size}
                  onChange={(e) => setBookingForm({...bookingForm, group_size: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Requirements</label>
                <textarea
                  value={bookingForm.requirements}
                  onChange={(e) => setBookingForm({...bookingForm, requirements: e.target.value})}
                  placeholder="Any special requirements..."
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={bookingForm.message}
                  onChange={(e) => setBookingForm({...bookingForm, message: e.target.value})}
                  placeholder="Additional message to the rental provider..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowBookingModal(false)}>Cancel</button>
                <button type="submit">Submit Booking Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Leave a Review</h2>
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>Rating</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({...reviewForm, rating: parseInt(e.target.value)})}
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>
              <div className="form-group">
                <label>Review</label>
                <textarea
                  required
                  value={reviewForm.review_text}
                  onChange={(e) => setReviewForm({...reviewForm, review_text: e.target.value})}
                  placeholder="Share your experience..."
                />
              </div>
              <div className="form-group">
                <label>Photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReviewForm({...reviewForm, photo: e.target.files[0]})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowReviewModal(false)}>Cancel</button>
                <button type="submit">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleRentalDetail
