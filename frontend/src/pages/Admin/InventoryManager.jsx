import { useState, useEffect, useCallback } from 'react'
import {
  FiSearch, FiCheck, FiX, FiEdit2,
  FiChevronLeft, FiChevronRight, FiBox, FiAlertCircle, FiAlertTriangle
} from 'react-icons/fi'
import { API_URL } from '../../config/api'
import '../Admin/ProductManager.css'

const API = API_URL
const formatPrice = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

function InventoryManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStock, setFilterStock] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [modal, setModal] = useState({ open: false, item: null })
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000) }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/kho`)
      .then(r => r.json())
      .then(data => setItems(data))
      .catch(() => showToast('Không thể tải dữ liệu kho!', 'error'))
      .finally(() => setLoading(false))
  }, [])


  const filtered = items.filter(item => {
    if (filterStock === 'low' && item.Stock >= item.MinStock) return false
    if (filterStock === 'ok' && item.Stock < item.MinStock) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return item.Name.toLowerCase().includes(q) || item.ProductID.toLowerCase().includes(q) || item.Category.toLowerCase().includes(q)
  })

  const totalStock = items.reduce((s, i) => s + i.Stock, 0)
  const lowStockCount = items.filter(i => i.Stock < i.MinStock).length
  const totalValue = items.reduce((s, i) => s + i.Stock * i.ImportPrice, 0)

  const totalPages = Math.ceil(filtered.length / perPage)
  const startIdx = (currentPage - 1) * perPage
  const paginated = filtered.slice(startIdx, startIdx + perPage)

  useEffect(() => { setCurrentPage(1) }, [searchQuery, filterStock])

  const handleUpdateStock = (productId, newStock) => {
    setItems(prev => prev.map(i => i.ProductID === productId ? { ...i, Stock: newStock } : i))
    showToast('Đã cập nhật tồn kho!')
    setModal({ open: false, item: null })
  }

  const getStockStatus = (item) => {
    if (item.Stock <= 0) return { label: 'Hết hàng', color: '#dc2626', bg: '#fef2f2' }
    if (item.Stock < item.MinStock) return { label: 'Sắp hết', color: '#e65100', bg: '#fff3e0' }
    return { label: 'Còn hàng', color: '#4caf50', bg: '#e8f5e9' }
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
          <h1>Quản lý kho</h1>
          <p>Theo dõi hàng tồn kho và giá trị kho hàng</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{totalStock}</div>
            <div className="pm-stat-card__label">Tổng tồn kho</div>
          </div>
          <div className="pm-stat-card" style={{ borderLeft: lowStockCount > 0 ? '3px solid #e65100' : undefined }}>
            <div className="pm-stat-card__value" style={{ color: lowStockCount > 0 ? '#e65100' : undefined }}>{lowStockCount}</div>
            <div className="pm-stat-card__label">Sắp hết hàng</div>
          </div>
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{formatPrice(totalValue)}</div>
            <div className="pm-stat-card__label">Giá trị kho</div>
          </div>
        </div>
      </div>

      <div className="pm-toolbar">
        <div className="pm-toolbar__left">
          <div className="pm-search">
            <FiSearch className="pm-search__icon" size={16} />
            <input type="text" className="pm-search__input" placeholder="Tìm sản phẩm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <select className="pm-form__select" style={{ padding: '8px 14px', width: 'auto', minWidth: '140px' }} value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="low">Sắp hết hàng</option>
            <option value="ok">Còn đủ hàng</option>
          </select>
        </div>
      </div>

      <div className="pm-table-wrap">
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead><tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Loại</th><th>Tồn kho</th><th>Tối thiểu</th><th>Giá nhập</th><th>Giá bán</th><th>Trạng thái</th><th>Nhập cuối</th><th style={{ width: '60px' }}></th></tr></thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={10}><div className="pm-empty"><FiBox className="pm-empty__icon" size={48} /><div className="pm-empty__title">Không có sản phẩm</div></div></td></tr>
              ) : paginated.map(item => {
                const status = getStockStatus(item)
                return (
                  <tr key={item.ProductID} style={item.Stock < item.MinStock ? { background: '#fffbeb' } : undefined}>
                    <td>{item.ProductID}</td>
                    <td><span className="pm-table__product-name">{item.Name}</span></td>
                    <td><span className="pm-table__type-badge">{item.Category}</span></td>
                    <td>
                      <strong style={{ color: item.Stock < item.MinStock ? '#e65100' : undefined }}>
                        {item.Stock < item.MinStock && <FiAlertTriangle size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                        {item.Stock}
                      </strong>
                    </td>
                    <td>{item.MinStock}</td>
                    <td>{formatPrice(item.ImportPrice)}</td>
                    <td>{formatPrice(item.SellPrice)}</td>
                    <td><span className="pm-table__type-badge" style={{ background: status.bg, color: status.color }}>{status.label}</span></td>
                    <td>{item.LastImport}</td>
                    <td>
                      <button className="pm-table__action-btn" title="Cập nhật tồn kho" onClick={() => setModal({ open: true, item: { ...item } })}><FiEdit2 size={15} /></button>
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

      {modal.open && modal.item && (
        <StockUpdateModal item={modal.item} onSave={handleUpdateStock} onClose={() => setModal({ open: false, item: null })} />
      )}

      {toast && <div className={`pm-toast pm-toast--${toast.type}`}>{toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}{toast.message}</div>}
    </div>
  )
}

function StockUpdateModal({ item, onSave, onClose }) {
  const [stock, setStock] = useState(item.Stock)
  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="pm-modal__header">
          <h2 className="pm-modal__title"><FiBox size={18} /> Cập nhật tồn kho</h2>
          <button className="pm-modal__close" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="pm-modal__body">
          <div className="pm-detail">
            <div className="pm-detail__item"><span className="pm-detail__label">Sản phẩm</span><span className="pm-detail__value">{item.Name}</span></div>
            <div className="pm-detail__item"><span className="pm-detail__label">Mã SP</span><span className="pm-detail__value">{item.ProductID}</span></div>
            <div className="pm-detail__item"><span className="pm-detail__label">Tồn kho hiện tại</span><span className="pm-detail__value">{item.Stock}</span></div>
            <div className="pm-detail__item"><span className="pm-detail__label">Mức tối thiểu</span><span className="pm-detail__value">{item.MinStock}</span></div>
          </div>
          <div className="pm-form__group" style={{ marginTop: '16px' }}>
            <label className="pm-form__label">Số lượng tồn kho mới *</label>
            <input className="pm-form__input" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} min="0" autoFocus />
          </div>
        </div>
        <div className="pm-modal__footer">
          <button className="pm-btn" onClick={onClose}>Hủy</button>
          <button className="pm-btn pm-btn--primary" onClick={() => onSave(item.ProductID, stock)}>Cập nhật</button>
        </div>
      </div>
    </div>
  )
}

export default InventoryManager
