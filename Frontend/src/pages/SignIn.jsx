import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SignIn() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: form.identifier, password: form.password })
      })

      const data = await res.json()
      if (res.ok) {
        // In a real app you'd store a token; for now just redirect
        navigate('/traveler/dashboard')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container auth-page">
      <div className="auth-card">
        <h1>Sign In</h1>
        <p>Sign in with your username or email</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Username or Email</label>
          <input name="identifier" value={form.identifier} onChange={handleChange} required />
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
          <button className="button button-primary" type="submit">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </div>
      <style>{`
        .auth-page { display:flex; align-items:center; justify-content:center; min-height:80vh; }
        .auth-card { background:#fff; padding:2rem; border-radius:8px; box-shadow:0 6px 24px rgba(0,0,0,0.08); width:360px }
        .auth-card h1 { margin:0 0 0.5rem 0 }
        .auth-card form { display:flex; flex-direction:column; gap:0.75rem }
        .auth-card input { padding:0.6rem; border:1px solid #ddd; border-radius:6px }
        .error { background:#fee; color:#c33; padding:0.5rem; border-radius:6px }
      `}</style>
    </div>
  )
}
