import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../apiClient'
import './local-services.css'

const LocalServices = () => {
  const [activeTab, setActiveTab] = useState('guides')
  const [guides, setGuides] = useState([])
  const [charters, setCharters] = useState([])
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [destinationSuggestions, setDestinationSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState({
    serviceType: '',
    boatType: '',
    vehicleType: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
  })

  useEffect(() => {
    fetchData()
  }, [activeTab, searchQuery, filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = ''
      let params = {}
      
      if (activeTab === 'guides') {
        url = '/tour-guides/'
        if (searchQuery) params.destination = searchQuery
        if (filters.serviceType) params.service_type = filters.serviceType
      } else if (activeTab === 'boats') {
        url = '/boat-charters/'
        if (searchQuery) params.destination = searchQuery
        if (filters.boatType) params.boat_type = filters.boatType
      } else if (activeTab === 'vehicles') {
        url = '/vehicle-rentals/'
        if (searchQuery) params.destination = searchQuery
        if (filters.vehicleType) params.vehicle_type = filters.vehicleType
      }

      if (filters.minPrice) params.min_price = filters.minPrice
      if (filters.maxPrice) params.max_price = filters.maxPrice
      if (filters.minRating) params.min_rating = filters.minRating

      const queryString = new URLSearchParams(params).toString()
      const fullUrl = queryString ? `${url}?${queryString}` : url
      
      const res = await apiClient.get(fullUrl)
      
      if (activeTab === 'guides') {
        setGuides(res)
      } else if (activeTab === 'boats') {
        setCharters(res)
      } else if (activeTab === 'vehicles') {
        setRentals(res)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      serviceType: '',
      boatType: '',
      vehicleType: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
    })
    setSearchQuery('')
  }

  const handleSearchChange = async (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (value.length >= 2) {
      try {
        const res = await apiClient.get(`/destinations/suggestions/?q=${value}`)
        setDestinationSuggestions(res.map(d => d.name))
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setDestinationSuggestions([])
      }
    } else {
      setDestinationSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (destination) => {
    setSearchQuery(destination)
    setShowSuggestions(false)
  }

  const handleSuggestionMouseDown = (destination) => {
    setSearchQuery(destination)
    setShowSuggestions(false)
  }

  const renderStars = (rating) => {
    if (!rating) return 'No ratings'
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<span key={i} className="star filled">★</span>)
      } else if (i - 0.5 <= rating) {
        stars.push(<span key={i} className="star half">★</span>)
      } else {
        stars.push(<span key={i} className="star empty">★</span>)
      }
    }
    return stars
  }

  return (
    <div className="local-services-page">
      <div className="container">
        <h1>Local Services</h1>
        <p>Find tour guides, boat charters, and vehicle rentals for your trip</p>

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search by destination (e.g., Cox's Bazar, Sylhet, Sajek Valley)"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && destinationSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {destinationSuggestions.map((dest, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onMouseDown={() => handleSuggestionMouseDown(dest)}
                >
                  {dest}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="filters-container">
          <div className="filter-group">
            {activeTab === 'guides' && (
              <select
                className="filter-select"
                value={filters.serviceType}
                onChange={(e) => handleFilterChange('serviceType', e.target.value)}
              >
                <option value="">All Service Types</option>
                <option value="cultural">Cultural Guide</option>
                <option value="adventure">Adventure Guide</option>
                <option value="nature">Nature Guide</option>
                <option value="historical">Historical Guide</option>
              </select>
            )}
            {activeTab === 'boats' && (
              <select
                className="filter-select"
                value={filters.boatType}
                onChange={(e) => handleFilterChange('boatType', e.target.value)}
              >
                <option value="">All Boat Types</option>
                <option value="speedboat">Speedboat</option>
                <option value="fishing">Fishing Boat</option>
                <option value="yacht">Yacht</option>
                <option value="sailboat">Sailboat</option>
              </select>
            )}
            {activeTab === 'vehicles' && (
              <select
                className="filter-select"
                value={filters.vehicleType}
                onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
              >
                <option value="">All Vehicle Types</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="microbus">Microbus</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
            )}
          </div>

          <div className="filter-group">
            <input
              type="number"
              className="filter-input"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
            <input
              type="number"
              className="filter-input"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={filters.minRating}
              onChange={(e) => handleFilterChange('minRating', e.target.value)}
            >
              <option value="">All Ratings</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

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

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="services-grid">
            {activeTab === 'guides' && guides.map((guide, index) => (
              <div key={`${guide.id}-${index}`} className="service-card">
                {guide.profile_photo && (
                  <img src={guide.profile_photo} alt={guide.name} className="service-image" />
                )}
                <div className="service-content">
                  <h3>{guide.name}</h3>
                  <p className="service-type">{guide.service_type}</p>
                  <p className="service-description">{guide.description || 'No description available'}</p>
                  <div className="service-rating">
                    {renderStars(guide.rating)}
                    <span className="rating-count">({guide.reviews_count || 0} reviews)</span>
                  </div>
                  <p className="service-price">৳{guide.price_per_day}/day</p>
                  <div className="service-languages">
                    {guide.languages && guide.languages.split(',').map((lang, i) => (
                      <span key={i} className="language-tag">{lang.trim()}</span>
                    ))}
                  </div>
                  <Link to={`/traveler/tour-guides/${guide.id}`} className="button button-primary">
                    View Details
                  </Link>
                </div>
              </div>
            ))}

            {activeTab === 'boats' && charters.map((charter, index) => (
              <div key={`${charter.id}-${index}`} className="service-card">
                {charter.image && (
                  <img src={charter.image} alt={charter.name} className="service-image" />
                )}
                <div className="service-content">
                  <h3>{charter.name}</h3>
                  <p className="service-type">{charter.boat_type}</p>
                  <p className="service-description">{charter.description || 'No description available'}</p>
                  <div className="service-rating">
                    {renderStars(charter.rating)}
                    <span className="rating-count">({charter.reviews_count || 0} reviews)</span>
                  </div>
                  <p className="service-price">৳{charter.price_per_hour}/hour</p>
                  <p className="service-capacity">Capacity: {charter.capacity} people</p>
                  <Link to={`/traveler/boat-charters/${charter.id}`} className="button button-primary">
                    View Details
                  </Link>
                </div>
              </div>
            ))}

            {activeTab === 'vehicles' && rentals.map((rental, index) => (
              <div key={`${rental.id}-${index}`} className="service-card">
                {rental.image && (
                  <img src={rental.image} alt={rental.name} className="service-image" />
                )}
                <div className="service-content">
                  <h3>{rental.name}</h3>
                  <p className="service-type">{rental.vehicle_type}</p>
                  <p className="service-description">{rental.description || 'No description available'}</p>
                  <div className="service-rating">
                    {renderStars(rental.rating)}
                    <span className="rating-count">({rental.reviews_count || 0} reviews)</span>
                  </div>
                  <p className="service-price">৳{rental.price_per_day}/day</p>
                  <p className="service-capacity">Capacity: {rental.capacity} people</p>
                  <Link to={`/traveler/vehicle-rentals/${rental.id}`} className="button button-primary">
                    View Details
                  </Link>
                </div>
              </div>
            ))}

            {((activeTab === 'guides' && guides.length === 0) ||
              (activeTab === 'boats' && charters.length === 0) ||
              (activeTab === 'vehicles' && rentals.length === 0)) && (
              <div className="no-results">No services found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default LocalServices
