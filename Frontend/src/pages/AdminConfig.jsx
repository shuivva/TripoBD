import { useEffect, useState } from 'react'
import { getAdminSystemConfig, updateAdminSystemConfig } from '../apiClient'

export default function AdminConfig() {
  const adminId = localStorage.getItem('userId')
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Configurations states
  const [generalConfig, setGeneralConfig] = useState({
    app_name: 'TripoBD',
    maintenance_mode: false,
    support_email: 'support@tripobd.com'
  })

  const [aiConfig, setAiConfig] = useState({
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    response_tone: 'helpful_friendly'
  })

  const [homepageSlides, setHomepageSlides] = useState([
    { title: 'Explore Beautiful Bangladesh', subtitle: 'Find local tour operators & verify credentials instantly', image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7' },
    { title: 'AI Guided Itineraries', subtitle: 'Let our smart assistant build your dream budget plan in seconds', image: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff' }
  ])

  useEffect(() => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }

    const loadConfig = async () => {
      try {
        const configs = await getAdminSystemConfig(adminId)
        if (configs) {
          if (configs.general) setGeneralConfig(prev => ({ ...prev, ...configs.general }))
          if (configs.ai_assistant) setAiConfig(prev => ({ ...prev, ...configs.ai_assistant }))
          if (configs.homepage_slides) setHomepageSlides(configs.homepage_slides)
        }
      } catch (err) {
        setError(err.message || 'Failed to load system configurations.')
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [adminId])

  const handleSaveGroup = async (key, value) => {
    try {
      setError('')
      setSuccessMsg('')
      setSaveLoading(true)
      await updateAdminSystemConfig(adminId, {
        key: key,
        value: value
      })
      setSuccessMsg(`System parameter "${key}" saved successfully.`)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to save system config.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleSlideChange = (index, field, value) => {
    const updated = [...homepageSlides]
    updated[index][field] = value
    setHomepageSlides(updated)
  }

  if (loading) {
    return <main className="page-shell"><p className="admin-status">Loading system configurations...</p></main>
  }

  return (
    <main className="page-shell admin-config">
      <header className="admin-header">
        <h1>⚙️ System Configurations</h1>
        <p>Adjust core app settings, AI recommendation engine temperatures, and homepage hero banner slides.</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="config-layouts-grid">
        {/* Left Column: General & AI Config */}
        <div className="config-column">
          {/* General Config Card */}
          <section className="config-card">
            <h2>General Parameters</h2>
            <p className="card-desc">Adjust the global branding name, support address, and server flags.</p>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveGroup('general', generalConfig) }}>
              <div className="form-group">
                <label htmlFor="app-name">Branding App Name</label>
                <input
                  id="app-name"
                  type="text"
                  value={generalConfig.app_name}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, app_name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="support-email">Official Support Email</label>
                <input
                  id="support-email"
                  type="email"
                  value={generalConfig.support_email}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, support_email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group row-align-checkbox">
                <input
                  id="maint-mode"
                  type="checkbox"
                  checked={generalConfig.maintenance_mode}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, maintenance_mode: e.target.checked })}
                  className="checkbox-input"
                />
                <label htmlFor="maint-mode" className="checkbox-lbl">
                  <strong>Enable Maintenance Mode</strong>
                  <span className="lbl-desc">Temporarily lock traveler and guide portal modifications.</span>
                </label>
              </div>

              <button type="submit" className="button button-primary" disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save General Config'}
              </button>
            </form>
          </section>

          {/* AI Settings Card */}
          <section className="config-card" style={{ marginTop: '2rem' }}>
            <h2>AI Assistant Engine</h2>
            <p className="card-desc">Tweak the large language model parameters for automated travel advice & itineraries.</p>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveGroup('ai_assistant', aiConfig) }}>
              <div className="form-group">
                <label htmlFor="ai-model">AI Model Version</label>
                <select
                  id="ai-model"
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                  className="form-input"
                >
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast/Light)</option>
                  <option value="gpt-4o">GPT-4o (Standard)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ai-tone">Response Tone Accent</label>
                <select
                  id="ai-tone"
                  value={aiConfig.response_tone}
                  onChange={(e) => setAiConfig({ ...aiConfig, response_tone: e.target.value })}
                  className="form-input"
                >
                  <option value="helpful_friendly">Helpful & Friendly (Default)</option>
                  <option value="formal_detailed">Formal & Highly Detailed</option>
                  <option value="adventurous_brief">Adventurous & Brief</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ai-temp">Creativity Temperature ({aiConfig.temperature})</label>
                <input
                  id="ai-temp"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={aiConfig.temperature || 0.7}
                  onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                  className="range-slider"
                />
                <span className="help-text">Higher values produce more creative recommendations; lower values produce rigid factual paths.</span>
              </div>

              <button type="submit" className="button button-primary" disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save AI Config'}
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Homepage Slide Banners list */}
        <div className="config-column">
          <section className="config-card slides-config">
            <h2>Homepage Slideshow Content</h2>
            <p className="card-desc">Update the text and background images on the public greeting landing carousel.</p>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveGroup('homepage_slides', homepageSlides) }}>
              {homepageSlides.map((slide, idx) => (
                <div key={idx} className="slide-editor-block">
                  <div className="slide-block-title">
                    <h4>Slide #{idx + 1}</h4>
                  </div>
                  <div className="form-group">
                    <label>Main Headline</label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => handleSlideChange(idx, 'title', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Sub-Headline Description</label>
                    <input
                      type="text"
                      value={slide.subtitle}
                      onChange={(e) => handleSlideChange(idx, 'subtitle', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Background Image URL</label>
                    <input
                      type="text"
                      value={slide.image}
                      onChange={(e) => handleSlideChange(idx, 'image', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              ))}

              <button type="submit" className="button button-primary" disabled={saveLoading} style={{ width: '100%', marginTop: '1rem' }}>
                {saveLoading ? 'Saving banner slides...' : 'Update Landing Slides'}
              </button>
            </form>
          </section>
        </div>
      </div>

      <style>{`
        .admin-config {
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

        .config-layouts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .config-layouts-grid {
            grid-template-columns: 1fr;
          }
        }

        .config-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 1.75rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.01);
        }
        .config-card h2 {
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
          background: white;
          font-family: inherit;
        }
        .form-input:focus {
          border-color: #ef4444;
        }

        .row-align-checkbox {
          flex-direction: row;
          align-items: flex-start;
          gap: 0.75rem;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .checkbox-input {
          width: 18px;
          height: 18px;
          margin-top: 0.15rem;
          cursor: pointer;
        }
        .checkbox-lbl {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          cursor: pointer;
        }
        .checkbox-lbl strong {
          font-size: 0.88rem;
          color: #1e293b;
        }
        .lbl-desc {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          text-transform: none;
        }

        .range-slider {
          width: 100%;
          cursor: pointer;
        }
        .help-text {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        /* Slide carousel style list */
        .slide-editor-block {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .slide-block-title {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        .slide-block-title h4 {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 850;
          color: #ef4444;
        }
      `}</style>
    </main>
  )
}
