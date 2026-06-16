import { useEffect, useState } from 'react'
import { getAdminAuditLogs } from '../apiClient'

export default function AdminLogs() {
  const adminId = localStorage.getItem('userId')
  const [auditLogs, setAuditLogs] = useState([])
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('audit') // audit, failed_logins
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Failed login logs mock dataset for safety compliance
  const failedLoginsMock = [
    { id: 201, ip: '103.220.207.25', username: 'admin_hack', reason: 'Incorrect Password', date: '2026-06-16T14:22:10Z' },
    { id: 202, ip: '192.168.1.100', username: 'unknown_guide', reason: 'Username not found', date: '2026-06-15T09:12:44Z' },
    { id: 203, ip: '180.234.122.9', username: 'sylhet_guide_rahim', reason: 'OTP Code Mismatch', date: '2026-06-15T08:05:12Z' },
    { id: 204, ip: '103.111.90.155', username: 'admin', reason: 'Incorrect Password', date: '2026-06-14T21:40:02Z' }
  ]

  useEffect(() => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }

    const loadLogs = async () => {
      try {
        const data = await getAdminAuditLogs(adminId)
        setAuditLogs(data)
      } catch (err) {
        setError(err.message || 'Failed to load audit logs.')
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [adminId])

  const filteredAudits = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) ||
                          log.details.toLowerCase().includes(search.toLowerCase()) ||
                          (log.ip_address && log.ip_address.includes(search))
    
    if (actionFilter === 'All') return matchesSearch
    return matchesSearch && log.action === actionFilter
  })

  // Unique actions list for filter drop-down
  const actionTypes = Array.from(new Set(auditLogs.map(log => log.action)))

  if (loading) {
    return <main className="page-shell"><p className="admin-status">Loading security logs & audit traces...</p></main>
  }

  return (
    <main className="page-shell admin-logs">
      <header className="admin-header">
        <h1>📁 Security & GDPR Audit Logs</h1>
        <p>Trace administrative actions, system parameter overrides, guide verification changes, and failed authentication attempts.</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs */}
      <div className="logs-tabs">
        <button 
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📁 Admin Audit Trail
        </button>
        <button 
          className={`tab-btn ${activeTab === 'failed_logins' ? 'active' : ''}`}
          onClick={() => setActiveTab('failed_logins')}
        >
          🚨 Failed Logins & OTP Violations
        </button>
      </div>

      {activeTab === 'audit' ? (
        <>
          {/* Filters for audits */}
          <section className="filter-controls-card">
            <div className="search-box">
              <label htmlFor="log-search">Search Logs</label>
              <input
                id="log-search"
                type="text"
                placeholder="Search by action, details, IP address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-dropdown">
              <label htmlFor="action-select">Filter by Action</label>
              <select
                id="action-select"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Actions</option>
                {actionTypes.map((act, idx) => (
                  <option key={idx} value={act}>{act}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Audits Table */}
          {filteredAudits.length === 0 ? (
            <div className="no-results-card">
              <h3>No Audit Logs Found</h3>
              <p>Try modifying your search query or action filter.</p>
            </div>
          ) : (
            <div className="table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Admin User</th>
                    <th>Action Code</th>
                    <th>Trace Log Details</th>
                    <th>Client IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudits.map((log) => (
                    <tr key={log.id}>
                      <td className="timestamp-cell">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <strong>@{log.admin_username || `Admin #${log.admin}`}</strong>
                      </td>
                      <td>
                        <span className={`action-badge ${log.action.toLowerCase()}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="details-cell">{log.details}</td>
                      <td>
                        <code className="ip-code">{log.ip_address || '127.0.0.1'}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Failed Logins Table */
        <div className="table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Security Incident Date</th>
                <th>Attempted Username</th>
                <th>Violation Detail Reason</th>
                <th>Origin IP Address</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {failedLoginsMock.map((log) => (
                <tr key={log.id}>
                  <td className="timestamp-cell">
                    {new Date(log.date).toLocaleString()}
                  </td>
                  <td>
                    <strong>@{log.username}</strong>
                  </td>
                  <td className="failed-reason-cell">⚠️ {log.reason}</td>
                  <td>
                    <code className="ip-code">{log.ip}</code>
                  </td>
                  <td>
                    <span className="severity-badge-high">High</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .admin-logs {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .admin-header h1 {
          font-size: 2.25rem;
          font-weight: 850;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }
        .admin-header p {
          color: #64748b;
          margin: 0 0 2rem 0;
        }

        .alert {
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }
        .alert-danger {
          background: #fee2e2;
          color: #991b1b;
        }

        .logs-tabs {
          display: flex;
          gap: 1rem;
          border-bottom: 1.5px solid #cbd5e1;
          padding-bottom: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .tab-btn {
          background: none;
          border: none;
          padding: 0.5rem 1rem;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .tab-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .tab-btn.active {
          background: #ef4444;
          color: white;
        }

        .filter-controls-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.01);
        }
        .search-box {
          flex: 2;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .filter-dropdown {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .filter-controls-card label {
          font-size: 0.8rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
        }
        .filter-input, .filter-select {
          padding: 0.7rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          font-family: inherit;
          font-size: 0.88rem;
        }
        .filter-input:focus, .filter-select:focus {
          border-color: #ef4444;
        }

        .no-results-card {
          background: white;
          border: 1px dashed #cbd5e1;
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          color: #64748b;
        }

        .table-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.01);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          background: #f8fafc;
          padding: 1rem;
          font-size: 0.82rem;
          font-weight: 800;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          text-transform: uppercase;
        }
        .admin-table td {
          padding: 1.15rem 1rem;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.88rem;
          color: #334155;
        }
        .timestamp-cell {
          font-family: monospace;
          color: #64748b !important;
          font-size: 0.82rem !important;
        }
        .details-cell {
          font-weight: 600;
          color: #0f172a;
          line-height: 1.4;
        }
        .failed-reason-cell {
          color: #b91c1c !important;
          font-weight: 700;
        }
        .ip-code {
          background: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.8rem;
          color: #0f172a;
          font-family: monospace;
        }

        .action-badge {
          font-size: 0.68rem;
          font-weight: 900;
          text-transform: uppercase;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }
        .action-badge.add_destination { background: #dcfce7; color: #166534; }
        .action-badge.edit_destination { background: #e0f2fe; color: #0369a1; }
        .action-badge.delete_destination { background: #fee2e2; color: #991b1b; }
        .action-badge.approve_guide { background: #dcfce7; color: #166534; }
        .action-badge.reject_guide { background: #fee2e2; color: #991b1b; }
        .action-badge.send_announcement { background: #f3e8ff; color: #7e22ce; }
        
        .severity-badge-high {
          background: #ffe4e6;
          color: #9f1239;
          font-weight: 850;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          font-size: 0.72rem;
          text-transform: uppercase;
        }
      `}</style>
    </main>
  )
}
