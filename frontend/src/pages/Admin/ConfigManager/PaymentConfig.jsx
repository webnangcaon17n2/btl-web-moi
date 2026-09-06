import { useState, useCallback } from 'react'
import {
  FiCreditCard, FiCheck, FiAlertCircle,
  FiEdit2, FiSave, FiX, FiToggleLeft, FiToggleRight, FiPlus,
  FiTrash2, FiCopy
} from 'react-icons/fi'
import '../ProductManager.css'
import './PaymentConfig.css'

const INITIAL_BANK_ACCOUNTS = [
  {
    id: 'BA001',
    bankName: 'Vietcombank',
    accountNumber: '1234567890123',
    accountHolder: 'NGUYEN HUY TIEP',
    branch: 'Hà Nội',
    qrEnabled: true,
    isDefault: true,
    createdAt: '2026-01-15'
  },
  {
    id: 'BA002',
    bankName: 'Techcombank',
    accountNumber: '9876543210987',
    accountHolder: 'HOANG TUNG DUONG',
    branch: 'Hà Nội',
    qrEnabled: true,
    isDefault: false,
    createdAt: '2026-02-20'
  },
  {
    id: 'BA003',
    bankName: 'MB Bank',
    accountNumber: '5555666677778',
    accountHolder: 'NGUYEN VAN PHONG',
    branch: 'Hà Nội',
    qrEnabled: false,
    isDefault: false,
    createdAt: '2026-03-10'
  },
]

const BANK_LIST = [
  'Vietcombank', 'Techcombank', 'MB Bank', 'BIDV', 'Agribank',
  'VPBank', 'Sacombank', 'ACB', 'TPBank', 'VIB',
  'HDBank', 'SHB', 'OCB', 'MSB', 'Eximbank'
]

