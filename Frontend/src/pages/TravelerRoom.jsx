import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import './TravelerRoom.css'

export default function TravelerRoom() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [tourRooms, setTourRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [activeTab, setActiveTab] = useState('rooms')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const userId = searchParams.get('user_id')

  useEffect(() => {
    fetchTourRooms()
  }, [userId])

  const fetchTourRooms = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/tour-rooms/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setTourRooms(data)
      }
    } catch (err) {
      console.error('Failed to fetch tour rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async (roomData) => {
    try {
      const response = await fetch('http://localhost:8000/api/tour-rooms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roomData, created_by: userId })
      })
      const data = await response.json()
      if (response.ok) {
        setTourRooms([data, ...tourRooms])
        setShowCreateModal(false)
        setCurrentRoom(data)
        setActiveTab('itinerary')
      }
    } catch (err) {
      alert('Failed to create tour room')
    }
  }

  const handleJoinRoom = async (roomId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/tour-rooms/${roomId}/join/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      if (response.ok) {
        fetchTourRooms()
      }
    } catch (err) {
      alert('Failed to join tour room')
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <main className="tour-room-page">
      <div className="tour-room-container">
        {/* Header */}
        <header className="tour-room-header">
          <h1>Tour Rooms</h1>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create Tour Room
          </button>
        </header>

        {/* Room List */}
        {activeTab === 'rooms' && (
          <div className="rooms-section">
            {tourRooms.length > 0 ? (
              <div className="rooms-grid">
                {tourRooms.map(room => (
                  <div key={room.id} className="room-card">
                    <div className="room-cover">
                      {room.cover_photo ? (
                        <img src={room.cover_photo} alt={room.name} />
                      ) : (
                        <div className="room-placeholder">{room.destination.charAt(0)}</div>
                      )}
                      <span className={`room-type ${room.room_type}`}>{room.room_type}</span>
                    </div>
                    <div className="room-info">
                      <h3>{room.name}</h3>
                      <p>📍 {room.destination}</p>
                      <p>📅 {room.start_date} - {room.end_date}</p>
                      <p>👥 {room.member_count}/{room.max_members} members</p>
                      <div className="room-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => { setCurrentRoom(room); setActiveTab('itinerary') }}
                        >
                          Open Room
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🗺️</div>
                <h2>No Tour Rooms Yet</h2>
                <p>Create a tour room to start planning your group trip with friends!</p>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                  Create Your First Tour Room
                </button>
              </div>
            )}
          </div>
        )}

        {/* Room Detail View */}
        {currentRoom && (
          <div className="room-detail">
            <div className="room-detail-header">
              <button className="btn-back" onClick={() => { setCurrentRoom(null); setActiveTab('rooms') }}>
                ← Back to Rooms
              </button>
              <div className="room-title-section">
                <h2>{currentRoom.name}</h2>
                <p>{currentRoom.destination} • {currentRoom.start_date} - {currentRoom.end_date}</p>
              </div>
            </div>

            {/* Room Tabs */}
            <div className="room-tabs">
              <button className={`room-tab ${activeTab === 'itinerary' ? 'active' : ''}`} onClick={() => setActiveTab('itinerary')}>
                📅 Itinerary
              </button>
              <button className={`room-tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
                💰 Expenses
              </button>
              <button className={`room-tab ${activeTab === 'polls' ? 'active' : ''}`} onClick={() => setActiveTab('polls')}>
                📊 Polls
              </button>
              <button className={`room-tab ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>
                ✅ Checklist
              </button>
              <button className={`room-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                💬 Chat
              </button>
              <button className={`room-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
                👥 Members
              </button>
              <button className={`room-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                ⚙️ Settings
              </button>
            </div>

            {/* Tab Content */}
            <div className="room-tab-content">
              {activeTab === 'itinerary' && <ItineraryTab room={currentRoom} userId={userId} />}
              {activeTab === 'expenses' && <ExpensesTab room={currentRoom} userId={userId} />}
              {activeTab === 'polls' && <PollsTab room={currentRoom} userId={userId} />}
              {activeTab === 'checklist' && <ChecklistTab room={currentRoom} userId={userId} />}
              {activeTab === 'chat' && <ChatTab room={currentRoom} userId={userId} />}
              {activeTab === 'members' && <MembersTab room={currentRoom} userId={userId} />}
              {activeTab === 'settings' && <SettingsTab room={currentRoom} userId={userId} />}
            </div>
          </div>
        )}

        {/* Create Room Modal */}
        {showCreateModal && (
          <CreateRoomModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateRoom}
          />
        )}
      </div>
    </main>
  )
}

// Tab Components
function ItineraryTab({ room, userId }) {
  const [itineraryItems, setItineraryItems] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchItinerary()
  }, [room.id])

  const fetchItinerary = async () => {
    // In production, fetch from API
    setItineraryItems([
      { id: 1, day: 1, activity: 'Arrival and Check-in', time: '10:00', location: 'Hotel', notes: '' },
      { id: 2, day: 1, activity: 'Explore Local Area', time: '14:00', location: 'City Center', notes: '' },
    ])
  }

  return (
    <div className="tab-content itinerary-tab">
      <div className="tab-header">
        <h3>Collaborative Itinerary</h3>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Activity
        </button>
      </div>
      <div className="itinerary-list">
        {itineraryItems.map(item => (
          <div key={item.id} className="itinerary-item">
            <div className="itinerary-day">Day {item.day}</div>
            <div className="itinerary-details">
              <h4>{item.activity}</h4>
              <p>⏰ {item.time} • 📍 {item.location}</p>
              {item.notes && <p className="notes">{item.notes}</p>}
            </div>
            <div className="itinerary-actions">
              <button className="btn-icon">✏️</button>
              <button className="btn-icon">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExpensesTab({ room, userId }) {
  const [expenses, setExpenses] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchExpenses()
  }, [room.id])

  const fetchExpenses = async () => {
    // In production, fetch from API
    setExpenses([
      { id: 1, description: 'Hotel Booking', amount: 5000, paid_by: 'User1', date: '2025-06-15' },
      { id: 2, description: 'Transport', amount: 2000, paid_by: 'User2', date: '2025-06-15' },
    ])
  }

  return (
    <div className="tab-content expenses-tab">
      <div className="tab-header">
        <h3>Cost Splitter</h3>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Expense
        </button>
      </div>
      <div className="expenses-summary">
        <div className="summary-card">
          <span className="label">Total Expenses</span>
          <span className="value">৳7,000</span>
        </div>
        <div className="summary-card">
          <span className="label">Your Share</span>
          <span className="value">৳3,500</span>
        </div>
      </div>
      <div className="expenses-list">
        {expenses.map(expense => (
          <div key={expense.id} className="expense-item">
            <div className="expense-info">
              <h4>{expense.description}</h4>
              <p>💳 Paid by {expense.paid_by} • 📅 {expense.date}</p>
            </div>
            <div className="expense-amount">৳{expense.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PollsTab({ room, userId }) {
  const [polls, setPolls] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchPolls()
  }, [room.id])

  const fetchPolls = async () => {
    // In production, fetch from API
    setPolls([
      { id: 1, question: 'Which hotel should we book?', options: ['Hotel A', 'Hotel B', 'Hotel C'], votes: [3, 2, 1] },
    ])
  }

  return (
    <div className="tab-content polls-tab">
      <div className="tab-header">
        <h3>Group Polls</h3>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Poll
        </button>
      </div>
      <div className="polls-list">
        {polls.map(poll => (
          <div key={poll.id} className="poll-item">
            <h4>{poll.question}</h4>
            <div className="poll-options">
              {poll.options.map((option, index) => (
                <div key={index} className="poll-option">
                  <span>{option}</span>
                  <div className="poll-bar">
                    <div className="poll-fill" style={{ width: `${(poll.votes[index] / poll.votes.reduce((a, b) => a + b, 0)) * 100}%` }}></div>
                  </div>
                  <span>{poll.votes[index]} votes</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChecklistTab({ room, userId }) {
  const [checklistItems, setChecklistItems] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchChecklist()
  }, [room.id])

  const fetchChecklist = async () => {
    // In production, fetch from API
    setChecklistItems([
      { id: 1, item: 'Passport', assigned_to: 'User1', completed: true },
      { id: 2, item: 'Sunscreen', assigned_to: 'User2', completed: false },
      { id: 3, item: 'First Aid Kit', assigned_to: null, completed: false },
    ])
  }

  const toggleComplete = (id) => {
    setChecklistItems(items => items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const completedCount = checklistItems.filter(i => i.completed).length
  const progress = (completedCount / checklistItems.length) * 100

  return (
    <div className="tab-content checklist-tab">
      <div className="tab-header">
        <h3>Trip Checklist</h3>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Item
        </button>
      </div>
      <div className="checklist-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <span>{completedCount}/{checklistItems.length} completed</span>
      </div>
      <div className="checklist-list">
        {checklistItems.map(item => (
          <div key={item.id} className={`checklist-item ${item.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleComplete(item.id)}
            />
            <span className="item-text">{item.item}</span>
            {item.assigned_to && <span className="assigned-to">👤 {item.assigned_to}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatTab({ room, userId }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')

  useEffect(() => {
    // In production, connect to WebSocket
    setMessages([
      { id: 1, user: 'User1', message: 'Hey everyone! Excited for the trip!', time: '10:00' },
      { id: 2, user: 'User2', message: 'Me too! Can\'t wait to explore.', time: '10:05' },
    ])
  }, [room.id])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return
    setMessages([...messages, { id: messages.length + 1, user: 'You', message: inputMessage, time: new Date().toLocaleTimeString() }])
    setInputMessage('')
  }

  return (
    <div className="tab-content chat-tab">
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.user === 'You' ? 'own' : ''}`}>
            <div className="message-header">
              <span className="message-user">{msg.user}</span>
              <span className="message-time">{msg.time}</span>
            </div>
            <p>{msg.message}</p>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button className="btn-send" onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  )
}

function MembersTab({ room, userId }) {
  const [members, setMembers] = useState([])

  useEffect(() => {
    fetchMembers()
  }, [room.id])

  const fetchMembers = async () => {
    // In production, fetch from API
    setMembers([
      { id: 1, name: 'User1', role: 'owner', avatar: 'U1' },
      { id: 2, name: 'User2', role: 'admin', avatar: 'U2' },
      { id: 3, name: 'User3', role: 'member', avatar: 'U3' },
    ])
  }

  return (
    <div className="tab-content members-tab">
      <div className="tab-header">
        <h3>Room Members ({room.member_count}/{room.max_members})</h3>
        <button className="btn-primary">+ Invite Members</button>
      </div>
      <div className="members-list">
        {members.map(member => (
          <div key={member.id} className="member-item">
            <div className="member-avatar">{member.avatar}</div>
            <div className="member-info">
              <h4>{member.name}</h4>
              <span className={`member-role ${member.role}`}>{member.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsTab({ room, userId }) {
  return (
    <div className="tab-content settings-tab">
      <div className="tab-header">
        <h3>Room Settings</h3>
      </div>
      <div className="settings-section">
        <h4>Room Details</h4>
        <div className="setting-item">
          <label>Room Name</label>
          <input type="text" defaultValue={room.name} />
        </div>
        <div className="setting-item">
          <label>Destination</label>
          <input type="text" defaultValue={room.destination} />
        </div>
        <div className="setting-item">
          <label>Travel Dates</label>
          <div className="date-inputs">
            <input type="date" defaultValue={room.start_date} />
            <input type="date" defaultValue={room.end_date} />
          </div>
        </div>
        <button className="btn-primary">Save Changes</button>
      </div>
      <div className="settings-section danger">
        <h4>Danger Zone</h4>
        <button className="btn-danger">Leave Room</button>
        <button className="btn-danger">Delete Room</button>
      </div>
    </div>
  )
}

function CreateRoomModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    start_date: '',
    end_date: '',
    max_members: 10,
    room_type: 'private'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Create Tour Room</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Room Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Destination</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Max Members</label>
            <input
              type="number"
              value={formData.max_members}
              onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
              min="2"
              max="50"
              required
            />
          </div>
          <div className="form-group">
            <label>Room Type</label>
            <select
              value={formData.room_type}
              onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
            >
              <option value="private">Private (Invite Only)</option>
              <option value="public">Public (Anyone Can Join)</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create Room</button>
          </div>
        </form>
      </div>
    </div>
  )
}
