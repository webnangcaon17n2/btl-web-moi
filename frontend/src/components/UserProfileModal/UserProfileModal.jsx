import { useState, useEffect } from 'react'
import { FiX, FiUser, FiPhone, FiMapPin, FiMail, FiSave, FiLoader, FiLock, FiCamera } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import './UserProfileModal.css'

const API = API_BASE

function UserProfileModal({ isOpen, onClose }) {
  const { currentUser, login } = useAuth()
  const [formData, setFormData] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    dia_chi: '',
    email: currentUser?.email || '',
    anh_dai_dien: currentUser?.anh_dai_dien || '',
    so_cccd: '',
    ngay_sinh: '',
    gioi_tinh: '',
    que_quan: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetchProfile()
    }
  }, [isOpen, currentUser])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/nguoi-dung/profile/${currentUser.id}`)
      const data = await res.json()
      if (res.ok) {
        setFormData({
          ho_ten: data.ho_ten || '',
          so_dien_thoai: data.so_dien_thoai || '',
          dia_chi: data.dia_chi || '',
          email: data.email || '',
          anh_dai_dien: data.anh_dai_dien || '',
          so_cccd: data.so_cccd || '',
          ngay_sinh: data.ngay_sinh ? data.ngay_sinh.substring(0, 10) : '',
          gioi_tinh: data.gioi_tinh || '',
          que_quan: data.que_quan || ''
        })
      }
    } catch (err) {
      console.error('Lỗi lấy hồ sơ:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setOcrLoading(true)
    setMessage({ type: '', text: '' })

    const ocrFormData = new FormData()
    ocrFormData.append('image', file)

    try {
      const response = await fetch(`${API}/ocr/cccd`, {
        method: 'POST',
        body: ocrFormData,
      })
      const data = await response.json()
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          ho_ten: data.data.ho_ten || prev.ho_ten,
          so_cccd: data.data.so_cccd || prev.so_cccd,
          ngay_sinh: data.data.ngay_sinh || prev.ngay_sinh,
          gioi_tinh: data.data.gioi_tinh || prev.gioi_tinh,
          que_quan: data.data.que_quan || prev.que_quan,
          dia_chi: data.data.dia_chi || prev.dia_chi
        }))
        setMessage({ type: 'success', text: 'Đã quét xong thông tin từ CCCD!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Không thể đọc được CCCD.' })
        setTimeout(() => setMessage({ type: '', text: '' }), 4000)
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối khi quét CCCD!' })
    } finally {
      setOcrLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      if (!currentUser?.id) throw new Error('Không tìm thấy ID người dùng')

      const res = await fetch(`${API}/nguoi-dung/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server không trả về JSON. Có thể đường dẫn bị sai (404).");
      }

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' })
        // Cập nhật lại context để Header/App nhận được tên mới
        if (login) login({ ...currentUser, ...formData })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi từ phía máy chủ' })
        setTimeout(() => setMessage({ type: '', text: '' }), 4000)
      }
    } catch (err) {
      console.error('Lỗi chi tiết:', err)
      setMessage({ type: 'error', text: `Lỗi kết nối: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal-container animate-fade-in">
        <div className="profile-modal-header">
          <div className="profile-modal-title">
            <FiUser className="title-icon" />
            <h2>Hồ sơ của tôi</h2>
          </div>
          <div className="profile-modal-actions">
            <label className={`btn-ocr ${ocrLoading ? 'loading' : ''}`}>
              <input type="file" accept="image/*" onChange={handleOcrUpload} disabled={ocrLoading} hidden />
              {ocrLoading ? <FiLoader className="spinner" /> : <FiCamera />}
              <span>{ocrLoading ? 'Đang quét...' : 'Quét CCCD'}</span>
            </label>
            <button className="profile-modal-close" onClick={onClose}>
              <FiX size={24} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="profile-modal-loading">
            <FiLoader className="spinner" />
            <p>Đang tải thông tin...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-modal-form">
            <div className="form-group">
              <label><FiMail /> Email</label>
              <input
                type="text"
                value={formData.email}
                readOnly
                className="input-readonly"
                title="Email không thể thay đổi"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><FiUser /> Họ và tên</label>
                <input
                  type="text"
                  value={formData.ho_ten}
                  onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                  placeholder="Nhập họ tên đầy đủ"
                  required
                />
              </div>
              <div className="form-group">
                <label><FiLock /> Số CCCD</label>
                <input
                  type="text"
                  value={formData.so_cccd}
                  onChange={(e) => setFormData({ ...formData, so_cccd: e.target.value })}
                  placeholder="Số căn cước"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><FiPhone /> Số điện thoại</label>
                <input
                  type="text"
                  value={formData.so_dien_thoai}
                  onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="form-group">
                <label>📅 Ngày sinh</label>
                <input
                  type="date"
                  value={formData.ngay_sinh}
                  onChange={(e) => setFormData({ ...formData, ngay_sinh: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>⚥ Giới tính</label>
                <select
                  value={formData.gioi_tinh}
                  onChange={(e) => setFormData({ ...formData, gioi_tinh: e.target.value })}
                >
                  <option value="">Chọn</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label><FiMapPin /> Quê quán (Nguyên quán)</label>
              <input
                type="text"
                value={formData.que_quan}
                onChange={(e) => setFormData({ ...formData, que_quan: e.target.value })}
                placeholder="Địa chỉ quê quán trên CCCD"
              />
            </div>

            <div className="form-group">
              <label><FiMapPin /> Địa chỉ nhận hàng (Nơi thường trú)</label>
              <textarea
                value={formData.dia_chi}
                onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                placeholder="Nhập địa chỉ chi tiết (Số nhà, đường, phường/xã...)"
                rows="2"
              ></textarea>
            </div>

            {message.text && (
              <div className={`form-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="profile-modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? <FiLoader className="spinner" /> : <FiSave />}
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default UserProfileModal
