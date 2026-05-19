import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

/* ── Mock data ── */
const MOCK_TRAVELER = {
  name: 'Sourav Biswas',
  type: 'Explorer',
  location: 'Dhaka, Bangladesh',
  rating: 4.9,
  totalTrips: 12,
  avatar: 'SB',
  verified: true,
  joinedDate: 'January 2024',
}

const MOCK_STATS = [
  { label: 'Total Trips',    value: '12',    change: '+2',  icon: '🗺️', up: true  },
  { label: 'Upcoming',       value: '2',     change: '+1',  icon: '📅', up: true  },
  { label: 'Saved Places',   value: '24',    change: '+5',  icon: '❤️', up: true  },
  { label: 'Reviews Given',  value: '8',     change: '0',   icon: '⭐', up: false },
]

const MOCK_TRIPS = [
  { id:'TR001', dest:'Sajek Valley',    date:'2025-06-15', guests:4, amount:8400,  status:'upcoming',  type:'Group Trip' },
  { id:'TR002', dest:'Sundarbans',      date:'2025-05-20', guests:2, amount:12000, status:'upcoming',  type:'Tour Package' },
  { id:'TR003', dest:'Cox\'s Bazar',    date:'2025-04-10', guests:3, amount:6300,  status:'completed', type:'Weekend Trip' },
  { id:'TR004', dest:'Bandarban',       date:'2025-03-22', guests:2, amount:4500,  status:'completed', type:'Backpacking' },
  { id:'TR005', dest:'Sreemangal',      date:'2025-02-14', guests:2, amount:3800,  status:'cancelled', type:'Couples Trip' },
]

