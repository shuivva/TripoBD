import React, { useState } from 'react'

export default function About() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    setSubmitStatus('success')
    setFormData({ name: '', email: '', message: '' })
    setTimeout(() => setSubmitStatus(null), 3000)
  }

  return (
    <main className="page-shell about-page">

      {/* ═══ HERO ═══ */}
      <section className="ab-hero">
        <div className="ab-hero-bg">
          <div className="ab-hero-overlay" />
        </div>
        <div className="ab-hero-body">
          <span className="ab-eyebrow">✦ About Us</span>
          <h1>Discover our mission &amp; the story<br/>powering <span className="ab-highlight">TripoBD</span>.</h1>
          <p>Built by students. Driven by passion. Made for Bangladesh.</p>
        </div>
      </section>

      {/* ═══ MISSION & VISION ═══ */}
      <section className="ab-section">
        <div className="ab-intro">
          <span className="ab-eyebrow">✦ Our Purpose</span>
          <h2>Mission &amp; Vision</h2>
        </div>
        <div className="ab-mv-grid">
          <div className="ab-mv-card ab-mv-mission">
            <div className="ab-mv-top-bar" />
            <div className="ab-mv-icon">🎯</div>
            <h3>Our Mission</h3>
            <p>To provide travelers with authentic, accessible, and comprehensive information about Bangladesh — making trip planning effortless, collaborative, and enjoyable for everyone.</p>
          </div>
          <div className="ab-mv-card ab-mv-vision">
            <div className="ab-mv-top-bar ab-mv-top-bar-green" />
            <div className="ab-mv-icon">🌿</div>
            <h3>Our Vision</h3>
            <p>To become the premier platform for discovering the hidden gems and cultural heritage of Bangladesh, promoting sustainable and responsible tourism for future generations.</p>
          </div>
        </div>
      </section>

      {/* ═══ THE PROJECT ═══ */}
      <section className="ab-section ab-project-section">
        <div className="ab-intro">
          <span className="ab-eyebrow">✦ The Project</span>
          <h2>What TripoBD Offers</h2>
          <p className="ab-sub">An all-in-one platform designed to solve real travel problems in Bangladesh</p>
        </div>
        <div className="ab-project-grid">
          {[
            { icon: '🗺️', title: 'Smart Discovery', desc: 'Curated destinations with local insights, weather forecasts, and budget estimates all in one place.' },
            { icon: '👥', title: 'Group Trip Planning', desc: 'Invite friends, assign tasks, coordinate bookings, and manage itineraries together seamlessly.' },
            { icon: '🤖', title: 'AI Travel Assistant', desc: 'Get instant recommendations for routes, local tips, and custom itineraries from our smart AI.' },
            { icon: '🧭', title: 'Local Guides & Safety', desc: 'Connect with verified local guides and access real-time safety advisories for offbeat paths.' },
          ].map((item, i) => (
            <div key={i} className="ab-project-card">
              <div className="ab-project-icon">{item.icon}</div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PROBLEM STATEMENT ═══ */}
      <section className="ab-section ab-pain-section">
        <div className="ab-intro">
          <span className="ab-eyebrow">✦ The Problem</span>
          <h2>Why We Built TripoBD</h2>
          <p className="ab-sub">Addressing the real pain points every traveler faces in Bangladesh</p>
        </div>
        <div className="ab-pain-grid">
          {[
            { n: '01', icon: '🗺️', title: 'Fragmented Info', desc: 'Difficulty finding reliable and centralized destination information in one place.' },
            { n: '02', icon: '🚌', title: 'Transit Confusion', desc: 'Lack of clear, up-to-date transportation routes and schedules across districts.' },
            { n: '03', icon: '🗣️', title: 'Language Barriers', desc: 'Struggling with local dialects when navigating rural and off-the-beaten-path areas.' },
            { n: '04', icon: '🏨', title: 'Accommodation Issues', desc: 'Hard to find and verify authentic, safe stays outside the major city centres.' },
            { n: '05', icon: '🔒', title: 'Safety Concerns', desc: 'Uncertainty regarding safe travel times and zones for both local and foreign tourists.' },
          ].map((item) => (
            <div key={item.n} className="ab-pain-card">
              <span className="ab-pain-num">{item.n}</span>
              <div className="ab-pain-icon">{item.icon}</div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section className="ab-section ab-contact-section">
        <div className="ab-intro">
          <span className="ab-eyebrow">✦ Contact</span>
          <h2>Get in Touch</h2>
          <p className="ab-sub">We'd love to hear your feedback, suggestions, or questions!</p>
        </div>

        <div className="ab-contact-wrap">
          <div className="ab-contact-info">
            <div className="ab-info-item">
              <span className="ab-info-icon">📍</span>
              <div>
                <strong>Location</strong>
                <p>United International University, Dhaka, Bangladesh</p>
              </div>
            </div>
            <div className="ab-info-item">
              <span className="ab-info-icon">📧</span>
              <div>
                <strong>Email</strong>
                <p>team@tripobd.com</p>
              </div>
            </div>
            <div className="ab-info-item">
              <span className="ab-info-icon">💬</span>
              <div>
                <strong>Response Time</strong>
                <p>We reply within 24 hours</p>
              </div>
            </div>
            <div className="ab-info-deco">
              <div className="ab-deco-ring" />
              <div className="ab-deco-ring ab-deco-ring-2" />
            </div>
          </div>

          <div className="ab-contact-form-box">
            {submitStatus === 'success' && (
              <div className="ab-success-banner">
                ✅ Thank you! We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="ab-contact-form">
              <div className="ab-field">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text" id="name" name="name" required
                  placeholder="e.g. Sourav Biswas"
                  value={formData.name} onChange={handleChange}
                />
              </div>

              <div className="ab-field">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email" id="email" name="email" required
                  placeholder="e.g. hello@email.com"
                  value={formData.email} onChange={handleChange}
                />
              </div>

              <div className="ab-field">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message" name="message" required rows="5"
                  placeholder="Share your thoughts, feedback, or questions..."
                  value={formData.message} onChange={handleChange}
                ></textarea>
              </div>

              <button type="submit" className="ab-submit-btn">
                Send Message →
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ════════════ STYLES ════════════ */}
      <style>{`
        /* ── HERO ── */
        .ab-hero {
          position: relative; border-radius: 1.5rem; overflow: hidden;
          min-height: 420px; display: flex; align-items: center;
          justify-content: center; text-align: center; margin-bottom: 2rem;
          box-shadow: 0 12px 48px rgba(0,0,0,.2);
        }
        .ab-hero-bg {
          position: absolute; inset: 0; z-index: 0;
          /* Misty Mountains / Sajek Vibes - Perfect for Vision & Mission */
          background-image: url('https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1920');
          background-size: cover; background-position: center;
          filter: brightness(0.4) saturate(1.25);
        }
        .ab-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(6,10,40,.6) 0%, rgba(6,10,40,.35) 55%, rgba(6,10,40,.8) 100%);
        }
        .ab-hero-body {
          position: relative; z-index: 2; padding: 4rem 2rem;
          max-width: 780px; color: #fff;
          display: flex; flex-direction: column; align-items: center;
        }
        .ab-eyebrow {
          display: inline-block; background: linear-gradient(90deg,#e63946,#f4a261);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.82rem; letter-spacing:.06em; text-transform:uppercase; margin-bottom:.5rem;
        }
        .ab-hero-body h1 {
          color: #fff; font-size: clamp(2rem,4vw,2.8rem);
          margin: .5rem 0 .75rem; font-weight: 800;
        }
        .ab-highlight {
          background: linear-gradient(135deg,#10b981,#38bdf8);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .ab-hero-body p {
          color: rgba(255,255,255,.85); font-size: 1.1rem;
          line-height: 1.6; max-width: 540px;
        }

        /* ── SECTIONS ── */
        .ab-section { padding: 4rem clamp(1.5rem,5vw,6rem); }
        .ab-intro { text-align: center; margin-bottom: 2.5rem; }
        .ab-intro h2 { font-size: clamp(1.5rem,3vw,2.2rem); font-weight: 800; color: #0f172a; margin: .5rem 0 0; }
        .ab-sub { color: #64748b; font-size: 1rem; margin-top: .5rem; max-width: 600px; margin-left: auto; margin-right: auto; }

        /* ── MISSION & VISION ── */
        .ab-mv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .ab-mv-card {
          border-radius: 1.5rem; padding: 2.5rem 2rem; position: relative;
          overflow: hidden; color: #fff; display: flex; flex-direction: column;
        }
        .ab-mv-top-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg,#e63946,#f4a261); border-radius: 1.5rem 1.5rem 0 0;
        }
        .ab-mv-top-bar-green { background: linear-gradient(90deg,#10b981,#38bdf8); }
        .ab-mv-mission {
          background: linear-gradient(160deg, #0d1b2a 0%, #1b2838 100%);
          border: 1px solid rgba(255,255,255,.08);
        }
        .ab-mv-vision {
          background: linear-gradient(160deg, #042f2e 0%, #064e3b 100%);
          border: 1px solid rgba(255,255,255,.08);
        }
        .ab-mv-icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .ab-mv-card h3 { font-size: 1.3rem; font-weight: 700; margin: 0 0 .75rem; }
        .ab-mv-card p { color: rgba(255,255,255,.75); line-height: 1.7; margin: 0; }

        /* ── THE PROJECT ── */
        .ab-project-section { background: #f7f9fc; border-radius: 1.5rem; margin: 0 clamp(1rem,3vw,3rem); }
        .ab-project-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        .ab-project-card {
          background: #fff; border: 1.5px solid #f1f5f9; border-radius: 1.25rem;
          padding: 1.75rem; transition: transform .25s, box-shadow .25s, border-color .25s;
        }
        .ab-project-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(16,185,129,.12); border-color: rgba(16,185,129,.2); }
        .ab-project-icon { font-size: 2rem; margin-bottom: 1rem; }
        .ab-project-card h4 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 .5rem; }
        .ab-project-card p { font-size: .88rem; color: #64748b; line-height: 1.6; margin: 0; }

        /* ── PAIN POINTS ── */
        .ab-pain-section {
          background: linear-gradient(145deg, #fef7f0 0%, #fdf2e9 40%, #f7f9fc 100%);
          border-radius: 1.5rem; margin: 0 clamp(1rem,3vw,3rem);
        }
        .ab-pain-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.25rem; }
        .ab-pain-card {
          background: #fff; border-radius: 1.25rem; padding: 1.75rem 1.5rem;
          position: relative; border: 1.5px solid rgba(230,57,70,.06);
          box-shadow: 0 4px 16px rgba(0,0,0,.05); transition: transform .25s, box-shadow .25s;
        }
        .ab-pain-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(230,57,70,.1); }
        .ab-pain-num {
          position: absolute; top: 1rem; right: 1.25rem;
          font-size: .7rem; font-weight: 800; color: #e63946; letter-spacing: .05em; opacity: .6;
        }
        .ab-pain-icon { font-size: 2rem; margin-bottom: .75rem; }
        .ab-pain-card h4 { font-size: 1rem; font-weight: 700; margin: 0 0 .5rem; color: #0f172a; }
        .ab-pain-card p { font-size: .85rem; color: #64748b; margin: 0; line-height: 1.6; }

        /* ── CONTACT ── */
        .ab-contact-wrap { display: grid; grid-template-columns: 1fr 1.6fr; gap: 2rem; }
        
        .ab-contact-info {
          background: linear-gradient(160deg, #0d1b2a 0%, #1b2838 100%);
          border: 1px solid rgba(255,255,255,.08); border-radius: 1.5rem;
          padding: 2.5rem; color: #fff; position: relative; overflow: hidden;
        }
        .ab-info-item { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 2rem; }
        .ab-info-icon { font-size: 1.5rem; margin-top: .1rem; }
        .ab-info-item strong {
          display: block; font-size: .78rem; letter-spacing: .06em;
          text-transform: uppercase; color: #38bdf8; margin-bottom: .25rem;
        }
        .ab-info-item p { margin: 0; font-size: .95rem; color: rgba(255,255,255,.8); }
        
        .ab-info-deco { position: absolute; bottom: -40px; right: -40px; pointer-events: none; }
        .ab-deco-ring {
          width: 140px; height: 140px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,.06); position: absolute; bottom: 0; right: 0;
        }
        .ab-deco-ring-2 { width: 200px; height: 200px; bottom: -30px; right: -30px; }

        .ab-contact-form-box {
          background: #fff; border: 1.5px solid #f1f5f9; border-radius: 1.5rem;
          padding: 2.5rem; box-shadow: 0 4px 20px rgba(0,0,0,.06);
        }
        .ab-success-banner {
          background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;
          border-radius: .75rem; padding: .9rem 1rem; margin-bottom: 1.5rem;
          font-size: .95rem; font-weight: 600;
        }
        .ab-field { margin-bottom: 1.25rem; }
        .ab-field label {
          display: block; font-size: .82rem; font-weight: 700; color: #334155;
          margin-bottom: .4rem; letter-spacing: .02em;
        }
        .ab-field input, .ab-field textarea {
          width: 100%; box-sizing: border-box;
          border: 1.5px solid #e2e8f0; border-radius: .65rem;
          padding: .7rem .9rem; font-size: .95rem; font-family: inherit;
          color: #0f172a; background: #f8fafc; transition: border-color .2s, box-shadow .2s, background .2s;
          resize: vertical;
        }
        .ab-field input::placeholder, .ab-field textarea::placeholder { color: #94a3b8; }
        .ab-field input:focus, .ab-field textarea:focus {
          outline: none; border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,.1); background: #fff;
        }
        .ab-submit-btn {
          width: 100%; padding: .85rem; border: none;
          background: linear-gradient(135deg, #10b981, #059669); color: #fff;
          border-radius: .65rem; font-size: 1rem; font-weight: 700; cursor: pointer;
          letter-spacing: .03em; transition: opacity .2s, transform .15s; margin-top: .5rem;
        }
        .ab-submit-btn:hover { opacity:.88; transform:scale(1.01); }

        @media(max-width:1024px){
          .ab-pain-grid { grid-template-columns: repeat(3, 1fr); }
          .ab-project-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media(max-width:768px){
          .ab-mv-grid { grid-template-columns: 1fr; }
          .ab-contact-wrap { grid-template-columns: 1fr; }
          .ab-pain-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media(max-width:640px){
          .ab-hero { min-height: 360px; }
          .ab-hero-body { padding: 2.5rem 1.25rem; }
          .ab-pain-grid { grid-template-columns: 1fr; }
          .ab-project-grid { grid-template-columns: 1fr; }
          .ab-section { padding: 3rem 1.25rem; }
          .ab-project-section, .ab-pain-section { margin: 0; border-radius: 1.5rem; }
        }
      `}</style>
    </main>
  )
}