import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiX, FiMapPin, FiTruck, FiTag, FiChevronRight, FiCheckCircle, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { API_BASE } from '../../config/api'
import './Checkout.css'

const API = API_BASE

function Checkout() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { cartItems, cartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [checkoutData, setCheckoutData] = useState(null)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [allAddresses, setAllAddresses] = useState([])
  const [showAddressList, setShowAddressList] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [availableVouchers, setAvailableVouchers] = useState([])
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [showVoucherDropdown, setShowVoucherDropdown] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(180) // 3 phút = 180 giây
  const [paymentOrderId, setPaymentOrderId] = useState(null)
  const [bankInfo, setBankInfo] = useState(null)
  const [newAddr, setNewAddr] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    tinh: '',
    huyen: '',
    xa: '',
    chi_tiet: ''
  })

  // State cho API địa danh
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  // Lấy danh sách tỉnh khi mở form
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
  }, [])

  // Khi chọn tỉnh -> lấy huyện
  const handleProvinceChange = (e) => {
    const val = e.target.value
    setNewAddr({ ...newAddr, tinh: val, huyen: '', xa: '' })
    const province = provinces.find(p => p.name === val)
    if (province) {
      fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`)
        .then(res => res.json())
        .then(data => setDistricts(data.districts))
    }
  }

  // Khi chọn huyện -> lấy xã
  const handleDistrictChange = (e) => {
    const val = e.target.value
    setNewAddr({ ...newAddr, huyen: val, xa: '' })
    const district = districts.find(d => d.name === val)
    if (district) {
      fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`)
        .then(res => res.json())
        .then(data => setWards(data.wards))
    }
  }
  const [selectedShipping, setSelectedShipping] = useState({ id: 1, name: 'Giao hàng tiêu chuẩn', cost: 15000, desc: 'Dự kiến nhận: 3-5 ngày' })
  const [showShippingModal, setShowShippingModal] = useState(false)
  const shippingMethods = [
    { id: 1, name: 'Giao hàng tiêu chuẩn', cost: 15000, desc: 'Dự kiến nhận: 3-5 ngày' },
    { id: 2, name: 'Giao hàng nhanh', cost: 35000, desc: 'Dự kiến nhận: 1-2 ngày' },
    { id: 3, name: 'Hỏa tốc (2H)', cost: 55000, desc: 'Nhận hàng ngay trong 2 giờ' },
  ]
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('COD')

  useEffect(() => {
    if (currentUser?.id) {
      fetchCheckoutData()
    }
    fetchVouchers()
    fetchBankInfo()
  }, [currentUser])

  const fetchBankInfo = async () => {
    try {
      const res = await fetch(`${API}/don-hang/bank-info`);
      const data = await res.json();
      if (res.ok) setBankInfo(data);
    } catch (err) {
      console.log('Error fetching bank info');
    }
  }

  const fetchVouchers = async () => {
    try {
      const res = await fetch(`${API}/don-hang/vouchers`);
      const data = await res.json();
      if (res.ok) setAvailableVouchers(data);
    } catch (err) {
      console.log('Error fetching vouchers');
    }
  }

  const fetchCheckoutData = async () => {
    try {
      const token = sessionStorage.getItem('token')
      // Lấy thông tin thanh toán tổng hợp (Sản phẩm, Voucher, ...)
      const res = await fetch(`${API}/don-hang/checkout-data?userId=${currentUser?.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setCheckoutData(data)

      // Dùng thông tin profile user làm địa chỉ mặc định
      const fallback = {
        ho_ten: data.user?.ho_ten || currentUser?.ho_ten,
        so_dien_thoai: data.user?.so_dien_thoai || currentUser?.so_dien_thoai,
        dia_chi: data.user?.dia_chi || ''
      }
      setSelectedAddress(fallback)
      setAllAddresses([fallback])
    } catch (err) {
      console.error('Lỗi tải dữ liệu checkout:', err)
    }
  }

  const handleAddNewAddress = async () => {
    // 1. Kiểm tra để trống các trường mới
    if (!newAddr.ho_ten.trim() || !newAddr.so_dien_thoai.trim() || !newAddr.tinh.trim() || !newAddr.huyen.trim() || !newAddr.xa.trim() || !newAddr.chi_tiet.trim()) {
      alert('Vui lòng điền đầy đủ tất cả các trường thông tin!')
      return
    }

    // 2. Định dạng họ tên (ít nhất 2 từ)
    if (newAddr.ho_ten.trim().length < 2) {
      alert('Họ tên không hợp lệ!')
      return
    }

    // 3. Định dạng số điện thoại Việt Nam (Xóa dấu cách trước khi kiểm tra)
    const rawPhone = newAddr.so_dien_thoai.replace(/\s/g, '');
    const vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
    if (!vnf_regex.test(rawPhone)) {
      alert('Số điện thoại không đúng định dạng Việt Nam!')
      return
    }

    // 4. Kiểm tra địa chỉ chi tiết
    if (!newAddr.tinh || !newAddr.huyen || !newAddr.xa || !newAddr.chi_tiet) {
      alert('Vui lòng nhập đầy đủ Tỉnh/Huyện/Xã và Số nhà!')
      return
    }

    const fullAddress = `${newAddr.chi_tiet}, ${newAddr.xa}, ${newAddr.huyen}, ${newAddr.tinh}`;

    try {
      const url = editingAddressId ? `${API}/nguoi-dung/addresses/${editingAddressId}` : `${API}/nguoi-dung/addresses`;
      const method = editingAddressId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ho_ten: newAddr.ho_ten,
          so_dien_thoai: newAddr.so_dien_thoai,
          dia_chi: fullAddress,
          userId: currentUser?.id
        })
      })
      if (res.ok) {
        await fetchCheckoutData()
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), 2000)

        setIsAddingNew(false)
        setEditingAddressId(null)
        setNewAddr({ ho_ten: '', so_dien_thoai: '', tinh: '', huyen: '', xa: '', chi_tiet: '' })
      }
    } catch (err) {
      alert('Lỗi kết nối server!')
    }
  }

  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return
    try {
      const res = await fetch(`${API}/nguoi-dung/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      })
      if (res.ok) fetchCheckoutData()
    } catch (err) {
      alert('Lỗi khi xóa địa chỉ')
    }
  }

  const handleEditClick = (addr, e) => {
    e.stopPropagation()
    // Tách địa chỉ cũ để đưa vào form
    const parts = addr.dia_chi.split(', ')
    setNewAddr({
      ho_ten: addr.ho_ten,
      so_dien_thoai: addr.so_dien_thoai,
      chi_tiet: parts[0] || '',
      xa: parts[1] || '',
      huyen: parts[2] || '',
      tinh: parts[3] || ''
    })
    setEditingAddressId(addr.id)
    setIsAddingNew(true)
  }

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      const res = await fetch(`${API}/don-hang/check-voucher?code=${voucherCode}&totalAmount=${cartTotal}`);
      const data = await res.json();
      if (res.ok) {
        setAppliedVoucher(data);
        alert(`Áp dụng mã thành công! Bạn được giảm ${formatVND(data.gia_tri)}`);
      } else {
        alert(data.message || 'Mã không hợp lệ');
        setAppliedVoucher(null);
      }
    } catch (err) {
      alert('Lỗi hệ thống!');
    }
  }

  const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  // Tính toán số tiền được giảm
  const calculateDiscount = () => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.loai_voucher === 'percentage') {
      return (cartTotal * appliedVoucher.gia_tri) / 100;
    }
    return appliedVoucher.gia_tri;
  };

  const discountAmount = calculateDiscount();
  const finalTotal = cartTotal + (selectedShipping?.cost || 0) - discountAmount;

  // ─── Logic VietQR (Countdown) ───
  useEffect(() => {
    let timer;
    if (showQRModal && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0 && showQRModal) {
      // Gọi API báo thanh toán thất bại khi hết thời gian
      fetch(`${API}/don-hang/payment-failed/${paymentOrderId}`, { method: 'POST' })
        .catch(err => console.error('Lỗi báo thất bại:', err));

      alert('Giao dịch đã hết hạn thanh toán (10 phút). Trạng thái: Thanh toán thất bại.');
      setShowQRModal(false);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showQRModal, timeLeft, paymentOrderId]);

  // ─── Logic Polling kiểm tra thanh toán ───
  useEffect(() => {
    let pollInterval;
    if (showQRModal && paymentOrderId) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API}/don-hang/status/${paymentOrderId}`);
          const data = await res.json();
          // Kiểm tra theo trạng thái 'Chờ xác nhận'
          if (data.trang_thai === 'Chờ xác nhận' || data.status === 'Paid') {
            setShowQRModal(false);
            alert('Thanh toán thành công! Đơn hàng đang được chờ xác nhận.');
            clearCart();
            navigate('/my-orders');
          }
        } catch (err) {
          console.error('Lỗi kiểm tra thanh toán:', err);
        }
      }, 3000); // Rút ngắn xuống 3s để phản hồi nhanh hơn
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [showQRModal, paymentOrderId, clearCart, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedAddress) {
      alert('Vui lòng chọn địa chỉ nhận hàng!');
      return;
    }
    setLoading(true)

    const orderData = {
      cartItems,
      totalAmount: finalTotal,
      dia_chi: typeof selectedAddress === 'object' ? selectedAddress?.dia_chi : selectedAddress,
      phuong_thuc_thanh_toan: paymentMethod
    }

    try {
      const res = await fetch(`${API}/don-hang/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      })

      const data = await res.json()

      if (res.ok) {
        if (paymentMethod === 'Chuyển khoản') {
          // GỌI PAYOS TẠO LINK THANH TOÁN
          try {
            const payosRes = await fetch(`${API}/don-hang/create-payment-link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderId })
            });
            const payosData = await payosRes.json();
            
            if (payosRes.ok) {
              setPaymentOrderId(data.orderId);
              setBankInfo(payosData); 
              setTimeLeft(600);
              setShowQRModal(true);
            } else {
              alert('Lỗi tạo link thanh toán PayOS');
            }
          } catch (err) {
            console.error('Lỗi PayOS:', err);
            alert('Lỗi kết nối đến cổng thanh toán!');
          }
          setLoading(false);
        } else {
          // Thanh toán COD
          alert('Đặt hàng thành công!');
          clearCart(); // CHỈ XÓA NGAY NẾU LÀ COD
          navigate('/my-orders');
        }
      } else {
        alert(data.message || 'Lỗi xử lý đơn hàng!');
        setLoading(false);
      }
    } catch (err) {
      console.error('Submit Error:', err)
      alert('Lỗi kết nối hoặc hệ thống!')
      setLoading(false)
    }
  }

  // Hàm format giây thành mm:ss
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }


  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty-state">
        <FiCheckCircle size={64} color="var(--aether-green)" />
        <h2>Giỏ hàng của bạn đang trống</h2>
        <p>Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
        <button className="back-to-shop" onClick={() => navigate('/shop')}>Quay lại mua sắm</button>
      </div>
    )
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-content-container">
        {/* Cột trái: Thông tin chính */}
        <div className="checkout-left-column">
          <div className="checkout-main-card">
            <header className="checkout-main-header">
              <button className="back-link" onClick={() => navigate(-1)}>
                <FiChevronRight style={{ transform: 'rotate(180deg)' }} /> Quay lại
              </button>
              <h1>Thanh toán đơn hàng</h1>
            </header>

            {/* Section 1: Địa chỉ nhận hàng */}
            <section className="checkout-section-v2">
              <div className="section-head">
                <div className="title-with-icon">
                  <div className="icon-wrapper"><FiMapPin /></div>
                  <h3>Địa chỉ nhận hàng</h3>
                </div>
                <button type="button" className="edit-btn" onClick={() => navigate('/profile')}>Thay đổi</button>
              </div>

              <div className="address-display-box">
                <div className="primary-info">
                  <span className="name">{selectedAddress?.ho_ten || currentUser?.ho_ten}</span>
                  <span className="divider">|</span>
                  <span className="phone">{selectedAddress?.so_dien_thoai || currentUser?.so_dien_thoai}</span>
                </div>
                <p className="detail">{selectedAddress?.dia_chi || 'Chưa cập nhật địa chỉ giao hàng'}</p>
                {selectedAddress?.is_default && <span className="default-tag">Mặc định</span>}
              </div>
            </section>

            {/* Section 2: Danh sách sản phẩm */}
            <section className="checkout-section-v2">
              <div className="section-head">
                <div className="title-with-icon">
                  <div className="icon-wrapper"><FiCheckCircle /></div>
                  <h3>Sản phẩm đã chọn</h3>
                </div>
                <span className="count-badge">{cartItems.length} sản phẩm</span>
              </div>

              <div className="checkout-products-v2">
                {cartItems.map(item => (
                  <div key={item.id} className="product-item-v2">
                    <div className="img-box">
                      <img src={item.anh_bia} alt={item.ten_san_pham} />
                    </div>
                    <div className="info-box">
                      <h4>{item.ten_san_pham}</h4>
                      <p className="variant">Phân loại: {item.category || 'Mặc định'}</p>
                      <div className="price-row">
                        <span className="price">{formatVND(item.gia_ban)}</span>
                        <span className="qty">x{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Vận chuyển & Thanh toán */}
            <div className="two-cards-row">
              <section className="checkout-section-v2 half">
                <div className="section-head">
                  <h3>Đơn vị vận chuyển</h3>
                  <button type="button" className="edit-btn" onClick={() => setShowShippingModal(true)}>Sửa</button>
                </div>
                <div className="shipping-selected">
                  <FiTruck className="ship-icon" />
                  <div>
                    <p className="method-name">{selectedShipping.name}</p>
                    <p className="method-desc">{selectedShipping.desc}</p>
                  </div>
                </div>
              </section>

              <section className="checkout-section-v2 half">
                <div className="section-head">
                  <h3>Phương thức thanh toán</h3>
                </div>
                <div className="payment-grid">
                  <label className={`pay-card ${paymentMethod === 'COD' ? 'active' : ''}`}>
                    <input type="radio" value="COD" checked={paymentMethod === 'COD'} onChange={e => setPaymentMethod(e.target.value)} />
                    <span>Tiền mặt (COD)</span>
                  </label>
                  <label className={`pay-card ${paymentMethod === 'Chuyển khoản' ? 'active' : ''}`}>
                    <input type="radio" value="Chuyển khoản" checked={paymentMethod === 'Chuyển khoản'} onChange={e => setPaymentMethod(e.target.value)} />
                    <span>Chuyển khoản PayOS</span>
                  </label>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Cột phải: Sidebar Tổng kết */}
        <aside className="checkout-sidebar">
          <div className="sticky-summary-card">
            <h3>Tóm tắt đơn hàng</h3>

            <div className="summary-section">
              <div className="voucher-input-v2">
                <div className="v-field">
                  <FiTag className="v-icon" />
                  <input
                    type="text"
                    placeholder="Nhập mã giảm giá..."
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    onFocus={() => setShowVoucherDropdown(true)}
                    onBlur={() => setTimeout(() => setShowVoucherDropdown(false), 200)}
                    autoComplete="off"
                  />
                  
                  {showVoucherDropdown && Array.isArray(availableVouchers) && availableVouchers.length > 0 && (
                    <div className="custom-voucher-dropdown">
                      {availableVouchers.map(v => (
                        <div 
                          key={v.ma_voucher} 
                          className="voucher-suggestion-item"
                          onClick={() => {
                            setVoucherCode(v.ma_voucher)
                            setShowVoucherDropdown(false)
                          }}
                        >
                          <div className="v-code">{v.ma_voucher}</div>
                          <div className="v-info">
                            Giảm {v.loai_voucher === 'percentage' ? `${v.gia_tri}%` : `${(v.gia_tri || 0).toLocaleString()}đ`}
                            <span>Đơn từ {(v.gia_tri_don_hang_toi_thieu || 0).toLocaleString()}đ</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button className="apply-btn-v2" onClick={handleApplyVoucher} disabled={!voucherCode.trim()}>Áp dụng</button>
              </div>
              {appliedVoucher && (
                <div className="applied-info">
                  <FiCheckCircle /> Đã áp dụng mã: <strong>{appliedVoucher.ma_voucher}</strong>
                  <button onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }}>Gỡ</button>
                </div>
              )}
            </div>

            <div className="summary-section totals">
              <div className="s-row">
                <span>Tạm tính</span>
                <span>{formatVND(cartTotal)}</span>
              </div>
              <div className="s-row">
                <span>Phí vận chuyển</span>
                <span>{formatVND(selectedShipping?.cost || 0)}</span>
              </div>
              {appliedVoucher && (
                <div className="s-row discount">
                  <span>Giảm giá</span>
                  <span className="minus">-{formatVND(discountAmount)}</span>
                </div>
              )}
              <div className="total-row">
                <span>Tổng cộng</span>
                <span className="big-price">{formatVND(finalTotal)}</span>
              </div>
            </div>

            <p className="policy-note">Bằng cách đặt hàng, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a>.</p>

            <button className="final-checkout-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? <div className="spinner-v2"></div> : 'XÁC NHẬN ĐẶT HÀNG'}
            </button>
          </div>
        </aside>
      </div>

      {/* Modal overlays */}
      {showAddressList && (
        <div className="address-modal-overlay" onClick={() => setShowAddressList(false)}>
          <div className="address-modal-content v2" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Địa chỉ nhận hàng</h3>
              <button onClick={() => setShowAddressList(false)}><FiX /></button>
            </div>

            {!isAddingNew && (
              <button type="button" className="add-new-btn-v2 top-btn" onClick={() => setIsAddingNew(true)}>
                + Thêm địa chỉ nhận hàng mới
              </button>
            )}

            {!isAddingNew ? (
              <div className="address-list-v2">
                {allAddresses.map((addr, idx) => (
                  <div key={idx} className={`addr-item-v2 ${selectedAddress?.id === addr.id ? 'active' : ''}`} onClick={() => { setSelectedAddress(addr); setShowAddressList(false); }}>
                    <div className="radio-dot"></div>
                    <div className="addr-body">
                      <div className="addr-line-1">
                        <p className="u-info"><strong>{addr.ho_ten}</strong> | {addr.so_dien_thoai}</p>
                        <div className="addr-actions">
                          <button className="a-edit" title="Sửa" onClick={(e) => handleEditClick(addr, e)}><FiEdit2 /></button>
                          <button className="a-delete" title="Xóa" onClick={(e) => handleDeleteAddress(addr.id, e)}><FiTrash2 /></button>
                        </div>
                      </div>
                      <p className="u-addr">{addr.dia_chi}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="add-form-v2">
                <div className="grid-inputs">
                  <input type="text" placeholder="Họ tên" value={newAddr.ho_ten} onChange={e => setNewAddr({ ...newAddr, ho_ten: e.target.value })} />
                  <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={newAddr.so_dien_thoai}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 10) val = val.slice(0, 10);
                      let formatted = val;
                      if (val.length > 4 && val.length <= 7) {
                        formatted = `${val.slice(0, 4)} ${val.slice(4)}`;
                      } else if (val.length > 7) {
                        formatted = `${val.slice(0, 4)} ${val.slice(4, 7)} ${val.slice(7)}`;
                      }
                      setNewAddr({ ...newAddr, so_dien_thoai: formatted })
                    }}
                  />
                </div>
                <div className="grid-inputs">
                  <input
                    type="text"
                    placeholder="Tỉnh / Thành phố"
                    list="provinces-list"
                    value={newAddr.tinh}
                    onChange={handleProvinceChange}
                  />
                  <datalist id="provinces-list">
                    {provinces.map(p => <option key={p.code} value={p.name} />)}
                  </datalist>

                  <input
                    type="text"
                    placeholder="Quận / Huyện"
                    list="districts-list"
                    value={newAddr.huyen}
                    onChange={handleDistrictChange}
                  />
                  <datalist id="districts-list">
                    {districts.map(d => <option key={d.code} value={d.name} />)}
                  </datalist>
                </div>

                <input
                  type="text"
                  placeholder="Phường / Xã"
                  list="wards-list"
                  value={newAddr.xa}
                  onChange={e => setNewAddr({ ...newAddr, xa: e.target.value })}
                />
                <datalist id="wards-list">
                  {wards.map(w => <option key={w.code} value={w.name} />)}
                </datalist>
                <textarea placeholder="Địa chỉ chi tiết" value={newAddr.chi_tiet} onChange={e => setNewAddr({ ...newAddr, chi_tiet: e.target.value })} />
                <div className="form-btns">
                  <button type="button" className="c-btn" onClick={() => { setIsAddingNew(false); setEditingAddressId(null); setNewAddr({ ho_ten: '', so_dien_thoai: '', tinh: '', huyen: '', xa: '', chi_tiet: '' }); }}>Hủy</button>
                  <button type="button" className="s-btn" onClick={handleAddNewAddress}>{editingAddressId ? 'Cập nhật' : 'Lưu địa chỉ'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showShippingModal && (
        <div className="address-modal-overlay" onClick={() => setShowShippingModal(false)}>
          <div className="address-modal-content v2" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Phương thức vận chuyển</h3>
              <button onClick={() => setShowShippingModal(false)}><FiX /></button>
            </div>
            <div className="ship-list-v2">
              {shippingMethods.map(m => (
                <div key={m.id} className={`ship-item-v2 ${selectedShipping.id === m.id ? 'active' : ''}`} onClick={() => { setSelectedShipping(m); setShowShippingModal(false); }}>
                  <div className="radio-dot"></div>
                  <div className="ship-body">
                    <p className="m-name">{m.name} <span>{formatVND(m.cost)}</span></p>
                    <p className="m-desc">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showVoucherModal && (
        <div className="address-modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="address-modal-content v2" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chọn Voucher</h3>
              <button onClick={() => setShowVoucherModal(false)}><FiX /></button>
            </div>
            <div className="voucher-list-v3">
              {availableVouchers.length === 0 ? (
                <p className="no-data">Hiện không có mã giảm giá nào khả dụng.</p>
              ) : (
                availableVouchers.map(v => (
                  <div key={v.id} className="voucher-item-v3" onClick={() => { setVoucherCode(v.ma_voucher); setShowVoucherModal(false); }}>
                    <div className="v-left">
                      <FiTag />
                    </div>
                    <div className="v-right">
                      <p className="v-title">{v.ten_voucher}</p>
                      <p className="v-code">Mã: <strong>{v.ma_voucher}</strong></p>
                      <p className="v-cond">Đơn từ {formatVND(v.gia_tri_don_hang_toi_thieu)} - Giảm {formatVND(v.gia_tri)}</p>
                      <p className="v-exp">Hết hạn: {new Date(v.ngay_ket_thuc).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <button className="v-use-btn">Dùng ngay</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="success-toast-v2">
          <div className="toast-content">
            <FiCheckCircle className="toast-icon" />
            <span>Lưu địa chỉ thành công!</span>
          </div>
        </div>
      )}

      {/* MODAL THANH TOÁN PAYOS */}
      {showQRModal && (
        <div className="qr-modal-overlay">
          <div className="qr-modal-content" style={{ position: 'relative' }}>
            <button
              className="close-qr"
              style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}
              onClick={async () => {
                try {
                  await fetch(`${API}/don-hang/payment-failed/${paymentOrderId}`, { method: 'POST' });
                } catch(err) {}
                setShowQRModal(false);
              }}
            ><FiX /></button>
            <div className="qr-header">
              <h3>Thanh toán đơn hàng #{paymentOrderId}</h3>
            </div>
            
            <div className="qr-body">
              <div className="qr-timer">
                <p>Giao dịch hết hạn sau:</p>
                <div className="countdown">{formatTimer(timeLeft)}</div>
              </div>

              <div className="vietqr-display" style={{ textAlign: 'center', margin: '20px 0' }}>
                <p>Vui lòng quét mã QR dưới đây để thanh toán:</p>
                {bankInfo?.qrCode ? (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(bankInfo.qrCode)}`} 
                    alt="VietQR" 
                    style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', border: '1px solid #ddd', padding: '10px', backgroundColor: 'white' }} 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : (
                  <p style={{ color: 'red', fontStyle: 'italic' }}>Không thể lấy mã QR trực tiếp.</p>
                )}
                <div style={{ display: (!bankInfo?.qrCode) ? 'block' : 'none', marginTop: '15px' }}>
                  <a 
                    href={bankInfo?.checkoutUrl} 
                    className="payos-button"
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'var(--aether-green)',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      marginTop: '10px'
                    }}
                  >
                    Mở trang thanh toán PayOS
                  </a>
                </div>
              </div>

              <div className="qr-details">
                <div className="detail-item">
                  <span>Số tiền:</span>
                  <strong className="amount">{formatVND(finalTotal)}</strong>
                </div>
                <div className="detail-item">
                  <span>Nội dung:</span>
                  <strong className="msg">AetherOrder {paymentOrderId}</strong>
                </div>
              </div>

              <div className="qr-actions" style={{ textAlign: 'center', marginTop: '20px' }}>
                <div className="qr-loading">
                  <div className="spinner"></div>
                  <span>Hệ thống đang tự động kiểm tra thanh toán (PayOS)...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Checkout;
// Cập nhật hệ thống thanh toán tự động VietQR - Hoàn tất
