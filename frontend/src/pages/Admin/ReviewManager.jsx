import { useState, useEffect, useCallback } from 'react'
import {
  FiSearch, FiCheck, FiX, FiEye, FiStar, FiTrash2,
  FiChevronLeft, FiChevronRight, FiAlertCircle
} from 'react-icons/fi'
import { API_URL } from '../../config/api'
import '../Admin/ProductManager.css'

const API = API_URL

function ReviewManager() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [modal, setModal] = useState({ open: false, review: null })
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000) }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/danh-gia`)
      .then(r => r.json())
      .then(data => setReviews(data.map(r => ({
        ReviewID: `RV${String(r.id).padStart(3, '0')}`,
        _dbId: r.id,
        CustomerName: r.ten_khach || 'Khách hàng',
        Role: r.vai_tro || 'Khách hàng',
        Rating: r.so_sao,
        Comment: r.noi_dung || '',
        ProductName: r.ten_san_pham || '',
        Likes: 0,
        CreateDate: r.ngay_viet ? r.ngay_viet.split('T')[0] : '',
      }))))
      .catch(() => showToast('Không thể tải đánh giá!', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])

  const handleDelete = async (id, dbId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return
    try {
      await fetch(`${API}/api/danh-gia/${dbId}`, { method: 'DELETE' })
      setReviews(prev => prev.filter(r => r.ReviewID !== id))
      showToast('Đã xóa đánh giá!')
    } catch {
      showToast('Lỗi xóa đánh giá!', 'error')
    }
  }

  const filtered = reviews.filter(r => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return r.CustomerName.toLowerCase().includes(q) || r.ProductName.toLowerCase().includes(q) || r.Comment.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const startIdx = (currentPage - 1) * perPage
  const paginated = filtered.slice(startIdx, startIdx + perPage)

  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  const getPageNumbers = () => {
    const pages = []; const max = 5
    let start = Math.max(1, currentPage - Math.floor(max / 2))
    let end = Math.min(totalPages, start + max - 1)
    if (end - start + 1 < max) start = Math.max(1, end - max + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  const renderStars = (rating) => (
    <span style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <FiStar key={i} size={14} style={{ color: i <= rating ? '#f5c518' : '#ddd', fill: i <= rating ? '#f5c518' : 'none' }} />
      ))}
    </span>
  )

  return (
    <div className="pm">
      <div className="pm-page-header">
        <div className="pm-page-header__left">
          <h1>Quản lý đánh giá</h1>
          <p>Duyệt và quản lý đánh giá sản phẩm từ khách hàng</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card"><div className="pm-stat-card__value">{reviews.length}</div><div className="pm-stat-card__label">Tổng đánh giá</div></div>
          <div className="pm-stat-card"><div className="pm-stat-card__value">{reviews.length > 0 ? (reviews.reduce((s, r) => s + r.Rating, 0) / reviews.length).toFixed(1) : '—'} {reviews.length > 0 && <FiStar size={14} style={{ fill: '#f5c518', color: '#f5c518', verticalAlign: 'middle' }} />}</div><div className="pm-stat-card__label">Điểm TB</div></div>
        </div>
      </div>

      <div className="pm-toolbar">
        <div className="pm-toolbar__left">
          <div className="pm-search">
            <FiSearch className="pm-search__icon" size={16} />
            <input type="text" className="pm-search__input" placeholder="Tìm theo khách hàng, sản phẩm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="pm-table-wrap">
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead><tr><th>Mã</th><th>Khách hàng</th><th>Sản phẩm</th><th>Điểm</th><th>Ngày</th><th style={{ width: '80px' }}>Thao tác</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6}><div className="pm-empty"><FiStar className="pm-empty__icon" size={48} /><div className="pm-empty__title">Không có đánh giá</div></div></td></tr>
              ) : paginated.map(review => (
                <tr key={review.ReviewID}>
                  <td>{review.ReviewID}</td>
                  <td><span className="pm-table__product-name">{review.CustomerName}</span></td>
                  <td>{review.ProductName}</td>
                  <td>{renderStars(review.Rating)}</td>
                  <td>{review.CreateDate}</td>
                  <td>
                    <div className="pm-table__actions" style={{ justifyContent: 'center' }}>
                      <button className="pm-table__action-btn" title="Xem" onClick={() => setModal({ open: true, review })}><FiEye size={15} /></button>
                      <button className="pm-table__action-btn pm-table__action-btn--danger" title="Xóa" onClick={() => handleDelete(review.ReviewID, review._dbId)}><FiTrash2 size={15} /></button>
                    </div>
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

      {modal.open && modal.review && (
        <div className="pm-modal-overlay" onClick={() => setModal({ open: false, review: null })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title"><FiStar size={18} /> Chi tiết đánh giá</h2>
              <button className="pm-modal__close" onClick={() => setModal({ open: false, review: null })}><FiX size={18} /></button>
            </div>
            <div className="pm-modal__body">
              <div className="pm-detail">
                <div className="pm-detail__item"><span className="pm-detail__label">Khách hàng</span><span className="pm-detail__value">{modal.review.CustomerName}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Vai trò</span><span className="pm-detail__value">{modal.review.Role}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Sản phẩm</span><span className="pm-detail__value">{modal.review.ProductName}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Điểm đánh giá</span><span className="pm-detail__value">{renderStars(modal.review.Rating)} ({modal.review.Rating}/5)</span></div>

                <div className="pm-detail__item"><span className="pm-detail__label">Ngày đánh giá</span><span className="pm-detail__value">{modal.review.CreateDate}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`pm-toast pm-toast--${toast.type}`}>{toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}{toast.message}</div>}
    </div>
  )
}

export default ReviewManager
