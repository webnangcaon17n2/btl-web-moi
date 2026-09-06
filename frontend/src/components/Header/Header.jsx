import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiSearch, FiShoppingCart, FiChevronDown, FiMenu, FiX, FiRefreshCw, FiLogOut, FiUser, FiShoppingBag, FiHeart, FiBell } from 'react-icons/fi'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import './Header.css'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Product', to: '/products' },
  { label: 'Blog', to: '/#blog' },
  {
    label: 'Pages',
    to: '#',
    dropdown: true,
    children: [
      { label: 'About us', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

function NavLink({ item, className, onClick }) {
  if (item.to && !item.to.startsWith('#')) {
    return (
      <Link to={item.to} className={className} onClick={onClick}>
        {item.label}
        {item.dropdown && <FiChevronDown className="header__dropdown-icon" size={14} />}
      </Link>
    )
  }
  return (
    <a href={item.href || item.to || '#'} className={className} onClick={onClick}>
      {item.label}
      {item.dropdown && <FiChevronDown className="header__dropdown-icon" size={14} />}
    </a>
  )
}

function Header({ onOpenOrders, onOpenProfile }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const userMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { cartCount, setIsCartOpen } = useCart()
  const { currentUser, logout, token } = useAuth()

  // Notification states
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)
  
  // Feedback Modal states
  const [feedbackModal, setFeedbackModal] = useState({ open: false, data: null })
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  // Real-time ticker cho thông báo
  const [ticker, setTicker] = useState(0)

  useEffect(() => {
    let timer;
    if (showNotifications) {
      // Cập nhật giao diện mỗi 5 giây để thay đổi số giây "trước"
      timer = setInterval(() => setTicker(t => t + 1), 5000)
    }
    return () => clearInterval(timer)
  }, [showNotifications])

  // Xử lý tìm kiếm Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true)
        fetch(`${API_BASE}/san-pham/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(Array.isArray(data) ? data : [])
            setIsSearching(false)
          })
          .catch(err => {
            console.error('Search error:', err)
            setIsSearching(false)
          })
      } else {
        setSearchResults([])
      }
    }, 500) // Đợi 500ms sau khi ngừng gõ mới gọi API

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  // Fetch Notifications
  useEffect(() => {
    if (currentUser) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000) // Cập nhật mỗi 30 giây
      return () => clearInterval(interval)
    }
  }, [currentUser])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data)
        setUnreadCount(data.data.filter(n => !n.da_doc).length)
      }
    } catch (err) {
      console.error('Fetch notifications error:', err)
    }
  }

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (err) {
      console.error('Mark as read error:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (err) {
      console.error('Mark all as read error:', err)
    }
  }

  const handleNotificationClick = async (n) => {
    // Luôn đánh dấu là đã đọc
    if (!n.da_doc) {
      markAsRead(n.id);
    }
    
    // Đóng dropdown thông báo
    setShowNotifications(false);

    // Nếu là thông báo phản hồi từ admin
    if (n.loai && n.loai.startsWith('PhanHoi:')) {
      const feedbackId = n.loai.split(':')[1];
      setLoadingFeedback(true);
      try {
        const res = await fetch(`${API_BASE}/contact/feedback/${feedbackId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setFeedbackModal({ open: true, data: data.data });
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching feedback details:', error);
      } finally {
        setLoadingFeedback(false);
      }
    } else if (n.loai === 'DonHang') {
      navigate('/my-orders');
    }
  }

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem('adminAuth') === 'true')
  }, [location])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label)
  }

  const isActive = (link) => {
    if (link.to && !link.to.startsWith('#')) {
      return location.pathname === link.to
    }
    return false
  }

  const handleSwitchToAdmin = () => {
    setUserMenuOpen(false)
    navigate('/admin/products')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    setUserMenuOpen(false)
    setIsAdmin(false)
    logout()
    navigate('/login')
  }

  const handleBlogClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault()
      const element = document.getElementById('blog')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <>
    <header className="header" id="header">
      <div className="header__inner container">
        {/* Nav Left */}
        <nav className="header__nav">
          <button
            className="header__mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          <ul className={`header__nav-list ${mobileOpen ? 'header__nav-list--open' : ''}`}>
            {navLinks.map((link) => (
              <li
                key={link.label}
                className={`header__nav-item ${link.dropdown ? 'header__nav-item--dropdown' : ''}`}
                onMouseEnter={() => link.dropdown && setOpenDropdown(link.label)}
                onMouseLeave={() => link.dropdown && setOpenDropdown(null)}
              >
                {link.dropdown ? (
                  <a
                    href="#"
                    className={`header__nav-link`}
                    onClick={(e) => {
                      e.preventDefault()
                      toggleDropdown(link.label)
                    }}
                  >
                    {link.label}
                    <FiChevronDown className="header__dropdown-icon" size={14} />
                  </a>
                ) : (
                  <NavLink
                    item={link}
                    className={`header__nav-link ${isActive(link) ? 'header__nav-link--active' : ''}`}
                    onClick={link.label === 'Blog' ? handleBlogClick : undefined}
                  />
                )}
                {link.dropdown && openDropdown === link.label && (
                  <ul className="header__dropdown">
                    {link.children.map((child) => (
                      <li key={child.label}>
                        {child.to && !child.to.startsWith('#') ? (
                          <Link to={child.to} className="header__dropdown-link">
                            {child.label}
                          </Link>
                        ) : (
                          <a href={child.href || child.to || '#'} className="header__dropdown-link">
                            {child.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Logo Center */}
        <Link to="/" className="header__logo">
          <svg className="header__logo-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C6.48 2 2 6 2 10c0 3 2 5.5 5 7v5h10v-5c3-1.5 5-4 5-7 0-4-4.48-8-10-8z" />
            <path d="M12 2v10" />
            <path d="M8 6c2 2 6 2 8 0" />
          </svg>
          <span>Aether</span>
        </Link>

        {/* Actions Right */}
        <div className="header__actions">
          <div className="header__search-wrapper">
            <div className="header__search-bar-permanent">
              <FiSearch className="header__search-icon-inside" />
              <input
                type="text"
                placeholder="Tìm cây cảnh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearching(true)}
                onBlur={() => setTimeout(() => setIsSearching(false), 200)}
              />
              {searchQuery && (
                <button className="header__search-clear" onClick={() => setSearchQuery('')}>
                  <FiX size={14} />
                </button>
              )}
            </div>

            {searchQuery && searchResults.length > 0 && (
              <div className="header__search-results-dropdown">
                {searchResults.map(item => (
                  <Link
                    key={item.id}
                    to={`/products`}
                    className="header__search-result-item"
                    onClick={() => setSearchQuery('')}
                  >
                    <img src={item.anh_chinh || 'https://placehold.co/40x40'} alt={item.ten_san_pham} />
                    <div className="header__search-result-info">
                      <div className="header__search-result-name">{item.ten_san_pham}</div>
                      <div className="header__search-result-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.gia_ban)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <button
            className="header__action-btn header__cart-btn"
            aria-label="Cart"
            id="cart-btn"
            onClick={() => setIsCartOpen(true)}
          >
            <FiShoppingCart size={20} />
            <span className="header__cart-count">{cartCount}</span>
          </button>

          {/* Notification Bell */}
          {currentUser && (
            <div className="header__notification-wrapper" ref={notificationRef}>
              <button 
                className="header__action-btn header__bell-btn"
                onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) fetchNotifications(); }}
              >
                <FiBell size={20} />
                {unreadCount > 0 && <span className="header__bell-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="header__notif-dropdown">
                  <div className="header__notif-header">
                    <div>
                      <h3>Thông báo</h3>
                      {unreadCount > 0 && <span className="header__notif-subtitle">{unreadCount} chưa đọc</span>}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="header__notif-read-all">Đọc hết</button>
                    )}
                  </div>
                  <div className="header__notif-list">
                    {notifications.length > 0 ? (
                      notifications.map(n => {
                        const isOrder = n.loai === 'DonHang'
                        const icon = isOrder ? '🛍️' : '🔔'
                        const now = new Date(Date.now() + (ticker * 0))
                        const created = new Date(n.ngay_tao)
                        const diffMs = Math.max(0, now - created)
                        const diffSecs = Math.floor(diffMs / 1000)
                        const diffMins = Math.floor(diffSecs / 60)
                        const diffHours = Math.floor(diffMins / 60)
                        const diffDays = Math.floor(diffHours / 24)
                        let timeAgo
                        if (diffSecs < 10) timeAgo = 'Vừa xong'
                        else if (diffSecs < 60) timeAgo = `${diffSecs} giây trước`
                        else if (diffMins < 60) timeAgo = `${diffMins} phút trước`
                        else if (diffHours < 24) timeAgo = `${diffHours} giờ trước`
                        else timeAgo = `${diffDays} ngày trước`

                        return (
                          <div 
                            key={n.id} 
                            className={`header__notif-item ${!n.da_doc ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <div className="notif-icon-wrap">{icon}</div>
                            <div className="notif-body">
                              <div className="notif-title">{n.tieu_de}</div>
                              <div className="notif-content">{n.noi_dung}</div>
                              <div className="notif-time">{timeAgo}</div>
                            </div>
                            {!n.da_doc && <div className="notif-dot"></div>}
                          </div>
                        )
                      })
                    ) : (
                      <div className="header__notif-empty">
                     
                        <div>Chưa có thông báo nào</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentUser || isAdmin ? (
            <div className="header__user-menu" ref={userMenuRef}>
              <button
                className="header__user-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                id="user-profile-btn"
              >
                <div className="header__user-avatar">
                  <img src={currentUser?.anh_dai_dien || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces"} alt="User" />
                </div>
                <span className="header__user-name">{currentUser?.ho_ten || 'Admin'}</span>
                <FiChevronDown size={14} className={`header__user-chevron ${userMenuOpen ? 'header__user-chevron--open' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="header__user-dropdown">
                  <div className="header__user-dropdown-header">
                    <div className="header__user-dropdown-avatar">
                      <img src={currentUser?.anh_dai_dien || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces"} alt="User" />
                    </div>
                    <div>
                      <div className="header__user-dropdown-name">{currentUser?.ho_ten || 'Admin'}</div>
                      <div className="header__user-dropdown-email">{currentUser?.email || 'admin@aether.com'}</div>
                    </div>
                  </div>
                  <div className="header__user-dropdown-divider"></div>
                  <button className="header__user-dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}>
                    <FiUser size={16} />
                    <span>Tài khoản của tôi</span>
                  </button>
                  <button className="header__user-dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/my-orders'); }}>
                    <FiShoppingBag size={16} />
                    <span>Đơn hàng của tôi</span>
                  </button>
                  {(isAdmin || currentUser?.vai_tro === 'Admin Tổng' || currentUser?.vai_tro === 'Admin') && (
                    <>
                      <div className="header__user-dropdown-divider"></div>
                      <button className="header__user-dropdown-item header__user-dropdown-item--highlight" onClick={handleSwitchToAdmin}>
                        <FiRefreshCw size={16} />
                        <span>Trang quản trị (Admin)</span>
                      </button>
                    </>
                  )}
                  <div className="header__user-dropdown-divider"></div>
                  <button className="header__user-dropdown-item header__user-dropdown-item--danger" onClick={handleLogout}>
                    <FiLogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="header__btn header__btn--outline" id="login-btn">Login</Link>
              <Link to="/register" className="header__btn header__btn--solid" id="register-btn">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>

      {/* Feedback Modal */}
      {feedbackModal.open && feedbackModal.data && (
        <div className="header-feedback-modal-overlay" onClick={() => setFeedbackModal({ open: false, data: null })}>
          <div className="header-feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="header-feedback-modal__header">
              <h3>Chi tiết phản hồi</h3>
              <button onClick={() => setFeedbackModal({ open: false, data: null })}><FiX size={20} /></button>
            </div>
            <div className="header-feedback-modal__body">
              <div className="feedback-section">
                <div className="feedback-label">Tin nhắn của bạn:</div>
                <div className="feedback-content user-message">
                  {feedbackModal.data.tin_nhan}
                </div>
                <div className="feedback-time">
                  Gửi lúc: {new Date(feedbackModal.data.ngay_gui).toLocaleString('vi-VN')}
                </div>
              </div>
              
              <div className="feedback-section admin-response-section">
                <div className="feedback-label">Phản hồi từ Admin:</div>
                <div className="feedback-content admin-message">
                  {feedbackModal.data.phan_hoi_admin || 'Chưa có phản hồi'}
                </div>
                {feedbackModal.data.ngay_phan_hoi && (
                  <div className="feedback-time">
                    Phản hồi lúc: {new Date(feedbackModal.data.ngay_phan_hoi).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
