import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'

/* ── Mock data ── */
const MOCK_PROVIDER = {
  name: 'Sajek Hills Resort',
  type: 'Accommodation',
  location: 'Sajek Valley, Rangamati',
  rating: 4.8,
  totalReviews: 124,
  avatar: 'SH',
  verified: true,
  joinedDate: 'March 2024',
}

const MOCK_STATS = [
  { label: 'Total Bookings',  value: '248',   change: '+12%', icon: '📦', up: true  },
  { label: 'This Month',      value: '34',    change: '+8%',  icon: '📅', up: true  },
  { label: 'Total Revenue',   value: '৳1.2L', change: '+18%', icon: '💰', up: true  },
  { label: 'Avg. Rating',     value: '4.8',   change: '-0.1', icon: '⭐', up: false },
]

const MOCK_BOOKINGS = [
  { id:'BK001', guest:'Rahim Uddin',    date:'2025-05-20', guests:4, amount:8400,  status:'confirmed', type:'Weekend Package' },
  { id:'BK002', guest:'Priya Saha',     date:'2025-05-22', guests:2, amount:4200,  status:'pending',   type:'2-Night Stay'    },
  { id:'BK003', guest:'Jahangir Alam',  date:'2025-05-25', guests:6, amount:12600, status:'confirmed', type:'Group Package'   },
  { id:'BK004', guest:'Nadia Islam',    date:'2025-05-28', guests:2, amount:4200,  status:'cancelled', type:'2-Night Stay'    },
  { id:'BK005', guest:'Tanvir Hassan',  date:'2025-06-01', guests:3, amount:6300,  status:'pending',   type:'Weekend Package' },
  { id:'BK006', guest:'Sumaiya Khanam', date:'2025-06-05', guests:5, amount:10500, status:'confirmed', type:'Group Package'   },
]

const MOCK_REVIEWS = [
  { name:'Rahim Uddin',    rating:5, comment:'Absolutely stunning views. Staff was very helpful and food was amazing!',         date:'May 12, 2025' },
  { name:'Priya Saha',     rating:4, comment:'Beautiful location, rooms were clean. The misty mornings were unforgettable.',      date:'Apr 28, 2025' },
  { name:'Karim Molla',    rating:5, comment:'Best stay in Sajek! Will definitely come back with family next winter.',            date:'Apr 15, 2025' },
  { name:'Nadia Islam',    rating:3, comment:'Good place but check-in was delayed. Management should improve communication.',     date:'Mar 30, 2025' },
]

const MOCK_LISTINGS = [
  { id:1, name:'Sajek Hilltop Cottage',  type:'Accommodation', price:'৳2,100/night', status:'active',   bookings:48, rating:4.9 },
  { id:2, name:'Valley View Suite',      type:'Accommodation', price:'৳1,800/night', status:'active',   bookings:36, rating:4.7 },
  { id:3, name:'Group Camping Package',  type:'Package',       price:'৳3,500/group', status:'inactive', bookings:12, rating:4.5 },
]

const STATUS_STYLE = {
  confirmed: { bg:'#d1fae5', color:'#065f46', label:'Confirmed' },
  pending:   { bg:'#fef3c7', color:'#92400e', label:'Pending'   },
  cancelled: { bg:'#fee2e2', color:'#991b1b', label:'Cancelled' },
}

const TABS = ['Overview', 'Bookings', 'Listings', 'Reviews', 'Settings']
const TAB_ICONS = { Overview:'🏠', Bookings:'📦', Listings:'🏨', Reviews:'⭐', Settings:'⚙️' }

// ═══ URL ↔ Tab Mapping ═══
const PATH_TO_TAB = {
  dashboard: 'Overview',
  bookings:  'Bookings',
  listings:  'Listings',
  reviews:   'Reviews',
  settings:  'Settings',
  profile:   'Settings',
}

const TAB_TO_PATH = {
  Overview: 'dashboard',
  Bookings: 'bookings',
  Listings: 'listings',
  Reviews:  'reviews',
  Settings: 'settings',
}

