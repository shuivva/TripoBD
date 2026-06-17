
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

export async function saveAIItinerary(sessionId, messageId, { roomName, destinationSlug, roomId } = {}) {
  const body = { message_id: messageId }
  if (roomId) {
    body.room_id = roomId
  } else {
    body.room_name = roomName
    body.destination_slug = destinationSlug
  }
  const res = await fetch(`${API_BASE}/traveler/ai/sessions/${sessionId}/save-itinerary/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

export async function deleteTourRoom(roomId, userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/tourrooms/${roomId}/`, {
    method: 'DELETE',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to delete Tour Room')
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

export async function toggleWishlist(userId, destinationSlug) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/wishlist/toggle/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination_slug: destinationSlug }),
  })
  if (!res.ok) throw new Error('Failed to toggle wishlist')
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

/* ==========================================================
   DYNAMIC PAGES & CRUD ENDPOINTS CLIENT FUNCTIONS
   ========================================================== */

// Public views clients
export async function getHomePageData() {
  const res = await fetch(`${API_BASE}/home/`)
  if (!res.ok) throw new Error('Failed to load homepage data')
  return res.json()
}

export async function getFaqsList(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_BASE}/faqs/?${query}`)
  if (!res.ok) throw new Error('Failed to load FAQs')
  return res.json()
}

export async function getFaqCategories() {
  const res = await fetch(`${API_BASE}/faqs/categories/`)
  if (!res.ok) throw new Error('Failed to load FAQ categories')
  return res.json()
}

export async function getVideoTutorials() {
  const res = await fetch(`${API_BASE}/faqs/tutorials/`)
  if (!res.ok) throw new Error('Failed to load video tutorials')
  return res.json()
}

export async function getAboutPageData() {
  const res = await fetch(`${API_BASE}/about/`)
  if (!res.ok) throw new Error('Failed to load about page data')
  return res.json()
}

export async function submitAboutContact(payload) {
  const res = await fetch(`${API_BASE}/about/contact/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to submit message')
  return res.json()
}

