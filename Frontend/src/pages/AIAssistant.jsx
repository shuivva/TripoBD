import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAISessions,
  createAISession,
  getAISessionMessages,
  deleteAISession,
  sendAIMessage,
  sendAIMessageFeedback,
  saveAIItinerary,
  sendGeminiMessage,
  getTourRooms,
} from '../apiClient'

const FEATURE_CATEGORIES = [
  {
    icon: '🗺️',
    title: 'Destination Recommendations',
    description: 'Get top places to visit based on your style',
    prompts: [
      'Best places to visit in Bangladesh for nature lovers',
      'Hidden gems in Bandarban',
      'Romantic destinations for couples',
      'Family-friendly spots near Dhaka'
    ]
  },
  {
    icon: '📅',
    title: 'Itinerary Generation',
    description: 'Day-by-day itineraries with timings, activities, and hotels',
    prompts: [
      'Plan a 3-day Bandarban trip for 5 people under 5000 BDT',
      '2-day Cox\'s Bazar weekend itinerary',
      'Sylhet tea garden tour plan',
      'Sundarbans wildlife safari itinerary'
    ]
  },
  {
    icon: '💰',
    title: 'Budget Estimation',
    description: 'Plan trips within specific price ranges',
    prompts: [
      'Budget breakdown for Sajek Valley trip',
      'Cheapest way to travel to Saint Martin\'s',
      'Luxury vs budget options in Rangamati',
      'Student budget travel guide for Bangladesh'
    ]
  },
  {
    icon: '🚌',
    title: 'Transport & Route Advice',
    description: 'Guide you on buses, trains, launches, and fares',
    prompts: [
      'How to reach Sajek from Dhaka',
      'Best transport options for Cox\'s Bazar',
      'Train schedule to Sylhet',
      'Launch services to southern Bangladesh'
    ]
  },
  {
    icon: '🎒',
    title: 'Packing Checklists',
    description: 'Essential items to pack for hills, beaches, or forests',
    prompts: [
      'Packing list for Sajek Valley hills',
      'Beach essentials for Cox\'s Bazar',
      'Sundarbans forest safari gear',
      'Monsoon travel packing checklist'
    ]
  },
  {
    icon: '🌤️',
    title: 'Weather & Local Food',
    description: 'What to wear and what regional dishes to eat',
    prompts: [
      'Best season to visit Bandarban',
      'Must-try foods in Sylhet',
      'Weather tips for hill tract visits',
      'Local delicacies of Chittagong region'
    ]
  }
]

