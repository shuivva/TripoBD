import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function AITravelAssistant() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('en')
  const messagesEndRef = useRef(null)
  
  const userId = searchParams.get('user_id')

  useEffect(() => {
    fetchConversations()
  }, [userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/ai-conversations/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setConversations(data)
        if (data.length > 0) {
          setCurrentConversation(data[0])
          setMessages(data[0].messages || [])
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = { role: 'user', content: inputMessage }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputMessage('')
    setLoading(true)

    // Simulate AI response (in production, this would call an AI API)
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.content, language)
      setMessages([...updatedMessages, { role: 'assistant', content: aiResponse }])
      setLoading(false)
      
      // Save conversation
      saveConversation([...updatedMessages, { role: 'assistant', content: aiResponse }])
    }, 1500)
  }

  const generateAIResponse = (userMessage, lang) => {
    const responses = {
      en: [
        "I'd be happy to help you plan your trip! What destination are you considering?",
        "Based on your preferences, I recommend visiting Sajek Valley for its stunning mountain views.",
        "For a 3-day trip to Bandarban with 5 people under 5000 BDT, I suggest: Day 1: Explore Nilgiri Hills, Day 2: Visit Boga Lake, Day 3: Trek to Keokradong.",
        "The best time to visit Cox's Bazar is from November to February for pleasant weather.",
        "For budget-friendly accommodation in Sylhet, consider local guesthouses which offer great value."
      ],
      bn: [
        "আপনার ভ্রমণ পরিকল্পনায় সাহায্য করতে পেরে খুশি হলাম! আপনি কোন গন্তব্যে যেতে চান?",
        "আপনার পছন্দ অনুযায়ী, আমি সাজেক ভ্যালি পরিদর্শনের পরামর্শ দিচ্ছি এর অসাধারণ পাহাড়ি দৃশ্যের জন্য।",
        "৫ জনের জন্য ৫০০০ টাকার মধ্যে ৩ দিনের বান্দরবান ভ্রমণের জন্য আমি পরামর্শ দিচ্ছি: দিন ১: নীলগিরি অন্বেষণ, দিন ২: বগা লেক পরিদর্শন, দিন ৩: কেওক্রাডং ট্রেকিং।",
        "কক্সবাজার পরিদর্শনের সেরা সময় নভেম্বর থেকে ফেব্রুয়ারি পর্যন্ত সুন্দর আবহাওয়ার জন্য।",
        "সিলেটে বাজেট-বান্ধব আবাসনের জন্য স্থানীয় গেস্টহাউস বিবেচনা করুন যা দুর্দান্ত মূল্য প্রদান করে।"
      ]
    }
    
    const langResponses = responses[lang] || responses.en
    return langResponses[Math.floor(Math.random() * langResponses.length)]
  }

  const saveConversation = async (msgs) => {
    try {
      const response = await fetch('http://localhost:8000/api/ai-conversations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userId,
          language: language,
          messages: msgs
        })
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentConversation(data)
        setConversations([data, ...conversations.filter(c => c.id !== currentConversation?.id)])
      }
    } catch (err) {
      console.error('Failed to save conversation:', err)
    }
  }

  const handleNewConversation = () => {
    setCurrentConversation(null)
    setMessages([])
  }

  const handleSelectConversation = (conv) => {
    setCurrentConversation(conv)
    setMessages(conv.messages || [])
  }

  const quickPrompts = [
    { text: 'Plan a 3-day Bandarban trip for 5 people under 5000 BDT', icon: '🗺️' },
    { text: 'Best time to visit Cox\'s Bazar', icon: '🌤️' },
    { text: 'Budget-friendly accommodation in Sylhet', icon: '🏨' },
    { text: 'Top attractions in Sajek Valley', icon: '🏔️' },
    { text: 'Transport options from Dhaka to Sundarbans', icon: '🚌' },
    { text: 'Packing list for hill tracts', icon: '🎒' }
  ]

  return (
    <>
      <main className="ai-assistant-page">
        <div className="ai-assistant-container">
          {/* Sidebar - Conversation History */}
          <aside className="ai-sidebar">
            <div className="ai-sidebar-header">
              <h2>Chat History</h2>
              <button className="btn-new-chat" onClick={handleNewConversation}>
                + New Chat
              </button>
            </div>
            <div className="ai-conversations-list">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`ai-conversation-item${currentConversation?.id === conv.id ? ' active' : ''}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="conv-preview">
                    {conv.messages && conv.messages.length > 0 ? (
                      conv.messages[conv.messages.length - 1].content.substring(0, 50) + '...'
                    ) : (
                      'New conversation'
                    )}
                  </div>
                  <small>{new Date(conv.updated_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Chat Area */}
          <div className="ai-chat-area">
            {/* Header */}
            <header className="ai-chat-header">
              <div className="ai-header-left">
                <h1>AI Travel Assistant</h1>
                <span className="ai-language-toggle">
                  <button
                    className={language === 'en' ? 'active' : ''}
                    onClick={() => setLanguage('en')}
                  >
                    English
                  </button>
                  <button
                    className={language === 'bn' ? 'active' : ''}
                    onClick={() => setLanguage('bn')}
                  >
                    বাংলা
                  </button>
                </span>
              </div>
              <div className="ai-header-right">
                <button className="btn-save-itinerary">Save Itinerary</button>
              </div>
            </header>

            {/* Messages */}
            <div className="ai-messages-container">
              {messages.length === 0 ? (
                <div className="ai-welcome">
                  <div className="ai-welcome-icon">🤖</div>
                  <h2>Welcome to TripoBD AI Assistant</h2>
                  <p>I can help you with:</p>
                  <ul>
                    <li>🗺️ Destination recommendations</li>
                    <li>📅 Itinerary planning</li>
                    <li>💰 Budget estimation</li>
                    <li>🚌 Transport advice</li>
                    <li>🎒 Packing lists</li>
                    <li>🌤️ Weather tips</li>
                    <li>🍽️ Local food guide</li>
                  </ul>
                  <p>Try one of these quick prompts or ask me anything about travel in Bangladesh!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`ai-message${msg.role === 'user' ? ' user' : ' assistant'}`}
                  >
                    <div className="message-avatar">
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                      <p>{msg.content}</p>
                      {msg.role === 'assistant' && (
                        <div className="message-feedback">
                          <button className="btn-feedback">👍</button>
                          <button className="btn-feedback">👎</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="ai-message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length === 0 && (
              <div className="ai-quick-prompts">
                <p>Quick prompts:</p>
                <div className="quick-prompts-grid">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="quick-prompt-btn"
                      onClick={() => setInputMessage(prompt.text)}
                    >
                      <span className="prompt-icon">{prompt.icon}</span>
                      <span className="prompt-text">{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="ai-input-area">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about travel in Bangladesh..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                rows={1}
              />
              <button
                className="btn-send"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .ai-assistant-page {
          padding: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .ai-assistant-container {
          display: flex;
          flex: 1;
          height: 100%;
          overflow: hidden;
        }

        /* Sidebar */
        .ai-sidebar {
          width: 300px;
          background: #1f2937;
          color: white;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #374151;
        }

        .ai-sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ai-sidebar-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .btn-new-chat {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-new-chat:hover {
          background: #2563eb;
        }

        .ai-conversations-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .ai-conversation-item {
          padding: 1rem;
          background: #374151;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ai-conversation-item:hover {
          background: #4b5563;
        }

        .ai-conversation-item.active {
          background: #3b82f6;
        }

        .conv-preview {
          font-size: 0.875rem;
          color: #d1d5db;
          margin-bottom: 0.5rem;
        }

        .ai-conversation-item small {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* Chat Area */
        .ai-chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
        }

        .ai-chat-header {
          padding: 1rem 2rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
        }

        .ai-header-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .ai-header-left h1 {
          margin: 0;
          font-size: 1.5rem;
          color: #1f2937;
        }

        .ai-language-toggle {
          display: flex;
          gap: 0.5rem;
        }

        .ai-language-toggle button {
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background 0.2s;
        }

        .ai-language-toggle button:hover {
          background: #e5e7eb;
        }

        .ai-language-toggle button.active {
          background: #3b82f6;
          color: white;
        }

        .btn-save-itinerary {
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-save-itinerary:hover {
          background: #059669;
        }

        /* Messages Container */
        .ai-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .ai-welcome {
          text-align: center;
          padding: 3rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .ai-welcome-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .ai-welcome h2 {
          margin: 0 0 1rem 0;
          font-size: 2rem;
          color: #1f2937;
        }

        .ai-welcome p {
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .ai-welcome ul {
          text-align: left;
          list-style: none;
          padding: 0;
          margin: 1.5rem 0;
        }

        .ai-welcome li {
          padding: 0.75rem 0;
          color: #4b5563;
          font-size: 1rem;
        }

        .ai-message {
          display: flex;
          gap: 1rem;
          max-width: 80%;
        }

        .ai-message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .ai-message.assistant {
          align-self: flex-start;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .ai-message.user .message-avatar {
          background: #3b82f6;
        }

        .ai-message.assistant .message-avatar {
          background: #f3f4f6;
        }

        .message-content {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          line-height: 1.6;
        }

        .ai-message.user .message-content {
          background: #3b82f6;
          color: white;
        }

        .ai-message.assistant .message-content {
          background: #f3f4f6;
          color: #1f2937;
        }

        .message-content p {
          margin: 0;
        }

        .message-feedback {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .btn-feedback {
          padding: 0.25rem 0.5rem;
          background: #e5e7eb;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
        }

        .btn-feedback:hover {
          background: #d1d5db;
        }

        .typing-indicator {
          display: flex;
          gap: 0.25rem;
          padding: 0.5rem 0;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: 0s;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }

        /* Quick Prompts */
        .ai-quick-prompts {
          padding: 1.5rem 2rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .ai-quick-prompts p {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .quick-prompts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0.75rem;
        }

        .quick-prompt-btn {
          padding: 0.75rem 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          text-align: left;
          transition: all 0.2s;
        }

        .quick-prompt-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .prompt-icon {
          font-size: 1.25rem;
        }

        .prompt-text {
          color: #4b5563;
        }

        /* Input Area */
        .ai-input-area {
          padding: 1.5rem 2rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 1rem;
          align-items: flex-end;
          background: white;
        }

        .ai-input-area textarea {
          flex: 1;
          padding: 0.875rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          resize: none;
          min-height: 50px;
          max-height: 150px;
          transition: border-color 0.2s;
        }

        .ai-input-area textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .btn-send {
          padding: 0.875rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: background 0.2s;
          height: 50px;
        }

        .btn-send:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-send:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ai-sidebar {
            display: none;
          }
          
          .ai-chat-header {
            padding: 1rem;
          }
          
          .ai-header-left {
            gap: 1rem;
          }
          
          .ai-header-left h1 {
            font-size: 1.25rem;
          }
          
          .ai-messages-container {
            padding: 1rem;
          }
          
          .ai-message {
            max-width: 95%;
          }
          
          .ai-quick-prompts,
          .ai-input-area {
            padding: 1rem;
          }
          
          .quick-prompts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}