const MOCK_SAVED = [
  { id:1, name:'Nilgiri Hills',      slug:'bandarban',  category:'Hills',    rating:4.8, img:'https://images.pexels.com/photos/35478460/pexels-photo-35478460.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id:2, name:'Coral Island',       slug:'coxs-bazar', category:'Beach',    rating:4.7, img:'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id:3, name:'Ratargul Swamp',     slug:'sylhet',     category:'Forest',   rating:4.9, img:'https://images.pexels.com/photos/975771/pexels-photo-975771.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id:4, name:'Kuakata Sea Beach',  slug:'kuakata',    category:'Beach',    rating:4.5, img:'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800' },
]

const MOCK_REVIEWS = [
  { dest:'Cox\'s Bazar',  rating:5, comment:'Incredible sunset views! The beach was clean and the seafood was amazing.', date:'Apr 12, 2025' },
  { dest:'Bandarban',     rating:4, comment:'Beautiful mountains, but the road journey was a bit tough. Worth it though!', date:'Mar 28, 2025' },
  { dest:'Sundarbans',    rating:5, comment:'Seeing the wildlife in its natural habitat was a once-in-a-lifetime experience.', date:'Feb 15, 2025' },
]

const STATUS_STYLE = {
  upcoming:  { bg:'#dbeafe', color:'#1e40af', label:'Upcoming' },
  completed: { bg:'#d1fae5', color:'#065f46', label:'Completed' },
  cancelled: { bg:'#fee2e2', color:'#991b1b', label:'Cancelled' },
}

const TABS = ['Overview', 'My Trips', 'Saved', 'Reviews', 'Settings']
const TAB_ICONS = { Overview:'🏠', 'My Trips':'🗺️', Saved:'❤️', Reviews:'⭐', Settings:'⚙️' }

export default function TravelerDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('Overview')
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tripFilter, setTripFilter] = useState('all')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    const userId = searchParams.get('user_id')
    if (!userId) {
      setError('User ID not provided. Using mock data.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/traveler/profile/?user_id=${userId}`)
      const data = await response.json()

      if (response.ok) {
        setProfileData(data)
      } else {
        setError(data.error || 'Failed to fetch profile data')
      }
    } catch (err) {
      setError('Failed to connect to API. Using mock data.')
    } finally {
      setLoading(false)
    }
  }

  const filteredTrips = tripFilter === 'all'
    ? MOCK_TRIPS
    : MOCK_TRIPS.filter(b => b.status === tripFilter)

  const handleLogout = () => {
    localStorage.removeItem('travelerToken')
    localStorage.removeItem('travelerData')
    navigate('/login')
  }

  return (
    <div className="td-root">

      {/* ── Sidebar ── */}
      <aside className={`td-sidebar${sidebarOpen ? ' td-sidebar-open' : ''}`}>
        <div className="td-sidebar-header">
          <div className="td-logo">
            <span className="td-logo-icon">🌿</span>
            <span className="td-logo-text">TripoBD</span>
          </div>
          <button className="td-sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        {/* Traveler card */}
        <div className="td-provider-card">
          <div className="td-avatar">{profileData ? profileData.full_name?.charAt(0).toUpperCase() : MOCK_TRAVELER.avatar}</div>
          <div className="td-provider-info">
            <div className="td-provider-name">
              {profileData ? profileData.full_name : MOCK_TRAVELER.name}
              {MOCK_TRAVELER.verified && <span className="td-verified">✓</span>}
            </div>
            <div className="td-provider-type">{MOCK_TRAVELER.type}</div>
            <div className="td-provider-loc">📍 {profileData ? `${profileData.division}, ${profileData.district}` : MOCK_TRAVELER.location}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="td-nav">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`td-nav-item${activeTab === tab ? ' td-nav-active' : ''}`}
              onClick={() => { setActiveTab(tab); setSidebarOpen(false) }}
            >
              <span className="td-nav-icon">{TAB_ICONS[tab]}</span>
              {tab}
            </button>
          ))}
        </nav>

        <div className="td-sidebar-footer">
          <button className="td-logout-btn" onClick={() => setShowLogoutConfirm(true)}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Sidebar backdrop */}
      {sidebarOpen && <div className="td-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main content ── */}
      <div className="td-main">

        {/* Top bar */}
        <header className="td-topbar">
          <button className="td-hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="td-topbar-title">
            <span className="td-tab-icon">{TAB_ICONS[activeTab]}</span>
            {activeTab}
          </div>
          <div className="td-topbar-right">
            <div className="td-notif-btn">🔔 <span className="td-notif-badge">2</span></div>
            <div className="td-topbar-avatar">{MOCK_TRAVELER.avatar}</div>
          </div>
        </header>

        <div className="td-content">

          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 'Overview' && (
            <div className="td-section">
              <div className="td-welcome">
                <div>
                  <h1>Welcome back, <span className="td-highlight">{MOCK_TRAVELER.name}</span> 👋</h1>
                  <p>Ready to plan your next adventure across Bangladesh?</p>
                </div>
                <Link to="/discover" className="td-primary-btn">Explore Destinations</Link>
              </div>

              {/* Stats */}
              <div className="td-stats-grid">
                {MOCK_STATS.map(s => (
                  <div key={s.label} className="td-stat-card">
                    <div className="td-stat-top">
                      <span className="td-stat-icon">{s.icon}</span>
                      <span className={`td-stat-change${s.up ? ' up' : ' down'}`}>
                        {s.up ? '↑' : '↓'} {s.change}
                      </span>
                    </div>
                    <div className="td-stat-value">{s.value}</div>
                    <div className="td-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Upcoming trips preview */}
              <div className="td-card">
                <div className="td-card-head">
                  <h2>Upcoming Trips</h2>
                  <button className="td-link-btn" onClick={() => setActiveTab('My Trips')}>View all →</button>
                </div>
                <div className="td-table-wrap">
                  <table className="td-table">
                    <thead>
                      <tr>
                        <th>Destination</th><th>Date</th><th>Type</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_TRIPS.filter(t => t.status === 'upcoming').map(b => (
                        <tr key={b.id}>
                          <td><strong>{b.dest}</strong></td>
                          <td>{b.date}</td>
                          <td>{b.type}</td>
                          <td>
                            <span className="td-badge" style={{
                              background: STATUS_STYLE[b.status].bg,
                              color: STATUS_STYLE[b.status].color
                            }}>
                              {STATUS_STYLE[b.status].label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent reviews preview */}
              <div className="td-card">
                <div className="td-card-head">
                  <h2>Your Recent Reviews</h2>
                  <button className="td-link-btn" onClick={() => setActiveTab('Reviews')}>View all →</button>
                </div>
                <div className="td-reviews-preview">
                  {MOCK_REVIEWS.slice(0, 2).map((r, i) => (
                    <div key={i} className="td-review-item">
                      <div className="td-review-top">
                        <div>
                          <strong>{r.dest}</strong>
                          <div className="td-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                        </div>
                        <span className="td-review-date">{r.date}</span>
                      </div>
                      <p className="td-review-text">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ MY TRIPS ═══ */}
          {activeTab === 'My Trips' && (
            <div className="td-section">
              <div className="td-section-head">
                <h1>My Trips</h1>
                <p>Track your past, current, and upcoming travel plans.</p>
              </div>

              <div className="td-filter-pills">
                {['all', 'upcoming', 'completed', 'cancelled'].map(f => (
                  <button
                    key={f}
                    className={`td-filter-pill${tripFilter === f ? ' active' : ''}`}
                    onClick={() => setTripFilter(f)}
                  >
                    {f === 'all' ? 'All' : STATUS_STYLE[f].label}
                    <span className="td-pill-count">
                      {f === 'all' ? MOCK_TRIPS.length : MOCK_TRIPS.filter(b => b.status === f).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="td-card">
                <div className="td-table-wrap">
                  <table className="td-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>Destination</th><th>Type</th><th>Date</th><th>Guests</th><th>Budget</th><th>Status</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrips.map(b => (
                        <tr key={b.id}>
                          <td><code>{b.id}</code></td>
                          <td><strong>{b.dest}</strong></td>
                          <td>{b.type}</td>
                          <td>{b.date}</td>
                          <td>{b.guests}</td>
                          <td><strong>৳{b.amount.toLocaleString()}</strong></td>
                          <td>
                            <span className="td-badge" style={{
                              background: STATUS_STYLE[b.status].bg,
                              color: STATUS_STYLE[b.status].color
                            }}>
                              {STATUS_STYLE[b.status].label}
                            </span>
                          </td>
                          <td>
                            <Link to={`/destination/${b.slug || 'bandarban'}`} className="td-view-btn">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredTrips.length === 0 && (
                  <div className="td-empty">
                    <span>📭</span>
                    <p>No {tripFilter} trips found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ SAVED ═══ */}
          {activeTab === 'Saved' && (
            <div className="td-section">
              <div className="td-section-head-row">
                <div>
                  <h1>Saved Destinations</h1>
                  <p>Places you've bookmarked for your next adventure.</p>
                </div>
                <Link to="/discover" className="td-primary-btn">Discover More</Link>
              </div>

              <div className="td-saved-grid">
                {MOCK_SAVED.map(l => (
                  <div key={l.id} className="td-saved-card">
                    <div className="td-saved-img" style={{ backgroundImage: `url(${l.img})` }}>
                      <div className="td-saved-img-overlay" />
                      <span className="td-saved-badge">{l.rating} ★</span>
                    </div>
                    <div className="td-saved-content">
                      <div className="td-saved-head">
                        <h3>{l.name}</h3>
                        <span className="td-type-badge">{l.category}</span>
                      </div>
                      <div className="td-saved-actions">
                        <Link to={`/destination/${l.slug}`} className="td-view-btn" style={{flex: 1, textAlign: 'center'}}>View Details</Link>
                        <button className="td-remove-btn">❤️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ REVIEWS ═══ */}
          {activeTab === 'Reviews' && (
            <div className="td-section">
              <div className="td-section-head">
                <h1>My Reviews</h1>
                <p>See all the destinations you've reviewed.</p>
              </div>

              <div className="td-reviews-list">
                {MOCK_REVIEWS.map((r, i) => (
                  <div key={i} className="td-review-card">
                    <div className="td-review-top">
                      <div className="td-review-meta">
                        <strong>{r.dest}</strong>
                        <div className="td-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                      </div>
                      <span className="td-review-date">{r.date}</span>
                    </div>
                    <p className="td-review-text">{r.comment}</p>
                    <div className="td-review-actions">
                      <button className="td-edit-btn">✏️ Edit</button>
                      <button className="td-delete-btn">🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {activeTab === 'Settings' && (
            <div className="td-section">
              <div className="td-section-head">
                <h1>Account Settings</h1>
                <p>Manage your traveler profile and preferences.</p>
              </div>

              {loading ? (
                <div className="td-empty"><span>⏳</span><p>Loading profile data...</p></div>
              ) : (
                <div className="td-settings-grid">
                  <div className="td-card td-settings-card">
                    <h3>Personal Information</h3>
                    <div className="td-form-grid">
                      <div className="td-field">
                        <label>Full Name</label>
                        <input defaultValue={profileData?.full_name || MOCK_TRAVELER.name} />
                      </div>
                      <div className="td-field">
                        <label>Email</label>
                        <input type="email" defaultValue={profileData?.email || 'sourav@tripobd.com'} disabled />
                      </div>
                      <div className="td-field">
                        <label>Phone Number</label>
                        <input type="tel" defaultValue={profileData?.phone_number || '+880 1XXX-XXXXXX'} />
                      </div>
                      <div className="td-field">
                        <label>Location</label>
                        <input defaultValue={profileData?.division || 'Dhaka, Bangladesh'} />
                      </div>
                    </div>
                    <button className="td-primary-btn">Save Changes</button>
                  </div>

                  <div className="td-card td-settings-card">
                    <h3>Travel Preferences</h3>
                    <div className="td-form-grid">
                      <div className="td-field">
                        <label>Preferred Travel Style</label>
                        <select defaultValue="backpacking">
                          <option>Backpacking</option>
                          <option>Luxury</option>
                          <option>Group Tours</option>
                          <option>Couples Getaway</option>
                        </select>
                      </div>
                      <div className="td-field">
                        <label>Budget Range</label>
                        <select defaultValue="mid">
                          <option value="budget">Budget (৳1k-৳3k/trip)</option>
                          <option value="mid">Mid-Range (৳3k-৳8k/trip)</option>
                          <option value="premium">Premium (৳8k+/trip)</option>
                        </select>
                      </div>
                      <div className="td-field td-field-full">
                        <label>Favorite Categories</label>
                        <input defaultValue="Hills, Beaches, Forests" />
                      </div>
                    </div>
                    <button className="td-primary-btn">Update Preferences</button>
                  </div>

                  <div className="td-card td-settings-card td-danger-card">
                    <h3>Account Actions</h3>
                    <p>Log out from your traveler account.</p>
                    <div className="td-danger-btns">
                      <button className="td-outline-btn" onClick={() => setShowLogoutConfirm(true)}>
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Logout confirm modal ── */}
      {showLogoutConfirm && (
        <div className="td-modal-overlay">
          <div className="td-modal">
            <h3>Log out?</h3>
            <p>You'll be redirected to the login page.</p>
            <div className="td-modal-btns">
              <button className="td-outline-btn" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="td-danger-btn"  onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Root layout ── */
        .td-root {
          display: flex; min-height: 100vh;
          background: #f0f4f8;
          font-family: 'Segoe UI', sans-serif;
        }

        /* ── Sidebar ── */
        .td-sidebar {
          width: 260px; flex-shrink: 0;
          background: linear-gradient(180deg, #042f2e 0%, #064e3b 100%);
          display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh;
          overflow-y: auto; z-index: 40;
          transition: transform 0.3s ease;
        }
        .td-sidebar-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .td-logo { display: flex; align-items: center; gap: 0.5rem; }
        .td-logo-icon { font-size: 1.4rem; }
        .td-logo-text { font-size: 1.2rem; font-weight: 800; color: #10b981; letter-spacing: -0.02em; }
        .td-sidebar-close { display: none; background: none; border: none; color: rgba(255,255,255,0.6); font-size: 1.1rem; cursor: pointer; }

        .td-provider-card {
          display: flex; align-items: flex-start; gap: 0.75rem;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .td-avatar {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #10b981, #38bdf8);
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 800; color: white; flex-shrink: 0;
        }
        .td-provider-name { font-size: 0.9rem; font-weight: 700; color: white; display: flex; align-items: center; gap: 4px; }
        .td-verified { background: #10b981; color: white; font-size: 0.6rem; padding: 1px 5px; border-radius: 999px; font-weight: 700; }
        .td-provider-type { font-size: 0.75rem; color: rgba(255,255,255,0.55); margin-top: 2px; }
        .td-provider-loc  { font-size: 0.72rem; color: rgba(255,255,255,0.45); margin-top: 2px; }

        .td-nav { padding: 1rem 0.75rem; flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .td-nav-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.7rem 0.9rem; border-radius: 10px;
          background: none; border: none; color: rgba(255,255,255,0.65);
          font-size: 0.9rem; font-weight: 500; cursor: pointer; text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .td-nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
        .td-nav-active { background: rgba(16,185,129,0.2) !important; color: white !important; font-weight: 700; }
        .td-nav-icon { font-size: 1rem; }

        .td-sidebar-footer { padding: 1rem 0.75rem; border-top: 1px solid rgba(255,255,255,0.08); }
        .td-logout-btn {
          width: 100%; padding: 0.65rem; border-radius: 10px;
          background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5; font-size: 0.88rem; font-weight: 600; cursor: pointer;
          transition: background 0.2s;
        }
        .td-logout-btn:hover { background: rgba(239,68,68,0.3); color: #fecaca; }

        /* ── Main ── */
        .td-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        .td-topbar {
          background: white; border-bottom: 1px solid #e5e7eb;
          padding: 0 1.5rem; height: 95px;
          display: flex; align-items: center; gap: 1rem;
          position: sticky; top: 0; z-index: 30;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .td-hamburger { display: none; background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #374151; }
        .td-topbar-title { font-size: 1rem; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 0.5rem; flex: 1; }
        .td-tab-icon { font-size: 1.1rem; }
        .td-topbar-right { display: flex; align-items: center; gap: 1rem; }
        .td-notif-btn { position: relative; font-size: 1.2rem; cursor: pointer; }
        .td-notif-badge {
          position: absolute; top: -4px; right: -6px;
          background: #e63946; color: white; font-size: 0.6rem;
          padding: 1px 4px; border-radius: 999px; font-weight: 700;
        }
        .td-topbar-avatar {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #38bdf8);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 800; color: white; cursor: pointer;
        }

        .td-content { padding: 2rem; flex: 1; }

        /* ── Sections ── */
        .td-section { display: flex; flex-direction: column; gap: 1.5rem; }
        .td-welcome {
          display: flex; align-items: flex-start; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .td-welcome h1 { font-size: clamp(1.3rem,2.5vw,1.8rem); font-weight: 800; color: #111827; margin: 0 0 0.25rem; }
        .td-welcome p  { color: #6b7280; font-size: 0.95rem; margin: 0; }
        .td-highlight  { color: #064e3b; }
        .td-section-head h1 { font-size: 1.6rem; font-weight: 800; color: #111827; margin: 0 0 0.25rem; }
        .td-section-head p  { color: #6b7280; margin: 0; }
        .td-section-head-row { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }

        /* ── Stats ── */
        .td-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 1rem; }
        .td-stat-card {
          background: white; border-radius: 14px; padding: 1.5rem;
          border: 1px solid #f3f4f6; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .td-stat-top { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
        .td-stat-icon { font-size: 1.5rem; }
        .td-stat-change { font-size: 0.78rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
        .td-stat-change.up   { background: #d1fae5; color: #065f46; }
        .td-stat-change.down { background: #f3f4f6; color: #6b7280; }
        .td-stat-value { font-size: 1.8rem; font-weight: 800; color: #111827; margin-bottom: 0.25rem; }
        .td-stat-label { font-size: 0.82rem; color: #6b7280; font-weight: 500; }

        /* ── Cards ── */
        .td-card {
          background: white; border-radius: 14px; padding: 1.5rem;
          border: 1px solid #f3f4f6; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .td-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
        .td-card-head h2 { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
        .td-link-btn { background: none; border: none; color: #064e3b; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
        .td-link-btn:hover { text-decoration: underline; }

        /* ── Table ── */
        .td-table-wrap { overflow-x: auto; }
        .td-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .td-table th {
          text-align: left; padding: 0.6rem 0.75rem;
          font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: #9ca3af;
          border-bottom: 1px solid #f3f4f6; white-space: nowrap;
        }
        .td-table td { padding: 0.85rem 0.75rem; border-bottom: 1px solid #f9fafb; color: #374151; vertical-align: middle; }
        .td-table tr:last-child td { border-bottom: none; }
        .td-table tr:hover td { background: #f9fafb; }
        .td-table code { font-size: 0.78rem; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #6b7280; }

        .td-badge { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
        .td-view-btn { background: #ecfdf5; color: #065f46; border: none; border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block; }

        /* ── Filter pills ── */
        .td-filter-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .td-filter-pill {
          display: flex; align-items: center; gap: 6px;
          background: white; border: 1.5px solid #e5e7eb;
          border-radius: 999px; padding: 0.4rem 1rem;
          font-size: 0.82rem; font-weight: 600; color: #6b7280; cursor: pointer;
          transition: all 0.15s;
        }
        .td-filter-pill:hover { border-color: #064e3b; color: #064e3b; }
        .td-filter-pill.active { background: #064e3b; border-color: #064e3b; color: white; }
        .td-pill-count { background: rgba(255,255,255,0.25); padding: 0px 6px; border-radius: 999px; font-size: 0.7rem; }
        .td-filter-pill:not(.active) .td-pill-count { background: #f3f4f6; color: #374151; }

        /* ── Saved Destinations ── */
        .td-saved-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 1.25rem; }
        .td-saved-card {
          background: white; border-radius: 14px; overflow: hidden;
          border: 1px solid #f3f4f6; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          display: flex; flex-direction: column;
        }
        .td-saved-img {
          position: relative; width: 100%; height: 0; padding-bottom: 55%;
          background-size: cover; background-position: center;
        }
        .td-saved-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.4) 0%, transparent 60%); }
        .td-saved-badge {
          position: absolute; top: .75rem; right: .75rem;
          background: linear-gradient(135deg,#f59e0b,#d97706); color: #fff;
          font-size: .7rem; font-weight: 700; padding: .2rem .6rem; border-radius: 999px;
        }
        .td-saved-content { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; }
        .td-saved-head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: 1rem; }
        .td-saved-head h3 { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
        .td-type-badge { background: #ecfdf5; color: #065f46; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
        .td-saved-actions { display: flex; gap: 0.5rem; margin-top: auto; border-top: 1px solid #f3f4f6; padding-top: 1rem; }
        .td-remove-btn { background: #fee2e2; color: #991b1b; border: none; border-radius: 6px; padding: .5rem .75rem; cursor: pointer; font-size: .85rem; }

        /* ── Reviews ── */
        .td-reviews-list { display: flex; flex-direction: column; gap: 1rem; }
        .td-review-card {
          background: white; border-radius: 14px; padding: 1.5rem;
          border: 1px solid #f3f4f6; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .td-reviews-preview { display: flex; flex-direction: column; gap: 1rem; }
        .td-review-item { padding: 1rem; background: #f9fafb; border-radius: 10px; }
        .td-review-top  { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
        .td-review-meta { flex: 1; }
        .td-review-meta strong { font-size: 0.9rem; color: #111827; display: block; }
        .td-stars       { font-size: 0.85rem; color: #f59e0b; }
        .td-review-date { font-size: 0.75rem; color: #9ca3af; white-space: nowrap; }
        .td-review-text { font-size: 0.88rem; color: #374151; line-height: 1.6; margin: 0 0 0.75rem; }
        .td-review-actions { display: flex; gap: 0.5rem; }
        .td-edit-btn { background: #f3f4f6; color: #374151; border: none; border-radius: 6px; padding: 4px 12px; font-size: 0.78rem; cursor: pointer; }
        .td-delete-btn { background: #fee2e2; color: #991b1b; border: none; border-radius: 6px; padding: 4px 12px; font-size: 0.78rem; cursor: pointer; }

        /* ── Settings ── */
        .td-settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px,1fr)); gap: 1.25rem; }
        .td-settings-card h3 { font-size: 1rem; font-weight: 700; color: #111827; margin: 0 0 1.25rem; }
        .td-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
        .td-field { display: flex; flex-direction: column; gap: 5px; }
        .td-field-full { grid-column: 1 / -1; }
        .td-field label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #9ca3af; }
        .td-field input, .td-field select, .td-field textarea {
          border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 0.6rem 0.75rem;
          font-size: 0.88rem; font-family: inherit; color: #111827; background: #f9fafb;
          transition: border-color 0.2s;
        }
        .td-field input:focus, .td-field select:focus, .td-field textarea:focus {
          outline: none; border-color: #10b981; background: white;
        }

        .td-danger-card { border-color: #fee2e2 !important; }
        .td-danger-card h3 { color: #991b1b; }
        .td-danger-card p  { font-size: 0.85rem; color: #6b7280; margin: 0 0 1rem; }
        .td-danger-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }

        /* ── Buttons ── */
        .td-primary-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; border: none; border-radius: 10px;
          padding: 0.65rem 1.4rem; font-size: 0.88rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s; white-space: nowrap;
          text-decoration: none; display: inline-block; text-align: center;
        }
        .td-primary-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .td-outline-btn {
          background: white; color: #374151; border: 1.5px solid #e5e7eb;
          border-radius: 10px; padding: 0.6rem 1.2rem;
          font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: border-color 0.2s;
        }
        .td-outline-btn:hover { border-color: #9ca3af; }
        .td-danger-btn {
          background: linear-gradient(135deg, #e63946, #b71c1c);
          color: white; border: none; border-radius: 10px;
          padding: 0.6rem 1.2rem; font-size: 0.88rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s;
        }
        .td-danger-btn:hover { opacity: 0.88; }

        /* ── Empty state ── */
        .td-empty { text-align: center; padding: 3rem 2rem; }
        .td-empty span { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
        .td-empty p    { color: #9ca3af; font-size: 0.9rem; margin: 0; }

        /* ── Modal ── */
        .td-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .td-modal {
          background: white; border-radius: 16px; padding: 2rem;
          max-width: 360px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .td-modal h3 { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem; }
        .td-modal p  { font-size: 0.88rem; color: #6b7280; margin: 0 0 1.5rem; }
        .td-modal-btns { display: flex; gap: 0.75rem; justify-content: flex-end; }

        /* ── Backdrop ── */
        .td-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          z-index: 35; display: none;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .td-sidebar {
            position: fixed; top: 0; left: 0; height: 100vh;
            transform: translateX(-100%);
          }
          .td-sidebar-open { transform: translateX(0); }
          .td-sidebar-close { display: block; }
          .td-backdrop { display: block; }
          .td-hamburger { display: block; }
          .td-content { padding: 1.25rem; }
          .td-form-grid { grid-template-columns: 1fr; }
          .td-table th:nth-child(n+5), .td-table td:nth-child(n+5) { display: none; }
        }
        @media (max-width: 480px) {
          .td-stats-grid { grid-template-columns: 1fr 1fr; }
          .td-settings-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}