export default function AIAssistant() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')
  
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [submittingMsg, setSubmittingMsg] = useState(false)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  // Save itinerary state
  const [savingItineraryId, setSavingItineraryId] = useState(null)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [itineraryRoomName, setItineraryRoomName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedItineraryMsg, setSelectedItineraryMsg] = useState(null)
  const [userRooms, setUserRooms] = useState([])
  const [saveOption, setSaveOption] = useState('new') // 'new' | 'existing'
  const [selectedRoomId, setSelectedRoomId] = useState('')

  const messagesEndRef = useRef(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!isInitialLoad) {
      scrollToBottom()
    }
  }, [messages, submittingMsg])

  // Reset initial load flag after messages are loaded
  useEffect(() => {
    if (messages.length > 0 && isInitialLoad) {
      setIsInitialLoad(false)
    }
  }, [messages, isInitialLoad])

  // Load sessions
  const loadSessions = async () => {
    if (!userId) return
    setSessionsLoading(true)
    try {
      const data = await getAISessions(userId)
      setSessions(data)
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id)
      }
    } catch {
      setError('Failed to load AI sessions.')
    } finally {
      setSessionsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [userId])

  // Load messages for active session
  useEffect(() => {
    if (!activeSessionId) return
    const loadMessages = async () => {
      setLoading(true)
      try {
        const data = await getAISessionMessages(activeSessionId)
        setMessages(data)
      } catch {
        setError('Failed to load chat history.')
      } finally {
        setLoading(false)
      }
    }
    loadMessages()
  }, [activeSessionId])

  const handleCreateSession = async () => {
    if (!userId) return
    try {
      const title = `Trip Session #${sessions.length + 1}`
      const newSession = await createAISession(userId, title)
      setSessions(prev => [newSession, ...prev])
      setActiveSessionId(newSession.id)
    } catch {
      setError('Failed to create new session.')
    }
  }

  const handleDeleteSession = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this conversation history?')) return
    try {
      await deleteAISession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (activeSessionId === id) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch {
      setError('Failed to delete session.')
    }
  }

  const handleSendMessage = async (text) => {
    const promptText = text || inputText
    if (!promptText.trim() || activeSessionId == null) return

    setInputText('')
    setSubmittingMsg(true)
    
    // Optimistic local add
    const tempUserMsg = { id: `temp-${Date.now()}`, role: 'user', content: promptText, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      await sendAIMessage(activeSessionId, promptText)
      const data = await getAISessionMessages(activeSessionId)
      setMessages(data)
      loadSessions() // reload sidebar to update count
    } catch (err) {
      setError(err.message || 'Failed to get response. Please try again.')
      // Remove the optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
    } finally {
      setSubmittingMsg(false)
    }
  }

  const handleFeedback = async (messageId, rating) => {
    try {
      const updated = await sendAIMessageFeedback(messageId, rating)
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, rating: updated.rating } : m))
    } catch {
      /* ignore */
    }
  }

  const openSaveItineraryModal = async (msg) => {
    setSelectedItineraryMsg(msg)
    // Attempt to parse destination or name
    let defName = 'AI Tour Plan'
    if (msg.content.includes('Bandarban') || msg.content.includes('বান্দরবান')) defName = 'Bandarban Tour Room'
    else if (msg.content.includes('Sajek') || msg.content.includes('সাজেক')) defName = 'Sajek Valley Trip'
    
    setItineraryRoomName(defName)
    setSaveSuccessMsg('')
    setSaveOption('new')
    setSelectedRoomId('')
    setShowSaveModal(true)

    // Load active rooms
    if (userId) {
      try {
        const rooms = await getTourRooms(userId)
        setUserRooms(rooms)
        if (rooms.length > 0) {
          setSelectedRoomId(rooms[0].id)
        }
      } catch (err) {
        console.error('Failed to fetch rooms', err)
      }
    }
  }

  const handleSaveItineraryToRoom = async () => {
    if (!selectedItineraryMsg) return
    if (saveOption === 'new' && !itineraryRoomName.trim()) return
    if (saveOption === 'existing' && !selectedRoomId) return

    setSavingItineraryId(selectedItineraryMsg.id)
    try {
      let res
      if (saveOption === 'new') {
        // Determine destination slug
        let slug = 'bandarban'
        const rawText = selectedItineraryMsg.content.toLowerCase()
        if (rawText.includes('sajek') || rawText.includes('সাজেক')) slug = 'sajek'
        else if (rawText.includes('cox') || rawText.includes('কক্সবাজার')) slug = 'coxs-bazar'
        
        res = await saveAIItinerary(activeSessionId, selectedItineraryMsg.id, { roomName: itineraryRoomName, destinationSlug: slug })
      } else {
        res = await saveAIItinerary(activeSessionId, selectedItineraryMsg.id, { roomId: selectedRoomId })
      }

      setSaveSuccessMsg('Itinerary saved! Redirecting to the Tour Room...')
      setTimeout(() => {
        setShowSaveModal(false)
        navigate(`/traveler/room?id=${res.room_id}`)
      }, 1500)
    } catch {
      setError('Failed to save itinerary to group planner.')
    } finally {
      setSavingItineraryId(null)
    }
  }

  // Helper to format AI replies
  const renderMessageContent = (content) => {
    // Simple parser for lists, bold markdown, headings
    const lines = content.split('\n')
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="ai-md-h3">{line.replace('### ', '')}</h3>
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="ai-md-h4">{line.replace('#### ', '')}</h4>
      }
      if (line.startsWith('* **') || line.startsWith('- **')) {
        const parts = line.replace(/^[\*\-]\s+\*\*/, '').split('\*\*')
        return (
          <p key={idx} className="ai-md-bullet">
            <strong>{parts[0]}</strong>
            {parts.slice(1).join('')}
          </p>
        )
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <p key={idx} className="ai-md-bullet">• {line.substring(2)}</p>
      }
      return <p key={idx} className="ai-md-para">{line}</p>
    })
  }

  if (!userId) {
    return (
      <main className="page-shell text-center">
        <p className="community-error">Please sign in to access the AI Travel Assistant.</p>
        <button className="button button-primary" onClick={() => navigate('/signin')}>Sign In</button>
      </main>
    )
  }

  return (
    <main className="page-shell ai-assistant-shell">
      {error && <div className="profile-alert error">{error}</div>}

      <div className="ai-layout-container">
        {/* SIDEBAR: Sessions list */}
        <aside className="ai-sidebar">
          <div className="ai-sidebar-header">
            <h3>💬 Chat Sessions</h3>
            <button className="new-session-btn" onClick={handleCreateSession} title="New Session">+</button>
          </div>
          <div className="ai-sessions-list">
            {sessionsLoading ? (
              <p className="ai-sidebar-muted">Loading...</p>
            ) : sessions.length === 0 ? (
              <p className="ai-sidebar-muted">No history yet.</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`ai-session-item ${activeSessionId === s.id ? 'active' : ''}`}
                  onClick={() => setActiveSessionId(s.id)}
                >
                  <span className="session-icon">🧭</span>
                  <div className="session-info">
                    <h4>{s.title}</h4>
                    <small>{s.messages_count || 0} messages</small>
                  </div>
                  <button className="session-delete" onClick={(e) => handleDeleteSession(s.id, e)} title="Delete history">
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* MAIN CHAT AREA */}
        <section className="ai-chat-main">
          <header className="ai-chat-header">
            <div>
              <h2>AI Travel Assistant</h2>
              <p>Generate day-by-day itineraries, budgets, food guides, and packing lists (Bilingual Bangla & English).</p>
            </div>
            <div className="assistant-badge-active">
              <span className="status-dot"></span> Assistant Online
            </div>
          </header>

          {/* Feature Categories Panel */}
          {messages.length <= 1 && !selectedCategory && (
            <div className="feature-categories-panel">
              <h4>What can I help you with?</h4>
              <div className="feature-categories-grid">
                {FEATURE_CATEGORIES.map((category, index) => (
                  <button 
                    key={index} 
                    className="feature-category-card"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    <h5>{category.title}</h5>
                    <p>{category.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contextual Prompts Panel */}
          {selectedCategory && messages.length <= 1 && (
            <div className="contextual-prompts-panel">
              <button className="back-to-categories" onClick={() => setSelectedCategory(null)}>
                ← Back to all features
              </button>
              <div className="selected-category-header">
                <span className="category-icon-large">{selectedCategory.icon}</span>
                <div>
                  <h4>{selectedCategory.title}</h4>
                  <p>{selectedCategory.description}</p>
                </div>
              </div>
              <div className="contextual-prompts-grid">
                {selectedCategory.prompts.map((prompt, index) => (
                  <button 
                    key={index} 
                    className="contextual-prompt-card"
                    onClick={() => {
                      handleSendMessage(prompt)
                      setSelectedCategory(null)
                    }}
                  >
                    <p>"{prompt}"</p>
                    <span className="prompt-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages List */}
          <div className="ai-messages-scrollarea">
            {loading ? (
              <div className="ai-chat-status">Retrieving message history...</div>
            ) : messages.length === 0 ? (
              <div className="ai-chat-empty-state">
                <span>🤖</span>
                <h3>Start planning your next destination</h3>
                <p>Type a prompt below or click a quick suggest card above to ask for recommendations, weather tips, or itineraries.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`chat-message-bubble ${m.role}`}>
                  <div className="bubble-avatar">
                    {m.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="bubble-content-wrap">
                    <div className="bubble-body">
                      {renderMessageContent(m.content)}
                    </div>
                    
                    {/* Render rating feedback and save itinerary for Assistant replies */}
                    {m.role === 'assistant' && (
                      <div className="bubble-footer-actions">
                        <div className="feedback-rating">
                          <button
                            className={`feedback-btn thumbs-up ${m.rating === 'up' ? 'voted' : ''}`}
                            onClick={() => handleFeedback(m.id, m.rating === 'up' ? null : 'up')}
                            title="Helpful reply"
                          >
                            👍
                          </button>
                          <button
                            className={`feedback-btn thumbs-down ${m.rating === 'down' ? 'voted' : ''}`}
                            onClick={() => handleFeedback(m.id, m.rating === 'down' ? null : 'down')}
                            title="Unhelpful reply"
                          >
                            👎
                          </button>
                        </div>
                        {m.content.includes('###') && (
                          <button className="save-itinerary-btn-bubble" onClick={() => openSaveItineraryModal(m)}>
                            💾 Save to Tour Room
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {submittingMsg && (
              <div className="chat-message-bubble assistant typing">
                <div className="bubble-avatar">🤖</div>
                <div className="bubble-content-wrap">
                  <div className="bubble-body typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Chat Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="ai-chat-input-row"
          >
            <input
              type="text"
              placeholder="Ask anything (e.g. Plan a 3-day Bandarban trip...)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={submittingMsg || activeSessionId == null}
            />
            <button type="submit" className="send-message-submit-btn" disabled={submittingMsg || !inputText.trim() || activeSessionId == null}>
              Send ➔
            </button>
          </form>
        </section>
      </div>

      {/* Save Itinerary Modal */}
      {showSaveModal && (
        <div className="crop-modal">
          <div className="crop-modal-content save-itinerary-modal">
            <h3>Save Itinerary to Planner</h3>
            <p className="community-muted">Pre-populate a Tour Room planner with the day-by-day activities generated by the AI.</p>
            {saveSuccessMsg ? (
              <div className="profile-alert success" style={{ width: '100%' }}>{saveSuccessMsg}</div>
            ) : (
              <div className="save-itinerary-form">
                {userRooms.length > 0 && (
                  <div className="save-option-toggle">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="saveOption"
                        value="new"
                        checked={saveOption === 'new'}
                        onChange={() => setSaveOption('new')}
                      />
                      <span>Create New Room</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="saveOption"
                        value="existing"
                        checked={saveOption === 'existing'}
                        onChange={() => setSaveOption('existing')}
                      />
                      <span>Save to Existing Room</span>
                    </label>
                  </div>
                )}

                {saveOption === 'new' ? (
                  <label>
                    Group Tour Room Name
                    <input
                      type="text"
                      value={itineraryRoomName}
                      onChange={(e) => setItineraryRoomName(e.target.value)}
                      placeholder="Enter group tour room name..."
                    />
                  </label>
                ) : (
                  <label>
                    Select Existing Tour Room
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                    >
                      {userRooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.destination_name || 'No Destination'})</option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="crop-modal-actions" style={{ marginTop: '1.5rem' }}>
                  <button className="button button-secondary" disabled={savingItineraryId != null} onClick={() => setShowSaveModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="button button-primary"
                    disabled={savingItineraryId != null || (saveOption === 'new' ? !itineraryRoomName.trim() : !selectedRoomId)}
                    onClick={handleSaveItineraryToRoom}
                  >
                    {savingItineraryId != null ? 'Saving...' : 'Save & Open Planner'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .ai-assistant-shell {
          margin-top: 98px !important;
          margin-left: 264px !important;
          width: calc(100% - 264px) !important;
          max-width: none !important;
          padding: 0 1.5rem 1.5rem 1.5rem !important;
          min-height: calc(100vh - 98px);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 1024px) {
          .ai-assistant-shell {
            margin-left: 80px !important;
            width: calc(100% - 80px) !important;
          }
        }

        .ai-layout-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
          border: 1px solid #e2e8f0;
          min-height: 700px;
        }

        /* Sidebar */
        .ai-sidebar {
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
        }
        .ai-sidebar-header {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .ai-sidebar-header h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 850;
          color: #0f172a;
        }
        .new-session-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #10b981;
          color: white;
          border: none;
          font-size: 1.25rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .new-session-btn:hover {
          background: #059669;
        }

        .ai-sessions-list {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow-y: auto;
          flex: 1;
        }
        .ai-sidebar-muted {
          font-size: 0.82rem;
          color: #64748b;
          text-align: center;
          margin-top: 2rem;
          font-style: italic;
        }

        .ai-session-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          border: 1.5px solid transparent;
        }
        .ai-session-item:hover {
          background: #f1f5f9;
        }
        .ai-session-item.active {
          background: #e0f2fe;
          border-color: #bae6fd;
        }
        .session-icon {
          font-size: 1.25rem;
        }
        .session-info {
          flex: 1;
        }
        .session-info h4 {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 700;
          color: #1e293b;
        }
        .session-info small {
          font-size: 0.75rem;
          color: #64748b;
        }
        .session-delete {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: transparent;
          border: none;
          font-size: 1.1rem;
          color: #94a3b8;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
        }
        .ai-session-item:hover .session-delete {
          display: flex;
        }
        .session-delete:hover {
          color: #ef4444;
          background: #fee2e2;
        }

        /* Main Chat area */
        .ai-chat-main {
          display: flex;
          flex-direction: column;
          min-height: 700px;
          background: white;
        }
        .ai-chat-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ai-chat-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 850;
          color: #0f172a;
        }
        .ai-chat-header p {
          margin: 0.2rem 0 0;
          font-size: 0.85rem;
          color: #64748b;
        }
        .assistant-badge-active {
          font-size: 0.8rem;
          font-weight: 700;
          color: #047857;
          background: #d1fae5;
          padding: 0.4rem 0.8rem;
          border-radius: 99px;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        /* Feature Categories Panel */
        .feature-categories-panel {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .feature-categories-panel h4 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #1e293b;
          text-align: center;
        }
        .feature-categories-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .feature-category-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .feature-category-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4f46e5, #818cf8);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .feature-category-card:hover {
          transform: translateY(-4px);
          border-color: #818cf8;
          box-shadow: 0 12px 24px rgba(79, 70, 229, 0.15);
        }
        .feature-category-card:hover::before {
          opacity: 1;
        }
        .category-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.75rem;
        }
        .feature-category-card h5 {
          margin: 0 0 0.5rem;
          font-size: 0.95rem;
          font-weight: 800;
          color: #1e293b;
          line-height: 1.3;
        }
        .feature-category-card p {
          margin: 0;
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.4;
        }

        /* Contextual Prompts Panel */
        .contextual-prompts-panel {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .back-to-categories {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.5rem 0;
          transition: color 0.2s;
          text-align: left;
        }
        .back-to-categories:hover {
          color: #4f46e5;
        }
        .selected-category-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 16px;
          border: 2px solid #bae6fd;
        }
        .category-icon-large {
          font-size: 3rem;
        }
        .selected-category-header h4 {
          margin: 0 0 0.25rem;
          font-size: 1.25rem;
          font-weight: 800;
          color: #0c4a6e;
        }
        .selected-category-header p {
          margin: 0;
          font-size: 0.9rem;
          color: #0369a1;
        }
        .contextual-prompts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .contextual-prompt-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.25rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .contextual-prompt-card:hover {
          border-color: #4f46e5;
          background: #f5f3ff;
          transform: translateX(4px);
        }
        .contextual-prompt-card p {
          margin: 0;
          font-size: 0.85rem;
          color: #334155;
          font-style: italic;
          line-height: 1.4;
        }
        .prompt-arrow {
          font-size: 1.25rem;
          color: #4f46e5;
          font-weight: 700;
        }

        /* Messages scroll area */
        .ai-messages-scrollarea {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .ai-chat-status {
          font-size: 0.85rem;
          color: #64748b;
          text-align: center;
          margin: 2rem 0;
          font-style: italic;
        }
        .ai-chat-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.5rem;
          margin-top: 4rem;
          color: #94a3b8;
        }
        .ai-chat-empty-state span {
          font-size: 3rem;
        }
        .ai-chat-empty-state h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #475569;
        }
        .ai-chat-empty-state p {
          margin: 0;
          font-size: 0.85rem;
          max-width: 380px;
        }

        /* Chat bubbles */
        .chat-message-bubble {
          display: flex;
          gap: 1rem;
          max-width: 85%;
          animation: slideIn 0.3s ease-out;
        }
        .chat-message-bubble.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .bubble-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          border: 2px solid #cbd5e1;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .chat-message-bubble.user .bubble-avatar {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        .chat-message-bubble.assistant .bubble-avatar {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .bubble-content-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .bubble-body {
          padding: 1.25rem 1.5rem;
          border-radius: 20px;
          font-size: 0.95rem;
          line-height: 1.7;
          color: #334155;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        .chat-message-bubble.assistant .bubble-body {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #e2e8f0;
          border-top-left-radius: 6px;
        }
        .chat-message-bubble.user .bubble-body {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
          color: white;
          border-top-right-radius: 6px;
          box-shadow: 0 4px 16px rgba(79, 70, 229, 0.25);
        }

        /* Formatted markdown styles inside bubble */
        .ai-md-h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.75rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.25rem;
        }
        .chat-message-bubble.user .ai-md-h3 {
          color: white;
          border-bottom-color: rgba(255,255,255,0.2);
        }
        .ai-md-h4 {
          font-size: 0.95rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0.75rem 0 0.4rem;
        }
        .ai-md-para {
          margin: 0 0 0.75rem;
        }
        .ai-md-para:last-child {
          margin-bottom: 0;
        }
        .ai-md-bullet {
          margin: 0.25rem 0 0.25rem 0.5rem;
          padding-left: 0.5rem;
        }

        /* Bubble actions */
        .bubble-footer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-top: 0.25rem;
          padding: 0 0.5rem;
        }
        .feedback-rating {
          display: flex;
          gap: 0.25rem;
        }
        .feedback-btn {
          border: none;
          background: transparent;
          font-size: 0.9rem;
          cursor: pointer;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          opacity: 0.6;
        }
        .feedback-btn:hover {
          background: #e2e8f0;
          opacity: 1;
        }
        .feedback-btn.voted {
          background: #e0f2fe;
          opacity: 1;
          box-shadow: 0 0 0 1px #bae6fd;
        }
        .save-itinerary-btn-bubble {
          border: 1px solid #818cf8;
          background: #e0e7ff;
          color: #4338ca;
          font-size: 0.75rem;
          font-weight: 750;
          padding: 0.3rem 0.6rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .save-itinerary-btn-bubble:hover {
          background: #4338ca;
          color: white;
        }

        /* Typing indicator */
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.75rem 1.25rem !important;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #94a3b8;
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.3s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(2) { animation-delay: -1.1s; }
        .typing-indicator span:nth-child(3) { animation-delay: -0.9s; }

        /* Input row */
        .ai-chat-input-row {
          padding: 1.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 1rem;
        }
        .ai-chat-input-row input {
          flex: 1;
          padding: 0.8rem 1.25rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 14px;
          font-size: 0.95rem;
          background: #f8fafc;
          transition: all 0.2s;
        }
        .ai-chat-input-row input:focus {
          outline: none;
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }
        .send-message-submit-btn {
          background: #4f46e5;
          color: white;
          border: none;
          font-weight: 700;
          font-size: 0.9rem;
          padding: 0.8rem 1.5rem;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .send-message-submit-btn:hover:not(:disabled) {
          background: #3730a3;
        }
        .send-message-submit-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        /* Crop Modal / Save Itinerary Modal Overlay */
        .crop-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .crop-modal-content {
          background: white;
          padding: 2rem;
          border-radius: 24px;
          width: 90%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.25rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .crop-modal-content h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 850;
          color: #0f172a;
        }
        .crop-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          width: 100%;
        }

        /* Save Itinerary Form Modal */
        .save-itinerary-modal {
          max-width: 440px;
        }
        .save-itinerary-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .save-itinerary-form label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-weight: 600;
          color: #334155;
          font-size: 0.9rem;
          width: 100%;
        }
        .save-itinerary-form input {
          padding: 0.75rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.95rem;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .save-itinerary-form input:focus {
          border-color: #4f46e5;
        }
        .save-itinerary-form select {
          padding: 0.75rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.95rem;
          background: white;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .save-itinerary-form select:focus {
          border-color: #4f46e5;
        }

        /* Radio group styles */
        .save-option-toggle {
          display: flex;
          gap: 1.25rem;
          margin-bottom: 0.25rem;
          width: 100%;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          font-weight: 700 !important;
          font-size: 0.85rem;
          color: #475569;
        }
        .radio-label input {
          cursor: pointer;
          margin: 0;
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 768px) {
          .ai-layout-container {
            grid-template-columns: 1fr;
          }
          .ai-sidebar {
            display: none;
          }
          .feature-categories-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }
          .contextual-prompts-grid {
            grid-template-columns: 1fr;
          }
          .feature-category-card {
            padding: 1rem;
          }
          .category-icon {
            font-size: 1.5rem;
          }
          .feature-category-card h5 {
            font-size: 0.85rem;
          }
          .feature-category-card p {
            font-size: 0.75rem;
          }
          .chat-message-bubble {
            max-width: 95%;
          }
          .bubble-avatar {
            width: 36px;
            height: 36px;
            font-size: 1.15rem;
          }
          .bubble-body {
            padding: 1rem 1.25rem;
            font-size: 0.9rem;
          }
        }

        @media (max-width: 480px) {
          .feature-categories-grid {
            grid-template-columns: 1fr;
          }
          .ai-chat-header h2 {
            font-size: 1rem;
          }
          .ai-chat-header p {
            font-size: 0.75rem;
          }
        }

        /* Keyframes */
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  )
}
