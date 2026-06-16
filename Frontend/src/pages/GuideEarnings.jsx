import { useEffect, useState } from 'react'
import { getGuideEarnings, requestPayout } from '../apiClient'

export default function GuideEarnings() {
  const userId = localStorage.getItem('userId')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  // Payout request form state
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bkash')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadEarnings = async () => {
    if (!userId) {
      setError('Please sign in as a service provider.')
      setLoading(false)
      return
    }
    try {
      const res = await getGuideEarnings(userId)
      setData(res)
    } catch {
      setError('Failed to retrieve earnings details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEarnings()
  }, [userId])

  const handleRequestPayout = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      await requestPayout(userId, { amount: parseFloat(amount), method, details })
      setMessage('Payout request submitted successfully! Pending approval.')
      setAmount('')
      setDetails('')
      loadEarnings()
    } catch (err) {
      setError(err.message || 'Failed to submit payout request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="page-shell"><p className="earnings-status">Loading earnings details...</p></main>
  }

  return (
    <main className="page-shell guide-earnings">
      {message && <div className="guide-alert success">{message}</div>}
      {error && <div className="guide-alert error">{error}</div>}

      <header className="earnings-header-main">
        <h1>Earnings & Settlements</h1>
        <p>Keep track of completed payouts, pending settlements, request withdrawals, and view your tax details.</p>
      </header>

      {/* Stats Cards */}
      <section className="stats-row">
        <div className="stat-card">
          <span>Completed Payouts</span>
          <strong>৳{data?.completed_payouts?.toLocaleString()}</strong>
        </div>
        <div className="stat-card warning">
          <span>Pending Settlement</span>
          <strong>৳{data?.pending_settlement?.toLocaleString()}</strong>
        </div>
        <div className="stat-card success">
          <span>Total Earnings (All Time)</span>
          <strong>৳{data?.total_earnings?.toLocaleString()}</strong>
        </div>
      </section>

      <div className="earnings-grid">
        {/* Left: Ledger & Request History */}
        <div className="earnings-col">
          <section className="panel-card">
            <h3>📈 Earnings Ledger (Completed Trips)</h3>
            {data?.ledger?.length === 0 ? (
              <p className="empty-ledger">No settled earnings logged yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Settlement Date</th>
                      <th>Traveler</th>
                      <th>Trip Details</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.ledger?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.date}</td>
                        <td>{item.traveler}</td>
                        <td>{item.trip}</td>
                        <td>৳{item.amount.toLocaleString()}</td>
                        <td><span className="status-badge settled">Settled</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel-card" style={{ marginTop: '1.5rem' }}>
            <h3>📁 Payout History Logs</h3>
            {data?.payouts?.length === 0 ? (
              <p className="empty-ledger">No payout request logs recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Requested Date</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.payouts?.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td>{p.method === 'bkash' ? 'bKash Mobile Wallet' : 'Bank Transfer'}</td>
                        <td>৳{p.amount.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${p.status}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right: Payout Request Form & Tax */}
        <div className="earnings-col">
          <section className="panel-card">
            <h3>💰 Request Payout Settlement</h3>
            <p className="section-subtext">Withdraw settled earnings to your verified bKash wallet or bank account.</p>
            
            <form onSubmit={handleRequestPayout} className="payout-form">
              <label>
                Withdrawal Amount (৳)
                <input
                  type="number"
                  min="500"
                  max={data?.total_earnings - data?.completed_payouts}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Minimum withdrawal limit ৳500"
                  required
                />
              </label>

              <label>
                Payout Destination Method
                <select value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="bkash">bKash Mobile Wallet</option>
                  <option value="bank_transfer">Electronic Bank Transfer</option>
                </select>
              </label>

              <label>
                Account/Wallet Transfer Details
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="e.g. bKash Wallet Number: 01712345678 or Bank Name, Account Number, Routing Code..."
                  rows="3"
                  required
                />
              </label>

              <button type="submit" className="button button-primary submit-payout-btn" disabled={submitting || !amount}>
                {submitting ? 'Submitting Request...' : 'Confirm Payout Request'}
              </button>
            </form>
          </section>

          <section className="panel-card" style={{ marginTop: '1.5rem' }}>
            <h3>📄 Tax & Income Summary</h3>
            <p className="section-subtext">Download your consolidated annual income statement for tax declarations.</p>
            <div className="tax-box">
              <span>Financial Year 2025 - 2026</span>
              <button className="button button-secondary compact" onClick={() => alert('Download starting... (Consolidated Invoice PDF)')}>
                📥 Download PDF Statement
              </button>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .guide-earnings {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .earnings-header-main h1 { font-size: 2.25rem; font-weight: 850; margin: 0 0 0.5rem 0; color: #0f172a; }
        .earnings-header-main p { font-size: 1.05rem; color: #64748b; margin: 0; }
        
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.25rem;
        }
        .stats-row .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.01);
        }
        .stats-row .stat-card span { display: block; font-size: 0.88rem; color: #64748b; margin-bottom: 0.25rem; }
        .stats-row .stat-card strong { font-size: 1.6rem; font-weight: 850; color: #0f172a; }
        .stats-row .stat-card.success strong { color: #166534; }
        .stats-row .stat-card.warning strong { color: #d97706; }
        
        .earnings-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .earnings-grid { grid-template-columns: 1fr; }
        }
        
        .earnings-col { display: flex; flex-direction: column; }
        
        .panel-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
        }
        .panel-card h3 { font-size: 1.15rem; font-weight: 800; margin: 0 0 1rem 0; color: #0f172a; }
        .section-subtext { font-size: 0.82rem; color: #64748b; margin: 0 0 1.25rem 0; line-height: 1.4; }
        
        .empty-ledger { font-size: 0.88rem; color: #94a3b8; padding: 2rem 0; text-align: center; }
        
        .earnings-table { width: 100%; border-collapse: collapse; text-align: left; }
        .earnings-table th { padding: 0.8rem; border-bottom: 2px solid #f1f5f9; font-size: 0.82rem; color: #475569; text-transform: uppercase; font-weight: 800; }
        .earnings-table td { padding: 0.95rem 0.8rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; color: #334155; }
        
        .status-badge { font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; text-transform: uppercase; }
        .status-badge.settled { background: #dcfce7; color: #166534; }
        .status-badge.pending { background: #fef3c7; color: #b45309; }
        .status-badge.completed { background: #dcfce7; color: #166534; }
        .status-badge.rejected { background: #fee2e2; color: #991b1b; }
        
        .payout-form { display: flex; flex-direction: column; gap: 1rem; }
        .payout-form label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; font-weight: 700; color: #475569; }
        .payout-form input, .payout-form select, .payout-form textarea {
          padding: 0.65rem 0.85rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.9rem;
          outline: none;
        }
        .payout-form input:focus, .payout-form select:focus, .payout-form textarea:focus { border-color: #a855f7; }
        .submit-payout-btn { padding: 0.8rem; border-radius: 10px; font-weight: 800; font-size: 0.95rem; margin-top: 0.5rem; }
        
        .tax-box { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1rem; font-size: 0.88rem; color: #475569; font-weight: 700; }
        .earnings-status { text-align: center; padding: 3rem; color: #64748b; }
      `}</style>
    </main>
  )
}