// Admin CRUD clients
export async function getAdminFaqs(adminId) {
  const res = await fetch(`${API_BASE}/admin/faqs/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load admin FAQs')
  return res.json()
}

export async function addEditAdminFaq(adminId, method, faqId, payload) {
  const url = faqId ? `${API_BASE}/admin/faqs/${faqId}/?admin_id=${adminId}` : `${API_BASE}/admin/faqs/?admin_id=${adminId}`
  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to save FAQ')
  return res.json()
}

export async function deleteAdminFaq(adminId, faqId) {
  const res = await fetch(`${API_BASE}/admin/faqs/${faqId}/?admin_id=${adminId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete FAQ')
  return res.json()
}

export async function getAdminFaqCategories(adminId) {
  const res = await fetch(`${API_BASE}/admin/faqs/categories/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load categories')
  return res.json()
}

export async function addAdminFaqCategory(adminId, payload) {
  const res = await fetch(`${API_BASE}/admin/faqs/categories/?admin_id=${adminId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to add category')
  return res.json()
}

export async function deleteAdminFaqCategory(adminId, catId) {
  const res = await fetch(`${API_BASE}/admin/faqs/categories/${catId}/?admin_id=${adminId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete category')
  return res.json()
}

export async function getAdminTutorials(adminId) {
  const res = await fetch(`${API_BASE}/admin/faqs/tutorials/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load video tutorials')
  return res.json()
}

export async function addEditAdminTutorial(adminId, method, tutId, payload) {
  const url = tutId ? `${API_BASE}/admin/faqs/tutorials/${tutId}/?admin_id=${adminId}` : `${API_BASE}/admin/faqs/tutorials/?admin_id=${adminId}`
  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to save video tutorial')
  return res.json()
}

export async function deleteAdminTutorial(adminId, tutId) {
  const res = await fetch(`${API_BASE}/admin/faqs/tutorials/${tutId}/?admin_id=${adminId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete video tutorial')
  return res.json()
}

export async function getAdminAboutData(adminId) {
  const res = await fetch(`${API_BASE}/admin/about/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load about sections data')
  return res.json()
}

export async function updateAdminAboutData(adminId, payload) {
  const res = await fetch(`${API_BASE}/admin/about/?admin_id=${adminId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to save about sections data')
  return res.json()
}

export async function getAdminContactMessages(adminId) {
  const res = await fetch(`${API_BASE}/admin/about/contact-messages/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load contact feedback messages')
  return res.json()
}

export async function deleteAdminContactMessage(adminId, msgId) {
  const res = await fetch(`${API_BASE}/admin/about/contact-messages/${msgId}/?admin_id=${adminId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete message')
  return res.json()
}

export async function getAdminHomeData(adminId) {
  const res = await fetch(`${API_BASE}/admin/home/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load home config data')
  return res.json()
}

export async function updateAdminHomeData(adminId, payload) {
  const res = await fetch(`${API_BASE}/admin/home/?admin_id=${adminId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to save home configurations')
  return res.json()
}

export async function getAdminRoutes(adminId) {
  const res = await fetch(`${API_BASE}/admin/routes/?admin_id=${adminId}`)
  if (!res.ok) throw new Error('Failed to load transport routes')
  return res.json()
}

export async function addEditAdminRoute(adminId, method, routeId, payload) {
  const url = routeId ? `${API_BASE}/admin/routes/${routeId}/?admin_id=${adminId}` : `${API_BASE}/admin/routes/?admin_id=${adminId}`
  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to save transport route')
  return res.json()
}

export async function deleteAdminRoute(adminId, routeId) {
  const res = await fetch(`${API_BASE}/admin/routes/${routeId}/?admin_id=${adminId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete transport route')
  return res.json()
}

// ==========================================================
// MOCK AI TRAVEL ASSISTANT (No API Required)
// ==========================================================

// Predefined responses for common Bangladesh travel questions
const MOCK_RESPONSES = {
  // Destinations
  'best places': `### Top Bangladesh Destinations 🇧🇩

**Cox's Bazar** - World's longest natural sea beach (120km)
- Best time: November-March
- Budget: 2,000-5,000 BDT/day

**Sajek Valley** - Misty hills and sunrise views
- Best time: October-April
- Budget: 1,500-3,000 BDT/day

**Sundarbans** - Royal Bengal tigers & mangrove forest
- Best time: November-March
- Budget: 3,000-6,000 BDT/day

**Sylhet** - Tea gardens & waterfalls
- Best time: Year-round
- Budget: 1,500-4,000 BDT/day`,

  'bandarban': `### Bandarban Travel Guide 🏔️

**Must-Visit:**
- **Boga Lake** - Highest natural lake in Bangladesh
- **Nilgiri** - Stunning hilltop views
- **Keokradong** - Highest peak in Bangladesh
- **Chimbuk Hill** - Queen of hills

**Transport:** Bus from Dhaka (500-800 BDT, 8-10 hours)

**Budget:** 2,000-4,000 BDT/day including food & stay

**Tips:** Carry warm clothes, book guides in advance`,

  'sajek': `### Sajek Valley Travel Guide 🌄

**Highlights:**
- Sunrise over clouds
- Indigenous culture & crafts
- Trekking trails

**Getting There:** 
- Dhaka → Khagrachari → Sajek
- Cost: 800-1,200 BDT

**Budget:** 1,500-3,000 BDT/day

**Best Time:** October-April for clear views`,

  'sylhet': `### Sylhet Tea Gardens & More 🍃

**Must-Visit:**
- **Sreemangal** - Tea capital (7-color tea garden)
- **Jaflong** - Stone collection & river views
- **Madhabkunda** - Beautiful waterfall
- **Lawachara National Park** - Wildlife sanctuary

**Specialties:** Shatkora (citrus), seven-layer tea

**Budget:** 1,500-4,000 BDT/day`,

  'cox': `### Cox's Bazar Guide 🏖️

**Highlights:**
- Inani Beach (Coral stones)
- Himchari (Waterfall and view)
- Marine Drive (Scenic coastal road)

**Best Time:** November to March
**Budget:** 2,000-5,000 BDT/day
**Route:** Direct flights/buses from Dhaka`,

  'saint martin': `### Saint Martin's Island Guide 🌴

**Highlights:**
- Chera Dwip
- Snorkeling and coral viewing
- Fresh seafood (Lobster, Coral fish)

**Best Time:** November to March (ships don't run in monsoon)
**Budget:** 2,500-5,000 BDT/day
**Route:** Dhaka -> Teknaf -> Ship to Island`,

  'sundarban': `### Sundarbans Guide 🐅

**Highlights:**
- Karamjal & Harbaria
- Hiron Point & Kotka (Deep forest)
- Mangrove biodiversity & Royal Bengal Tiger

**Best Time:** November to February
**Budget:** 5,000-15,000 BDT (depends on package)
**Route:** Khulna or Mongla -> River cruise package`,

  // Itineraries
  '3-day': `### 3-Day Bangladesh Trip Plan 📅

**Day 1: Dhaka**
- Historic sites (Lalbagh Fort, Ahsan Manzil)
- Street food tour
- Budget: 1,500 BDT

**Day 2: Sreemangal**
- Tea garden exploration
- Seven-color tea tasting
- Budget: 2,500 BDT

**Day 3: Return**
- Local shopping
- Departure
- Budget: 1,000 BDT

**Total Budget:** ~5,000 BDT`,

  'itinerary': `### Sample Itinerary Suggestions

**Weekend Getaway (2 days):**
- Sreemangal tea gardens
- Budget: 3,000-4,000 BDT

**Adventure Trip (3 days):**
- Bandarban hills
- Budget: 5,000-7,000 BDT

**Beach Vacation (3 days):**
- Cox's Bazar
- Budget: 4,000-6,000 BDT

Tell me your destination and duration for a custom plan!`,

  // Budget
  'budget': `### Bangladesh Travel Budget Guide 💰

**Budget Travel (per day):**
- Food: 300-500 BDT
- Transport: 200-400 BDT
- Accommodation: 500-1,000 BDT
- **Total: 1,000-2,000 BDT**

**Mid-Range (per day):**
- Food: 500-800 BDT
- Transport: 400-600 BDT
- Accommodation: 1,000-2,000 BDT
- **Total: 2,000-3,500 BDT**

**Comfort (per day):**
- Food: 800-1,200 BDT
- Transport: 600-800 BDT
- Accommodation: 2,000-4,000 BDT
- **Total: 3,500-6,000 BDT`,

  'cheap': `### Budget Travel Tips 💡

**Cheapest Destinations:**
- Sreemangal: 1,500 BDT/day
- Sylhet city: 1,200 BDT/day
- Kuakata: 2,000 BDT/day

**Money-Saving Tips:**
- Use local buses (AC bus: 300-500 BDT)
- Eat at local restaurants (100-200 BDT/meal)
- Stay in guesthouses (500-800 BDT/night)
- Travel in groups for shared costs

**Student Budget:** Under 3,000 BDT for 2-day trip possible!`,

  // Transport
  'transport': `### Bangladesh Transport Guide 🚌

**Dhaka to:**
- **Cox's Bazar:** Bus 600-900 BDT (10-12 hrs)
- **Sylhet:** Train 200-400 BDT (6-8 hrs)
- **Chittagong:** Train 150-300 BDT (5-7 hrs)
- **Sajek:** Bus 800-1,200 BDT (10-12 hrs)

**Options:**
- **AC Bus:** Comfortable, reliable
- **Train:** Scenic, budget-friendly
- **Launch:** For southern routes
- **Local Bus:** Cheapest option

**Booking:** Shohoz, BD Tickets, or station counters`,

  'bus': `### Bus Travel Information 🚌

**Major Operators:**
- Green Line (Premium)
- Shohoz (AC/Non-AC)
- Hanif (Budget)

**Popular Routes:**
- Dhaka-Cox's Bazar: 600-900 BDT
- Dhaka-Sylhet: 400-600 BDT
- Dhaka-Chittagong: 300-500 BDT

**Tips:**
- Book in advance for weekends
- Night buses save accommodation cost
- AC buses recommended for long trips`,

  // Food
  'food': `### Bangladesh Food Guide 🍛

**Must-Try Dishes:**
- **Kacchi Biryani** - Dhaka specialty
- **Hilsa Fish** - National fish (Ilish)
- **Pitha** - Traditional rice cakes
- **Bhuna Khichuri** - Spiced rice & lentils

**Regional Specialties:**
- **Sylhet:** Shatkora curry, seven-layer tea
- **Chittagong:** Mezban beef, shutki
- **Cox's Bazar:** Fresh seafood, dried fish

**Street Food:** Fuchka, Jhal Muri, Velpuri (50-100 BDT)`,

  'sylhet food': `### Sylhet Food Specialties 🍃

**Must-Try:**
- **Shatkora Curry** - Unique citrus duck/beef curry
- **Seven-Layer Tea** - Sreemangal specialty
- **Pitha** - Traditional rice cakes
- **Fresh River Fish** - Local catch

**Where to Eat:**
- Panshi Restaurant (Sreemangal)
- Local tea garden cafes
- Street food in Sylhet city

**Budget:** 200-500 BDT per meal`,

  // Weather
  'weather': `### Bangladesh Weather Guide 🌤️

**Best Travel Seasons:**

**Winter (October-March):**
- Temperature: 15-25°C
- Perfect for: Hill tracts, beaches
- Pack: Light warm clothes

**Summer (April-June):**
- Temperature: 30-38°C
- Perfect for: Sundarbans, waterfalls
- Pack: Light cotton, rain gear

**Monsoon (July-September):**
- Heavy rainfall
- Perfect for: Tea gardens, green landscapes
- Pack: Waterproof gear, umbrella`,

  'packing': `### Bangladesh Packing Checklist 🎒

**Essentials:**
- Passport/ID
- Cash (BDT)
- Power bank
- First aid kit

**For Hills (Bandarban/Sajek):**
- Warm sweater/jacket
- Comfortable walking shoes
- Rain jacket
- Sunscreen

**For Beaches (Cox's Bazar):**
- Swimwear
- Sunscreen
- Hat/sunglasses
- Flip-flops

**For Forests (Sundarbans):**
- Insect repellent
- Long sleeves/pants
- Waterproof boots
- Flashlight`,

  // General
  'help': `### How Can I Help You? 🤖

I can assist with:

**🗺️ Destinations:** Best places to visit in Bangladesh
**📅 Itineraries:** Day-by-day trip planning
**💰 Budget:** Cost estimates and money-saving tips
**🚌 Transport:** Bus, train, and travel routes
**🍛 Food:** Local cuisine and restaurant recommendations
**🌤️ Weather:** Best time to visit destinations
**🎒 Packing:** What to bring for different trips

Just ask me anything about Bangladesh travel!`,

  'hello': `### Hello! 👋

I'm your Bangladesh travel assistant for TripoBD!

I can help you plan trips, discover destinations, get weather information, and learn about local culture, food, and attractions in Bangladesh.

Popular destinations I can help with:
- Cox's Bazar 🏖️
- Sajek Valley 🏔️
- Bandarban ⛰️
- Sylhet 🍃
- Sundarbans 🐅

What would you like to know about Bangladesh travel?`
}

// Simple keyword matching for mock responses
function getMockResponse(userMessage) {
  const message = userMessage.toLowerCase()
  
  // Check for keywords and return matching response
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return MOCK_RESPONSES['hello']
  }
  if (message.includes('help') || message.includes('assist')) {
    return MOCK_RESPONSES['help']
  }
  if (message.includes('bandarban')) {
    return MOCK_RESPONSES['bandarban']
  }
  if (message.includes('sajek')) {
    return MOCK_RESPONSES['sajek']
  }
  if (message.includes('sylhet')) {
    return MOCK_RESPONSES['sylhet']
  }
  if (message.includes('best place') || message.includes('destination') || message.includes('visit') || message.includes('where to go')) {
    return MOCK_RESPONSES['best places']
  }
  if (message.includes('cox')) {
    return MOCK_RESPONSES['cox']
  }
  if (message.includes('saint martin') || message.includes('st. martin') || message.includes('st martin')) {
    return MOCK_RESPONSES['saint martin']
  }
  if (message.includes('sundarban')) {
    return MOCK_RESPONSES['sundarban']
  }
  if (message.includes('3 day') || message.includes('3-day') || message.includes('itinerary')) {
    return MOCK_RESPONSES['3-day']
  }
  if (message.includes('budget') || message.includes('cost') || message.includes('price') || message.includes('cheap')) {
    return MOCK_RESPONSES['budget']
  }
  if (message.includes('transport') || message.includes('bus') || message.includes('train') || message.includes('how to reach')) {
    return MOCK_RESPONSES['transport']
  }
  if (message.includes('food') || message.includes('eat') || message.includes('restaurant')) {
    return MOCK_RESPONSES['food']
  }
  if (message.includes('weather') || message.includes('season') || message.includes('best time')) {
    return MOCK_RESPONSES['weather']
  }
  if (message.includes('pack') || message.includes('what to bring') || message.includes('packing')) {
    return MOCK_RESPONSES['packing']
  }
  
  // Default response
  return `### I'd love to help! 🤖

I can assist with Bangladesh travel planning including:
- **Destinations:** Cox's Bazar, Sajek, Bandarban, Sylhet, Sundarbans
- **Itineraries:** Day-by-day trip plans
- **Budget:** Cost estimates and tips
- **Transport:** Bus, train, and route information
- **Food:** Local cuisine recommendations
- **Weather:** Best travel seasons
- **Packing:** What to bring

Try asking: "Plan a 3-day Bandarban trip" or "What's the budget for Sajek?"`
}

export async function sendGeminiMessage(sessionId, userMessage, history = []) {
  // Simulate network delay for realistic feel
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
  
  const response = getMockResponse(userMessage)
  
  return {
    role: 'assistant',
    content: response,
    created_at: new Date().toISOString()
  }
}

export async function sendGeminiMessageSimple(userMessage) {
  await new Promise(resolve => setTimeout(resolve, 300))
  return getMockResponse(userMessage)
}

// ============================================================
// TRAVELER SETTINGS & PREFERENCES API CLIENT FUNCTIONS
// ============================================================

export async function getTravelerDisplaySettings(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/settings/display/`)
  if (!res.ok) throw new Error('Failed to load display settings')
  return res.json()
}

export async function updateTravelerDisplaySettings(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/settings/display/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update display settings')
  return res.json()
}

export async function getTravelerAccountSettings(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/settings/account/`)
  if (!res.ok) throw new Error('Failed to load account settings')
  return res.json()
}

export async function getTravelerBlockedUsers(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/settings/blocked-users/`)
  if (!res.ok) throw new Error('Failed to load blocked users')
  return res.json()
}

export async function blockTravelerUser(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/settings/blocked-users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to block user')
  return data
}

export async function unblockTravelerUser(userId, blockedUserId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/settings/blocked-users/${blockedUserId}/`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to unblock user')
  return res.json()
}

export async function requestTravelerAccountDeletion(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/settings/request-deletion/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to request account deletion')
  return data
}

export async function cancelTravelerAccountDeletion(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/settings/cancel-deletion/`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to cancel account deletion')
  return res.json()
}

export async function exportTravelerData(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/settings/export-data/`)
  if (!res.ok) throw new Error('Failed to export data')
  return res.json()
}

// ============================================================
// TRAVELER HELP & SUPPORT API CLIENT FUNCTIONS
// ============================================================

export async function getTravelerSupportTickets(userId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/support/tickets/`)
  if (!res.ok) throw new Error('Failed to load support tickets')
  return res.json()
}

export async function submitTravelerSupportTicket(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/support/tickets/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to submit support ticket')
  return data
}

export async function getTravelerSupportTicketDetail(userId, ticketId) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/support/tickets/${ticketId}/`)
  if (!res.ok) throw new Error('Failed to load support ticket detail')
  return res.json()
}

export async function submitTravelerFeedback(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/support/feedback/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to submit feedback')
  return data
}

export async function submitTravelerBugReport(userId, payload) {
  const res = await fetch(`${API_BASE}/traveler/${userId}/support/bug-report/`, {
    method: 'POST',
    headers: payload instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to submit bug report')
  return data
}