function PaymentConfig() {
  const [bankAccounts, setBankAccounts] = useState(INITIAL_BANK_ACCOUNTS)
  const [toast, setToast] = useState(null)
  const [editingBank, setEditingBank] = useState(null)
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountHolder: '', branch: '' })
  const [showAddBank, setShowAddBank] = useState(false)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleEditBank = (account) => {
    setEditingBank(account.id)
    setBankForm({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      branch: account.branch,
    })
  }

  const handleSaveBank = (id) => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
      showToast('Vui lòng điền đầy đủ thông tin!', 'error')
      return
    }
    setBankAccounts(prev => prev.map(a => a.id === id ? { ...a, ...bankForm } : a))
    setEditingBank(null)
    showToast('Đã cập nhật tài khoản thụ hưởng!')
  }

  const handleCancelEdit = () => {
    setEditingBank(null)
    setBankForm({ bankName: '', accountNumber: '', accountHolder: '', branch: '' })
  }

  const handleToggleQR = (id) => {
    setBankAccounts(prev => prev.map(a => a.id === id ? { ...a, qrEnabled: !a.qrEnabled } : a))
    const account = bankAccounts.find(a => a.id === id)
    showToast(account.qrEnabled ? 'Đã tắt thanh toán QR cho tài khoản này' : 'Đã bật thanh toán QR cho tài khoản này')
  }

  const handleSetDefault = (id) => {
    setBankAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
    showToast('Đã đặt làm tài khoản mặc định!')
  }

  const handleAddBank = () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
      showToast('Vui lòng điền đầy đủ thông tin!', 'error')
      return
    }
    const newAccount = {
      id: 'BA' + String(bankAccounts.length + 1).padStart(3, '0'),
      ...bankForm,
      qrEnabled: true,
      isDefault: bankAccounts.length === 0,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setBankAccounts(prev => [...prev, newAccount])
    setShowAddBank(false)
    setBankForm({ bankName: '', accountNumber: '', accountHolder: '', branch: '' })
    showToast('Đã thêm tài khoản thụ hưởng mới!')
  }

  const handleDeleteBank = (id) => {
    const account = bankAccounts.find(a => a.id === id)
    if (account.isDefault) {
      showToast('Không thể xóa tài khoản mặc định!', 'error')
      return
    }
    setBankAccounts(prev => prev.filter(a => a.id !== id))
    showToast('Đã xóa tài khoản!')
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    showToast('Đã sao chép!')
  }

  return (
    <div className="pm">
      <div className="pm-page-header">
        <div className="pm-page-header__left">
          <h1>Quản lý tài khoản thụ hưởng</h1>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{bankAccounts.filter(a => a.qrEnabled).length}</div>
            <div className="pm-stat-card__label">QR đang hoạt động</div>
          </div>
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{bankAccounts.length}</div>
            <div className="pm-stat-card__label">Tổng tài khoản</div>
          </div>
        </div>
      </div>

      <div className="cfg-section">
        <div className="cfg-section__header">
          <button className="pm-btn pm-btn--primary" onClick={() => { setShowAddBank(true); setBankForm({ bankName: '', accountNumber: '', accountHolder: '', branch: '' }) }} id="btn-add-bank">
            <FiPlus size={16} /> Thêm tài khoản
          </button>
        </div>

        {/* Thông báo trạng thái */}
        <div className="cfg-status-banner">
          <div className="cfg-status-banner__icon">
            <FiCreditCard size={18} />
          </div>
          <div className="cfg-status-banner__content">
            <strong>Trạng thái thanh toán QR:</strong>
            {bankAccounts.some(a => a.qrEnabled) ? (
              <span className="cfg-status-banner__active"> Đang hoạt động </span>
            ) : (
              <span className="cfg-status-banner__inactive"> Tất cả tài khoản đã tắt QR</span>
            )}
          </div>
        </div>

        {/* Bank Account Cards */}
        <div className="cfg-bank-grid">
          {bankAccounts.map(account => (
            <div key={account.id} className={`cfg-bank-card ${account.isDefault ? 'cfg-bank-card--default' : ''} ${!account.qrEnabled ? 'cfg-bank-card--disabled' : ''}`}>
              {account.isDefault && <div className="cfg-bank-card__badge">Mặc định</div>}
              {!account.qrEnabled && <div className="cfg-bank-card__badge cfg-bank-card__badge--off">QR đã tắt</div>}

              <div className="cfg-bank-card__header">
                <div className="cfg-bank-card__bank-logo">
                  {account.bankName.charAt(0)}
                </div>
                <div className="cfg-bank-card__bank-info">
                  {editingBank === account.id ? (
                    <select
                      className="pm-form__select"
                      value={bankForm.bankName}
                      onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))}
                      style={{ fontSize: '13px', padding: '6px 10px' }}
                    >
                      <option value="">Chọn ngân hàng</option>
                      {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  ) : (
                    <>
                      <div className="cfg-bank-card__bank-name">{account.bankName}</div>
                      <div className="cfg-bank-card__branch">{account.branch}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="cfg-bank-card__body">
                {editingBank === account.id ? (
                  <div className="cfg-bank-card__edit-form">
                    <div className="pm-form__group">
                      <label className="pm-form__label">Số tài khoản</label>
                      <input
                        type="text"
                        className="pm-form__input"
                        value={bankForm.accountNumber}
                        onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))}
                        placeholder="Nhập số tài khoản"
                      />
                    </div>
                    <div className="pm-form__group">
                      <label className="pm-form__label">Chủ tài khoản</label>
                      <input
                        type="text"
                        className="pm-form__input"
                        value={bankForm.accountHolder}
                        onChange={e => setBankForm(f => ({ ...f, accountHolder: e.target.value.toUpperCase() }))}
                        placeholder="Tên chủ tài khoản (in hoa)"
                      />
                    </div>
                    <div className="pm-form__group">
                      <label className="pm-form__label">Chi nhánh</label>
                      <input
                        type="text"
                        className="pm-form__input"
                        value={bankForm.branch}
                        onChange={e => setBankForm(f => ({ ...f, branch: e.target.value }))}
                        placeholder="Chi nhánh"
                      />
                    </div>
                    <div className="cfg-bank-card__edit-actions">
                      <button className="pm-btn pm-btn--primary pm-btn--small" onClick={() => handleSaveBank(account.id)}>
                        <FiSave size={14} /> Lưu
                      </button>
                      <button className="pm-btn pm-btn--small" onClick={handleCancelEdit}>
                        <FiX size={14} /> Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="cfg-bank-card__field">
                      <span className="cfg-bank-card__field-label">Số tài khoản</span>
                      <div className="cfg-bank-card__field-value">
                        <span>{account.accountNumber}</span>
                        <button className="cfg-bank-card__copy" onClick={() => copyToClipboard(account.accountNumber)} title="Sao chép">
                          <FiCopy size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="cfg-bank-card__field">
                      <span className="cfg-bank-card__field-label">Chủ tài khoản</span>
                      <span className="cfg-bank-card__field-value">{account.accountHolder}</span>
                    </div>
                    <div className="cfg-bank-card__field">
                      <span className="cfg-bank-card__field-label">Chi nhánh</span>
                      <span className="cfg-bank-card__field-value">{account.branch}</span>
                    </div>
                  </>
                )}
              </div>

              {/* QR Preview */}
              {account.qrEnabled && editingBank !== account.id && (
                <div className="cfg-bank-card__qr">
                  <div className="cfg-bank-card__qr-placeholder">
                    <div className="cfg-bank-card__qr-icon">QR</div>
                    <span className="cfg-bank-card__qr-text">Mã QR tự động tạo</span>
                  </div>
                </div>
              )}

              {/* Card Actions */}
              {editingBank !== account.id && (
                <div className="cfg-bank-card__actions">
                  <button
                    className={`cfg-toggle-btn ${account.qrEnabled ? 'cfg-toggle-btn--on' : 'cfg-toggle-btn--off'}`}
                    onClick={() => handleToggleQR(account.id)}
                    title={account.qrEnabled ? 'Tắt QR' : 'Bật QR'}
                  >
                    {account.qrEnabled ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                    <span>{account.qrEnabled ? 'QR Bật' : 'QR Tắt'}</span>
                  </button>
                  <div className="cfg-bank-card__action-group">
                    {!account.isDefault && (
                      <button className="pm-btn pm-btn--small" onClick={() => handleSetDefault(account.id)} title="Đặt mặc định">
                        <FiCheck size={14} /> Mặc định
                      </button>
                    )}
                    <button className="pm-btn pm-btn--small" onClick={() => handleEditBank(account)} title="Chỉnh sửa">
                      <FiEdit2 size={14} />
                    </button>
                    {!account.isDefault && (
                      <button className="pm-btn pm-btn--small pm-btn--danger" onClick={() => handleDeleteBank(account.id)} title="Xóa">
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="cfg-info-box">
          <FiAlertCircle size={16} />
          <div>
            <strong>Lưu ý:</strong> Khi thay đổi thông tin tài khoản, mã QR hiển thị trên trang thanh toán của người dùng sẽ tự động cập nhật.
            Admin có thể tắt QR nếu tài khoản ngân hàng đang bảo trì.
          </div>
        </div>
      </div>

      {/* ==================== ADD BANK MODAL ==================== */}
      {showAddBank && (
        <div className="pm-modal-overlay" onClick={() => setShowAddBank(false)}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title"><FiPlus size={18} /> Thêm tài khoản thụ hưởng</h2>
              <button className="pm-modal__close" onClick={() => setShowAddBank(false)}><FiX size={18} /></button>
            </div>
            <div className="pm-modal__body">
              <div className="pm-form-grid">
                <div className="pm-form__group pm-form-grid--full">
                  <label className="pm-form__label">Ngân hàng *</label>
                  <select
                    className="pm-form__select"
                    value={bankForm.bankName}
                    onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))}
                  >
                    <option value="">Chọn ngân hàng</option>
                    {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="pm-form__group">
                  <label className="pm-form__label">Số tài khoản *</label>
                  <input
                    type="text"
                    className="pm-form__input"
                    value={bankForm.accountNumber}
                    onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="Nhập số tài khoản"
                  />
                </div>
                <div className="pm-form__group">
                  <label className="pm-form__label">Chi nhánh</label>
                  <input
                    type="text"
                    className="pm-form__input"
                    value={bankForm.branch}
                    onChange={e => setBankForm(f => ({ ...f, branch: e.target.value }))}
                    placeholder="Chi nhánh ngân hàng"
                  />
                </div>
                <div className="pm-form__group pm-form-grid--full">
                  <label className="pm-form__label">Chủ tài khoản *</label>
                  <input
                    type="text"
                    className="pm-form__input"
                    value={bankForm.accountHolder}
                    onChange={e => setBankForm(f => ({ ...f, accountHolder: e.target.value.toUpperCase() }))}
                    placeholder="Tên chủ tài khoản (viết hoa)"
                  />
                </div>
              </div>
            </div>
            <div className="pm-modal__footer">
              <button className="pm-btn" onClick={() => setShowAddBank(false)}>Hủy</button>
              <button className="pm-btn pm-btn--primary" onClick={handleAddBank}>
                <FiPlus size={16} /> Thêm tài khoản
              </button>
            </div>
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

export default PaymentConfig