export default function ServiceProviderDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [bookingFilter, setBookingFilter] = useState('all')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // ═══ Derive active tab from URL instead of disconnected state ═══
  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    return PATH_TO_TAB[lastSegment] || 'Overview'
  }, [location.pathname])

  // ═══ Navigate to URL when tab changes ═══
  const handleTabChange = (tab) => {
    const basePath = '/service-provider'
    const targetPath = `${basePath}/${TAB_TO_PATH[tab]}`
    const userId = searchParams.get('user_id')
    const query = userId ? `?user_id=${userId}` : ''
    navigate(targetPath + query)
    setSidebarOpen(false)
  }

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    const userId = searchParams.get('user_id')
    if (!userId) {
      setError('User ID not provided')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/service-provider/profile/?user_id=${userId}`)
      const data = await response.json()

      if (response.ok) {
        setProfileData(data)
      } else {
        setError(data.error || 'Failed to fetch profile data')
      }
    } catch (err) {
      setError('Failed to fetch profile data')
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookingFilter === 'all'
    ? MOCK_BOOKINGS
    : MOCK_BOOKINGS.filter(b => b.status === bookingFilter)

  const handleLogout = () => {
    localStorage.removeItem('providerToken')
    localStorage.removeItem('providerData')
    navigate('/service-provider-registration')
  }

  return (
    <div className="spd-root">

      {/* ── Sidebar ── */}
      <aside className={`spd-sidebar${sidebarOpen ? ' spd-sidebar-open' : ''}`}>
        <div className="spd-sidebar-header">
          <div className="spd-logo">
            <span className="spd-logo-icon">🌿</span>
            <span className="spd-logo-text">TripoBD</span>
          </div>
          <button className="spd-sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        {/* Provider card */}
        <div className="spd-provider-card">
          <div className="spd-avatar">{profileData ? profileData.full_name?.charAt(0).toUpperCase() : MOCK_PROVIDER.avatar}</div>
          <div className="spd-provider-info">
            <div className="spd-provider-name">
              {profileData ? profileData.full_name : MOCK_PROVIDER.name}
              {profileData?.is_verified && <span className="spd-verified">✓</span>}
            </div>
            <div className="spd-provider-type">{profileData ? profileData.service_type?.replace('_', ' ').toUpperCase() : MOCK_PROVIDER.type}</div>
            <div className="spd-provider-loc">📍 {profileData ? `${profileData.division}, ${profileData.district}` : MOCK_PROVIDER.location}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="spd-nav">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`spd-nav-item${activeTab === tab ? ' spd-nav-active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              <span className="spd-nav-icon">{TAB_ICONS[tab]}</span>
              {tab}
            </button>
          ))}
        </nav>

        <div className="spd-sidebar-footer">
          <button className="spd-logout-btn" onClick={() => setShowLogoutConfirm(true)}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Sidebar backdrop */}
      {sidebarOpen && <div className="spd-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main content ── */}
      <div className="spd-main">

        {/* Top bar */}
        <header className="spd-topbar">
          <button className="spd-hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="spd-topbar-title">
            <span className="spd-tab-icon">{TAB_ICONS[activeTab]}</span>
            {activeTab}
          </div>
          <div className="spd-topbar-right">
            <div className="spd-notif-btn">🔔 <span className="spd-notif-badge">3</span></div>
            <div className="spd-topbar-avatar">{MOCK_PROVIDER.avatar}</div>
          </div>
        </header>

        <div className="spd-content">

          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 'Overview' && (
            <div className="spd-section">
              <div className="spd-welcome">
                <div>
                  <h1>Welcome back, <span className="spd-highlight">{MOCK_PROVIDER.name}</span> 👋</h1>
                  <p>Here's what's happening with your listings today.</p>
                </div>
                <button className="spd-primary-btn" onClick={() => handleTabChange('Listings')}>
                  + Add New Listing
                </button>
              </div>

              {/* Stats */}
              <div className="spd-stats-grid">
                {MOCK_STATS.map(s => (
                  <div key={s.label} className="spd-stat-card">
                    <div className="spd-stat-top">
                      <span className="spd-stat-icon">{s.icon}</span>
                      <span className={`spd-stat-change${s.up ? ' up' : ' down'}`}>
                        {s.up ? '↑' : '↓'} {s.change}
                      </span>
                    </div>
                    <div className="spd-stat-value">{s.value}</div>
                    <div className="spd-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent bookings preview */}
              <div className="spd-card">
                <div className="spd-card-head">
                  <h2>Recent Bookings</h2>
                  <button className="spd-link-btn" onClick={() => handleTabChange('Bookings')}>View all →</button>
                </div>
                <div className="spd-table-wrap">
                  <table className="spd-table">
                    <thead>
                      <tr>
                        <th>Guest</th><th>Date</th><th>Amount</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_BOOKINGS.slice(0, 4).map(b => (
                        <tr key={b.id}>
                          <td><strong>{b.guest}</strong><br/><small>{b.type}</small></td>
                          <td>{b.date}</td>
                          <td><strong>৳{b.amount.toLocaleString()}</strong></td>
                          <td>
                            <span className="spd-badge" style={{
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
              <div className="spd-card">
                <div className="spd-card-head">
                  <h2>Recent Reviews</h2>
                  <button className="spd-link-btn" onClick={() => handleTabChange('Reviews')}>View all →</button>
                </div>
                <div className="spd-reviews-preview">
                  {MOCK_REVIEWS.slice(0, 2).map((r, i) => (
                    <div key={i} className="spd-review-item">
                      <div className="spd-review-top">
                        <div className="spd-review-avatar">{r.name[0]}</div>
                        <div>
                          <strong>{r.name}</strong>
                          <div className="spd-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                        </div>
                        <span className="spd-review-date">{r.date}</span>
                      </div>
                      <p className="spd-review-text">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ BOOKINGS ═══ */}
          {activeTab === 'Bookings' && (
            <div className="spd-section">
              <div className="spd-section-head">
                <h1>Bookings</h1>
                <p>Manage all your incoming and past reservations.</p>
              </div>

              {/* Filter pills */}
              <div className="spd-filter-pills">
                {['all', 'confirmed', 'pending', 'cancelled'].map(f => (
                  <button
                    key={f}
                    className={`spd-filter-pill${bookingFilter === f ? ' active' : ''}`}
                    onClick={() => setBookingFilter(f)}
                  >
                    {f === 'all' ? 'All' : STATUS_STYLE[f].label}
                    <span className="spd-pill-count">
                      {f === 'all' ? MOCK_BOOKINGS.length : MOCK_BOOKINGS.filter(b => b.status === f).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="spd-card">
                <div className="spd-table-wrap">
                  <table className="spd-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>Guest</th><th>Package</th><th>Date</th><th>Guests</th><th>Amount</th><th>Status</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => (
                        <tr key={b.id}>
                          <td><code>{b.id}</code></td>
                          <td><strong>{b.guest}</strong></td>
                          <td>{b.type}</td>
                          <td>{b.date}</td>
                          <td>{b.guests}</td>
                          <td><strong>৳{b.amount.toLocaleString()}</strong></td>
                          <td>
                            <span className="spd-badge" style={{
                              background: STATUS_STYLE[b.status].bg,
                              color: STATUS_STYLE[b.status].color
                            }}>
                              {STATUS_STYLE[b.status].label}
                            </span>
                          </td>
                          <td>
                            {b.status === 'pending' && (
                              <div className="spd-action-btns">
                                <button className="spd-accept-btn">✓</button>
                                <button className="spd-reject-btn">✕</button>
                              </div>
                            )}
                            {b.status !== 'pending' && (
                              <button className="spd-view-btn">View</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredBookings.length === 0 && (
                  <div className="spd-empty">
                    <span>📭</span>
                    <p>No {bookingFilter} bookings found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ LISTINGS ═══ */}
          {activeTab === 'Listings' && (
            <div className="spd-section">
              <div className="spd-section-head-row">
                <div>
                  <h1>My Listings</h1>
                  <p>Manage your services, packages and accommodations.</p>
                </div>
                <button className="spd-primary-btn">+ Add Listing</button>
              </div>

              <div className="spd-listings-grid">
                {MOCK_LISTINGS.map(l => (
                  <div key={l.id} className="spd-listing-card">
                    <div className="spd-listing-head">
                      <div>
                        <h3>{l.name}</h3>
                        <span className="spd-type-badge">{l.type}</span>
                      </div>
                      <span className={`spd-status-dot${l.status === 'active' ? ' active' : ''}`}>
                        {l.status === 'active' ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <div className="spd-listing-stats">
                      <div className="spd-listing-stat">
                        <span>Price</span>
                        <strong>{l.price}</strong>
                      </div>
                      <div className="spd-listing-stat">
                        <span>Bookings</span>
                        <strong>{l.bookings}</strong>
                      </div>
                      <div className="spd-listing-stat">
                        <span>Rating</span>
                        <strong>⭐ {l.rating}</strong>
                      </div>
                    </div>
                    <div className="spd-listing-actions">
                      <button className="spd-edit-btn">✏️ Edit</button>
                      <button className="spd-toggle-btn">
                        {l.status === 'active' ? '⏸ Pause' : '▶ Activate'}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new card */}
                <div className="spd-add-listing-card">
                  <span className="spd-add-icon">+</span>
                  <p>Add a new listing</p>
                  <button className="spd-primary-btn">Get Started</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ REVIEWS ═══ */}
          {activeTab === 'Reviews' && (
            <div className="spd-section">
              <div className="spd-section-head">
                <h1>Customer Reviews</h1>
                <p>See what your guests are saying about your services.</p>
              </div>

              {/* Rating summary */}
              <div className="spd-rating-summary">
                <div className="spd-rating-big">
                  <span className="spd-rating-num">{MOCK_PROVIDER.rating}</span>
                  <div className="spd-rating-stars">{'★'.repeat(5)}</div>
                  <span className="spd-rating-count">{MOCK_PROVIDER.totalReviews} reviews</span>
                </div>
                <div className="spd-rating-bars">
                  {[5,4,3,2,1].map(n => (
                    <div key={n} className="spd-rating-row">
                      <span>{n}★</span>
                      <div className="spd-bar-bg">
                        <div className="spd-bar-fill" style={{ width: `${n===5?72:n===4?18:n===3?6:2}%` }} />
                      </div>
                      <span>{n===5?'72%':n===4?'18%':n===3?'6%':'2%'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review list */}
              <div className="spd-reviews-list">
                {MOCK_REVIEWS.map((r, i) => (
                  <div key={i} className="spd-review-card">
                    <div className="spd-review-top">
                      <div className="spd-review-avatar">{r.name[0]}</div>
                      <div className="spd-review-meta">
                        <strong>{r.name}</strong>
                        <div className="spd-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                      </div>
                      <span className="spd-review-date">{r.date}</span>
                    </div>
                    <p className="spd-review-text">{r.comment}</p>
                    <button className="spd-reply-btn">↩ Reply</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {activeTab === 'Settings' && (
            <div className="spd-section">
              <div className="spd-section-head">
                <h1>Account Settings</h1>
                <p>Manage your provider profile and preferences.</p>
              </div>

              {loading ? (
                <div className="spd-empty">
                  <span>⏳</span>
                  <p>Loading profile data...</p>
                </div>
              ) : error ? (
                <div className="spd-empty">
                  <span>⚠️</span>
                  <p>{error}</p>
                </div>
              ) : (
                <div className="spd-settings-grid">
                  <div className="spd-card spd-settings-card">
                    <h3>Personal Information</h3>
                    <div className="spd-form-grid">
                      <div className="spd-field">
                        <label>Full Name</label>
                        <input defaultValue={profileData?.full_name || ''} />
                      </div>
                      <div className="spd-field">
                        <label>Email</label>
                        <input type="email" defaultValue={profileData?.email || ''} disabled />
                      </div>
                      <div className="spd-field">
                        <label>Phone Number</label>
                        <input type="tel" defaultValue={profileData?.phone_number || ''} />
                      </div>
                      <div className="spd-field">
                        <label>Username</label>
                        <input defaultValue={profileData?.username || ''} disabled />
                      </div>
                      <div className="spd-field">
                        <label>Division</label>
                        <input defaultValue={profileData?.division || ''} disabled />
                      </div>
                      <div className="spd-field">
                        <label>District</label>
                        <input defaultValue={profileData?.district || ''} disabled />
                      </div>
                    </div>
                    <button className="spd-primary-btn">Save Changes</button>
                  </div>

                  <div className="spd-card spd-settings-card">
                    <h3>Service Information</h3>
                    <div className="spd-form-grid">
                      <div className="spd-field">
                        <label>Service Type</label>
                        <input defaultValue={profileData?.service_type?.replace('_', ' ').toUpperCase() || ''} disabled />
                      </div>
                      <div className="spd-field spd-field-full">
                        <label>Specialized Destinations</label>
                        <input defaultValue={profileData?.specialized_destinations || ''} />
                      </div>
                      <div className="spd-field">
                        <label>Years of Experience</label>
                        <input type="number" defaultValue={profileData?.years_of_experience || ''} />
                      </div>
                      <div className="spd-field spd-field-full">
                        <label>Languages Offered</label>
                        <input defaultValue={profileData?.languages_offered || ''} />
                      </div>
                      <div className="spd-field">
                        <label>Fee Range</label>
                        <input defaultValue={profileData?.fee_range || ''} />
                      </div>
                      <div className="spd-field spd-field-full">
                        <label>Bank Account Details</label>
                        <textarea rows="3" defaultValue={profileData?.bank_account_details || ''} />
                      </div>
                    </div>
                    <button className="spd-primary-btn">Update Service Info</button>
                  </div>

                  <div className="spd-card spd-settings-card">
                    <h3>Profile Status</h3>
                    <div className="spd-status-info">
                      <div className="spd-status-item">
                        <span>Verification Status:</span>
                        <span className={`spd-status-badge${profileData?.is_verified ? ' verified' : ' pending'}`}>
                          {profileData?.is_verified ? '✓ Verified' : '⏳ Pending Verification'}
                        </span>
                      </div>
                      <div className="spd-status-item">
                        <span>Submitted At:</span>
                        <span>{profileData?.submitted_at ? new Date(profileData.submitted_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      {profileData?.verified_at && (
                        <div className="spd-status-item">
                          <span>Verified At:</span>
                          <span>{new Date(profileData.verified_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="spd-card spd-settings-card spd-danger-card">
                    <h3>Account Actions</h3>
                    <p>Log out from your account.</p>
                    <div className="spd-danger-btns">
                      <button className="spd-outline-btn" onClick={() => setShowLogoutConfirm(true)}>
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
        <div className="spd-modal-overlay">
          <div className="spd-modal">
            <h3>Log out?</h3>
            <p>You'll be redirected to the provider registration / login page.</p>
            <div className="spd-modal-btns">
              <button className="spd-outline-btn" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="spd-danger-btn"  onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Root layout ── */
        .spd-root {
          display: flex; min-height: 100vh;
          background: #f0f4f8;
          font-family: 'Segoe UI', sans-serif;
        }

        /* ── Sidebar ── */
        .spd-sidebar {
          width: 260px; flex-shrink: 0;
          background: linear-gradient(180deg, #0f3460 0%, #16213e 100%);
          display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh;
          overflow-y: auto; z-index: 40;
          transition: transform 0.3s ease;
        }
        .spd-sidebar-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .spd-logo { display: flex; align-items: center; gap: 0.5rem; }
        .spd-logo-icon { font-size: 1.4rem; }
        .spd-logo-text { font-size: 1.2rem; font-weight: 800; color: #ffc107; letter-spacing: -0.02em; }
        .spd-sidebar-close { display: none; background: none; border: none; color: rgba(255,255,255,0.6); font-size: 1.1rem; cursor: pointer; }

        .spd-provider-card {
          display: flex; align-items: flex-start; gap: 0.75rem;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .spd-avatar {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #e53935, #ffc107);
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 800; color: white; flex-shrink: 0;
        }
        .spd-provider-name { font-size: 0.9rem; font-weight: 700; color: white; display: flex; align-items: center; gap: 4px; }
        .spd-verified { background: #10b981; color: white; font-size: 0.6rem; padding: 1px 5px; border-radius: 999px; font-weight: 700; }
        .spd-provider-type { font-size: 0.75rem; color: rgba(255,255,255,0.55); margin-top: 2px; }
        .spd-provider-loc  { font-size: 0.72rem; color: rgba(255,255,255,0.45); margin-top: 2px; }

        /* ── Navigation ── */
        .spd-nav { padding: 1rem 0.75rem; flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .spd-nav-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.7rem 0.9rem; border-radius: 10px;
          background: none; border: none; border-left: 3px solid transparent;
          color: rgba(255,255,255,0.65);
          font-size: 0.9rem; font-weight: 500; cursor: pointer; text-align: left;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .spd-nav-item:hover { background: rgba(255,255,255,0.08); color: white; border-left-color: rgba(255,255,255,0.2); }
        .spd-nav-active { 
          background: rgba(255,255,255,0.12) !important; 
          color: white !important; 
          font-weight: 700;
          border-left: 3px solid #ffc107 !important;
          border-radius: 0 10px 10px 0;
        }
        .spd-nav-icon { font-size: 1rem; }

        .spd-sidebar-footer { padding: 1rem 0.75rem; border-top: 1px solid rgba(255,255,255,0.08); }
        .spd-logout-btn {
          width: 100%; padding: 0.65rem; border-radius: 10px;
          background: rgba(229,57,53,0.15); border: 1px solid rgba(229,57,53,0.25);
          color: #ef9a9a; font-size: 0.88rem; font-weight: 600; cursor: pointer;
          transition: background 0.2s;
        }
        .spd-logout-btn:hover { background: rgba(229,57,53,0.3); color: #ffcdd2; }

        /* ── Main ── */
        .spd-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        .spd-topbar {
          background: white; border-bottom: 1px solid #e5e7eb;
          padding: 0 1.5rem; height: 95px;
          display: flex; align-items: center; gap: 1rem;
          position: sticky; top: 0; z-index: 30;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .spd-hamburger { display: none; background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #374151; }
        .spd-topbar-title { font-size: 1rem; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 0.5rem; flex: 1; }
        .spd-tab-icon { font-size: 1.1rem; }
        .spd-topbar-right { display: flex; align-items: center; gap: 1rem; }
        .spd-notif-btn { position: relative; font-size: 1.2rem; cursor: pointer; }
        .spd-notif-badge {
          position: absolute; top: -4px; right: -6px;
          background: #e53935; color: white; font-size: 0.6rem;
          padding: 1px 4px; border-radius: 999px; font-weight: 700;
        }
        .spd-topbar-avatar {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #e53935, #ffc107);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 800; color: white; cursor: pointer;
        }

        .spd-content { padding: 2rem; flex: 1; }

        /* ── Sections ── */
        .spd-section { display: flex; flex-direction: column; gap: 1.5rem; }
        .spd-welcome {
          display: flex; align-items: flex-start; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .spd-welcome h1 { font-size: clamp(1.3rem,2.5vw,1.8rem); font-weight: 800; color: #111827; margin: 0 0 0.25rem; }
        .spd-welcome p  { color: #6b7280; font-size: 0.95rem; margin: 0; }
        .spd-highlight  { color: #0f3460; }
        .spd-section-head h1 { font-size: 1.6rem; font-weight: 800; color: #111827; margin: 0 0 0.25rem; }
        .spd-section-head p  { color: #6b7280; margin: 0; }
        .spd-section-head-row { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }

        /* ── Stats ── */
        .spd-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 1rem; }
        .spd-stat-card {
          background: white; border-radius: 14px; padding: 1.5rem;
          border: 1px solid #f3f4f6; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .spd-stat-top { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
        .spd-stat-icon { font-size: 1.5rem; }
        .spd-stat-change { font-size: 0.78rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
        .spd-stat-change.up   { background: #d1fae5; color: #065f46; }
        .spd-stat-change.down { background: #fee2e2; color: #991b1b; }
        .spd-stat-value { font-size: 1.8rem; font-weight: 800; color: #111827; margin-bottom: 0.25rem; }
        .spd-stat-label { font-size: 0.82rem; color: #6b7280; font-weight: 500; }

        /* ── Cards ── */
        .spd-card {
          background: white; border-radius: 14px; padding: 1.5rem;
          border: 1px solid #f3f4f6; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .spd-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
        .spd-card-head h2 { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
        .spd-link-btn { background: none; border: none; color: #0f3460; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
        .spd-link-btn:hover { text-decoration: underline; }

        /* ── Table ── */
        .spd-table-wrap { overflow-x: auto; }
        .spd-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .spd-table th {
          text-align: left; padding: 0.6rem 0.75rem;
          font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: #9ca3af;
          border-bottom: 1px solid #f3f4f6; white-space: nowrap;
        }
        .spd-table td { padding: 0.85rem 0.75rem; border-bottom: 1px solid #f9fafb; color: #374151; vertical-align: middle; }
        .spd-table td small { color: #9ca3af; font-size: 0.75rem; }
        .spd-table tr:last-child td { border-bottom: none; }
        .spd-table tr:hover td { background: #f9fafb; }
        .spd-table code { font-size: 0.78rem; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #6b7280; }

        .spd-badge { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }

        .spd-action-btns { display: flex; gap: 6px; }
        .spd-accept-btn { background: #d1fae5; color: #065f46; border: none; border-radius: 6px; padding: 4px 10px; font-size: 0.85rem; cursor: pointer; font-weight: 700; }
        .spd-reject-btn { background: #fee2e2; color: #991b1b; border: none; border-radius: 6px; padding: 4px 10px; font-size: 0.85rem; cursor: pointer; font-weight: 700; }
        .spd-view-btn   { background: #eff6ff; color: #1d4ed8; border: none; border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; cursor: pointer; font-weight: 600; }

        /* ── Filter pills ── */
        .spd-filter-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .spd-filter-pill {
          display: flex; align-items: center; gap: 6px;
          background: white; border: 1.5px solid #e5e7eb;
          border-radius: 999px; padding: 0.4rem 1rem;
          font-size: 0.82rem; font-weight: 600; color: #6b7280; cursor: pointer;
          transition: all 0.15s;
        }
        .spd-filter-pill:hover { border-color: #0f3460; color: #0f3460; }
        .spd-filter-pill.active { background: #0f3460; border-color: #0f3460; color: white; }
        .spd-pill-count { background: rgba(255,255,255,0.25); padding: 0px 6px; border-radius: 999px; font-size: 0.7rem; }
        .spd-filter-pill:not(.active) .spd-pill-count { background: #f3f4f6; color: #374151; }

        /* ── Listings ── */
        .spd-listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1.25rem; }
        .spd-listing-card {
          background: white; border-radius: 14px; padding: 1.5rem;
          border: 1px solid #f3f4f6; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          display: flex; flex-direction: column; gap: 1rem;
        }
        .spd-listing-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
        .spd-listing-head h3 { font-size: 0.95rem; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .spd-type-badge { background: #eff6ff; color: #1d4ed8; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
        .spd-status-dot { font-size: 0.75rem; font-weight: 700; color: #9ca3af; white-space: nowrap; }
        .spd-status-dot.active { color: #10b981; }
        .spd-listing-stats { display: flex; gap: 0; border: 1px solid #f3f4f6; border-radius: 10px; overflow: hidden; }
        .spd-listing-stat { flex: 1; padding: 0.6rem 0.5rem; text-align: center; border-right: 1px solid #f3f4f6; }
        .spd-listing-stat:last-child { border-right: none; }
        .spd-listing-stat span  { display: block; font-size: 0.65rem; color: #9ca3af; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
        .spd-listing-stat strong{ font-size: 0.88rem; color: #111827; font-weight: 700; }
        .spd-listing-actions { display: flex; gap: 0.5rem; }
        .spd-edit-btn   { flex: 1; padding: 0.5rem; background: #f3f4f6; border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; color: #374151; }
        .spd-toggle-btn { flex: 1; padding: 0.5rem; background: #eff6ff; border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; color: #1d4ed8; }
        .spd-add-listing-card {
          background: white; border-radius: 14px; padding: 2rem 1.5rem;
          border: 2px dashed #e5e7eb;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 0.75rem; text-align: center; cursor: pointer;
          transition: border-color 0.2s;
        }
        .spd-add-listing-card:hover { border-color: #0f3460; }
        .spd-add-icon { font-size: 2rem; color: #d1d5db; font-weight: 300; }
        .spd-add-listing-card p { color: #9ca3af; font-size: 0.9rem; margin: 0; }

        /* ── Reviews ── */
        .spd-rating-summary {
          background: white; border-radius: 14px; padding: 1.5rem;
          border: 1px solid #f3f4f6; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          display: flex; gap: 2rem; align-items: center; flex-wrap: wrap;
        }
        .spd-rating-big { text-align: center; min-width: 100px; }
        .spd-rating-num  { font-size: 3.5rem; font-weight: 800; color: #111827; line-height: 1; display: block; }
        .spd-rating-stars{ font-size: 1.2rem; color: #f59e0b; margin: 4px 0; }
        .spd-rating-count{ font-size: 0.82rem; color: #9ca3af; }
        .spd-rating-bars { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px; }
        .spd-rating-row  { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #6b7280; }
        .spd-rating-row span:first-child { width: 24px; text-align: right; }
        .spd-rating-row span:last-child  { width: 36px; }
        .spd-bar-bg   { flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
        .spd-bar-fill { height: 100%; background: linear-gradient(90deg, #fbbf24, #f59e0b); border-radius: 4px; }

        .spd-reviews-list { display: flex; flex-direction: column; gap: 1rem; }
        .spd-review-card {
          background: white; border-radius: 14px; padding: 1.5rem;
          border: 1px solid #f3f4f6; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .spd-reviews-preview { display: flex; flex-direction: column; gap: 1rem; }
        .spd-review-item { padding: 1rem; background: #f9fafb; border-radius: 10px; }
        .spd-review-top  { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
        .spd-review-avatar {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #0f3460, #1565c0);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 0.9rem;
        }
        .spd-review-meta { flex: 1; }
        .spd-review-meta strong { font-size: 0.9rem; color: #111827; display: block; }
        .spd-stars       { font-size: 0.85rem; color: #f59e0b; }
        .spd-review-date { font-size: 0.75rem; color: #9ca3af; white-space: nowrap; }
        .spd-review-text { font-size: 0.88rem; color: #374151; line-height: 1.6; margin: 0 0 0.75rem; }
        .spd-reply-btn   { background: none; border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px 12px; font-size: 0.78rem; color: #6b7280; cursor: pointer; }
        .spd-reply-btn:hover { border-color: #0f3460; color: #0f3460; }

        /* ── Settings ── */
        .spd-settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px,1fr)); gap: 1.25rem; }
        .spd-settings-card h3 { font-size: 1rem; font-weight: 700; color: #111827; margin: 0 0 1.25rem; }
        .spd-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
        .spd-field { display: flex; flex-direction: column; gap: 5px; }
        .spd-field-full { grid-column: 1 / -1; }
        .spd-field label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #9ca3af; }
        .spd-field input, .spd-field select, .spd-field textarea {
          border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 0.6rem 0.75rem;
          font-size: 0.88rem; font-family: inherit; color: #111827; background: #f9fafb;
          transition: border-color 0.2s;
        }
        .spd-field input:focus, .spd-field select:focus, .spd-field textarea:focus {
          outline: none; border-color: #0f3460; background: white;
        }

        .spd-status-info { display: flex; flex-direction: column; gap: 0.75rem; }
        .spd-status-item { display: flex; align-items: center; justify-content: space-between; font-size: 0.88rem; color: #374151; }
        .spd-status-badge { padding: 4px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
        .spd-status-badge.verified { background: #d1fae5; color: #065f46; }
        .spd-status-badge.pending { background: #fef3c7; color: #92400e; }

        .spd-danger-card { border-color: #fee2e2 !important; }
        .spd-danger-card h3 { color: #991b1b; }
        .spd-danger-card p  { font-size: 0.85rem; color: #6b7280; margin: 0 0 1rem; }
        .spd-danger-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }

        /* ── Buttons ── */
        .spd-primary-btn {
          background: linear-gradient(135deg, #0f3460, #1565c0);
          color: white; border: none; border-radius: 10px;
          padding: 0.65rem 1.4rem; font-size: 0.88rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s; white-space: nowrap;
        }
        .spd-primary-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .spd-outline-btn {
          background: white; color: #374151; border: 1.5px solid #e5e7eb;
          border-radius: 10px; padding: 0.6rem 1.2rem;
          font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: border-color 0.2s;
        }
        .spd-outline-btn:hover { border-color: #9ca3af; }
        .spd-danger-btn {
          background: linear-gradient(135deg, #e53935, #b71c1c);
          color: white; border: none; border-radius: 10px;
          padding: 0.6rem 1.2rem; font-size: 0.88rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s;
        }
        .spd-danger-btn:hover { opacity: 0.88; }

        /* ── Empty state ── */
        .spd-empty { text-align: center; padding: 3rem 2rem; }
        .spd-empty span { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
        .spd-empty p    { color: #9ca3af; font-size: 0.9rem; margin: 0; }

        /* ── Modal ── */
        .spd-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .spd-modal {
          background: white; border-radius: 16px; padding: 2rem;
          max-width: 360px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .spd-modal h3 { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem; }
        .spd-modal p  { font-size: 0.88rem; color: #6b7280; margin: 0 0 1.5rem; }
        .spd-modal-btns { display: flex; gap: 0.75rem; justify-content: flex-end; }

        /* ── Backdrop ── */
        .spd-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          z-index: 35; display: none;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .spd-sidebar {
            position: fixed; top: 0; left: 0; height: 100vh;
            transform: translateX(-100%);
          }
          .spd-sidebar-open { transform: translateX(0); }
          .spd-sidebar-close { display: block; }
          .spd-backdrop { display: block; }
          .spd-hamburger { display: block; }
          .spd-content { padding: 1.25rem; }
          .spd-form-grid { grid-template-columns: 1fr; }
          .spd-table th:nth-child(n+5), .spd-table td:nth-child(n+5) { display: none; }
        }
        @media (max-width: 480px) {
          .spd-stats-grid { grid-template-columns: 1fr 1fr; }
          .spd-settings-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}