import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FiSearch, FiPlus, FiTrash2, FiEdit2, FiEye, FiCopy,
  FiDownload, FiUpload, FiColumns, FiCheck, FiX,
  FiChevronLeft, FiChevronRight, FiPackage, FiAlertCircle,
  FiFileText, FiBarChart2, FiClipboard
} from 'react-icons/fi'
import { PiPlantFill } from 'react-icons/pi'
import { API_URL } from '../../config/api'
import './ProductManager.css'

/* ─── Sample Data ─── */
const PRODUCT_TYPES = ['Cây Trong Nhà', 'Cây Ngoài Trời', 'Sen Đá & Xương Rồng', 'Chăm Sóc Cây', 'Chậu & Bình Hoa', 'Hạt Giống & Củ']
const UNITS = ['Chậu', 'Cây', 'Bó', 'Set']
const API = API_URL

const generateId = () => 'SP' + String(Date.now()).slice(-6) + Math.random().toString(36).slice(-3).toUpperCase()

// Chuyển đổi dữ liệu từ DB sang format của ProductManager
const mapDbToProduct = (sp) => ({
  ProductID: sp.ma_sku || sp.id,
  ProductName: sp.ten_san_pham,
  PathImage: sp.anh_bia || '',
  ProductType: sp.category || 'Cây Trong Nhà',
  Quantity: sp.so_luong_kho || 0,
  Unit: sp.don_vi || 'Chậu',
  Price: sp.gia_ban || 0,
  Description: sp.mo_ta || '',
  CreateDate: sp.ngay_tao ? sp.ngay_tao.split('T')[0] : '',
  UpdateDate: sp.ngay_cap_nhat ? sp.ngay_cap_nhat.split('T')[0] : '',
  _dbId: sp.id,
})




/* ─── Column definitions ─── */
const ALL_COLUMNS = [
  { key: 'ProductID', label: 'Mã SP', defaultVisible: true },
  { key: 'PathImage', label: 'Ảnh', defaultVisible: true },
  { key: 'ProductName', label: 'Tên sản phẩm', defaultVisible: true },
  { key: 'ProductType', label: 'Loại', defaultVisible: true },
  { key: 'Quantity', label: 'Số lượng', defaultVisible: true },
  { key: 'Unit', label: 'Đơn vị', defaultVisible: true },
  { key: 'Price', label: 'Giá', defaultVisible: true },
  { key: 'Description', label: 'Mô tả', defaultVisible: false },
  { key: 'CreateDate', label: 'Ngày tạo', defaultVisible: false },
  { key: 'UpdateDate', label: 'Ngày cập nhật', defaultVisible: true },
]

/* ─── Helper: format currency ─── */
const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

/* ─── Helper: export functions ─── */
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportJSON(data) {
  downloadFile(JSON.stringify(data, null, 2), 'products.json', 'application/json')
}

function exportCSV(data) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      let val = row[h] ?? ''
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        val = '"' + val.replace(/"/g, '""') + '"'
      }
      return val
    }).join(','))
  ].join('\n')
  downloadFile('\uFEFF' + csv, 'products.csv', 'text/csv;charset=utf-8')
}

function exportXML(data) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Products>\n'
  data.forEach(p => {
    xml += '  <Product>\n'
    Object.entries(p).forEach(([k, v]) => {
      xml += `    <${k}>${v}</${k}>\n`
    })
    xml += '  </Product>\n'
  })
  xml += '</Products>'
  downloadFile(xml, 'products.xml', 'application/xml')
}

/* ─── Helper: import functions ─── */
function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const values = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes
      } else if (line[i] === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += line[i]
      }
    }
    values.push(current.trim())
    const obj = {}
    headers.forEach((h, i) => {
      let val = values[i] || ''
      if (h === 'Quantity' || h === 'Price') val = Number(val) || 0
      obj[h] = val
    })
    return obj
  })
}

function parseXML(text) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')
  const products = doc.querySelectorAll('Product')
  return Array.from(products).map(p => {
    const obj = {}
    ALL_COLUMNS.forEach(col => {
      const el = p.querySelector(col.key)
      let val = el ? el.textContent : ''
      if (col.key === 'Quantity' || col.key === 'Price') val = Number(val) || 0
      obj[col.key] = val
    })
    return obj
  })
}

