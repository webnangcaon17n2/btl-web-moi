import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../config/api'
import './Auth.css'

const API_BASE_URL = API_URL

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          mat_khau: password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Đăng nhập thất bại')
      }

      login({ ...data.user, token: data.token })
      
      // Điều hướng dựa trên vai trò
      if (data.user.la_admin) {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Left side - Form */}
      <div className="auth-page__form-side">
        {/* Logo */}
        <Link to="/" className="auth-page__logo">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C6.48 2 2 6 2 10c0 3 2 5.5 5 7v5h10v-5c3-1.5 5-4 5-7 0-4-4.48-8-10-8z" />
            <path d="M12 2v10" />
            <path d="M8 6c2 2 6 2 8 0" />
          </svg>
          <span>Aether</span>
        </Link>

        <div className="auth-page__form-wrapper">
          <div className="auth-page__heading">
            <h1 className="auth-page__title">Hi there, good to see you back!</h1>
            <p className="auth-page__subtitle">Log in to your account and start exploring plants.</p>
            {error && <div style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '8px', marginTop: '15px', fontSize: '14px', border: '1px solid #ffcdd2' }}>{error}</div>}
          </div>

          <form className="auth-form" onSubmit={handleSubmit} id="login-form">
            {/* Email */}
            <div className="auth-form__group">
              <div className="auth-form__input-wrapper">
                <FiMail className="auth-form__input-icon" size={18} />
                <input
                  type="email"
                  id="login-email"
                  className="auth-form__input"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-form__group">
              <div className="auth-form__input-wrapper">
                <FiLock className="auth-form__input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className="auth-form__input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-form__toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="auth-form__options">
              <a href="#" className="auth-form__forgot">Forgot your password?</a>
            </div>

            {/* Submit */}
            <button type="submit" className="auth-form__submit" id="login-submit-btn" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Log in'}
            </button>
          </form>

          {/* Switch to Register */}
          <p className="auth-page__switch">
            Don't have an account yet?{' '}
            <Link to="/register" className="auth-page__switch-link">Get Started</Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="auth-page__decor-side">
        <div className="auth-page__decor-content">
          {/* Concentric circles */}
          <div className="auth-page__circles">
            <div className="auth-page__circle auth-page__circle--1"></div>
            <div className="auth-page__circle auth-page__circle--2"></div>
            <div className="auth-page__circle auth-page__circle--3"></div>
          </div>
          {/* Center icon */}
          <div className="auth-page__decor-icon">
            <svg viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M40 70 C40 70 40 40 40 30 C40 15 55 10 55 25 C55 35 40 40 40 40" />
              <path d="M40 40 C40 40 25 35 25 25 C25 10 40 15 40 30" />
              <path d="M40 45 C40 45 55 50 60 40 C65 30 50 28 40 45" />
              <path d="M40 50 C40 50 25 55 20 45 C15 35 30 33 40 50" />
              <path d="M36 70 L44 70" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
