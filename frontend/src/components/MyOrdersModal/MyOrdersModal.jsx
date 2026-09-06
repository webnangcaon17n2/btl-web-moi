import { useState, useEffect } from 'react'
import { FiX, FiPackage, FiClock, FiCheckCircle, FiTruck, FiAlertCircle, FiShoppingBag, FiMapPin, FiArrowRight, FiUser } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../config/api'
import './MyOrdersModal.css'

const API = API_URL

const STATUS_ICONS = {
  'Chờ xác nhận': <FiClock />,
  'Đang xử lý': <FiPackage />,
  'Đang giao': <FiTruck />,
  'Đã giao': <FiCheckCircle />,
  'Đã hủy': <FiAlertCircle />,
}

const STATUS_CLASSES = {
  'Chờ xác nhận': 'waiting',
  'Đang xử lý': 'processing',
  'Đang giao': 'shipping',
  'Đã giao': 'delivered',
  'Đã hủy': 'cancelled',
}

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

function MyOrdersModal({ isOpen, onClose }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()

  useEffect(() => {
    if (isOpen) {
      let token = sessionStorage.getItem('token')

      // Nếu không tìm thấy token riêng, thử tìm trong currentUser
      if (!token) {
        const storedUser = sessionStorage.getItem('currentUser')
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser)
            token = user.token
          } catch (e) {
            console.error('Lỗi parse user:', e)
          }
        }
      }

      if (!token) {
        console.warn('Không tìm thấy Token. Vui lòng đăng nhập lại.')
        setOrders([])
        setLoading(false)
        return
      }

      setLoading(true)
      fetch(`${API}/api/don-hang/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(async (r) => {
          if (r.status === 401) {
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('currentUser')
            throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!')
          }
          return r.json()
        })
        .then(data => {
          if (Array.isArray(data)) {
            setOrders(data)
          } else {
            console.error('Dữ liệu không phải mảng:', data)
            setOrders([])
          }
        })
        .catch(err => {
          console.error('Lỗi tải đơn hàng:', err)
          setOrders([])
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="aether-modal-overlay" onClick={onClose}>
      <div className="aether-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="aether-modal__header">
          <div className="aether-modal__header-left">
            <span className="aether-modal__badge">
              <FiUser size={10} style={{ marginRight: '4px' }} />
              {currentUser?.ho_ten || 'Khách hàng'}
            </span>
            <h2 className="aether-modal__title">Lịch sử đơn hàng</h2>
          </div>
          <button className="aether-modal__close-btn" onClick={onClose}>
            <FiX size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="aether-modal__content">
          {loading ? (
            <div className="aether-modal__loading">
              <div className="aether-spinner"></div>
              <span>Preparing your orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="aether-modal__empty">
              <div className="aether-modal__empty-icon-wrap">
                <FiShoppingBag size={40} />
              </div>
              <h3>No Orders Found</h3>
              <p>Looks like you haven't made any purchases yet. Start your green journey today!</p>
              <button className="aether-modal__shop-btn" onClick={onClose}>
                Go to Shop <FiArrowRight />
              </button>
            </div>
          ) : (
            <div className="aether-modal__list">
              {orders.map(order => (
                <div key={order.id} className="aether-order-card">
                  <div className="aether-order-card__header">
                    <div className="aether-order-card__meta">
                      <span className="aether-order-card__id">Order #DH{String(order.id).padStart(3, '0')}</span>
                      <span className="aether-order-card__date">{new Date(order.ngay_dat).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className={`aether-order-card__status aether-order-card__status--${STATUS_CLASSES[order.trang_thai_don_hang] || 'waiting'}`}>
                      {STATUS_ICONS[order.trang_thai_don_hang]}
                      <span>{order.trang_thai_don_hang}</span>
                    </div>
                  </div>

                  <div className="aether-order-card__body">
                    <div className="aether-order-card__details">
                      <div className="aether-order-card__price">
                        <span className="aether-order-card__label">Total Amount</span>
                        <span className="aether-order-card__amount">{formatPrice(order.tong_tien_hang)}</span>
                      </div>
                      <div className="aether-order-card__address">
                        <FiMapPin size={12} />
                        <span>{order.dia_chi_giao_hang}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyOrdersModal
