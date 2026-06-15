import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import apiClient from '../apiClient'
import './traveler-room.css'

export default function TravelerRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [room, setRoom] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showItineraryModal, setShowItineraryModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showPollModal, setShowPollModal] = useState(false)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)

  // Feature-specific states
  const [itineraryItems, setItineraryItems] = useState([])
  const [expenses, setExpenses] = useState([])
  const [polls, setPolls] = useState([])
  const [checklistItems, setChecklistItems] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [mapPins, setMapPins] = useState([])
  const [bookingNotes, setBookingNotes] = useState([])

  // Form states
  const [newRoom, setNewRoom] = useState({
    name: '',
    destination: '',
    start_datetime: '',
    end_datetime: '',
    description: '',
    max_members: 10,
    visibility: 'private',
    cover_photo: null
  })
  const [inviteUsername, setInviteUsername] = useState('')
  const [newMessage, setNewMessage] = useState('')

  // Form states for each feature
  const [newItineraryItem, setNewItineraryItem] = useState({
    day_number: 1,
    activity_name: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    assigned_to: null
  })
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    date: '',
    category: '',
    participants: []
  })
  const [newPoll, setNewPoll] = useState({
    question: '',
    poll_type: 'multiple_choice',
    options: [''],
    deadline: ''
  })
  const [newChecklistItem, setNewChecklistItem] = useState({
    item_name: '',
    description: '',
    assigned_to: null
  })
  const [newMapPin, setNewMapPin] = useState({
    name: '',
    latitude: '',
    longitude: '',
    description: ''
  })
  const [newBookingNote, setNewBookingNote] = useState({
    title: '',
    content: '',
    booking_reference: ''
  })

  useEffect(() => {
    if (roomId) {
      fetchRoomData()
    } else {
      fetchTourRooms()
    }
  }, [roomId])

  const fetchRoomData = async () => {
    try {
      const [roomRes, membersRes, itineraryRes, expensesRes, pollsRes, checklistRes, chatRes, mapRes, notesRes] = await Promise.all([
        apiClient.get(`/tour-rooms/${roomId}/`),
        apiClient.get(`/tour-rooms/${roomId}/members/`),
        apiClient.get(`/tour-rooms/${roomId}/itinerary/`),
        apiClient.get(`/tour-rooms/${roomId}/expenses/`),
        apiClient.get(`/tour-rooms/${roomId}/polls/`),
        apiClient.get(`/tour-rooms/${roomId}/checklist/`),
        apiClient.get(`/tour-rooms/${roomId}/chat/`),
        apiClient.get(`/tour-rooms/${roomId}/map/`),
        apiClient.get(`/tour-rooms/${roomId}/booking-notes/`)
      ])
      setRoom(roomRes.data)
      setMembers(membersRes.data)
      setItineraryItems(itineraryRes.data)
      setExpenses(expensesRes.data)
      setPolls(pollsRes.data)
      setChecklistItems(checklistRes.data)
      setChatMessages(chatRes.data)
      setMapPins(mapRes.data)
      setBookingNotes(notesRes.data)
    } catch (error) {
      console.error('Error fetching room data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTourRooms = async () => {
    try {
      const res = await apiClient.get('/tour-rooms/')
      setRoom(res.data)
    } catch (error) {
      console.error('Error fetching tour rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    
    // Check if user is authenticated
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('Please log in to create a tour room')
      navigate('/signin')
      return
    }
    
    try {
      const res = await apiClient.post('/tour-rooms/', { ...newRoom, user: userId })
      if (res && res.id) {
        setShowCreateModal(false)
        alert('Tour room created successfully!')
        setNewRoom({
          name: '',
          destination: '',
          start_datetime: '',
          end_datetime: '',
          description: '',
          max_members: 10,
          visibility: 'private',
          cover_photo: null
        })
        fetchTourRooms()
      } else if (res && res.data && res.data.id) {
        setShowCreateModal(false)
        alert('Tour room created successfully!')
        setNewRoom({
          name: '',
          destination: '',
          start_datetime: '',
          end_datetime: '',
          description: '',
          max_members: 10,
          visibility: 'private',
          cover_photo: null
        })
        fetchTourRooms()
      } else {
        console.error('Invalid response from server:', res)
        alert('Failed to create room. Please try again.')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room. Please try again.')
    }
  }

  const handleInviteMember = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post(`/tour-rooms/${roomId}/invite/`, { username: inviteUsername })
      setShowInviteModal(false)
      setInviteUsername('')
      fetchRoomData()
    } catch (error) {
      console.error('Error inviting member:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      await apiClient.post(`/tour-rooms/${roomId}/chat/`, { message: newMessage })
      setNewMessage('')
      fetchRoomData()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleToggleChecklistItem = async (itemId, isCompleted) => {
    try {
      await apiClient.put(`/tour-rooms/${roomId}/checklist/${itemId}/`, { is_completed: !isCompleted })
      fetchRoomData()
    } catch (error) {
      console.error('Error toggling checklist item:', error)
    }
  }

  const handleVotePoll = async (pollId, optionId) => {
    try {
      await apiClient.post(`/tour-rooms/${roomId}/polls/${pollId}/vote/`, { option_id: optionId })
      fetchRoomData()
    } catch (error) {
      console.error('Error voting on poll:', error)
    }
  }

  const handleCreateItineraryItem = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post(`/tour-rooms/${roomId}/itinerary/`, newItineraryItem)
      setShowItineraryModal(false)
      setNewItineraryItem({
        day_number: 1,
        activity_name: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        assigned_to: null
      })
      fetchRoomData()
    } catch (error) {
      console.error('Error creating itinerary item:', error)
    }
  }

  const handleCreateExpense = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post(`/tour-rooms/${roomId}/expenses/`, newExpense)
      setShowExpenseModal(false)
      setNewExpense({
        description: '',
        amount: '',
        date: '',
        category: '',
        participants: []
      })
      fetchRoomData()
    } catch (error) {
      console.error('Error creating expense:', error)
    }
  }

  const handleCreatePoll = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post(`/tour-rooms/${roomId}/polls/`, newPoll)
      setShowPollModal(false)
      setNewPoll({
        question: '',
        poll_type: 'multiple_choice',
        options: [''],
        deadline: ''
      })
      fetchRoomData()
    } catch (error) {
      console.error('Error creating poll:', error)
    }
  }

  const handleCreateChecklistItem = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post(`/tour-rooms/${roomId}/checklist/`, newChecklistItem)
      setShowChecklistModal(false)
      setNewChecklistItem({
        item_name: '',
        description: '',
        assigned_to: null
      })
      fetchRoomData()
    } catch (error) {
      console.error('Error creating checklist item:', error)
    }
  }

  const handleCreateMapPin = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post(`/tour-rooms/${roomId}/map/`, newMapPin)
      setShowMapModal(false)
      setNewMapPin({
        name: '',
        latitude: '',
        longitude: '',
        description: ''
      })
      fetchRoomData()
    } catch (error) {
      console.error('Error creating map pin:', error)
    }
  }

  const handleCreateBookingNote = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post(`/tour-rooms/${roomId}/booking-notes/`, newBookingNote)
      setShowBookingModal(false)
      setNewBookingNote({
        title: '',
        content: '',
        booking_reference: ''
      })
      fetchRoomData()
    } catch (error) {
      console.error('Error creating booking note:', error)
    }
  }

  const handleAddPollOption = () => {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, '']
    })
  }

  const handleRemovePollOption = (index) => {
    const newOptions = newPoll.options.filter((_, i) => i !== index)
    setNewPoll({
      ...newPoll,
      options: newOptions
    })
  }

  if (loading) {
    return <div className="page-shell">Loading...</div>
  }

  if (!roomId) {
    return (
      <main className="page-shell">
        <div className="room-header">
          <h1>Tour Rooms</h1>
          <button className="button button-primary" onClick={() => setShowCreateModal(true)}>
            Create Tour Room
          </button>
        </div>
        <div className="room-list">
          {room && room.length > 0 ? (
            room.map(r => (
              <div key={r.id} className="room-card">
                <h3>{r.name}</h3>
                <p>{r.description}</p>
                <Link to={`/traveler/room/${r.id}`} className="button button-primary">
                  View Room
                </Link>
              </div>
            ))
          ) : (
            <p>No tour rooms available. Create one to get started!</p>
          )}
        </div>

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Create Tour Room</h2>
              <form onSubmit={handleCreateRoom}>
                <div className="form-group">
                  <label>Room Name</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <input
                    type="text"
                    value={newRoom.destination}
                    onChange={(e) => setNewRoom({ ...newRoom, destination: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="datetime-local"
                    value={newRoom.start_datetime}
                    onChange={(e) => setNewRoom({ ...newRoom, start_datetime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    value={newRoom.end_datetime}
                    onChange={(e) => setNewRoom({ ...newRoom, end_datetime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Max Members</label>
                  <input
                    type="number"
                    value={newRoom.max_members}
                    onChange={(e) => setNewRoom({ ...newRoom, max_members: parseInt(e.target.value) })}
                    min="2"
                    max="50"
                  />
                </div>
                <div className="form-group">
                  <label>Visibility</label>
                  <select
                    value={newRoom.visibility}
                    onChange={(e) => setNewRoom({ ...newRoom, visibility: e.target.value })}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cover Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewRoom({ ...newRoom, cover_photo: e.target.files[0] })}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit">
                    Create Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="page-shell traveler-room">
      <div className="room-header">
        <div className="room-info">
          <h1>{room?.name}</h1>
          <p>{room?.description}</p>
          <div className="room-meta">
            <span>📅 {new Date(room?.start_datetime).toLocaleDateString()} - {new Date(room?.end_datetime).toLocaleDateString()}</span>
            <span>👥 {members.length} members</span>
            <span>🔒 {room?.visibility === 'private' ? 'Private' : 'Public'}</span>
          </div>
        </div>
        <div className="room-actions">
          <button className="button" onClick={() => setShowInviteModal(true)}>
            Invite Members
          </button>
          <button className="button" onClick={() => setShowSettingsModal(true)}>
            Settings
          </button>
        </div>
      </div>

      <div className="room-tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`tab ${activeTab === 'itinerary' ? 'active' : ''}`} onClick={() => setActiveTab('itinerary')}>
          Itinerary
        </button>
        <button className={`tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
          Expenses
        </button>
        <button className={`tab ${activeTab === 'polls' ? 'active' : ''}`} onClick={() => setActiveTab('polls')}>
          Polls
        </button>
        <button className={`tab ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>
          Checklist
        </button>
        <button className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          Chat
        </button>
        <button className={`tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
          Map
        </button>
        <button className={`tab ${activeTab === 'booking' ? 'active' : ''}`} onClick={() => setActiveTab('booking')}>
          Booking Notes
        </button>
      </div>

      <div className="room-content">
        {activeTab === 'overview' && (
          <div className="tab-content overview-tab">
            <div className="members-section">
              <h2>Members ({members.length})</h2>
              <div className="members-list">
                {members.map(member => (
                  <div key={member.id} className="member-item">
                    <div className="member-avatar">
                      {member.full_name?.charAt(0) || member.username?.charAt(0) || '?'}
                    </div>
                    <div className="member-info">
                      <h3>{member.full_name || member.username}</h3>
                      <p>@{member.username}</p>
                      {member.is_admin && <span className="badge">Admin</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="quick-stats">
              <div className="stat-card">
                <h3>{itineraryItems.length}</h3>
                <p>Itinerary Items</p>
              </div>
              <div className="stat-card">
                <h3>{expenses.length}</h3>
                <p>Expenses</p>
              </div>
              <div className="stat-card">
                <h3>{polls.length}</h3>
                <p>Active Polls</p>
              </div>
              <div className="stat-card">
                <h3>{checklistItems.filter(i => i.is_completed).length}/{checklistItems.length}</h3>
                <p>Checklist Items</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="tab-content itinerary-tab">
            <div className="tab-header">
              <h2>Collaborative Itinerary</h2>
              <button className="button button-primary" onClick={() => setShowItineraryModal(true)}>
                + Add Activity
              </button>
            </div>
            <div className="itinerary-items">
              {itineraryItems.map(item => (
                <div key={item.id} className="itinerary-item">
                  <div className="item-day">Day {item.day_number}</div>
                  <div className="item-details">
                    <h3>{item.activity_name}</h3>
                    <p>{item.description}</p>
                    <div className="item-meta">
                      {item.start_time && <span>⏰ {item.start_time} - {item.end_time}</span>}
                      {item.location && <span>📍 {item.location}</span>}
                      {item.assigned_to_username && <span>👤 {item.assigned_to_username}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="tab-content expenses-tab">
            <div className="tab-header">
              <h2>Cost Splitter</h2>
              <button className="button button-primary" onClick={() => setShowExpenseModal(true)}>
                + Add Expense
              </button>
            </div>
            <div className="expenses-list">
              {expenses.map(expense => (
                <div key={expense.id} className="expense-item">
                  <div className="expense-info">
                    <h3>{expense.description}</h3>
                    <p>💰 {expense.amount} - Paid by {expense.payer_username}</p>
                    <p>📅 {new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                  <div className="expense-participants">
                    {expense.participants.map(participant => (
                      <div key={participant.id} className="participant">
                        <span>{participant.username}</span>
                        <span>{participant.share_amount}</span>
                        <span className={participant.is_paid ? 'paid' : 'unpaid'}>
                          {participant.is_paid ? '✓ Paid' : '○ Unpaid'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="tab-content polls-tab">
            <div className="tab-header">
              <h2>Group Polls</h2>
              <button className="button button-primary" onClick={() => setShowPollModal(true)}>
                + Create Poll
              </button>
            </div>
            <div className="polls-list">
              {polls.map(poll => (
                <div key={poll.id} className="poll-item">
                  <h3>{poll.question}</h3>
                  <p>Created by {poll.created_by_username}</p>
                  {poll.deadline && <p>Deadline: {new Date(poll.deadline).toLocaleString()}</p>}
                  {poll.is_closed && <span className="badge">Closed</span>}
                  <div className="poll-options">
                    {poll.options.map(option => (
                      <div key={option.id} className="poll-option">
                        <button
                          onClick={() => !poll.is_closed && !poll.user_vote && handleVotePoll(poll.id, option.id)}
                          disabled={poll.is_closed || !!poll.user_vote}
                          className={poll.user_vote?.option_id === option.id ? 'voted' : ''}
                        >
                          {option.option_text}
                        </button>
                        <span>{option.vote_count} votes</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="tab-content checklist-tab">
            <div className="tab-header">
              <h2>Trip Checklist</h2>
              <button className="button button-primary" onClick={() => setShowChecklistModal(true)}>
                + Add Item
              </button>
            </div>
            <div className="checklist-items">
              {checklistItems.map(item => (
                <div key={item.id} className={`checklist-item ${item.is_completed ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={item.is_completed}
                    onChange={() => handleToggleChecklistItem(item.id, item.is_completed)}
                  />
                  <div className="item-content">
                    <h3>{item.item_name}</h3>
                    <p>{item.description}</p>
                    {item.assigned_to_username && <p>Assigned to: {item.assigned_to_username}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="tab-content chat-tab">
            <h2>Group Chat</h2>
            <div className="chat-messages">
              {chatMessages.map(message => (
                <div key={message.id} className={`chat-message ${message.is_pinned ? 'pinned' : ''}`}>
                  <div className="message-avatar">
                    {message.full_name?.charAt(0) || message.username?.charAt(0)}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="username">{message.full_name || message.username}</span>
                      <span className="timestamp">{new Date(message.created_at).toLocaleString()}</span>
                      {message.is_pinned && <span className="pinned-badge">📌 Pinned</span>}
                    </div>
                    <p>{message.message}</p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="message-attachments">
                        {message.attachments.map(attachment => (
                          <div key={attachment.id} className="attachment">
                            📎 {attachment.file_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit" className="button button-primary">Send</button>
            </form>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="tab-content map-tab">
            <div className="tab-header">
              <h2>Shared Map</h2>
              <button className="button button-primary" onClick={() => setShowMapModal(true)}>
                + Add Pin
              </button>
            </div>
            <div className="map-container">
              <p>Map integration coming soon - Add pins for planned stops</p>
              <div className="map-pins">
                {mapPins.map(pin => (
                  <div key={pin.id} className="map-pin">
                    <h3>{pin.name}</h3>
                    <p>{pin.description}</p>
                    <p>📍 {pin.latitude}, {pin.longitude}</p>
                    <p>Added by {pin.added_by_username}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'booking' && (
          <div className="tab-content booking-tab">
            <div className="tab-header">
              <h2>Booking Coordination Notes</h2>
              <button className="button button-primary" onClick={() => setShowBookingModal(true)}>
                + Add Note
              </button>
            </div>
            <div className="booking-notes">
              {bookingNotes.map(note => (
                <div key={note.id} className="booking-note">
                  <h3>{note.title}</h3>
                  <p>{note.content}</p>
                  {note.booking_reference && <p>Reference: {note.booking_reference}</p>}
                  <p>Added by {note.added_by_username} - {new Date(note.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Invite Member</h2>
            <form onSubmit={handleInviteMember}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="button" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Room Settings</h2>
            <div className="settings-info">
              <p>Invite Code: {room?.invite_code}</p>
              <p>Share this code with members to join the room</p>
            </div>
            <div className="form-actions">
              <button className="button" onClick={() => setShowSettingsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showItineraryModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Itinerary Item</h2>
            <form onSubmit={handleCreateItineraryItem}>
              <div className="form-group">
                <label>Day Number</label>
                <input
                  type="number"
                  value={newItineraryItem.day_number}
                  onChange={(e) => setNewItineraryItem({ ...newItineraryItem, day_number: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Activity Name</label>
                <input
                  type="text"
                  value={newItineraryItem.activity_name}
                  onChange={(e) => setNewItineraryItem({ ...newItineraryItem, activity_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newItineraryItem.description}
                  onChange={(e) => setNewItineraryItem({ ...newItineraryItem, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={newItineraryItem.start_time}
                  onChange={(e) => setNewItineraryItem({ ...newItineraryItem, start_time: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={newItineraryItem.end_time}
                  onChange={(e) => setNewItineraryItem({ ...newItineraryItem, end_time: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={newItineraryItem.location}
                  onChange={(e) => setNewItineraryItem({ ...newItineraryItem, location: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="button" onClick={() => setShowItineraryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Expense</h2>
            <form onSubmit={handleCreateExpense}>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="button" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPollModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create Poll</h2>
            <form onSubmit={handleCreatePoll}>
              <div className="form-group">
                <label>Question</label>
                <input
                  type="text"
                  value={newPoll.question}
                  onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Poll Type</label>
                <select
                  value={newPoll.poll_type}
                  onChange={(e) => setNewPoll({ ...newPoll, poll_type: e.target.value })}
                >
                  <option value="yes_no">Yes/No</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>
              <div className="form-group">
                <label>Options</label>
                {newPoll.options.map((option, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newPoll.options]
                        newOptions[index] = e.target.value
                        setNewPoll({ ...newPoll, options: newOptions })
                      }}
                      required
                    />
                    {newPoll.options.length > 1 && (
                      <button type="button" className="button" onClick={() => handleRemovePollOption(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="button" onClick={handleAddPollOption}>
                  + Add Option
                </button>
              </div>
              <div className="form-group">
                <label>Deadline (optional)</label>
                <input
                  type="datetime-local"
                  value={newPoll.deadline}
                  onChange={(e) => setNewPoll({ ...newPoll, deadline: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="button" onClick={() => setShowPollModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChecklistModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Checklist Item</h2>
            <form onSubmit={handleCreateChecklistItem}>
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  value={newChecklistItem.item_name}
                  onChange={(e) => setNewChecklistItem({ ...newChecklistItem, item_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newChecklistItem.description}
                  onChange={(e) => setNewChecklistItem({ ...newChecklistItem, description: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="button" onClick={() => setShowChecklistModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMapModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Map Pin</h2>
            <form onSubmit={handleCreateMapPin}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newMapPin.name}
                  onChange={(e) => setNewMapPin({ ...newMapPin, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={newMapPin.latitude}
                  onChange={(e) => setNewMapPin({ ...newMapPin, latitude: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={newMapPin.longitude}
                  onChange={(e) => setNewMapPin({ ...newMapPin, longitude: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newMapPin.description}
                  onChange={(e) => setNewMapPin({ ...newMapPin, description: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="button" onClick={() => setShowMapModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Add Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBookingModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Booking Note</h2>
            <form onSubmit={handleCreateBookingNote}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newBookingNote.title}
                  onChange={(e) => setNewBookingNote({ ...newBookingNote, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={newBookingNote.content}
                  onChange={(e) => setNewBookingNote({ ...newBookingNote, content: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Booking Reference (optional)</label>
                <input
                  type="text"
                  value={newBookingNote.booking_reference}
                  onChange={(e) => setNewBookingNote({ ...newBookingNote, booking_reference: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="button" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
