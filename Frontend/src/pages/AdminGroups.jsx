import { useEffect, useState } from 'react'
import { getAdminActiveGroups, dissolveGroup } from '../apiClient'

export default function AdminGroups() {
  const adminId = localStorage.getItem('userId')
  const [rooms, setRooms] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  
  // Dissolve modal confirmation
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }

    const loadRooms = async () => {
      try {
        const data = await getAdminActiveGroups(adminId)
        setRooms(data)
      } catch (err) {
        setError(err.message || 'Failed to load tour rooms.')
      } finally {
        setLoading(false)
      }
    }
    loadRooms()
  }, [adminId])

  const handleDissolveClick = (room) => {
    setSelectedRoom(room)
    setConfirmOpen(true)
  }

  const handleConfirmDissolve = async () => {
    if (!selectedRoom) return
    try {
      setError('')
      setActionMsg('')
      await dissolveGroup(adminId, selectedRoom.id)
      
      // Update local state
      setRooms(prev => 
        prev.map(r => r.id === selectedRoom.id ? { ...r, status: 'Archived' } : r)
      )
      setActionMsg(`Tour Room "${selectedRoom.name}" was successfully dissolved/archived.`)
      setTimeout(() => setActionMsg(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to dissolve tour room.')
    } finally {
      setConfirmOpen(false)
      setSelectedRoom(null)
    }
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(search.toLowerCase()) ||
                          room.destination.toLowerCase().includes(search.toLowerCase()) ||
                          room.organiser.toLowerCase().includes(search.toLowerCase())
    
    if (statusFilter === 'All') return matchesSearch
    return matchesSearch && room.status === statusFilter
  })

  if (loading) {
    return <main className="page-shell"><p className="admin-status">Loading active group planners...</p></main>
  }

  return (
    <main className="page-shell admin-groups">
      <header className="admin-header">
        <h1>👥 Tour Group Planner Monitor</h1>
        <p>Monitor active shared itineraries, budget plans, and collaborative rooms. Dissolve policy-violating planners.</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}
      {actionMsg && <div className="alert alert-success">{actionMsg}</div>}

      {/* Filter panel */}
      <section className="filter-controls-card">
        <div className="search-box">
          <label htmlFor="group-search">Search Planner</label>
          <input
            id="group-search"
            type="text"
            placeholder="Search by name, destination, organizer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-dropdown">
          <label htmlFor="status-select">Status</label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Groups</option>
            <option value="Active">Active Planners</option>
            <option value="Archived">Archived Planners</option>
          </select>
        </div>
      </section>

      {/* Grid of rooms */}
      {filteredRooms.length === 0 ? (
        <div className="no-results-card">
          <h3>No Groups Found</h3>
          <p>Try modifying your search query or filters.</p>
        </div>
      ) : (
        <div className="rooms-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Planner Room Name</th>
                <th>Target Destination</th>
                <th>Organizer</th>
                <th>Members Count</th>
                <th>Travel Dates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room) => (
                <tr key={room.id} className={room.status === 'Archived' ? 'archived-row' : ''}>
                  <td>
                    <div className="room-title-cell">
                      <strong>{room.name}</strong>
                      <span className="room-id-tag">ID: {room.id}</span>
                    </div>
                  </td>
                  <td>📍 {room.destination}</td>
                  <td>@{room.organiser}</td>
                  <td>
                    <span className="member-count-badge">👤 {room.members}</span>
                  </td>
                  <td>
                    <div className="date-cell">
                      {room.start_date || 'N/A'} ➔ {room.end_date || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${room.status.toLowerCase()}`}>
                      {room.status}
                    </span>
                  </td>
                  <td>
                    {room.status === 'Active' ? (
                      <button
                        className="button button-danger btn-table-action"
                        onClick={() => handleDissolveClick(room)}
                      >
                        Dissolve
                      </button>
                    ) : (
                      <span className="disabled-action-txt">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h3>⚠️ Dissolve Tour Group Room</h3>
            <p>
              Are you sure you want to dissolve <strong>{selectedRoom?.name}</strong>?
              This will archive the room and prevent participants from accessing the shared calendar, ledger, and chat messages. This action is irreversible.
            </p>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className="button button-danger" onClick={handleConfirmDissolve}>
                Confirm Dissolve
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-groups {
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
        .alert-success {
          background: #dcfce7;
          color: #166534;
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

        .rooms-table-card {
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
          font-size: 0.9rem;
          color: #0f172a;
        }
        .archived-row {
          background: #f8fafc;
        }
        .archived-row td {
          color: #94a3b8;
        }

        .room-title-cell {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .room-id-tag {
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 600;
        }
        .member-count-badge {
          background: #f1f5f9;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 750;
        }
        .date-cell {
          font-size: 0.82rem;
          font-weight: 650;
        }

        .status-pill {
          font-size: 0.75rem;
          font-weight: 850;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .status-pill.active {
          background: #dcfce7;
          color: #15803d;
        }
        .status-pill.archived {
          background: #cbd5e1;
          color: #475569;
        }

        .btn-table-action {
          padding: 0.4rem 0.8rem;
          font-size: 0.8rem;
        }
        .disabled-action-txt {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-window {
          background: white;
          width: 90%;
          max-width: 460px;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .modal-window h3 {
          font-size: 1.25rem;
          color: #ef4444;
          margin: 0 0 1rem 0;
          font-weight: 850;
        }
        .modal-window p {
          color: #475569;
          font-size: 0.92rem;
          line-height: 1.5;
          margin: 0 0 1.5rem 0;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
      `}</style>
    </main>
  )
}
