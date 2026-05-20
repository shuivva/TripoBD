import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import './TravelerProfile.css'

export default function TravelerProfile() {
  const [searchParams] = useSearchParams()
  const [profileData, setProfileData] = useState(null)
  const [preferences, setPreferences] = useState(null)
  const [badges, setBadges] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [stories, setStories] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  const userId = searchParams.get('user_id')

  useEffect(() => {
    fetchProfileData()
    fetchPreferences()
    fetchBadges()
    fetchWishlist()
    fetchStories()
    fetchReviews()
  }, [userId])

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/traveler/profile/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setProfileData(data)
        setEditForm(data)
      } else {
        setError(data.error || 'Failed to fetch profile data')
      }
    } catch (err) {
      setError('Failed to connect to API')
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/travel-preferences/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setPreferences(data)
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
    }
  }

  const fetchBadges = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/user-badges/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setBadges(data)
      }
    } catch (err) {
      console.error('Failed to fetch badges:', err)
    }
  }

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/wishlist/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setWishlist(data)
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err)
    }
  }

  const fetchStories = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/stories/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setStories(data)
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/reviews/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setReviews(data)
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/traveler/profile/update/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, user_id: userId })
      })
      const data = await response.json()
      if (response.ok) {
        setProfileData(editForm)
        setIsEditing(false)
        alert('Profile updated successfully!')
      } else {
        alert(data.error || 'Failed to update profile')
      }
    } catch (err) {
      alert('Failed to connect to API')
    }
  }

  const handleRemoveFromWishlist = async (wishlistId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/wishlist/${wishlistId}/`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setWishlist(wishlist.filter(item => item.id !== wishlistId))
      }
    } catch (err) {
      alert('Failed to remove from wishlist')
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading-spinner">Loading...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page-shell">
        <div className="error-message">{error}</div>
      </main>
    )
  }

  return (
    <main className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-photo-section">
            {profileData?.profile_photo ? (
              <img src={profileData.profile_photo} alt="Profile" className="profile-photo" />
            ) : (
              <div className="profile-photo-placeholder">
                {profileData?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <button className="btn-edit-photo">Change Photo</button>
          </div>
          <div className="profile-info">
            <h1>{profileData?.full_name || 'Traveler'}</h1>
            <p className="profile-username">@{profileData?.username || 'traveler'}</p>
            <p className="profile-email">{profileData?.email || ''}</p>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{stories.length}</span>
                <span className="stat-label">Stories</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{reviews.length}</span>
                <span className="stat-label">Reviews</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{badges.length}</span>
                <span className="stat-label">Badges</span>
              </div>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Personal Information */}
        <div className="profile-section">
          <h2>Personal Information</h2>
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={editForm.date_of_birth || ''}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={editForm.gender || ''}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Division</label>
                <input
                  type="text"
                  value={editForm.division || ''}
                  onChange={(e) => setEditForm({ ...editForm, division: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>District</label>
                <input
                  type="text"
                  value={editForm.district || ''}
                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleSaveProfile}>Save Changes</button>
                <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <label>Full Name</label>
                <span>{profileData?.full_name || '-'}</span>
              </div>
              <div className="info-item">
                <label>Phone Number</label>
                <span>{profileData?.phone_number || '-'}</span>
              </div>
              <div className="info-item">
                <label>Date of Birth</label>
                <span>{profileData?.date_of_birth || '-'}</span>
              </div>
              <div className="info-item">
                <label>Gender</label>
                <span>{profileData?.gender || '-'}</span>
              </div>
              <div className="info-item">
                <label>Division</label>
                <span>{profileData?.division || '-'}</span>
              </div>
              <div className="info-item">
                <label>District</label>
                <span>{profileData?.district || '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Travel Preferences */}
        <div className="profile-section">
          <h2>Travel Preferences</h2>
          {preferences ? (
            <div className="info-grid">
              <div className="info-item">
                <label>Travel Style</label>
                <span>{preferences.travel_style || '-'}</span>
              </div>
              <div className="info-item">
                <label>Budget Range</label>
                <span>{preferences.budget_range || '-'}</span>
              </div>
              <div className="info-item">
                <label>Group Size Preference</label>
                <span>{preferences.group_size_preference || '-'}</span>
              </div>
              <div className="info-item">
                <label>Languages</label>
                <span>{preferences.languages || '-'}</span>
              </div>
              <div className="info-item full-width">
                <label>Preferred Destinations</label>
                <span>{preferences.preferred_destinations || '-'}</span>
              </div>
            </div>
          ) : (
            <p className="no-data">No preferences set</p>
          )}
        </div>

        {/* Badges */}
        <div className="profile-section">
          <h2>Badges & Achievements</h2>
          {badges.length > 0 ? (
            <div className="badges-grid">
              {badges.map((userBadge) => (
                <div key={userBadge.id} className="badge-item">
                  <div className="badge-icon">{userBadge.badge.icon || '🏆'}</div>
                  <div className="badge-info">
                    <h3>{userBadge.badge.name}</h3>
                    <p>{userBadge.badge.description}</p>
                    <small>Earned: {new Date(userBadge.earned_at).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No badges earned yet</p>
          )}
        </div>

        {/* Wishlist */}
        <div className="profile-section">
          <h2>Saved Destinations ({wishlist.length})</h2>
          {wishlist.length > 0 ? (
            <div className="wishlist-grid">
              {wishlist.map((item) => (
                <div key={item.id} className="wishlist-item">
                  <img src={item.destination_hero || '/placeholder.jpg'} alt={item.destination_name} />
                  <div className="wishlist-info">
                    <h3>{item.destination_name}</h3>
                    <p>{item.destination_region}</p>
                    {item.note && <p className="wishlist-note">{item.note}</p>}
                  </div>
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveFromWishlist(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No saved destinations</p>
          )}
        </div>

        {/* Trip Stories */}
        <div className="profile-section">
          <h2>My Trip Stories ({stories.length})</h2>
          {stories.length > 0 ? (
            <div className="stories-list">
              {stories.map((story) => (
                <div key={story.id} className="story-item">
                  {story.cover_photo && (
                    <img src={story.cover_photo} alt={story.title} className="story-cover" />
                  )}
                  <div className="story-info">
                    <h3>{story.title}</h3>
                    <p>{story.destination_name}</p>
                    <div className="story-meta">
                      <span>{story.status}</span>
                      <span>{story.likes_count} likes</span>
                      <span>{story.views_count} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No trip stories yet</p>
          )}
        </div>

        {/* Reviews */}
        <div className="profile-section">
          <h2>My Reviews ({reviews.length})</h2>
          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <h3>{review.title}</h3>
                    <span className="rating">{review.overall_rating}★</span>
                  </div>
                  <p>{review.destination_name}</p>
                  <p className="review-text">{review.text}</p>
                  <small>{new Date(review.created_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No reviews yet</p>
          )}
        </div>

        {/* Account Settings */}
        <div className="profile-section">
          <h2>Account Settings</h2>
          <div className="settings-list">
            <button className="btn-secondary">Change Password</button>
            <button className="btn-secondary">Enable 2FA</button>
            <button className="btn-danger">Deactivate Account</button>
          </div>
        </div>
      </div>
    </main>
  )
}
