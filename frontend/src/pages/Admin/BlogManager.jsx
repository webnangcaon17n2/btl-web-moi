import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FiSearch, FiPlus, FiTrash2, FiEdit2, FiEye, FiCopy,
  FiDownload, FiUpload, FiCheck, FiX,
  FiChevronLeft, FiChevronRight, FiFileText, FiAlertCircle
} from 'react-icons/fi'
import { API_URL } from '../../config/api'
import '../Admin/ProductManager.css'

const CATEGORIES = ['Plant Care', 'Indoor Garden', 'Succulents', 'Plant Tips', 'Outdoor', 'DIY', 'News']
const API = API_URL

const generateId = () => 'BL' + String(Date.now()).slice(-6) + Math.random().toString(36).slice(-3).toUpperCase()

function BlogManager() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', blog: null })
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/bai-viet/all`)
      .then(r => r.json())
      .then(data => setBlogs(data.map(b => ({
        BlogID: b.ma_bai_viet,
        Title: b.tieu_de,
        Category: b.danh_muc || 'Plant Care',
        Author: b.tac_gia || '',
        Excerpt: b.tom_tat || '',
        Content: b.noi_dung || '',
        ImageURL: b.anh_bia || '',
        Status: b.trang_thai === 'Đã xuất bản' ? 'Published' : 'Draft',
        CreateDate: b.ngay_tao ? b.ngay_tao.split('T')[0] : '',
        UpdateDate: b.ngay_cap_nhat ? b.ngay_cap_nhat.split('T')[0] : '',
        _dbId: b.id,
      }))))
      .catch(() => showToast('Không thể tải bài viết!', 'error'))
      .finally(() => setLoading(false))
  }, [])


  const filteredBlogs = blogs.filter(b => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return b.BlogID.toLowerCase().includes(q) || b.Title.toLowerCase().includes(q) ||
      b.Author.toLowerCase().includes(q) || b.Category.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filteredBlogs.length / perPage)
  const startIdx = (currentPage - 1) * perPage
  const paginatedBlogs = filteredBlogs.slice(startIdx, startIdx + perPage)

  useEffect(() => { setCurrentPage(1) }, [searchQuery, perPage])

  const isAllSelected = paginatedBlogs.length > 0 && paginatedBlogs.every(b => selectedIds.includes(b.BlogID))

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedIds(prev => prev.filter(id => !paginatedBlogs.find(b => b.BlogID === id)))
    else setSelectedIds(prev => [...new Set([...prev, ...paginatedBlogs.map(b => b.BlogID)])])
  }

  const handleAdd = () => {
    setModal({
      open: true, mode: 'add',
      blog: { BlogID: generateId(), Title: '', Category: CATEGORIES[0], Author: '', Excerpt: '', Content: '', ImageURL: '', Status: 'Draft', CreateDate: new Date().toISOString().split('T')[0], UpdateDate: new Date().toISOString().split('T')[0] }
    })
  }

  const handleEdit = (blog) => setModal({ open: true, mode: 'edit', blog: { ...blog } })
  const handleView = (blog) => setModal({ open: true, mode: 'view', blog })

  const handleSave = (data) => {
    if (modal.mode === 'add') {
      setBlogs(prev => [{ ...data, UpdateDate: new Date().toISOString().split('T')[0] }, ...prev])
      showToast('Đã thêm bài viết mới!')
    } else {
      setBlogs(prev => prev.map(b => b.BlogID === data.BlogID ? { ...data, UpdateDate: new Date().toISOString().split('T')[0] } : b))
      showToast('Đã cập nhật bài viết!')
    }
    setModal({ open: false, mode: 'add', blog: null })
  }

  const handleDelete = (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return
    setBlogs(prev => prev.filter(b => b.BlogID !== id))
    setSelectedIds(prev => prev.filter(x => x !== id))
    showToast('Đã xóa bài viết!')
  }

  const handleDeleteSelected = () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Xóa ${selectedIds.length} bài viết đã chọn?`)) return
    setBlogs(prev => prev.filter(b => !selectedIds.includes(b.BlogID)))
    setSelectedIds([])
    showToast(`Đã xóa ${selectedIds.length} bài viết!`)
  }

  const handleCopy = (blog) => {
    setBlogs(prev => [{ ...blog, BlogID: generateId(), Title: blog.Title + ' (Bản sao)', CreateDate: new Date().toISOString().split('T')[0], UpdateDate: new Date().toISOString().split('T')[0] }, ...prev])
    showToast('Đã sao chép bài viết!')
  }

  const getPageNumbers = () => {
    const pages = []
    const max = 5
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
          <h1>Quản lý bài viết</h1>
          <p>Quản lý nội dung blog của cửa hàng</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{blogs.length}</div>
            <div className="pm-stat-card__label">Tổng bài viết</div>
          </div>
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{blogs.filter(b => b.Status === 'Published').length}</div>
            <div className="pm-stat-card__label">Đã xuất bản</div>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="pm-selection-bar">
          <span className="pm-selection-bar__count"><FiCheck size={14} /> Đã chọn {selectedIds.length} bài viết</span>
          <div className="pm-selection-bar__actions">
            <button className="pm-btn pm-btn--small pm-btn--danger" onClick={handleDeleteSelected}><FiTrash2 size={14} /> Xóa</button>
            <button className="pm-btn pm-btn--small" onClick={() => setSelectedIds([])}><FiX size={14} /> Bỏ chọn</button>
          </div>
        </div>
      )}

      <div className="pm-toolbar">
        <div className="pm-toolbar__left">
          <div className="pm-search">
            <FiSearch className="pm-search__icon" size={16} />
            <input type="text" className="pm-search__input" placeholder="Tìm kiếm bài viết..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="pm-toolbar__right">
          <button className="pm-btn pm-btn--primary" onClick={handleAdd}><FiPlus size={16} /> Thêm bài viết</button>
        </div>
      </div>

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
                <th>Mã</th>
                <th>Ảnh</th>
                <th>Tiêu đề</th>
                <th>Danh mục</th>
                <th>Tác giả</th>
                <th>Trạng thái</th>
                <th>Ngày cập nhật</th>
                <th style={{ width: '120px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBlogs.length === 0 ? (
                <tr><td colSpan={9}>
                  <div className="pm-empty">
                    <FiFileText className="pm-empty__icon" size={48} />
                    <div className="pm-empty__title">Không tìm thấy bài viết</div>
                    <div className="pm-empty__text">{searchQuery ? 'Thử từ khóa khác' : 'Thêm bài viết mới'}</div>
                  </div>
                </td></tr>
              ) : paginatedBlogs.map(blog => (
                <tr key={blog.BlogID} className={selectedIds.includes(blog.BlogID) ? 'pm-table__row--selected' : ''}>
                  <td>
                    <div className={`pm-checkbox ${selectedIds.includes(blog.BlogID) ? 'pm-checkbox--checked' : ''}`} onClick={() => toggleSelect(blog.BlogID)}>
                      {selectedIds.includes(blog.BlogID) && <FiCheck size={12} />}
                    </div>
                  </td>
                  <td>{blog.BlogID}</td>
                  <td>{blog.ImageURL ? <img src={blog.ImageURL} alt="" className="pm-table__img" /> : <div className="pm-table__img" />}</td>
                  <td><span className="pm-table__product-name">{blog.Title}</span></td>
                  <td><span className="pm-table__type-badge">{blog.Category}</span></td>
                  <td>{blog.Author}</td>
                  <td>
                    <span className="pm-table__type-badge" style={blog.Status === 'Published' ? { background: '#e8f5e9', color: '#4caf50' } : { background: '#fff3e0', color: '#e65100' }}>
                      {blog.Status === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td>{blog.UpdateDate}</td>
                  <td>
                    <div className="pm-table__actions">
                      <button className="pm-table__action-btn" title="Xem" onClick={() => handleView(blog)}><FiEye size={15} /></button>
                      <button className="pm-table__action-btn" title="Sửa" onClick={() => handleEdit(blog)}><FiEdit2 size={15} /></button>
                      <button className="pm-table__action-btn" title="Sao chép" onClick={() => handleCopy(blog)}><FiCopy size={15} /></button>
                      <button className="pm-table__action-btn pm-table__action-btn--danger" title="Xóa" onClick={() => handleDelete(blog.BlogID)}><FiTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBlogs.length > 0 && (
          <div className="pm-pagination">
            <div className="pm-pagination__info">Hiển thị <strong>{startIdx + 1}-{Math.min(startIdx + perPage, filteredBlogs.length)}</strong> / <strong>{filteredBlogs.length}</strong></div>
            <div className="pm-pagination__controls">
              <button className="pm-pagination__btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FiChevronLeft size={16} /></button>
              {getPageNumbers().map(page => (
                <button key={page} className={`pm-pagination__btn ${currentPage === page ? 'pm-pagination__btn--active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
              ))}
              <button className="pm-pagination__btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FiChevronRight size={16} /></button>
            </div>
            <div className="pm-pagination__per-page">
              <label>Hiển thị</label>
              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                <option value={10}>10</option><option value={15}>15</option><option value={20}>20</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {modal.open && (
        <div className="pm-modal-overlay" onClick={() => setModal({ open: false, mode: 'add', blog: null })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title">
                {modal.mode === 'add' && <><FiFileText size={18} /> Thêm bài viết mới</>}
                {modal.mode === 'edit' && <><FiEdit2 size={18} /> Chỉnh sửa bài viết</>}
                {modal.mode === 'view' && <><FiEye size={18} /> Chi tiết bài viết</>}
              </h2>
              <button className="pm-modal__close" onClick={() => setModal({ open: false, mode: 'add', blog: null })}><FiX size={18} /></button>
            </div>
            {modal.mode === 'view' ? (
              <div className="pm-modal__body">
                <div className="pm-detail">
                  <div className="pm-detail__item"><span className="pm-detail__label">Mã bài viết</span><span className="pm-detail__value">{modal.blog.BlogID}</span></div>
                  <div className="pm-detail__item"><span className="pm-detail__label">Trạng thái</span><span className="pm-detail__value">{modal.blog.Status === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}</span></div>
                  <div className="pm-detail__item pm-detail--full"><span className="pm-detail__label">Tiêu đề</span><span className="pm-detail__value">{modal.blog.Title}</span></div>
                  <div className="pm-detail__item"><span className="pm-detail__label">Danh mục</span><span className="pm-detail__value">{modal.blog.Category}</span></div>
                  <div className="pm-detail__item"><span className="pm-detail__label">Tác giả</span><span className="pm-detail__value">{modal.blog.Author}</span></div>
                  {modal.blog.ImageURL && <div className="pm-detail__item pm-detail--full"><span className="pm-detail__label">Ảnh</span><img src={modal.blog.ImageURL} alt="" className="pm-detail__img" /></div>}
                  <div className="pm-detail__item pm-detail--full"><span className="pm-detail__label">Tóm tắt</span><span className="pm-detail__value">{modal.blog.Excerpt}</span></div>
                  <div className="pm-detail__item"><span className="pm-detail__label">Ngày tạo</span><span className="pm-detail__value">{modal.blog.CreateDate}</span></div>
                  <div className="pm-detail__item"><span className="pm-detail__label">Ngày cập nhật</span><span className="pm-detail__value">{modal.blog.UpdateDate}</span></div>
                </div>
              </div>
            ) : (
              <BlogForm blog={modal.blog} onSave={handleSave} onCancel={() => setModal({ open: false, mode: 'add', blog: null })} mode={modal.mode} />
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`pm-toast pm-toast--${toast.type}`}>
          {toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  )
}

function BlogForm({ blog, onSave, onCancel, mode }) {
  const [form, setForm] = useState({ ...blog })
  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.Title.trim()) { alert('Vui lòng nhập tiêu đề!'); return }
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="pm-modal__body">
        <div className="pm-form-grid">
          <div className="pm-form__group"><label className="pm-form__label">Mã bài viết</label><input className="pm-form__input" value={form.BlogID} readOnly /></div>
          <div className="pm-form__group"><label className="pm-form__label">Trạng thái</label>
            <select className="pm-form__select" value={form.Status} onChange={(e) => handleChange('Status', e.target.value)}>
              <option value="Draft">Bản nháp</option><option value="Published">Xuất bản</option>
            </select>
          </div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Tiêu đề *</label><input className="pm-form__input" value={form.Title} onChange={(e) => handleChange('Title', e.target.value)} placeholder="Nhập tiêu đề bài viết" required autoFocus /></div>
          <div className="pm-form__group"><label className="pm-form__label">Danh mục</label>
            <select className="pm-form__select" value={form.Category} onChange={(e) => handleChange('Category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="pm-form__group"><label className="pm-form__label">Tác giả</label><input className="pm-form__input" value={form.Author} onChange={(e) => handleChange('Author', e.target.value)} placeholder="Tên tác giả" /></div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Ảnh bìa (URL)</label><input className="pm-form__input" value={form.ImageURL} onChange={(e) => handleChange('ImageURL', e.target.value)} placeholder="https://..." /></div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Tóm tắt</label><textarea className="pm-form__textarea" value={form.Excerpt} onChange={(e) => handleChange('Excerpt', e.target.value)} placeholder="Tóm tắt ngắn gọn..." rows={2} /></div>
          <div className="pm-form__group pm-form-grid--full"><label className="pm-form__label">Nội dung</label><textarea className="pm-form__textarea" value={form.Content} onChange={(e) => handleChange('Content', e.target.value)} placeholder="Nội dung bài viết..." rows={5} /></div>
        </div>
      </div>
      <div className="pm-modal__footer">
        <button type="button" className="pm-btn" onClick={onCancel}>Hủy</button>
        <button type="submit" className="pm-btn pm-btn--primary">{mode === 'add' ? 'Thêm bài viết' : 'Lưu thay đổi'}</button>
      </div>
    </form>
  )
}

export default BlogManager
