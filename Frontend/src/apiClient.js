const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function parseApiError(data, fallback = 'Request failed') {
  if (!data) return fallback
  if (typeof data.error === 'string') return data.error
  if (typeof data === 'object') {
    const parts = Object.entries(data).map(([key, value]) => {
      if (key === 'details' && typeof value === 'object') return null
      const msg = Array.isArray(value) ? value[0] : value
      return `${key}: ${msg}`
    }).filter(Boolean)
    if (parts.length) return parts.join('; ')
  }
  return fallback
}

export async function getDestinations(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_BASE}/destinations/?${query}`)
  if (!res.ok) throw new Error('Failed to load destinations')
  return res.json()
}

export async function getDestinationDetail(slug) {
  const res = await fetch(`${API_BASE}/destinations/${slug}/`)
  if (!res.ok) throw new Error('Failed to load destination')
  return res.json()
}

export async function getFilters() {
  const res = await fetch(`${API_BASE}/filters/`)
  if (!res.ok) throw new Error('Failed to load filters')
  return res.json()
}

export async function getRoutes(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_BASE}/routes/?${query}`)
  if (!res.ok) throw new Error('Failed to load routes')
  return res.json()
}

export async function getGuides() {
  const res = await fetch(`${API_BASE}/guides/`)
  if (!res.ok) throw new Error('Failed to load guides')
  return res.json()
}

export async function getTravelerProfile(userId) {
  const res = await fetch(`${API_BASE}/traveler/profile/${userId}/`)
  if (!res.ok) throw new Error('Failed to load traveler profile')
  return res.json()
}

export async function getTravelerDashboard(userId) {
  const res = await fetch(`${API_BASE}/traveler/dashboard/${userId}/`)
  if (!res.ok) throw new Error('Failed to load traveler dashboard')
  return res.json()
}

export async function updateTravelerProfile(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/profile/${userId}/update/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update traveler profile')
  return res.json()
}

export async function updateTravelerPreferences(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/profile/${userId}/preferences/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update travel preferences')
  return res.json()
}

export async function updateTravelerAccountSettings(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/profile/${userId}/account-settings/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update account settings')
  return res.json()
}

export async function changeTravelerPassword(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/profile/${userId}/change-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update password')
  return res.json()
}

function withUserId(params, userId) {
  const q = new URLSearchParams(params)
  if (userId) q.set('user_id', userId)
  return q.toString()
}

export async function getOpenTourGroups(params = {}, userId) {
  const query = withUserId(params, userId)
  const res = await fetch(`${API_BASE}/community/groups/?${query}`)
  if (!res.ok) throw new Error('Failed to load tour groups')
  return res.json()
}

export async function getOpenTourGroupDetail(groupId, userId) {
  const query = withUserId({}, userId)
  const res = await fetch(`${API_BASE}/community/groups/${groupId}/?${query}`)
  if (!res.ok) throw new Error('Failed to load group')
  return res.json()
}

export async function getMyTourGroups(userId) {
  const res = await fetch(`${API_BASE}/community/groups/my/?user_id=${userId}`)
  if (!res.ok) throw new Error('Failed to load your groups')
  return res.json()
}

export async function createOpenTourGroup(payload) {
  const res = await fetch(`${API_BASE}/community/groups/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create group')
  return data
}

export async function joinOpenTourGroup(groupId, userId, { acceptInvite = false } = {}) {
  const res = await fetch(`${API_BASE}/community/groups/${groupId}/join/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, accept_invite: acceptInvite }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseApiError(data, 'Failed to join group'))
  return data
}

