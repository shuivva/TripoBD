import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MapView from '../components/MapView'
import {
  getTourRooms,
  getTourRoomDetail,
  createTourRoom,
  deleteTourRoom,
  inviteToTourRoom,
  getTourRoomInvites,
  respondToTourRoomInvite,
  createTourRoomActivity,
  updateTourRoomActivity,
  deleteTourRoomActivity,
  createTourRoomExpense,
  toggleExpenseParticipantPaid,
  createTourRoomPoll,
  voteTourRoomPoll,
  createTourRoomChecklistItem,
  updateTourRoomChecklistItem,
  deleteTourRoomChecklistItem,
  getTourRoomChat,
  sendTourRoomChatMessage,
  createTourRoomMapPin,
  deleteTourRoomMapPin,
  createTourRoomBookingNote,
  updateTourRoomSettings,
} from '../apiClient'

export default function TravelerRoom() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')
  const queryParams = new URLSearchParams(window.location.search)
  const queryRoomId = queryParams.get('id')

  // List views state
  const [rooms, setRooms] = useState([])
  const [invites, setInvites] = useState([])
  const [overviewLoading, setOverviewLoading] = useState(false)

  // Current single room detail state
  const [roomDetail, setRoomDetail] = useState(null)
  const [roomLoading, setRoomLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('itinerary') // itinerary, expenses, polls, checklist, chat, map, bookings, settings
  const [editCoverPhoto, setEditCoverPhoto] = useState('')

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDestination, setNewRoomDestination] = useState('bandarban')
  const [newRoomCover, setNewRoomCover] = useState('')
  const [newRoomMaxMembers, setNewRoomMaxMembers] = useState(10)
  const [newRoomStartDate, setNewRoomStartDate] = useState('')
  const [newRoomEndDate, setNewRoomEndDate] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Sub-tab additions
  const [newActivityTitle, setNewActivityTitle] = useState('')
  const [newActivityDay, setNewActivityDay] = useState(1)
  const [newActivityDesc, setNewActivityDesc] = useState('')
  const [newActivityTime, setNewActivityTime] = useState('')
  const [newActivityNotes, setNewActivityNotes] = useState('')
  const [activitySubmitting, setActivitySubmitting] = useState(false)

  const [newExpenseDesc, setNewExpenseDesc] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpensePayer, setNewExpensePayer] = useState('')
  const [newExpenseParticipants, setNewExpenseParticipants] = useState([]) // array of member user ids
  const [expenseSubmitting, setExpenseSubmitting] = useState(false)

  const [newPollQuestion, setNewPollQuestion] = useState('')
  const [newPollOptions, setNewPollOptions] = useState(['', ''])
  const [pollSubmitting, setPollSubmitting] = useState(false)
  const [pollVotesMap, setPollVotesMap] = useState({}) // pollId -> array of optionIds checked

  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [newChecklistAssignee, setNewChecklistAssignee] = useState('')
  const [checklistSubmitting, setChecklistSubmitting] = useState(false)

  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatAttachment, setChatAttachment] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSending, setChatSending] = useState(false)

  const [newPinLabel, setNewPinLabel] = useState('')
  const [newPinDesc, setNewPinDesc] = useState('')
  const [newPinLat, setNewPinLat] = useState('')
  const [newPinLng, setNewPinLng] = useState('')
  const [pinSubmitting, setPinSubmitting] = useState(false)

  const [newBookingTitle, setNewBookingTitle] = useState('')
  const [newBookingText, setNewBookingText] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)

  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)

  const chatEndRef = useRef(null)

  // 1. Fetch Tour Rooms & Invites when in list view
  const loadOverviewData = async () => {
    if (!userId) return
    setOverviewLoading(true)
    setErrorMsg('')
    try {
      const roomsData = await getTourRooms(userId)
      setRooms(roomsData)
      const invitesData = await getTourRoomInvites(userId)
      setInvites(invitesData)
    } catch (err) {
      setErrorMsg('Failed to load tour rooms overview.')
    } finally {
      setOverviewLoading(false)
    }
  }

  // 2. Fetch Single Room Details when roomId is defined
  const loadRoomDetails = async (roomId) => {
    if (!userId || !roomId) return
    setRoomLoading(true)
    setErrorMsg('')
    try {
      const details = await getTourRoomDetail(roomId, userId)
      
      const mappedMembers = (details.members || []).map(m => ({ ...m, id: m.user_id }))
      
      // Map backend structure (nested under 'info' and mismatched keys) to what the JSX code expects
      const mappedDetails = {
        ...details.info,
        members: mappedMembers,
        user_is_admin: details.user_is_admin,
        user_is_owner: details.user_is_owner,
        activities: details.activities,
        expenses: details.expenses,
        polls: details.polls,
        checklist_items: details.checklist,
        map_pins: details.pins,
        booking_notes: details.notes,
      }
      
      setRoomDetail(mappedDetails)
      setEditCoverPhoto(mappedDetails.cover_photo || '')
      
      // default payer to traveler user id
      setNewExpensePayer(userId)
      // Default participants to all room members
      if (mappedMembers) {
        setNewExpenseParticipants(mappedMembers.map(m => m.id))
      }
    } catch (err) {
      setErrorMsg('Failed to load group tour room planner details.')
      setRoomDetail(null)
    } finally {
      setRoomLoading(false)
    }
  }

  useEffect(() => {
    if (queryRoomId) {
      loadRoomDetails(queryRoomId)
    } else {
      loadOverviewData()
      setRoomDetail(null)
    }
  }, [queryRoomId, userId])

  // 3. Chat retrieval and polling
  const loadChatMessages = async (roomId) => {
    try {
      const chat = await getTourRoomChat(roomId)
      setChatMessages(chat)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (activeTab === 'chat' && queryRoomId) {
      loadChatMessages(queryRoomId)
      // setup chat refresh timer
      const interval = setInterval(() => loadChatMessages(queryRoomId), 3000)
      return () => clearInterval(interval)
    }
  }, [activeTab, queryRoomId])

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, activeTab])

  // Handlers
  const handleCreateRoom = async (e) => {
    e.preventDefault()
    if (!newRoomName.trim() || !newRoomStartDate || !newRoomEndDate) return
    setCreateSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const payload = {
        name: newRoomName,
        destination: newRoomDestination,
        start_date: newRoomStartDate,
        end_date: newRoomEndDate,
        cover_photo: newRoomCover || 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800',
        max_members: newRoomMaxMembers,
      }
      const newRoom = await createTourRoom(userId, payload)
      setSuccessMsg('Tour Room created successfully!')
      setShowCreateModal(false)
      setNewRoomName('')
      setNewRoomCover('')
      // Go to new room
      navigate(`/traveler/room?id=${newRoom.id}`)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create tour room.')
    } finally {
      setCreateSubmitting(false)
    }
  }

  const handleDeleteRoom = async (e, roomId) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to cancel and delete this Tour Room? This will permanently remove it.')) return
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await deleteTourRoom(roomId, userId)
      setSuccessMsg('Tour Room deleted successfully!')
      loadOverviewData()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete tour room.')
    }
  }

  const handleInviteResponse = async (inviteId, accept) => {
    try {
      await respondToTourRoomInvite(inviteId, userId, accept)
      loadOverviewData()
      setSuccessMsg(accept ? 'Invite accepted!' : 'Invite declined.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Failed to process room invitation response.')
    }
  }

  // Activity Handlers
  const handleAddActivity = async (e) => {
    e.preventDefault()
    if (!newActivityTitle.trim() || !queryRoomId) return
    setActivitySubmitting(true)
    try {
      const payload = {
        title: newActivityTitle,
        day_number: newActivityDay,
        description: newActivityDesc,
        start_time: newActivityTime || null,
        notes: newActivityNotes,
      }
      await createTourRoomActivity(queryRoomId, payload)
      setNewActivityTitle('')
      setNewActivityDesc('')
      setNewActivityTime('')
      setNewActivityNotes('')
      // Reload room details
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to add itinerary activity.')
    } finally {
      setActivitySubmitting(false)
    }
  }

  const handleReorderActivity = async (activityId, currentOrder, direction) => {
    if (!queryRoomId) return
    try {
      const newOrder = direction === 'up' ? Math.max(0, currentOrder - 1) : currentOrder + 1
      await updateTourRoomActivity(activityId, { sort_order: newOrder })
      await loadRoomDetails(queryRoomId)
    } catch {
      // ignore
    }
  }

  const handleDeleteActivity = async (activityId) => {
    if (!confirm('Are you sure you want to remove this activity?')) return
    try {
      await deleteTourRoomActivity(activityId)
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to delete activity.')
    }
  }

  // Expense Handlers
  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!newExpenseDesc.trim() || !newExpenseAmount || !queryRoomId) return
    setExpenseSubmitting(true)
    try {
      const payload = {
        description: newExpenseDesc,
        amount: parseFloat(newExpenseAmount),
        payer_id: parseInt(newExpensePayer),
        participant_ids: newExpenseParticipants,
      }
      await createTourRoomExpense(queryRoomId, payload)
      setNewExpenseDesc('')
      setNewExpenseAmount('')
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to record group expense.')
    } finally {
      setExpenseSubmitting(false)
    }
  }

  const handleTogglePaid = async (participantId, isPaid) => {
    try {
      await toggleExpenseParticipantPaid(participantId, isPaid)
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to update share payment status.')
    }
  }

  // Poll Handlers
  const handlePollOptionChange = (idx, val) => {
    const next = [...newPollOptions]
    next[idx] = val
    setNewPollOptions(next)
  }

  const handleAddPollOptionField = () => {
    setNewPollOptions([...newPollOptions, ''])
  }

  const handleRemovePollOptionField = (idx) => {
    if (newPollOptions.length <= 2) return
    setNewPollOptions(newPollOptions.filter((_, i) => i !== idx))
  }

  const handleCreatePoll = async (e) => {
    e.preventDefault()
    const validOptions = newPollOptions.filter(o => o.trim())
    if (!newPollQuestion.trim() || validOptions.length < 2 || !queryRoomId) return
    setPollSubmitting(true)
    try {
      const payload = {
        creator: parseInt(userId),
        question: newPollQuestion,
        options: validOptions,
        is_multichoice: false,
      }
      await createTourRoomPoll(queryRoomId, payload)
      setNewPollQuestion('')
      setNewPollOptions(['', ''])
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to publish group poll.')
    } finally {
      setPollSubmitting(false)
    }
  }

  const handleCastVote = async (pollId) => {
    const selected = pollVotesMap[pollId] || []
    if (selected.length === 0 || !queryRoomId) return
    try {
      await voteTourRoomPoll(pollId, userId, selected)
      await loadRoomDetails(queryRoomId)
      setSuccessMsg('Vote cast successfully!')
      setTimeout(() => setSuccessMsg(''), 2000)
    } catch {
      setErrorMsg('Failed to record poll votes.')
    }
  }

  const togglePollVoteSelection = (pollId, optionId, isMulti) => {
    const current = pollVotesMap[pollId] || []
    if (isMulti) {
      const next = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId]
      setPollVotesMap({ ...pollVotesMap, [pollId]: next })
    } else {
      setPollVotesMap({ ...pollVotesMap, [pollId]: [optionId] })
    }
  }

  // Checklist Handlers
  const handleAddChecklist = async (e) => {
    e.preventDefault()
    if (!newChecklistTitle.trim() || !queryRoomId) return
    setChecklistSubmitting(true)
    try {
      const payload = {
        title: newChecklistTitle,
        assigned_to: newChecklistAssignee ? parseInt(newChecklistAssignee) : null,
      }
      await createTourRoomChecklistItem(queryRoomId, payload)
      setNewChecklistTitle('')
      setNewChecklistAssignee('')
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to add checklist item.')
    } finally {
      setChecklistSubmitting(false)
    }
  }

  const handleToggleChecklist = async (itemId, isCompleted) => {
    try {
      await updateTourRoomChecklistItem(itemId, { is_completed: isCompleted })
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to update checklist item.')
    }
  }

  const handleDeleteChecklist = async (itemId) => {
    try {
      await deleteTourRoomChecklistItem(itemId)
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to delete checklist item.')
    }
  }

  // Chat Handlers
  const handleSendChatMessage = async (e) => {
    e.preventDefault()
    if ((!chatInput.trim() && !chatAttachment.trim()) || !queryRoomId) return
    const msgText = chatInput
    const attachUrl = chatAttachment
    setChatSending(true)
    setChatInput('')
    setChatAttachment('')
    // Optimistic update: immediately show message in chat
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender: parseInt(userId),
      sender_username: localStorage.getItem('username') || 'You',
      message: msgText,
      attachment_url: attachUrl,
      created_at: new Date().toISOString(),
    }
    setChatMessages(prev => [...prev, optimisticMsg])
    try {
      await sendTourRoomChatMessage(queryRoomId, userId, msgText, attachUrl)
      await loadChatMessages(queryRoomId)
    } catch {
      setErrorMsg('Failed to send group message.')
      // Revert optimistic update on failure
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      setChatInput(msgText)
      setChatAttachment(attachUrl)
    } finally {
      setChatSending(false)
    }
  }

  // Map Handlers
  const handleAddMapPin = async (e) => {
    e.preventDefault()
    if (!newPinLabel.trim() || !newPinLat || !newPinLng || !queryRoomId) return
    setPinSubmitting(true)
    try {
      const payload = {
        label: newPinLabel,
        description: newPinDesc,
        latitude: parseFloat(newPinLat),
        longitude: parseFloat(newPinLng),
        user_id: parseInt(userId),
      }
      await createTourRoomMapPin(queryRoomId, payload)
      setNewPinLabel('')
      setNewPinDesc('')
      setNewPinLat('')
      setNewPinLng('')
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to place new marker.')
    } finally {
      setPinSubmitting(false)
    }
  }

  const handleDeleteMapPin = async (pinId) => {
    try {
      await deleteTourRoomMapPin(pinId)
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to remove marker.')
    }
  }

  // Booking Notes Handlers
  const handleAddBookingNote = async (e) => {
    e.preventDefault()
    if (!newBookingTitle.trim() || !newBookingText.trim() || !queryRoomId) return
    setBookingSubmitting(true)
    try {
      const payload = {
        title: newBookingTitle,
        confirmation_text: newBookingText,
        user_id: parseInt(userId),
      }
      await createTourRoomBookingNote(queryRoomId, payload)
      setNewBookingTitle('')
      setNewBookingText('')
      await loadRoomDetails(queryRoomId)
    } catch {
      setErrorMsg('Failed to record booking details.')
    } finally {
      setBookingSubmitting(false)
    }
  }

  // Settings Handlers
  const handleUpdateRoomSettings = async (payload) => {
    if (!queryRoomId) return
    try {
      await updateTourRoomSettings(queryRoomId, userId, payload)
      await loadRoomDetails(queryRoomId)
      setSuccessMsg('Settings updated successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings.')
    }
  }

  const handleSendRoomInvite = async (e) => {
    e.preventDefault()
    if (!inviteUsername.trim() || !queryRoomId) return
    setInviteSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await inviteToTourRoom(queryRoomId, userId, inviteUsername)
      setSuccessMsg(`Invitation sent to user ${inviteUsername}!`)
      setInviteUsername('')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to invite user.')
    } finally {
      setInviteSubmitting(false)
    }
  }

  if (!userId) {
    return (
      <main className="page-shell text-center">
        <p className="community-error">Please sign in to access Tour Rooms and planning features.</p>
        <button className="button button-primary" onClick={() => navigate('/signin')}>Sign In</button>
      </main>
    )
  }

  if (roomDetail) {
    const isOwner = roomDetail.user_is_owner
    const formattedPins = (roomDetail.map_pins || []).map(p => ({
      label: p.label,
      description: p.description || '',
      coords: [p.latitude, p.longitude]
    }))

    // Calculate split cost summaries
    const totalExpenses = (roomDetail.expenses || []).reduce((acc, curr) => acc + parseFloat(curr.amount), 0)
    const unpaidShares = (roomDetail.expenses || []).reduce((acc, exp) => {
      const userUnpaid = exp.participants.filter(p => p.user === parseInt(userId) && !p.is_paid)
      return acc + userUnpaid.reduce((s, p) => s + parseFloat(p.share_amount), 0)
    }, 0)

    // Calculate detailed outstanding lists
    const sharesToPay = []
    const sharesToCollect = []

    if (roomDetail.expenses) {
      roomDetail.expenses.forEach(exp => {
        exp.participants.forEach(part => {
          if (!part.is_paid) {
            if (part.user === parseInt(userId)) {
              sharesToPay.push({
                expenseId: exp.id,
                description: exp.description,
                amount: part.share_amount,
                payerName: exp.payer_name || exp.payer_username,
                payerUsername: exp.payer_username,
                participantShareId: part.id,
              })
            } else if (exp.payer === parseInt(userId)) {
              sharesToCollect.push({
                expenseId: exp.id,
                description: exp.description,
                amount: part.share_amount,
                debtorName: part.full_name || part.username,
                debtorUsername: part.username,
                participantShareId: part.id,
              })
            }
          }
        })
      })
    }

    // Calculate checklist completion
    const totalChecklist = roomDetail.checklist_items?.length || 0
    const completedChecklist = roomDetail.checklist_items?.filter(item => item.is_completed).length || 0
    const checklistProgress = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0

    return (
      <main className="page-shell tr-detail-shell">
        {errorMsg && <div className="profile-alert error">{errorMsg}</div>}
        {successMsg && <div className="profile-alert success">{successMsg}</div>}

        {/* Back Link and Room Cover Header */}
        <div className="tr-detail-nav">
          <Link to="/traveler/room" className="back-link-btn">➔ Back to All Rooms</Link>
          {roomDetail.is_archived && <span className="archive-badge">Archived</span>}
        </div>

        <header className="tr-header-banner" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${roomDetail.cover_photo})` }}>
          <div className="tr-header-content">
            <span className="destination-badge">📍 {roomDetail.destination?.name || 'Group Adventure'}</span>
            <h2>{roomDetail.name}</h2>
            <div className="members-summary-row">
              <span className="members-avatars">
                {(roomDetail.members || []).map((m, idx) => (
                  <span key={m.id} className="member-avatar-circle" title={m.full_name} style={{ zIndex: 10 - idx }}>
                    {m.full_name[0]}
                  </span>
                ))}
              </span>
              <span className="members-text">{(roomDetail.members || []).length} members active</span>
              <span className="invite-code-copy" onClick={() => {
                navigator.clipboard.writeText(roomDetail.invite_code || '')
                alert('Invite code copied to clipboard!')
              }} title="Copy Invite Code">
                🔑 Code: <strong>{roomDetail.invite_code}</strong> 📋
              </span>
            </div>
          </div>
        </header>

        {/* Navigation Tabs bar */}
        <nav className="tr-tabs-nav">
          {[
            { id: 'itinerary', label: '📅 Itinerary' },
            { id: 'expenses', label: `💳 Budget (${totalExpenses} ৳)` },
            { id: 'polls', label: '📊 Polls' },
            { id: 'checklist', label: `✅ Tasks (${checklistProgress}%)` },
            { id: 'chat', label: '💬 Chat' },
            { id: 'map', label: '🗺️ Map' },
            { id: 'bookings', label: '📋 Booking Notes' },
            { id: 'settings', label: '⚙️ Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tr-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Contents */}
        <section className="tr-tab-container">
          
          {/* TAB 1: ITINERARY PLANNER */}
          {activeTab === 'itinerary' && (
            <div className="tab-pane-content">
              <div className="tab-grid-split">
                <div className="planner-main-column">
                  <h3>Day-by-Day Activities</h3>
                  {(roomDetail.activities || []).length === 0 ? (
                    <p className="empty-state-text">No activities recorded. Add your first plan on the right!</p>
                  ) : (
                    <div className="activities-list-container">
                      {(roomDetail.activities || []).map((act, index) => (
                        <div key={act.id} className="activity-item-card">
                          <div className="activity-time-badge">
                            Day {act.day_number} {act.start_time ? `| ${act.start_time.substring(0, 5)}` : ''}
                          </div>
                          <div className="activity-body">
                            <h4>{act.title}</h4>
                            <p>{act.description}</p>
                            {act.notes && <div className="activity-notes-field">📝 {act.notes}</div>}
                          </div>
                          <div className="activity-actions">
                            <button className="reorder-btn" onClick={() => handleReorderActivity(act.id, act.sort_order, 'up')}>▲</button>
                            <button className="reorder-btn" onClick={() => handleReorderActivity(act.id, act.sort_order, 'down')}>▼</button>
                            <button className="delete-act-btn" onClick={() => handleDeleteActivity(act.id)}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="planner-side-form">
                  <h4>➕ Add Itinerary Activity</h4>
                  <form onSubmit={handleAddActivity} className="activity-form-container">
                    <label>
                      Activity Title
                      <input type="text" value={newActivityTitle} onChange={e => setNewActivityTitle(e.target.value)} required placeholder="e.g. Hiking Nilgiri Hills..." />
                    </label>
                    <div className="double-inputs">
                      <label>
                        Day Number
                        <input type="number" min="1" value={newActivityDay} onChange={e => setNewActivityDay(parseInt(e.target.value) || 1)} required />
                      </label>
                      <label>
                        Start Time (Optional)
                        <input type="time" value={newActivityTime} onChange={e => setNewActivityTime(e.target.value)} />
                      </label>
                    </div>
                    <label>
                      Description
                      <textarea value={newActivityDesc} onChange={e => setNewActivityDesc(e.target.value)} placeholder="Provide short plan details..." />
                    </label>
                    <label>
                      Coordinating Notes
                      <textarea value={newActivityNotes} onChange={e => setNewActivityNotes(e.target.value)} placeholder="e.g. Bring extra water bottles..." />
                    </label>
                    <button type="submit" className="button button-primary" disabled={activitySubmitting}>
                      {activitySubmitting ? 'Adding...' : 'Add Activity'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COST SPLITTER */}
          {activeTab === 'expenses' && (
            <div className="tab-pane-content">
              <div className="summary-boxes-grid">
                <div className="summary-box teal">
                  <h4>Total Pool Budget</h4>
                  <strong>{totalExpenses} ৳</strong>
                </div>
                <div className="summary-box crimson">
                  <h4>Your Unpaid Shared Bills</h4>
                  <strong>{unpaidShares} ৳</strong>
                </div>
                <div className="summary-box indigo">
                  <h4>Active Contributors</h4>
                  <strong>{(roomDetail.members || []).length} Travelers</strong>
                </div>
              </div>

              {/* Outstanding Settlements Breakdown */}
              {(sharesToPay.length > 0 || sharesToCollect.length > 0) && (
                <div className="settlements-panel">
                  <h3>Outstanding Payments Summary</h3>
                  <div className="settlements-grid">
                    <div className="settlement-col to-pay">
                      <h4>💸 You Owe ({sharesToPay.reduce((sum, s) => sum + parseFloat(s.amount), 0).toFixed(2)} ৳)</h4>
                      {sharesToPay.length === 0 ? (
                        <p className="clean-slate">You are all settled up! 🎉</p>
                      ) : (
                        <div className="settlements-list">
                          {sharesToPay.map(s => (
                            <div key={s.participantShareId} className="settlement-item">
                              <div className="settlement-info">
                                <strong>{s.amount} ৳</strong> for <em>{s.description}</em> to <strong>{s.payerName}</strong> (@{s.payerUsername})
                              </div>
                              <button
                                className="settlement-action-btn"
                                onClick={() => handleTogglePaid(s.participantShareId, true)}
                              >
                                Mark Paid
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="settlement-col to-collect">
                      <h4>💰 You Are Owed ({sharesToCollect.reduce((sum, s) => sum + parseFloat(s.amount), 0).toFixed(2)} ৳)</h4>
                      {sharesToCollect.length === 0 ? (
                        <p className="clean-slate">No pending collections. 👍</p>
                      ) : (
                        <div className="settlements-list">
                          {sharesToCollect.map(s => (
                            <div key={s.participantShareId} className="settlement-item">
                              <div className="settlement-info">
                                <strong>{s.amount} ৳</strong> for <em>{s.description}</em> from <strong>{s.debtorName}</strong> (@{s.debtorUsername})
                              </div>
                              <button
                                className="settlement-action-btn"
                                onClick={() => handleTogglePaid(s.participantShareId, true)}
                              >
                                Confirm Received
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="tab-grid-split">
                <div className="expenses-main-column">
                  <h3>Recorded Expenses</h3>
                  {(roomDetail.expenses || []).length === 0 ? (
                    <p className="empty-state-text">No expenses tracked yet.</p>
                  ) : (
                    <div className="expenses-feed">
                      {(roomDetail.expenses || []).map(exp => (
                        <div key={exp.id} className="expense-card">
                          <div className="expense-header">
                            <div>
                              <h4>{exp.description}</h4>
                              <small>Paid by <strong>{exp.payer_username === localStorage.getItem('username') ? 'You' : (exp.payer_name || exp.payer_username)}</strong> on {exp.date}</small>
                            </div>
                            <span className="expense-amt-badge">{exp.amount} ৳</span>
                          </div>
                          
                          <div className="expense-shares-list">
                            <h5>Splits Breakdown:</h5>
                            {exp.participants.map(part => (
                              <div key={part.id} className="share-participant-row">
                                <span>{part.share_amount} ৳ - {part.full_name} (@{part.username})</span>
                                {(part.user === parseInt(userId) || exp.payer === parseInt(userId)) ? (
                                  <label className="toggle-pay-checkbox">
                                    <input
                                      type="checkbox"
                                      checked={part.is_paid}
                                      onChange={(e) => handleTogglePaid(part.id, e.target.checked)}
                                    />
                                    {part.is_paid ? '✅ Paid' : (part.user === parseInt(userId) ? '⏳ Click to Pay Payer' : '⏳ Mark as Paid')}
                                  </label>
                                ) : (
                                  <span className={`share-status ${part.is_paid ? 'paid' : 'unpaid'}`}>
                                    {part.is_paid ? '✅ Paid' : '⏳ Unpaid'}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="expenses-side-form">
                  <h4>➕ Record Group Expense</h4>
                  <form onSubmit={handleAddExpense} className="expense-form-container">
                    <label>
                      Description / Item
                      <input type="text" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} required placeholder="e.g. Group Dinner at Kutum Bari..." />
                    </label>
                    <label>
                      Total Amount (৳)
                      <input type="number" step="0.01" min="0.01" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} required placeholder="Total bill amount..." />
                    </label>
                    <label>
                      Payer
                      <select value={newExpensePayer} onChange={e => setNewExpensePayer(e.target.value)} required>
                        {(roomDetail.members || []).map(m => (
                          <option key={m.id} value={m.id}>{m.full_name} ({m.username})</option>
                        ))}
                      </select>
                    </label>
                    <label className="split-checkboxes-group">
                      Split Participants (Check to include in split)
                      <div className="participants-checkbox-list">
                        {(roomDetail.members || []).map(m => (
                          <label key={m.id} className="checkbox-item-row">
                            <input
                              type="checkbox"
                              checked={newExpenseParticipants.includes(m.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewExpenseParticipants([...newExpenseParticipants, m.id])
                                } else {
                                  setNewExpenseParticipants(newExpenseParticipants.filter(id => id !== m.id))
                                }
                              }}
                            />
                            {m.full_name}
                          </label>
                        ))}
                      </div>
                    </label>
                    <button type="submit" className="button button-primary" disabled={expenseSubmitting || newExpenseParticipants.length === 0}>
                      {expenseSubmitting ? 'Recording...' : 'Add Expense & Split'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POLLS */}
          {activeTab === 'polls' && (
            <div className="tab-pane-content">
              <div className="tab-grid-split">
                <div className="polls-main-column">
                  <h3>Active Polls & Decisions</h3>
                  {(roomDetail.polls || []).length === 0 ? (
                    <p className="empty-state-text">No active group polls. Create one to vote on options!</p>
                  ) : (
                    <div className="polls-list">
                      {(roomDetail.polls || []).map(poll => {
                        const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.votes_count || 0), 0)
                        return (
                          <div key={poll.id} className="poll-item-card">
                            <h4>❓ {poll.question}</h4>
                            <small className="poll-meta">Proposed by <strong>{poll.creator?.username}</strong></small>

                            <div className="poll-options-voter">
                              {poll.options.map(opt => {
                                const votePct = totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0
                                const isSelected = (pollVotesMap[poll.id] || []).includes(opt.id)

                                return (
                                  <div key={opt.id} className="poll-option-row" onClick={() => togglePollVoteSelection(poll.id, opt.id, poll.is_multichoice)}>
                                    <div className="poll-option-checkbox">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                      />
                                      <span>{opt.text}</span>
                                    </div>
                                    <div className="poll-option-progress-track">
                                      <div className="poll-progress-bar" style={{ width: `${votePct}%` }} />
                                      <span className="poll-progress-text">{opt.votes_count} votes ({votePct}%)</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            <button
                              className="button button-secondary cast-vote-btn"
                              disabled={(pollVotesMap[poll.id] || []).length === 0}
                              onClick={() => handleCastVote(poll.id)}
                            >
                              🗳️ Submit Vote
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="polls-side-form">
                  <h4>📊 Launch New Decision Poll</h4>
                  <form onSubmit={handleCreatePoll} className="poll-form-container">
                    <label>
                      Question / Decision Prompt
                      <input type="text" value={newPollQuestion} onChange={e => setNewPollQuestion(e.target.value)} required placeholder="e.g. Which hotel should we book?" />
                    </label>
                    <div className="options-fields-list">
                      <label>Poll Options</label>
                      {newPollOptions.map((opt, idx) => (
                        <div key={idx} className="option-field-row">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                            placeholder={`Option #${idx + 1}`}
                            required
                          />
                          {newPollOptions.length > 2 && (
                            <button type="button" className="remove-option-btn" onClick={() => handleRemovePollOptionField(idx)}>×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="add-option-field-btn" onClick={handleAddPollOptionField}>
                        ➕ Add Choice Option
                      </button>
                    </div>
                    <button type="submit" className="button button-primary" disabled={pollSubmitting}>
                      {pollSubmitting ? 'Creating...' : 'Create Poll'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="tab-pane-content">
              <div className="checklist-progress-card">
                <div className="checklist-header">
                  <h4>Task Checklist Progress</h4>
                  <span>{completedChecklist} / {totalChecklist} Completed</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${checklistProgress}%` }} />
                </div>
              </div>

              <div className="tab-grid-split">
                <div className="checklist-main-column">
                  <h3>Checklist Tasks</h3>
                  {(roomDetail.checklist_items || []).length === 0 ? (
                    <p className="empty-state-text">All clear! No checklist tasks logged yet.</p>
                  ) : (
                    <div className="checklist-tasks">
                      {(roomDetail.checklist_items || []).map(item => (
                        <div key={item.id} className={`checklist-item-card ${item.is_completed ? 'completed' : ''}`}>
                          <label className="checklist-toggle-label">
                            <input
                              type="checkbox"
                              checked={item.is_completed}
                              onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                            />
                            <span className="task-title">{item.title}</span>
                          </label>
                          <div className="checklist-actions">
                            {item.assigned_to && (
                              <span className="assignee-badge">👤 {item.assigned_to.username}</span>
                            )}
                            <button className="delete-task-btn" onClick={() => handleDeleteChecklist(item.id)}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="checklist-side-form">
                  <h4>➕ Add Checklist Task</h4>
                  <form onSubmit={handleAddChecklist} className="checklist-form-container">
                    <label>
                      Task Title / Item Name
                      <input type="text" value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} required placeholder="e.g. Book return train tickets..." />
                    </label>
                    <label>
                      Assign Member (Optional)
                      <select value={newChecklistAssignee} onChange={e => setNewChecklistAssignee(e.target.value)}>
                        <option value="">-- Unassigned --</option>
                        {(roomDetail.members || []).map(m => (
                          <option key={m.id} value={m.id}>{m.full_name} ({m.username})</option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" className="button button-primary" disabled={checklistSubmitting}>
                      {checklistSubmitting ? 'Adding...' : 'Add Checklist Item'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GROUP CHAT */}
          {activeTab === 'chat' && (
            <div className="tab-pane-content tr-chat-pane">
              <div className="chat-messages-container">
                {chatMessages.length === 0 ? (
                  <div className="chat-empty-prompt">
                    <span>💬</span>
                    <p>No messages in this Tour Room yet. Type below to say hi to your co-travelers!</p>
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className={`chat-bubble-item ${msg.sender === parseInt(userId) ? 'self' : 'other'}`}>
                      <div className="chat-msg-header">
                        <strong className="sender-name">{msg.sender_username || msg.sender_name || 'Unknown'}</strong>
                        <span className="msg-time">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <div className="chat-msg-body">
                        {msg.message && <p>{msg.message}</p>}
                        {msg.attachment_url && (
                          <div className="chat-attachment-preview">
                            <img src={msg.attachment_url} alt="Attachment" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendChatMessage} className="chat-input-row-form">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type message to group..."
                />
                <input
                  type="text"
                  value={chatAttachment}
                  onChange={e => setChatAttachment(e.target.value)}
                  placeholder="Optional photo URL attachment..."
                  className="attachment-input"
                />
                <button type="submit" className="button button-primary chat-send-btn" disabled={chatSending || (!chatInput.trim() && !chatAttachment.trim())}>
                  {chatSending ? '...' : 'Send ➔'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: SHARED MAP */}
          {activeTab === 'map' && (
            <div className="tab-pane-content">
              <div className="tab-grid-split">
                <div className="map-view-column">
                  <h3>Interactive Stop Points</h3>
                  <div className="leaflet-map-wrapper">
                    <MapView pins={formattedPins} />
                  </div>
                </div>

                <div className="map-side-controls">
                  <h4>📍 Drop Stop Point Pin</h4>
                  <form onSubmit={handleAddMapPin} className="pin-form-container">
                    <label>
                      Location Name / Label
                      <input type="text" value={newPinLabel} onChange={e => setNewPinLabel(e.target.value)} required placeholder="e.g. Boga Lake camp..." />
                    </label>
                    <label>
                      Short Description
                      <input type="text" value={newPinDesc} onChange={e => setNewPinDesc(e.target.value)} placeholder="e.g. Base camp night 1" />
                    </label>
                    <div className="double-inputs">
                      <label>
                        Latitude
                        <input type="number" step="0.000001" value={newPinLat} onChange={e => setNewPinLat(e.target.value)} required placeholder="e.g. 22.1953" />
                      </label>
                      <label>
                        Longitude
                        <input type="number" step="0.000001" value={newPinLng} onChange={e => setNewPinLng(e.target.value)} required placeholder="e.g. 92.2185" />
                      </label>
                    </div>
                    <button type="submit" className="button button-primary" disabled={pinSubmitting}>
                      {pinSubmitting ? 'Placing...' : 'Drop Pin'}
                    </button>
                  </form>

                  <div className="pins-list-sidebar">
                    <h5>Placed Pins:</h5>
                    {(roomDetail.map_pins || []).length === 0 ? (
                      <p className="no-pins-text">No custom pins added yet.</p>
                    ) : (
                      <div className="pins-scroll-list">
                        {(roomDetail.map_pins || []).map(pin => (
                          <div key={pin.id} className="pin-list-item">
                            <div>
                              <h6>{pin.label}</h6>
                              <small>{pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}</small>
                            </div>
                            <button className="delete-pin-btn" onClick={() => handleDeleteMapPin(pin.id)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BOOKING NOTES */}
          {activeTab === 'bookings' && (
            <div className="tab-pane-content">
              <div className="tab-grid-split">
                <div className="notes-main-column">
                  <h3>Group Shared Bookings & Bookmarks</h3>
                  {(roomDetail.booking_notes || []).length === 0 ? (
                    <p className="empty-state-text">No shared booking or rental notes posted yet. Use the form to coordinate tickets, hotels, and guide info.</p>
                  ) : (
                    <div className="booking-notes-list">
                      {(roomDetail.booking_notes || []).map(note => (
                        <div key={note.id} className="booking-note-card">
                          <div className="note-header">
                            <h4>📁 {note.title}</h4>
                            <small>Logged by <strong>{note.added_by?.username}</strong> on {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}</small>
                          </div>
                          <div className="note-body">
                            <pre className="confirmation-pre">{note.confirmation_text}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="notes-side-form">
                  <h4>📁 Add Booking Confirmation</h4>
                  <form onSubmit={handleAddBookingNote} className="notes-form-container">
                    <label>
                      Booking Title / Description
                      <input type="text" value={newBookingTitle} onChange={e => setNewBookingTitle(e.target.value)} required placeholder="e.g. Cox Resort Booking Room 402..." />
                    </label>
                    <label>
                      Details / Confirmation Text
                      <textarea value={newBookingText} onChange={e => setNewBookingText(e.target.value)} required placeholder="Paste flight itinerary, hotel tickets, guide phone contacts..." />
                    </label>
                    <button type="submit" className="button button-primary" disabled={bookingSubmitting}>
                      {bookingSubmitting ? 'Recording...' : 'Add Shared Note'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ROOM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="tab-pane-content">
              <div className="settings-grid-panel">
                <div className="settings-section-card">
                  <h3>👥 Invite Travelers</h3>
                  <p className="settings-subtext">Add team members to collaborate on the itinerary, split expenses, and chat.</p>
                  <form onSubmit={handleSendRoomInvite} className="invite-form">
                    <label>
                      Username
                      <input
                        type="text"
                        value={inviteUsername}
                        onChange={e => setInviteUsername(e.target.value)}
                        placeholder="Enter user's exact username..."
                        required
                      />
                    </label>
                    <button type="submit" className="button button-primary" disabled={inviteSubmitting}>
                      {inviteSubmitting ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </form>
                </div>

                <>
                    <div className="settings-section-card">
                      <h3>🖼️ Change Room Banner Image</h3>
                      <p className="settings-subtext">Update the hero cover photo web address for this Tour Room.</p>
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        handleUpdateRoomSettings({ cover_photo: editCoverPhoto })
                      }} className="invite-form">
                        <label>
                          Banner Image URL
                          <input
                            type="text"
                            value={editCoverPhoto}
                            onChange={e => setEditCoverPhoto(e.target.value)}
                            placeholder="Paste banner cover image web address..."
                            required
                          />
                        </label>
                        <button type="submit" className="button button-primary">
                          Update Cover Image
                        </button>
                      </form>
                    </div>

                    <div className="settings-section-card">
                      <h3>⚙️ Room Admin Actions</h3>
                      <p className="settings-subtext">Change visibility, archive, or permanently delete this Tour Room.</p>
                      <div className="admin-actions-rows">
                      <div className="admin-toggle-row">
                        <div>
                          <strong>Archive Tour Room</strong>
                          <p>Hides this room from dashboard lists and marks itinerary as final.</p>
                        </div>
                        <button
                          className={`button ${roomDetail.is_archived ? 'button-secondary' : 'button-tertiary'}`}
                          onClick={() => handleUpdateRoomSettings({ is_archived: !roomDetail.is_archived })}
                        >
                          {roomDetail.is_archived ? 'Unarchive Room' : 'Archive Room'}
                        </button>
                      </div>

                      <div className="admin-toggle-row">
                        <div>
                          <strong>Privacy: Public Page</strong>
                          <p>Controls whether non-members can browse or read this room details.</p>
                        </div>
                        <button
                          className={`button ${roomDetail.is_public ? 'button-secondary' : 'button-tertiary'}`}
                          onClick={() => handleUpdateRoomSettings({ is_public: !roomDetail.is_public })}
                        >
                          {roomDetail.is_public ? 'Set to Private' : 'Make Public'}
                        </button>
                      </div>

                      <div className="admin-toggle-row">
                        <div>
                          <strong>Delete Tour Room</strong>
                          <p>Permanently deletes this room and all its activities, expenses, chat, and files.</p>
                        </div>
                        <button
                          className="button leave-room-danger-btn"
                          onClick={async () => {
                            if (!confirm('Are you absolutely sure you want to permanently delete this Tour Room? This cannot be undone.')) return
                            try {
                              await updateTourRoomSettings(queryRoomId, userId, { action: 'delete' })
                              navigate('/traveler/room')
                            } catch {
                              setErrorMsg('Failed to delete Tour Room. Please try again.')
                            }
                          }}
                        >
                          Delete Room
                        </button>
                      </div>
                    </div>
                  </div>
                </>

                <div className="settings-section-card">
                  <h3>🚪 Leave Tour Room</h3>
                  <p className="settings-subtext">Withdraw from this collaborative room. You will no longer view activities or split balances.</p>
                  <button
                    className="button leave-room-danger-btn"
                    onClick={async () => {
                      if (!confirm('Leave this Tour Room? This will remove your access.')) return
                      try {
                        await updateTourRoomSettings(queryRoomId, userId, { leave: true })
                        navigate('/traveler/room')
                      } catch {
                        setErrorMsg('Failed to leave room. Please try again.')
                      }
                    }}
                  >
                    Leave Room
                  </button>
                </div>
              </div>
            </div>
          )}

        </section>

        <style>{`
          .tr-detail-shell {
            margin-top: 98px !important;
            margin-left: 264px !important;
            width: calc(100% - 264px) !important;
            max-width: none !important;
            padding: 0 1.5rem 1.5rem 1.5rem !important;
            min-height: calc(100vh - 98px);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          @media (max-width: 1024px) {
            .tr-detail-shell {
              margin-left: 80px !important;
              width: calc(100% - 80px) !important;
            }
          }
          .tr-detail-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .back-link-btn {
            font-size: 0.9rem;
            font-weight: 750;
            color: #4f46e5;
            text-decoration: none;
            transition: color 0.15s;
          }
          .back-link-btn:hover {
            color: #3730a3;
          }
          .archive-badge {
            background: #fecaca;
            color: #b91c1c;
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 700;
          }

          .tr-header-banner {
            border-radius: 20px;
            background-size: cover;
            background-position: center;
            color: white;
            padding: 3.5rem 2.5rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .tr-header-content {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-width: 800px;
          }
          .destination-badge {
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 0.35rem 0.8rem;
            border-radius: 99px;
            font-size: 0.82rem;
            font-weight: 700;
          }
          .tr-header-content h2 {
            margin: 0;
            font-size: 2.2rem;
            font-weight: 850;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .members-summary-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
            text-shadow: 0 1px 2px rgba(0,0,0,0.4);
          }
          .member-avatar-circle {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #10b981;
            color: white;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.78rem;
            font-weight: 700;
            border: 2px solid white;
            margin-right: -8px;
            text-transform: uppercase;
          }
          .members-text {
            font-size: 0.9rem;
            font-weight: 600;
            margin-left: 12px;
          }
          .invite-code-copy {
            background: rgba(0, 0, 0, 0.4);
            border-radius: 8px;
            padding: 0.25rem 0.6rem;
            font-size: 0.82rem;
            cursor: pointer;
            transition: background 0.15s;
          }
          .invite-code-copy:hover {
            background: rgba(0,0,0,0.6);
          }

          /* Tabs style */
          .tr-tabs-nav {
            display: flex;
            gap: 0.4rem;
            border-bottom: 1.5px solid #e2e8f0;
            padding-bottom: 0.4rem;
            overflow-x: auto;
          }
          .tr-tab-btn {
            background: transparent;
            border: none;
            padding: 0.6rem 1.1rem;
            font-size: 0.9rem;
            font-weight: 750;
            color: #64748b;
            cursor: pointer;
            border-radius: 10px;
            white-space: nowrap;
            transition: all 0.2s;
          }
          .tr-tab-btn:hover {
            background: #f1f5f9;
            color: #1e293b;
          }
          .tr-tab-btn.active {
            background: #e0e7ff;
            color: #4338ca;
          }

          .tr-tab-container {
            background: white;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            padding: 1.5rem;
            min-height: 400px;
          }

          .tab-grid-split {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 2rem;
          }
          @media (max-width: 900px) {
            .tab-grid-split {
              grid-template-columns: 1fr;
            }
          }

          /* Forms general */
          .activity-form-container,
          .expense-form-container,
          .poll-form-container,
          .checklist-form-container,
          .pin-form-container,
          .notes-form-container {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
          }
          .activity-form-container label,
          .expense-form-container label,
          .poll-form-container label,
          .checklist-form-container label,
          .pin-form-container label,
          .notes-form-container label {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            font-size: 0.82rem;
            font-weight: 700;
            color: #475569;
          }
          .activity-form-container input,
          .activity-form-container select,
          .activity-form-container textarea,
          .expense-form-container input,
          .expense-form-container select,
          .expense-form-container textarea,
          .poll-form-container input,
          .poll-form-container select,
          .checklist-form-container input,
          .checklist-form-container select,
          .pin-form-container input,
          .notes-form-container input,
          .notes-form-container textarea {
            padding: 0.6rem 0.8rem;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            font-size: 0.88rem;
            outline: none;
            background: white;
            transition: border-color 0.15s;
          }
          .activity-form-container input:focus,
          .expense-form-container input:focus,
          .poll-form-container input:focus,
          .checklist-form-container input:focus {
            border-color: #4f46e5;
          }
          .double-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }

          /* Activities */
          .activities-list-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .activity-item-card {
            border: 1.5px solid #f1f5f9;
            border-radius: 12px;
            padding: 1rem;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            position: relative;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.01);
            transition: all 0.2s;
          }
          .activity-item-card:hover {
            transform: translateY(-2px);
            border-color: #e2e8f0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          }
          .activity-time-badge {
            background: #e0f2fe;
            color: #0369a1;
            font-size: 0.72rem;
            font-weight: 800;
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            white-space: nowrap;
          }
          .activity-body {
            flex: 1;
          }
          .activity-body h4 {
            margin: 0 0 0.35rem 0;
            font-size: 1.05rem;
            color: #0f172a;
            font-weight: 800;
          }
          .activity-body p {
            margin: 0 0 0.5rem 0;
            font-size: 0.88rem;
            color: #475569;
          }
          .activity-notes-field {
            font-size: 0.8rem;
            color: #64748b;
            font-style: italic;
          }
          .activity-actions {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .reorder-btn {
            background: #f1f5f9;
            border: none;
            cursor: pointer;
            width: 24px;
            height: 24px;
            font-size: 0.65rem;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
          }
          .reorder-btn:hover {
            background: #cbd5e1;
          }
          .delete-act-btn {
            background: #fee2e2;
            color: #ef4444;
            border: none;
            cursor: pointer;
            width: 24px;
            height: 24px;
            font-size: 0.95rem;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
          }
          .delete-act-btn:hover {
            background: #fca5a5;
          }

          /* Expenses */
          .summary-boxes-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .summary-box {
            padding: 1.25rem;
            border-radius: 14px;
            color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          }
          .summary-box.teal { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); }
          .summary-box.crimson { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); }
          .summary-box.indigo { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); }
          .summary-box h4 { margin: 0 0 0.4rem; font-size: 0.82rem; text-transform: uppercase; font-weight: 700; opacity: 0.85; }
          .summary-box strong { font-size: 1.6rem; font-weight: 850; }

          .expenses-feed {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }
          .expense-card {
            border: 1.5px solid #f1f5f9;
            border-radius: 14px;
            padding: 1.25rem;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.01);
          }
          .expense-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 0.75rem;
            margin-bottom: 0.75rem;
          }
          .expense-header h4 { margin: 0 0 0.25rem; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
          .expense-header small { color: #64748b; font-size: 0.8rem; }
          .expense-amt-badge {
            font-size: 1.25rem;
            font-weight: 850;
            color: #0d9488;
            background: #ccfbf1;
            padding: 0.35rem 0.75rem;
            border-radius: 8px;
          }
          .expense-shares-list {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
          }
          .expense-shares-list h5 { margin: 0 0 0.25rem; font-size: 0.85rem; font-weight: 800; color: #475569; }
          .share-participant-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.82rem;
            padding: 0.35rem 0.6rem;
            background: #f8fafc;
            border-radius: 8px;
          }
          .toggle-pay-checkbox {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            font-weight: 700;
            color: #ef4444;
            cursor: pointer;
          }
          .share-status {
            font-weight: 700;
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
          }
          .share-status.paid { color: #059669; background: #d1fae5; }
          .share-status.unpaid { color: #ef4444; background: #fee2e2; }

          /* Settlements Panel */
          .settlements-panel {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 16px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04);
          }
          .settlements-panel h3 {
            margin: 0 0 1rem;
            font-size: 1.1rem;
            font-weight: 800;
            color: #0f172a;
          }
          .settlements-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }
          @media (max-width: 768px) {
            .settlements-grid {
              grid-template-columns: 1fr;
            }
          }
          .settlement-col {
            padding: 1rem;
            border-radius: 12px;
            background: rgba(248, 250, 252, 0.6);
            border: 1px solid rgba(241, 245, 249, 0.8);
          }
          .settlement-col h4 {
            margin: 0 0 0.75rem;
            font-size: 0.9rem;
            font-weight: 750;
            color: #334155;
          }
          .settlements-list {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
            max-height: 200px;
            overflow-y: auto;
          }
          .settlement-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0.75rem;
            background: white;
            border: 1px solid #f1f5f9;
            border-radius: 8px;
            font-size: 0.82rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.01);
          }
          .settlement-info {
            color: #475569;
            line-height: 1.35;
            padding-right: 0.5rem;
          }
          .settlement-info strong {
            color: #0f172a;
          }
          .clean-slate {
            font-size: 0.82rem;
            color: #64748b;
            margin: 0.5rem 0;
            font-style: italic;
          }
          .settlement-action-btn {
            background: #10b981;
            color: white;
            border: none;
            padding: 0.35rem 0.7rem;
            font-size: 0.75rem;
            font-weight: 750;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          }
          .settlement-action-btn:hover {
            background: #059669;
            transform: translateY(-1px);
          }
          .settlement-action-btn:active {
            transform: translateY(0);
          }

          .split-checkboxes-group {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
          }
          .participants-checkbox-list {
            max-height: 120px;
            overflow-y: auto;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 0.5rem;
            background: white;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          }
          .checkbox-item-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600 !important;
            font-size: 0.82rem;
            color: #334155;
          }

          /* Polls */
          .poll-item-card {
            border: 1.5px solid #f1f5f9;
            border-radius: 14px;
            padding: 1.25rem;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.01);
            margin-bottom: 1rem;
          }
          .poll-item-card h4 { margin: 0 0 0.25rem; font-size: 1.05rem; font-weight: 800; color: #0f172a; }
          .poll-meta { font-size: 0.78rem; color: #94a3b8; margin-bottom: 1rem; display: block; }
          .poll-options-voter {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
            margin-bottom: 1rem;
          }
          .poll-option-row {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 8px;
            transition: background 0.15s;
          }
          .poll-option-row:hover { background: #f8fafc; }
          .poll-option-checkbox {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 650;
            font-size: 0.88rem;
            color: #334155;
          }
          .poll-option-progress-track {
            height: 18px;
            background: #f1f5f9;
            border-radius: 4px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            padding-left: 0.5rem;
          }
          .poll-progress-bar {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            background: #bae6fd;
            z-index: 1;
            transition: width 0.3s;
          }
          .poll-progress-text {
            position: relative;
            z-index: 2;
            font-size: 0.72rem;
            font-weight: 750;
            color: #0369a1;
          }
          .option-field-row {
            display: flex;
            gap: 0.4rem;
            align-items: center;
            margin-bottom: 0.4rem;
          }
          .option-field-row input { flex: 1; }
          .remove-option-btn {
            background: #fee2e2;
            color: #ef4444;
            border: none;
            border-radius: 6px;
            width: 28px;
            height: 28px;
            cursor: pointer;
            font-size: 1.1rem;
            font-weight: 700;
          }
          .add-option-field-btn {
            background: transparent;
            border: 1px dashed #4f46e5;
            color: #4f46e5;
            padding: 0.4rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.78rem;
            font-weight: 750;
            text-align: center;
            margin-top: 0.25rem;
          }

          /* Checklist */
          .checklist-progress-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
          }
          .checklist-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
            font-weight: 750;
            font-size: 0.92rem;
            color: #475569;
          }
          .progress-bar-container {
            height: 8px;
            background: #e2e8f0;
            border-radius: 99px;
            overflow: hidden;
          }
          .progress-bar-fill {
            height: 100%;
            background: #10b981;
            transition: width 0.3s;
          }
          .checklist-tasks {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
          }
          .checklist-item-card {
            border: 1px solid #f1f5f9;
            border-radius: 10px;
            padding: 0.8rem 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.01);
          }
          .checklist-item-card.completed .task-title {
            text-decoration: line-through;
            color: #94a3b8;
          }
          .checklist-toggle-label {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            font-weight: 650;
            font-size: 0.9rem;
            color: #334155;
            cursor: pointer;
          }
          .checklist-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .assignee-badge {
            background: #f1f5f9;
            color: #475569;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
          }
          .delete-task-btn {
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 1.25rem;
            cursor: pointer;
          }
          .delete-task-btn:hover { color: #ef4444; }

          /* Group Chat */
          .tr-chat-pane {
            display: flex;
            flex-direction: column;
            height: 480px;
          }
          .chat-messages-container {
            flex: 1;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1rem;
            background: #fafafa;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .chat-empty-prompt {
            text-align: center;
            color: #94a3b8;
            margin-top: 5rem;
          }
          .chat-empty-prompt span { font-size: 2.5rem; display: block; }
          .chat-bubble-item {
            display: flex;
            flex-direction: column;
            max-width: 75%;
            padding: 0.6rem 0.85rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }
          .chat-bubble-item.self {
            align-self: flex-end;
            background: #e0e7ff;
            border-top-right-radius: 2px;
          }
          .chat-bubble-item.other {
            align-self: flex-start;
            background: white;
            border: 1px solid #e2e8f0;
            border-top-left-radius: 2px;
          }
          .chat-msg-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.25rem;
          }
          .sender-name { font-size: 0.78rem; font-weight: 800; color: #4338ca; }
          .chat-bubble-item.self .sender-name { color: #312e81; }
          .msg-time { font-size: 0.68rem; color: #94a3b8; }
          .chat-msg-body p { margin: 0; font-size: 0.88rem; line-height: 1.4; color: #1e293b; }
          .chat-attachment-preview {
            margin-top: 0.5rem;
            max-width: 100%;
            border-radius: 6px;
            overflow: hidden;
          }
          .chat-attachment-preview img {
            max-width: 200px;
            max-height: 150px;
            object-fit: cover;
          }
          .chat-input-row-form {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.75rem;
          }
          .chat-input-row-form input {
            padding: 0.65rem 0.85rem;
            border: 1.5px solid #cbd5e1;
            border-radius: 10px;
            outline: none;
            font-size: 0.88rem;
          }
          .chat-input-row-form input[type="text"]:first-child { flex: 2; }
          .chat-input-row-form .attachment-input { flex: 1; }
          .chat-input-row-form input:focus { border-color: #4f46e5; }
          .chat-send-btn { min-width: 80px; }

          /* Map tab */
          .leaflet-map-wrapper {
            margin-top: 0.75rem;
            border-radius: 14px;
            overflow: hidden;
            border: 1.5px solid #e2e8f0;
          }
          .map-side-controls {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .pins-list-sidebar {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 1rem;
          }
          .pins-list-sidebar h5 { margin: 0 0 0.5rem; font-size: 0.85rem; font-weight: 800; color: #475569; }
          .pins-scroll-list {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            max-height: 180px;
            overflow-y: auto;
          }
          .pin-list-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            border: 1px solid #f1f5f9;
            padding: 0.4rem 0.6rem;
            border-radius: 8px;
          }
          .pin-list-item h6 { margin: 0; font-size: 0.82rem; font-weight: 750; color: #1e293b; }
          .pin-list-item small { font-size: 0.68rem; color: #94a3b8; }
          .delete-pin-btn {
            background: transparent;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 1.1rem;
          }
          .delete-pin-btn:hover { color: #ef4444; }

          /* Booking Notes */
          .booking-notes-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .booking-note-card {
            border: 1.5px solid #f1f5f9;
            border-radius: 14px;
            padding: 1.25rem;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.01);
          }
          .note-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 0.5rem;
            margin-bottom: 0.75rem;
          }
          .note-header h4 { margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a; }
          .note-header small { color: #94a3b8; font-size: 0.78rem; }
          .confirmation-pre {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.75rem;
            font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 0.82rem;
            color: #334155;
            white-space: pre-wrap;
            margin: 0;
          }

          /* Settings tab */
          .settings-grid-panel {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
          @media (max-width: 768px) {
            .settings-grid-panel { grid-template-columns: 1fr; }
          }
          .settings-section-card {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 1.25rem;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .settings-section-card h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
          .settings-subtext { margin: 0; font-size: 0.82rem; color: #64748b; line-height: 1.4; }
          .invite-form {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .invite-form label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.82rem; font-weight: 700; color: #475569; }
          .invite-form input { padding: 0.6rem 0.8rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; outline: none; }
          .admin-actions-rows {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 0.5rem;
          }
          .admin-toggle-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            background: white;
            border: 1.5px solid #f1f5f9;
            padding: 0.75rem 1rem;
            border-radius: 10px;
          }
          .admin-toggle-row strong { font-size: 0.88rem; color: #1e293b; display: block; }
          .admin-toggle-row p { margin: 0.15rem 0 0 0; font-size: 0.75rem; color: #64748b; }
          .leave-room-danger-btn {
            background: #ef4444 !important;
            color: white !important;
            border-color: #ef4444 !important;
            align-self: flex-start;
          }
          .leave-room-danger-btn:hover { background: #dc2626 !important; }
        `}</style>
      </main>
    )
  }

  // Render Tour Rooms Overview & Invitation List
  return (
    <main className="page-shell tr-overview-shell">
      {errorMsg && <div className="profile-alert error">{errorMsg}</div>}
      {successMsg && <div className="profile-alert success">{successMsg}</div>}

      <header className="tr-overview-header">
        <div>
          <h1>Group Tour Planner</h1>
          <p>Collaboratively plan itineraries, vote on hotel selections, track checklist tasks, and split trip expenses.</p>
        </div>
        <button className="button button-primary create-room-btn" onClick={() => setShowCreateModal(true)}>
          ➕ Create Tour Room
        </button>
      </header>

      {/* Invitations Alert Banner */}
      {invites.length > 0 && (
        <section className="invitations-alert-section">
          <h3>📩 Pending Tour Room Invitations ({invites.length})</h3>
          <div className="invites-grid">
            {invites.map(inv => (
              <div key={inv.id} className="invite-alert-card">
                <div className="invite-info-row">
                  <span className="invite-room-cover" style={{ backgroundImage: `url(${inv.room?.cover_photo || 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800'})` }} />
                  <div>
                    <h4>{inv.room?.name}</h4>
                    <p>Invited by <strong>{inv.invited_by?.username}</strong></p>
                  </div>
                </div>
                <div className="invite-actions">
                  <button className="button button-primary accept-invite-btn" onClick={() => handleInviteResponse(inv.id, true)}>Accept</button>
                  <button className="button button-tertiary decline-invite-btn" onClick={() => handleInviteResponse(inv.id, false)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Rooms Grid */}
      <section className="rooms-grid-section">
        <h3>Active Tour Rooms</h3>
        {overviewLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
             <div className="skeleton-loader" style={{height: '250px'}}></div>
             <div className="skeleton-loader" style={{height: '250px'}}></div>
             <div className="skeleton-loader" style={{height: '250px'}}></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="empty-state-card" style={{ padding: '4rem 2rem' }}>
            <span className="empty-state-icon" style={{ fontSize: '3rem' }}>🗺️</span>
            <h4 className="empty-state-title">No Active Tour Rooms Found</h4>
            <p className="empty-state-text">Create a new planner room to start coordinating with friends, or accept pending invitations.</p>
            <button className="button button-secondary" onClick={() => setShowCreateModal(true)}>
              Start a New Tour Room
            </button>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => (
              <div key={room.id} className="room-overview-card" onClick={() => navigate(`/traveler/room?id=${room.id}`)}>
                <div className="room-card-cover" style={{ backgroundImage: `url(${room.cover_photo || 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800'})` }}>
                  {room.is_archived && <span className="archived-pill">Archived</span>}
                  <span className="members-badge">👤 {room.members_count || 1} members</span>
                </div>
                <div className="room-card-body">
                  <h4>{room.name}</h4>
                  <p className="room-destination">📍 {room.destination?.name || 'Group Destination'}</p>
                  <div className="room-card-footer">
                    <span className="view-details-link">Open Planner ➔</span>
                    {room.owner === parseInt(userId) && (
                      <button 
                        className="delete-room-btn" 
                        onClick={(e) => handleDeleteRoom(e, room.id)}
                        title="Delete Tour Room"
                      >
                        🗑️ Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="shared-modal-overlay" onClick={(e) => e.target.classList.contains('shared-modal-overlay') && setShowCreateModal(false)}>
          <div className="shared-modal-content" style={{maxWidth: '500px'}}>
            <div className="shared-modal-header">
              <h2 className="shared-modal-title">Start New Tour Room Planner</h2>
              <button style={{background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem 0.5rem'}} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCreateRoom} style={{display: 'flex', flexDirection: 'column'}}>
              <div className="shared-modal-body">
                <p className="community-muted" style={{marginTop: 0, marginBottom: '1.5rem'}}>Initialize a collaborative space for your travel group.</p>
                
                <div className="form-group">
                  <label className="form-label required">Tour Room Name</label>
                  <input
                    className="form-control"
                    type="text"
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    placeholder="e.g. Sajek Valley Monsoon Tour..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Destination</label>
                  <select className="form-control" value={newRoomDestination} onChange={e => setNewRoomDestination(e.target.value)} required>
                    <option value="bandarban">Bandarban</option>
                    <option value="sajek">Sajek Valley</option>
                    <option value="coxs-bazar">Cox's Bazar</option>
                    <option value="sundarbans">Sundarbans</option>
                    <option value="sylhet">Sylhet</option>
                    <option value="sreemangal">Sreemangal</option>
                  </select>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group">
                    <label className="form-label required">Start Date</label>
                    <input
                      className="form-control"
                      type="date"
                      value={newRoomStartDate}
                      onChange={e => setNewRoomStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">End Date</label>
                    <input
                      className="form-control"
                      type="date"
                      value={newRoomEndDate}
                      onChange={e => setNewRoomEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cover Photo URL (Optional)</label>
                  <input
                    className="form-control"
                    type="text"
                    value={newRoomCover}
                    onChange={e => setNewRoomCover(e.target.value)}
                    placeholder="Paste cover image web link..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Max Member Count</label>
                  <input
                    className="form-control"
                    type="number"
                    min="2"
                    max="100"
                    value={newRoomMaxMembers}
                    onChange={e => setNewRoomMaxMembers(parseInt(e.target.value) || 10)}
                    required
                  />
                </div>
              </div>

              <div className="shared-modal-footer">
                <button type="button" className="button button-secondary" onClick={() => setShowCreateModal(false)} disabled={createSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={createSubmitting || !newRoomName.trim()}>
                  {createSubmitting ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tr-overview-shell {
          margin-top: 98px !important;
          margin-left: 264px !important;
          width: calc(100% - 264px) !important;
          max-width: none !important;
          padding: 0 2rem 2rem 2rem !important;
          min-height: calc(100vh - 98px);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .tr-overview-shell {
            margin-left: 80px !important;
            width: calc(100% - 80px) !important;
          }
        }
        .tr-overview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .tr-overview-header h1 {
          margin: 0 0 0.35rem 0;
          font-size: 2.2rem;
          font-weight: 850;
          color: #0f172a;
        }
        .tr-overview-header p {
          margin: 0;
          font-size: 1.05rem;
          color: #64748b;
          max-width: 600px;
        }

        /* Pending invites alert section */
        .invitations-alert-section {
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          border-radius: 18px;
          padding: 1.25rem;
        }
        .invitations-alert-section h3 {
          margin: 0 0 1rem;
          font-size: 1.05rem;
          font-weight: 800;
          color: #312e81;
        }
        .invites-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 0.75rem;
        }
        .invite-alert-card {
          background: white;
          border: 1px solid #e0e7ff;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.03);
        }
        .invite-info-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .invite-room-cover {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
        }
        .invite-info-row h4 { margin: 0 0 0.15rem; font-size: 0.95rem; font-weight: 800; color: #1e293b; }
        .invite-info-row p { margin: 0; font-size: 0.78rem; color: #64748b; }
        .invite-actions {
          display: flex;
          gap: 0.5rem;
        }
        .accept-invite-btn { padding: 0.35rem 0.8rem; font-size: 0.8rem; }
        .decline-invite-btn { padding: 0.35rem 0.8rem; font-size: 0.8rem; }

        /* Rooms Grid */
        .rooms-grid-section h3 {
          margin: 0 0 1.25rem;
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
        }
        .rooms-loading-msg {
          font-size: 0.95rem;
          color: #64748b;
          font-style: italic;
        }
        .rooms-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          background: #f8fafc;
          border: 1.5px dashed #cbd5e1;
          border-radius: 18px;
          color: #64748b;
          gap: 0.6rem;
        }
        .rooms-empty-state span { font-size: 3rem; }
        .rooms-empty-state h4 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #334155; }
        .rooms-empty-state p { margin: 0 0 0.75rem; font-size: 0.88rem; max-width: 380px; }

        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .room-overview-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
        }
        .room-overview-card:hover {
          transform: translateY(-4px);
          border-color: #cbd5e1;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
        }
        .room-card-cover {
          height: 150px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 0.75rem;
        }
        .archived-pill {
          background: #fecaca;
          color: #b91c1c;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 750;
          align-self: flex-start;
        }
        .members-badge {
          background: rgba(0,0,0,0.5);
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          align-self: flex-start;
          backdrop-filter: blur(4px);
        }
        .room-card-body {
          padding: 1.25rem;
        }
        .room-card-body h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
        }
        .room-destination {
          margin: 0 0 1rem 0;
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
        }
        .room-card-footer {
          border-top: 1px solid #f1f5f9;
          padding-top: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .view-details-link {
          font-size: 0.82rem;
          font-weight: 750;
          color: #4f46e5;
        }
        .delete-room-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 0.82rem;
          font-weight: 755;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          transition: background-color 0.2s, color 0.2s;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .delete-room-btn:hover {
          background-color: #fee2e2;
        }

        /* Create room form inside modal */
        .crop-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }
        .crop-modal-content {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          width: 90%;
          max-width: 460px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
          animation: slideUp 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .create-room-modal-card {
          max-width: 440px;
        }
        .create-room-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }
        .create-room-form label {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #475569;
        }
        .create-room-form input,
        .create-room-form select {
          padding: 0.7rem 0.85rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.92rem;
          outline: none;
        }
        .create-room-form input:focus,
        .create-room-form select:focus {
          border-color: #4f46e5;
        }
      `}</style>
    </main>
  )
}
