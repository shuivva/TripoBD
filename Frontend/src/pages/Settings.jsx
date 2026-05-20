import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function Settings() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState(null)
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const userId = searchParams.get('user_id')

  useEffect(() => {
    fetchAllData()
  }, [userId])

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchProfile(),
        fetchPreferences()
      ])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    const response = await fetch(`http://localhost:8000/api/traveler/profile/?user_id=${userId}`)
    const data = await response.json()
    if (response.ok) setProfileData(data)
  }

  const fetchPreferences = async () => {
    const response = await fetch(`http://localhost:8000/api/travel-preferences/?user_id=${userId}`)
    const data = await response.json()
    if (response.ok && data.length > 0) setPreferences(data[0])
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(`http://localhost:8000/api/traveler/profile/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, user: userId })
      })
      if (response.ok) {
        alert('Profile updated successfully!')
      }
    } catch (err) {
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('http://localhost:8000/api/travel-preferences/', {
        method: preferences ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preferences, user: userId })
      })
      if (response.ok) {
        alert('Preferences saved successfully!')
        fetchPreferences()
      }
    } catch (err) {
      alert('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <main className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <h1>Settings & Preferences</h1>
        </header>

        <div className="settings-tabs">
          <button className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            Profile Settings
          </button>
          <button className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
            Travel Preferences
          </button>
          <button className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            Notifications
          </button>
          <button className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
            Privacy & Security
          </button>
        </div>

        {activeTab === 'profile' && profileData && (
          <div className="settings-section">
            <h2>Profile Settings</h2>
            <form onSubmit={handleSaveProfile} className="settings-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileData.full_name || ''}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileData.email || ''}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone_number || ''}
                  onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={profileData.bio || ''}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={3}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="settings-section">
            <h2>Travel Preferences</h2>
            <form onSubmit={handleSavePreferences} className="settings-form">
              <div className="form-group">
                <label>Preferred Travel Style</label>
                <select
                  value={preferences?.travel_style || 'adventure'}
                  onChange={(e) => setPreferences({ ...preferences, travel_style: e.target.value })}
                >
                  <option value="adventure">Adventure</option>
                  <option value="relaxation">Relaxation</option>
                  <option value="cultural">Cultural</option>
                  <option value="nature">Nature</option>
                  <option value="urban">Urban Exploration</option>
                </select>
              </div>
              <div className="form-group">
                <label>Budget Range (BDT)</label>
                <select
                  value={preferences?.budget_range || 'medium'}
                  onChange={(e) => setPreferences({ ...preferences, budget_range: e.target.value })}
                >
                  <option value="budget">Budget (Under ৳10,000)</option>
                  <option value="medium">Medium (৳10,000 - ৳50,000)</option>
                  <option value="luxury">Luxury (Over ৳50,000)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Preferred Accommodation</label>
                <select
                  value={preferences?.accommodation_type || 'hotel'}
                  onChange={(e) => setPreferences({ ...preferences, accommodation_type: e.target.value })}
                >
                  <option value="hotel">Hotel</option>
                  <option value="resort">Resort</option>
                  <option value="hostel">Hostel</option>
                  <option value="homestay">Homestay</option>
                  <option value="camping">Camping</option>
                </select>
              </div>
              <div className="form-group">
                <label>Interests</label>
                <div className="checkbox-group">
                  <label><input type="checkbox" checked={preferences?.interests?.includes('hiking')} onChange={(e) => {
                    const interests = preferences?.interests || []
                    setPreferences({ ...preferences, interests: e.target.checked ? [...interests, 'hiking'] : interests.filter(i => i !== 'hiking') })
                  }} /> Hiking</label>
                  <label><input type="checkbox" checked={preferences?.interests?.includes('beach')} onChange={(e) => {
                    const interests = preferences?.interests || []
                    setPreferences({ ...preferences, interests: e.target.checked ? [...interests, 'beach'] : interests.filter(i => i !== 'beach') })
                  }} /> Beach</label>
                  <label><input type="checkbox" checked={preferences?.interests?.includes('food')} onChange={(e) => {
                    const interests = preferences?.interests || []
                    setPreferences({ ...preferences, interests: e.target.checked ? [...interests, 'food'] : interests.filter(i => i !== 'food') })
                  }} /> Food & Dining</label>
                  <label><input type="checkbox" checked={preferences?.interests?.includes('history')} onChange={(e) => {
                    const interests = preferences?.interests || []
                    setPreferences({ ...preferences, interests: e.target.checked ? [...interests, 'history'] : interests.filter(i => i !== 'history') })
                  }} /> History & Culture</label>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="settings-section">
            <h2>Notification Settings</h2>
            <div className="settings-form">
              <div className="form-group checkbox">
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Email notifications for bookings</span>
                </label>
              </div>
              <div className="form-group checkbox">
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Push notifications for tour room updates</span>
                </label>
              </div>
              <div className="form-group checkbox">
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Email notifications for new messages</span>
                </label>
              </div>
              <div className="form-group checkbox">
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Weekly travel recommendations</span>
                </label>
              </div>
              <button className="btn-primary">Save Notification Settings</button>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="settings-section">
            <h2>Privacy & Security</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Change Password</label>
                <input type="password" placeholder="Current password" />
                <input type="password" placeholder="New password" />
                <input type="password" placeholder="Confirm new password" />
              </div>
              <button className="btn-primary">Update Password</button>
              
              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <button className="btn-danger">Deactivate Account</button>
                <button className="btn-danger">Delete Account</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .settings-page{min-height:100vh;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%);padding:2.5rem;font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
        .settings-container{max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:2.5rem}
        .settings-header{padding:2rem 2.5rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.5rem;box-shadow:0 8px 32px rgba(0,0,0,0.08);border:2px solid rgba(243,244,246,0.8)}
        .settings-header h1{margin:0;font-size:2rem;font-weight:800;color:#111827;letter-spacing:-0.02em}
        .settings-tabs{display:flex;gap:0.75rem;padding:1rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.25rem;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 16px rgba(0,0,0,0.06);overflow-x:auto}
        .settings-tab{padding:0.85rem 2rem;background:transparent;border:none;border-radius:12px;cursor:pointer;color:#6b7280;font-weight:700;font-size:0.95rem;transition:all .3s;white-space:nowrap}
        .settings-tab:hover{background:#f3f4f6;color:#374151}
        .settings-tab.active{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
        .settings-section{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.5rem;padding:2.5rem;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:2px solid rgba(243,244,246,0.8)}
        .settings-section h2{margin:0 0 2rem 0;font-size:1.5rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .settings-form{display:flex;flex-direction:column;gap:1.5rem}
        .form-group{display:flex;flex-direction:column;gap:0.5rem}
        .form-group label{font-size:0.9rem;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
        .form-group input,.form-group textarea,.form-group select{padding:0.85rem 1rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.95rem;font-family:inherit;transition:all .2s;background:#f9fafb}
        .form-group input:focus,.form-group textarea:focus,.form-group select:focus{outline:none;border-color:#3b82f6;background:white;box-shadow:0 4px 16px rgba(59,130,246,0.15)}
        .form-group.checkbox{flex-direction:row;align-items:center;gap:0.75rem}
        .form-group.checkbox label{margin:0;text-transform:none;letter-spacing:normal;font-size:0.95rem;color:#374151;font-weight:600;cursor:pointer}
        .form-group.checkbox input{width:auto;margin:0}
        .checkbox-group{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
        .checkbox-group label{display:flex;align-items:center;gap:0.75rem;cursor:pointer;padding:0.75rem;background:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;transition:all .2s;font-weight:600;color:#374151}
        .checkbox-group label:hover{background:#f3f4f6;border-color:#d1d5db}
        .checkbox-group input{width:auto;margin:0}
        .btn-primary{padding:0.85rem 2rem;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.95rem;transition:all .3s;box-shadow:0 4px 16px rgba(59,130,246,0.3);align-self:flex-start}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(59,130,246,0.4)}
        .btn-primary:disabled{background:linear-gradient(135deg,#9ca3af,#6b7280);cursor:not-allowed;transform:none;box-shadow:none}
        .danger-zone{padding:2rem;background:linear-gradient(135deg,#fef2f2,#fee2e2);border-radius:1.25rem;border:2px solid rgba(239,68,68,0.3);margin-top:2rem}
        .danger-zone h3{margin:0 0 1.25rem 0;font-size:1.1rem;font-weight:800;color:#991b1b;letter-spacing:-0.01em}
        .danger-zone{display:flex;flex-direction:column;gap:1rem}
        .btn-danger{padding:0.85rem 2rem;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.95rem;transition:all .3s;box-shadow:0 4px 16px rgba(239,68,68,0.3)}
        .btn-danger:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(239,68,68,0.4)}
        .loading{text-align:center;padding:6rem;font-size:1.5rem;color:#6b7280;font-weight:600}

        @media (max-width: 768px) {
          .settings-page{padding:1.5rem}
          .settings-header{padding:1.5rem}
          .settings-header h1{font-size:1.5rem}
          .settings-tabs{flex-wrap:wrap}
          .settings-tab{padding:0.75rem 1.25rem;font-size:0.85rem}
          .settings-section{padding:1.75rem}
          .checkbox-group{grid-template-columns:1fr}
        }
      `}</style>
    </main>
  )
}