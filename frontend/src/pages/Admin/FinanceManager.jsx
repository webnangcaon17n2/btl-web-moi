import { useState, useEffect, useCallback } from 'react'
import {
  FiSearch, FiPlus, FiCheck, FiX, FiTrash2, FiEye, FiEdit2,
  FiChevronLeft, FiChevronRight, FiDollarSign, FiAlertCircle,
  FiTrendingUp, FiTrendingDown
} from 'react-icons/fi'
import { API_URL } from '../../config/api'
import '../Admin/ProductManager.css'

const API = API_URL
const TYPES = ['Thu', 'Chi']
const CATEGORIES_THU = ['Bán hàng', 'Dịch vụ', 'Khác']
const CATEGORIES_CHI = ['Nhập hàng', 'Vận chuyển', 'Marketing', 'Nhân sự', 'Tiện ích', 'Khác']

const formatPrice = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

function FinanceManager() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000) }, [])

  const loadData = useCallback(() => {
    setLoading(true)
    fetch(`${API}/api/thu-chi`)
      .then(r => r.json())
      .then(rows => setData(rows.map(r => ({
        id: r.id,
        displayId: r.ma_giao_dich || `TC${String(r.id).padStart(3, '0')}`,
        type: r.loai,
        category: r.danh_muc,
        description: r.mo_ta,
        amount: Number(r.so_tien),
        date: r.ngay_giao_dich ? r.ngay_giao_dich.split('T')[0] : '',
        note: r.ghi_chu || ''
      }))))
      .catch(() => showToast('Không thể tải dữ liệu thu chi!', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => { loadData() }, [loadData])

  const filtered = data.filter(d => {
    if (filterType !== 'all' && d.type !== filterType) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return d.description.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.displayId.toLowerCase().includes(q)
  })

  const totalThu = data.filter(d => d.type === 'Thu').reduce((s, d) => s + d.amount, 0)
  const totalChi = data.filter(d => d.type === 'Chi').reduce((s, d) => s + d.amount, 0)

  const totalPages = Math.ceil(filtered.length / perPage)
  const startIdx = (currentPage - 1) * perPage
  const paginated = filtered.slice(startIdx, startIdx + perPage)

  useEffect(() => { setCurrentPage(1) }, [searchQuery, filterType])

  const handleAdd = () => {
    setModal({
      open: true, mode: 'add',
      item: { id: null, displayId: '', type: 'Thu', category: 'Bán hàng', description: '', amount: 0, date: new Date().toISOString().split('T')[0], note: '' }
    })
  }

  const handleSave = async (item) => {
    const payload = {
      loai: item.type,
      danh_muc: item.category,
      mo_ta: item.description,
      so_tien: item.amount,
      ngay_giao_dich: item.date,
      ghi_chu: item.note
    }

    try {
      if (modal.mode === 'add') {
        const res = await fetch(`${API}/api/thu-chi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error()
        showToast('Đã thêm giao dịch!')
      } else {
        const res = await fetch(`${API}/api/thu-chi/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error()
        showToast('Đã cập nhật giao dịch!')
      }
      setModal({ open: false, mode: 'add', item: null })
      loadData()
    } catch {
      showToast('Lỗi lưu giao dịch!', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa giao dịch này?')) return
    try {
      await fetch(`${API}/api/thu-chi/${id}`, { method: 'DELETE' })
      showToast('Đã xóa giao dịch!')
      loadData()
    } catch {
      showToast('Lỗi xóa giao dịch!', 'error')
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
          <h1>Quản lý thu chi</h1>
          <p>Theo dõi doanh thu và chi phí cửa hàng</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card" style={{ borderLeft: '3px solid #4caf50' }}>
            <div className="pm-stat-card__value" style={{ color: '#4caf50' }}>{formatPrice(totalThu)}</div>
            <div className="pm-stat-card__label">Tổng thu</div>
          </div>
          <div className="pm-stat-card" style={{ borderLeft: '3px solid #ef4444' }}>
            <div className="pm-stat-card__value" style={{ color: '#ef4444' }}>{formatPrice(totalChi)}</div>
            <div className="pm-stat-card__label">Tổng chi</div>
          </div>
          <div className="pm-stat-card" style={{ borderLeft: `3px solid ${totalThu - totalChi >= 0 ? '#4caf50' : '#ef4444'}` }}>
            <div className="pm-stat-card__value" style={{ color: totalThu - totalChi >= 0 ? '#4caf50' : '#ef4444' }}>{formatPrice(totalThu - totalChi)}</div>
            <div className="pm-stat-card__label">Lợi nhuận</div>
          </div>
        </div>
      </div>

      <div className="pm-toolbar">
        <div className="pm-toolbar__left">
          <div className="pm-search">
            <FiSearch className="pm-search__icon" size={16} />
            <input type="text" className="pm-search__input" placeholder="Tìm giao dịch..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <select className="pm-form__select" style={{ padding: '8px 14px', width: 'auto', minWidth: '120px' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="Thu">Chỉ thu</option>
            <option value="Chi">Chỉ chi</option>
          </select>
        </div>
        <div className="pm-toolbar__right">
          <button className="pm-btn pm-btn--primary" onClick={handleAdd}><FiPlus size={16} /> Thêm giao dịch</button>
        </div>
      </div>

      <div className="pm-table-wrap">
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead><tr><th>Mã</th><th>Loại</th><th>Danh mục</th><th>Mô tả</th><th>Số tiền</th><th>Ngày</th><th style={{ width: '90px' }}>Thao tác</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7}><div className="pm-empty"><FiDollarSign className="pm-empty__icon" size={48} /><div className="pm-empty__title">Không có giao dịch</div></div></td></tr>
              ) : paginated.map(item => (
                <tr key={item.id}>
                  <td>{item.displayId}</td>
                  <td>
                    <span className="pm-table__type-badge" style={item.type === 'Thu' ? { background: '#e8f5e9', color: '#4caf50' } : { background: '#fef2f2', color: '#ef4444' }}>
                      {item.type === 'Thu' ? <><FiTrendingUp size={12} /> Thu</> : <><FiTrendingDown size={12} /> Chi</>}
                    </span>
                  </td>
                  <td><span className="pm-table__type-badge">{item.category}</span></td>
                  <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</td>
                  <td><strong style={{ color: item.type === 'Thu' ? '#4caf50' : '#ef4444' }}>{item.type === 'Thu' ? '+' : '-'}{formatPrice(item.amount)}</strong></td>
                  <td>{item.date}</td>
                  <td>
                    <div className="pm-table__actions">
                      <button className="pm-table__action-btn" title="Sửa" onClick={() => setModal({ open: true, mode: 'edit', item: { ...item } })}><FiEdit2 size={15} /></button>
                      <button className="pm-table__action-btn pm-table__action-btn--danger" title="Xóa" onClick={() => handleDelete(item.id)}><FiTrash2 size={15} /></button>
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

      {modal.open && (
        <div className="pm-modal-overlay" onClick={() => setModal({ open: false, mode: 'add', item: null })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title">{modal.mode === 'add' ? <><FiDollarSign size={18} /> Thêm giao dịch</> : <><FiEdit2 size={18} /> Sửa giao dịch</>}</h2>
              <button className="pm-modal__close" onClick={() => setModal({ open: false, mode: 'add', item: null })}><FiX size={18} /></button>
            </div>
            <FinanceForm item={modal.item} onSave={handleSave} onCancel={() => setModal({ open: false, mode: 'add', item: null })} mode={modal.mode} />
          </div>
        </div>
      )}

      {toast && <div className={`pm-toast pm-toast--${toast.type}`}>{toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}{toast.message}</div>}
    </div>
  )
}

function FinanceForm({ item, onSave, onCancel, mode }) {
  const [form, setForm] = useState({ ...item })
  const cats = form.type === 'Thu' ? CATEGORIES_THU : CATEGORIES_CHI
  const handleChange = (f, v) => {
    const next = { ...form, [f]: v }
    if (f === 'type') next.category = (v === 'Thu' ? CATEGORIES_THU : CATEGORIES_CHI)[0]
    setForm(next)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!form.description.trim()) { alert('Nhập mô tả!'); return }; onSave(form) }}>
      <div className="pm-modal__body">
        <div className="pm-form-grid">
          <div className="pm-form__group"><label className="pm-form__label">Loại *</label>
            <select className="pm-form__select" value={form.type} onChange={(e) => handleChange('type', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="pm-form__group"><label className="pm-form__label">Danh mục</label>
            <select className="pm-form__select" value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="pm-form__group"><label className="pm-form__label">Ngày</label><input className="pm-form__input" type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} /></div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Mô tả *</label><input className="pm-form__input" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Mô tả giao dịch" required autoFocus /></div>
          <div className="pm-form__group"><label className="pm-form__label">Số tiền (VNĐ) *</label><input className="pm-form__input" type="number" value={form.amount} onChange={(e) => handleChange('amount', Number(e.target.value))} min="0" required /></div>
          <div className="pm-form__group"><label className="pm-form__label">Ghi chú</label><input className="pm-form__input" value={form.note} onChange={(e) => handleChange('note', e.target.value)} placeholder="Ghi chú thêm..." /></div>
        </div>
      </div>
      <div className="pm-modal__footer">
        <button type="button" className="pm-btn" onClick={onCancel}>Hủy</button>
        <button type="submit" className="pm-btn pm-btn--primary">{mode === 'add' ? 'Thêm' : 'Lưu'}</button>
      </div>
    </form>
  )
}

export default FinanceManager
