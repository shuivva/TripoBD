import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAccessToken, verify2FALogin } from '../apiClient'

export default function SignIn() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [preAuthToken, setPreAuthToken] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [verifying2FA, setVerifying2FA] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleRedirect = (data) => {
    // Purge any legacy token storage from localStorage (Hardened JWT requirement)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    if (data.user_id) {
      localStorage.setItem('userId', data.user_id)
      localStorage.setItem('userType', data.user_type || 'traveler')
      localStorage.setItem('username', data.username || '')
      localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false')
    }

    if (data.is_admin) {
      navigate('/admin/dashboard')
    } else if (data.user_type === 'service_provider') {
      navigate('/guide/dashboard')
    } else {
      navigate('/traveler/dashboard')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: form.identifier, password: form.password }),
      })

      const data = await res.json()
      if (res.ok) {
        // Feature 1: Check if Two-Factor Authentication is required
        if (data.requires_2fa && data.pre_auth_token) {
          setPreAuthToken(data.pre_auth_token)
          setRequires2FA(true)
          setError('')
          return
        }

        // Feature 2: In-Memory Access Token Storage
        if (data.access) {
          setAccessToken(data.access)
        }

        handleRedirect(data)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('Login failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handle2FASubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!totpCode || totpCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setVerifying2FA(true)
    try {
      const data = await verify2FALogin(preAuthToken, totpCode.trim())
      if (data.access) {
        setAccessToken(data.access)
      }
      handleRedirect(data)
    } catch (err) {
      setError(err.message || 'Invalid 2FA code. Please try again.')
    } finally {
      setVerifying2FA(false)
    }
  }

  return (
    <div className="page-container auth-page">
      <div className="auth-card">
        {!requires2FA ? (
          <>
            <h1>Sign In</h1>
            <p className="subtitle">Sign in to your TripoBD account</p>
            {error && <div className="error-badge">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Username or Email</label>
                <input
                  name="identifier"
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="e.g. traveler@tripobd.com"
                  required
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button className="button button-primary" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        ) : (
          <div className="totp-challenge-step">
            <div className="shield-icon">🔐</div>
            <h2>Two-Factor Challenge</h2>
            <p className="subtitle">
              Enter the 6-digit verification code from your Google Authenticator or Authy app.
            </p>
            {error && <div className="error-badge">{error}</div>}
            <form onSubmit={handle2FASubmit}>
              <div className="input-group">
                <label>Authentication Code</label>
                <input
                  name="totpCode"
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  className="totp-input"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button className="button button-primary" type="submit" disabled={verifying2FA || totpCode.length !== 6}>
                {verifying2FA ? 'Verifying Code...' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                className="button button-secondary text-btn"
                onClick={() => {
                  setRequires2FA(false)
                  setPreAuthToken('')
                  setTotpCode('')
                  setError('')
                }}
              >
                ← Back to Password Login
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .auth-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 120px 1.5rem 4rem 1.5rem;
          box-sizing: border-box;
        }
        .auth-card { background:#fff; padding:2.5rem; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.08); width:380px; max-width:90%; position:relative; z-index:10; }
        .auth-card h1, .auth-card h2 { margin:0 0 0.4rem 0; color:#0f172a; font-weight:700; font-size:1.6rem; }
        .auth-card .subtitle { color:#64748b; font-size:0.9rem; margin-bottom:1.5rem; line-height:1.4; }
        .auth-card form { display:flex; flex-direction:column; gap:1.1rem; }
        .input-group { display:flex; flex-direction:column; gap:0.35rem; text-align:left; }
        .input-group label { font-size:0.85rem; font-weight:600; color:#334155; }
        .auth-card input { padding:0.75rem 0.9rem; border:1px solid #cbd5e1; border-radius:8px; font-size:0.95rem; outline:none; transition:border-color 0.2s; }
        .auth-card input:focus { border-color:#0284c7; box-shadow:0 0 0 3px rgba(2,132,199,0.15); }
        .error-badge { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; padding:0.6rem 0.8rem; border-radius:6px; font-size:0.85rem; margin-bottom:1rem; }
        .shield-icon { font-size:2.5rem; margin-bottom:0.5rem; }
        .totp-challenge-step { text-align:center; }
        .totp-input { font-family:monospace; font-size:1.5rem !important; letter-spacing:0.4rem; text-align:center; }
        .text-btn { background:none !important; border:none !important; color:#64748b; font-size:0.85rem; cursor:pointer; padding:0.4rem; margin-top:0.2rem; }
        .text-btn:hover { color:#0f172a; text-decoration:underline; }

        [data-theme="dark"] .auth-card {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }
        [data-theme="dark"] .auth-card h1,
        [data-theme="dark"] .auth-card h2 {
          color: #f8fafc;
        }
        [data-theme="dark"] .auth-card .subtitle {
          color: #94a3b8;
        }
        [data-theme="dark"] .input-group label {
          color: #cbd5e1;
        }
        [data-theme="dark"] .auth-card input {
          background: #0f172a;
          border-color: #334155;
          color: #f8fafc;
        }
        [data-theme="dark"] .auth-card input:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
        }
        [data-theme="dark"] .text-btn {
          color: #94a3b8;
        }
        [data-theme="dark"] .text-btn:hover {
          color: #f8fafc;
        }
      `}</style>
    </div>
  )
}
