import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAdminDashboard } from '../apiClient'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const adminId = localStorage.getItem('userId')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }
    const loadStats = async () => {
      try {
        const stats = await getAdminDashboard(adminId)
        setData(stats)
      } catch (err) {
        setError(err.message || 'Failed to load administrator dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [adminId])

  if (loading) {
    return <main className="page-shell"><p className="admin-status">Loading admin statistics...</p></main>
  }

  if (error && !data) {
    return (
      <main className="page-shell">
        <p className="admin-status admin-error">{error}</p>
        <button className="button button-primary" onClick={() => navigate('/signin')}>Sign In</button>
      </main>
    )
  }

  const kpi = data?.kpi || {}

  return (
    <main className="page-shell admin-dashboard">
      <header className="admin-header">
        <h1>TripoBD Administration</h1>
        <p>Operational analytics, system moderation, guides verification queues, and system parameters controls.</p>
      </header>

      {/* KPI metrics row */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <span>Registered Users</span>
          <strong>{kpi.total_users}</strong>
        </div>
        <div className="kpi-card">
          <span>Active Tour Rooms</span>
          <strong>{kpi.active_rooms}</strong>
        </div>
        <div className="kpi-card">
          <span>Verified Guides</span>
          <strong>{kpi.verified_guides}</strong>
        </div>
        <div className="kpi-card warning">
          <span>Pending Applications</span>
          <strong>{kpi.pending_guides}</strong>
        </div>
        <div className="kpi-card">
          <span>Destinations Listed</span>
          <strong>{kpi.destinations_listed}</strong>
        </div>
        <div className="kpi-card success">
          <span>Published Stories</span>
          <strong>{kpi.total_stories}</strong>
        </div>
        <div className="kpi-card error">
          <span>Open Complaints</span>
          <strong>{kpi.open_complaints}</strong>
        </div>
      </section>

      {/* Analytics charts panels */}
      <section className="charts-grid">
        <div className="chart-card">
          <h4>📈 User Registrations Trend (Last 6 Months)</h4>
          <div className="chart-svg-container">
            {/* Custom line chart SVG */}
            <svg viewBox="0 0 400 180" className="admin-svg-chart">
              <path d="M 30,150 L 90,130 L 150,110 L 210,80 L 270,50 L 350,20" fill="none" stroke="#3b82f6" strokeWidth="3" />
              <circle cx="30" cy="150" r="4" fill="#3b82f6" /><text x="25" y="170" className="chart-text">Jan</text>
              <circle cx="90" cy="130" r="4" fill="#3b82f6" /><text x="85" y="170" className="chart-text">Feb</text>
              <circle cx="150" cy="110" r="4" fill="#3b82f6" /><text x="145" y="170" className="chart-text">Mar</text>
              <circle cx="210" cy="80" r="4" fill="#3b82f6" /><text x="205" y="170" className="chart-text">Apr</text>
              <circle cx="270" cy="50" r="4" fill="#3b82f6" /><text x="265" y="170" className="chart-text">May</text>
              <circle cx="350" cy="20" r="4" fill="#3b82f6" /><text x="345" y="170" className="chart-text">Jun</text>
            </svg>
          </div>
        </div>

        <div className="chart-card">
          <h4>📊 Tour Rooms Created Per Week (Weekly Activity)</h4>
          <div className="chart-svg-container">
            {/* Custom bar chart SVG */}
            <svg viewBox="0 0 400 180" className="admin-svg-chart">
              <rect x="40" y="100" width="30" height="50" fill="#a855f7" rx="3" /><text x="45" y="170" className="chart-text">W1</text>
              <rect x="110" y="80" width="30" height="70" fill="#a855f7" rx="3" /><text x="115" y="170" className="chart-text">W2</text>
              <rect x="180" y="50" width="30" height="100" fill="#a855f7" rx="3" /><text x="185" y="170" className="chart-text">W3</text>
              <rect x="250" y="30" width="30" height="120" fill="#a855f7" rx="3" /><text x="255" y="170" className="chart-text">W4</text>
              <rect x="320" y="10" width="30" height="140" fill="#a855f7" rx="3" /><text x="325" y="170" className="chart-text">W5</text>
            </svg>
          </div>
        </div>

        <div className="chart-card">
          <h4>🏞️ Destination Views by Category</h4>
          <div className="chart-svg-container pie-container">
            {/* Custom pie chart SVG */}
            <svg viewBox="0 0 160 160" width="140" height="140">
              <circle r="40" cx="80" cy="80" fill="transparent"
                stroke="#10b981" strokeWidth="80" strokeDasharray="125 251" strokeDashoffset="0" />
              <circle r="40" cx="80" cy="80" fill="transparent"
                stroke="#3b82f6" strokeWidth="80" strokeDasharray="75 251" strokeDashoffset="-125" />
              <circle r="40" cx="80" cy="80" fill="transparent"
                stroke="#fbbf24" strokeWidth="80" strokeDasharray="51 251" strokeDashoffset="-200" />
            </svg>
            <div className="pie-legend">
              <div><span className="legend-dot bg-green"></span> Forest (50%)</div>
              <div><span className="legend-dot bg-blue"></span> Beach (30%)</div>
              <div><span className="legend-dot bg-amber"></span> Hill (20%)</div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h4>🌐 App Usage by Region</h4>
          <div className="chart-svg-container donut-container">
            {/* Custom donut chart SVG */}
            <svg viewBox="0 0 160 160" width="140" height="140">
              <circle r="40" cx="80" cy="80" fill="transparent"
                stroke="#f43f5e" strokeWidth="40" strokeDasharray="150 251" strokeDashoffset="0" />
              <circle r="40" cx="80" cy="80" fill="transparent"
                stroke="#6366f1" strokeWidth="40" strokeDasharray="101 251" strokeDashoffset="-150" />
              {/* Center hole to make it a donut */}
              <circle r="25" cx="80" cy="80" fill="white" />
            </svg>
            <div className="pie-legend">
              <div><span className="legend-dot bg-rose"></span> Dhaka (60%)</div>
              <div><span className="legend-dot bg-indigo"></span> Chittagong (40%)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Operations Grid */}
      <div className="admin-layout-columns">
        {/* Left column: Feed activities */}
        <div className="admin-panel-col">
          <section className="operations-card">
            <h3>👥 Recent User Registrations</h3>
            <div className="list-container">
              {data?.recent_users?.map((user) => (
                <div key={user.id} className="feed-item-row">
                  <div>
                    <strong>{user.full_name || user.username}</strong>
                    <div className="item-sub-desc">@{user.username} • Role: {user.user_type}</div>
                  </div>
                  <span className="badge-tag active">{user.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="operations-card" style={{ marginTop: '1.5rem' }}>
            <h3>💬 Support Ticket Inbox</h3>
            <div className="list-container">
              {data?.recent_tickets?.map((t) => (
                <div key={t.id} className="feed-item-row" onClick={() => navigate('/admin/support')} style={{ cursor: 'pointer' }}>
                  <div>
                    <strong>{t.subject}</strong>
                    <div className="item-sub-desc">Opened by @{t.username} • Priority: {t.priority}</div>
                  </div>
                  <span className={`status-pill ${t.status}`}>{t.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column: Quick Actions & Apps */}
        <div className="admin-panel-col">
          <section className="operations-card">
            <h3>⚡ Quick Operational Actions</h3>
            <div className="quick-action-buttons-grid">
              <Link to="/admin/guides" className="admin-action-btn">🏅 Review Guide Applications</Link>
              <Link to="/admin/moderation" className="admin-action-btn">🛡️ Moderate Flagged Reviews</Link>
              <Link to="/admin/destinations" className="admin-action-btn">➕ Add New Destination</Link>
              <Link to="/admin/notifications" className="admin-action-btn">📢 Send Global Announcement</Link>
            </div>
          </section>

          <section className="operations-card" style={{ marginTop: '1.5rem' }}>
            <h3>🏅 Pending Guide Verification Applications</h3>
            {data?.recent_applications?.length === 0 ? (
              <p className="empty-sub-text">No pending guide verifications at this time.</p>
            ) : (
              <div className="list-container">
                {data?.recent_applications?.map((app) => (
                  <div key={app.id} className="feed-item-row" onClick={() => navigate('/admin/guides')} style={{ cursor: 'pointer' }}>
                    <div>
                      <strong>{app.full_name} (@{app.username})</strong>
                      <div className="item-sub-desc">Experience: {app.years_of_experience} yrs • Speciality: {app.service_type}</div>
                    </div>
                    <span className="verify-action-link">Verify ➔</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <style>{`
        .admin-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .admin-header h1 { font-size: 2.25rem; font-weight: 850; margin: 0 0 0.5rem 0; color: #0f172a; }
        .admin-header p { font-size: 1.05rem; color: #64748b; margin: 0; }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
        }
        .kpi-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.01);
        }
        .kpi-card span { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.2rem; text-transform: uppercase; font-weight: 700; }
        .kpi-card strong { font-size: 1.3rem; font-weight: 850; color: #0f172a; }
        .kpi-card.warning strong { color: #d97706; }
        .kpi-card.success strong { color: #166534; }
        .kpi-card.error strong { color: #dc2626; }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        .chart-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.25rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.01);
        }
        .chart-card h4 { font-size: 0.95rem; font-weight: 800; margin: 0 0 1rem 0; color: #334155; }
        .chart-svg-container { height: 160px; display: flex; align-items: center; justify-content: center; }
        .admin-svg-chart { width: 100%; height: 100%; }
        .chart-text { font-size: 10px; fill: #64748b; font-weight: 700; }
        
        .pie-container, .donut-container { display: flex; gap: 1.5rem; justify-content: flex-start; }
        .pie-legend { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; color: #475569; }
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .bg-green { background: #10b981; }
        .bg-blue { background: #3b82f6; }
        .bg-amber { background: #fbbf24; }
        .bg-rose { background: #f43f5e; }
        .bg-indigo { background: #6366f1; }
        
        .admin-layout-columns {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .admin-layout-columns { grid-template-columns: 1fr; }
        }
        
        .operations-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
        }
        .operations-card h3 { font-size: 1.1rem; font-weight: 800; margin: 0 0 1.25rem 0; color: #0f172a; }
        .list-container { display: flex; flex-direction: column; gap: 0.75rem; }
        .feed-item-row { display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; transition: transform 0.2s; }
        .feed-item-row:hover { transform: translateX(2px); }
        .item-sub-desc { font-size: 0.75rem; color: #94a3b8; margin-top: 0.15rem; }
        
        .badge-tag { font-size: 0.7rem; font-weight: 850; padding: 0.15rem 0.45rem; border-radius: 4px; text-transform: uppercase; }
        .badge-tag.active { background: #dcfce7; color: #166534; }
        
        .status-pill { font-size: 0.7rem; font-weight: 850; padding: 0.15rem 0.45rem; border-radius: 4px; text-transform: uppercase; }
        .status-pill.open { background: #dcfce7; color: #166534; }
        .status-pill.in_progress { background: #fef3c7; color: #b45309; }
        
        .quick-action-buttons-grid { display: flex; flex-direction: column; gap: 0.65rem; }
        .admin-action-btn { text-decoration: none; display: block; text-align: center; padding: 0.8rem; background: #f1f5f9; color: #334155; border-radius: 12px; font-weight: 750; font-size: 0.88rem; transition: background 0.2s, color 0.2s; }
        .admin-action-btn:hover { background: #ef4444; color: white; }
        
        .verify-action-link { font-size: 0.82rem; font-weight: 750; color: #ef4444; }
        .empty-sub-text { font-size: 0.82rem; color: #94a3b8; text-align: center; padding: 1.5rem 0; }
        
        .admin-status { text-align: center; padding: 3rem; color: #64748b; }
        .admin-error { color: #dc2626; }
      `}</style>
    </main>
  )
}
