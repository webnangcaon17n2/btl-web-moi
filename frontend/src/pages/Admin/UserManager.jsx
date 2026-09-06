import { useState, useEffect, useCallback } from 'react'
import {
  FiSearch, FiCheck, FiX, FiEye, FiTrash2, FiEdit2, FiUser,
  FiChevronLeft, FiChevronRight, FiUsers, FiAlertCircle
} from 'react-icons/fi'
import { API_URL } from '../../config/api'
import '../Admin/ProductManager.css'

const API = API_URL
const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

function UserManager() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [modal, setModal] = useState({ open: false, user: null })
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000) }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/nguoi-dung`)
      .then(r => r.json())
      .then(data => setUsers(data.map(u => ({
        UserID: u.id,
        FullName: u.ho_ten || '(Chưa có tên)',
        Email: u.email || '',
        Phone: u.so_dien_thoai || '',
        Role: u.vai_tro || 'Khách hàng',
        Status: u.dang_hoat_dong ? 'Active' : 'Inactive',
        OrderCount: u.so_don_hang || 0,
        TotalSpent: u.tong_chi_tieu || 0,
        CreateDate: u.ngay_tao ? u.ngay_tao.split('T')[0] : '',
      }))))
      .catch(() => showToast('Không thể tải người dùng!', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])


  const filtered = users.filter(u => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return u.FullName.toLowerCase().includes(q) || u.Email.toLowerCase().includes(q) || u.Phone.includes(q)
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const startIdx = (currentPage - 1) * perPage
  const paginated = filtered.slice(startIdx, startIdx + perPage)

  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u => u.UserID === id ? { ...u, Status: u.Status === 'Active' ? 'Inactive' : 'Active' } : u))
    showToast('Đã cập nhật trạng thái!')
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
          <h1>Quản lý người dùng</h1>
          <p>Danh sách khách hàng đã đăng ký</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card"><div className="pm-stat-card__value">{users.length}</div><div className="pm-stat-card__label">Tổng người dùng</div></div>
          <div className="pm-stat-card"><div className="pm-stat-card__value">{users.filter(u => u.Status === 'Active').length}</div><div className="pm-stat-card__label">Đang hoạt động</div></div>
        </div>
      </div>

      <div className="pm-toolbar">
        <div className="pm-toolbar__left">
          <div className="pm-search">
            <FiSearch className="pm-search__icon" size={16} />
            <input type="text" className="pm-search__input" placeholder="Tìm theo tên, email, SĐT..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="pm-table-wrap">
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead><tr><th>Mã</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Đơn hàng</th><th>Tổng chi</th><th>Trạng thái</th><th style={{ width: '80px' }}>Thao tác</th></tr></thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9}><div className="pm-empty"><FiUsers className="pm-empty__icon" size={48} /><div className="pm-empty__title">Không có người dùng</div></div></td></tr>
              ) : paginated.map(user => (
                <tr key={user.UserID}>
                  <td>{user.UserID}</td>
                  <td><span className="pm-table__product-name">{user.FullName}</span></td>
                  <td>{user.Email}</td>
                  <td>{user.Phone}</td>
                  <td>
                    <span className="pm-table__type-badge" style={user.Role === 'Admin' ? { background: '#e3f2fd', color: '#1565c0' } : user.Role === 'VIP' ? { background: '#fff3e0', color: '#e65100' } : {}}>
                      {user.Role}
                    </span>
                  </td>
                  <td>{user.OrderCount}</td>
                  <td>{formatPrice(user.TotalSpent)}</td>
                  <td>
                    <span className="pm-table__type-badge" style={user.Status === 'Active' ? { background: '#e8f5e9', color: '#4caf50' } : { background: '#fef2f2', color: '#dc2626' }} onClick={() => toggleStatus(user.UserID)} role="button" tabIndex={0} title="Click để đổi trạng thái" onKeyDown={() => {}} aria-label="Toggle status">
                      {user.Status === 'Active' ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </td>
                  <td>
                    <button className="pm-table__action-btn" title="Xem" onClick={() => setModal({ open: true, user })}><FiEye size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="pm-pagination">
            <div className="pm-pagination__info">Hiển thị <strong>{startIdx + 1}-{Math.min(startIdx + perPage, filtered.length)}</strong> / <strong>{filtered.length}</strong></div>
            <div className="pm-pagination__controls">
              <button className="pm-pagination__btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FiChevronLeft size={16} /></button>
              {getPageNumbers().map(p => <button key={p} className={`pm-pagination__btn ${currentPage === p ? 'pm-pagination__btn--active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>)}
              <button className="pm-pagination__btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FiChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {modal.open && modal.user && (
        <div className="pm-modal-overlay" onClick={() => setModal({ open: false, user: null })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title"><FiUser size={18} /> Thông tin người dùng</h2>
              <button className="pm-modal__close" onClick={() => setModal({ open: false, user: null })}><FiX size={18} /></button>
            </div>
            <div className="pm-modal__body">
              <div className="pm-detail">
                <div className="pm-detail__item"><span className="pm-detail__label">Mã</span><span className="pm-detail__value">{modal.user.UserID}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Vai trò</span><span className="pm-detail__value">{modal.user.Role}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Họ tên</span><span className="pm-detail__value">{modal.user.FullName}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Email</span><span className="pm-detail__value">{modal.user.Email}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Số điện thoại</span><span className="pm-detail__value">{modal.user.Phone}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Trạng thái</span><span className="pm-detail__value">{modal.user.Status === 'Active' ? 'Đang hoạt động' : 'Vô hiệu'}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Số đơn hàng</span><span className="pm-detail__value">{modal.user.OrderCount}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Tổng chi tiêu</span><span className="pm-detail__value">{formatPrice(modal.user.TotalSpent)}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Ngày đăng ký</span><span className="pm-detail__value">{modal.user.CreateDate}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`pm-toast pm-toast--${toast.type}`}>{toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}{toast.message}</div>}
    </div>
  )
}

export default UserManager
