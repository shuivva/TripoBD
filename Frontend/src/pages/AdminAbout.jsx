import { useEffect, useState } from 'react'
import {
  getAdminAboutData,
  updateAdminAboutData,
  getAdminContactMessages,
  deleteAdminContactMessage,
} from '../apiClient'

export default function AdminAbout() {
  const adminId = localStorage.getItem('userId')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('mv') // mv, sections, messages

  // Mission & Vision State
  const [missionVision, setMissionVision] = useState({
    mission_title: '',
    mission_text: '',
    vision_title: '',
    vision_text: '',
  })

  // Features and Pain Points Lists
  const [features, setFeatures] = useState([])
  const [painPoints, setPainPoints] = useState([])

  // Contact Messages State
  const [contactMessages, setContactMessages] = useState([])

  // Temporary State for Adding items
  const [newFeature, setNewFeature] = useState({ icon: '🗺️', title: '', description: '' })
  const [newPainPoint, setNewPainPoint] = useState({ n: '', icon: '🗺️', title: '', description: '' })

  const loadData = async () => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [aboutData, messages] = await Promise.all([
        getAdminAboutData(adminId),
        getAdminContactMessages(adminId),
      ])
      if (aboutData.mission_vision) setMissionVision(aboutData.mission_vision)
      setFeatures(aboutData.features || [])
      setPainPoints(aboutData.pain_points || [])
      setContactMessages(messages || [])
    } catch (err) {
      setError('Failed to load About page manager data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [adminId])

  // --- SAVE DYNAMIC BLOCKS (Mission/Vision, Features, Pain Points) ---
  const saveConfigurations = async () => {
    setMessage('')
    setError('')
    try {
      await updateAdminAboutData(adminId, {
        mission_vision: missionVision,
        features,
        pain_points: painPoints,
      })
      setMessage('About page content configurations saved successfully!')
      loadData()
    } catch {
      setError('Failed to save about configuration.')
    }
  }

  // Feature actions
  const addFeature = () => {
    if (!newFeature.title.trim()) return
    setFeatures(prev => [...prev, newFeature])
    setNewFeature({ icon: '🗺️', title: '', description: '' })
  }

  const deleteFeature = (index) => {
    setFeatures(prev => prev.filter((_, i) => i !== index))
  }

  const updateFeatureField = (index, field, val) => {
    setFeatures(prev => prev.map((f, i) => i === index ? { ...f, [field]: val } : f))
  }

  // Pain Point actions
  const addPainPoint = () => {
    if (!newPainPoint.title.trim()) return
    const nextN = newPainPoint.n || String(painPoints.length + 1).padStart(2, '0')
    setPainPoints(prev => [...prev, { ...newPainPoint, n: nextN }])
    setNewPainPoint({ n: '', icon: '🗺️', title: '', description: '' })
  }

  const deletePainPoint = (index) => {
    setPainPoints(prev => prev.filter((_, i) => i !== index))
  }

  const updatePainPointField = (index, field, val) => {
    setPainPoints(prev => prev.map((p, i) => i === index ? { ...p, [field]: val } : p))
  }

  // Contact Message Action
  const deleteMessage = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this contact feedback?')) return
    setMessage('')
    setError('')
    try {
      await deleteAdminContactMessage(adminId, id)
      setMessage('Feedback message deleted.')
      loadData()
    } catch {
      setError('Failed to delete feedback message.')
    }
  }

  if (loading && contactMessages.length === 0 && features.length === 0) {
    return <main className="page-shell"><p className="admin-status">Loading About page manager...</p></main>
  }

  return (
    <main className="page-shell admin-about">
      <header className="aa-header">
        <div>
          <span className="aa-eyebrow">✦ Page Manager</span>
          <h1>About Page Manager</h1>
          <p>Modify Mission, Vision, core offers, traveler pain points, and review feedback submissions.</p>
        </div>
        <button className="aa-save-btn" onClick={saveConfigurations}>
          💾 Save Configurations
        </button>
      </header>

      {message && <div className="admin-alert success">{message}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      <div className="aa-tabs">
        <button className={`aa-tab-btn${activeTab === 'mv' ? ' active' : ''}`} onClick={() => setActiveTab('mv')}>
          🎯 Mission &amp; Vision
        </button>
        <button className={`aa-tab-btn${activeTab === 'sections' ? ' active' : ''}`} onClick={() => setActiveTab('sections')}>
          ⚙️ Offers &amp; Pain Points
        </button>
        <button className={`aa-tab-btn${activeTab === 'messages' ? ' active' : ''}`} onClick={() => setActiveTab('messages')}>
          ✉️ Feedback Inbox
        </button>
      </div>

      <div className="aa-tab-content">
        {/* MISSION & VISION */}
        {activeTab === 'mv' && (
          <section className="aa-pane">
            <h2>Mission &amp; Vision Sections</h2>
            <div className="aa-mv-form">
              <div className="form-column">
                <h3>Target Mission</h3>
                <div className="aa-field">
                  <label>Mission Title</label>
                  <input
                    type="text"
                    value={missionVision.mission_title}
                    onChange={(e) => setMissionVision(prev => ({ ...prev, mission_title: e.target.value }))}
                    className="aa-input"
                  />
                </div>
                <div className="aa-field">
                  <label>Mission Statement</label>
                  <textarea
                    value={missionVision.mission_text}
                    onChange={(e) => setMissionVision(prev => ({ ...prev, mission_text: e.target.value }))}
                    className="aa-textarea"
                    rows="6"
                  />
                </div>
              </div>

              <div className="form-column">
                <h3>Target Vision</h3>
                <div className="aa-field">
                  <label>Vision Title</label>
                  <input
                    type="text"
                    value={missionVision.vision_title}
                    onChange={(e) => setMissionVision(prev => ({ ...prev, vision_title: e.target.value }))}
                    className="aa-input"
                  />
                </div>
                <div className="aa-field">
                  <label>Vision Statement</label>
                  <textarea
                    value={missionVision.vision_text}
                    onChange={(e) => setMissionVision(prev => ({ ...prev, vision_text: e.target.value }))}
                    className="aa-textarea"
                    rows="6"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FEATURES & PAIN POINTS */}
        {activeTab === 'sections' && (
          <section className="aa-pane">
            <div className="sections-split">
              {/* Features List */}
              <div className="split-side">
                <h2>Configure Core Offers</h2>
                <div className="aa-config-list">
                  {features.map((f, i) => (
                    <div key={i} className="aa-item-card">
                      <div className="item-card-header">
                        <h4>Offer #{i + 1}</h4>
                        <button className="item-delete-btn" onClick={() => deleteFeature(i)}>Remove</button>
                      </div>
                      <div className="item-inputs">
                        <div className="field-row">
                          <div className="aa-field w-30">
                            <label>Icon Emoji</label>
                            <input
                              type="text"
                              value={f.icon}
                              onChange={(e) => updateFeatureField(i, 'icon', e.target.value)}
                              className="aa-input"
                            />
                          </div>
                          <div className="aa-field w-70">
                            <label>Offer Title</label>
                            <input
                              type="text"
                              value={f.title}
                              onChange={(e) => updateFeatureField(i, 'title', e.target.value)}
                              className="aa-input"
                            />
                          </div>
                        </div>
                        <div className="aa-field">
                          <label>Description</label>
                          <textarea
                            value={f.description || f.desc}
                            onChange={(e) => updateFeatureField(i, 'description', e.target.value)}
                            className="aa-textarea"
                            rows="2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="aa-add-box">
                  <h3>＋ Add New Offer</h3>
                  <div className="field-row">
                    <div className="aa-field w-30">
                      <label>Icon Emoji</label>
                      <input
                        type="text"
                        value={newFeature.icon}
                        onChange={(e) => setNewFeature(prev => ({ ...prev, icon: e.target.value }))}
                        className="aa-input"
                      />
                    </div>
                    <div className="aa-field w-70">
                      <label>Offer Title</label>
                      <input
                        type="text"
                        value={newFeature.title}
                        onChange={(e) => setNewFeature(prev => ({ ...prev, title: e.target.value }))}
                        className="aa-input"
                        placeholder="e.g. Flight Bookings"
                      />
                    </div>
                  </div>
                  <div className="aa-field">
                    <label>Description</label>
                    <textarea
                      value={newFeature.description}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                      className="aa-textarea"
                      rows="2"
                      placeholder="e.g. Compare domestic flight tariffs..."
                    />
                  </div>
                  <button className="aa-add-btn" onClick={addFeature}>Add Offer</button>
                </div>
              </div>

              {/* Pain Points List */}
              <div className="split-side">
                <h2>Configure Pain Points Solved</h2>
                <div className="aa-config-list">
                  {painPoints.map((p, i) => (
                    <div key={i} className="aa-item-card">
                      <div className="item-card-header">
                        <h4>Pain Point #{i + 1}</h4>
                        <button className="item-delete-btn" onClick={() => deletePainPoint(i)}>Remove</button>
                      </div>
                      <div className="item-inputs">
                        <div className="field-row">
                          <div className="aa-field w-20">
                            <label>No.</label>
                            <input
                              type="text"
                              value={p.n}
                              onChange={(e) => updatePainPointField(i, 'n', e.target.value)}
                              className="aa-input"
                            />
                          </div>
                          <div className="aa-field w-20">
                            <label>Icon</label>
                            <input
                              type="text"
                              value={p.icon}
                              onChange={(e) => updatePainPointField(i, 'icon', e.target.value)}
                              className="aa-input"
                            />
                          </div>
                          <div className="aa-field w-60">
                            <label>Headline</label>
                            <input
                              type="text"
                              value={p.title}
                              onChange={(e) => updatePainPointField(i, 'title', e.target.value)}
                              className="aa-input"
                            />
                          </div>
                        </div>
                        <div className="aa-field">
                          <label>Explanation</label>
                          <textarea
                            value={p.description || p.desc}
                            onChange={(e) => updatePainPointField(i, 'description', e.target.value)}
                            className="aa-textarea"
                            rows="2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="aa-add-box">
                  <h3>＋ Add Pain Point</h3>
                  <div className="field-row">
                    <div className="aa-field w-20">
                      <label>No.</label>
                      <input
                        type="text"
                        value={newPainPoint.n}
                        onChange={(e) => setNewPainPoint(prev => ({ ...prev, n: e.target.value }))}
                        className="aa-input"
                        placeholder="06"
                      />
                    </div>
                    <div className="aa-field w-20">
                      <label>Icon</label>
                      <input
                        type="text"
                        value={newPainPoint.icon}
                        onChange={(e) => setNewPainPoint(prev => ({ ...prev, icon: e.target.value }))}
                        className="aa-input"
                      />
                    </div>
                    <div className="aa-field w-60">
                      <label>Headline</label>
                      <input
                        type="text"
                        value={newPainPoint.title}
                        onChange={(e) => setNewPainPoint(prev => ({ ...prev, title: e.target.value }))}
                        className="aa-input"
                        placeholder="e.g. Bad Weather"
                      />
                    </div>
                  </div>
                  <div className="aa-field">
                    <label>Explanation</label>
                    <textarea
                      value={newPainPoint.description}
                      onChange={(e) => setNewPainPoint(prev => ({ ...prev, description: e.target.value }))}
                      className="aa-textarea"
                      rows="2"
                      placeholder="e.g. Unpredictable monsoon patterns..."
                    />
                  </div>
                  <button className="aa-add-btn" onClick={addPainPoint}>Add Pain Point</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FEEDBACK INBOX */}
        {activeTab === 'messages' && (
          <section className="aa-pane">
            <h2>Traveler Contact Feedback messages ({contactMessages.length})</h2>
            <div className="aa-messages-grid">
              {contactMessages.map(msg => (
                <div key={msg.id} className="aa-msg-card">
                  <div className="msg-header">
                    <div>
                      <strong>{msg.name}</strong>
                      <span className="email">{msg.email}</span>
                    </div>
                    <button className="msg-delete-btn" onClick={() => deleteMessage(msg.id)}>
                      Delete
                    </button>
                  </div>
                  <p className="msg-body">{msg.message}</p>
                  <span className="msg-date">
                    Sent: {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
              {contactMessages.length === 0 && (
                <div className="aa-empty-messages">
                  <span>✉️</span>
                  <p>No contact feedback messages in inbox.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .aa-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .aa-eyebrow {
          color: #10b981;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .aa-header h1 {
          margin: 0.25rem 0 0;
          font-size: 2rem;
          color: #0f172a;
        }
        .aa-header p {
          margin: 0.25rem 0 0;
          color: #64748b;
          font-size: 0.95rem;
        }
        .aa-save-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 1.5rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        .aa-save-btn:hover {
          opacity: 0.95;
          transform: translateY(-2px);
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

        .aa-tabs {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.75rem;
        }
        .aa-tab-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.65rem 1.25rem;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .aa-tab-btn.active {
          background: #10b981;
          color: #fff;
          border-color: #10b981;
        }

        .aa-tab-content {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
        }

        .aa-mv-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
        }
        .form-column h3 {
          margin: 0 0 1.25rem;
          font-size: 1.1rem;
          color: #0f172a;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.5rem;
        }

        .aa-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }
        .aa-field label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }
        .aa-input, .aa-textarea {
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
        .aa-input:focus, .aa-textarea:focus {
          outline: none;
          border-color: #10b981;
          background: #fff;
        }

        .sections-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
        }
        .split-side h2 {
          margin: 0 0 1.25rem;
          font-size: 1.2rem;
          color: #0f172a;
        }

        .aa-config-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-height: 520px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .aa-item-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.25rem;
        }
        .item-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }
        .item-card-header h4 {
          margin: 0;
          font-size: 0.95rem;
        }
        .item-delete-btn {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fee2e2;
          border-radius: 0.4rem;
          padding: 0.25rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .field-row {
          display: flex;
          gap: 0.75rem;
        }
        .w-20 { width: 20%; }
        .w-30 { width: 30%; }
        .w-60 { width: 60%; }
        .w-70 { width: 70%; }

        .aa-add-box {
          margin-top: 1.5rem;
          background: #fff;
          border: 2px dashed #cbd5e1;
          border-radius: 1rem;
          padding: 1.5rem;
        }
        .aa-add-box h3 {
          margin: 0 0 1rem;
          font-size: 1rem;
          color: #0f172a;
        }
        .aa-add-btn {
          background: #0f172a;
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          padding: 0.55rem 1.25rem;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          margin-top: 0.5rem;
        }

        /* Messages Grid */
        .aa-messages-grid {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .aa-msg-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1.25rem;
          padding: 1.5rem;
        }
        .msg-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        .msg-header strong {
          display: block;
          font-size: 1.05rem;
          color: #0f172a;
        }
        .msg-header .email {
          font-size: 0.85rem;
          color: #64748b;
        }
        .msg-delete-btn {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fee2e2;
          border-radius: 0.5rem;
          padding: 0.4rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .msg-body {
          margin: 0 0 0.75rem;
          color: #334155;
          font-size: 0.95rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .msg-date {
          font-size: 0.78rem;
          color: #94a3b8;
        }

        .aa-empty-messages {
          text-align: center;
          padding: 4rem 2rem;
          background: #f8fafc;
          border-radius: 1rem;
          border: 1.5px dashed #cbd5e1;
        }
        .aa-empty-messages span {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        @media (max-width: 1024px) {
          .aa-mv-form, .sections-split {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </main>
  )
}
