import { useState, useEffect, useCallback } from 'react'
import {
  FiSearch, FiPlus, FiCheck, FiX, FiTrash2, FiEye, FiEdit2,
  FiChevronLeft, FiChevronRight, FiTruck, FiAlertCircle,
  FiPhone, FiMail, FiMapPin
} from 'react-icons/fi'
import '../Admin/ProductManager.css'

const generateId = () => 'NCC' + String(Date.now()).slice(-4) + Math.random().toString(36).slice(-2).toUpperCase()

const STATUS_COLORS = {
  'Hoạt động': { bg: '#e8f5e9', color: '#4caf50' },
  'Tạm ngưng': { bg: '#fff3e0', color: '#e65100' },
  'Ngưng hợp tác': { bg: '#fef2f2', color: '#dc2626' },
}

const formatPrice = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

const STORAGE_KEY = 'aether_suppliers'

function loadSuppliers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveSuppliers(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function SupplierManager() {
  const [data, setData] = useState(loadSuppliers)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [modal, setModal] = useState({ open: false, mode: 'view', item: null })
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000) }, [])

  const filtered = data.filter(d => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return d.name.toLowerCase().includes(q) || d.contact.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.products.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const startIdx = (currentPage - 1) * perPage
  const paginated = filtered.slice(startIdx, startIdx + perPage)

  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  const handleAdd = () => {
    setModal({
      open: true, mode: 'add',
      item: { id: generateId(), name: '', contact: '', phone: '', email: '', address: '', products: '', status: 'Hoạt động', totalOrders: 0, totalSpent: 0, lastOrder: new Date().toISOString().split('T')[0], note: '' }
    })
  }

  const handleSave = (item) => {
    if (modal.mode === 'add') {
      const updated = [item, ...data]
      setData(updated)
      saveSuppliers(updated)
      showToast('Đã thêm nhà cung cấp!')
    } else {
      const updated = data.map(d => d.id === item.id ? item : d)
      setData(updated)
      saveSuppliers(updated)
      showToast('Đã cập nhật nhà cung cấp!')
    }
    setModal({ open: false, mode: 'view', item: null })
  }

  const handleDelete = (id) => {
    if (!window.confirm('Xóa nhà cung cấp này?')) return
    const updated = data.filter(d => d.id !== id)
    setData(updated)
    saveSuppliers(updated)
    showToast('Đã xóa nhà cung cấp!')
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
          <h1>Nhà cung cấp</h1>
          <p>Quản lý danh sách nhà cung cấp và đối tác</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card"><div className="pm-stat-card__value">{data.length}</div><div className="pm-stat-card__label">Tổng NCC</div></div>
          <div className="pm-stat-card"><div className="pm-stat-card__value">{data.filter(d => d.status === 'Hoạt động').length}</div><div className="pm-stat-card__label">Đang hợp tác</div></div>
        </div>
      </div>

      <div className="pm-toolbar">
        <div className="pm-toolbar__left">
          <div className="pm-search">
            <FiSearch className="pm-search__icon" size={16} />
            <input type="text" className="pm-search__input" placeholder="Tìm nhà cung cấp..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="pm-toolbar__right">
          <button className="pm-btn pm-btn--primary" onClick={handleAdd}><FiPlus size={16} /> Thêm NCC</button>
        </div>
      </div>

      <div className="pm-table-wrap">
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead><tr><th>Mã</th><th>Tên NCC</th><th>Liên hệ</th><th>SĐT</th><th>Sản phẩm cung cấp</th><th>Đơn hàng</th><th>Tổng chi</th><th>Trạng thái</th><th style={{ width: '100px' }}>Thao tác</th></tr></thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9}><div className="pm-empty"><FiTruck className="pm-empty__icon" size={48} /><div className="pm-empty__title">Không có nhà cung cấp</div></div></td></tr>
              ) : paginated.map(item => {
                const sc = STATUS_COLORS[item.status] || STATUS_COLORS['Hoạt động']
                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td><span className="pm-table__product-name">{item.name}</span></td>
                    <td>{item.contact}</td>
                    <td>{item.phone}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.products}</td>
                    <td>{item.totalOrders}</td>
                    <td><strong>{formatPrice(item.totalSpent)}</strong></td>
                    <td><span className="pm-table__type-badge" style={{ background: sc.bg, color: sc.color }}>{item.status}</span></td>
                    <td>
                      <div className="pm-table__actions">
                        <button className="pm-table__action-btn" title="Xem" onClick={() => setModal({ open: true, mode: 'view', item })}><FiEye size={15} /></button>
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
        <div className="pm-modal-overlay" onClick={() => setModal({ open: false, mode: 'view', item: null })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title"><FiTruck size={18} /> {modal.item.name}</h2>
              <button className="pm-modal__close" onClick={() => setModal({ open: false, mode: 'view', item: null })}><FiX size={18} /></button>
            </div>
            <div className="pm-modal__body">
              <div className="pm-detail">
                <div className="pm-detail__item"><span className="pm-detail__label">Mã NCC</span><span className="pm-detail__value">{modal.item.id}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Trạng thái</span><span className="pm-detail__value">{modal.item.status}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label"><FiPhone size={13} style={{ marginRight: 4 }} />Người liên hệ</span><span className="pm-detail__value">{modal.item.contact}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Số điện thoại</span><span className="pm-detail__value">{modal.item.phone}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label"><FiMail size={13} style={{ marginRight: 4 }} />Email</span><span className="pm-detail__value">{modal.item.email}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Tổng đơn nhập</span><span className="pm-detail__value">{modal.item.totalOrders}</span></div>
                <div className="pm-detail__item pm-detail--full"><span className="pm-detail__label"><FiMapPin size={13} style={{ marginRight: 4 }} />Địa chỉ</span><span className="pm-detail__value">{modal.item.address}</span></div>
                <div className="pm-detail__item pm-detail--full"><span className="pm-detail__label">Sản phẩm cung cấp</span><span className="pm-detail__value">{modal.item.products}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Tổng chi</span><span className="pm-detail__value" style={{ fontWeight: 700, color: '#4caf50' }}>{formatPrice(modal.item.totalSpent)}</span></div>
                <div className="pm-detail__item"><span className="pm-detail__label">Nhập hàng gần nhất</span><span className="pm-detail__value">{modal.item.lastOrder}</span></div>
                {modal.item.note && <div className="pm-detail__item pm-detail--full"><span className="pm-detail__label">Ghi chú</span><span className="pm-detail__value">{modal.item.note}</span></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {modal.open && modal.item && (modal.mode === 'add' || modal.mode === 'edit') && (
        <div className="pm-modal-overlay" onClick={() => setModal({ open: false, mode: 'view', item: null })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title">{modal.mode === 'add' ? <><FiTruck size={18} /> Thêm nhà cung cấp</> : <><FiEdit2 size={18} /> Sửa nhà cung cấp</>}</h2>
              <button className="pm-modal__close" onClick={() => setModal({ open: false, mode: 'view', item: null })}><FiX size={18} /></button>
            </div>
            <SupplierForm item={modal.item} onSave={handleSave} onCancel={() => setModal({ open: false, mode: 'view', item: null })} mode={modal.mode} />
          </div>
        </div>
      )}

      {toast && <div className={`pm-toast pm-toast--${toast.type}`}>{toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}{toast.message}</div>}
    </div>
  )
}

function SupplierForm({ item, onSave, onCancel, mode }) {
  const [form, setForm] = useState({ ...item })
  const handleChange = (f, v) => setForm(prev => ({ ...prev, [f]: v }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!form.name.trim()) { alert('Nhập tên NCC!'); return }; onSave(form) }}>
      <div className="pm-modal__body">
        <div className="pm-form-grid">
          <div className="pm-form__group"><label className="pm-form__label">Mã NCC</label><input className="pm-form__input" value={form.id} readOnly /></div>
          <div className="pm-form__group"><label className="pm-form__label">Trạng thái</label>
            <select className="pm-form__select" value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Tạm ngưng">Tạm ngưng</option>
              <option value="Ngưng hợp tác">Ngưng hợp tác</option>
            </select>
          </div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Tên nhà cung cấp *</label><input className="pm-form__input" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required autoFocus /></div>
          <div className="pm-form__group"><label className="pm-form__label">Người liên hệ</label><input className="pm-form__input" value={form.contact} onChange={(e) => handleChange('contact', e.target.value)} /></div>
          <div className="pm-form__group"><label className="pm-form__label">Số điện thoại</label><input className="pm-form__input" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} /></div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Email</label><input className="pm-form__input" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} /></div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Địa chỉ</label><input className="pm-form__input" value={form.address} onChange={(e) => handleChange('address', e.target.value)} /></div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Sản phẩm cung cấp</label><input className="pm-form__input" value={form.products} onChange={(e) => handleChange('products', e.target.value)} placeholder="VD: Sen đá, Xương rồng, Bonsai..." /></div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Ghi chú</label><input className="pm-form__input" value={form.note} onChange={(e) => handleChange('note', e.target.value)} placeholder="Ghi chú thêm..." /></div>
        </div>
      </div>
      <div className="pm-modal__footer">
        <button type="button" className="pm-btn" onClick={onCancel}>Hủy</button>
        <button type="submit" className="pm-btn pm-btn--primary">{mode === 'add' ? 'Thêm' : 'Lưu'}</button>
      </div>
    </form>
  )
}

export default SupplierManager
