import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFlaggedContent, moderateContent, getAdminSystemConfig, updateAdminSystemConfig } from '../apiClient'

export default function AdminModeration() {
  const navigate = useNavigate()
  const adminId = localStorage.getItem('userId')
  const [flaggedItems, setFlaggedItems] = useState([])
  const [autoModKeywords, setAutoModKeywords] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        const [content, config] = await Promise.all([
          getFlaggedContent(adminId),
          getAdminSystemConfig(adminId)
        ])
        setFlaggedItems(content)
        if (config && config.auto_mod) {
          setAutoModKeywords(config.auto_mod.keywords || '')
        } else {
          setAutoModKeywords('illegal, drug, weapon, hack, spam, scam')
        }
      } catch (err) {
        setError(err.message || 'Failed to load moderation data.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [adminId])

  const handleAction = async (contentId, contentType, action) => {
    try {
      setError('')
      setSuccessMsg('')
      await moderateContent(adminId, {
        content_id: contentId,
        content_type: contentType,
        action: action
      })
      
      // Update local state by removing/modifying item
      setFlaggedItems(prev => prev.filter(item => !(item.id === contentId && item.type === contentType)))
      setSuccessMsg(`Action "${action}" applied successfully to the ${contentType}.`)
      
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to perform moderation action.')
    }
  }

  const handleSaveAutoMod = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccessMsg('')
      setSaveLoading(true)
      await updateAdminSystemConfig(adminId, {
        key: 'auto_mod',
        value: { keywords: autoModKeywords }
      })
      setSuccessMsg('Auto-moderation keywords updated successfully.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save auto-moderation settings.')
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return <main className="page-shell"><p className="admin-status">Loading moderation queues...</p></main>
  }

  return (
    <main className="page-shell admin-moderation">
      <header className="admin-header">
        <h1>🛡️ Content Moderation & Safety</h1>
        <p>Review reports of unsafe, abusive, or policy-violating content. Manage auto-moderation keyword filters.</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="moderation-grid-layout">
        {/* Left column: Flagged Content Queue */}
        <div className="queue-section">
          <div className="section-title-row">
            <h2>Reported Posts & Reviews ({flaggedItems.length})</h2>
          </div>

          {flaggedItems.length === 0 ? (
            <div className="empty-state-card">
              <span className="empty-icon">✅</span>
              <h3>No Flagged Content</h3>
              <p>Everything is clean! All traveler posts and guide reviews are currently active without reports.</p>
            </div>
          ) : (
            <div className="flagged-cards-list">
              {flaggedItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flagged-card">
                  <div className="flagged-header">
                    <span className={`type-badge ${item.type}`}>{item.type}</span>
                    <span className="reports-count">⚠️ Reported {item.reports} times</span>
                  </div>
                  
                  <div className="flagged-body">
                    <h3>{item.title}</h3>
                    <p className="author-tag">Posted by <strong>@{item.author}</strong></p>
                    <div className="reason-box">
                      <strong>Reason for report:</strong> {item.reason}
                    </div>
                    <div className="content-preview">
                      "{item.content}"
                    </div>
                  </div>

                  <div className="flagged-footer">
                    <button 
                      className="button button-secondary btn-approve"
                      onClick={() => handleAction(item.id, item.type, 'approve')}
                    >
                      Keep Content
                    </button>
                    <button 
                      className="button button-danger btn-remove"
                      onClick={() => handleAction(item.id, item.type, 'remove')}
                    >
                      Remove Content
                    </button>
                    <button 
                      className="button button-tertiary btn-suspend"
                      onClick={() => handleAction(item.id, item.type, 'suspend_author')}
                    >
                      Suspend Author
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Auto-Moderation settings */}
        <div className="settings-section">
          <div className="settings-card">
            <h2>⚙️ Auto-Moderation Filter</h2>
            <p className="card-desc">
              Define comma-separated blocklist keywords. Posts containing these will be automatically flagged for review.
            </p>

            <form onSubmit={handleSaveAutoMod}>
              <div className="form-group">
                <label htmlFor="keywords-input">Blocked Keywords</label>
                <textarea
                  id="keywords-input"
                  rows={6}
                  value={autoModKeywords}
                  onChange={(e) => setAutoModKeywords(e.target.value)}
                  placeholder="e.g. drug, hack, spam..."
                  className="form-input"
                ></textarea>
                <span className="help-text">Separate each keyword/phrase with a comma. Case-insensitive.</span>
              </div>

              <button 
                type="submit" 
                className="button button-primary btn-save" 
                disabled={saveLoading}
              >
                {saveLoading ? 'Saving rules...' : 'Save Blocklist Rules'}
              </button>
            </form>
          </div>

          <div className="info-policy-card">
            <h3>🛡️ Community Guidelines Policy</h3>
            <ul>
              <li><strong>Zero Tolerance:</strong> Immediate account suspension for hate speech, harassment, or promotion of illegal activities.</li>
              <li><strong>Scams & Spam:</strong> Reviews referencing external money transfers, cash deals outside TripoBD platforms are auto-flagged.</li>
              <li><strong>User Appeal:</strong> Suspended users receive an email with instructions to appeal through official support.</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .admin-moderation {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .admin-header {
          margin-bottom: 2rem;
        }
        .admin-header h1 {
          font-size: 2.25rem;
          font-weight: 850;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }
        .admin-header p {
          color: #64748b;
          margin: 0;
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

        .moderation-grid-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .moderation-grid-layout {
            grid-template-columns: 1fr;
          }
        }

        .queue-section h2, .settings-section h2 {
          font-size: 1.3rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 1.25rem 0;
        }

        .empty-state-card {
          background: white;
          border: 1px dashed #cbd5e1;
          border-radius: 20px;
          padding: 3rem;
          text-align: center;
        }
        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }
        .empty-state-card h3 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }
        .empty-state-card p {
          color: #64748b;
          margin: 0;
        }

        .flagged-cards-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .flagged-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.01);
        }
        .flagged-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .type-badge {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }
        .type-badge.story {
          background: #fef3c7;
          color: #b45309;
        }
        .type-badge.review {
          background: #e0f2fe;
          color: #0369a1;
        }
        .reports-count {
          font-size: 0.8rem;
          font-weight: 700;
          color: #dc2626;
        }
        .flagged-body h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }
        .author-tag {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0 0 1rem 0;
        }
        .reason-box {
          background: #fff5f5;
          border-left: 3.5px solid #ef4444;
          padding: 0.65rem 0.85rem;
          font-size: 0.88rem;
          color: #991b1b;
          margin-bottom: 1rem;
          border-radius: 0 8px 8px 0;
        }
        .content-preview {
          font-style: italic;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.92rem;
          color: #334155;
          line-height: 1.5;
        }
        .flagged-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.25rem;
          border-top: 1px solid #f1f5f9;
          padding-top: 1rem;
        }
        .btn-approve {
          background: #10b981;
          color: white;
        }
        .btn-approve:hover {
          background: #059669;
        }
        .btn-remove {
          background: #ef4444;
          color: white;
        }
        .btn-remove:hover {
          background: #dc2626;
        }
        .btn-suspend {
          background: #f1f5f9;
          color: #334155;
        }
        .btn-suspend:hover {
          background: #cbd5e1;
        }

        .settings-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.01);
          margin-bottom: 1.5rem;
        }
        .card-desc {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0 0 1.25rem 0;
        }
        .form-group {
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.88rem;
          font-weight: 750;
          color: #334155;
        }
        .form-input {
          padding: 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: #ef4444;
        }
        .help-text {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .btn-save {
          width: 100%;
        }

        .info-policy-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
        }
        .info-policy-card h3 {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.75rem 0;
        }
        .info-policy-card ul {
          margin: 0;
          padding-left: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .info-policy-card li {
          font-size: 0.82rem;
          color: #475569;
          line-height: 1.4;
        }
      `}</style>
    </main>
  )
}
