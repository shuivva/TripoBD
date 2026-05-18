import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const divisions = [
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Sylhet',
  'Rangpur',
  'Mymensingh'
]

const districts = {
  'Dhaka': ['Dhaka', 'Gazipur', 'Narayanganj', 'Manikganj', 'Munshiganj', 'Narsingdi', 'Tangail', 'Kishoreganj', 'Faridpur', 'Gopalganj', 'Madariipur', 'Rajbari', 'Shariatpur'],
  'Chittagong': ['Chittagong', 'Coxs Bazar', 'Bandarban', 'Rangamati', 'Khagrachhari', 'Feni', 'Noakhali', 'Lakshmipur', 'Comilla', 'Brahmanbaria', 'Chandpur'],
  'Rajshahi': ['Rajshahi', 'Pabna', 'Sirajganj', 'Bogura', 'Natore', 'Joypurhat', 'Naogaon', 'Chapainawabganj'],
  'Khulna': ['Khulna', 'Bagerhat', 'Satkhira', 'Narail', 'Jessore', 'Jhenaidah', 'Magura', 'Meherpur', 'Kushtia', 'Chuadanga'],
  'Barisal': ['Barisal', 'Patuakhali', 'Bhola', 'Pirojpur', 'Jhalokati', 'Barguna'],
  'Sylhet': ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  'Rangpur': ['Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'],
  'Mymensingh': ['Mymensingh', 'Jamalpur', 'Sherpur', 'Netrokona']
}

export default function TravelerRegistration() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    date_of_birth: '',
    gender: '',
    division: '',
    district: '',
    profile_photo: null,
    national_id: '',
    username: '',
    password: '',
    confirm_password: '',
    terms_accepted: false
  })

  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '' })

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }))

    if (name === 'password') {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password) => {
    let score = 0
    if (password.length >= 8) score++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++
    if (password.match(/\d/)) score++
    if (password.match(/[^a-zA-Z\d]/)) score++

    const strengthLevels = ['Weak', 'Fair', 'Good', 'Strong']
    setPasswordStrength({
      score,
      text: strengthLevels[score - 1] || 'Very Weak'
    })
  }

  const handleDivisionChange = (e) => {
    const division = e.target.value
    setFormData(prev => ({
      ...prev,
      division,
      district: ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.terms_accepted) {
      setError('Please accept the Terms and Conditions')
      setLoading(false)
      return
    }

    // Basic client-side validations to catch common issues early
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!formData.email) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!formData.username || formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      setLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      Object.keys(formData).forEach((key) => {
        if (key === 'terms_accepted') return

        let value = formData[key]

        // Skip empty values to avoid submitting blank fields that may violate DB constraints
        const isEmptyString = typeof value === 'string' && value.trim() === ''
        const isNull = value === null || value === undefined
        const isEmptyFile = value instanceof File === true && value.size === 0
        if (isEmptyString || isNull || isEmptyFile) return

        // Normalize certain fields expected by the backend
        if (key === 'division' && value) {
          value = String(value).toLowerCase().replace(/\s+/g, '_')
        } else if (key === 'gender' && value) {
          value = String(value).toLowerCase()
        }

        formDataToSend.append(key, value)
      })

      const response = await fetch('http://localhost:8000/api/auth/register/traveler/', {
        method: 'POST',
        body: formDataToSend
      })

      // Read the raw response body (text) and try to parse JSON from it.
      let raw = ''
      try {
        raw = await response.text()
      } catch (err) {
        raw = ''
      }

      let data = null
      if (raw) {
        try {
          data = JSON.parse(raw)
        } catch (err) {
          data = null
        }
      }

      if (response.ok) {
        setRegisteredEmail(formData.email)
        setShowOTP(true)
        setStep(2)
      } else {
        // Prefer readable backend message when available
        if (data) {
          try {
            if (typeof data === 'object' && data !== null) {
              const parts = []
              Object.keys(data).forEach((key) => {
                const val = data[key]
                if (Array.isArray(val)) {
                  parts.push(`${key}: ${val.join(', ')}`)
                } else if (typeof val === 'object') {
                  parts.push(`${key}: ${JSON.stringify(val)}`)
                } else {
                  parts.push(`${key}: ${val}`)
                }
              })
              setError(parts.join(' | '))
            } else {
              setError(String(data))
            }
          } catch (err) {
            setError(JSON.stringify(data))
          }
        } else if (raw) {
          // Non-JSON response body (may be HTML stack trace) -- show a short snippet
          const snippet = raw.length > 1000 ? raw.slice(0, 1000) + '... (truncated)' : raw
          setError(`Server error: ${response.status} ${response.statusText} - ${snippet}`)
        } else {
          setError(`${response.status} ${response.statusText}`)
        }
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerification = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/auth/verify-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: registeredEmail,
            otp: otp
        })
      })

      const data = await response.json()

      if (response.ok) {
        // After successful verification redirect to login page
        navigate('/signin')
      } else {
        setError(data.error || 'Invalid OTP')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <h1>Traveler Registration</h1>
          <p>Create your account and start exploring Bangladesh</p>
        </div>

        {!showOTP ? (
          <form onSubmit={handleSubmit} className="registration-form">
            {/* Personal Information */}
            <div className="form-section">
              <h2>Personal Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>National ID (Optional)</label>
                  <input
                    type="text"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleChange}
                    placeholder="Enter your NID number"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="form-section">
              <h2>Location Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Division *</label>
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleDivisionChange}
                    required
                  >
                    <option value="">Select Division</option>
                    {divisions.map(division => (
                      <option key={division} value={division}>{division}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>District *</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    disabled={!formData.division}
                  >
                    <option value="">Select District</option>
                    {formData.division && districts[formData.division]?.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Profile Photo */}
            <div className="form-section">
              <h2>Profile Photo</h2>
              <div className="form-group">
                <label>Upload Profile Photo</label>
                <input
                  type="file"
                  name="profile_photo"
                  onChange={handleChange}
                  accept="image/*"
                />
              </div>
            </div>

            {/* Account Setup */}
            <div className="form-section">
              <h2>Account Setup</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Choose a username"
                  />
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Create a password"
                  />
                  {formData.password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div
                          className={`strength-fill strength-${passwordStrength.score}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className="strength-text">{passwordStrength.text}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="form-section">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="terms_accepted"
                    checked={formData.terms_accepted}
                    onChange={handleChange}
                  />
                  <span>I agree to the Terms and Conditions *</span>
                </label>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>

            <div className="form-footer">
              <p>Already have an account? <a href="/signin">Sign In</a></p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOTPVerification} className="otp-form">
            <div className="otp-section">
              <h2>Email Verification</h2>
              <p>We've sent a 6-digit OTP to your email: <strong>{registeredEmail}</strong></p>
              
              <div className="form-group">
                <label>Enter OTP *</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button
                type="button"
                className="button button-tertiary"
                onClick={() => setShowOTP(false)}
              >
                Back to Registration
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .registration-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }

        .registration-container {
          background: white;
          border-radius: 12px;
          padding: 2.5rem;
          max-width: 800px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .registration-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .registration-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .registration-header p {
          color: #666;
          margin: 0;
        }

        .registration-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-section h2 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: #333;
          border-bottom: 2px solid #667eea;
          padding-bottom: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group select {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
        }

        .password-strength {
          margin-top: 0.5rem;
        }

        .strength-bar {
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
        }

        .strength-fill {
          height: 100%;
          transition: width 0.3s, background-color 0.3s;
        }

        .strength-1 { background: #ff4444; }
        .strength-2 { background: #ffbb33; }
        .strength-3 { background: #00C851; }
        .strength-4 { background: #007E33; }

        .strength-text {
          font-size: 0.8rem;
          color: #666;
          margin-top: 0.25rem;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #fcc;
        }

        .form-footer {
          text-align: center;
          margin-top: 1rem;
        }

        .form-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .form-footer a:hover {
          text-decoration: underline;
        }

        .otp-form {
          max-width: 500px;
          margin: 0 auto;
        }

        .otp-section {
          text-align: center;
        }

        .otp-section h2 {
          margin-bottom: 1rem;
          color: #333;
        }

        .otp-section p {
          color: #666;
          margin-bottom: 2rem;
        }

        .otp-section input {
          text-align: center;
          font-size: 1.5rem;
          letter-spacing: 0.5rem;
          max-width: 200px;
          margin: 0 auto;
        }

        .otp-section .button {
          margin: 0.5rem;
        }
      `}</style>
    </div>
  )
}
