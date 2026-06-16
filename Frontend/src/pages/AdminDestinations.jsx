import { useEffect, useState } from 'react'
import { getAdminDestinations, getAdminDestinationDetail, addEditDestination, deleteAdminDestination } from '../apiClient'

export default function AdminDestinations() {
  const adminId = localStorage.getItem('userId')
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Edit / Create mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editSlug, setEditSlug] = useState(null) // null for create mode
  const [formTab, setFormTab] = useState('details') // details, transport, hotels, attractions

  // Form states
  const [name, setName] = useState('')
  const [region, setRegion] = useState('Dhaka')
  const [category, setCategory] = useState('City')
  const [description, setDescription] = useState('')
  const [summary, setSummary] = useState('')
  const [budget, setBudget] = useState('Medium')
  const [duration, setDuration] = useState('3-5 days')
  const [season, setSeason] = useState('Winter')
  const [hero, setHero] = useState('')
  const [lat, setLat] = useState(23.7)
  const [lng, setLng] = useState(90.4)

  // Transport state
  const [routes, setRoutes] = useState([])
  const [newRouteMode, setNewRouteMode] = useState('Bus')
  const [newRouteOperator, setNewRouteOperator] = useState('')
  const [newRouteFare, setNewRouteFare] = useState('')
  const [newRouteDuration, setNewRouteDuration] = useState('')

  // Hotels state
  const [accommodations, setAccommodations] = useState([])
  const [newHotelName, setNewHotelName] = useState('')
  const [newHotelPrice, setNewHotelPrice] = useState('')
  const [newHotelSummary, setNewHotelSummary] = useState('')

  // Attractions state
  const [attractions, setAttractions] = useState([])
  const [newSpotName, setNewSpotName] = useState('')

  const loadList = async () => {
    if (!adminId) {
      setError('Please sign in as an administrator.')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const list = await getAdminDestinations(adminId)
      setDestinations(list)
    } catch {
      setError('Failed to load destinations directory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
  }, [adminId])

  const startCreate = () => {
    setIsEditing(true)
    setEditSlug(null)
    setFormTab('details')
    setName('')
    setRegion('Dhaka')
    setCategory('City')
    setDescription('')
    setSummary('')
    setBudget('Medium')
    setDuration('3-5 days')
    setSeason('Winter')
    setHero('')
    setLat(23.7)
    setLng(90.4)
    setRoutes([])
    setAccommodations([])
    setAttractions([])
  }

  const startEdit = async (slug) => {
    setLoading(true)
    try {
      const details = await getAdminDestinationDetail(adminId, slug)
      const d = details.destination
      setIsEditing(true)
      setEditSlug(slug)
      setFormTab('details')
      setName(d.name)
      setRegion(d.region)
      setCategory(d.category)
      setDescription(d.description || '')
      setSummary(d.summary || '')
      setBudget(d.budget || 'Medium')
      setDuration(d.duration || '3-5 days')
      setSeason(d.season || 'Winter')
      setHero(d.hero || '')
      setLat(d.coords_lat || 23.7)
      setLng(d.coords_lng || 90.4)
      setRoutes(details.routes || [])
      setAccommodations(details.accommodations || [])
      setAttractions(details.attractions || [])
    } catch {
      setError('Failed to load destination details.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      const payload = {
        name,
        region,
        category,
        description,
        summary,
        budget,
        duration,
        season,
        hero,
        coords_lat: Number(lat),
        coords_lng: Number(lng),
        routes,
        accommodations,
        attractions
      }
      
      const method = editSlug ? 'PUT' : 'POST'
      await addEditDestination(adminId, method, editSlug, payload)
      setMessage('Destination record saved successfully!')
      setIsEditing(false)
      loadList()
    } catch {
      setError('Failed to save destination record.')
    }
  }

  const handleDelete = async (slug) => {
    if (!confirm('Are you sure you want to permanently delete this destination and all its listings?')) return
    setMessage('')
    setError('')
    try {
      await deleteAdminDestination(adminId, slug)
      setMessage('Destination record deleted successfully.')
      loadList()
    } catch {
      setError('Failed to delete destination.')
    }
  }

  // Helpers to add items to sub-grids
  const addRoute = () => {
    if (!newRouteOperator.trim() || !newRouteFare) return
    setRoutes(prev => [...prev, {
      mode: newRouteMode,
      operator: newRouteOperator,
      fare: Number(newRouteFare),
      duration: newRouteDuration,
      from_location: 'Dhaka'
    }])
    setNewRouteOperator('')
    setNewRouteFare('')
    setNewRouteDuration('')
  }

  const addHotel = () => {
    if (!newHotelName.trim() || !newHotelPrice) return
    setAccommodations(prev => [...prev, {
      name: newHotelName,
      price: newHotelPrice,
      summary: newHotelSummary
    }])
    setNewHotelName('')
    setNewHotelPrice('')
    setNewHotelSummary('')
  }

  const addSpot = () => {
    if (!newSpotName.trim()) return
    setAttractions(prev => [...prev, { name: newSpotName }])
    setNewSpotName('')
  }

  if (loading && destinations.length === 0) {
    return <main className="page-shell"><p className="admin-status">Loading destinations...</p></main>
  }

  return (
    <main className="page-shell admin-destinations">
      {message && <div className="admin-alert success">{message}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      <header className="admin-header-main">
        <h1>Destination Listings Manager</h1>
        <p>Edit geographical coordinates, transport routes, hotels availability, and sightseeing spots configurations.</p>
      </header>

      {!isEditing ? (
        /* List Mode */
        <section className="directory-panel-card">
          <div className="section-head-bar">
            <h3>Bangladesh Destinations Listed ({destinations.length})</h3>
            <button className="button button-primary" onClick={startCreate}>➕ Add New Destination</button>
          </div>
          
          {destinations.length === 0 ? (
            <p className="empty-state-text">No destinations logged. Click Add New to start populating records.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-destinations-table">
                <thead>
                  <tr>
                    <th>Destination Name</th>
                    <th>Region</th>
                    <th>Category</th>
                    <th>Weekly Views</th>
                    <th>Average Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {destinations.map((d) => (
                    <tr key={d.slug}>
                      <td><strong>{d.name}</strong></td>
                      <td>{d.region}</td>
                      <td>{d.category}</td>
                      <td>👁️ {d.views} views</td>
                      <td>⭐ {d.rating}</td>
                      <td className="actions-cell">
                        <button className="button button-secondary compact" onClick={() => startEdit(d.slug)}>Edit</button>
                        <button className="button button-secondary compact delete-btn" onClick={() => handleDelete(d.slug)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        /* Edit Mode */
        <section className="panel-card form-editor-card">
          <div className="form-head-bar">
            <h3>{editSlug ? `Edit Destination: ${name}` : 'Add New Destination'}</h3>
            <button className="button button-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>

          {/* Tab Selection */}
          <div className="form-tabs-nav">
            <button className={`form-tab-btn ${formTab === 'details' ? 'active' : ''}`} onClick={() => setFormTab('details')}>Details</button>
            <button className={`form-tab-btn ${formTab === 'transport' ? 'active' : ''}`} onClick={() => setFormTab('transport')}>Transport Routes</button>
            <button className={`form-tab-btn ${formTab === 'hotels' ? 'active' : ''}`} onClick={() => setFormTab('hotels')}>Accommodations</button>
            <button className={`form-tab-btn ${formTab === 'attractions' ? 'active' : ''}`} onClick={() => setFormTab('attractions')}>Attractions</button>
          </div>

          <form onSubmit={handleSave} className="destination-edit-form">
            
            {/* Tab 1: Details */}
            {formTab === 'details' && (
              <div className="form-tab-content">
                <div className="form-fields double">
                  <label>
                    Destination Name
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                  </label>
                  <label>
                    Region / Division
                    <select value={region} onChange={e => setRegion(e.target.value)}>
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Khulna">Khulna</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Barisal">Barisal</option>
                      <option value="Rangpur">Rangpur</option>
                      <option value="Mymensingh">Mymensingh</option>
                    </select>
                  </label>
                  <label>
                    Category
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="City">City Tour</option>
                      <option value="Beach">Beach Escape</option>
                      <option value="Hill">Hill Tracts</option>
                      <option value="Forest">Forest / Mangrove</option>
                      <option value="Heritage">Archaeological Heritage</option>
                      <option value="Haor">Haor / Wetlands</option>
                    </select>
                  </label>
                  <label>
                    Budget Category
                    <select value={budget} onChange={e => setBudget(e.target.value)}>
                      <option value="Low">Low Cost</option>
                      <option value="Medium">Medium Cost</option>
                      <option value="High">Premium Cost</option>
                    </select>
                  </label>
                  <label>
                    Best Visit Season
                    <input type="text" value={season} onChange={e => setSeason(e.target.value)} placeholder="e.g. Winter (November to March)" required />
                  </label>
                  <label>
                    Standard Duration
                    <input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3-5 days" required />
                  </label>
                  <label>
                    Latitude Coords
                    <input type="number" step="0.0001" value={lat} onChange={e => setLat(e.target.value)} required />
                  </label>
                  <label>
                    Longitude Coords
                    <input type="number" step="0.0001" value={lng} onChange={e => setLng(e.target.value)} required />
                  </label>
                </div>
                <div className="form-fields" style={{ marginTop: '1rem' }}>
                  <label>
                    Hero Photo Web URL
                    <input type="text" value={hero} onChange={e => setHero(e.target.value)} placeholder="Paste banner image web address..." />
                  </label>
                  <label>
                    Summary (Short Nudge)
                    <input type="text" value={summary} onChange={e => setSummary(e.target.value)} placeholder="A brief one-sentence tag description..." required />
                  </label>
                  <label>
                    Full Descriptive Overview
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed history, things to do, and travel warnings..." rows="6" required />
                  </label>
                </div>
              </div>
            )}

            {/* Tab 2: Transport Routes */}
            {formTab === 'transport' && (
              <div className="form-tab-content">
                <h4>🚌 Configure Travel Routes to Destination</h4>
                <div className="adder-row-sub">
                  <select value={newRouteMode} onChange={e => setNewRouteMode(e.target.value)}>
                    <option value="Bus">Bus</option>
                    <option value="Train">Train</option>
                    <option value="Launch">Launch / Ferry</option>
                    <option value="Air">Air Flight</option>
                  </select>
                  <input type="text" placeholder="Operator Name (e.g. Hanif)" value={newRouteOperator} onChange={e => setNewRouteOperator(e.target.value)} />
                  <input type="number" placeholder="Fare in BDT" value={newRouteFare} onChange={e => setNewRouteFare(e.target.value)} />
                  <input type="text" placeholder="Duration (e.g. 8h)" value={newRouteDuration} onChange={e => setNewRouteDuration(e.target.value)} />
                  <button type="button" className="button button-primary compact" onClick={addRoute}>Add Route</button>
                </div>
                
                <div className="sub-list-preview">
                  {routes.length === 0 ? <p className="empty-sub-text">No route lines added.</p> : (
                    <table className="sub-table">
                      <thead><tr><th>Mode</th><th>Operator</th><th>Fare</th><th>Duration</th><th>Action</th></tr></thead>
                      <tbody>
                        {routes.map((r, idx) => (
                          <tr key={idx}>
                            <td>{r.mode}</td>
                            <td>{r.operator}</td>
                            <td>৳{r.fare}</td>
                            <td>{r.duration}</td>
                            <td><button type="button" className="button button-tertiary compact delete-link" onClick={() => setRoutes(prev => prev.filter((_, i) => i !== idx))}>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Hotels */}
            {formTab === 'hotels' && (
              <div className="form-tab-content">
                <h4>🏨 Manage Accommodation Listings</h4>
                <div className="adder-row-sub flex-column">
                  <div className="adder-sub-flex-row">
                    <input type="text" placeholder="Hotel Name" value={newHotelName} onChange={e => setNewHotelName(e.target.value)} />
                    <input type="text" placeholder="Pricing (e.g. ৳3000/night)" value={newHotelPrice} onChange={e => setNewHotelPrice(e.target.value)} />
                  </div>
                  <div className="adder-sub-flex-row" style={{ marginTop: '0.5rem' }}>
                    <input type="text" placeholder="Summary Details" value={newHotelSummary} onChange={e => setNewHotelSummary(e.target.value)} style={{ flex: 1 }} />
                    <button type="button" className="button button-primary compact" onClick={addHotel}>Add Hotel</button>
                  </div>
                </div>

                <div className="sub-list-preview">
                  {accommodations.length === 0 ? <p className="empty-sub-text">No accommodation listings saved.</p> : (
                    <table className="sub-table">
                      <thead><tr><th>Hotel Name</th><th>Price Range</th><th>Summary</th><th>Action</th></tr></thead>
                      <tbody>
                        {accommodations.map((h, idx) => (
                          <tr key={idx}>
                            <td>{h.name}</td>
                            <td>{h.price}</td>
                            <td>{h.summary}</td>
                            <td><button type="button" className="button button-tertiary compact delete-link" onClick={() => setAccommodations(prev => prev.filter((_, i) => i !== idx))}>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Attractions */}
            {formTab === 'attractions' && (
              <div className="form-tab-content">
                <h4>🏞️ Add Points of Interest / Sightseeing Spots</h4>
                <div className="adder-row-sub">
                  <input type="text" placeholder="Spot Name (e.g. Himchari Waterfall)" value={newSpotName} onChange={e => setNewSpotName(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" className="button button-primary compact" onClick={addSpot}>Add Spot</button>
                </div>

                <div className="sub-list-preview">
                  {attractions.length === 0 ? <p className="empty-sub-text">No sightseeing spots configured.</p> : (
                    <table className="sub-table">
                      <thead><tr><th>Sightseeing Spot Name</th><th>Action</th></tr></thead>
                      <tbody>
                        {attractions.map((s, idx) => (
                          <tr key={idx}>
                            <td>{s.name}</td>
                            <td><button type="button" className="button button-tertiary compact delete-link" onClick={() => setAttractions(prev => prev.filter((_, i) => i !== idx))}>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            <div className="form-footer-actions">
              <button type="button" className="button button-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="button button-primary submit-save-btn">Save Destination & Listings</button>
            </div>
          </form>
        </section>
      )}

      <style>{`
        .admin-destinations {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .admin-header-main h1 { font-size: 2.25rem; font-weight: 850; margin: 0 0 0.5rem 0; color: #0f172a; }
        .admin-header-main p { font-size: 1.05rem; color: #64748b; margin: 0; }
        
        .directory-panel-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        .section-head-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.75rem; margin-bottom: 1rem; }
        .section-head-bar h3 { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 0; }
        
        .admin-destinations-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-destinations-table th { padding: 0.8rem 1rem; border-bottom: 2px solid #f1f5f9; color: #475569; font-size: 0.82rem; text-transform: uppercase; font-weight: 800; }
        .admin-destinations-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; color: #334155; }
        .admin-destinations-table tr:last-child td { border: none; }
        .actions-cell { display: flex; gap: 0.35rem; }
        
        .form-editor-card { background: white; border: 1px solid #cbd5e1; border-radius: 20px; padding: 2rem; }
        .form-head-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; margin-bottom: 1rem; }
        .form-head-bar h3 { font-size: 1.25rem; font-weight: 850; color: #0f172a; margin: 0; }
        
        .form-tabs-nav { display: flex; gap: 0.35rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
        .form-tab-btn { border: none; background: none; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 750; color: #64748b; cursor: pointer; border-radius: 6px; }
        .form-tab-btn:hover { background: #f1f5f9; color: #1e293b; }
        .form-tab-btn.active { background: #ef4444; color: white; }
        
        .form-fields { display: flex; flex-direction: column; gap: 1rem; }
        .form-fields.double { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .form-fields label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; font-weight: 700; color: #475569; }
        .form-fields input, .form-fields select, .form-fields textarea { padding: 0.65rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; outline: none; }
        .form-fields input:focus, .form-fields select:focus, .form-fields textarea:focus { border-color: #ef4444; }
        
        .form-tab-content h4 { font-size: 0.95rem; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.35rem; margin: 0 0 1rem 0; color: #1e293b; }
        
        .adder-row-sub { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 0.85rem; border-radius: 10px; }
        .adder-row-sub.flex-column { flex-direction: column; }
        .adder-sub-flex-row { display: flex; gap: 0.5rem; }
        .adder-row-sub input, .adder-row-sub select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; font-size: 0.85rem; }
        .adder-row-sub select { width: 120px; }
        
        .sub-list-preview { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1rem; }
        .sub-table { width: 100%; border-collapse: collapse; text-align: left; }
        .sub-table th { padding: 0.5rem; border-bottom: 1.5px solid #cbd5e1; font-size: 0.78rem; color: #64748b; text-transform: uppercase; }
        .sub-table td { padding: 0.65rem 0.5rem; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; color: #334155; }
        .sub-table tr:last-child td { border: none; }
        
        .delete-link { color: #ef4444; font-weight: 750; background: none; border: none; cursor: pointer; }
        .form-footer-actions { display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #f1f5f9; padding-top: 1.25rem; margin-top: 1.5rem; }
        
        .delete-btn { background: #fee2e2 !important; border-color: #fecaca !important; color: #991b1b !important; }
        .delete-btn:hover { background: #fecaca !important; }
        .admin-status { text-align: center; padding: 3rem; color: #64748b; }
      `}</style>
    </main>
  )
}
