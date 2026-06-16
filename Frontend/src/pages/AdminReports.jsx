import { useState } from 'react'
import { getAdminUsers, getAdminDestinations } from '../apiClient'

export default function AdminReports() {
  const adminId = localStorage.getItem('userId')
  const [reportType, setReportType] = useState('users')
  const [exporting, setExporting] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const handleExport = async (e) => {
    e.preventDefault()
    if (!adminId) {
      setError('Please sign in as an administrator.')
      return
    }

    try {
      setError('')
      setMsg('')
      setExporting(true)

      let csvContent = ''
      let fileName = `TripoBD_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`

      if (reportType === 'users') {
        const users = await getAdminUsers(adminId)
        // headers
        csvContent += 'User ID,Username,Email,Full Name,User Type,Joined Date,Status\n'
        // rows
        users.forEach(u => {
          csvContent += `"${u.id}","${u.username}","${u.email}","${u.full_name || ''}","${u.user_type}","${u.date_joined}","${u.status}"\n`
        })
      } else if (reportType === 'destinations') {
        const dests = await getAdminDestinations(adminId)
        // headers
        csvContent += 'Slug,Destination Name,Region,Category,Weekly Views,Rating,Status\n'
        // rows
        dests.forEach(d => {
          csvContent += `"${d.slug}","${d.name}","${d.region || ''}","${d.category || ''}","${d.views}","${d.rating}","${d.status}"\n`
        })
      } else if (reportType === 'payouts') {
        // mock payout logs
        csvContent += 'Payout ID,Guide User,Amount,Method,Details,Date,Status\n'
        csvContent += '"101","guide_rahim","5500.00","bKash","01712345678","2026-06-12","completed"\n'
        csvContent += '"102","boat_rentals_sylhet","12000.00","bank_transfer","City Bank A/C 224455","2026-06-14","pending"\n'
        csvContent += '"103","kuakata_safari","8000.00","bKash","01998877665","2026-06-15","completed"\n'
      } else if (reportType === 'tickets') {
        csvContent += 'Ticket ID,Username,Subject,Category,Priority,Status,Created Date\n'
        csvContent += '"1","traveler1","Guide rafiq charged double","complaint","high","in_progress","2026-06-10"\n'
        csvContent += '"2","triptalker","Sundarbans tour group doubt","general","medium","open","2026-06-14"\n'
        csvContent += '"3","hassan_travels","Payment gateway failed on checkout","billing","high","closed","2026-06-15"\n'
      }

      // Create download trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setMsg(`Successfully compiled and exported report to ${fileName}.`)
      setTimeout(() => setMsg(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to export report CSV.')
    } finally {
      setExporting(false)
    }
  }

  // Usage Heatmap mock representation using coordinates/hours grid
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM']
  
  // mock intensity grid: rows = days, cols = hours
  const heatmapData = [
    [2, 1, 5, 8, 9, 7], // Sun
    [1, 2, 4, 6, 7, 5], // Mon
    [1, 1, 3, 5, 6, 6], // Tue
    [2, 2, 3, 5, 7, 6], // Wed
    [2, 1, 4, 6, 8, 8], // Thu
    [3, 2, 6, 8, 9, 9], // Fri
    [4, 3, 7, 9, 10, 10] // Sat
  ]

  const getColorClass = (val) => {
    if (val <= 2) return 'heat-low'
    if (val <= 5) return 'heat-medium'
    if (val <= 8) return 'heat-high'
    return 'heat-peak'
  }

  return (
    <main className="page-shell admin-reports">
      <header className="admin-header">
        <h1>📈 System Analytics & Reports</h1>
        <p>Export clean tabular logs for audit verification. Review real-time application load & traffic heatmap.</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="reports-layout">
        {/* Export Card */}
        <section className="export-card">
          <h2>Generate System Reports</h2>
          <p className="card-desc">Choose a data subset below to generate and compile a standard CSV export instantly.</p>

          <form onSubmit={handleExport}>
            <div className="form-group">
              <label htmlFor="report-subset">Data Category</label>
              <select
                id="report-subset"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-input"
              >
                <option value="users">Registered Users List</option>
                <option value="destinations">Active Destinations & Views</option>
                <option value="payouts">Payout Requests Audit Log</option>
                <option value="tickets">Support Desk Tickets Queue</option>
              </select>
            </div>

            <button
              type="submit"
              className="button button-primary btn-generate"
              disabled={exporting}
            >
              {exporting ? 'Compiling CSV...' : '📥 Export to CSV'}
            </button>
          </form>
        </section>

        {/* Heatmap Section */}
        <section className="heatmap-card">
          <h2>🌐 User Traffic Heatmap (Hourly Load Index)</h2>
          <p className="card-desc">Peak active group planning & traveler browsing times mapped across days of the week.</p>

          <div className="heatmap-container">
            <div className="heatmap-grid-outer">
              <div className="hours-row">
                <div className="spacer"></div>
                {hours.map((h, i) => (
                  <span key={i} className="hour-label">{h}</span>
                ))}
              </div>

              {days.map((day, dIdx) => (
                <div key={dIdx} className="day-heatmap-row">
                  <span className="day-label">{day}</span>
                  {heatmapData[dIdx].map((val, hIdx) => (
                    <div
                      key={hIdx}
                      className={`heatmap-cell ${getColorClass(val)}`}
                      title={`Activity index: ${val}/10`}
                    >
                      <span className="cell-val">{val}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="heatmap-legend">
              <span>Low Traffic</span>
              <div className="legend-gradient">
                <span className="legend-cell heat-low"></span>
                <span className="legend-cell heat-medium"></span>
                <span className="legend-cell heat-high"></span>
                <span className="legend-cell heat-peak"></span>
              </div>
              <span>Peak load</span>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .admin-reports {
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

        .reports-layout {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .reports-layout {
            grid-template-columns: 1fr;
          }
        }

        .export-card, .heatmap-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 1.75rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.01);
        }
        .export-card h2, .heatmap-card h2 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }
        .card-desc {
          font-size: 0.82rem;
          color: #64748b;
          margin: 0 0 1.5rem 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          margin-bottom: 1.5rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
        }
        .form-input {
          padding: 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          outline: none;
          font-size: 0.9rem;
          background: white;
          font-family: inherit;
        }
        .form-input:focus {
          border-color: #ef4444;
        }
        .btn-generate {
          width: 100%;
          padding: 0.85rem;
          font-size: 0.95rem;
        }

        /* Heatmap Grid */
        .heatmap-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .heatmap-grid-outer {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .hours-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .spacer {
          width: 60px;
        }
        .hour-label {
          flex: 1;
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          text-align: center;
        }
        .day-heatmap-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .day-label {
          width: 60px;
          font-size: 0.82rem;
          font-weight: 800;
          color: #475569;
        }
        .heatmap-cell {
          flex: 1;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s;
          cursor: pointer;
        }
        .heatmap-cell:hover {
          transform: scale(1.08);
          z-index: 2;
        }
        .cell-val {
          font-size: 0.72rem;
          font-weight: 900;
          color: white;
          opacity: 0.75;
        }

        /* Heat classes */
        .heat-low {
          background: #f1f5f9;
        }
        .heat-low .cell-val {
          color: #94a3b8;
        }
        .heat-medium {
          background: #fca5a5;
        }
        .heat-high {
          background: #f87171;
        }
        .heat-peak {
          background: #ef4444;
        }

        /* Heatmap Legend */
        .heatmap-legend {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 0.78rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
        }
        .legend-gradient {
          display: flex;
          gap: 0.25rem;
        }
        .legend-cell {
          width: 20px;
          height: 12px;
          border-radius: 3px;
        }
      `}</style>
    </main>
  )
}
