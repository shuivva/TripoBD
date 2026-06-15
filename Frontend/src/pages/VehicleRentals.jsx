import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../apiClient'
import './vehicle-rentals.css'

const VehicleRentals = () => {
  const navigate = useNavigate()
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    destination: '',
    vehicle_type: '',
    min_capacity: '',
    min_price: '',
    max_price: '',
    min_rating: ''
  })

  useEffect(() => {
    fetchRentals()
  }, [filters])

  const fetchRentals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      const res = await apiClient.get(`/vehicle-rentals/?${params}`)
      if (res) {
        setRentals(res)
      }
    } catch (error) {
      console.error('Error fetching vehicle rentals:', error)
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

  const handleRentalClick = (rentalId) => {
    navigate(`/vehicle-rentals/${rentalId}`)
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
    return <div className="loading">Loading vehicle rentals...</div>
  }

  return (
    <div className="vehicle-rentals-page">
      <div className="container">
        <h1>Vehicle Rentals</h1>
        
        <div className="filters-section">
          <h2>Filter Rentals</h2>
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
              <label>Vehicle Type</label>
              <select
                name="vehicle_type"
                value={filters.vehicle_type}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="car">Car</option>
                <option value="suv">SUV</option>
                <option value="van">Van</option>
                <option value="bus">Bus</option>
                <option value="motorcycle">Motorcycle</option>
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

        <div className="rentals-grid">
          {rentals.length === 0 ? (
            <div className="no-results">No vehicle rentals found matching your filters.</div>
          ) : (
            rentals.map((rental) => (
              <div key={rental.id} className="rental-card" onClick={() => handleRentalClick(rental.id)}>
                <div className="rental-photo">
                  {rental.photos ? (
                    <img src={`data:image/jpeg;base64,${rental.photos}`} alt={rental.name} />
                  ) : (
                    <div className="placeholder-photo">{rental.name.charAt(0)}</div>
                  )}
                </div>
                <div className="rental-info">
                  <h3>{rental.name}</h3>
                  <p className="vehicle-type">{rental.vehicle_type.toUpperCase()}</p>
                  <div className="rating">
                    {renderStars(rental.rating)}
                    <span className="rating-count">({rental.reviews_count} reviews)</span>
                  </div>
                  <p className="destination-name">{rental.destination_name}</p>
                  <div className="capacity">
                    <strong>Capacity:</strong> {rental.capacity} people
                  </div>
                  <div className="price">
                    <span className="price-amount">৳{rental.price_per_day}</span>
                    <span className="price-period">/day</span>
                  </div>
                  {rental.description && <p className="description">{rental.description.substring(0, 100)}...</p>}
                  {rental.features_list && (
                    <div className="features">
                      {rental.features_list.slice(0, 3).map((feature, index) => (
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

export default VehicleRentals
