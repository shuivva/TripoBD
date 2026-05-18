import React from 'react'

export default function TravelerDashboard() {
  return (
    <main className="page-shell">
      <section className="section-intro">
        <h1>Traveler Dashboard</h1>
        <p>Testing dashboard</p>
      </section>
      <section className="dashboard-grid">
        <div className="card">
          <h3>Upcoming Trips</h3>
          <p>No trips scheduled yet.</p>
        </div>
        <div className="card">
          <h3>Saved Destinations</h3>
          <p>You haven't saved any yet.</p>
        </div>
        <div className="card">
          <h3>Profile</h3>
          <p>Complete your profile to get personalized recommendations.</p>
        </div>
      </section>
      <style>{`
        .section-intro { text-align: center; margin-bottom: 2rem; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
        .card { padding: 1rem; background: #fff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
      `}</style>
    </main>
  )
}
