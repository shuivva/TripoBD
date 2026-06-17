import { useEffect, useState } from 'react'
import {
  getAdminFaqs,
  addEditAdminFaq,
  deleteAdminFaq,
  getAdminFaqCategories,
  addAdminFaqCategory,
  deleteAdminFaqCategory,
  getAdminTutorials,
  addEditAdminTutorial,
  deleteAdminTutorial,
} from '../apiClient'

export default function AdminFAQ() {
  const adminId = localStorage.getItem('userId')
  const [faqs, setFaqs] = useState([])
  const [categories, setCategories] = useState([])
  const [tutorials, setTutorials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('items') // items, categories, tutorials

  // FAQ Item Form State
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: '' })
  const [editingFaqId, setEditingFaqId] = useState(null)

  // Category Form State
  const [newCatName, setNewCatName] = useState('')

  // Video Form State
  const [videoForm, setVideoForm] = useState({ title: '', duration: '', thumbnail: '', description: '' })
  const [editingVideoId, setEditingVideoId] = useState(null)

  const loadAll = async () => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [fItems, fCats, fTuts] = await Promise.all([
        getAdminFaqs(adminId),
        getAdminFaqCategories(adminId),
        getAdminTutorials(adminId),
      ])
      setFaqs(fItems)
      setCategories(fCats)
      setTutorials(fTuts)
      if (fCats.length > 0 && !faqForm.category) {
        setFaqForm(prev => ({ ...prev, category: fCats[0].name }))
      }
    } catch (err) {
      setError('Failed to load FAQ configuration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [adminId])

  // --- FAQ ITEMS CRUD ---
  const saveFaq = async (e) => {
    e.preventDefault()
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return
    setMessage('')
    setError('')
    try {
      const method = editingFaqId ? 'PUT' : 'POST'
      await addEditAdminFaq(adminId, method, editingFaqId, faqForm)
      setMessage('FAQ Item saved successfully!')
      setFaqForm({ question: '', answer: '', category: categories[0]?.name || '' })
      setEditingFaqId(null)
      loadAll()
    } catch (err) {
      setError('Failed to save FAQ Item.')
    }
  }

  const startEditFaq = (faq) => {
    setEditingFaqId(faq.id)
    const catName = typeof faq.category === 'object' && faq.category ? faq.category.name : faq.category
    setFaqForm({ question: faq.question, answer: faq.answer, category: catName })
  }

  const deleteFaq = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ item?')) return
    setMessage('')
    setError('')
    try {
      await deleteAdminFaq(adminId, id)
      setMessage('FAQ Item deleted successfully.')
      loadAll()
    } catch {
      setError('Failed to delete FAQ Item.')
    }
  }

  // --- CATEGORIES CRUD ---
  const saveCategory = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setMessage('')
    setError('')
    try {
      await addAdminFaqCategory(adminId, { name: newCatName })
      setMessage(`Category "${newCatName}" added.`)
      setNewCatName('')
      loadAll()
    } catch {
      setError('Failed to create FAQ Category.')
    }
  }

  const deleteCategory = async (id) => {
    if (!confirm('Deleting this category will unlink or remove associated FAQs. Proceed?')) return
    setMessage('')
    setError('')
    try {
      await deleteAdminFaqCategory(adminId, id)
      setMessage('FAQ Category deleted.')
      loadAll()
    } catch {
      setError('Failed to delete Category.')
    }
  }

  // --- VIDEO TUTORIALS CRUD ---
  const saveVideo = async (e) => {
    e.preventDefault()
    if (!videoForm.title.trim() || !videoForm.duration.trim()) return
    setMessage('')
    setError('')
    try {
      const method = editingVideoId ? 'PUT' : 'POST'
      await addEditAdminTutorial(adminId, method, editingVideoId, videoForm)
      setMessage('Video Tutorial saved successfully.')
      setVideoForm({ title: '', duration: '', thumbnail: '', description: '' })
      setEditingVideoId(null)
      loadAll()
    } catch {
      setError('Failed to save Video Tutorial.')
    }
  }

  const startEditVideo = (video) => {
    setEditingVideoId(video.id)
    setVideoForm({
      title: video.title,
      duration: video.duration,
      thumbnail: video.thumbnail || '',
      description: video.description || '',
    })
  }

  const deleteVideo = async (id) => {
    if (!confirm('Are you sure you want to delete this video tutorial?')) return
    setMessage('')
    setError('')
    try {
      await deleteAdminTutorial(adminId, id)
      setMessage('Video Tutorial deleted.')
      loadAll()
    } catch {
      setError('Failed to delete video tutorial.')
    }
  }

  if (loading && faqs.length === 0) {
    return <main className="page-shell"><p className="admin-status">Loading FAQ manager...</p></main>
  }

  return (
    <main className="page-shell admin-faq">
      <header className="af-header">
        <div>
          <span className="af-eyebrow">✦ Portal Control</span>
          <h1>FAQ &amp; Tutorial Manager</h1>
          <p>Create, modify, and delete questions, categories, and video resources for the Help Center.</p>
        </div>
      </header>

      {message && <div className="admin-alert success">{message}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      <div className="af-tabs">
        <button className={`af-tab-btn${activeTab === 'items' ? ' active' : ''}`} onClick={() => setActiveTab('items')}>
          ❓ FAQ Items
        </button>
        <button className={`af-tab-btn${activeTab === 'categories' ? ' active' : ''}`} onClick={() => setActiveTab('categories')}>
          📁 Categories
        </button>
        <button className={`af-tab-btn${activeTab === 'tutorials' ? ' active' : ''}`} onClick={() => setActiveTab('tutorials')}>
          🎬 Video Tutorials
        </button>
      </div>

      <div className="af-tab-content">
        {/* FAQ ITEMS */}
        {activeTab === 'items' && (
          <section className="af-pane">
            <div className="pane-layout">
              <div className="items-list">
                <h2>FAQ Directory</h2>
                <div className="list-grid">
                  {faqs.map(faq => {
                    const catName = typeof faq.category === 'object' && faq.category ? faq.category.name : faq.category
                    return (
                      <div key={faq.id} className="af-card">
                        <div className="card-header">
                          <span className="cat-badge">{catName}</span>
                          <div className="actions">
                            <button onClick={() => startEditFaq(faq)}>Edit</button>
                            <button onClick={() => deleteFaq(faq.id)} className="delete">Delete</button>
                          </div>
                        </div>
                        <h3>{faq.question}</h3>
                        <p>{faq.answer}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="form-box">
                <h2>{editingFaqId ? '✍️ Edit FAQ Item' : '＋ Add FAQ Item'}</h2>
                <form onSubmit={saveFaq} className="af-form">
                  <div className="af-field">
                    <label>Category</label>
                    <select
                      value={faqForm.category}
                      onChange={(e) => setFaqForm(prev => ({ ...prev, category: e.target.value }))}
                      className="af-select"
                    >
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="af-field">
                    <label>Question</label>
                    <input
                      type="text"
                      value={faqForm.question}
                      onChange={(e) => setFaqForm(prev => ({ ...prev, question: e.target.value }))}
                      className="af-input"
                      placeholder="e.g. Do I need a permit?"
                    />
                  </div>
                  <div className="af-field">
                    <label>Answer</label>
                    <textarea
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm(prev => ({ ...prev, answer: e.target.value }))}
                      className="af-textarea"
                      rows="6"
                      placeholder="e.g. Yes, foreigners require permit for..."
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn">Save FAQ</button>
                    {editingFaqId && (
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => {
                          setEditingFaqId(null)
                          setFaqForm({ question: '', answer: '', category: categories[0]?.name || '' })
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* FAQ CATEGORIES */}
        {activeTab === 'categories' && (
          <section className="af-pane">
            <div className="pane-layout col-2">
              <div className="items-list">
                <h2>FAQ Categories</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>
                          <button onClick={() => deleteCategory(c.id)} className="table-delete-btn">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-box">
                <h2>📁 Add Category</h2>
                <form onSubmit={saveCategory} className="af-form">
                  <div className="af-field">
                    <label>Category Name</label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="af-input"
                      placeholder="e.g. Safety Guide"
                    />
                  </div>
                  <button type="submit" className="save-btn">Add Category</button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* VIDEO TUTORIALS */}
        {activeTab === 'tutorials' && (
          <section className="af-pane">
            <div className="pane-layout">
              <div className="items-list">
                <h2>Video Tutorials Directory</h2>
                <div className="list-grid">
                  {tutorials.map(v => (
                    <div key={v.id} className="af-card tut-card">
                      <div className="tut-media" style={{ backgroundImage: `url(${v.thumbnail})` }}>
                        <span className="duration-tag">{v.duration}</span>
                      </div>
                      <div className="tut-body">
                        <h3>{v.title}</h3>
                        <p>{v.description}</p>
                        <div className="actions row">
                          <button onClick={() => startEditVideo(v)}>Edit</button>
                          <button onClick={() => deleteVideo(v.id)} className="delete">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-box">
                <h2>{editingVideoId ? '✍️ Edit Tutorial' : '＋ Add Video Tutorial'}</h2>
                <form onSubmit={saveVideo} className="af-form">
                  <div className="af-field">
                    <label>Title</label>
                    <input
                      type="text"
                      value={videoForm.title}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                      className="af-input"
                      placeholder="e.g. Getting Started"
                    />
                  </div>
                  <div className="af-field">
                    <label>Duration (e.g. 3:45)</label>
                    <input
                      type="text"
                      value={videoForm.duration}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="af-input"
                      placeholder="e.g. 5:20"
                    />
                  </div>
                  <div className="af-field">
                    <label>Thumbnail Image URL</label>
                    <input
                      type="text"
                      value={videoForm.thumbnail}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                      className="af-input"
                      placeholder="https://example.com/thumb.jpg"
                    />
                  </div>
                  <div className="af-field">
                    <label>Description</label>
                    <textarea
                      value={videoForm.description}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
                      className="af-textarea"
                      rows="4"
                      placeholder="Provide brief details on what this video covers..."
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn">Save Video</button>
                    {editingVideoId && (
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => {
                          setEditingVideoId(null)
                          setVideoForm({ title: '', duration: '', thumbnail: '', description: '' })
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .af-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1.5rem;
        }
        .af-eyebrow {
          color: #10b981;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .af-header h1 {
          margin: 0.25rem 0 0;
          font-size: 2rem;
          color: #0f172a;
        }
        .af-header p {
          margin: 0.25rem 0 0;
          color: #64748b;
          font-size: 0.95rem;
        }

        .af-tabs {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.75rem;
        }
        .af-tab-btn {
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
        .af-tab-btn.active {
          background: #10b981;
          color: #fff;
          border-color: #10b981;
        }

        .af-tab-content {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
        }

        .pane-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2.5rem;
          align-items: flex-start;
        }
        .pane-layout.col-2 {
          grid-template-columns: 1.2fr 1fr;
        }

        .items-list h2, .form-box h2 {
          margin: 0 0 1.25rem;
          font-size: 1.3rem;
          color: #0f172a;
        }

        .list-grid {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-height: 700px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .af-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.25rem;
        }
        .af-card h3 {
          margin: 0.75rem 0 0.5rem;
          font-size: 1.05rem;
          color: #0f172a;
        }
        .af-card p {
          margin: 0;
          color: #475569;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cat-badge {
          background: #e0f2fe;
          color: #0369a1;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }
        .actions button {
          background: #fff;
          border: 1px solid #cbd5e1;
          border-radius: 0.35rem;
          padding: 0.25rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .actions button:hover {
          background: #f1f5f9;
        }
        .actions button.delete {
          color: #ef4444;
          border-color: #fee2e2;
          background: #fef2f2;
        }
        .actions button.delete:hover {
          background: #fee2e2;
        }

        .form-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1.25rem;
          padding: 1.75rem;
          position: sticky;
          top: 2rem;
        }
        .af-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }
        .af-field label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }
        .af-input, .af-textarea, .af-select {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.65rem 0.85rem;
          font-size: 0.95rem;
          font-family: inherit;
          color: #0f172a;
          background: #fff;
          box-sizing: border-box;
        }
        .af-input:focus, .af-textarea:focus, .af-select:focus {
          outline: none;
          border-color: #10b981;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }
        .save-btn {
          flex: 1;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .cancel-btn {
          background: #cbd5e1;
          color: #334155;
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 1.25rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* Table formatting */
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th, .admin-table td {
          border-bottom: 1px solid #e2e8f0;
          padding: 0.9rem;
          text-align: left;
          font-size: 0.95rem;
        }
        .admin-table th {
          font-weight: 700;
          color: #475569;
          background: #f8fafc;
        }
        .table-delete-btn {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fee2e2;
          border-radius: 0.4rem;
          padding: 0.3rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }

        /* Video cards */
        .tut-card {
          display: flex;
          gap: 1.25rem;
          padding: 1rem;
        }
        .tut-media {
          width: 130px;
          height: 80px;
          border-radius: 0.5rem;
          background-size: cover;
          background-position: center;
          position: relative;
          flex-shrink: 0;
        }
        .duration-tag {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: rgba(0,0,0,0.8);
          color: #fff;
          padding: 1px 4px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 700;
        }
        .tut-body {
          flex: 1;
        }
        .tut-body h3 {
          margin: 0 0 0.25rem;
          font-size: 1rem;
        }
        .tut-body p {
          font-size: 0.82rem;
          margin-bottom: 0.5rem;
        }
        .actions.row {
          margin-top: 0.5rem;
        }

        @media (max-width: 960px) {
          .pane-layout {
            grid-template-columns: 1fr;
          }
          .form-box {
            position: static;
          }
        }
      `}</style>
    </main>
  )
}
