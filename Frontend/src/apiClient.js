const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

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

export async function joinOpenTourGroup(groupId, userId) {
  const res = await fetch(`${API_BASE}/community/groups/${groupId}/join/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to join group')
  return data
}

export async function getCommunityFeed(params = {}, userId) {
  const query = withUserId(params, userId)
  const res = await fetch(`${API_BASE}/community/feed/?${query}`)
  if (!res.ok) throw new Error('Failed to load feed')
  return res.json()
}

export async function createCommunityPost(payload) {
  const res = await fetch(`${API_BASE}/community/feed/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create post')
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
