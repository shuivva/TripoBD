import { useEffect, useState } from 'react'
import { getAdminUsers, adminUserAction } from '../apiClient'

export default function AdminUsers() {
  const adminId = localStorage.getItem('userId')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  // Filters state
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  
  // User profile detail modal
  const [selectedUser, setSelectedUser] = useState(null)
  const [userRooms, setUserRooms] = useState([])
  const [userStories, setUserStories] = useState([])

  const loadUsers = async () => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }
    try {
      const list = await getAdminUsers(adminId, { search, role, status })
      setUsers(list)
    } catch {
      setError('Failed to load user directory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [adminId, search, role, status])

  const handleAction = async (targetUserId, action, reason = '') => {
    setMessage('')
    setError('')
    try {
      await adminUserAction(adminId, { user_id: targetUserId, action, reason })
      setMessage(`Action '${action}' applied successfully.`)
      setSelectedUser(null)
      loadUsers()
    } catch {
      setError('Failed to apply user action.')
    }
  }

  const viewUserDetails = async (user) => {
    setSelectedUser(user)
    setUserRooms([])
    setUserStories([])
    try {
      // retrieve rooms and stories of traveler
      const resRooms = await fetch(`http://localhost:8000/api/traveler/${user.id}/tourrooms/`)
      if (resRooms.ok) {
        const list = await resRooms.json()
        setUserRooms(list)
      }
      
      const resStories = await fetch(`http://localhost:8000/api/traveler/${user.id}/reviews/`)
      if (resStories.ok) {
        const storiesList = await resStories.json()
        setUserStories(storiesList.stories || [])
      }
    } catch {
      // ignore
    }
  }

  if (loading && users.length === 0) {
    return <main className="page-shell"><p className="admin-status">Loading user data...</p></main>
  }

  return (
    <main className="page-shell admin-users">
      {message && <div className="admin-alert success">{message}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      <header className="admin-header-main">
        <h1>User Account Directory</h1>
        <p>Suspend, ban, reset passwords, delete accounts, and audit community activity logs.</p>
      </header>

      {/* Filters Panel */}
      <section className="filters-panel-card">
        <div className="filter-item search-field">
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="">All Account Roles</option>
            <option value="traveler">Travelers</option>
            <option value="service_provider">Service Providers</option>
          </select>
        </div>
        <div className="filter-item">
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Account Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </section>

      {/* Users Database Table */}
      <section className="users-table-panel">
        {users.length === 0 ? (
          <p className="empty-table-text">No registered users matched the active filters.</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td>
                      <strong>{user.full_name || 'N/A'}</strong>
                      <div className="sub-user">@{user.username}</div>
                    </td>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      <span className={`role-badge ${user.user_type}`}>
                        {user.user_type === 'service_provider' ? 'Provider' : 'Traveler'}
                      </span>
                    </td>
                    <td>{new Date(user.registration_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-pill ${user.status}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="button button-secondary compact" onClick={() => viewUserDetails(user)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="crop-modal">
          <div className="crop-modal-content user-details-modal">
            <h3>Account Settings: @{selectedUser.username}</h3>
            <p className="community-muted">Audit user settings and restrict platform usage if needed.</p>

            <div className="user-profile-summary">
              <p>👤 **Name:** {selectedUser.full_name}</p>
              <p>✉️ **Email:** {selectedUser.email}</p>
              <p>📞 **Phone:** {selectedUser.phone_number || 'N/A'}</p>
              <p>🔑 **Role:** {selectedUser.user_type === 'service_provider' ? 'Service Provider' : 'Traveler'}</p>
              <p>🗓️ **Joined:** {new Date(selectedUser.registration_date).toLocaleDateString()}</p>
              <p>⚠️ **Current Status:** {selectedUser.status}</p>
            </div>

            <div className="user-activities-tabs">
              <h4>Activity Metrics</h4>
              <div className="metrics-row">
                <div className="metric">
                  <span>Rooms Joined</span>
                  <strong>{userRooms.length}</strong>
                </div>
                <div className="metric">
                  <span>Stories Posted</span>
                  <strong>{userStories.length}</strong>
                </div>
              </div>
            </div>

            <div className="action-panel-triggers">
              <h4>Administrative Controls</h4>
              <div className="action-buttons-flex">
                <button className="button button-tertiary font-weight-bold" onClick={() => handleAction(selectedUser.id, 'reset_password')}>
                  Reset Password
                </button>
                {selectedUser.status === 'Active' ? (
                  <button className="button button-secondary suspend-btn" onClick={() => {
                    const r = prompt('Reason for account suspension:', 'Violation of community guidelines.')
                    if (r) handleAction(selectedUser.id, 'suspend', r)
                  }}>
                    Suspend Account
                  </button>
                ) : (
                  <button className="button button-secondary unsuspend-btn" onClick={() => handleAction(selectedUser.id, 'unsuspend')}>
                    Lift Suspension
                  </button>
                )}
                <button className="button button-primary delete-btn-card" onClick={() => {
                  if (confirm('CAUTION: Are you sure you want to permanently delete this user? This cannot be undone.')) {
                    handleAction(selectedUser.id, 'delete')
                  }
                }}>
                  Delete Account
                </button>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="button button-secondary" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-users {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .admin-header-main h1 { font-size: 2.25rem; font-weight: 850; margin: 0 0 0.5rem 0; color: #0f172a; }
        .admin-header-main p { font-size: 1.05rem; color: #64748b; margin: 0; }
        
        .filters-panel-card {
          display: flex;
          gap: 1rem;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          padding: 1rem;
          flex-wrap: wrap;
        }
        .filter-item { flex: 1; min-width: 150px; }
        .filter-item.search-field { flex: 2; }
        .filters-panel-card input, .filters-panel-card select {
          width: 100%;
          padding: 0.6rem 0.85rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.88rem;
          outline: none;
        }
        .filters-panel-card input:focus, .filters-panel-card select:focus { border-color: #ef4444; }
        
        .users-table-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        
        .empty-table-text { text-align: center; padding: 3rem 0; color: #94a3b8; }
        
        .admin-users-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-users-table th { padding: 0.85rem 1rem; border-bottom: 2px solid #f1f5f9; color: #475569; font-size: 0.85rem; text-transform: uppercase; font-weight: 800; }
        .admin-users-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; }
        .admin-users-table tr:last-child td { border: none; }
        .sub-user { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
        
        .role-badge { font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; text-transform: uppercase; }
        .role-badge.traveler { background: #e0f2fe; color: #0369a1; }
        .role-badge.service_provider { background: #f3e8ff; color: #6b21a8; }
        
        .status-pill { font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; text-transform: uppercase; }
        .status-pill.Active { background: #dcfce7; color: #166534; }
        .status-pill.Suspended { background: #fee2e2; color: #991b1b; }
        .status-pill.Deactivated { background: #f1f5f9; color: #475569; }
        
        .user-details-modal { max-width: 520px; width: 95%; }
        .user-profile-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin: 1rem 0; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.88rem; color: #475569; }
        
        .user-activities-tabs h4, .action-panel-triggers h4 { font-size: 0.9rem; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.35rem; margin: 1rem 0 0.75rem 0; color: #1e293b; }
        
        .metrics-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .metrics-row .metric { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem; text-align: center; }
        .metrics-row .metric span { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.15rem; }
        .metrics-row .metric strong { font-size: 1.15rem; color: #1e293b; font-weight: 800; }
        
        .action-buttons-flex { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .suspend-btn { background: #fffbeb !important; border-color: #fef3c7 !important; color: #b45309 !important; font-weight: 700; }
        .suspend-btn:hover { background: #fef3c7 !important; }
        .unsuspend-btn { background: #dcfce7 !important; border-color: #bbf7d0 !important; color: #15803d !important; font-weight: 700; }
        .unsuspend-btn:hover { background: #bbf7d0 !important; }
        .delete-btn-card { background: #fee2e2 !important; border-color: #fecaca !important; color: #991b1b !important; font-weight: 750; }
        .delete-btn-card:hover { background: #fecaca !important; }
      `}</style>
    </main>
  )
}
