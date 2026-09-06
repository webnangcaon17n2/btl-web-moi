import { useState, useEffect, useCallback } from 'react'
import {
  FiSearch, FiCheck, FiX, FiEye, FiPackage,
  FiChevronLeft, FiChevronRight, FiShoppingBag, FiAlertCircle
} from 'react-icons/fi'
import { API_URL } from '../../config/api'
import '../Admin/ProductManager.css'

const STATUSES = ['Chờ thanh toán', 'Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy', 'Thanh toán thất bại']
const STATUS_COLORS = {
  'Chờ xác nhận': { bg: '#fff3e0', color: '#e65100' },
  'Đang xử lý': { bg: '#e3f2fd', color: '#1565c0' },
  'Đang giao': { bg: '#f3e5f5', color: '#7b1fa2' },
  'Đã giao': { bg: '#e8f5e9', color: '#4caf50' },
  'Đã hủy': { bg: '#fef2f2', color: '#dc2626' },
  'Chờ thanh toán': { bg: '#fef9c3', color: '#ca8a04' },
  'Thanh toán thất bại': { bg: '#fee2e2', color: '#991b1b' },
}

const API = API_URL
const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

function OrderManager() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [modal, setModal] = useState({ open: false, order: null })
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/don-hang`)
      .then(r => r.json())
      .then(data => setOrders(data.map(d => ({
        OrderID: `DH${String(d.id).padStart(3, '0')}`,
        CustomerName: d.ten_khach,
        Phone: d.so_dien_thoai || '—',
        Email: d.email || '',
        Address: d.dia_chi_giao_hang,
        Items: d.ten_san_pham_list || '—',
        Total: d.tong_tien_hang,
        Status: d.trang_thai_don_hang,
        CreateDate: d.ngay_dat ? d.ngay_dat.split('T')[0] : '',
        UpdateDate: d.ngay_cap_nhat ? d.ngay_cap_nhat.split('T')[0] : '',
        _dbId: d.id,
      }))))
      .catch(() => showToast('Không thể tải đơn hàng!', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])


  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return o.OrderID.toLowerCase().includes(q) || o.CustomerName.toLowerCase().includes(q) || o.Phone.includes(q)
  })

  const totalPages = Math.ceil(filteredOrders.length / perPage)
  const startIdx = (currentPage - 1) * perPage
  const paginatedOrders = filteredOrders.slice(startIdx, startIdx + perPage)

  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  const handleStatusChange = async (orderId, newStatus, dbId) => {
    if (!dbId) {
      showToast('Lỗi: Không tìm thấy ID đơn hàng trong Database!', 'error')
      return
    }

    try {
      const response = await fetch(`${API}/api/don-hang/${dbId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setOrders(prev => prev.map(o => o._dbId === dbId ? { ...o, Status: newStatus, UpdateDate: new Date().toISOString().split('T')[0] } : o))
        showToast(`Đã cập nhật đơn hàng thành ${newStatus}!`)
      } else {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          showToast(errorData.error || 'Lỗi từ Server!', 'error')
        } else {
          const errorText = await response.text()
          showToast(`Lỗi Server (${response.status}): ${errorText.substring(0, 50)}...`, 'error')
        }
      }
    } catch (err) {
      console.error(err)
      showToast('Lỗi kết nối: ' + err.message, 'error')
    }
  }

  const getPageNumbers = () => {
    const pages = []; const max = 5
    let start = Math.max(1, currentPage - Math.floor(max / 2))
    let end = Math.min(totalPages, start + max - 1)
    if (end - start + 1 < max) start = Math.max(1, end - max + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="pm">
      <div className="pm-page-header">
        <div className="pm-page-header__left">
          <h1>Quản lý đơn hàng</h1>
          <p>Theo dõi và xử lý đơn hàng của khách hàng</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card"><div className="pm-stat-card__value">{orders.length}</div><div className="pm-stat-card__label">Tổng đơn</div></div>
          <div className="pm-stat-card"><div className="pm-stat-card__value">{orders.filter(o => o.Status === 'Chờ xác nhận').length}</div><div className="pm-stat-card__label">Chờ xử lý</div></div>
        </div>
      </div>

      <div className="pm-toolbar">
        <div className="pm-toolbar__left">
          <div className="pm-search">
            <FiSearch className="pm-search__icon" size={16} />
            <input type="text" className="pm-search__input" placeholder="Tìm theo mã đơn, tên, SĐT..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="pm-table-wrap">
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>SĐT</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th style={{ width: '80px' }}>Chi tiết</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</td></tr>
              ) : paginatedOrders.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="pm-empty"><FiShoppingBag className="pm-empty__icon" size={48} /><div className="pm-empty__title">Không có đơn hàng</div></div>
                </td></tr>
              ) : paginatedOrders.map(order => (
                <tr key={order.OrderID}>
                  <td><span className="pm-table__product-name">{order.OrderID}</span></td>
                  <td>{order.CustomerName}</td>
                  <td>{order.Phone}</td>
                  <td><strong>{formatPrice(order.Total)}</strong></td>
                  <td>
                    {order.Status === 'Thanh toán thất bại' ? (
                      <span style={{
                        display: 'inline-block',
                        background: STATUS_COLORS[order.Status]?.bg || '#f3f4f6',
                        color: STATUS_COLORS[order.Status]?.color || '#374151',
                        border: `1.5px solid ${STATUS_COLORS[order.Status]?.color || '#9ca3af'}40`,
                        padding: '5px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {order.Status}
                      </span>
                    ) : (
                      <select
                        value={order.Status}
                        onChange={(e) => handleStatusChange(order.OrderID, e.target.value, order._dbId)}
                        style={{
                          background: STATUS_COLORS[order.Status]?.bg || '#f3f4f6',
                          color: STATUS_COLORS[order.Status]?.color || '#374151',
                          border: `1.5px solid ${STATUS_COLORS[order.Status]?.color || '#9ca3af'}40`,
                          padding: '5px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none',
                          appearance: 'auto',
                        }}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>{order.CreateDate}</td>
                  <td>
                    <button className="pm-table__action-btn" title="Xem chi tiết" onClick={() => setModal({ open: true, order })}><FiEye size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 0 && (
          <div className="pm-pagination">
            <div className="pm-pagination__info">Hiển thị <strong>{startIdx + 1}-{Math.min(startIdx + perPage, filteredOrders.length)}</strong> / <strong>{filteredOrders.length}</strong></div>
            <div className="pm-pagination__controls">
              <button className="pm-pagination__btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FiChevronLeft size={16} /></button>
              {getPageNumbers().map(p => <button key={p} className={`pm-pagination__btn ${currentPage === p ? 'pm-pagination__btn--active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>)}
              <button className="pm-pagination__btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FiChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {modal.open && modal.order && (
        <div className="pm-modal-overlay" onClick={() => setModal({ open: false, order: null })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title"><FiPackage size={18} /> Chi tiết đơn hàng {modal.order.OrderID}</h2>
              <button className="pm-modal__close" onClick={() => setModal({ open: false, order: null })}><FiX size={18} /></button>
            </div>
            <div className="pm-modal__body">
              <div className="pm-detail">
                <div className="pm-detail__item"><span className="pm-detail__label">Mã đơn</span><span className="pm-detail__value">{modal.order.OrderID}</span></div>
                <div className="pm-detail__item">
                  <span className="pm-detail__label">Trạng thái</span>
                  <span className="pm-detail__value">
                    {modal.order.Status === 'Thanh toán thất bại' ? (
                      <span style={{
                        display: 'inline-block',
                        background: STATUS_COLORS[modal.order.Status]?.bg || '#f3f4f6',
                        color: STATUS_COLORS[modal.order.Status]?.color || '#374151',
                        border: `1.5px solid ${STATUS_COLORS[modal.order.Status]?.color || '#9ca3af'}40`,
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}>
                        {modal.order.Status}
                      </span>
                    ) : (
                      <select
                        value={modal.order.Status}
                        onChange={(e) => {
                          handleStatusChange(modal.order.OrderID, e.target.value, modal.order._dbId)
                          setModal(prev => ({ ...prev, order: { ...prev.order, Status: e.target.value, UpdateDate: new Date().toISOString().split('T')[0] } }))
                        }}
                        style={{
                          background: STATUS_COLORS[modal.order.Status]?.bg || '#f3f4f6',
                          color: STATUS_COLORS[modal.order.Status]?.color || '#374151',
                          border: `1.5px solid ${STATUS_COLORS[modal.order.Status]?.color || '#9ca3af'}40`,
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </span>
                </div>
                <div className="pm-detail__item"><span className="pm-detail__label">Khách hàng</span><span className="pm-detail__value">{modal.order.CustomerName}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Số điện thoại</span><span className="pm-detail__value">{modal.order.Phone}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Email</span><span className="pm-detail__value">{modal.order.Email}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Tổng tiền</span><span className="pm-detail__value" style={{ fontWeight: 700, color: '#4caf50' }}>{formatPrice(modal.order.Total)}</span></div>
                <div className="pm-detail__item pm-detail--full"><span className="pm-detail__label">Địa chỉ giao hàng</span><span className="pm-detail__value">{modal.order.Address}</span></div>
                <div className="pm-detail__item pm-detail--full">
                  <span className="pm-detail__label">Sản phẩm trong đơn</span>
                  <span className="pm-detail__value">
                    {modal.order.Items && modal.order.Items !== '—'
                      ? modal.order.Items.split(', ').map((name, i) => (
                          <span key={i} style={{
                            display: 'inline-block',
                            background: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            padding: '2px 10px',
                            fontSize: '13px',
                            margin: '2px 4px 2px 0',
                            fontWeight: 500
                          }}>{name}</span>
                        ))
                      : <span style={{ color: '#9ca3af' }}>Không có sản phẩm</span>
                    }
                  </span>
                </div>
                <div className="pm-detail__item"><span className="pm-detail__label">Ngày đặt</span><span className="pm-detail__value">{modal.order.CreateDate}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Cập nhật</span><span className="pm-detail__value">{modal.order.UpdateDate}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`pm-toast pm-toast--${toast.type}`}>{toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}{toast.message}</div>}
    </div>
  )
}

export default OrderManager
