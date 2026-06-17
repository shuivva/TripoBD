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
} from '../apiClient'

const QUICK_PROMPTS = [
  { label: 'Plan 3-day Bandarban', text: 'Plan a 3-day Bandarban trip for 5 people under 5000 BDT' },
  { label: 'Sajek Valley Packing', text: 'Give me a packing list for Sajek Valley' },
  { label: 'Sylhet Shatkora food', text: 'Recommend local foods to eat in Sreemangal and Sylhet' },
  { label: 'Weather tips Cox\'s', text: 'What are the weather tips and best seasons for Cox\'s Bazar?' },
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
  
  // Save itinerary state
  const [savingItineraryId, setSavingItineraryId] = useState(null)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [itineraryRoomName, setItineraryRoomName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedItineraryMsg, setSelectedItineraryMsg] = useState(null)

  const messagesEndRef = useRef(null)

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, submittingMsg])

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
    const tempUserMsg = { id: Date.now(), role: 'user', content: promptText, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      const responseMsg = await sendAIMessage(activeSessionId, promptText)
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, responseMsg])
      loadSessions() // reload sidebar to update count
    } catch {
      setError('Failed to get response. Please try again.')
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

  const openSaveItineraryModal = (msg) => {
    setSelectedItineraryMsg(msg)
    // Attempt to parse destination or name
    let defName = 'AI Tour Plan'
    if (msg.content.includes('Bandarban') || msg.content.includes('বান্দরবান')) defName = 'Bandarban Tour Room'
    else if (msg.content.includes('Sajek') || msg.content.includes('সাজেক')) defName = 'Sajek Valley Trip'
    
    setItineraryRoomName(defName)
    setSaveSuccessMsg('')
    setShowSaveModal(true)
  }

  const handleSaveItineraryToRoom = async () => {
    if (!selectedItineraryMsg || !itineraryRoomName.trim()) return
    setSavingItineraryId(selectedItineraryMsg.id)
    try {
      // Determine destination slug
      let slug = 'bandarban'
      const rawText = selectedItineraryMsg.content.toLowerCase()
      if (rawText.includes('sajek') || rawText.includes('সাজেক')) slug = 'sajek'
      else if (rawText.includes('cox') || rawText.includes('কক্সবাজার')) slug = 'coxs-bazar'
      
      const res = await saveAIItinerary(activeSessionId, selectedItineraryMsg.id, itineraryRoomName, slug)
      setSaveSuccessMsg('Itinerary saved! Redirecting to your new Tour Room...')
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

          {/* Quick Prompts Panel */}
          {messages.length <= 1 && (
            <div className="quick-prompts-panel">
              <h4>Quick Suggested Prompts</h4>
              <div className="quick-prompts-grid">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p.label} className="prompt-suggestion-card" onClick={() => handleSendMessage(p.text)}>
                    <h5>{p.label}</h5>
                    <p>"{p.text.substring(0, 45)}..."</p>
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
            <p className="community-muted">We will create a collaborative Tour Room and pre-populate it with the day-by-day activities generated by the AI.</p>
            {saveSuccessMsg ? (
              <div className="profile-alert success" style={{ width: '100%' }}>{saveSuccessMsg}</div>
            ) : (
              <div className="save-itinerary-form">
                <label>
                  Group Tour Room Name
                  <input
                    type="text"
                    value={itineraryRoomName}
                    onChange={(e) => setItineraryRoomName(e.target.value)}
                    placeholder="Enter group tour room name..."
                  />
                </label>
                <div className="crop-modal-actions" style={{ marginTop: '1rem' }}>
                  <button className="button button-secondary" disabled={savingItineraryId != null} onClick={() => setShowSaveModal(false)}>
                    Cancel
                  </button>
                  <button className="button button-primary" disabled={savingItineraryId != null || !itineraryRoomName.trim()} onClick={handleSaveItineraryToRoom}>
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
          height: calc(100vh - 140px);
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1rem;
        }

        .ai-layout-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
          border: 1px solid #e2e8f0;
          flex: 1;
          height: 100%;
          min-height: 0;
        }

        /* Sidebar */
        .ai-sidebar {
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          min-height: 0;
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
          flex: 1;
          background: white;
          min-height: 0;
          overflow: hidden;
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

        /* Quick prompts suggestions */
        .quick-prompts-panel {
          padding: 1.5rem 2rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .quick-prompts-panel h4 {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 750;
          color: #475569;
        }
        .quick-prompts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .prompt-suggestion-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }
        .prompt-suggestion-card:hover {
          transform: translateY(-2px);
          border-color: #818cf8;
          background: #f5f3ff;
          box-shadow: 0 4px 12px rgba(129,140,248,0.1);
        }
        .prompt-suggestion-card h5 {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 750;
          color: #312e81;
        }
        .prompt-suggestion-card p {
          margin: 0.25rem 0 0;
          font-size: 0.78rem;
          color: #64748b;
          font-style: italic;
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
        }
        .chat-message-bubble.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .bubble-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          border: 1px solid #cbd5e1;
          flex-shrink: 0;
        }
        .chat-message-bubble.user .bubble-avatar {
          background: #38bdf8;
          color: white;
          border: none;
        }
        .bubble-content-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .bubble-body {
          padding: 1rem 1.25rem;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #334155;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .chat-message-bubble.assistant .bubble-body {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-top-left-radius: 4px;
        }
        .chat-message-bubble.user .bubble-body {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
          color: white;
          border-top-right-radius: 4px;
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

        /* Save Itinerary Form Modal */
        .save-itinerary-modal {
          max-width: 420px;
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
        }
        .save-itinerary-form input {
          padding: 0.75rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .ai-layout-container {
            grid-template-columns: 1fr;
          }
          .ai-sidebar {
            display: none; /* simple hidden sidebar for mob */
          }
          .quick-prompts-grid {
            grid-template-columns: 1fr;
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
      `}</style>
    </main>
  )
}
