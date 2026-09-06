import { useState, useEffect, useCallback } from 'react'
import {
  FiSearch, FiPlus, FiCheck, FiX, FiTrash2, FiEye, FiEdit2,
  FiChevronLeft, FiChevronRight, FiAlertOctagon, FiAlertCircle,
  FiMessageSquare
} from 'react-icons/fi'
import '../Admin/ProductManager.css'

const PRIORITIES = ['Cao', 'Trung bình', 'Thấp']
const STATUSES = ['Mới', 'Đang xử lý', 'Đã xử lý', 'Từ chối']
const PRIORITY_COLORS = {
  'Cao': { bg: '#fef2f2', color: '#dc2626' },
  'Trung bình': { bg: '#fff3e0', color: '#e65100' },
  'Thấp': { bg: '#e3f2fd', color: '#1565c0' },
}
const STATUS_COLORS = {
  'Mới': { bg: '#e3f2fd', color: '#1565c0' },
  'Đang xử lý': { bg: '#fff3e0', color: '#e65100' },
  'Đã xử lý': { bg: '#e8f5e9', color: '#4caf50' },
  'Từ chối': { bg: '#fef2f2', color: '#dc2626' },
}

const generateId = () => 'BUG' + String(Date.now()).slice(-4) + Math.random().toString(36).slice(-2).toUpperCase()

const SAMPLE = [
  { id: 'BUG001', title: 'Không thêm được sản phẩm vào giỏ hàng', reporter: 'Nguyễn Văn A', role: 'Người dùng', priority: 'Cao', status: 'Mới', date: '2026-04-11', description: 'Khi bấm nút "Thêm vào giỏ" ở trang Shop, không có phản hồi gì. Đã thử trên Chrome và Firefox.', adminNote: '' },
  { id: 'BUG002', title: 'Ảnh sản phẩm không hiển thị đúng kích thước', reporter: 'Trần Thị B', role: 'Người dùng', priority: 'Trung bình', status: 'Đang xử lý', date: '2026-04-10', description: 'Một số ảnh sản phẩm bị méo trên mobile, tỉ lệ không đúng.', adminNote: 'Đang kiểm tra responsive cho mobile viewport' },
  { id: 'BUG003', title: 'Lỗi khi xuất báo cáo doanh thu PDF', reporter: 'Admin Phú', role: 'Admin', priority: 'Cao', status: 'Mới', date: '2026-04-10', description: 'Nhấn nút xuất PDF ở trang Thu chi bị lỗi trắng, console báo "Cannot read properties of undefined".', adminNote: '' },
  { id: 'BUG004', title: 'Trang đăng ký bị lỗi validate email', reporter: 'Lê Văn C', role: 'Người dùng', priority: 'Trung bình', status: 'Đã xử lý', date: '2026-04-08', description: 'Email có dấu "+" bị báo không hợp lệ khi đăng ký tài khoản mới.', adminNote: 'Đã cập nhật regex validate email cho phép ký tự đặc biệt' },
  { id: 'BUG005', title: 'Blog không hiển thị trên Safari', reporter: 'Phạm Thị D', role: 'Người dùng', priority: 'Thấp', status: 'Từ chối', date: '2026-04-07', description: 'Phần blog trên trang chủ bị trống khi dùng Safari phiên bản cũ.', adminNote: 'Safari 12 trở xuống không được hỗ trợ, yêu cầu cập nhật trình duyệt' },
  { id: 'BUG006', title: 'Sidebar admin bị đè chữ khi thu nhỏ', reporter: 'Admin Linh', role: 'Admin', priority: 'Thấp', status: 'Đang xử lý', date: '2026-04-09', description: 'Khi thu nhỏ sidebar trên màn hình 1280px, chữ menu bị cắt ngắn.', adminNote: 'Cần thêm tooltip khi hover menu thu gọn' },
  { id: 'BUG007', title: 'Lọc đơn hàng theo ngày không hoạt động', reporter: 'Admin Phú', role: 'Admin', priority: 'Trung bình', status: 'Mới', date: '2026-04-11', description: 'Bộ lọc ngày ở trang Đơn hàng không trả kết quả đúng khi chọn khoảng thời gian.', adminNote: '' },
  { id: 'BUG008', title: 'Thông báo không hiện trên mobile', reporter: 'Hoàng Văn E', role: 'Người dùng', priority: 'Trung bình', status: 'Mới', date: '2026-04-11', description: 'Khi truy cập trang web trên điện thoại, không thấy nút chuông thông báo.', adminNote: '' },
]

