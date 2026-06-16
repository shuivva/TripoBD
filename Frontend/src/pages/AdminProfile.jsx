import { useState } from 'react'

export default function AdminProfile() {
  const [email, setEmail] = useState('admin@tripobd.com')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFactor, setTwoFactor] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const handleUpdateProfile = (e) => {
    e.preventDefault()
    setMsg('')
    setError('')
    setSubmitLoading(true)
    setTimeout(() => {
      setMsg('Administrative profile settings updated successfully.')
      setSubmitLoading(false)
      setTimeout(() => setMsg(''), 4000)
    }, 800)
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    setMsg('')
    setError('')
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    setSubmitLoading(true)
    setTimeout(() => {
      setMsg('Administrator credentials changed successfully.')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSubmitLoading(false)
      setTimeout(() => setMsg(''), 4000)
    }, 800)
  }

  const permissionsMatrix = [
    { role: 'Superuser (Root)', users: 'admin', users_mgnt: '✅ Yes', guide_verif: '✅ Yes', system_cfg: '✅ Yes', audit_log: '✅ Yes' },
    { role: 'Verification Officer', users: 'sub_admin_verif', users_mgnt: '❌ No', guide_verif: '✅ Yes', system_cfg: '❌ No', audit_log: '✅ View Only' },
    { role: 'Content Moderator', users: 'mod_sajib, mod_tania', users_mgnt: '⚠️ Suspend Only', guide_verif: '❌ No', system_cfg: '❌ No', audit_log: '❌ No' },
    { role: 'Support Agent', users: 'support_sarker', users_mgnt: '❌ No', guide_verif: '❌ No', system_cfg: '❌ No', audit_log: '❌ No' }
  ]

  return (
    <main className="page-shell admin-profile">
      <header className="admin-header">
        <h1>👤 Administrator Profile & Permissions</h1>
        <p>Configure credentials, enable multi-factor security locks, and review system-wide role-based access controls (RBAC).</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="profile-layout-grid">
        {/* Left Column: Form Settings */}
        <div className="settings-column">
          <div className="settings-card">
            <h2>Account Credentials</h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Admin Username</label>
                <input type="text" value="admin" className="form-input" disabled />
                <span className="help-text">Username identifier cannot be changed.</span>
              </div>

              <div className="form-group">
                <label htmlFor="email-input">Administrative Email Address</label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group row-align-checkbox">
                <input
                  id="mfa-lock"
                  type="checkbox"
                  checked={twoFactor}
                  onChange={(e) => setTwoFactor(e.target.checked)}
                  className="checkbox-input"
                />
                <label htmlFor="mfa-lock" className="checkbox-lbl">
                  <strong>Force Multi-Factor Authentication (2FA)</strong>
                  <span className="lbl-desc">Secure logins with verification codes sent to authenticated devices.</span>
                </label>
              </div>

              <button type="submit" className="button button-primary" disabled={submitLoading}>
                Update Admin Account
              </button>
            </form>
          </div>

          <div className="settings-card" style={{ marginTop: '2rem' }}>
            <h2>Change Admin Password</h2>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="old-pass">Current Password</label>
                <input
                  id="old-pass"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-pass">New Secure Password</label>
                <input
                  id="new-pass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-pass">Confirm Password</label>
                <input
                  id="confirm-pass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="button button-primary" disabled={submitLoading}>
                Change Password
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Roles Matrix */}
        <div className="permissions-column">
          <div className="settings-card">
            <h2>Role-Based Permissions Matrix (RBAC)</h2>
            <p className="card-desc">Review which user groups have authority to execute specific operational commands.</p>

            <div className="table-wrapper">
              <table className="permissions-table">
                <thead>
                  <tr>
                    <th>Role Title</th>
                    <th>Assigned Users</th>
                    <th>User Management</th>
                    <th>Guide Verification</th>
                    <th>System Configuration</th>
                    <th>Audit Logs</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionsMatrix.map((row, index) => (
                    <tr key={index}>
                      <td><strong>{row.role}</strong></td>
                      <td><code className="user-code">{row.users}</code></td>
                      <td>{row.users_mgnt}</td>
                      <td>{row.guide_verif}</td>
                      <td>{row.system_cfg}</td>
                      <td>{row.audit_log}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="info-box-card">
            <h3>🔒 Security Compliance Audit Checklist</h3>
            <ul>
              <li><strong>Least Privilege:</strong> Only grant the absolute minimum required permissions to Verification and Moderation accounts.</li>
              <li><strong>Session Lifetimes:</strong> Administrator dashboard sessions are invalidated automatically after 30 minutes of inactivity.</li>
              <li><strong>Audit Logging:</strong> All changes to destinations, configuration override actions, and user bannings are permanently written to the secure database log.</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .admin-profile {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .admin-header h1 {
          font-size: 2.25rem;
          font-weight: 850;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }
        .admin-header p {
          color: #64748b;
          margin: 0 0 2rem 0;
        }

        .alert {
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }
        .alert-danger {
          background: #fee2e2;
          color: #991b1b;
        }
        .alert-success {
          background: #dcfce7;
          color: #166534;
        }

        .profile-layout-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .profile-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .settings-card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 1.75rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.01);
        }
        .settings-card h2 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }
        .card-desc {
          font-size: 0.82rem;
          color: #64748b;
          margin: 0 0 1.5rem 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          margin-bottom: 1.25rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
        }
        .form-input {
          padding: 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          outline: none;
          font-size: 0.9rem;
          background: white;
          font-family: inherit;
        }
        .form-input:focus {
          border-color: #ef4444;
        }
        .form-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .row-align-checkbox {
          flex-direction: row;
          align-items: flex-start;
          gap: 0.75rem;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .checkbox-input {
          width: 18px;
          height: 18px;
          margin-top: 0.15rem;
          cursor: pointer;
        }
        .checkbox-lbl {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          cursor: pointer;
        }
        .checkbox-lbl strong {
          font-size: 0.88rem;
          color: #1e293b;
        }
        .lbl-desc {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          text-transform: none;
        }
        .help-text {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        /* Permissions Table */
        .table-wrapper {
          overflow-x: auto;
          margin-top: 1rem;
        }
        .permissions-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.8rem;
        }
        .permissions-table th {
          background: #f8fafc;
          padding: 0.75rem;
          font-weight: 800;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          text-transform: uppercase;
        }
        .permissions-table td {
          padding: 0.85rem 0.75rem;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }
        .user-code {
          background: #f1f5f9;
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          font-family: monospace;
          color: #ef4444;
        }

        .info-box-card {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 20px;
          padding: 1.5rem;
          margin-top: 2rem;
        }
        .info-box-card h3 {
          font-size: 0.95rem;
          font-weight: 800;
          color: #b45309;
          margin: 0 0 0.75rem 0;
        }
        .info-box-card ul {
          margin: 0;
          padding-left: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .info-box-card li {
          font-size: 0.82rem;
          color: #78350f;
          line-height: 1.4;
        }
      `}</style>
    </main>
  )
}