/* ════════════════════════════════════════════
   PRODUCT MANAGER COMPONENT
   ════════════════════════════════════════════ */
function ProductManager() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState([])
  const [visibleColumns, setVisibleColumns] = useState(() =>
    ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key)
  )
  const [showColumnToggle, setShowColumnToggle] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [modal, setModal] = useState({ open: false, mode: 'add', product: null })
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  // Fetch từ API khi component mount
  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/san-pham?admin=1`)  // Lấy tất cả kể cả ẩn
      .then(r => r.json())
      .then(data => setProducts(data.map(mapDbToProduct)))
      .catch(() => showToast('Không thể kết nối API!', 'error'))
      .finally(() => setLoading(false))
  }, [])

  /* Toast helper */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])


  /* ── Filtered & Paginated Data ── */
  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.ProductID.toLowerCase().includes(q) ||
      p.ProductName.toLowerCase().includes(q) ||
      p.Description.toLowerCase().includes(q) ||
      p.ProductType.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filteredProducts.length / perPage)
  const startIdx = (currentPage - 1) * perPage
  const paginatedProducts = filteredProducts.slice(startIdx, startIdx + perPage)

  useEffect(() => { setCurrentPage(1) }, [searchQuery, perPage])

  /* ── Selection ── */
  const isAllSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.ProductID))

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !paginatedProducts.find(p => p.ProductID === id)))
    } else {
      const pageIds = paginatedProducts.map(p => p.ProductID)
      setSelectedIds(prev => [...new Set([...prev, ...pageIds])])
    }
  }

  /* ── CRUD ── */
  const handleAdd = () => {
    setModal({
      open: true,
      mode: 'add',
      product: {
        ProductID: generateId(),
        ProductName: '', PathImage: '', ProductType: PRODUCT_TYPES[0],
        Quantity: 0, Unit: UNITS[0], Price: 0, Description: '',
        CreateDate: new Date().toISOString().split('T')[0],
        UpdateDate: new Date().toISOString().split('T')[0],
      }
    })
  }

  const handleEdit = (product) => {
    setModal({ open: true, mode: 'edit', product: { ...product } })
  }

  const handleView = (product) => {
    setModal({ open: true, mode: 'view', product })
  }

  const CATEGORY_MAP = {
    'Cây Trong Nhà': 1,
    'Cây Ngoài Trời': 2,
    'Sen Đá & Xương Rồng': 3,
    'Chăm Sóc Cây': 4,
    'Chậu & Bình Hoa': 5,
    'Hạt Giống & Củ': 6
  };

  const handleSave = async (data) => {
    const body = {
      ten_san_pham: data.ProductName,
      ma_sku: data.ProductID,
      id_danh_muc: CATEGORY_MAP[data.ProductType] || 1,
      gia_ban: Number(data.Price),
      so_luong_kho: Number(data.Quantity),
      don_vi: data.Unit,
      mo_ta: data.Description,
      anh_bia: data.PathImage || null,   // URL ảnh → lưu vào AnhSanPham
      nhan_san_pham: null,
    }
    try {
      if (modal.mode === 'add') {
        const res = await fetch(`${API}/api/san-pham`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        showToast('Đã thêm sản phẩm mới!')
      } else {
        const res = await fetch(`${API}/api/san-pham/${data._dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...body,
            trang_thai: 'Đang bán',
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        showToast('Đã cập nhật sản phẩm!')
      }
      // Reload lại từ DB
      const fresh = await fetch(`${API}/api/san-pham?admin=1`).then(r => r.json())
      setProducts(fresh.map(mapDbToProduct))
    } catch (err) {
      showToast(err.message || 'Lỗi lưu sản phẩm!', 'error')
    }
    setModal({ open: false, mode: 'add', product: null })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return
    const product = products.find(p => p.ProductID === id)
    try {
      const res = await fetch(`${API}/api/san-pham/${product?._dbId || id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setProducts(prev => prev.filter(p => p.ProductID !== id))
      setSelectedIds(prev => prev.filter(x => x !== id))
      showToast('Đã xóa sản phẩm!')
    } catch {
      showToast('Lỗi xóa sản phẩm!', 'error')
    }
  }

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} sản phẩm đã chọn?`)) return
    try {
      const toDelete = products.filter(p => selectedIds.includes(p.ProductID))
      await Promise.all(toDelete.map(p =>
        fetch(`${API}/api/san-pham/${p._dbId}`, { method: 'DELETE' })
      ))
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.ProductID)))
      setSelectedIds([])
      showToast(`Đã xóa ${toDelete.length} sản phẩm!`)
    } catch {
      showToast('Lỗi xóa hàng loạt!', 'error')
    }
  }

  /* ── Copy ── */
  const handleCopy = (product) => {
    const copied = {
      ...product,
      ProductID: generateId(),
      ProductName: product.ProductName + ' (Bản sao)',
      CreateDate: new Date().toISOString().split('T')[0],
      UpdateDate: new Date().toISOString().split('T')[0],
    }
    setProducts(prev => [copied, ...prev])
    showToast('Đã sao chép sản phẩm!')
  }

  const handleCopySelected = () => {
    if (!selectedIds.length) return
    const copies = products
      .filter(p => selectedIds.includes(p.ProductID))
      .map(p => ({
        ...p,
        ProductID: generateId(),
        ProductName: p.ProductName + ' (Bản sao)',
        CreateDate: new Date().toISOString().split('T')[0],
        UpdateDate: new Date().toISOString().split('T')[0],
      }))
    setProducts(prev => [...copies, ...prev])
    setSelectedIds([])
    showToast(`Đã sao chép ${copies.length} sản phẩm!`)
  }

  /* ── Import ── */
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target.result
        let imported = []

        if (file.name.endsWith('.json')) {
          imported = JSON.parse(text)
        } else if (file.name.endsWith('.csv')) {
          imported = parseCSV(text)
        } else if (file.name.endsWith('.xml')) {
          imported = parseXML(text)
        } else {
          showToast('Định dạng file không hỗ trợ! Chỉ hỗ trợ JSON, CSV, XML.', 'error')
          return
        }

        if (!Array.isArray(imported) || !imported.length) {
          showToast('File không chứa dữ liệu hợp lệ!', 'error')
          return
        }

        const withIds = imported.map(p => ({
          ...p,
          ProductID: p.ProductID || generateId(),
          Quantity: Number(p.Quantity) || 0,
          Price: Number(p.Price) || 0,
        }))

        setProducts(prev => [...withIds, ...prev])
        showToast(`Đã import ${withIds.length} sản phẩm!`)
      } catch {
        showToast('Lỗi đọc file! Kiểm tra định dạng dữ liệu.', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  /* ── Column Toggle ── */
  const toggleColumn = (key) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  /* ── Keyboard Shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault()
            handleAdd()
            break
          case 's':
            e.preventDefault()
            if (modal.open && modal.mode !== 'view') {
              document.getElementById('pm-form-submit')?.click()
            }
            break
          case 'h':
            e.preventDefault()
            setModal({ open: false, mode: 'add', product: null })
            break
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modal.open, modal.mode])

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.pm-dropdown')) {
        setShowColumnToggle(false)
        setShowExportMenu(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  /* ── Render cell value ── */
  const renderCell = (product, colKey) => {
    switch (colKey) {
      case 'PathImage':
        return product.PathImage ? (
          <img src={product.PathImage} alt="" className="pm-table__img" />
        ) : <div className="pm-table__img" />
      case 'ProductName':
        return <span className="pm-table__product-name">{product.ProductName}</span>
      case 'ProductType':
        return <span className="pm-table__type-badge">{product.ProductType}</span>
      case 'Price':
        return formatPrice(product.Price)
      case 'Quantity':
        return product.Quantity.toLocaleString('vi-VN')
      default:
        return product[colKey]
    }
  }

  /* ─── Pagination helper ─── */
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="pm">
      {/* Page Header */}
      <div className="pm-page-header">
        <div className="pm-page-header__left">
          <h1>Quản lý sản phẩm</h1>
          <p>Quản lý danh sách sản phẩm cây cảnh của cửa hàng</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{products.length}</div>
            <div className="pm-stat-card__label">Tổng sản phẩm</div>
          </div>
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{new Set(products.map(p => p.ProductType)).size}</div>
            <div className="pm-stat-card__label">Loại sản phẩm</div>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="pm-selection-bar">
          <span className="pm-selection-bar__count">
            <FiCheck size={14} /> Đã chọn {selectedIds.length} sản phẩm
          </span>
          <div className="pm-selection-bar__actions">
            <button className="pm-btn pm-btn--small" onClick={handleCopySelected}>
              <FiCopy size={14} /> Sao chép
            </button>
            <button className="pm-btn pm-btn--small pm-btn--danger" onClick={handleDeleteSelected}>
              <FiTrash2 size={14} /> Xóa
            </button>
            <button className="pm-btn pm-btn--small" onClick={() => setSelectedIds([])}>
              <FiX size={14} /> Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="pm-toolbar">
        <div className="pm-toolbar__left">
          <div className="pm-search">
            <FiSearch className="pm-search__icon" size={16} />
            <input
              type="text"
              className="pm-search__input"
              placeholder="Tìm kiếm theo tên, mã, mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="pm-search-input"
            />
          </div>
        </div>

        <div className="pm-toolbar__right">
          {/* Add */}
          <button className="pm-btn pm-btn--primary" onClick={handleAdd} id="pm-btn-add">
            <FiPlus size={16} /> Thêm mới
            <span className="pm-btn__kbd">Alt+N</span>
          </button>

          {/* Import */}
          <button className="pm-btn" onClick={handleImport} id="pm-btn-import">
            <FiUpload size={15} /> Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json,.csv,.xml"
            onChange={handleFileChange}
          />

          {/* Export */}
          <div className="pm-dropdown">
            <button
              className="pm-btn"
              onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); setShowColumnToggle(false) }}
              id="pm-btn-export"
            >
              <FiDownload size={15} /> Export
            </button>
            {showExportMenu && (
              <div className="pm-dropdown__menu">
                <button className="pm-dropdown__item" onClick={() => { exportJSON(filteredProducts); setShowExportMenu(false); showToast('Đã export JSON!') }}>
                  <FiFileText size={14} /> Export JSON
                </button>
                <button className="pm-dropdown__item" onClick={() => { exportCSV(filteredProducts); setShowExportMenu(false); showToast('Đã export CSV!') }}>
                  <FiBarChart2 size={14} /> Export CSV (Excel)
                </button>
                <button className="pm-dropdown__item" onClick={() => { exportXML(filteredProducts); setShowExportMenu(false); showToast('Đã export XML!') }}>
                  <FiClipboard size={14} /> Export XML
                </button>
              </div>
            )}
          </div>

          {/* Column toggle */}
          <div className="pm-dropdown">
            <button
              className="pm-btn"
              onClick={(e) => { e.stopPropagation(); setShowColumnToggle(!showColumnToggle); setShowExportMenu(false) }}
              id="pm-btn-columns"
            >
              <FiColumns size={15} /> Cột
            </button>
            {showColumnToggle && (
              <div className="pm-col-toggle" onClick={(e) => e.stopPropagation()}>
                <div className="pm-col-toggle__title">Hiển thị cột</div>
                {ALL_COLUMNS.map(col => (
                  <div
                    key={col.key}
                    className="pm-col-toggle__item"
                    onClick={() => toggleColumn(col.key)}
                  >
                    <div className={`pm-col-toggle__checkbox ${visibleColumns.includes(col.key) ? 'pm-col-toggle__checkbox--checked' : ''}`}>
                      {visibleColumns.includes(col.key) && <FiCheck size={12} />}
                    </div>
                    <span className="pm-col-toggle__label">{col.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="pm-table-wrap">
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <div className={`pm-checkbox ${isAllSelected ? 'pm-checkbox--checked' : ''}`} onClick={toggleSelectAll}>
                    {isAllSelected && <FiCheck size={12} />}
                  </div>
                </th>
                {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th style={{ width: '140px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2}>
                    <div className="pm-empty">
                      <FiPackage className="pm-empty__icon" size={48} />
                      <div className="pm-empty__title">Không tìm thấy sản phẩm</div>
                      <div className="pm-empty__text">
                        {searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Bắt đầu thêm sản phẩm mới'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(product => (
                  <tr
                    key={product.ProductID}
                    className={selectedIds.includes(product.ProductID) ? 'pm-table__row--selected' : ''}
                  >
                    <td>
                      <div
                        className={`pm-checkbox ${selectedIds.includes(product.ProductID) ? 'pm-checkbox--checked' : ''}`}
                        onClick={() => toggleSelect(product.ProductID)}
                      >
                        {selectedIds.includes(product.ProductID) && <FiCheck size={12} />}
                      </div>
                    </td>
                    {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                      <td key={col.key}>{renderCell(product, col.key)}</td>
                    ))}
                    <td>
                      <div className="pm-table__actions">
                        <button className="pm-table__action-btn" title="Xem chi tiết" onClick={() => handleView(product)}>
                          <FiEye size={15} />
                        </button>
                        <button className="pm-table__action-btn" title="Sửa" onClick={() => handleEdit(product)}>
                          <FiEdit2 size={15} />
                        </button>
                        <button className="pm-table__action-btn" title="Sao chép" onClick={() => handleCopy(product)}>
                          <FiCopy size={15} />
                        </button>
                        <button className="pm-table__action-btn pm-table__action-btn--danger" title="Xóa" onClick={() => handleDelete(product.ProductID)}>
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="pm-pagination">
            <div className="pm-pagination__info">
              Hiển thị <strong>{startIdx + 1}-{Math.min(startIdx + perPage, filteredProducts.length)}</strong> / <strong>{filteredProducts.length}</strong> sản phẩm
            </div>

            <div className="pm-pagination__controls">
              <button
                className="pm-pagination__btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <FiChevronLeft size={16} />
              </button>
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  className={`pm-pagination__btn ${currentPage === page ? 'pm-pagination__btn--active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pm-pagination__btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <FiChevronRight size={16} />
              </button>
            </div>

            <div className="pm-pagination__per-page">
              <label>Hiển thị</label>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}

        {/* Shortcuts hint */}
        <div className="pm-shortcuts">
          <div className="pm-shortcuts__item">
            <span className="pm-shortcuts__key">Alt+N</span> Thêm mới
          </div>
          <div className="pm-shortcuts__item">
            <span className="pm-shortcuts__key">Alt+S</span> Lưu
          </div>
          <div className="pm-shortcuts__item">
            <span className="pm-shortcuts__key">Alt+H</span> Đóng modal
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {modal.open && (
        <div className="pm-modal-overlay" onClick={() => setModal({ open: false, mode: 'add', product: null })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title">
                {modal.mode === 'add' && <><PiPlantFill size={18} /> Thêm sản phẩm mới</>}
                {modal.mode === 'edit' && <><FiEdit2 size={18} /> Chỉnh sửa sản phẩm</>}
                {modal.mode === 'view' && <><FiEye size={18} /> Chi tiết sản phẩm</>}
              </h2>
              <button className="pm-modal__close" onClick={() => setModal({ open: false, mode: 'add', product: null })}>
                <FiX size={18} />
              </button>
            </div>

            {modal.mode === 'view' ? (
              <div className="pm-modal__body">
                <ViewProduct product={modal.product} />
              </div>
            ) : (
              <ProductForm
                product={modal.product}
                onSave={handleSave}
                onCancel={() => setModal({ open: false, mode: 'add', product: null })}
                mode={modal.mode}
              />
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`pm-toast pm-toast--${toast.type}`}>
          {toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   VIEW PRODUCT (Detail)
   ════════════════════════════════════════════ */
function ViewProduct({ product }) {
  return (
    <div className="pm-detail">
      <div className="pm-detail__item">
        <span className="pm-detail__label">Mã sản phẩm</span>
        <span className="pm-detail__value">{product.ProductID}</span>
      </div>
      <div className="pm-detail__item">
        <span className="pm-detail__label">Tên sản phẩm</span>
        <span className="pm-detail__value">{product.ProductName}</span>
      </div>
      <div className="pm-detail__item">
        <span className="pm-detail__label">Loại sản phẩm</span>
        <span className="pm-detail__value">{product.ProductType}</span>
      </div>
      <div className="pm-detail__item">
        <span className="pm-detail__label">Đơn giá</span>
        <span className="pm-detail__value">{formatPrice(product.Price)}</span>
      </div>
      <div className="pm-detail__item">
        <span className="pm-detail__label">Số lượng</span>
        <span className="pm-detail__value">{product.Quantity} {product.Unit}</span>
      </div>
      <div className="pm-detail__item">
        <span className="pm-detail__label">Đơn vị</span>
        <span className="pm-detail__value">{product.Unit}</span>
      </div>
      {product.PathImage && (
        <div className="pm-detail__item pm-detail--full">
          <span className="pm-detail__label">Ảnh sản phẩm</span>
          <img src={product.PathImage} alt="" className="pm-detail__img" />
        </div>
      )}
      <div className="pm-detail__item pm-detail--full">
        <span className="pm-detail__label">Mô tả</span>
        <span className="pm-detail__value">{product.Description || '—'}</span>
      </div>
      <div className="pm-detail__item">
        <span className="pm-detail__label">Ngày tạo</span>
        <span className="pm-detail__value">{product.CreateDate}</span>
      </div>
      <div className="pm-detail__item">
        <span className="pm-detail__label">Ngày cập nhật</span>
        <span className="pm-detail__value">{product.UpdateDate}</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   PRODUCT FORM (Add/Edit)
   ════════════════════════════════════════════ */
function ProductForm({ product, onSave, onCancel, mode }) {
  const [form, setForm] = useState({ ...product })

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.ProductName.trim()) {
      alert('Vui lòng nhập tên sản phẩm!')
      return
    }
    onSave({
      ...form,
      Quantity: Number(form.Quantity) || 0,
      Price: Number(form.Price) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="pm-modal__body">
        <div className="pm-form-grid">
          {/* ProductID */}
          <div className="pm-form__group">
            <label className="pm-form__label">Mã sản phẩm</label>
            <input
              type="text"
              className="pm-form__input"
              value={form.ProductID}
              readOnly
            />
          </div>

          {/* ProductName */}
          <div className="pm-form__group">
            <label className="pm-form__label">Tên sản phẩm *</label>
            <input
              type="text"
              className="pm-form__input"
              value={form.ProductName}
              onChange={(e) => handleChange('ProductName', e.target.value)}
              placeholder="Nhập tên sản phẩm"
              required
              autoFocus
            />
          </div>

          {/* ProductType */}
          <div className="pm-form__group">
            <label className="pm-form__label">Loại sản phẩm</label>
            <select
              className="pm-form__select"
              value={form.ProductType}
              onChange={(e) => handleChange('ProductType', e.target.value)}
            >
              {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Price */}
          <div className="pm-form__group">
            <label className="pm-form__label">Giá (VNĐ)</label>
            <input
              type="number"
              className="pm-form__input"
              value={form.Price}
              onChange={(e) => handleChange('Price', e.target.value)}
              min="0"
            />
          </div>

          {/* Quantity */}
          <div className="pm-form__group">
            <label className="pm-form__label">Số lượng</label>
            <input
              type="number"
              className="pm-form__input"
              value={form.Quantity}
              onChange={(e) => handleChange('Quantity', e.target.value)}
              min="0"
            />
          </div>

          {/* Unit */}
          <div className="pm-form__group">
            <label className="pm-form__label">Đơn vị</label>
            <select
              className="pm-form__select"
              value={form.Unit}
              onChange={(e) => handleChange('Unit', e.target.value)}
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* PathImage */}
          <div className="pm-form__group pm-form-grid--full">
            <label className="pm-form__label">Đường dẫn ảnh</label>
            <input
              type="text"
              className="pm-form__input"
              value={form.PathImage}
              onChange={(e) => handleChange('PathImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Description */}
          <div className="pm-form__group pm-form-grid--full">
            <label className="pm-form__label">Mô tả</label>
            <textarea
              className="pm-form__textarea"
              value={form.Description}
              onChange={(e) => handleChange('Description', e.target.value)}
              placeholder="Nhập mô tả sản phẩm..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="pm-modal__footer">
        <button type="button" className="pm-btn" onClick={onCancel}>
          Hủy <span className="pm-btn__kbd">Alt+H</span>
        </button>
        <button type="submit" className="pm-btn pm-btn--primary" id="pm-form-submit">
          {mode === 'add' ? 'Thêm sản phẩm' : 'Lưu thay đổi'}
          <span className="pm-btn__kbd">Alt+S</span>
        </button>
      </div>
    </form>
  )
}

export default ProductManager
