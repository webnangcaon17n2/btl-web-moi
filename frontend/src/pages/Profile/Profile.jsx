import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiUser, FiPhone, FiMapPin, FiMail, FiSave, FiLoader, 
  FiLock, FiCamera, FiChevronLeft, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import './Profile.css'

const API = API_BASE

function Profile() {
  const { currentUser, login } = useAuth()
  const navigate = useNavigate()
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
    if (currentUser?.id) {
      fetchProfile()
    } else {
      navigate('/login')
    }
  }, [currentUser])

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

        // Tự động phân tách địa chỉ cũ để đưa vào các ô nhập
        if (data.que_quan) {
          const parts = data.que_quan.split(', ')
          if (parts.length >= 4) {
            setAddrQue({ chi_tiet: parts[0], xa: parts[1], huyen: parts[2], tinh: parts[3] })
          } else {
            setAddrQue(prev => ({ ...prev, chi_tiet: data.que_quan }))
          }
        }
        if (data.dia_chi) {
          const parts = data.dia_chi.split(', ')
          if (parts.length >= 4) {
            setAddrNhan({ chi_tiet: parts[0], xa: parts[1], huyen: parts[2], tinh: parts[3] })
          } else {
            setAddrNhan(prev => ({ ...prev, chi_tiet: data.dia_chi }))
          }
        }
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

        // Tự động phân tách địa chỉ quét được từ CCCD vào các ô nhập (Linh hoạt 3 hoặc 4 cấp)
        if (data.data.que_quan) {
          const parts = data.data.que_quan.split(', ').map(p => p.trim())
          if (parts.length >= 4) {
            // Trường hợp có cả Số nhà/Đường
            setAddrQue({ chi_tiet: parts[0], xa: parts[1], huyen: parts[2], tinh: parts[3] })
          } else if (parts.length === 3) {
            // Trường hợp chỉ có Xã, Huyện, Tỉnh
            setAddrQue({ chi_tiet: '', xa: parts[0], huyen: parts[1], tinh: parts[2] })
          } else {
            // Các trường hợp khác dồn vào ô chi tiết
            setAddrQue(prev => ({ ...prev, chi_tiet: data.data.que_quan }))
          }
        }

        setMessage({ type: 'success', text: 'Đã quét xong và tự động điền thông tin!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Không thể đọc được CCCD.' })
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

    // Ghép địa chỉ từ các ô nhập riêng lẻ thành chuỗi hoàn chỉnh
    const fullQue = addrQue.tinh ? `${addrQue.chi_tiet}, ${addrQue.xa}, ${addrQue.huyen}, ${addrQue.tinh}` : addrQue.chi_tiet;
    const fullNhan = addrNhan.tinh ? `${addrNhan.chi_tiet}, ${addrNhan.xa}, ${addrNhan.huyen}, ${addrNhan.tinh}` : addrNhan.chi_tiet;

    const dataToSave = {
      ...formData,
      que_quan: fullQue,
      dia_chi: fullNhan
    }

    try {
      const res = await fetch(`${API}/nguoi-dung/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' })
        if (login) login({ ...currentUser, ...formData })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        const errData = await res.json().catch(() => ({}))
        setMessage({ type: 'error', text: errData.error || 'Lỗi từ phía máy chủ' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Lỗi kết nối: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState({ que: [], nhan: [] })
  const [wards, setWards] = useState({ que: [], nhan: [] })

  const [addrQue, setAddrQue] = useState({ chi_tiet: '', xa: '', huyen: '', tinh: '' })
  const [addrNhan, setAddrNhan] = useState({ chi_tiet: '', xa: '', huyen: '', tinh: '' })

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
  }, [])

  const handleProvinceChange = (val, type) => {
    const province = provinces.find(p => p.name === val)
    if (type === 'que') setAddrQue(prev => ({ ...prev, tinh: val, huyen: '', xa: '' }))
    else setAddrNhan(prev => ({ ...prev, tinh: val, huyen: '', xa: '' }))

    if (province) {
      fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`)
        .then(res => res.json())
        .then(data => setDistricts(prev => ({ ...prev, [type]: data.districts })))
    }
  }

  const handleDistrictChange = (val, type) => {
    const distList = districts[type]
    const district = distList.find(d => d.name === val)
    if (type === 'que') setAddrQue(prev => ({ ...prev, huyen: val, xa: '' }))
    else setAddrNhan(prev => ({ ...prev, huyen: val, xa: '' }))

    if (district) {
      fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`)
        .then(res => res.json())
        .then(data => setWards(prev => ({ ...prev, [type]: data.wards })))
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Đọc file ảnh dưới dạng Base64 để hiển thị trước (Preview)
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, anh_dai_dien: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  if (loading) return (
    <div className="profile-loading-screen">
      <FiLoader className="spinner" />
      <p>Đang tải hồ sơ của bạn...</p>
    </div>
  )

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header-v3">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiChevronLeft /> Quay lại
          </button>
          <div className="header-content">
            <h1>Hồ sơ cá nhân</h1>
            <p>Quản lý thông tin và xác thực tài khoản</p>
          </div>
          <label className={`ocr-btn-v3 ${ocrLoading ? 'loading' : ''}`}>
            <input type="file" accept="image/*" onChange={handleOcrUpload} hidden />
            {ocrLoading ? <FiLoader className="spinner" /> : <FiCamera />}
            <span>{ocrLoading ? 'Đang quét...' : 'Quét CCCD'}</span>
          </label>
        </header>

        <div className="profile-content-grid">
          {/* Cột trái: Avatar & Tổng quan */}
          <aside className="profile-sidebar-v3">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img src={formData.anh_dai_dien || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces"} alt="Avatar" />
                <label className="change-avatar-btn">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                  <FiCamera />
                </label>
              </div>
              <h3>{formData.ho_ten || 'Người dùng Aether'}</h3>
              <p>{formData.email}</p>
            </div>
            
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Thành viên từ</span>
                <span className="stat-value">2026</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Trạng thái</span>
                <span className="stat-value status-verified">Đã xác minh</span>
              </div>
            </div>
          </aside>

          {/* Cột phải: Form thông tin */}
          <main className="profile-main-v3">
            <form onSubmit={handleSubmit} className="profile-form-v3">
              <div className="form-section">
                <h4 className="section-title">Thông tin cơ bản</h4>
                <div className="form-grid">
                  <div className="form-input-v3">
                    <label><FiUser /> Họ và tên</label>
                    <input 
                      type="text" 
                      value={formData.ho_ten} 
                      onChange={e => setFormData({...formData, ho_ten: e.target.value})} 
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="form-input-v3">
                    <label><FiLock /> Số CCCD</label>
                    <input 
                      type="text" 
                      value={formData.so_cccd} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setFormData({...formData, so_cccd: val})
                      }} 
                      placeholder="12 chữ số"
                    />
                  </div>
                  <div className="form-input-v3">
                    <label><FiPhone /> Số điện thoại</label>
                    <input 
                      type="text" 
                      value={formData.so_dien_thoai} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        let formatted = val;
                        if (val.length > 4 && val.length <= 7) {
                          formatted = `${val.slice(0, 4)} ${val.slice(4)}`;
                        } else if (val.length > 7) {
                          formatted = `${val.slice(0, 4)} ${val.slice(4, 7)} ${val.slice(7)}`;
                        }
                        setFormData({...formData, so_dien_thoai: formatted})
                      }} 
                      placeholder="09xx xxx xxx"
                    />
                  </div>
                  <div className="form-input-v3">
                    <label>📅 Ngày sinh</label>
                    <input 
                      type="date" 
                      value={formData.ngay_sinh} 
                      onChange={e => setFormData({...formData, ngay_sinh: e.target.value})} 
                    />
                  </div>
                  <div className="form-input-v3">
                    <label>⚥ Giới tính</label>
                    <select value={formData.gioi_tinh} onChange={e => setFormData({...formData, gioi_tinh: e.target.value})}>
                      <option value="">Chọn</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Địa chỉ & Liên hệ</h4>
                
                {/* PHẦN QUÊ QUÁN */}
                <div className="address-sub-section">
                  <p className="sub-label"><FiMapPin /> Quê quán (Nguyên quán)</p>
                  <div className="address-grid-v3">
                    <input 
                      list="provinces-list" 
                      placeholder="Tỉnh/Thành phố" 
                      value={addrQue.tinh}
                      onChange={e => handleProvinceChange(e.target.value, 'que')}
                    />
                    <input 
                      list="districts-que" 
                      placeholder="Quận/Huyện" 
                      value={addrQue.huyen}
                      onChange={e => handleDistrictChange(e.target.value, 'que')}
                    />
                    <input 
                      list="wards-que" 
                      placeholder="Phường/Xã" 
                      value={addrQue.xa}
                      onChange={e => setAddrQue({...addrQue, xa: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Số nhà, tên đường..." 
                      value={addrQue.chi_tiet}
                      onChange={e => setAddrQue({...addrQue, chi_tiet: e.target.value})}
                    />
                  </div>
                </div>

                {/* PHẦN ĐỊA CHỈ NHẬN HÀNG */}
                <div className="address-sub-section">
                  <p className="sub-label"><FiMapPin /> Địa chỉ hiện tại (Giao hàng)</p>
                  <div className="address-grid-v3">
                    <input 
                      list="provinces-list" 
                      placeholder="Tỉnh/Thành phố" 
                      value={addrNhan.tinh}
                      onChange={e => handleProvinceChange(e.target.value, 'nhan')}
                    />
                    <input 
                      list="districts-nhan" 
                      placeholder="Quận/Huyện" 
                      value={addrNhan.huyen}
                      onChange={e => handleDistrictChange(e.target.value, 'nhan')}
                    />
                    <input 
                      list="wards-nhan" 
                      placeholder="Phường/Xã" 
                      value={addrNhan.xa}
                      onChange={e => setAddrNhan({...addrNhan, xa: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Số nhà, tên đường..." 
                      value={addrNhan.chi_tiet}
                      onChange={e => setAddrNhan({...addrNhan, chi_tiet: e.target.value})}
                    />
                  </div>
                </div>

                {/* DATALISTS CHO GỢI Ý */}
                <datalist id="provinces-list">
                  {provinces.map(p => <option key={p.code} value={p.name} />)}
                </datalist>
                <datalist id="districts-que">
                  {districts.que.map(d => <option key={d.code} value={d.name} />)}
                </datalist>
                <datalist id="districts-nhan">
                  {districts.nhan.map(d => <option key={d.code} value={d.name} />)}
                </datalist>
                <datalist id="wards-que">
                  {wards.que.map(w => <option key={w.code} value={w.name} />)}
                </datalist>
                <datalist id="wards-nhan">
                  {wards.nhan.map(w => <option key={w.code} value={w.name} />)}
                </datalist>
              </div>

              {message.text && (
                <div className={`form-alert-v3 ${message.type}`}>
                  {message.type === 'success' ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="form-actions-v3">
                <button type="submit" className="save-profile-btn" disabled={saving}>
                  {saving ? <FiLoader className="spinner" /> : <FiSave />}
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  )
}

export default Profile
