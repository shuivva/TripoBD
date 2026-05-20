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
