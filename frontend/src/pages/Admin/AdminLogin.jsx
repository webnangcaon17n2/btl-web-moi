import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiArrowLeft } from 'react-icons/fi'
import { API_BASE } from '../../config/api'
import './AdminLogin.css'

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: username, // AdminLogin uses 'username' field for email
          mat_khau: password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại')
      }

      if (!data.user.la_admin) {
        throw new Error('Tài khoản của bạn không có quyền truy cập trang quản trị!')
      }

      sessionStorage.setItem('adminAuth', 'true')
      sessionStorage.setItem('adminToken', data.token)
      sessionStorage.setItem('adminUser', JSON.stringify(data.user))
      
      navigate('/admin/products')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="admin-login">
      {/* Left side - Form */}
      <div className="admin-login__form-side">
        <Link to="/" className="admin-login__logo">
          <div className="admin-login__logo-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6 2 10c0 3 2 5.5 5 7v5h10v-5c3-1.5 5-4 5-7 0-4-4.48-8-10-8z" />
              <path d="M12 2v10" />
              <path d="M8 6c2 2 6 2 8 0" />
            </svg>
          </div>
          <div>
            <div className="admin-login__logo-text">Aether</div>
            <span className="admin-login__logo-badge">Admin Panel</span>
          </div>
        </Link>

        <div className="admin-login__form-wrapper">
          <div className="admin-login__heading">
            <h1 className="admin-login__title">Đăng nhập quản trị</h1>
            <p className="admin-login__subtitle">Nhập thông tin tài khoản admin để truy cập bảng điều khiển.</p>
          </div>

          <form className="admin-login__form" onSubmit={handleSubmit} id="admin-login-form">
            {error && (
              <div className="admin-login__error">
                <FiAlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="admin-login__field">
              <label className="admin-login__label" htmlFor="admin-username">Tên đăng nhập</label>
              <div className="admin-login__input-wrap">
                <FiUser className="admin-login__input-icon" size={18} />
                <input
                  type="text"
                  id="admin-username"
                  className="admin-login__input"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="admin-login__field">
              <label className="admin-login__label" htmlFor="admin-password">Mật khẩu</label>
              <div className="admin-login__input-wrap">
                <FiLock className="admin-login__input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="admin-password"
                  className="admin-login__input"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="admin-login__toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="admin-login__submit" id="admin-login-btn">
              Đăng nhập
            </button>
          </form>

          <p className="admin-login__switch">
            <Link to="/"><FiArrowLeft size={16} style={{ verticalAlign: 'middle' }} /> Quay về trang chủ</Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="admin-login__decor-side">
        <div className="admin-login__decor-content">
          <div className="admin-login__circles">
            <div className="admin-login__circle admin-login__circle--1"></div>
            <div className="admin-login__circle admin-login__circle--2"></div>
            <div className="admin-login__circle admin-login__circle--3"></div>
          </div>
          <div className="admin-login__decor-icon">
            <svg viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M40 70 C40 70 40 40 40 30 C40 15 55 10 55 25 C55 35 40 40 40 40" />
              <path d="M40 40 C40 40 25 35 25 25 C25 10 40 15 40 30" />
              <path d="M40 45 C40 45 55 50 60 40 C65 30 50 28 40 45" />
              <path d="M40 50 C40 50 25 55 20 45 C15 35 30 33 40 50" />
              <path d="M36 70 L44 70" />
            </svg>
          </div>
          <div className="admin-login__decor-text">
            <div className="admin-login__decor-title">Aether Admin</div>
            <div className="admin-login__decor-desc">Quản lý cửa hàng cây cảnh</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