export async function inviteToTourGroup(groupId, userId, username) {
  const res = await fetch(`${API_BASE}/community/groups/${groupId}/invite/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, username: username.trim() }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseApiError(data, 'Failed to send invite'))
  return data
}

export async function getCommunityFeed(params = {}, userId) {
  const query = withUserId(params, userId)
  const res = await fetch(`${API_BASE}/community/feed/?${query}`)
  if (!res.ok) throw new Error('Failed to load feed')
  return res.json()
}

export async function createCommunityPost(payload) {
  const body = { ...payload }
  if (!body.image_url?.trim()) delete body.image_url
  if (!body.title?.trim()) delete body.title
  const res = await fetch(`${API_BASE}/community/feed/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(parseApiError(data, 'Failed to create post'))
  return data
}

export async function togglePostLike(postId, userId) {
  const res = await fetch(`${API_BASE}/community/posts/${postId}/like/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
  if (!res.ok) throw new Error('Failed to update like')
  return res.json()
}

export async function getPostComments(postId, userId) {
  const query = withUserId({}, userId)
  const res = await fetch(`${API_BASE}/community/posts/${postId}/comments/?${query}`)
  if (!res.ok) throw new Error('Failed to load comments')
  return res.json()
}

export async function addPostComment(postId, userId, content) {
  const res = await fetch(`${API_BASE}/community/posts/${postId}/comments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, content }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to add comment')
  return data
}

export async function toggleFollowTraveler(userId, targetProfileId, follow = true) {
  const res = await fetch(`${API_BASE}/community/follow/`, {
    method: follow ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, target_profile_id: targetProfileId }),
  })
  if (!res.ok) throw new Error('Failed to update follow')
  return res.json()
}

export async function updateTravelerProfilePhoto(userId, file) {
  const formData = new FormData()
  formData.append('profile_photo', file)
  const res = await fetch(`${API_BASE}/traveler/profile/${userId}/photo/`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Failed to update profile photo')
  return res.json()
}


// ==========================================
// NEW API CLIENT FUNCTIONS
// ==========================================

// 3.3 AI Travel Assistant
export async function getAISessions(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/ai/sessions/`)
  if (!res.ok) throw new Error('Failed to load AI sessions')
  return res.json()
}

export async function createAISession(userId, title) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/ai/sessions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('Failed to create AI session')
  return res.json()
}

export async function getAISessionMessages(sessionId) {
  const res = await fetch(`${API_BASE}/traveler/ai/sessions/${sessionId}/`)
  if (!res.ok) throw new Error('Failed to load messages')
  return res.json()
}

export async function deleteAISession(sessionId) {
  const res = await fetch(`${API_BASE}/traveler/ai/sessions/${sessionId}/`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete session')
  return res.json()
}

export async function sendAIMessage(sessionId, content) {
  const res = await fetch(`${API_BASE}/traveler/ai/sessions/${sessionId}/respond/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

export async function sendAIMessageFeedback(messageId, rating) {
  const res = await fetch(`${API_BASE}/traveler/ai/messages/${messageId}/feedback/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  })
  if (!res.ok) throw new Error('Failed to submit feedback')
  return res.json()
}

export async function saveAIItinerary(sessionId, messageId, roomName, destinationSlug) {
  const res = await fetch(`${API_BASE}/traveler/ai/sessions/${sessionId}/save-itinerary/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message_id: messageId, room_name: roomName, destination_slug: destinationSlug }),
  })
  if (!res.ok) throw new Error('Failed to save itinerary')
  return res.json()
}

// 3.4 Tour Room (Group Planner)
export async function getTourRooms(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/tourrooms/`)
  if (!res.ok) throw new Error('Failed to load Tour Rooms')
  return res.json()
}

export async function getTourRoomDetail(roomId, userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/tourrooms/${roomId}/`)
  if (!res.ok) throw new Error('Failed to load Tour Room details')
  return res.json()
}

export async function createTourRoom(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/tourrooms/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create Tour Room')
  return data
}

export async function inviteToTourRoom(roomId, userId, username) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/tourrooms/${roomId}/invite/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to send invite')
  return data
}

export async function getTourRoomInvites(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/tourrooms/invites/`)
  if (!res.ok) throw new Error('Failed to load invites')
  return res.json()
}

export async function respondToTourRoomInvite(inviteId, userId, accept) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/tourrooms/invites/${inviteId}/respond/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accept }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to respond to invite')
  return data
}

export async function createTourRoomActivity(roomId, payload) {
  const res = await fetch(`${API_BASE}/tourrooms/${roomId}/activities/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create activity')
  return res.json()
}

