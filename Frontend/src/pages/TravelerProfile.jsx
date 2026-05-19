import { useEffect, useMemo, useState } from 'react'
import {
  getTravelerProfile,
  updateTravelerProfile,
  updateTravelerPreferences,
  updateTravelerAccountSettings,
  changeTravelerPassword,
  updateTravelerProfilePhoto,
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
    group_size_preference: '',
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
  },
  badges: [],
  wishlist: [],
  trip_stories: [],
}

export default function TravelerProfile() {
  const storedUserId = useMemo(() => localStorage.getItem('userId'), [])
  const [userId, setUserId] = useState(storedUserId)
  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' })
  const [photoFile, setPhotoFile] = useState(null)

  useEffect(() => {
    if (!userId) return
    const normalizedUserId = userId?.toString().trim()
    if (!normalizedUserId) return
    const fetchProfile = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getTravelerProfile(normalizedUserId)
        setProfile(data)
      } catch {
        setError('Unable to load traveler profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
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
    } catch {
      setError('Failed to update password.')
    }
  }

  const handlePhotoSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    if (!photoFile) {
      setError('Select a profile photo to upload.')
      return
    }
    try {
      const data = await updateTravelerProfilePhoto(userId, photoFile)
      setProfile(data)
      setPhotoFile(null)
      setMessage('Profile photo updated successfully.')
    } catch {
      setError('Failed to update profile photo.')
    }
  }

  const rawStats = profile.travel_stats || emptyProfile.travel_stats
  const stats = {
    ...rawStats,
    leaderboard_rank: rawStats.leaderboard_rank ?? '—',
  }
  const preferences = profile.travel_preferences || emptyProfile.travel_preferences
  const accountSettings = profile.account_settings || emptyProfile.account_settings

  return (
    <main className="page-shell traveler-profile">
      <header className="profile-header">
        <div>
          <h1>Traveler Profile</h1>
          <p>Manage your profile, preferences, and account settings.</p>
        </div>
        <div className="profile-identity">
          <div className="profile-photo">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" />
            ) : (
              <div className="profile-photo-placeholder">{profile.full_name?.charAt(0) || 'T'}</div>
            )}
          </div>
          <div>
            <h2>{profile.full_name || 'Traveler'}</h2>
            <p>{profile.email || 'Email unavailable'}</p>
          </div>
        </div>
      </header>

      {!userId && (
        <div className="profile-alert">
          Add your user id to localStorage as <strong>userId</strong> to load the profile.
        </div>
      )}

      {loading && <p>Loading profile...</p>}
      {error && <div className="profile-alert error">{error}</div>}
      {message && <div className="profile-alert success">{message}</div>}

      <section className="profile-section">
        <h3>Profile Photo</h3>
        <form onSubmit={handlePhotoSubmit} className="profile-form">
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
          <button className="button button-primary" type="submit">Upload Photo</button>
        </form>
      </section>

      <section className="profile-section">
        <h3>Personal Information</h3>
        <form onSubmit={handleProfileSubmit} className="profile-form grid">
          <label>
            Full Name
            <input name="full_name" value={profile.full_name} onChange={handleProfileChange} />
          </label>
          <label>
            Email (read-only)
            <input value={profile.email} disabled />
          </label>
          <label>
            Phone Number
            <input name="phone_number" value={profile.phone_number} onChange={handleProfileChange} />
          </label>
          <label>
            Date of Birth
            <input type="date" name="date_of_birth" value={profile.date_of_birth || ''} onChange={handleProfileChange} />
          </label>
          <label>
            Gender
            <select name="gender" value={profile.gender || ''} onChange={handleProfileChange}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Division
            <select name="division" value={profile.division || ''} onChange={handleProfileChange}>
              <option value="">Select</option>
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
            <input name="district" value={profile.district} onChange={handleProfileChange} />
          </label>
          <button className="button button-primary" type="submit">Save Profile</button>
        </form>
      </section>

      <section className="profile-section">
        <h3>Travel Preferences</h3>
        <form onSubmit={handlePreferencesSubmit} className="profile-form grid">
          <label>
            Preferred Destinations
            <input name="preferred_destinations" value={preferences.preferred_destinations || ''} onChange={handlePreferencesChange} />
          </label>
          <label>
            Travel Style
            <select name="travel_style" value={preferences.travel_style || 'mix'} onChange={handlePreferencesChange}>
              <option value="adventure">Adventure</option>
              <option value="relaxed">Relaxed</option>
              <option value="cultural">Cultural</option>
              <option value="budget">Budget</option>
              <option value="mix">Mix</option>
            </select>
          </label>
          <label>
            Group Size Preference
            <input type="number" name="group_size_preference" value={preferences.group_size_preference || ''} onChange={handlePreferencesChange} />
          </label>
          <label>
            Languages Spoken
            <input name="languages_spoken" value={preferences.languages_spoken || ''} onChange={handlePreferencesChange} />
          </label>
          <button className="button button-primary" type="submit">Save Preferences</button>
        </form>
      </section>

      <section className="profile-section">
        <h3>Travel Stats</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Trips Logged</span>
            <strong>{stats.total_trips_logged}</strong>
          </div>
          <div className="stat-card">
            <span>Destinations Visited</span>
            <strong>{stats.destinations_visited}</strong>
          </div>
          <div className="stat-card">
            <span>Stories Posted</span>
            <strong>{stats.stories_posted}</strong>
          </div>
          <div className="stat-card">
            <span>Reviews Written</span>
            <strong>{stats.reviews_written}</strong>
          </div>
          <div className="stat-card">
            <span>Leaderboard Rank</span>
            <strong>{stats.leaderboard_rank}</strong>
          </div>
        </div>
      </section>

      <section className="profile-section">
        <h3>Saved / Wishlist Destinations</h3>
        <div className="list-grid">
          {profile.wishlist?.length ? (
            profile.wishlist.map(item => (
              <div key={item.id} className="list-card">
                <h4>{item.destination?.name}</h4>
                <p>{item.destination?.region} · {item.destination?.category}</p>
                <small>Added {new Date(item.added_at).toLocaleDateString()}</small>
              </div>
            ))
          ) : (
            <p>No saved destinations yet.</p>
          )}
        </div>
      </section>

      <section className="profile-section">
        <h3>My Trip Stories</h3>
        <div className="list-grid">
          {profile.trip_stories?.length ? (
            profile.trip_stories.map(story => (
              <div key={story.id} className="list-card">
                <h4>{story.title}</h4>
                <p>{story.destination_name}</p>
                <span className={`status-pill ${story.status}`}>{story.status}</span>
              </div>
            ))
          ) : (
            <p>No trip stories yet.</p>
          )}
        </div>
      </section>

      <section className="profile-section">
        <h3>Account & Privacy</h3>
        <form onSubmit={handleAccountSettingsSubmit} className="profile-form grid">
          <label>
            Profile Visibility
            <select name="profile_visibility" value={accountSettings.profile_visibility} onChange={handleAccountSettingsChange}>
              <option value="public">Public</option>
              <option value="friends_only">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              name="two_factor_enabled"
              checked={accountSettings.two_factor_enabled}
              onChange={handleAccountSettingsChange}
            />
            Enable 2FA
          </label>
          <label>
            Deactivation Request
            <select
              name="deactivation_requested"
              value={accountSettings.deactivation_requested ? 'yes' : 'no'}
              onChange={(e) => handleAccountSettingsChange({
                target: {
                  name: 'deactivation_requested',
                  value: e.target.value === 'yes',
                },
              })}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
          <label>
            Deactivation Reason
            <textarea
              name="deactivation_reason"
              value={accountSettings.deactivation_reason || ''}
              onChange={handleAccountSettingsChange}
            />
          </label>
          <button className="button button-primary" type="submit">Save Account Settings</button>
        </form>
      </section>

      <section className="profile-section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="profile-form">
          <label>
            Current Password
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
            />
          </label>
          <button className="button button-primary" type="submit">Update Password</button>
        </form>
      </section>

      <section className="profile-section">
        <h3>Traveler Identification</h3>
        <label>
          User ID
          <input value={userId || ''} onChange={(e) => {
            setUserId(e.target.value)
            localStorage.setItem('userId', e.target.value)
          }} />
        </label>
      </section>
      <style>{`
        .traveler-profile { display: flex; flex-direction: column; gap: 2rem; }
        .profile-header { display: flex; justify-content: space-between; align-items: center; gap: 2rem; }
        .profile-identity { display: flex; align-items: center; gap: 1rem; }
        .profile-photo { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: #f3f4f6; display:flex; align-items:center; justify-content:center; }
        .profile-photo img { width: 100%; height: 100%; object-fit: cover; }
        .profile-photo-placeholder { font-size: 2rem; font-weight: 600; color: #4b5563; }
        .profile-section { background: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); display: flex; flex-direction: column; gap: 1rem; }
        .profile-form { display: flex; flex-direction: column; gap: 1rem; }
        .profile-form.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
        .profile-form label { display: flex; flex-direction: column; gap: 0.4rem; font-weight: 600; color: #1f2937; }
        .profile-form input, .profile-form select, .profile-form textarea { padding: 0.65rem; border-radius: 8px; border: 1px solid #e5e7eb; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
        .stat-card { background: #f8fafc; border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: 0.35rem; }
        .badge-grid, .list-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
        .badge-card, .list-card { background: #f8fafc; border-radius: 10px; padding: 1rem; display: flex; gap: 0.75rem; align-items: flex-start; }
        .badge-icon { font-size: 1.5rem; }
        .wishlist-grid .list-card > p:not(.destination-meta) { display: none; }
        .wishlist-grid .destination-meta { display: block; margin: 0; }
        .status-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 999px; background: #e5e7eb; font-size: 0.75rem; text-transform: capitalize; }
        .status-pill.published { background: #d1fae5; color: #065f46; }
        .status-pill.draft { background: #fee2e2; color: #991b1b; }
        .profile-alert { padding: 0.75rem 1rem; border-radius: 8px; background: #e0f2fe; color: #0369a1; }
        .profile-alert.error { background: #fee2e2; color: #991b1b; }
        .profile-alert.success { background: #dcfce7; color: #166534; }
        .toggle { flex-direction: row; align-items: center; gap: 0.5rem; }
      `}</style>
    </main>
  )
}
