import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  FiPackage, FiLogOut, FiMenu, FiX, FiFileText, FiShoppingBag,
  FiUsers, FiStar, FiRefreshCw, FiChevronDown, FiBell,
  FiDollarSign, FiBox, FiPieChart, FiTruck, FiAlertOctagon, FiSettings,
  FiCreditCard, FiShield, FiMessageSquare
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import './AdminLayout.css'

function AdminLayout() {
  const { currentUser, token, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notiOpen, setNotiOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const profileRef = useRef(null)
  const notiRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const [notifications, setNotifications] = useState([])

  const fetchNotifications = async () => {
    try {
      if (!token) return
      const res = await fetch(`${API_BASE}/notifications/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await res.json()
      if (result.success && Array.isArray(result.data)) {
        setNotifications(result.data)
      }
    } catch (err) {
      console.error('Error fetching admin notifications:', err)
    }
  }

  const unreadCount = notifications.filter(n => n.unread).length

  useEffect(() => {
    if (!token) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds

    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      if (notiRef.current && !notiRef.current.contains(e.target)) setNotiOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      clearInterval(interval)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [token])

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const diffMs = new Date() - date
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitchToUser = () => {
    setProfileOpen(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const getPageTitle = () => {
    if (isActive('/admin/dashboard')) return 'Tổng quan'
    if (isActive('/admin/products')) return 'Quản lý sản phẩm'
    if (isActive('/admin/blogs')) return 'Quản lý bài viết'
    if (isActive('/admin/reviews')) return 'Quản lý đánh giá'
    if (isActive('/admin/orders')) return 'Quản lý đơn hàng'
    if (isActive('/admin/finance')) return 'Quản lý thu chi'
    if (isActive('/admin/inventory')) return 'Quản lý kho'
    if (isActive('/admin/suppliers')) return 'Nhà cung cấp'
    if (isActive('/admin/users')) return 'Quản lý người dùng'
    if (isActive('/admin/feedbacks')) return 'Quản lý phản hồi'
    if (isActive('/admin/config/payment')) return 'Cấu hình — Thanh toán'
    if (isActive('/admin/config/accounts')) return 'Cấu hình — Tài khoản'
    if (isActive('/admin/config')) return 'Cấu hình hệ thống'
    if (isActive('/admin/bug-reports')) return 'Báo cáo lỗi'
    return 'Dashboard'
  }

  const sidebarLinks = [
    {
      section: 'Tổng quan',
      links: [
        { to: '/admin/dashboard', icon: <FiPieChart size={18} />, label: 'Thống kê' },
      ]
    },
    {
      section: 'Quản lý nội dung',
      links: [
        { to: '/admin/blogs', icon: <FiFileText size={18} />, label: 'Bài viết (Blog)' },
        { to: '/admin/reviews', icon: <FiStar size={18} />, label: 'Đánh giá' },
        { to: '/admin/feedbacks', icon: <FiMessageSquare size={18} />, label: 'Phản hồi khách hàng' },
        { to: '/admin/experts', icon: <FiUsers size={18} />, label: 'Chuyên gia' },
      ]
    },
    {
      section: 'Kinh doanh',
      links: [
        { to: '/admin/products', icon: <FiPackage size={18} />, label: 'Sản phẩm' },
        { to: '/admin/orders', icon: <FiShoppingBag size={18} />, label: 'Đơn hàng' },
        { to: '/admin/inventory', icon: <FiBox size={18} />, label: 'Hàng tồn kho' },
        { to: '/admin/suppliers', icon: <FiTruck size={18} />, label: 'Nhà cung cấp' },
        { to: '/admin/finance', icon: <FiDollarSign size={18} />, label: 'Quản lý thu chi' },
      ]
    },
    {
      section: 'Hệ thống',
      links: [
        { to: '/admin/users', icon: <FiUsers size={18} />, label: 'Người dùng' },
        {
          icon: <FiSettings size={18} />,
          label: 'Cấu hình',
          isExpandable: true,
          subLinks: [
            { to: '/admin/config/payment', icon: <FiCreditCard size={16} />, label: 'Thanh toán' },
            { to: '/admin/config/accounts', icon: <FiShield size={16} />, label: 'Tài khoản' },
          ]
        },
        { to: '/admin/bug-reports', icon: <FiAlertOctagon size={18} />, label: 'Báo cáo lỗi' },
      ]
    },
  ]

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <Link to="/" className="admin-sidebar__logo">
          <div className="admin-sidebar__logo-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6 2 10c0 3 2 5.5 5 7v5h10v-5c3-1.5 5-4 5-7 0-4-4.48-8-10-8z" />
              <path d="M12 2v10" />
              <path d="M8 6c2 2 6 2 8 0" />
            </svg>
          </div>
          <div>
            <div className="admin-sidebar__logo-text">Aether</div>
            <span className="admin-sidebar__logo-badge">Admin Panel</span>
          </div>
        </Link>

        <nav className="admin-sidebar__nav">
          {sidebarLinks.map((group) => (
            <div key={group.section}>
              <div className="admin-sidebar__section-title">{group.section}</div>
              {group.links.map((link) => {
                if (link.isExpandable) {
                  const isSubActive = link.subLinks.some(sub => isActive(sub.to))
                  const isExpanded = configOpen || isSubActive
                  return (
                    <div key={link.label} className="admin-sidebar__expandable">
                      <button
                        className={`admin-sidebar__link admin-sidebar__link--expandable ${isSubActive ? 'admin-sidebar__link--active' : ''}`}
                        onClick={() => setConfigOpen(!configOpen)}
                      >
                        <span className="admin-sidebar__link-icon">{link.icon}</span>
                        {link.label}
                        <FiChevronDown
                          size={14}
                          className={`admin-sidebar__expand-arrow ${isExpanded ? 'admin-sidebar__expand-arrow--open' : ''}`}
                        />
                      </button>
                      <div className={`admin-sidebar__sub-links ${isExpanded ? 'admin-sidebar__sub-links--open' : ''}`}>
                        {link.subLinks.map(sub => (
                          <Link
                            key={sub.to}
                            to={sub.to}
                            className={`admin-sidebar__sub-link ${isActive(sub.to) ? 'admin-sidebar__sub-link--active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <span className="admin-sidebar__link-icon">{sub.icon}</span>
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                }
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`admin-sidebar__link ${isActive(link.to) ? 'admin-sidebar__link--active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="admin-sidebar__link-icon">{link.icon}</span>
                    {link.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">{currentUser?.ho_ten?.charAt(0) || 'A'}</div>
            <div className="admin-sidebar__user-info">
              <div className="admin-sidebar__user-name">{currentUser?.ho_ten || 'Admin'}</div>
              <div className="admin-sidebar__user-role">{currentUser?.vai_tro || 'Quản trị viên'}</div>
            </div>
            <button className="admin-sidebar__logout" onClick={handleLogout} title="Đăng xuất">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="admin-sidebar__mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
            <div className="admin-header__breadcrumb">
              <span>Admin</span>
              <span className="admin-header__breadcrumb-sep">/</span>
              <span className="admin-header__breadcrumb-current">{getPageTitle()}</span>
            </div>
          </div>
          <div className="admin-header__actions">
            {/* Notification Bell */}
            <div className="admin-noti" ref={notiRef}>
              <button className="admin-noti__trigger" onClick={() => setNotiOpen(!notiOpen)} id="admin-noti-btn">
                <FiBell size={20} />
                {unreadCount > 0 && <span className="admin-noti__badge">{unreadCount}</span>}
              </button>
              {notiOpen && (
                <div className="admin-noti__dropdown">
                  <div className="admin-noti__dropdown-header">
                    <h3>Thông báo</h3>
                    <span className="admin-noti__dropdown-count">{unreadCount} mới</span>
                  </div>
                  <div className="admin-noti__dropdown-list">
                    {notifications.length === 0 ? (
                      <div className="admin-noti__dropdown-empty" style={{ padding: '24px 16px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                        Không có thông báo mới nào
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`admin-noti__dropdown-item ${n.unread ? 'admin-noti__dropdown-item--unread' : ''}`}
                          onClick={() => {
                            setNotiOpen(false);
                            if (n.link) navigate(n.link);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="admin-noti__dropdown-item-dot"></div>
                          <div>
                            <div className="admin-noti__dropdown-item-text">{n.text}</div>
                            <div className="admin-noti__dropdown-item-time">{formatTime(n.time)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button className="admin-noti__dropdown-viewall" onClick={() => setNotiOpen(false)}>
                    Xem tất cả thông báo
                  </button>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="admin-profile" ref={profileRef}>
              <button className="admin-profile__trigger" onClick={() => setProfileOpen(!profileOpen)} id="admin-profile-btn">
                <div className="admin-profile__avatar">{currentUser?.ho_ten?.charAt(0) || 'A'}</div>
                <div className="admin-profile__info">
                  <span className="admin-profile__name">{currentUser?.ho_ten || 'Admin'}</span>
                  <span className="admin-profile__role">{currentUser?.vai_tro || 'Quản trị viên'}</span>
                </div>
                <FiChevronDown size={14} className={`admin-profile__chevron ${profileOpen ? 'admin-profile__chevron--open' : ''}`} />
              </button>
              {profileOpen && (
                <div className="admin-profile__dropdown">
                  <div className="admin-profile__dropdown-header">
                    <div className="admin-profile__dropdown-avatar">A</div>
                    <div>
                      <div className="admin-profile__dropdown-name">Admin</div>
                      <div className="admin-profile__dropdown-email">admin@aether.com</div>
                    </div>
                  </div>
                  <div className="admin-profile__dropdown-divider"></div>
                  <button className="admin-profile__dropdown-item" onClick={handleSwitchToUser}>
                    <FiRefreshCw size={16} />
                    <div>
                      <span className="admin-profile__dropdown-item-label">Chuyển sang Người dùng</span>
                      <span className="admin-profile__dropdown-item-desc">Xem trang như khách hàng</span>
                    </div>
                  </button>
                  <div className="admin-profile__dropdown-divider"></div>
                  <button className="admin-profile__dropdown-item admin-profile__dropdown-item--danger" onClick={() => { setProfileOpen(false); handleLogout(); }}>
                    <FiLogOut size={16} />
                    <div>
                      <span className="admin-profile__dropdown-item-label">Đăng xuất</span>
                      <span className="admin-profile__dropdown-item-desc">Thoát tài khoản admin</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
