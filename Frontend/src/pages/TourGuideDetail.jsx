import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../apiClient'
import './tour-guide-detail.css'

const TourGuideDetail = () => {
  const { guideId } = useParams()
  const navigate = useNavigate()
  const [guide, setGuide] = useState(null)
  const [availabilities, setAvailabilities] = useState([])
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
    fetchGuideDetail()
    fetchAvailabilities()
    fetchReviews()
  }, [guideId])

  const fetchGuideDetail = async () => {
    try {
      const res = await apiClient.get(`/tour-guides/${guideId}/`)
      if (res) {
        setGuide(res)
      }
    } catch (error) {
      console.error('Error fetching guide detail:', error)
    }
  }

  const fetchAvailabilities = async () => {
    try {
      const res = await apiClient.get(`/tour-guides/${guideId}/availabilities/`)
      if (res) {
        setAvailabilities(res)
      }
    } catch (error) {
      console.error('Error fetching availabilities:', error)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await apiClient.get(`/tour-guides/${guideId}/reviews/`)
      if (res) {
        setReviews(res)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
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
      const res = await apiClient.post('/tour-guides/bookings/', {
        ...bookingForm,
        guide: guideId,
        user: userId
      })
      if (res) {
        setShowBookingModal(false)
        alert('Booking request sent successfully!')
        setBookingForm({
          start_date: '',
          end_date: '',
          group_size: 1,
          requirements: '',
          message: ''
        })
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await apiClient.post(`/tour-guides/${guideId}/reviews/`, reviewForm)
      if (res) {
        setShowReviewModal(false)
        alert('Review submitted successfully!')
        setReviewForm({
          rating: 5,
          review_text: '',
          photo: null
        })
        fetchReviews()
        fetchGuideDetail()
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
    return <div className="loading">Loading guide details...</div>
  }

  if (!guide) {
    return <div className="error">Guide not found</div>
  }

  return (
    <div className="tour-guide-detail-page">
      <div className="container">
        <button className="back-button" onClick={() => navigate('/traveler/local-services')}>
          ← Back to Local Services
        </button>

        <div className="guide-header">
          <div className="guide-photo-large">
            {guide.profile_photo ? (
              <img src={`data:image/jpeg;base64,${guide.profile_photo}`} alt={guide.full_name} />
            ) : (
              <div className="placeholder-photo-large">{guide.full_name?.charAt(0) || 'G'}</div>
            )}
            {guide.is_verified && <span className="verified-badge-large">✓ Verified</span>}
          </div>
          <div className="guide-header-info">
            <h1>{guide.full_name || guide.username}</h1>
            <p className="service-type-large">{guide.service_type}</p>
            <div className="rating-large">
              {renderStars(guide.rating)}
              <span className="rating-count">({guide.reviews_count} reviews)</span>
            </div>
            <div className="price-large">
              <span className="price-amount">৳{guide.price_per_day}</span>
              <span className="price-period">/day</span>
            </div>
            <button
              className="book-button"
              onClick={() => setShowBookingModal(true)}
              disabled={!guide.is_available}
            >
              {guide.is_available ? 'Book Now' : 'Not Available'}
            </button>
          </div>
        </div>

        <div className="guide-content">
          <div className="guide-main">
            <div className="section">
              <h2>About</h2>
              <p className="bio">{guide.bio || 'No bio available.'}</p>
            </div>

            <div className="section">
              <h2>Specialties</h2>
              <p>{guide.specialties || 'No specialties listed.'}</p>
            </div>

            <div className="section">
              <h2>Languages</h2>
              <div className="tags">
                {guide.languages_list?.map((lang, index) => (
                  <span key={index} className="tag">{lang}</span>
                )) || <p>{guide.languages || 'No languages listed.'}</p>}
              </div>
            </div>

            <div className="section">
              <h2>Destinations</h2>
              <div className="tags">
                {guide.destination_names?.map((dest, index) => (
                  <span key={index} className="tag">{dest}</span>
                )) || <p>No destinations listed.</p>}
              </div>
            </div>

            <div className="section">
              <h2>Availability Calendar</h2>
              <div className="availability-list">
                {availabilities.length === 0 ? (
                  <p>No availability information available.</p>
                ) : (
                  availabilities.map((avail) => (
                    <div key={avail.id} className="availability-item">
                      <span className="date">{avail.date}</span>
                      <span className={`status ${avail.is_available ? 'available' : 'unavailable'}`}>
                        {avail.is_available ? 'Available' : 'Not Available'}
                      </span>
                      {avail.notes && <span className="notes">{avail.notes}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="section">
              <h2>Reviews ({reviews.length})</h2>
              <div className="reviews-list">
                {reviews.length === 0 ? (
                  <p>No reviews yet.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <span className="reviewer-name">{review.full_name || review.username}</span>
                        <div className="review-rating">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="review-text">{review.review_text}</p>
                      {review.photo && (
                        <img
                          src={`data:image/jpeg;base64,${review.photo}`}
                          alt="Review photo"
                          className="review-photo"
                        />
                      )}
                      <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
              <button className="write-review-button" onClick={() => setShowReviewModal(true)}>
                Write a Review
              </button>
            </div>
          </div>

          <div className="guide-sidebar">
            <div className="sidebar-card">
              <h3>Quick Info</h3>
              <div className="info-item">
                <span className="label">Service Type:</span>
                <span className="value">{guide.service_type}</span>
              </div>
              <div className="info-item">
                <span className="label">Price per Day:</span>
                <span className="value">৳{guide.price_per_day}</span>
              </div>
              <div className="info-item">
                <span className="label">Rating:</span>
                <span className="value">{guide.rating} / 5.0</span>
              </div>
              <div className="info-item">
                <span className="label">Reviews:</span>
                <span className="value">{guide.reviews_count}</span>
              </div>
              <div className="info-item">
                <span className="label">Status:</span>
                <span className={`value ${guide.is_available ? 'available' : 'unavailable'}`}>
                  {guide.is_available ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {showBookingModal && (
          <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Book {guide.full_name || guide.username}</h2>
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
                    required
                    value={bookingForm.group_size}
                    onChange={(e) => setBookingForm({...bookingForm, group_size: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Special Requirements</label>
                  <textarea
                    value={bookingForm.requirements}
                    onChange={(e) => setBookingForm({...bookingForm, requirements: e.target.value})}
                    placeholder="Any special requirements..."
                  />
                </div>
                <div className="form-group">
                  <label>Message to Guide</label>
                  <textarea
                    required
                    value={bookingForm.message}
                    onChange={(e) => setBookingForm({...bookingForm, message: e.target.value})}
                    placeholder="Introduce yourself and describe your trip..."
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowBookingModal(false)}>Cancel</button>
                  <button type="submit">Send Booking Request</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showReviewModal && (
          <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Write a Review</h2>
              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label>Rating</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({...reviewForm, rating: parseInt(e.target.value)})}
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Good</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Poor</option>
                    <option value={1}>1 Star - Terrible</option>
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
    </div>
  )
}

export default TourGuideDetail