export async function updateTourRoomActivity(activityId, payload) {
  const res = await fetch(`${API_BASE}/tourrooms/activities/${activityId}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update activity')
  return res.json()
}

export async function deleteTourRoomActivity(activityId) {
  const res = await fetch(`${API_BASE}/tourrooms/activities/${activityId}/`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete activity')
  return res.json()
}

export async function createTourRoomExpense(roomId, payload) {
  const res = await fetch(`${API_BASE}/tourrooms/${roomId}/expenses/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create expense')
  return res.json()
}

export async function toggleExpenseParticipantPaid(participantId, isPaid) {
  const res = await fetch(`${API_BASE}/tourrooms/expenses/participants/${participantId}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_paid: isPaid }),
  })
  if (!res.ok) throw new Error('Failed to update payment status')
  return res.json()
}

export async function createTourRoomPoll(roomId, payload) {
  const res = await fetch(`${API_BASE}/tourrooms/${roomId}/polls/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create poll')
  return res.json()
}

export async function voteTourRoomPoll(pollId, userId, optionIds) {
  const res = await fetch(`${API_BASE}/tourrooms/polls/${pollId}/vote/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, option_ids: optionIds }),
  })
  if (!res.ok) throw new Error('Failed to cast vote')
  return res.json()
}

export async function createTourRoomChecklistItem(roomId, payload) {
  const res = await fetch(`${API_BASE}/tourrooms/${roomId}/checklist/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create checklist item')
  return res.json()
}

export async function updateTourRoomChecklistItem(itemId, payload) {
  const res = await fetch(`${API_BASE}/tourrooms/checklist/${itemId}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update checklist item')
  return res.json()
}

export async function deleteTourRoomChecklistItem(itemId) {
  const res = await fetch(`${API_BASE}/tourrooms/checklist/${itemId}/`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete checklist item')
  return res.json()
}

export async function getTourRoomChat(roomId) {
  const res = await fetch(`${API_BASE}/tourrooms/${roomId}/chat/`)
  if (!res.ok) throw new Error('Failed to load chat messages')
  return res.json()
}

export async function sendTourRoomChatMessage(roomId, senderId, message, attachmentUrl = '') {
  const res = await fetch(`${API_BASE}/tourrooms/${roomId}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: senderId, message, attachment_url: attachmentUrl }),
  })
  if (!res.ok) throw new Error('Failed to send chat message')
  return res.json()
}

