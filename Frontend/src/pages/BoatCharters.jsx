import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../apiClient'
import './boat-charters.css'

const BoatCharters = () => {
  const navigate = useNavigate()
  const [charters, setCharters] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    destination: '',
    boat_type: '',
    min_capacity: '',
    min_price: '',
    max_price: '',
    min_rating: ''
  })

  useEffect(() => {
    fetchCharters()
  }, [filters])

  const fetchCharters = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      const res = await apiClient.get(`/boat-charters/?${params}`)
      if (res) {
        setCharters(res)
      }
    } catch (error) {
      console.error('Error fetching boat charters:', error)
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

  const handleCharterClick = (charterId) => {
    navigate(`/boat-charters/${charterId}`)
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
    return <div className="loading">Loading boat charters...</div>
  }

  return (
    <div className="boat-charters-page">
      <div className="container">
        <h1>Boat Charters</h1>
        
        <div className="filters-section">
          <h2>Filter Charters</h2>
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
              <label>Boat Type</label>
              <select
                name="boat_type"
                value={filters.boat_type}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="speedboat">Speedboat</option>
                <option value="fishing_boat">Fishing Boat</option>
                <option value="houseboat">Houseboat</option>
                <option value="yacht">Yacht</option>
                <option value="sailboat">Sailboat</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Min Capacity</label>
              <input
                type="number"
                name="min_capacity"
                value={filters.min_capacity}
                onChange={handleFilterChange}
                placeholder="Min capacity"
              />
            </div>
            <div className="filter-group">
              <label>Min Price (per hour)</label>
              <input
                type="number"
                name="min_price"
                value={filters.min_price}
                onChange={handleFilterChange}
                placeholder="Min price"
              />
            </div>
            <div className="filter-group">
              <label>Max Price (per hour)</label>
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

        <div className="charters-grid">
          {charters.length === 0 ? (
            <div className="no-results">No boat charters found matching your filters.</div>
          ) : (
            charters.map((charter) => (
              <div key={charter.id} className="charter-card" onClick={() => handleCharterClick(charter.id)}>
                <div className="charter-photo">
                  {charter.photos ? (
                    <img src={`data:image/jpeg;base64,${charter.photos}`} alt={charter.name} />
                  ) : (
                    <div className="placeholder-photo">{charter.name.charAt(0)}</div>
                  )}
                </div>
                <div className="charter-info">
                  <h3>{charter.name}</h3>
                  <p className="boat-type">{charter.boat_type.replace('_', ' ')}</p>
                  <div className="rating">
                    {renderStars(charter.rating)}
                    <span className="rating-count">({charter.reviews_count} reviews)</span>
                  </div>
                  <p className="destination-name">{charter.destination_name}</p>
                  <div className="capacity">
                    <strong>Capacity:</strong> {charter.capacity} people
                  </div>
                  <div className="price">
                    <span className="price-amount">৳{charter.price_per_hour}</span>
                    <span className="price-period">/hour</span>
                    {charter.price_per_day && (
                      <>
                        <span className="price-divider">or</span>
                        <span className="price-amount">৳{charter.price_per_day}</span>
                        <span className="price-period">/day</span>
                      </>
                    )}
                  </div>
                  {charter.description && <p className="description">{charter.description.substring(0, 100)}...</p>}
                  {charter.features_list && (
                    <div className="features">
                      {charter.features_list.slice(0, 3).map((feature, index) => (
                        <span key={index} className="feature-tag">{feature}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default BoatCharters
