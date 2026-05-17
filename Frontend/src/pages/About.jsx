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
    // Simulate form submission
    console.log('Form submitted:', formData)
    setSubmitStatus('success')
    setFormData({ name: '', email: '', message: '' })

    setTimeout(() => setSubmitStatus(null), 3000)
  }

  return (
    <div className="page-container about-page">
      <header className="page-header" style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>About Us</h1>
        <p className="page-description" style={{ margin: '0 auto', maxWidth: '600px' }}>
          Discover our mission, team, and the technology powering TripoBD.
        </p>
      </header>

      {/* Mission & Vision */}
      <section className="about-section">
        <div className="section-content text-center">
          <h2>Project Mission & Vision</h2>
          <div className="mission-vision-cards">
            <div className="card">
              <h3>Our Mission</h3>
              <p>
                To provide travelers with authentic, accessible, and comprehensive information about Bangladesh, making trip planning effortless.
              </p>
            </div>
            <div className="card">
              <h3>Our Vision</h3>
              <p>
                To become the premier platform for discovering the hidden gems and cultural heritage of Bangladesh, promoting sustainable tourism.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Infographic */}
      <section className="about-section bg-light">
        <div className="section-content text-center">
          <h2>Why We Built TripoBD</h2>
          <p className="mb-4">Addressing the common pain points of travelers</p>
          <div className="pain-points-grid">
            <div className="pain-point-item">
              <div className="pain-point-icon">🗺️</div>
              <h4>Fragmented Info</h4>
              <p>Difficulty finding reliable and centralized destination information.</p>
            </div>
            <div className="pain-point-item">
              <div className="pain-point-icon">🚌</div>
              <h4>Transit Confusion</h4>
              <p>Lack of clear, up-to-date transportation routes and schedules.</p>
            </div>
            <div className="pain-point-item">
              <div className="pain-point-icon">🗣️</div>
              <h4>Language Barriers</h4>
              <p>Struggling with local language when navigating rural areas.</p>
            </div>
            <div className="pain-point-item">
              <div className="pain-point-icon">🏨</div>
              <h4>Accommodation Issues</h4>
              <p>Hard to find and verify authentic stays outside major cities.</p>
            </div>
            <div className="pain-point-item">
              <div className="pain-point-icon">🔒</div>
              <h4>Safety Concerns</h4>
              <p>Uncertainty regarding safe travel times and areas for tourists.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Introduction */}
      <section className="about-section">
        <div className="section-content text-center">
          <h2>Team Ctrl+Z</h2>
          <p className="mb-4">The passionate individuals behind TripoBD</p>
          <div className="team-grid">
            {/* Template Team Members - adjust as needed */}
            <div className="team-member-card">
              <div className="member-photo-placeholder">AB</div>
              <h3>Team Member 1</h3>
              <p className="member-role">Frontend Developer</p>
            </div>
            <div className="team-member-card">
              <div className="member-photo-placeholder">CD</div>
              <h3>Team Member 2</h3>
              <p className="member-role">Backend Developer</p>
            </div>
            <div className="team-member-card">
              <div className="member-photo-placeholder">EF</div>
              <h3>Team Member 3</h3>
              <p className="member-role">UI/UX Designer</p>
            </div>
            <div className="team-member-card">
              <div className="member-photo-placeholder">GH</div>
              <h3>Team Member 4</h3>
              <p className="member-role">Project Manager</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Overview */}
      <section className="about-section bg-light">
        <div className="section-content text-center">
          <h2>Technology Stack</h2>
          <div className="tech-stack-showcase">
            <div className="tech-item text-center">
              <div className="tech-icon">⚛️</div>
              <h4>React</h4>
              <p>UI Library</p>
            </div>
            <div className="tech-item text-center">
              <div className="tech-icon">⚡</div>
              <h4>Vite</h4>
              <p>Build Tool</p>
            </div>
            <div className="tech-item text-center">
              <div className="tech-icon">🛣️</div>
              <h4>React Router</h4>
              <p>Navigation</p>
            </div>
            <div className="tech-item text-center">
              <div className="tech-icon">🗺️</div>
              <h4>Leaflet</h4>
              <p>Maps</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / Feedback Form */}
      <section className="about-section">
        <div className="section-content">
          <h2 className="text-center">Get in Touch</h2>
          <p className="text-center mb-4">We'd love to hear your feedback!</p>

          <div className="contact-form-container">
            {submitStatus === 'success' && (
              <div className="alert alert-success mt-4">
                Thank you for your message! We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group mb-3">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-control mt-1 w-100 p-2"
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control mt-1 w-100 p-2"
                />
              </div>

              <div className="form-group mb-4">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  className="form-control mt-1 w-100 p-2"
                ></textarea>
              </div>

              <button type="submit" className="button button-primary w-100">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      <style>{`
        .mb-3 { margin-bottom: 1rem; }
        .mb-4 { margin-bottom: 1.5rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-4 { margin-top: 1.5rem; }
        .w-100 { width: 100%; box-sizing: border-box; }
        .p-2 { padding: 0.5rem; }
        .text-center { text-align: center; }
        .bg-light { background-color: #f8f9fa; padding: 3rem 0; margin: 2rem 0; border-radius: 8px; }

        .about-section { margin-bottom: 4rem; padding: 0 1rem; }
        .section-content { max-width: 800px; margin: 0 auto; }

        .mission-vision-cards { display: grid; grid-template-columns: 1fr; gap: 2rem; margin-top: 2rem; }
        @media (min-width: 768px) {
          .mission-vision-cards { grid-template-columns: 1fr 1fr; }
        }

        .card { padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); background: white; border: 1px solid #eee; }

        .pain-points-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
        .pain-point-item { padding: 1.5rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .pain-point-icon { font-size: 2.5rem; margin-bottom: 1rem; }

        .team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .team-member-card { padding: 1.5rem; background: white; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .member-photo-placeholder { width: 80px; height: 80px; background: #e9ecef; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem; font-weight: bold; color: #adb5bd; }
        .member-role { color: #6c757d; font-size: 0.9rem; margin-top: 0.5rem; }

        .tech-stack-showcase { display: flex; flex-wrap: wrap; justify-content: center; gap: 2rem; margin-top: 2rem; }
        .tech-item { width: 120px; padding: 1rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .tech-icon { font-size: 2rem; margin-bottom: 0.5rem; }

        .contact-form-container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #eee; }
        .form-control { border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; }
        .form-control:focus { outline: none; border-color: #80bdff; box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25); }

        .alert { padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
        .alert-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
      `}</style>
    </div>
  )
}