import { useEffect, useState } from 'react'
import { getAdminAnnouncements, sendAdminAnnouncement } from '../apiClient'

export default function AdminNotifications() {
  const adminId = localStorage.getItem('userId')
  const [announcements, setAnnouncements] = useState([])
  const [targetRole, setTargetRole] = useState('all')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [icon, setIcon] = useState('📢')
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const iconsList = ['📢', '⚠️', '🎉', '🌟', '⚙️', '💸', '🏖️', '🚨']

  useEffect(() => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }
    loadHistory()
  }, [adminId])

  const loadHistory = async () => {
    try {
      const data = await getAdminAnnouncements(adminId)
      setAnnouncements(data)
    } catch (err) {
      setError(err.message || 'Failed to load announcement history.')
    } finally {
      setLoading(false)
    }
  }

  const handleBroadcast = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    try {
      setError('')
      setSuccessMsg('')
      setSubmitLoading(true)
      await sendAdminAnnouncement(adminId, {
        target_role: targetRole,
        title: title || 'System Announcement',
        message: message,
        icon: icon
      })
      
      setSuccessMsg('Announcement broadcasted successfully to all target users.')
      setTitle('')
      setMessage('')
      setIcon('📢')
      
      // reload history
      await loadHistory()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to broadcast announcement.')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return <main className="page-shell"><p className="admin-status">Loading announcements panel...</p></main>
  }

  return (
    <main className="page-shell admin-notifications">
      <header className="admin-header">
        <h1>📢 Global System Announcements</h1>
        <p>Compose and broadcast push notifications to Travelers, Guides, or all registered users instantly.</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="announcements-grid">
        {/* Composer Form */}
        <div className="composer-section">
          <div className="card-outer">
            <h2>Compose Broadcast Notification</h2>
            <form onSubmit={handleBroadcast}>
              <div className="form-row-split">
                <div className="form-group">
                  <label htmlFor="target-role">Target Audience</label>
                  <select
                    id="target-role"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="form-input"
                  >
                    <option value="all">Everyone (All Accounts)</option>
                    <option value="traveler">Travelers Only</option>
                    <option value="service_provider">Guides & Operators Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="icon-select">Notification Badge Icon</label>
                  <select
                    id="icon-select"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="form-input icon-picker"
                  >
                    {iconsList.map((ic, i) => (
                      <option key={i} value={ic}>{ic} {ic === '📢' ? '(Default)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="announcement-title">Message Title</label>
                <input
                  id="announcement-title"
                  type="text"
                  placeholder="e.g. Scheduled System Maintenance / New App Features Released"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="announcement-msg">Content Message</label>
                <textarea
                  id="announcement-msg"
                  rows={5}
                  placeholder="Type the full announcement content. This will show up directly in travelers' and guides' notifications feed centre."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-input"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="button button-primary btn-broadcast"
                disabled={submitLoading || !message.trim()}
              >
                {submitLoading ? 'Broadcasting...' : '⚡ Broadcast Now'}
              </button>
            </form>
          </div>
        </div>

        {/* History Logs */}
        <div className="history-section">
          <h2>Announcement Logs</h2>
          {announcements.length === 0 ? (
            <div className="empty-history-card">
              <p>No announcements broadcasted yet.</p>
            </div>
          ) : (
            <div className="announcements-history-list">
              {announcements.map((ann) => (
                <div key={ann.id} className="history-card-item">
                  <div className="card-item-header">
                    <span className="bullet-date">{new Date(ann.date).toLocaleDateString()} at {new Date(ann.date).toLocaleTimeString()}</span>
                    <span className="log-action-tag">Broadcasted</span>
                  </div>
                  <p className="log-text">{ann.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-notifications {
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

        .announcements-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .announcements-grid {
            grid-template-columns: 1fr;
          }
        }

        .composer-section h2, .history-section h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 1.25rem 0;
        }
        .card-outer {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 1.75rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.01);
        }

        .form-row-split {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .form-row-split .form-group {
          flex: 1;
          margin-bottom: 0;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          margin-bottom: 1.25rem;
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
          font-family: inherit;
          background: white;
        }
        .form-input:focus {
          border-color: #ef4444;
        }
        .icon-picker {
          font-size: 1.1rem;
        }

        .btn-broadcast {
          width: 100%;
          padding: 0.9rem;
          font-size: 0.95rem;
        }

        .empty-history-card {
          background: white;
          border: 1px dashed #cbd5e1;
          border-radius: 20px;
          padding: 3rem;
          text-align: center;
          color: #94a3b8;
        }
        .announcements-history-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 520px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        .history-card-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        }
        .card-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .bullet-date {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 700;
        }
        .log-action-tag {
          font-size: 0.65rem;
          font-weight: 850;
          color: #a855f7;
          background: #f3e8ff;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .log-text {
          margin: 0;
          font-size: 0.88rem;
          color: #334155;
          line-height: 1.45;
        }
      `}</style>
    </main>
  )
}
