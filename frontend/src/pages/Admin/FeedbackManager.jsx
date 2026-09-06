import { useState, useEffect, useCallback } from 'react'
import {
  FiSearch, FiCheck, FiX, FiMessageSquare, FiSend,
  FiChevronLeft, FiChevronRight, FiClock, FiAlertCircle
} from 'react-icons/fi'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import '../Admin/ProductManager.css'

function FeedbackManager() {
  const [feedbacks, setFeedbacks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [modal, setModal] = useState({ open: false, item: null })
  const [response, setResponse] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { token } = useAuth()

  const showToast = useCallback((msg, type = 'success') => { 
    setToast({ message: msg, type }); 
    setTimeout(() => setToast(null), 3000) 
  }, [])

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/contact/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.success) {
        setFeedbacks(res.data.data)
      }
    } catch (err) {
      showToast('Lỗi khi tải danh sách phản hồi', 'error')
    } finally {
      setLoading(false)
    }
  }, [token, showToast])

  useEffect(() => {
    fetchFeedbacks()
  }, [fetchFeedbacks])

  const handleRespond = async () => {
    if (!response.trim()) {
      showToast('Vui lòng nhập nội dung phản hồi', 'error')
      return
    }
    
    setIsSubmitting(true)
    try {
      const res = await axios.post(`${API_BASE}/contact/${modal.item.id}/respond`, 
        { phan_hoi_admin: response },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (res.data.success) {
        showToast('Đã gửi phản hồi và kích hoạt thông báo cho khách hàng!')
        setModal({ open: false, item: null })
        setResponse('')
        fetchFeedbacks()
      }
    } catch (err) {
      console.error('Respond error:', err)
      const errMsg = err.response?.data?.message || 'Lỗi khi gửi phản hồi'
      showToast(errMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = feedbacks.filter(f => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return f.ho_ten.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.tin_nhan.toLowerCase().includes(q)
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

  return (
    <div className="pm">
      <div className="pm-page-header">
        <div className="pm-page-header__left">
          <h1>Quản lý phản hồi</h1>
          <p>Lắng nghe và trả lời ý kiến từ khách hàng</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{feedbacks.length}</div>
            <div className="pm-stat-card__label">Tổng phản hồi</div>
          </div>
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{feedbacks.filter(f => f.trang_thai === 'Chờ phản hồi').length}</div>
            <div className="pm-stat-card__label">Chưa xử lý</div>
          </div>
        </div>
      </div>

      <div className="pm-toolbar">
        <div className="pm-toolbar__left">
          <div className="pm-search">
            <FiSearch className="pm-search__icon" size={16} />
            <input 
              type="text" 
              className="pm-search__input" 
              placeholder="Tìm theo tên, email, nội dung..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="pm-table-wrap">
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead>
              <tr>
                <th>Ngày gửi</th>
                <th>Khách hàng</th>
                <th>Email</th>
                <th>Nội dung</th>
                <th>Trạng thái</th>
                <th style={{ width: '100px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</td></tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="pm-empty">
                      <FiMessageSquare className="pm-empty__icon" size={48} />
                      <div className="pm-empty__title">Không có phản hồi nào</div>
                    </div>
                  </td>
                </tr>
              ) : paginated.map(fb => (
                <tr key={fb.id}>
                  <td style={{ fontSize: '13px' }}>{new Date(fb.ngay_gui).toLocaleDateString('vi-VN')}</td>
                  <td><span className="pm-table__product-name">{fb.ho_ten}</span></td>
                  <td>{fb.email}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fb.tin_nhan}
                  </td>
                  <td>
                    <span className="pm-table__type-badge" style={fb.trang_thai === 'Chờ phản hồi' ? { background: '#fff3e0', color: '#e65100' } : { background: '#e8f5e9', color: '#4caf50' }}>
                      {fb.trang_thai}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="pm-table__action-btn" 
                      title="Trả lời" 
                      onClick={() => {
                        setModal({ open: true, item: fb });
                        setResponse(fb.phan_hoi_admin || '');
                      }}
                    >
                      <FiSend size={15} />
                    </button>
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

      {modal.open && modal.item && (
        <div className="pm-modal-overlay" onClick={() => setModal({ open: false, item: null })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title"><FiMessageSquare size={18} /> Phản hồi khách hàng</h2>
              <button className="pm-modal__close" onClick={() => setModal({ open: false, item: null })}><FiX size={18} /></button>
            </div>
            <div className="pm-modal__body">
              <div className="pm-detail">
                <div className="pm-detail__item">
                  <span className="pm-detail__label">Khách hàng:</span>
                  <span className="pm-detail__value">{modal.item.ho_ten} ({modal.item.email})</span>
                </div>
                <div className="pm-detail__item">
                  <span className="pm-detail__label">Ngày gửi:</span>
                  <span className="pm-detail__value">{new Date(modal.item.ngay_gui).toLocaleString('vi-VN')}</span>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Nội dung khách gửi:</label>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', fontSize: '14px', lineHeight: '1.6', border: '1px solid #e2e8f0' }}>
                    {modal.item.tin_nhan}
                  </div>
                </div>
                
                <div style={{ marginTop: '25px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Phản hồi của Admin:</label>
                  <textarea 
                    style={{ width: '100%', minHeight: '150px', padding: '15px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
                    placeholder="Nhập nội dung phản hồi cho khách hàng..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button 
                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                    onClick={() => setModal({ open: false, item: null })}
                  >
                    Hủy
                  </button>
                  <button 
                    style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: isSubmitting ? '#94a3b8' : '#1a1a1a', color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                    onClick={handleRespond}
                    disabled={isSubmitting}
                  >
                    <FiSend size={16} />
                    {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`pm-toast pm-toast--${toast.type}`}>{toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}{toast.message}</div>}
    </div>
  )
}

export default FeedbackManager
