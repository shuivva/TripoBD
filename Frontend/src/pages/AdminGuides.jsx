import { useEffect, useState } from 'react'
import { getAdminApplications, verifyGuide } from '../apiClient'

export default function AdminGuides() {
  const adminId = localStorage.getItem('userId')
  const [applications, setApplications] = useState([])
  const [activeDirectory, setActiveDirectory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('pending') // pending, verified
  
  // Split pane select
  const [selectedApp, setSelectedApp] = useState(null)
  
  // Checklist verification states
  const [checkNid, setCheckNid] = useState(false)
  const [checkDocs, setCheckDocs] = useState(false)
  const [checkBans, setCheckBans] = useState(false)
  
  // Zoom viewer state
  const [zoomUrl, setZoomUrl] = useState(null)

  const loadData = async () => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      if (activeTab === 'pending') {
        const list = await getAdminApplications(adminId, 'pending')
        setApplications(list)
        if (list.length > 0) {
          setSelectedApp(list[0])
          resetChecklist()
        } else {
          setSelectedApp(null)
        }
      } else {
        const list = await getAdminApplications(adminId, 'approved')
        setActiveDirectory(list)
        setSelectedApp(null)
      }
    } catch {
      setError('Failed to load application pipelines.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [adminId, activeTab])

  const resetChecklist = () => {
    setCheckNid(false)
    setCheckDocs(false)
    setCheckBans(false)
  }

  const handleVerify = async (spId, action) => {
    setMessage('')
    setError('')
    
    if (action === 'approve' && (!checkNid || !checkDocs || !checkBans)) {
      setError('Please verify all checklist items before approval.')
      return
    }
    
    let reason = ''
    if (action === 'reject') {
      reason = prompt('Reason for rejecting application:', 'Documents invalid or incomplete NID scan.')
      if (reason === null) return
    }
    
    try {
      await verifyGuide(adminId, { sp_id: spId, action, reason })
      setMessage(`Application successfully ${action}d!`)
      loadData()
    } catch {
      setError('Failed to process application verification.')
    }
  }

  if (loading && applications.length === 0 && activeDirectory.length === 0) {
    return <main className="page-shell"><p className="admin-status">Loading applications...</p></main>
  }

  return (
    <main className="page-shell admin-guides">
      {message && <div className="admin-alert success">{message}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      <header className="admin-header-main">
        <h1>Guides & Service Providers Verification</h1>
        <p>Review NID identification uploads, specialized certifications, portfolio photos, and assign verified badges.</p>
      </header>

      {/* Tabs */}
      <div className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          Application Queue ({applications.length})
        </button>
        <button className={`tab-btn ${activeTab === 'verified' ? 'active' : ''}`} onClick={() => setActiveTab('verified')}>
          Active Verified Directory ({activeDirectory.length})
        </button>
      </div>

      {activeTab === 'pending' ? (
        applications.length === 0 ? (
          <div className="panel-card empty-state">
            <p>No pending verification requests in queue. Service provider submissions are all clear!</p>
          </div>
        ) : (
          <div className="split-view-layout">
            {/* Left Queue List */}
            <div className="split-list-panel">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className={`app-item-card ${selectedApp?.id === app.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedApp(app)
                    resetChecklist()
                  }}
                >
                  <strong>{app.full_name}</strong>
                  <div className="app-meta">@{app.username} • Speciality: {app.service_type}</div>
                  <span className="app-date">Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>

            {/* Right Audit Details Panel */}
            <div className="split-detail-panel">
              {selectedApp && (
                <section className="panel-card-inner">
                  <div className="detail-header">
                    <div>
                      <h2>Audit Application: {selectedApp.full_name}</h2>
                      <p className="detail-role">@{selectedApp.username} • Years of Experience: {selectedApp.years_of_experience} yrs</p>
                    </div>
                    <span className="status-badge-pending">Pending Review</span>
                  </div>

                  <div className="audit-info-sections">
                    <p>🌐 **Languages Offered:** {selectedApp.languages_offered}</p>
                    <p>📍 **Specialized Destinations:** {selectedApp.specialized_destinations}</p>
                    <p>৳ **Pricing Ranges (fee):** {selectedApp.fee_range}</p>
                  </div>

                  {/* Documents Section */}
                  <div className="documents-viewer-panel">
                    <h4>📁 Submitted Credentials & Verification Scans</h4>
                    <div className="docs-flex">
                      <div className="doc-preview-box" onClick={() => setZoomUrl(selectedApp.nid_scan || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800')}>
                        <span>🪪 NID Identification Scan</span>
                        <div className="zoom-nudge">Click to View Zoom</div>
                      </div>
                      {selectedApp.certification && (
                        <div className="doc-preview-box" onClick={() => setZoomUrl(selectedApp.certification)}>
                          <span>📜 License / Certification Certificate</span>
                          <div className="zoom-nudge">Click to View Zoom</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Checklist Section */}
                  <div className="verification-checklist-panel">
                    <h4>✅ Admin Verification Checklist</h4>
                    <div className="checklist-options">
                      <label className="checkbox-row">
                        <input type="checkbox" checked={checkNid} onChange={e => setCheckNid(e.target.checked)} />
                        <span>National ID (NID) matches personal detail files and matches photos</span>
                      </label>
                      <label className="checkbox-row">
                        <input type="checkbox" checked={checkDocs} onChange={e => setCheckDocs(e.target.checked)} />
                        <span>Submitted certifications and service licenses are valid</span>
                      </label>
                      <label className="checkbox-row">
                        <input type="checkbox" checked={checkBans} onChange={e => setCheckBans(e.target.checked)} />
                        <span>Applicant has no history of previous account bans/reports</span>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="review-actions-flex">
                    <button className="button button-secondary" onClick={() => handleVerify(selectedApp.id, 'reject')}>
                      Reject Application
                    </button>
                    <button className="button button-primary" onClick={() => handleVerify(selectedApp.id, 'approve')}>
                      Approve & Grant Verified Badge
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        )
      ) : (
        /* Verified Directory */
        <section className="directory-panel-card">
          {activeDirectory.length === 0 ? (
            <p className="empty-state-text">No verified guides registered. Approve applications in the queue to build the directory.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-guides-table">
                <thead>
                  <tr>
                    <th>Provider Name</th>
                    <th>Speciality</th>
                    <th>Destinations</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDirectory.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <strong>{g.full_name}</strong>
                        <div className="sub-user">@{g.username}</div>
                      </td>
                      <td>{g.service_type === 'tour_guide' ? 'Tour Guide' : 'Service Operator'}</td>
                      <td>{g.specialized_destinations}</td>
                      <td>⭐ {g.rating || '5.0'}</td>
                      <td><span className="badge-verified">✓ Verified</span></td>
                      <td>
                        <button className="button button-secondary compact delete-btn" onClick={() => handleVerify(g.id, 'reject')}>
                          Revoke Verification
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Click Zoom Modal */}
      {zoomUrl && (
        <div className="crop-modal" onClick={() => setZoomUrl(null)}>
          <div className="crop-modal-content zoom-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Document Viewer</h3>
            <div className="zoomed-image-container">
              <img src={zoomUrl} alt="Document" className="zoomed-img" />
            </div>
            <button className="button button-primary" onClick={() => setZoomUrl(null)} style={{ marginTop: '1rem' }}>Close</button>
          </div>
        </div>
      )}

      <style>{`
        .admin-guides {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .admin-header-main h1 { font-size: 2.25rem; font-weight: 850; margin: 0 0 0.5rem 0; color: #0f172a; }
        .admin-header-main p { font-size: 1.05rem; color: #64748b; margin: 0; }
        
        .tabs-nav { display: flex; gap: 0.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
        
        .split-view-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
        }
        @media (max-width: 800px) {
          .split-view-layout { grid-template-columns: 1fr; }
        }
        .split-list-panel {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 600px;
          overflow-y: auto;
        }
        .app-item-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .app-item-card:hover { border-color: #cbd5e1; }
        .app-item-card.selected { background: #fee2e2; border-color: #fca5a5; }
        .app-item-card strong { display: block; font-size: 0.9rem; color: #1e293b; }
        .app-meta { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }
        .app-date { display: block; font-size: 0.7rem; color: #94a3b8; margin-top: 0.5rem; }
        
        .split-detail-panel { display: flex; flex-direction: column; }
        .panel-card-inner { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.01); }
        .detail-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1.25rem; }
        .detail-header h2 { margin: 0 0 0.25rem 0; font-size: 1.35rem; font-weight: 850; color: #0f172a; }
        .detail-role { margin: 0; font-size: 0.82rem; color: #64748b; }
        
        .status-badge-pending { font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; background: #fef3c7; color: #b45309; text-transform: uppercase; }
        
        .audit-info-sections { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.88rem; color: #475569; margin-bottom: 1.5rem; }
        
        .documents-viewer-panel h4, .verification-checklist-panel h4 { font-size: 0.9rem; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.35rem; margin: 0 0 0.85rem 0; color: #1e293b; }
        .docs-flex { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
        .doc-preview-box { flex: 1; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; text-align: center; padding: 0.5rem; transition: background 0.2s; }
        .doc-preview-box:hover { background: #faf5ff; }
        .doc-preview-box span { font-size: 0.82rem; font-weight: 750; color: #475569; }
        .zoom-nudge { font-size: 0.68rem; color: #a855f7; margin-top: 0.35rem; text-decoration: underline; }
        
        .checklist-options { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        
        .review-actions-flex { display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #f1f5f9; padding-top: 1.25rem; }
        
        .directory-panel-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.01); }
        .admin-guides-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-guides-table th { padding: 0.85rem 1rem; border-bottom: 2px solid #f1f5f9; color: #475569; font-size: 0.85rem; text-transform: uppercase; font-weight: 800; }
        .admin-guides-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; }
        .admin-guides-table tr:last-child td { border: none; }
        .badge-verified { font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; background: #dcfce7; color: #166534; }
        
        .zoom-modal-content { max-width: 600px; width: 95%; }
        .zoomed-image-container { max-height: 400px; overflow: auto; text-align: center; border: 1px solid #cbd5e1; border-radius: 12px; background: #fafafa; padding: 0.5rem; }
        .zoomed-img { max-width: 100%; max-height: 380px; object-fit: contain; }
        
        .delete-btn { background: #fee2e2 !important; border-color: #fecaca !important; color: #991b1b !important; }
        .delete-btn:hover { background: #fecaca !important; }
      `}</style>
    </main>
  )
}
