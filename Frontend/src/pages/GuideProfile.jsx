import { useEffect, useState } from 'react'
import { getGuideProfileDetail, updateGuideProfile } from '../apiClient'

export default function GuideProfile() {
  const userId = localStorage.getItem('userId')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  // local edits state
  const [bio, setBio] = useState('')
  const [tags, setTags] = useState('')
  const [languages, setLanguages] = useState('')
  const [destinations, setDestinations] = useState('')
  const [fullDayRate, setFullDayRate] = useState(3000)
  const [halfDayRate, setHalfDayRate] = useState(1800)
  const [perPersonRate, setPerPersonRate] = useState(500)
  const [groupRate, setGroupRate] = useState(4000)
  const [contactPref, setContactPref] = useState('email')
  
  // mock calendars - toggle unavailable dates
  const [unavailableDates, setUnavailableDates] = useState([])
  
  // mock portfolios
  const [portfolioUrls, setPortfolioUrls] = useState([])
  const [newPhotoUrl, setNewPhotoUrl] = useState('')

  const loadProfile = async () => {
    if (!userId) {
      setError('Please sign in as a service provider.')
      setLoading(false)
      return
    }
    try {
      const data = await getGuideProfileDetail(userId)
      setProfile(data)
      setBio(data.bio || '')
      setTags(data.speciality_tags || '')
      setLanguages(data.languages_offered || '')
      setDestinations(data.specialized_destinations || '')
      setContactPref(data.contact_preferences || 'email')
      
      const rates = data.pricing_rates || {}
      setFullDayRate(rates.full_day || 3000)
      setHalfDayRate(rates.half_day || 1800)
      setPerPersonRate(rates.per_person || 500)
      setGroupRate(rates.group_rate || 4000)
      
      setUnavailableDates(data.availability_calendar || [])
      setPortfolioUrls(data.portfolio_photos || [])
    } catch {
      setError('Failed to retrieve service provider profile details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [userId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      const payload = {
        bio,
        speciality_tags: tags,
        languages_offered: languages,
        specialized_destinations: destinations,
        contact_preferences: contactPref,
        pricing_rates: {
          full_day: Number(fullDayRate),
          half_day: Number(halfDayRate),
          per_person: Number(perPersonRate),
          group_rate: Number(groupRate)
        },
        availability_calendar: unavailableDates,
        portfolio_photos: portfolioUrls
      }
      const updated = await updateGuideProfile(userId, payload)
      setProfile(updated)
      setMessage('Profile settings saved successfully!')
      window.scrollTo(0, 0)
    } catch {
      setError('Failed to save profile settings.')
    }
  }

  const toggleDate = (dateStr) => {
    setUnavailableDates(prev => 
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    )
  }

  const addPortfolioPhoto = () => {
    if (!newPhotoUrl.trim()) return
    setPortfolioUrls(prev => [...prev, newPhotoUrl])
    setNewPhotoUrl('')
  }

  const removePortfolioPhoto = (indexToRemove) => {
    setPortfolioUrls(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  // Generate calendar days for current month (June 2026) for availability settings
  const generateJuneDays = () => {
    const days = []
    for (let i = 1; i <= 30; i++) {
      const dayStr = `2026-06-${i.toString().padStart(2, '0')}`
      days.push(dayStr)
    }
    return days
  }

  if (loading) {
    return <main className="page-shell"><p className="profile-status-text">Loading profile...</p></main>
  }

  return (
    <main className="page-shell guide-profile">
      {message && <div className="guide-alert success">{message}</div>}
      {error && <div className="guide-alert error">{error}</div>}

      <header className="profile-header-main">
        <h1>Profile Management</h1>
        <p>Edit public bio details, showcase photo portfolios, configure rates, and set calendar block dates.</p>
      </header>

      <div className="profile-grid">
        {/* Left Form */}
        <form onSubmit={handleSubmit} className="profile-fields-col">
          <section className="profile-card">
            <h3>👤 Public Bio Details</h3>
            <div className="form-fields">
              <label>
                About Me (Bio)
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Introduce yourself, your service background, and experience..." rows="4" required />
              </label>
              <label>
                Specialty Tags (comma-separated)
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. Wildlife Trekking, Historical Tours, Sundarbans Safaris" />
              </label>
              <label>
                Languages Spoken (comma-separated)
                <input type="text" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="e.g. Bangla, English, Hindi" required />
              </label>
              <label>
                Covered Destinations (comma-separated list of service areas)
                <input type="text" value={destinations} onChange={e => setDestinations(e.target.value)} placeholder="e.g. Sundarbans, Khulna, Mongla" required />
              </label>
            </div>
          </section>

          {/* Pricing Table */}
          <section className="profile-card">
            <h3>৳ Pricing Rates (in BDT)</h3>
            <p className="section-subtext">Set standard rates for travelers to view on booking searches.</p>
            <div className="form-fields double">
              <label>
                Full Day Rate
                <input type="number" value={fullDayRate} onChange={e => setFullDayRate(e.target.value)} required />
              </label>
              <label>
                Half Day Rate
                <input type="number" value={halfDayRate} onChange={e => setHalfDayRate(e.target.value)} required />
              </label>
              <label>
                Per Person Rate
                <input type="number" value={perPersonRate} onChange={e => setPerPersonRate(e.target.value)} required />
              </label>
              <label>
                Group Flat Rate
                <input type="number" value={groupRate} onChange={e => setGroupRate(e.target.value)} required />
              </label>
            </div>
          </section>

          {/* Availability Calendar */}
          <section className="profile-card">
            <h3>🗓️ Availability Scheduler</h3>
            <p className="section-subtext">Click on dates in June 2026 to toggle your status as **Unavailable** (highlighted in red) to block bookings.</p>
            <div className="calendar-grid">
              {generateJuneDays().map((day) => {
                const dayNum = day.split('-')[2]
                const isBlocked = unavailableDates.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    className={`calendar-day ${isBlocked ? 'blocked' : 'available'}`}
                    onClick={() => toggleDate(day)}
                  >
                    <span>{dayNum}</span>
                    <small>{isBlocked ? 'Busy' : 'Free'}</small>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Contact Preference */}
          <section className="profile-card">
            <h3>📞 Contact Preferences</h3>
            <div className="form-fields">
              <label>
                Preferred Booking Contact Method
                <select value={contactPref} onChange={e => setContactPref(e.target.value)}>
                  <option value="email">Email Notification</option>
                  <option value="phone">Direct Phone Call</option>
                  <option value="whatsapp">WhatsApp Text Message</option>
                </select>
              </label>
            </div>
          </section>

          <button type="submit" className="button button-primary submit-btn">Save Profile Settings</button>
        </form>

        {/* Right Sidebar */}
        <div className="profile-sidebar-col">
          {/* Public Preview */}
          <section className="profile-card preview-card-side">
            <h3>👥 Public Preview Card</h3>
            <div className="preview-widget">
              <div className="preview-header">
                <div className="preview-avatar">
                  {profile?.profile_photo ? (
                    <img src={profile.profile_photo} alt="" />
                  ) : (
                    <span>{profile?.full_name?.charAt(0) || 'G'}</span>
                  )}
                </div>
                <div>
                  <h4>{profile?.full_name}</h4>
                  <p className="preview-role">{profile?.service_type === 'tour_guide' ? 'Verified Tour Guide' : 'Service Operator'}</p>
                </div>
              </div>
              <p className="preview-bio">{bio || "Introduce yourself..."}</p>
              <div className="preview-tags">
                {tags.split(',').map((t, idx) => {
                  const cleaned = t.trim()
                  if (!cleaned) return null
                  return <span key={idx} className="preview-tag">{cleaned}</span>
                })}
              </div>
            </div>
          </section>

          {/* Portfolio Management */}
          <section className="profile-card">
            <h3>🏞️ Portfolio Photos (Max 20)</h3>
            <div className="portfolio-adder">
              <input
                type="text"
                placeholder="Paste portfolio photo web link..."
                value={newPhotoUrl}
                onChange={e => setNewPhotoUrl(e.target.value)}
              />
              <button type="button" className="button button-secondary compact" onClick={addPortfolioPhoto}>Add Link</button>
            </div>
            <div className="portfolio-gallery">
              {portfolioUrls.length === 0 ? (
                <p className="empty-gallery">No portfolio images uploaded.</p>
              ) : (
                portfolioUrls.map((url, idx) => (
                  <div key={idx} className="gallery-item" style={{ backgroundImage: `url(${url})` }}>
                    <button type="button" className="delete-btn" onClick={() => removePortfolioPhoto(idx)}>✕</button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Document Center */}
          <section className="profile-card">
            <h3>📁 Document Verification Center</h3>
            <div className="doc-item">
              <strong>NID Identification Scan</strong>
              <span className="doc-status verified">✓ Authenticated</span>
            </div>
            <div className="doc-item">
              <strong>Guide License & Certification</strong>
              {profile?.certification ? (
                <span className="doc-status verified">✓ Uploaded</span>
              ) : (
                <span className="doc-status warning">⚠️ Missing Upload</span>
              )}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .guide-profile {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .profile-header-main h1 { font-size: 2.25rem; font-weight: 850; margin: 0 0 0.5rem 0; color: #0f172a; }
        .profile-header-main p { font-size: 1.05rem; color: #64748b; margin: 0; }
        
        .profile-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .profile-grid { grid-template-columns: 1fr; }
        }
        
        .profile-fields-col { display: flex; flex-direction: column; gap: 1.5rem; }
        .profile-sidebar-col { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .profile-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        .profile-card h3 { font-size: 1.15rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #0f172a; }
        .section-subtext { font-size: 0.85rem; color: #64748b; margin: 0 0 1.25rem 0; }
        
        .form-fields { display: flex; flex-direction: column; gap: 1rem; }
        .form-fields.double { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 600px) { .form-fields.double { grid-template-columns: 1fr; } }
        
        .form-fields label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.88rem; font-weight: 700; color: #475569; }
        .form-fields input, .form-fields textarea, .form-fields select {
          padding: 0.7rem 0.85rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.92rem;
          outline: none;
        }
        .form-fields input:focus, .form-fields textarea:focus, .form-fields select:focus {
          border-color: #a855f7;
        }
        
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          padding: 1rem;
        }
        .calendar-day {
          border: none;
          padding: 0.5rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.15s;
        }
        .calendar-day:hover { transform: scale(1.05); }
        .calendar-day.available { background: #dcfce7; color: #166534; }
        .calendar-day.blocked { background: #fee2e2; color: #991b1b; }
        .calendar-day span { font-weight: 800; font-size: 0.95rem; }
        .calendar-day small { font-size: 0.65rem; text-transform: uppercase; }
        
        .preview-widget { background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 16px; padding: 1.25rem; }
        .preview-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
        .preview-avatar { width: 48px; height: 48px; border-radius: 50%; background: #a855f7; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; overflow: hidden; }
        .preview-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .preview-header h4 { margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a; }
        .preview-role { margin: 0; font-size: 0.75rem; color: #a855f7; font-weight: 700; }
        .preview-bio { margin: 0 0 1rem 0; font-size: 0.88rem; color: #475569; line-height: 1.5; }
        .preview-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .preview-tag { background: white; border: 1px solid #e9d5ff; color: #6b21a8; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; }
        
        .portfolio-adder { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .portfolio-adder input { flex: 1; padding: 0.5rem; border: 1.5px solid #cbd5e1; border-radius: 8px; outline: none; }
        .portfolio-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
        .empty-gallery { font-size: 0.82rem; color: #94a3b8; text-align: center; grid-column: span 3; padding: 1rem; }
        .gallery-item { height: 80px; border-radius: 8px; background-size: cover; background-position: center; position: relative; border: 1px solid #e2e8f0; }
        .gallery-item .delete-btn { position: absolute; top: 2px; right: 2px; border: none; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; cursor: pointer; }
        
        .doc-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
        .doc-item:last-child { border: none; }
        .doc-item strong { font-size: 0.85rem; color: #334155; }
        .doc-status { font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 4px; }
        .doc-status.verified { background: #dcfce7; color: #15803d; }
        .doc-status.warning { background: #fef3c7; color: #b45309; }
        
        .submit-btn { width: 100%; padding: 0.9rem; font-size: 1rem; font-weight: 800; border-radius: 12px; }
        .profile-status-text { text-align: center; padding: 3rem; color: #64748b; }
      `}</style>
    </main>
  )
}