function BugReportManager() {
  const [data, setData] = useState(SAMPLE)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [modal, setModal] = useState({ open: false, mode: 'view', item: null })
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000) }, [])

  const filtered = data.filter(d => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return d.title.toLowerCase().includes(q) || d.reporter.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const startIdx = (currentPage - 1) * perPage
  const paginated = filtered.slice(startIdx, startIdx + perPage)

  useEffect(() => { setCurrentPage(1) }, [searchQuery, filterStatus])

  const handleStatusChange = (id, newStatus) => {
    setData(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
    showToast('Đã cập nhật trạng thái!')
  }

  const handleSaveNote = (id, note) => {
    setData(prev => prev.map(d => d.id === id ? { ...d, adminNote: note } : d))
    showToast('Đã lưu ghi chú!')
    setModal({ open: false, mode: 'view', item: null })
  }

  const handleAdd = () => {
    setModal({
      open: true, mode: 'add',
      item: { id: generateId(), title: '', reporter: '', role: 'Người dùng', priority: 'Trung bình', status: 'Mới', date: new Date().toISOString().split('T')[0], description: '', adminNote: '' }
    })
  }

  const handleSave = (item) => {
    if (modal.mode === 'add') {
      setData(prev => [item, ...prev])
      showToast('Đã thêm báo cáo lỗi!')
    } else {
      setData(prev => prev.map(d => d.id === item.id ? item : d))
      showToast('Đã cập nhật báo cáo!')
    }
    setModal({ open: false, mode: 'view', item: null })
  }

  const handleDelete = (id) => {
    if (!window.confirm('Xóa báo cáo lỗi này?')) return
    setData(prev => prev.filter(d => d.id !== id))
    showToast('Đã xóa báo cáo!')
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
          <h1>Báo cáo lỗi</h1>
          <p>Nhận và xử lý báo cáo lỗi từ người dùng và admin</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card" style={{ borderLeft: '3px solid #1565c0' }}>
            <div className="pm-stat-card__value">{data.filter(d => d.status === 'Mới').length}</div>
            <div className="pm-stat-card__label">Mới</div>
          </div>
          <div className="pm-stat-card" style={{ borderLeft: '3px solid #e65100' }}>
            <div className="pm-stat-card__value">{data.filter(d => d.status === 'Đang xử lý').length}</div>
            <div className="pm-stat-card__label">Đang xử lý</div>
          </div>
          <div className="pm-stat-card" style={{ borderLeft: '3px solid #4caf50' }}>
            <div className="pm-stat-card__value">{data.filter(d => d.status === 'Đã xử lý').length}</div>
            <div className="pm-stat-card__label">Đã xử lý</div>
          </div>
        </div>
      </div>

      <div className="pm-toolbar">
        <div className="pm-toolbar__left">
          <div className="pm-search">
            <FiSearch className="pm-search__icon" size={16} />
            <input type="text" className="pm-search__input" placeholder="Tìm báo cáo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <select className="pm-form__select" style={{ padding: '8px 14px', width: 'auto', minWidth: '140px' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="pm-toolbar__right">
          <button className="pm-btn pm-btn--primary" onClick={handleAdd}><FiPlus size={16} /> Thêm báo cáo</button>
        </div>
      </div>

      <div className="pm-table-wrap">
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead><tr><th>Mã</th><th>Tiêu đề</th><th>Người báo</th><th>Vai trò</th><th>Mức độ</th><th>Trạng thái</th><th>Ngày</th><th>Ghi chú</th><th style={{ width: '100px' }}>Thao tác</th></tr></thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9}><div className="pm-empty"><FiAlertOctagon className="pm-empty__icon" size={48} /><div className="pm-empty__title">Không có báo cáo lỗi</div></div></td></tr>
              ) : paginated.map(item => {
                const pc = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS['Thấp']
                const sc = STATUS_COLORS[item.status] || STATUS_COLORS['Mới']
                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td><span className="pm-table__product-name" style={{ maxWidth: '220px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span></td>
                    <td>{item.reporter}</td>
                    <td><span className="pm-table__type-badge" style={item.role === 'Admin' ? { background: '#f3e5f5', color: '#7b1fa2' } : {}}>{item.role}</span></td>
                    <td><span className="pm-table__type-badge" style={{ background: pc.bg, color: pc.color }}>{item.priority}</span></td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="pm-form__select"
                        style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '20px', fontWeight: 600, background: sc.bg, color: sc.color, borderColor: 'transparent', cursor: 'pointer' }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>{item.date}</td>
                    <td>
                      {item.adminNote ? (
                        <span title={item.adminNote} style={{ fontSize: '12px', color: '#4caf50', cursor: 'help' }}><FiMessageSquare size={14} style={{ verticalAlign: 'middle' }} /> Có ghi chú</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#bbb' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="pm-table__actions">
                        <button className="pm-table__action-btn" title="Xem & Ghi chú" onClick={() => setModal({ open: true, mode: 'view', item })}><FiEye size={15} /></button>
                        <button className="pm-table__action-btn" title="Sửa" onClick={() => setModal({ open: true, mode: 'edit', item: { ...item } })}><FiEdit2 size={15} /></button>
                        <button className="pm-table__action-btn pm-table__action-btn--danger" title="Xóa" onClick={() => handleDelete(item.id)}><FiTrash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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

      {modal.open && modal.item && modal.mode === 'view' && (
        <BugDetailModal item={modal.item} onSaveNote={handleSaveNote} onClose={() => setModal({ open: false, mode: 'view', item: null })} onStatusChange={handleStatusChange} />
      )}

      {modal.open && modal.item && (modal.mode === 'add' || modal.mode === 'edit') && (
        <div className="pm-modal-overlay" onClick={() => setModal({ open: false, mode: 'view', item: null })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title">{modal.mode === 'add' ? <><FiAlertOctagon size={18} /> Thêm báo cáo lỗi</> : <><FiEdit2 size={18} /> Sửa báo cáo lỗi</>}</h2>
              <button className="pm-modal__close" onClick={() => setModal({ open: false, mode: 'view', item: null })}><FiX size={18} /></button>
            </div>
            <BugForm item={modal.item} onSave={handleSave} onCancel={() => setModal({ open: false, mode: 'view', item: null })} mode={modal.mode} />
          </div>
        </div>
      )}

      {toast && <div className={`pm-toast pm-toast--${toast.type}`}>{toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}{toast.message}</div>}
    </div>
  )
}

function BugDetailModal({ item, onSaveNote, onClose, onStatusChange }) {
  const [note, setNote] = useState(item.adminNote || '')
  const pc = PRIORITY_COLORS[item.priority]
  const sc = STATUS_COLORS[item.status]

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal__header">
          <h2 className="pm-modal__title"><FiAlertOctagon size={18} /> {item.title}</h2>
          <button className="pm-modal__close" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="pm-modal__body">
          <div className="pm-detail">
            <div className="pm-detail__item"><span className="pm-detail__label">Mã báo cáo</span><span className="pm-detail__value">{item.id}</span></div>
            <div className="pm-detail__item"><span className="pm-detail__label">Ngày báo cáo</span><span className="pm-detail__value">{item.date}</span></div>
            <div className="pm-detail__item"><span className="pm-detail__label">Người báo cáo</span><span className="pm-detail__value">{item.reporter}</span></div>
            <div className="pm-detail__item"><span className="pm-detail__label">Vai trò</span><span className="pm-detail__value"><span className="pm-table__type-badge" style={item.role === 'Admin' ? { background: '#f3e5f5', color: '#7b1fa2' } : {}}>{item.role}</span></span></div>
            <div className="pm-detail__item"><span className="pm-detail__label">Mức độ</span><span className="pm-detail__value"><span className="pm-table__type-badge" style={{ background: pc.bg, color: pc.color }}>{item.priority}</span></span></div>
            <div className="pm-detail__item"><span className="pm-detail__label">Trạng thái</span><span className="pm-detail__value"><span className="pm-table__type-badge" style={{ background: sc.bg, color: sc.color }}>{item.status}</span></span></div>
            <div className="pm-detail__item pm-detail--full">
              <span className="pm-detail__label">Mô tả chi tiết</span>
              <span className="pm-detail__value" style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{item.description}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
            <label className="pm-form__label" style={{ fontSize: '14px', fontWeight: 600, color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiEdit2 size={14} /> Ghi chú lỗi cần fix (Admin)
            </label>
            <textarea
              className="pm-form__input"
              style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú nguyên nhân lỗi, cách fix, hoặc hướng xử lý..."
            />
          </div>
        </div>
        <div className="pm-modal__footer">
          <button className="pm-btn" onClick={onClose}>Đóng</button>
          <button className="pm-btn pm-btn--primary" onClick={() => onSaveNote(item.id, note)}>
            <FiCheck size={16} /> Lưu ghi chú
          </button>
        </div>
      </div>
    </div>
  )
}

function BugForm({ item, onSave, onCancel, mode }) {
  const [form, setForm] = useState({ ...item })
  const handleChange = (f, v) => setForm(prev => ({ ...prev, [f]: v }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!form.title.trim()) { alert('Nhập tiêu đề!'); return }; onSave(form) }}>
      <div className="pm-modal__body">
        <div className="pm-form-grid">
          <div className="pm-form__group"><label className="pm-form__label">Mã báo cáo</label><input className="pm-form__input" value={form.id} readOnly /></div>
          <div className="pm-form__group"><label className="pm-form__label">Ngày</label><input className="pm-form__input" type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} /></div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Tiêu đề *</label><input className="pm-form__input" value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Mô tả ngắn gọn lỗi..." required autoFocus /></div>
          <div className="pm-form__group"><label className="pm-form__label">Người báo cáo</label><input className="pm-form__input" value={form.reporter} onChange={(e) => handleChange('reporter', e.target.value)} placeholder="Tên người báo" /></div>
          <div className="pm-form__group"><label className="pm-form__label">Vai trò</label>
            <select className="pm-form__select" value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
              <option value="Người dùng">Người dùng</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="pm-form__group"><label className="pm-form__label">Mức độ</label>
            <select className="pm-form__select" value={form.priority} onChange={(e) => handleChange('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="pm-form__group"><label className="pm-form__label">Trạng thái</label>
            <select className="pm-form__select" value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Mô tả chi tiết</label>
            <textarea className="pm-form__input" style={{ minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }} value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Mô tả chi tiết lỗi, các bước tái hiện..." />
          </div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Ghi chú lỗi cần fix (Admin)</label>
            <textarea className="pm-form__input" style={{ minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }} value={form.adminNote} onChange={(e) => handleChange('adminNote', e.target.value)} placeholder="Nguyên nhân, cách fix, hướng xử lý..." />
          </div>
        </div>
      </div>
      <div className="pm-modal__footer">
        <button type="button" className="pm-btn" onClick={onCancel}>Hủy</button>
        <button type="submit" className="pm-btn pm-btn--primary">{mode === 'add' ? 'Thêm' : 'Lưu'}</button>
      </div>
    </form>
  )
}

export default BugReportManager
