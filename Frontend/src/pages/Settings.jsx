import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getTravelerDisplaySettings,
  updateTravelerDisplaySettings,
  getTravelerAccountSettings,
  updateTravelerAccountSettings,
  changeTravelerPassword,
  getTravelerBlockedUsers,
  blockTravelerUser,
  unblockTravelerUser,
  requestTravelerAccountDeletion,
  cancelTravelerAccountDeletion,
  exportTravelerData,
} from '../apiClient'

export default function Settings() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')
  
  const [activeTab, setActiveTab] = useState('display')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'auto',
    font_size: 'medium',
    language: 'en',
  })
  
  // Account settings
  const [accountSettings, setAccountSettings] = useState({
    profile_visibility: 'public',
    two_factor_enabled: false,
    deactivation_requested: false,
  })
  
  // Password change
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  
  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState([])
  const [blockUsername, setBlockUsername] = useState('')
  const [blockReason, setBlockReason] = useState('')
  
  // Account deletion
  const [deletionReason, setDeletionReason] = useState('')
  
  // Theme application functions
  const applyTheme = (theme) => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
    localStorage.setItem('appTheme', theme)
    console.log('Theme applied:', theme, 'Current data-theme:', document.documentElement.getAttribute('data-theme'))
  }
  
  const applyFontSize = (fontSize) => {
    document.documentElement.setAttribute('data-font-size', fontSize)
    localStorage.setItem('appFontSize', fontSize)
    console.log('Font size applied:', fontSize)
  }
  
  const applyLanguage = (language) => {
    document.documentElement.setAttribute('data-language', language)
    localStorage.setItem('appLanguage', language)
    console.log('Language applied:', language, 'Current data-language:', document.documentElement.getAttribute('data-language'))
  }
  
  useEffect(() => {
    if (!userId) {
      navigate('/signin')
      return
    }
    loadSettings()
    loadBlockedUsers()
  }, [userId])
  
  const loadSettings = async () => {
    try {
      const [display, account] = await Promise.all([
        getTravelerDisplaySettings(userId),
        getTravelerAccountSettings(userId),
      ])
      setDisplaySettings(display)
      setAccountSettings(account)
      // Apply theme immediately on load
      applyTheme(display.theme)
      applyFontSize(display.font_size)
      applyLanguage(display.language)
    } catch (err) {
      setError('Failed to load settings')
    }
  }
  
  const loadBlockedUsers = async () => {
    try {
      const data = await getTravelerBlockedUsers(userId)
      setBlockedUsers(data)
    } catch (err) {
      console.error('Failed to load blocked users')
    }
  }
  
  const handleDisplaySettingsSave = async () => {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      await updateTravelerDisplaySettings(userId, displaySettings)
      setSuccessMsg('Display settings updated successfully!')
      // Apply theme immediately
      applyTheme(displaySettings.theme)
      applyFontSize(displaySettings.font_size)
      applyLanguage(displaySettings.language)
    } catch (err) {
      setError('Failed to update display settings')
    } finally {
      setLoading(false)
    }
  }
  
  const handleAccountSettingsSave = async () => {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      await updateTravelerAccountSettings(userId, accountSettings)
      setSuccessMsg('Account settings updated successfully!')
    } catch (err) {
      setError('Failed to update account settings')
    } finally {
      setLoading(false)
    }
  }
  
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      await changeTravelerPassword(userId, {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      })
      setSuccessMsg('Password changed successfully!')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setError('Failed to change password. Please check your old password.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleBlockUser = async () => {
    if (!blockUsername.trim()) return
    setLoading(true)
    setError('')
    try {
      await blockTravelerUser(userId, {
        blocked_user_id: blockUsername,
        reason: blockReason,
      })
      setSuccessMsg('User blocked successfully!')
      setBlockUsername('')
      setBlockReason('')
      loadBlockedUsers()
    } catch (err) {
      setError('Failed to block user. Please check the username.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleUnblockUser = async (blockedUserId) => {
    setLoading(true)
    setError('')
    try {
      await unblockTravelerUser(userId, blockedUserId)
      setSuccessMsg('User unblocked successfully!')
      loadBlockedUsers()
    } catch (err) {
      setError('Failed to unblock user')
    } finally {
      setLoading(false)
    }
  }
  
  const handleRequestDeletion = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      await requestTravelerAccountDeletion(userId, { reason: deletionReason })
      setSuccessMsg('Account deletion requested. Your account will be permanently deleted in 30 days.')
      loadSettings()
    } catch (err) {
      setError('Failed to request account deletion')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCancelDeletion = async () => {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      await cancelTravelerAccountDeletion(userId)
      setSuccessMsg('Account deletion request cancelled!')
      loadSettings()
    } catch (err) {
      setError('Failed to cancel account deletion')
    } finally {
      setLoading(false)
    }
  }
  
  const handleExportData = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await exportTravelerData(userId)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tripo-data-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setSuccessMsg('Data exported successfully!')
    } catch (err) {
      setError('Failed to export data')
    } finally {
      setLoading(false)
    }
  }
  
  if (!userId) return null
  
  return (
    <main className="page-shell settings-page-shell">
      {error && <div className="profile-alert error">{error}</div>}
      {successMsg && <div className="profile-alert success">{successMsg}</div>}

      <header className="settings-page-header">
        <h1>Settings</h1>
        <p>Customize your TripoBD experience</p>
      </header>

      <div className="settings-container">
        <aside className="settings-sidebar">
          <h2>Settings</h2>
          <nav>
            <button 
              className={activeTab === 'display' ? 'active' : ''} 
              onClick={() => setActiveTab('display')}
            >
              🎨 Display & Language
            </button>
            <button 
              className={activeTab === 'account' ? 'active' : ''} 
              onClick={() => setActiveTab('account')}
            >
              🔐 Account & Privacy
            </button>
            <button 
              className={activeTab === 'security' ? 'active' : ''} 
              onClick={() => setActiveTab('security')}
            >
              🔒 Security
            </button>
            <button 
              className={activeTab === 'blocked' ? 'active' : ''} 
              onClick={() => setActiveTab('blocked')}
            >
              🚫 Blocked Users
            </button>
            <button 
              className={activeTab === 'data' ? 'active' : ''} 
              onClick={() => setActiveTab('data')}
            >
              📦 Data & Deletion
            </button>
          </nav>
        </aside>
        
        <section className="settings-content">
          {activeTab === 'display' && (
            <div className="settings-section">
              <h3>Display & Language</h3>
              
              <div className="setting-group">
                <label>Theme</label>
                <select 
                  value={displaySettings.theme}
                  onChange={(e) => setDisplaySettings({...displaySettings, theme: e.target.value})}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>Font Size</label>
                <select 
                  value={displaySettings.font_size}
                  onChange={(e) => setDisplaySettings({...displaySettings, font_size: e.target.value})}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>Language</label>
                <select 
                  value={displaySettings.language}
                  onChange={(e) => setDisplaySettings({...displaySettings, language: e.target.value})}
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা (Bangla)</option>
                </select>
              </div>
              
              <button className="button button-primary" onClick={handleDisplaySettingsSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Display Settings'}
              </button>
            </div>
          )}
          
          {activeTab === 'account' && (
            <div className="settings-section">
              <h3>Account & Privacy</h3>
              
              <div className="setting-group">
                <label>Profile Visibility</label>
                <select 
                  value={accountSettings.profile_visibility}
                  onChange={(e) => setAccountSettings({...accountSettings, profile_visibility: e.target.value})}
                >
                  <option value="public">Public</option>
                  <option value="friends_only">Friends Only</option>
                  <option value="private">Private</option>
                </select>
                <small>Control who can see your profile and activity</small>
              </div>
              
              <div className="setting-group">
                <label>Tour Room Invites</label>
                <select>
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends Only</option>
                  <option value="none">No One</option>
                </select>
                <small>Control who can invite you to Tour Rooms</small>
              </div>
              
              <div className="setting-group">
                <label>Story Visibility</label>
                <select>
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
                <small>Control who can see your travel stories</small>
              </div>
              
              <button className="button button-primary" onClick={handleAccountSettingsSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Security</h3>
              
              <div className="setting-group">
                <label>Two-Factor Authentication</label>
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={accountSettings.two_factor_enabled === 'true' || accountSettings.two_factor_enabled === true}
                    onChange={(e) => setAccountSettings({...accountSettings, two_factor_enabled: e.target.checked})}
                  />
                  <span className="slider"></span>
                </div>
                <small>Add an extra layer of security to your account</small>
                <button className="button button-secondary" onClick={handleAccountSettingsSave} disabled={loading} style={{ marginTop: '0.5rem' }}>
                  {loading ? 'Saving...' : 'Save 2FA Setting'}
                </button>
              </div>
              
              <hr />
              
              <h4>Change Password</h4>
              <form onSubmit={handlePasswordChange}>
                <div className="setting-group">
                  <label>Current Password</label>
                  <input 
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({...passwordForm, old_password: e.target.value})}
                    required
                  />
                </div>
                <div className="setting-group">
                  <label>New Password</label>
                  <input 
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                    required
                  />
                </div>
                <div className="setting-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" className="button button-primary" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}
          
          {activeTab === 'blocked' && (
            <div className="settings-section">
              <h3>Blocked Users</h3>
              
              <div className="block-user-form">
                <div className="setting-group">
                  <label>Block User by Username</label>
                  <input 
                    type="text"
                    placeholder="Enter username"
                    value={blockUsername}
                    onChange={(e) => setBlockUsername(e.target.value)}
                  />
                </div>
                <div className="setting-group">
                  <label>Reason (Optional)</label>
                  <input 
                    type="text"
                    placeholder="Why are you blocking this user?"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>
                <button className="button button-danger" onClick={handleBlockUser} disabled={loading}>
                  {loading ? 'Blocking...' : 'Block User'}
                </button>
              </div>
              
              <div className="blocked-users-list">
                <h4>Blocked Users ({blockedUsers.length})</h4>
                {blockedUsers.length === 0 ? (
                  <p className="community-muted">No blocked users</p>
                ) : (
                  blockedUsers.map((user) => (
                    <div key={user.id} className="blocked-user-item">
                      <span>@{user.blocked_username}</span>
                      {user.reason && <small>Reason: {user.reason}</small>}
                      <button 
                        className="button button-secondary" 
                        onClick={() => handleUnblockUser(user.blocked)}
                        disabled={loading}
                      >
                        Unblock
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'data' && (
            <div className="settings-section">
              <h3>Data & Account Management</h3>
              
              <div className="setting-group">
                <label>Export Your Data</label>
                <p className="community-muted">Download all your personal data including profile, travel stats, wishlist, and stories.</p>
                <button className="button button-secondary" onClick={handleExportData} disabled={loading}>
                  {loading ? 'Exporting...' : '📥 Export Data'}
                </button>
              </div>
              
              <hr />
              
              <div className="danger-zone">
                <h4>Danger Zone</h4>
                {accountSettings.deactivation_requested ? (
                  <div className="deletion-pending">
                    <p>⚠️ Account deletion requested on {new Date(accountSettings.deactivation_requested_at).toLocaleDateString()}</p>
                    <p>Your account will be permanently deleted in 30 days.</p>
                    <button className="button button-secondary" onClick={handleCancelDeletion} disabled={loading}>
                      {loading ? 'Cancelling...' : 'Cancel Deletion Request'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="community-muted">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <div className="setting-group">
                      <label>Reason for deletion (Optional)</label>
                      <textarea 
                        placeholder="Why are you leaving?"
                        value={deletionReason}
                        onChange={(e) => setDeletionReason(e.target.value)}
                        rows="3"
                      />
                    </div>
                    <button className="button button-danger" onClick={handleRequestDeletion} disabled={loading}>
                      {loading ? 'Requesting...' : '🗑️ Request Account Deletion'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
      
      <style>{`
        main.settings-page-shell {
          margin-top: 60px !important;
          margin-left: 240px !important;
          width: calc(100% - 240px) !important;
          max-width: none !important;
          padding: 2rem !important;
          min-height: calc(100vh - 60px);
          box-sizing: border-box;
        }
        .settings-page-header h1 {
          margin: 0 0 0.35rem 0;
          font-size: 2.2rem;
          font-weight: 850;
          color: #0f172a;
        }
        .settings-page-header p {
          margin: 0;
          font-size: 1.05rem;
          color: #64748b;
        }
        .settings-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          main.settings-page-shell {
            margin-left: 70px !important;
            width: calc(100% - 70px) !important;
          }
        }
        
        .settings-sidebar {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--elev);
          height: fit-content;
        }
        
        .settings-sidebar h2 {
          margin: 0 0 1.5rem;
          font-size: 1.25rem;
          color: var(--text-h);
        }
        
        .settings-sidebar nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .settings-sidebar nav button {
          text-align: left;
          padding: 0.85rem 1rem;
          border: 1px solid var(--border);
          background: transparent;
          border-radius: 12px;
          font-size: 0.95rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .settings-sidebar nav button:hover {
          background: rgba(91, 140, 255, 0.1);
          transform: translateY(-2px);
        }
        
        .settings-sidebar nav button.active {
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          color: white;
          border-color: transparent;
        }
        
        .settings-content {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 2rem;
          box-shadow: var(--elev);
        }
        
        .settings-section h3 {
          margin: 0 0 2rem;
          font-size: 1.5rem;
          color: #0f172a;
        }
        
        .settings-section h4 {
          margin: 2rem 0 1rem;
          font-size: 1.1rem;
          color: #334155;
        }
        
        .setting-group {
          margin-bottom: 1.5rem;
        }
        
        .setting-group label {
          display: block;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        
        .setting-group select,
        .setting-group input,
        .setting-group textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        
        .setting-group select:focus,
        .setting-group input:focus,
        .setting-group textarea:focus {
          outline: none;
          border-color: #10b981;
        }
        
        .setting-group small {
          display: block;
          margin-top: 0.4rem;
          color: #64748b;
          font-size: 0.82rem;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: 0.3s;
          border-radius: 26px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: #10b981;
        }
        
        input:checked + .slider:before {
          transform: translateX(24px);
        }
        
        .block-user-form {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }
        
        .blocked-users-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .blocked-user-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        .blocked-user-item span {
          font-weight: 600;
          color: #334155;
        }
        
        .blocked-user-item small {
          color: #64748b;
          margin-left: 0.5rem;
        }
        
        .danger-zone {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 1.5rem;
        }
        
        .danger-zone h4 {
          color: #dc2626;
          margin-top: 0;
        }
        
        .deletion-pending {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 10px;
          padding: 1rem;
        }
        
        .deletion-pending p {
          margin: 0.5rem 0;
          color: #c2410c;
        }
        
        hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 2rem 0;
        }
        
        @media (max-width: 768px) {
          .settings-container {
            grid-template-columns: 1fr;
          }
          
          .settings-sidebar {
            margin-bottom: 1rem;
          }
          
          .settings-sidebar nav {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 0.5rem;
          }
          
          .settings-sidebar nav button {
            white-space: nowrap;
          }
        }
      `}</style>
      
      {/* Global theme styles */}
      <style>{`
        :root {
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --text-primary: #0f172a;
          --text-secondary: #64748b;
          --border-color: #e2e8f0;
          --accent: #10b981;
          --accent-hover: #059669;
        }
        
        [data-theme="dark"] {
          --bg-primary: #1e293b;
          --bg-secondary: #334155;
          --text-primary: #f8fafc;
          --text-secondary: #cbd5e1;
          --border-color: #475569;
          --accent: #10b981;
          --accent-hover: #059669;
        }
        
        [data-theme="dark"] body,
        [data-theme="dark"] main,
        [data-theme="dark"] .page-shell {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        
        [data-theme="dark"] .settings-container,
        [data-theme="dark"] .settings-sidebar,
        [data-theme="dark"] .settings-content,
        [data-theme="dark"] .settings-section,
        [data-theme="dark"] .setting-group,
        [data-theme="dark"] .blocked-user-item,
        [data-theme="dark"] .ticket-item,
        [data-theme="dark"] .faq-item,
        [data-theme="dark"] .tutorial-card,
        [data-theme="dark"] .contact-item {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-color: var(--border-color);
        }
        
        [data-theme="dark"] input,
        [data-theme="dark"] select,
        [data-theme="dark"] textarea {
          background: var(--bg-primary);
          color: var(--text-primary);
          border-color: var(--border-color);
        }
        
        [data-theme="dark"] button {
          color: var(--text-primary);
        }
        
        [data-font-size="small"] {
          font-size: 14px;
        }
        
        [data-font-size="medium"] {
          font-size: 16px;
        }
        
        [data-font-size="large"] {
          font-size: 18px;
        }
        
        [data-language="bn"] {
          font-family: 'Hind Siliguri', 'Arial', sans-serif;
        }
      `}</style>
    </main>
  )
}
