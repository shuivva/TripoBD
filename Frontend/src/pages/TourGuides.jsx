import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../apiClient'
import './tour-guides.css'

const TourGuides = () => {
  const navigate = useNavigate()
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    destination: '',
    service_type: '',
    language: '',
    min_price: '',
    max_price: '',
    min_rating: ''
  })

  useEffect(() => {
    fetchGuides()
  }, [filters])

  const fetchGuides = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      const res = await apiClient.get(`/tour-guides/?${params}`)
      if (res) {
        setGuides(res)
      }
    } catch (error) {
      console.error('Error fetching guides:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const handleGuideClick = (guideId) => {
    navigate(`/tour-guides/${guideId}`)
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
    return <div className="loading">Loading guides...</div>
  }

  return (
    <div className="tour-guides-page">
      <div className="container">
        <h1>Tour Guides & Local Services</h1>
        
        <div className="filters-section">
          <h2>Filter Guides</h2>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Destination</label>
              <input
                type="text"
                name="destination"
                value={filters.destination}
                onChange={handleFilterChange}
                placeholder="Search destination..."
              />
            </div>
            <div className="filter-group">
              <label>Service Type</label>
              <select
                name="service_type"
                value={filters.service_type}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="guide">Tour Guide</option>
                <option value="driver">Driver</option>
                <option value="translator">Translator</option>
                <option value="photographer">Photographer</option>
                <option value="assistant">Travel Assistant</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Language</label>
              <select
                name="language"
                value={filters.language}
                onChange={handleFilterChange}
              >
                <option value="">All Languages</option>
                <option value="english">English</option>
                <option value="bengali">Bengali</option>
                <option value="hindi">Hindi</option>
                <option value="arabic">Arabic</option>
                <option value="chinese">Chinese</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="spanish">Spanish</option>
                <option value="japanese">Japanese</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Min Price (per day)</label>
              <input
                type="number"
                name="min_price"
                value={filters.min_price}
                onChange={handleFilterChange}
                placeholder="Min price"
              />
            </div>
            <div className="filter-group">
              <label>Max Price (per day)</label>
              <input
                type="number"
                name="max_price"
                value={filters.max_price}
                onChange={handleFilterChange}
                placeholder="Max price"
              />
            </div>
            <div className="filter-group">
              <label>Min Rating</label>
              <select
                name="min_rating"
                value={filters.min_rating}
                onChange={handleFilterChange}
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>
          </div>
        </div>

        <div className="guides-grid">
          {guides.length === 0 ? (
            <div className="no-results">No guides found matching your filters.</div>
          ) : (
            guides.map((guide) => (
              <div key={guide.id} className="guide-card" onClick={() => handleGuideClick(guide.id)}>
                <div className="guide-photo">
                  {guide.profile_photo ? (
                    <img src={`data:image/jpeg;base64,${guide.profile_photo}`} alt={guide.full_name} />
                  ) : (
                    <div className="placeholder-photo">{guide.full_name?.charAt(0) || 'G'}</div>
                  )}
                  {guide.is_verified && <span className="verified-badge">✓ Verified</span>}
                </div>
                <div className="guide-info">
                  <h3>{guide.full_name || guide.username}</h3>
                  <p className="service-type">{guide.service_type}</p>
                  <div className="rating">
                    {renderStars(guide.rating)}
                    <span className="rating-count">({guide.reviews_count} reviews)</span>
                  </div>
                  <p className="specialties">{guide.specialties}</p>
                  <div className="languages">
                    <strong>Languages:</strong> {guide.languages_list?.join(', ') || guide.languages}
                  </div>
                  <div className="destinations">
                    <strong>Destinations:</strong> {guide.destination_names?.join(', ') || 'Any'}
                  </div>
                  <div className="price">
                    <span className="price-amount">৳{guide.price_per_day}</span>
                    <span className="price-period">/day</span>
                  </div>
                  {guide.bio && <p className="bio">{guide.bio.substring(0, 100)}...</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default TourGuides