export async function createTourRoomMapPin(roomId, payload) {
  const res = await fetch(`${API_BASE}/tourrooms/${roomId}/mappins/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to add map pin')
  return res.json()
}

export async function deleteTourRoomMapPin(pinId) {
  const res = await fetch(`${API_BASE}/tourrooms/mappins/${pinId}/`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to remove map pin')
  return res.json()
}

export async function createTourRoomBookingNote(roomId, payload) {
  const res = await fetch(`${API_BASE}/tourrooms/${roomId}/booking-notes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to add booking note')
  return res.json()
}

export async function updateTourRoomSettings(roomId, userId, payload) {
  const res = await fetch(`${API_BASE}/tourrooms/${roomId}/settings/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, ...payload }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update settings')
  return data
}

// 3.6 Tour Guide & Local Bookings
export async function getServiceProviders(serviceType, destination = '', language = '') {
  const query = new URLSearchParams({ service_type: serviceType, destination, language }).toString()
  const res = await fetch(`${API_BASE}/traveler/bookings/service-providers/?${query}`)
  if (!res.ok) throw new Error('Failed to load service providers')
  return res.json()
}

export async function getServiceProviderDetail(spId) {
  const res = await fetch(`${API_BASE}/traveler/bookings/service-providers/${spId}/`)
  if (!res.ok) throw new Error('Failed to load details')
  return res.json()
}

export async function bookServiceProvider(spId, payload) {
  const res = await fetch(`${API_BASE}/traveler/bookings/service-providers/${spId}/book/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to request booking')
  return res.json()
}

export async function getMyBookings(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/bookings/`)
  if (!res.ok) throw new Error('Failed to load bookings')
  return res.json()
}

export async function updateBookingStatus(bookingId, status) {
  const res = await fetch(`${API_BASE}/traveler/bookings/${bookingId}/status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update booking status')
  return res.json()
}

export async function submitServiceProviderReview(spId, payload) {
  const res = await fetch(`${API_BASE}/traveler/bookings/service-providers/${spId}/review/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to submit review')
  return res.json()
}

// 3.7 Reviews & Trip Stories
export async function submitDestinationReview(destSlug, payload) {
  const res = await fetch(`${API_BASE}/traveler/destinations/${destSlug}/review/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to submit review')
  return res.json()
}

export async function submitAccommodationReview(accomId, payload) {
  const res = await fetch(`${API_BASE}/traveler/accommodations/${accomId}/review/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to submit review')
  return res.json()
}

export async function createOrUpdateTripStory(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/stories/create-update/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to save story')
  return res.json()
}

export async function getTripStoryDetail(storyId) {
  const res = await fetch(`${API_BASE}/traveler/stories/${storyId}/`)
  if (!res.ok) throw new Error('Failed to load story details')
  return res.json()
}

export async function deleteTripStory(storyId) {
  const res = await fetch(`${API_BASE}/traveler/stories/${storyId}/`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete story')
  return res.json()
}

export async function getMyReviews(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/reviews/`)
  if (!res.ok) throw new Error('Failed to load reviews')
  return res.json()
}

export async function deleteReview(reviewType, reviewId) {
  const res = await fetch(`${API_BASE}/traveler/reviews/${reviewType}/${reviewId}/`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete review')
  return res.json()
}

export async function getTravelerLeaderboard() {
  const res = await fetch(`${API_BASE}/traveler/leaderboard/`)
  if (!res.ok) throw new Error('Failed to load leaderboard')
  return res.json()
}

// 3.8 Notifications Centre
export async function getNotifications(userId, params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_BASE}/traveler/${userId}/notifications/?${query}`)
  if (!res.ok) throw new Error('Failed to load notifications')
  return res.json()
}

export async function markNotificationRead(notificationId) {
  const res = await fetch(`${API_BASE}/traveler/notifications/${notificationId}/read/`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to mark notification read')
  return res.json()
}

export async function deleteNotification(notificationId) {
  const res = await fetch(`${API_BASE}/traveler/notifications/${notificationId}/read/`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete notification')
  return res.json()
}

export async function markAllNotificationsRead(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/notifications/read-all/`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to mark all read')
  return res.json()
}

export async function getNotificationPreferences(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/notifications/preferences/`)
  if (!res.ok) throw new Error('Failed to load notification preferences')
  return res.json()
}

export async function updateNotificationPreferences(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/notifications/preferences/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update notification preferences')
  return res.json()
}

// 3.9 Saved / Wishlist actions
export async function updateWishlistNotes(wishlistId, notes) {
  const res = await fetch(`${API_BASE}/traveler/wishlist/${wishlistId}/notes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  })
  if (!res.ok) throw new Error('Failed to save note')
  return res.json()
}

export async function deleteWishlist(wishlistId) {
  const res = await fetch(`${API_BASE}/traveler/wishlist/${wishlistId}/delete/`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to remove from wishlist')
  return res.json()
}

export async function shareWishlist(wishlistId) {
  const res = await fetch(`${API_BASE}/traveler/wishlist/${wishlistId}/share/`)
  if (!res.ok) throw new Error('Failed to share wishlist')
  return res.json()
}

export async function convertWishlistToRoom(wishlistId) {
  const res = await fetch(`${API_BASE}/traveler/wishlist/${wishlistId}/convert/`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to convert wishlist to room')
  return res.json()
}


// SECTION 4: GUIDE PORTAL APIs
export async function getGuideDashboard(userId) {
  const res = await fetch(`${API_BASE}/guide/${userId}/dashboard/`)
  if (!res.ok) throw new Error('Failed to load guide dashboard statistics')
  return res.json()
}

export async function getGuideProfileDetail(userId) {
  const res = await fetch(`${API_BASE}/guide/${userId}/profile/`)
  if (!res.ok) throw new Error('Failed to load guide profile')
  return res.json()
}

export async function updateGuideProfile(userId, payload) {
  const res = await fetch(`${API_BASE}/guide/${userId}/profile/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to update guide profile')
  return res.json()
}

export async function updateGuideBookingStatus(bookingId, payload) {
  const res = await fetch(`${API_BASE}/guide/bookings/${bookingId}/action/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to update booking status')
  return res.json()
}

export async function getGuideEarnings(userId) {
  const res = await fetch(`${API_BASE}/guide/${userId}/earnings/`)
  if (!res.ok) throw new Error('Failed to load earnings')
  return res.json()
}

export async function requestPayout(userId, payload) {
  const res = await fetch(`${API_BASE}/guide/${userId}/earnings/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to submit payout request')
  return res.json()
}

export async function getGuideSupportTickets(userId) {
  const res = await fetch(`${API_BASE}/guide/${userId}/support/tickets/`)
  if (!res.ok) throw new Error('Failed to load support tickets')
  return res.json()
}

export async function submitGuideSupportTicket(userId, payload) {
  const res = await fetch(`${API_BASE}/guide/${userId}/support/tickets/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to submit support ticket')
  return res.json()
}

export async function submitSupportTicketWithScreenshot(userId, formData) {
  const res = await fetch(`${API_BASE}/guide/${userId}/support/tickets/`, {
    method: 'POST',
    body: formData
  })
  if (!res.ok) throw new Error('Failed to submit support ticket')
  return res.json()
}

export async function replySupportTicket(userId, payload) {
  const res = await fetch(`${API_BASE}/guide/${userId}/support/tickets/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to submit support ticket action')
  return res.json()
}


// SECTION 5: ADMIN PORTAL APIs
export async function getAdminDashboard(adminId) {
  const res = await fetch(`${API_BASE}/admin/stats/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load admin dashboard statistics')
  return res.json()
}

export async function getAdminUsers(adminId, params = {}) {
  const query = new URLSearchParams({ admin_id: adminId, ...params }).toString()
  const res = await fetch(`${API_BASE}/admin/users/?${query}`)
  if (!res.ok) throw new Error('Failed to load users list')
  return res.json()
}

export async function adminUserAction(adminId, payload) {
  const res = await fetch(`${API_BASE}/admin/users/?admin_id=${adminId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to perform admin user action')
  return res.json()
}

export async function getAdminApplications(adminId, status = 'pending') {
  const res = await fetch(`${API_BASE}/admin/guides/verification/?admin_id=${adminId}&status=${status}`)
  if (!res.ok) throw new Error('Failed to load guide applications queue')
  return res.json()
}

export async function verifyGuide(adminId, payload) {
  const res = await fetch(`${API_BASE}/admin/guides/verification/?admin_id=${adminId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to update verification status')
  return res.json()
}

export async function getAdminDestinations(adminId) {
  const res = await fetch(`${API_BASE}/admin/destinations/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load destinations')
  return res.json()
}

export async function getAdminDestinationDetail(adminId, slug) {
  const res = await fetch(`${API_BASE}/admin/destinations/${slug}/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load destination detail')
  return res.json()
}

export async function addEditDestination(adminId, method, slug, payload) {
  const url = slug ? `${API_BASE}/admin/destinations/${slug}/?admin_id=${adminId}` : `${API_BASE}/admin/destinations/?admin_id=${adminId}`
  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to save destination')
  return res.json()
}

export async function deleteAdminDestination(adminId, slug) {
  const res = await fetch(`${API_BASE}/admin/destinations/${slug}/?admin_id=${adminId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete destination')
  return res.json()
}

export async function getFlaggedContent(adminId) {
  const res = await fetch(`${API_BASE}/admin/moderation/flagged/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load flagged content')
  return res.json()
}

export async function moderateContent(adminId, payload) {
  const res = await fetch(`${API_BASE}/admin/moderation/flagged/?admin_id=${adminId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to submit moderation action')
  return res.json()
}

export async function getAdminActiveGroups(adminId) {
  const res = await fetch(`${API_BASE}/admin/tour-groups/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load active tour groups')
  return res.json()
}

export async function dissolveGroup(adminId, roomId) {
  const res = await fetch(`${API_BASE}/admin/tour-groups/?admin_id=${adminId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, action: 'dissolve' })
  })
  if (!res.ok) throw new Error('Failed to dissolve group')
  return res.json()
}

export async function getAdminTickets(adminId) {
  const res = await fetch(`${API_BASE}/admin/support/tickets/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load support tickets')
  return res.json()
}

export async function replyAdminTicket(adminId, payload) {
  const res = await fetch(`${API_BASE}/admin/support/tickets/?admin_id=${adminId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to submit support ticket action')
  return res.json()
}

export async function getAdminSystemConfig(adminId) {
  const res = await fetch(`${API_BASE}/admin/config/system/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load system config')
  return res.json()
}

export async function updateAdminSystemConfig(adminId, payload) {
  const res = await fetch(`${API_BASE}/admin/config/system/?admin_id=${adminId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to save system config')
  return res.json()
}

export async function getAdminAuditLogs(adminId) {
  const res = await fetch(`${API_BASE}/admin/config/audit-logs/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load audit logs')
  return res.json()
}

export async function getAdminAnnouncements(adminId) {
  const res = await fetch(`${API_BASE}/admin/announcements/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load announcements')
  return res.json()
}

export async function sendAdminAnnouncement(adminId, payload) {
  const res = await fetch(`${API_BASE}/admin/announcements/?admin_id=${adminId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to send announcement')
  return res.json()
}


