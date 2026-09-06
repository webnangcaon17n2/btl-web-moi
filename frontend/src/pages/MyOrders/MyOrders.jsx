import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPackage, FiClock, FiChevronRight, FiMapPin, FiX } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { API_BASE } from '../../config/api'
import './MyOrders.css'

const API = API_BASE

function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()
  const { clearCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    // [RESTORED] Kiểm tra thông báo từ PayOS
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('status') === 'PAID') {
      window.history.replaceState({}, document.title, window.location.pathname);
      clearCart(); // XÓA GIỎ HÀNG NGAY KHI QUAY VỀ THÀNH CÔNG
      alert('Thanh toán thành công! Cảm ơn bạn đã mua hàng.');
    }

    const fetchOrders = async () => {
      setLoading(true)
      try {
        const token = sessionStorage.getItem('token')
        const res = await fetch(`${API}/don-hang/my-orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setOrders(data)
      } catch (err) {
        console.error('Error fetching orders:', err)
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchOrders()
      // Tự động tải lại khi quay lại tab này
      window.addEventListener('focus', fetchOrders);
      return () => window.removeEventListener('focus', fetchOrders);
    } else {
      navigate('/login')
    }
  }, [currentUser, navigate])

  const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  if (loading) return <div className="loading-screen">Đang tải đơn hàng...</div>

  return (
    <div className="my-orders-page">
      <div className="orders-container">
        <header className="orders-header">
          <div className="title-area">
            <FiPackage className="main-icon" />
            <div>
              <h1>Lịch sử đơn hàng</h1>
              <p>Theo dõi và quản lý các đơn hàng của bạn</p>
            </div>
          </div>
          <button className="back-home-btn" onClick={() => navigate('/shop')}>
            Tiếp tục mua sắm
          </button>
        </header>

        {orders.length === 0 ? (
          <div className="empty-orders">
            <FiPackage size={80} />
            <h2>Bạn chưa có đơn hàng nào</h2>
            <p>Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!</p>
            <button onClick={() => navigate('/shop')}>Đến cửa hàng ngay</button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card-v3">
                <div className="order-id-section">
                  <span className="order-tag">Order #{order.id.toString().padStart(3, '0')}</span>
                  <span className={`status-pill ${order.trang_thai_don_hang.replace(/\s+/g, '-').toLowerCase()}`}>
                    {order.trang_thai_don_hang}
                  </span>
                </div>
                
                <div className="order-details-grid">
                  <div className="detail-item">
                    <FiClock />
                    <span>Ngày đặt: {new Date(order.ngay_dat).toLocaleString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}</span>
                  </div>
                  <div className="detail-item">
                    <FiMapPin />
                    <span className="addr-text">{order.dia_chi_giao_hang}</span>
                  </div>
                </div>

                <div className="order-footer-v3">
                  <div className="total-info">
                    <p>Tổng thanh toán</p>
                    <span className="price">{formatVND(order.tong_tien_hang)}</span>
                  </div>
                  <button className="view-detail-btn">
                    Xem chi tiết <FiChevronRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOrders
