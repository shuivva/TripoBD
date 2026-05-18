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

const serviceTypes = [
  'Tour Guide',
  'Boat Operator',
  'Vehicle Rental',
  'Photography',
  'Other'
]

export default function ServiceProviderRegistration() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')

  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    full_name: '',
    phone_number: '',
    email: '',
    address: '',
    profile_photo: null,
    nid_scan: null,
    // Step 2: Service Info
    service_type: '',
    specialized_destinations: '',
    years_of_experience: '',
    languages_offered: '',
    fee_range: '',
    // Step 3: Documents
    certification: null,
    portfolio_photos: [],
    bank_account_details: '',
    // Account Setup
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

  const handlePortfolioPhotos = (e) => {
    const files = Array.from(e.target.files)
    setFormData(prev => ({
      ...prev,
      portfolio_photos: files
    }))
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

  const nextStep = () => {
    setError('')
    if (step === 1) {
      if (!formData.full_name || !formData.phone_number || !formData.email || !formData.address) {
        setError('Please fill in all required fields')
        return
      }
      if (!formData.nid_scan) {
        setError('NID scan is required')
        return
      }
    }
    if (step === 2) {
      if (!formData.service_type || !formData.specialized_destinations || !formData.years_of_experience || !formData.languages_offered || !formData.fee_range) {
        setError('Please fill in all required fields')
        return
      }
    }
    if (step === 3) {
      if (!formData.bank_account_details) {
        setError('Bank account details are required')
        return
      }
    }
    setStep(step + 1)
  }

  const prevStep = () => {
    setError('')
    setStep(step - 1)
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

    try {
      const formDataToSend = new FormData()
      
      // Personal Info
      formDataToSend.append('username', formData.username)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('password', formData.password)
      formDataToSend.append('confirm_password', formData.confirm_password)
      
      // Profile Info
      formDataToSend.append('full_name', formData.full_name)
      formDataToSend.append('phone_number', formData.phone_number)
      formDataToSend.append('date_of_birth', '1990-01-01') // Default for service providers
      formDataToSend.append('gender', 'other') // Default for service providers
      formDataToSend.append('division', 'dhaka') // Default (lowercase)
      formDataToSend.append('district', formData.district || 'Dhaka') // Default
      formDataToSend.append('profile_photo', formData.profile_photo)
      formDataToSend.append('national_id', formData.nid_scan?.name || '')
      
      // Service Info
      formDataToSend.append('service_type', formData.service_type.toLowerCase().replace(' ', '_'))
      formDataToSend.append('specialized_destinations', formData.specialized_destinations)
      formDataToSend.append('years_of_experience', formData.years_of_experience)
      formDataToSend.append('languages_offered', formData.languages_offered)
      formDataToSend.append('fee_range', formData.fee_range)
      formDataToSend.append('nid_scan', formData.nid_scan)
      formDataToSend.append('certification', formData.certification)
      formDataToSend.append('portfolio_photos', JSON.stringify(formData.portfolio_photos.map(p => p.name)))
      formDataToSend.append('bank_account_details', formData.bank_account_details)

      const response = await fetch('http://localhost:8000/api/auth/register/service-provider/', {
        method: 'POST',
        body: formDataToSend
      })

      const data = await response.json()

      if (response.ok) {
        setRegisteredEmail(formData.email)
        setShowOTP(true)
      } else {
        setError(data.error || JSON.stringify(data))
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

  if (showOTP) {
    return (
      <div className="page-container registration-page">
        <div className="registration-container">
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
        </div>
      </div>
    )
  }

  return (
    <div className="page-container registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <h1>Service Provider Registration</h1>
          <p>Register as a Tour Guide, Boat Operator, or other service provider</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Personal Info</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Service Info</span>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Documents</span>
          </div>
          <div className={`step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-label">Review</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="form-step">
            <h2>Step 1: Personal Information</h2>
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
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter your address"
                />
              </div>

              <div className="form-group">
                <label>Profile Photo</label>
                <input
                  type="file"
                  name="profile_photo"
                  onChange={handleChange}
                  accept="image/*"
                />
              </div>

              <div className="form-group">
                <label>NID Scan *</label>
                <input
                  type="file"
                  name="nid_scan"
                  onChange={handleChange}
                  accept="image/*,.pdf"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="button button-primary" onClick={nextStep}>
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Service Information */}
        {step === 2 && (
          <div className="form-step">
            <h2>Step 2: Service Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Service Type *</label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Service Type</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Specialized Destinations *</label>
                <input
                  type="text"
                  name="specialized_destinations"
                  value={formData.specialized_destinations}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Cox's Bazar, Sylhet, Sajek"
                />
              </div>

              <div className="form-group">
                <label>Years of Experience *</label>
                <input
                  type="number"
                  name="years_of_experience"
                  value={formData.years_of_experience}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="Enter years of experience"
                />
              </div>

              <div className="form-group">
                <label>Languages Offered *</label>
                <input
                  type="text"
                  name="languages_offered"
                  value={formData.languages_offered}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Bengali, English, Hindi"
                />
              </div>

              <div className="form-group">
                <label>Fee Range *</label>
                <input
                  type="text"
                  name="fee_range"
                  value={formData.fee_range}
                  onChange={handleChange}
                  required
                  placeholder="e.g., ৳1000-5000 per day"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="button button-tertiary" onClick={prevStep}>
                Previous
              </button>
              <button type="button" className="button button-primary" onClick={nextStep}>
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="form-step">
            <h2>Step 3: Documents & Payment</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Certification/License (Optional)</label>
                <input
                  type="file"
                  name="certification"
                  onChange={handleChange}
                  accept=".pdf,image/*"
                />
              </div>

              <div className="form-group">
                <label>Portfolio Photos (Up to 10)</label>
                <input
                  type="file"
                  name="portfolio_photos"
                  onChange={handlePortfolioPhotos}
                  accept="image/*"
                  multiple
                />
                <small>{formData.portfolio_photos.length} files selected</small>
              </div>

              <div className="form-group full-width">
                <label>Bank/bKash Account Details *</label>
                <textarea
                  name="bank_account_details"
                  value={formData.bank_account_details}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Enter your bank account or bKash details for payments"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="button button-tertiary" onClick={prevStep}>
                Previous
              </button>
              <button type="button" className="button button-primary" onClick={nextStep}>
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="form-step">
            <h2>Step 4: Review & Submit</h2>
            
            <div className="review-section">
              <h3>Personal Information</h3>
              <div className="review-grid">
                <div><strong>Full Name:</strong> {formData.full_name}</div>
                <div><strong>Phone:</strong> {formData.phone_number}</div>
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Address:</strong> {formData.address}</div>
              </div>
            </div>

            <div className="review-section">
              <h3>Service Information</h3>
              <div className="review-grid">
                <div><strong>Service Type:</strong> {formData.service_type}</div>
                <div><strong>Destinations:</strong> {formData.specialized_destinations}</div>
                <div><strong>Experience:</strong> {formData.years_of_experience} years</div>
                <div><strong>Languages:</strong> {formData.languages_offered}</div>
                <div><strong>Fee Range:</strong> {formData.fee_range}</div>
              </div>
            </div>

            <div className="review-section">
              <h3>Documents</h3>
              <div className="review-grid">
                <div><strong>NID Scan:</strong> {formData.nid_scan?.name || 'Not uploaded'}</div>
                <div><strong>Certification:</strong> {formData.certification?.name || 'Not uploaded'}</div>
                <div><strong>Portfolio Photos:</strong> {formData.portfolio_photos.length} files</div>
              </div>
            </div>

            {/* Account Setup */}
            <div className="form-section">
              <h3>Account Setup</h3>
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

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="terms_accepted"
                  checked={formData.terms_accepted}
                  onChange={handleChange}
                />
                <span>I agree to the Terms and Conditions and understand that my profile will be reviewed by admin before activation *</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="button button-tertiary" onClick={prevStep}>
                Previous
              </button>
              <button type="button" className="button button-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        )}

        <div className="form-footer">
          <p>Already have an account? <a href="/signin">Sign In</a></p>
          <p>Registering as a traveler? <a href="/register/traveler">Traveler Registration</a></p>
        </div>
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
          max-width: 900px;
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

        .progress-steps {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding: 1rem 0;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }

        .step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 20px;
          left: 50%;
          width: 100%;
          height: 2px;
          background: #e0e0e0;
          z-index: 0;
        }

        .step.active:not(:last-child)::after {
          background: #667eea;
        }

        .step.completed:not(:last-child)::after {
          background: #00C851;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #666;
          z-index: 1;
          transition: all 0.3s;
        }

        .step.active .step-number {
          background: #667eea;
          color: white;
        }

        .step.completed .step-number {
          background: #00C851;
          color: white;
        }

        .step-label {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #666;
        }

        .step.active .step-label {
          color: #667eea;
          font-weight: 600;
        }

        .form-step {
          margin-bottom: 2rem;
        }

        .form-step h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: #333;
          border-bottom: 2px solid #667eea;
          padding-bottom: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group small {
          color: #666;
          font-size: 0.8rem;
        }

        .checkbox-group label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          line-height: 1.5;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
          margin-top: 0.25rem;
        }

        .review-section {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .review-section h3 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: #333;
        }

        .review-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .review-grid div {
          font-size: 0.9rem;
        }

        .form-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .form-section h3 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: #333;
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

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #fcc;
          margin-bottom: 1.5rem;
        }

        .form-footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .form-footer p {
          color: #666;
          margin: 0.5rem 0;
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
