import { useEffect, useState } from 'react'
import { getAdminRoutes, addEditAdminRoute, deleteAdminRoute } from '../apiClient'

const modes = ['Bus', 'Train', 'Launch', 'Air', 'Mixed']

export default function AdminRoutes() {
  const adminId = localStorage.getItem('userId')
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Route Form State
  const [form, setForm] = useState({
    from_location: '',
    to_location: '',
    mode: 'Bus',
    operator: '',
    fare: '',
    duration: '',
    departure: '',
    travel_class: '',
    tips: '',
  })
  const [editingRouteId, setEditingRouteId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const loadRoutes = async () => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const list = await getAdminRoutes(adminId)
      setRoutes(list)
    } catch {
      setError('Failed to load global routes directory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoutes()
  }, [adminId])

  const saveRoute = async (e) => {
    e.preventDefault()
    if (!form.from_location.trim() || !form.to_location.trim() || !form.operator.trim() || !form.fare) {
      alert('From, To, Operator, and Fare are required fields!')
      return
    }
    setMessage('')
    setError('')
    try {
      const method = editingRouteId ? 'PUT' : 'POST'
      // Prepare payload (convert fare to number)
      const payload = {
        from_location: form.from_location,
        to_location: form.to_location,
        mode: form.mode,
        operator: form.operator,
        fare: Number(form.fare),
        duration: form.duration || '',
        departure: form.departure || '',
        travel_class: form.travel_class || '',
        tips: form.tips || '',
      }
      await addEditAdminRoute(adminId, method, editingRouteId, payload)
      setMessage('Transport route saved successfully!')
      setForm({
        from_location: '',
        to_location: '',
        mode: 'Bus',
        operator: '',
        fare: '',
        duration: '',
        departure: '',
        travel_class: '',
        tips: '',
      })
      setEditingRouteId(null)
      setShowForm(false)
      loadRoutes()
    } catch {
      setError('Failed to save transport route record.')
    }
  }

  const startEdit = (route) => {
    setEditingRouteId(route.id)
    setForm({
      from_location: route.from_location,
      to_location: route.to_location,
      mode: route.mode || 'Bus',
      operator: route.operator || '',
      fare: route.fare || '',
      duration: route.duration || '',
      departure: route.departure || '',
      travel_class: route.travel_class || '',
      tips: route.tips || '',
    })
    setShowForm(true)
  }

  const deleteRoute = async (id) => {
    if (!confirm('Are you sure you want to delete this route from the global directory?')) return
    setMessage('')
    setError('')
    try {
      await deleteAdminRoute(adminId, id)
      setMessage('Transport route deleted successfully.')
      loadRoutes()
    } catch {
      setError('Failed to delete transport route.')
    }
  }

  if (loading && routes.length === 0) {
    return <main className="page-shell"><p className="admin-status">Loading routes directory...</p></main>
  }

  return (
    <main className="page-shell admin-routes">
      <header className="ar-header">
        <div>
          <span className="ar-eyebrow">✦ Routes Directory</span>
          <h1>Transport Route Manager</h1>
          <p>Configure transport routes, travel modes, estimated fares, schedules, and guidance tips.</p>
        </div>
        <button className="ar-add-btn" onClick={() => { setShowForm(!showForm); setEditingRouteId(null); }}>
          {showForm ? '✕ Close Form' : '＋ Add Route'}
        </button>
      </header>

      {message && <div className="admin-alert success">{message}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {showForm && (
        <section className="ar-form-box">
          <h2>{editingRouteId ? '✍️ Edit Transport Route' : '＋ Add New Transport Route'}</h2>
          <form onSubmit={saveRoute} className="ar-form">
            <div className="form-grid">
              <div className="ar-field">
                <label>From Location (District)</label>
                <input
                  type="text"
                  value={form.from_location}
                  onChange={(e) => setForm(prev => ({ ...prev, from_location: e.target.value }))}
                  className="ar-input"
                  placeholder="e.g. Dhaka"
                  required
                />
              </div>

              <div className="ar-field">
                <label>To Location (District)</label>
                <input
                  type="text"
                  value={form.to_location}
                  onChange={(e) => setForm(prev => ({ ...prev, to_location: e.target.value }))}
                  className="ar-input"
                  placeholder="e.g. Cox's Bazar"
                  required
                />
              </div>

              <div className="ar-field">
                <label>Transport Mode</label>
                <select
                  value={form.mode}
                  onChange={(e) => setForm(prev => ({ ...prev, mode: e.target.value }))}
                  className="ar-select"
                >
                  {modes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="ar-field">
                <label>Operator / Company Name</label>
                <input
                  type="text"
                  value={form.operator}
                  onChange={(e) => setForm(prev => ({ ...prev, operator: e.target.value }))}
                  className="ar-input"
                  placeholder="e.g. Green Line Paribahan"
                  required
                />
              </div>

              <div className="ar-field">
                <label>Estimated Fare (BDT)</label>
                <input
                  type="number"
                  value={form.fare}
                  onChange={(e) => setForm(prev => ({ ...prev, fare: e.target.value }))}
                  className="ar-input"
                  placeholder="e.g. 1200"
                  required
                />
              </div>

              <div className="ar-field">
                <label>Trip Duration (e.g. 10h)</label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => setForm(prev => ({ ...prev, duration: e.target.value }))}
                  className="ar-input"
                  placeholder="e.g. 10h or 45m"
                />
              </div>

              <div className="ar-field">
                <label>Departure Time (e.g. 22:00)</label>
                <input
                  type="text"
                  value={form.departure}
                  onChange={(e) => setForm(prev => ({ ...prev, departure: e.target.value }))}
                  className="ar-input"
                  placeholder="e.g. 21:30"
                />
              </div>

              <div className="ar-field">
                <label>Travel Class / Type</label>
                <input
                  type="text"
                  value={form.travel_class}
                  onChange={(e) => setForm(prev => ({ ...prev, travel_class: e.target.value }))}
                  className="ar-input"
                  placeholder="e.g. AC Business, Economy, Cabin"
                />
              </div>

              <div className="ar-field full-width">
                <label>Travel Advice / Tips</label>
                <textarea
                  value={form.tips}
                  onChange={(e) => setForm(prev => ({ ...prev, tips: e.target.value }))}
                  className="ar-textarea"
                  rows="3"
                  placeholder="Overnight tips, best seating side, terminal info..."
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="save-btn">Save Route</button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowForm(false)
                  setEditingRouteId(null)
                  setForm({
                    from_location: '',
                    to_location: '',
                    mode: 'Bus',
                    operator: '',
                    fare: '',
                    duration: '',
                    departure: '',
                    travel_class: '',
                    tips: '',
                  })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="ar-table-box">
        <h2>Global Routes Directory ({routes.length})</h2>
        <div className="ar-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Mode</th>
                <th>Operator</th>
                <th>Fare</th>
                <th>Duration</th>
                <th>Departure</th>
                <th>Class</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r, idx) => (
                <tr key={r.id ?? `route-${idx}`}>
                  <td><strong>{r.from_location}</strong></td>
                  <td><strong>{r.to_location}</strong></td>
                  <td><span className={`mode-badge ${(r.mode || '').toLowerCase()}`}>{r.mode}</span></td>
                  <td>{r.operator}</td>
                  <td>৳{(r.fare || 0).toLocaleString()}</td>
                  <td>{r.duration || 'N/A'}</td>
                  <td>{r.departure || 'N/A'}</td>
                  <td>{r.travel_class || 'N/A'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="edit-btn" onClick={() => startEdit(r)}>Edit</button>
                      <button className="delete-btn" onClick={() => deleteRoute(r.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .ar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1.5rem;
        }
        .ar-eyebrow {
          color: #10b981;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ar-header h1 {
          margin: 0.25rem 0 0;
          font-size: 2rem;
          color: #0f172a;
        }
        .ar-header p {
          margin: 0.25rem 0 0;
          color: #64748b;
          font-size: 0.95rem;
        }
        .ar-add-btn {
          background: #0f172a;
          color: #fff;
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 1.5rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ar-add-btn:hover {
          background: #1e293b;
        }

        .admin-alert {
          padding: 1rem 1.25rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .admin-alert.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        .admin-alert.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        /* Form styling */
        .ar-form-box {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
        }
        .ar-form-box h2 {
          margin: 0 0 1.5rem;
          font-size: 1.35rem;
          color: #0f172a;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .ar-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .ar-field label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }
        .ar-input, .ar-textarea, .ar-select {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.65rem 0.85rem;
          font-size: 0.95rem;
          font-family: inherit;
          color: #0f172a;
          background: #f8fafc;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .ar-input:focus, .ar-textarea:focus, .ar-select:focus {
          outline: none;
          border-color: #10b981;
          background: #fff;
        }
        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        .save-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 2rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .cancel-btn {
          background: #cbd5e1;
          color: #334155;
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* Table box styling */
        .ar-table-box {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
        }
        .ar-table-box h2 {
          margin: 0 0 1.5rem;
          font-size: 1.35rem;
          color: #0f172a;
        }
        .ar-table-wrap {
          overflow-x: auto;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th, .admin-table td {
          border-bottom: 1px solid #e2e8f0;
          padding: 1rem;
          text-align: left;
          font-size: 0.92rem;
        }
        .admin-table th {
          font-weight: 700;
          color: #475569;
          background: #f8fafc;
        }
        
        .mode-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          text-transform: uppercase;
        }
        .mode-badge.bus { background: #e0f2fe; color: #0369a1; }
        .mode-badge.train { background: #fef3c7; color: #b45309; }
        .mode-badge.launch { background: #dcfce7; color: #15803d; }
        .mode-badge.air { background: #f3e8ff; color: #6b21a8; }
        .mode-badge.mixed { background: #f1f5f9; color: #475569; }

        .table-actions {
          display: flex;
          gap: 0.5rem;
        }
        .table-actions button {
          background: #fff;
          border: 1px solid #cbd5e1;
          border-radius: 0.4rem;
          padding: 0.3rem 0.6rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .table-actions button:hover {
          background: #f1f5f9;
        }
        .table-actions button.delete-btn {
          color: #ef4444;
          border-color: #fee2e2;
          background: #fef2f2;
        }
        .table-actions button.delete-btn:hover {
          background: #fee2e2;
        }

        @media (max-width: 960px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .ar-table-box {
            padding: 1rem;
          }
        }
      `}</style>
    </main>
  )
}
