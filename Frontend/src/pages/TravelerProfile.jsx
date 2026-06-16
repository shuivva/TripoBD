import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getTravelerProfile,
  updateTravelerProfile,
  updateTravelerPreferences,
  updateTravelerAccountSettings,
  changeTravelerPassword,
  updateTravelerProfilePhoto,
  updateWishlistNotes,
  deleteWishlist,
  shareWishlist,
  convertWishlistToRoom,
} from '../apiClient'

const emptyProfile = {
  id: null,
  username: '',
  email: '',
  full_name: '',
  phone_number: '',
  date_of_birth: '',
  gender: '',
  division: '',
  district: '',
  profile_photo: '',
  travel_preferences: {
    preferred_destinations: '',
    travel_style: 'mix',
    group_size_preference: 4,
    languages_spoken: '',
  },
  travel_stats: {
    total_trips_logged: 0,
    destinations_visited: 0,
    stories_posted: 0,
    reviews_written: 0,
    leaderboard_rank: null,
  },
  account_settings: {
    profile_visibility: 'public',
    two_factor_enabled: false,
    deactivation_requested: false,
    deactivation_reason: '',
  },
  badges: [],
  wishlist: [],
  trip_stories: [],
}

export default function TravelerProfile() {
  const navigate = useNavigate()
  const storedUserId = useMemo(() => localStorage.getItem('userId'), [])
  const [userId, setUserId] = useState(storedUserId)
  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' })
  
  // Cropping & photo state
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [isCropping, setIsCropping] = useState(false)
  
  // Note editing state for wishlist
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [noteText, setNoteText] = useState('')
  
  // Share link modal state
  const [shareLink, setShareLink] = useState('')
  const [sharedDest, setSharedDest] = useState('')

  const fetchProfile = async (id) => {
    setLoading(true)
    setError('')
    try {
      const data = await getTravelerProfile(id)
      setProfile(data)
    } catch {
      setError('Unable to load traveler profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) return
    const normalizedUserId = userId?.toString().trim()
    if (!normalizedUserId) return
    fetchProfile(normalizedUserId)
  }, [userId])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handlePreferencesChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      travel_preferences: { ...prev.travel_preferences, [name]: value },
    }))
  }

  const handleAccountSettingsChange = (e) => {
    const { name, value, type, checked } = e.target
    setProfile(prev => ({
      ...prev,
      account_settings: { ...prev.account_settings, [name]: type === 'checkbox' ? checked : value },
    }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      const payload = {
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        division: profile.division,
        district: profile.district,
      }
      const data = await updateTravelerProfile(userId, payload)
      setProfile(data)
      setMessage('Profile updated successfully.')
    } catch {
      setError('Failed to update profile.')
    }
  }

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      const data = await updateTravelerPreferences(userId, profile.travel_preferences)
      setProfile(data)
      setMessage('Travel preferences updated successfully.')
    } catch {
      setError('Failed to update travel preferences.')
    }
  }

  const handleAccountSettingsSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      const data = await updateTravelerAccountSettings(userId, profile.account_settings)
      setProfile(data)
      setMessage('Account settings updated successfully.')
    } catch {
      setError('Failed to update account settings.')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await changeTravelerPassword(userId, passwordForm)
      setPasswordForm({ current_password: '', new_password: '' })
      setMessage('Password updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to update password.')
    }
  }

  // File browser trigger
  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(reader.result)
      setIsCropping(true)
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }

  // Draw crop circle client-side on canvas
  const performCrop = () => {
    const img = new Image()
    img.src = photoPreview
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const size = 300
      canvas.width = size
      canvas.height = size

      const minDimension = Math.min(img.width, img.height)
      const srcWidth = minDimension / zoom
      const srcHeight = minDimension / zoom
      const srcX = (img.width - srcWidth) / 2

      ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, size, size)
      
      canvas.toBlob((blob) => {
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        setPhotoFile(croppedFile)
        setPhotoPreview(canvas.toDataURL('image/jpeg'))
        setIsCropping(false)
      }, 'image/jpeg')
    }
  }

  const handlePhotoSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    if (!photoFile) {
      setError('Please select and crop a photo first.')
      return
    }
    try {
      const data = await updateTravelerProfilePhoto(userId, photoFile)
      setProfile(data)
      setPhotoFile(null)
      setPhotoPreview(null)
      setMessage('Profile photo updated successfully.')
    } catch {
      setError('Failed to update profile photo.')
    }
  }

  // Wishlist actions
  const handleSaveNote = async (wishlistId) => {
    try {
      const updatedProfile = await updateWishlistNotes(wishlistId, noteText)
      setProfile(updatedProfile)
      setEditingNoteId(null)
    } catch {
      setError('Failed to save notes.')
    }
  }

  const handleRemoveWishlist = async (wishlistId) => {
    if (!confirm('Are you sure you want to remove this from your wishlist?')) return
    try {
      const updatedProfile = await deleteWishlist(wishlistId)
      setProfile(updatedProfile)
    } catch {
      setError('Failed to remove from wishlist.')
    }
  }

  const handleShareWishlist = async (wishlistId, destName) => {
    try {
      const data = await shareWishlist(wishlistId)
      setSharedDest(destName)
      setShareLink(data.shared_link)
    } catch {
      setError('Failed to get share link.')
    }
  }

  const handleConvertToRoom = async (wishlistId) => {
    try {
      const res = await convertWishlistToRoom(wishlistId)
      navigate(`/traveler/room?id=${res.room_id}`)
    } catch {
      setError('Failed to convert wishlist to room.')
    }
  }

  const rawStats = profile.travel_stats || emptyProfile.travel_stats
  const stats = {
    ...rawStats,
    leaderboard_rank: rawStats.leaderboard_rank ?? '-',
  }
  const preferences = profile.travel_preferences || emptyProfile.travel_preferences
  const accountSettings = profile.account_settings || emptyProfile.account_settings

  if (loading && !profile.id) {
    return (
      <main className="page-shell">
        <p className="profile-status">Loading profile details...</p>
      </main>
    )
  }

  return (
    <main className="page-shell traveler-profile-container">
      {message && <div className="profile-alert success">{message}</div>}
      {error && <div className="profile-alert error">{error}</div>}

      <header className="profile-header-premium">
        <div className="header-meta">
          <h1>Traveler Profile</h1>
          <p>Control your identity, trip settings, and wishlist preferences.</p>
        </div>
        <div className="profile-card-top">
          <div className="profile-avatar-wrapper">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" className="avatar-image-circle" />
            ) : (
              <div className="avatar-placeholder-circle">{profile.full_name?.charAt(0) || 'T'}</div>
            )}
            <label className="avatar-upload-btn">
              📸
              <input type="file" accept="image/*" onChange={handlePhotoFileChange} style={{ display: 'none' }} />
            </label>
          </div>
          <div className="profile-header-info">
            <h2>{profile.full_name || 'Traveler Account'}</h2>
            <p className="profile-username">@{profile.username || 'username'}</p>
            <p className="profile-email">{profile.email || 'No email provided'}</p>
          </div>
        </div>
      </header>

      {/* Interactive Photo Cropper Modal */}
      {isCropping && (
        <div className="crop-modal">
          <div className="crop-modal-content">
            <h3>Crop Profile Photo</h3>
            <p className="community-muted">Zoom and center your photo within the circle.</p>
            <div className="crop-preview-container">
              <img
                src={photoPreview}
                alt="Preview"
                style={{
                  transform: `scale(${zoom})`,
                  maxWidth: '100%',
                  maxHeight: '260px',
                  borderRadius: '50%',
                  aspectRatio: '1/1',
                  objectFit: 'cover',
                }}
              />
            </div>
            <div className="zoom-slider-container">
              <span>Zoom</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
              />
            </div>
            <div className="crop-modal-actions">
              <button className="button button-secondary" onClick={() => setIsCropping(false)}>Cancel</button>
              <button className="button button-primary" onClick={performCrop}>Crop</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo save bar when cropped but not saved */}
      {photoFile && (
        <div className="photo-save-bar">
          <span>Photo cropped successfully! Save changes to your profile.</span>
          <button className="button button-primary" onClick={handlePhotoSubmit}>Save Photo</button>
        </div>
      )}

      {/* Share Link Modal */}
      {shareLink && (
        <div className="crop-modal">
          <div className="crop-modal-content share-modal">
            <h3>Share Wishlist</h3>
            <p className="community-muted">Copy this link to share your saved spot for **{sharedDest}**:</p>
            <input type="text" className="share-link-input" value={shareLink} readOnly onClick={(e) => e.target.select()} />
            <button className="button button-primary" style={{ marginTop: '1rem' }} onClick={() => setShareLink('')}>Close</button>
          </div>
        </div>
      )}

      <div className="profile-grid-layout">
        {/* LEFT COLUMN: Forms */}
        <div className="profile-left-col">
          <section className="profile-section-card">
            <h3 className="section-title"><span className="title-icon">👤</span>Personal Information</h3>
            <form onSubmit={handleProfileSubmit} className="profile-form-grid">
              <label>
                Full Name
                <input type="text" name="full_name" value={profile.full_name || ''} onChange={handleProfileChange} required />
              </label>
              <label>
                Phone Number
                <input type="text" name="phone_number" value={profile.phone_number || ''} onChange={handleProfileChange} />
              </label>
              <label>
                Date of Birth
                <input type="date" name="date_of_birth" value={profile.date_of_birth || ''} onChange={handleProfileChange} />
              </label>
              <label>
                Gender
                <select name="gender" value={profile.gender || ''} onChange={handleProfileChange}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Division
                <select name="division" value={profile.division || ''} onChange={handleProfileChange}>
                  <option value="">Select Division</option>
                  <option value="dhaka">Dhaka</option>
                  <option value="chittagong">Chittagong</option>
                  <option value="rajshahi">Rajshahi</option>
                  <option value="khulna">Khulna</option>
                  <option value="barisal">Barisal</option>
                  <option value="sylhet">Sylhet</option>
                  <option value="rangpur">Rangpur</option>
                  <option value="mymensingh">Mymensingh</option>
                </select>
              </label>
              <label>
                District
                <input type="text" name="district" value={profile.district || ''} onChange={handleProfileChange} />
              </label>
              <button className="button button-primary submit-btn-full" type="submit">Update Personal Info</button>
            </form>
          </section>

          <section className="profile-section-card">
            <h3 className="section-title"><span className="title-icon">🧭</span>Travel Preferences</h3>
            <form onSubmit={handlePreferencesSubmit} className="profile-form-grid">
              <label>
                Preferred Destinations (comma-separated)
                <input
                  type="text"
                  name="preferred_destinations"
                  placeholder="e.g. Cox's Bazar, Sajek, Sylhet"
                  value={preferences.preferred_destinations || ''}
                  onChange={handlePreferencesChange}
                />
              </label>
              <label>
                Travel Style
                <select name="travel_style" value={preferences.travel_style || 'mix'} onChange={handlePreferencesChange}>
                  <option value="mix">Mix Style</option>
                  <option value="adventure">Adventure</option>
                  <option value="relaxed">Relaxed / Leisure</option>
                  <option value="cultural">Cultural / Heritage</option>
                  <option value="budget">Backpacker / Budget</option>
                </select>
              </label>
              <label>
                Preferred Group Size
                <input
                  type="number"
                  name="group_size_preference"
                  value={preferences.group_size_preference || 4}
                  onChange={handlePreferencesChange}
                />
              </label>
              <label>
                Languages Spoken (comma-separated)
                <input
                  type="text"
                  name="languages_spoken"
                  placeholder="e.g. Bangla, English"
                  value={preferences.languages_spoken || ''}
                  onChange={handlePreferencesChange}
                />
              </label>
              <button className="button button-primary submit-btn-full" type="submit">Save Travel Preferences</button>
            </form>
          </section>
        </div>

        {/* RIGHT COLUMN: Stats, Wishlist, Stories, Badges */}
        <div className="profile-right-col">
          {/* Travel Stats Banner */}
          <section className="profile-section-card stats-section-premium">
            <h3 className="section-title stats-title">📊 Travel Metrics</h3>
            <div className="stats-box-grid">
              <div className="stat-pill-card">
                <span>Trips Logged</span>
                <strong>{stats.total_trips_logged}</strong>
              </div>
              <div className="stat-pill-card">
                <span>Destinations</span>
                <strong>{stats.destinations_visited}</strong>
              </div>
              <div className="stat-pill-card">
                <span>Stories</span>
                <strong>{stats.stories_posted}</strong>
              </div>
              <div className="stat-pill-card">
                <span>Reviews</span>
                <strong>{stats.reviews_written}</strong>
              </div>
              <div className="stat-pill-card rank-pill">
                <span>Leaderboard Rank</span>
                <strong>#{stats.leaderboard_rank}</strong>
              </div>
            </div>
          </section>

          {/* Badges Display */}
          <section className="profile-section-card">
            <h3 className="section-title"><span className="title-icon">🏅</span>Badges & Achievements</h3>
            {profile.badges?.length > 0 ? (
              <div className="badges-badge-grid">
                {profile.badges.map((ub) => (
                  <div key={ub.id} className="badge-pill-item" title={ub.badge.requirement}>
                    <span className="badge-item-icon">{ub.badge.icon || '🏆'}</span>
                    <div className="badge-item-meta">
                      <h4>{ub.badge.name}</h4>
                      <p>{ub.badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty-text">Earn badges by publishing trip stories, writing reviews, and traveling!</p>
            )}
          </section>

          {/* Saved Destinations List */}
          <section className="profile-section-card">
            <h3 className="section-title"><span className="title-icon">❤️</span>Wishlist Destinations</h3>
            {profile.wishlist?.length > 0 ? (
              <div className="wishlist-cards-layout">
                {profile.wishlist.map((item) => (
                  <div key={item.id} className="wishlist-detail-card">
                    <div className="wishlist-header">
                      <div>
                        <h4>{item.destination?.name}</h4>
                        <p>{item.destination?.region} • {item.destination?.category}</p>
                      </div>
                      <div className="wishlist-actions">
                        <button className="wishlist-action-btn" title="Convert to Tour Room" onClick={() => handleConvertToRoom(item.id)}>
                          🚀 Planner
                        </button>
                        <button className="wishlist-action-btn" title="Share" onClick={() => handleShareWishlist(item.id, item.destination?.name)}>
                          🔗 Share
                        </button>
                        <button className="wishlist-action-btn delete" title="Remove" onClick={() => handleRemoveWishlist(item.id)}>
                          ❌ Remove
                        </button>
                      </div>
                    </div>
                    
                    {/* Editable notes */}
                    <div className="wishlist-note-section">
                      {editingNoteId === item.id ? (
                        <div className="note-editor">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add personal notes or links..."
                          />
                          <div className="note-editor-btns">
                            <button className="button button-secondary btn-xs" onClick={() => setEditingNoteId(null)}>Cancel</button>
                            <button className="button button-primary btn-xs" onClick={() => handleSaveNote(item.id)}>Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="note-display" onClick={() => {
                          setEditingNoteId(item.id)
                          setNoteText(item.notes || '')
                        }}>
                          <span className="note-icon">📝</span>
                          <span className="note-content">
                            {item.notes ? item.notes : "Click to add personal notes or planning links..."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty-text">No destinations in your wishlist yet. Browse discover page to save destinations!</p>
            )}
          </section>

          {/* Stories List */}
          <section className="profile-section-card">
            <h3 className="section-title"><span className="title-icon">📖</span>My Trip Stories</h3>
            {profile.trip_stories?.length > 0 ? (
              <div className="stories-badge-grid">
                {profile.trip_stories.map((story) => (
                  <div key={story.id} className="story-snippet-card">
                    <div className="story-snippet-header">
                      <h4>{story.title}</h4>
                      <span className={`story-status-tag ${story.status}`}>{story.status}</span>
                    </div>
                    <p className="story-destination-tag">📍 {story.destination_name}</p>
                    <p className="story-snippet-body">{story.content?.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty-text">Write your first travel story to share with the TripoBD community!</p>
            )}
          </section>

          {/* Privacy & Settings */}
          <section className="profile-section-card">
            <h3 className="section-title"><span className="title-icon">⚙️</span>Account & Privacy Settings</h3>
            <form onSubmit={handleAccountSettingsSubmit} className="profile-form-grid">
              <label>
                Profile Visibility
                <select
                  name="profile_visibility"
                  value={accountSettings.profile_visibility || 'public'}
                  onChange={handleAccountSettingsChange}
                >
                  <option value="public">Public (Everyone can see)</option>
                  <option value="friends_only">Friends Only</option>
                  <option value="private">Private (Only me)</option>
                </select>
              </label>

              <label className="toggle-checkbox-row">
                <input
                  type="checkbox"
                  name="two_factor_enabled"
                  checked={accountSettings.two_factor_enabled || false}
                  onChange={handleAccountSettingsChange}
                />
                <span className="toggle-label-text">Enable Two-Factor Authentication (2FA)</span>
              </label>

              <div className="deactivation-container">
                <label className="toggle-checkbox-row deact-row">
                  <input
                    type="checkbox"
                    name="deactivation_requested"
                    checked={accountSettings.deactivation_requested || false}
                    onChange={handleAccountSettingsChange}
                  />
                  <span className="toggle-label-text warning-text">Request Account Deactivation</span>
                </label>
                {accountSettings.deactivation_requested && (
                  <label className="reason-label animate-fade-in">
                    Deactivation Reason
                    <textarea
                      name="deactivation_reason"
                      value={accountSettings.deactivation_reason || ''}
                      onChange={handleAccountSettingsChange}
                      placeholder="Why do you want to deactivate your account? (Optional)"
                    />
                  </label>
                )}
              </div>

              <button className="button button-primary submit-btn-full" type="submit">Save Settings</button>
            </form>
          </section>

          {/* Change Password */}
          <section className="profile-section-card">
            <h3 className="section-title"><span className="title-icon">🔐</span>Change Account Password</h3>
            <form onSubmit={handlePasswordSubmit} className="profile-form-grid">
              <label>
                Current Password
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                  required
                />
              </label>
              <label>
                New Password
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                  required
                />
              </label>
              <button className="button button-primary submit-btn-full" type="submit">Update Password</button>
            </form>
          </section>
        </div>
      </div>

      <style>{`
        .traveler-profile-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 2rem 1rem;
        }
        
        .profile-alert {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          font-weight: 500;
          animation: slideDown 0.3s ease-out;
        }
        .profile-alert.success {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .profile-alert.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .profile-header-premium {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 24px;
          padding: 2.5rem;
          color: white;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
        }
        .header-meta h1 {
          font-size: 2.25rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(90deg, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .header-meta p {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .profile-card-top {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 1.25rem 2rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .profile-avatar-wrapper {
          position: relative;
          width: 90px;
          height: 90px;
        }
        .avatar-image-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #38bdf8;
        }
        .avatar-placeholder-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: linear-gradient(135deg, #38bdf8, #818cf8);
          color: white;
          font-size: 2.25rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
        }
        .avatar-upload-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 28px;
          height: 28px;
          background: #38bdf8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.9rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        .avatar-upload-btn:hover {
          transform: scale(1.1);
          background: #0ea5e9;
        }

        .profile-header-info h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }
        .profile-username {
          color: #38bdf8;
          font-weight: 600;
          font-size: 0.9rem;
          margin: 0.15rem 0;
        }
        .profile-email {
          color: #94a3b8;
          font-size: 0.85rem;
          margin: 0;
        }

        /* Photo save banner */
        .photo-save-bar {
          background: #e0f2fe;
          color: #0369a1;
          padding: 1rem 1.5rem;
          border-radius: 16px;
          border: 1px solid #bae6fd;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          animation: slideDown 0.3s ease-out;
        }

        /* Layout */
        .profile-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 2rem;
        }
        .profile-left-col, .profile-right-col {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .profile-section-card {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
          border: 1px solid #f1f5f9;
        }
        .section-title {
          font-size: 1.2rem;
          font-weight: 750;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .title-icon {
          font-size: 1.4rem;
        }

        .profile-form-grid {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .profile-form-grid label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-weight: 600;
          color: #334155;
          font-size: 0.9rem;
        }
        .profile-form-grid input,
        .profile-form-grid select,
        .profile-form-grid textarea {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 0.95rem;
          color: #0f172a;
          transition: all 0.2s;
          background: #f8fafc;
        }
        .profile-form-grid input:focus,
        .profile-form-grid select:focus,
        .profile-form-grid textarea:focus {
          border-color: #818cf8;
          outline: none;
          background: white;
          box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15);
        }

        .submit-btn-full {
          width: 100%;
          justify-content: center;
          padding: 0.8rem;
          font-size: 0.95rem;
          border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #059669);
        }

        /* Stats Card Premium */
        .stats-section-premium {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border: 1px solid #a7f3d0;
        }
        .stats-title {
          color: #065f46;
        }
        .stats-box-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .stat-pill-card {
          background: white;
          border: 1px solid #d1fae5;
          border-radius: 14px;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .stat-pill-card span {
          font-size: 0.75rem;
          color: #065f46;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .stat-pill-card strong {
          font-size: 1.5rem;
          color: #047857;
          font-weight: 800;
        }
        .rank-pill {
          grid-column: span 2;
          background: linear-gradient(135deg, #34d399, #059669);
          border: none;
          color: white;
        }
        .rank-pill span {
          color: rgba(255, 255, 255, 0.85);
        }
        .rank-pill strong {
          color: white;
          font-size: 1.75rem;
        }

        /* Badges grid */
        .badges-badge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        .badge-pill-item {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          gap: 0.75rem;
          align-items: center;
          transition: all 0.2s;
          cursor: help;
        }
        .badge-pill-item:hover {
          transform: translateY(-2px);
          border-color: #fbbf24;
          background: #fffdf5;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.1);
        }
        .badge-item-icon {
          font-size: 2rem;
        }
        .badge-item-meta h4 {
          font-size: 0.9rem;
          font-weight: 700;
          margin: 0;
          color: #1e293b;
        }
        .badge-item-meta p {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        /* Wishlist Cards */
        .wishlist-cards-layout {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .wishlist-detail-card {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .wishlist-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .wishlist-header h4 {
          font-size: 1.05rem;
          font-weight: 750;
          margin: 0;
          color: #0f172a;
        }
        .wishlist-header p {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0.1rem 0 0;
        }
        .wishlist-actions {
          display: flex;
          gap: 0.4rem;
        }
        .wishlist-action-btn {
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.35rem 0.6rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .wishlist-action-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .wishlist-action-btn.delete:hover {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        }

        .wishlist-note-section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.75rem 1rem;
        }
        .note-display {
          display: flex;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: #64748b;
          cursor: pointer;
        }
        .note-content {
          font-style: italic;
        }
        .note-editor {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .note-editor textarea {
          width: 100%;
          min-height: 50px;
          font-size: 0.85rem;
          padding: 0.5rem;
          border-radius: 6px;
          resize: vertical;
        }
        .note-editor-btns {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .btn-xs {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }

        /* Stories */
        .stories-badge-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .story-snippet-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.25rem;
        }
        .story-snippet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .story-snippet-header h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 750;
          color: #0f172a;
        }
        .story-status-tag {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.15rem 0.5rem;
          border-radius: 99px;
        }
        .story-status-tag.published {
          background: #d1fae5;
          color: #065f46;
        }
        .story-status-tag.draft {
          background: #f1f5f9;
          color: #475569;
        }
        .story-destination-tag {
          font-size: 0.8rem;
          color: #818cf8;
          font-weight: 600;
          margin: 0.25rem 0 0.5rem;
        }
        .story-snippet-body {
          font-size: 0.85rem;
          color: #475569;
          margin: 0;
          line-height: 1.5;
        }

        /* Settings Toggle Checkbox */
        .toggle-checkbox-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          padding: 0.5rem 0;
        }
        .toggle-checkbox-row input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .toggle-label-text {
          font-weight: 600;
          color: #334155;
          font-size: 0.9rem;
        }
        .warning-text {
          color: #b91c1c;
        }
        .deactivation-container {
          border-top: 1.5px dashed #f1f5f9;
          padding-top: 1rem;
        }
        .reason-label {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: #64748b;
          margin-top: 0.5rem;
        }

        .profile-empty-text {
          font-size: 0.88rem;
          color: #64748b;
          text-align: center;
          font-style: italic;
          padding: 1rem;
        }

        /* Crop Modal Overlay */
        .crop-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .crop-modal-content {
          background: white;
          padding: 2rem;
          border-radius: 24px;
          width: 90%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .crop-modal-content h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
        }
        .crop-preview-container {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid #38bdf8;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
        }
        .zoom-slider-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
        }
        .zoom-slider-container span {
          font-size: 0.85rem;
          font-weight: 700;
          color: #475569;
        }
        .zoom-slider-container input {
          flex: 1;
          cursor: pointer;
        }
        .crop-modal-actions {
          display: flex;
          gap: 1rem;
          width: 100%;
        }
        .crop-modal-actions button {
          flex: 1;
          padding: 0.65rem;
          font-size: 0.9rem;
          border-radius: 10px;
          justify-content: center;
        }

        .share-modal {
          max-width: 450px;
        }
        .share-link-input {
          width: 100%;
          padding: 0.75rem;
          background: #f1f5f9 !important;
          border: 1px solid #cbd5e1;
          font-family: monospace;
          font-size: 0.85rem;
          border-radius: 8px;
        }

        /* Responsive */
        @media (max-width: 968px) {
          .profile-grid-layout {
            grid-template-columns: 1fr;
          }
          .profile-header-premium {
            padding: 2rem;
            flex-direction: column;
            align-items: flex-start;
          }
          .profile-card-top {
            width: 100%;
          }
        }

        /* Animations */
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </main>
  )
}
