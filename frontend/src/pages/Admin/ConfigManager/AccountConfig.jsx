import { useState, useCallback } from 'react'
import {
  FiCheck, FiAlertCircle, FiSave, FiX,
  FiToggleLeft, FiToggleRight, FiShield
} from 'react-icons/fi'
import '../ProductManager.css'
import './AccountConfig.css'

const INITIAL_ADMIN_ACCOUNTS = [
  {
    id: 'ADM001',
    fullName: 'Admin',
    email: 'admin@aether.com',
    role: 'Super Admin',
    permissions: {
      manageProducts: true,
      manageOrders: true,
      manageUsers: true,
      manageFinance: true,
      manageBlogs: true,
      manageConfig: true,
      manageInventory: true,
      manageSuppliers: true,
    },
    status: 'Active',
    lastLogin: '2026-04-12 08:30',
  },
  {
    id: 'ADM002',
    fullName: 'Trần Văn B',
    email: 'tranb@aether.com',
    role: 'Moderator',
    permissions: {
      manageProducts: true,
      manageOrders: true,
      manageUsers: false,
      manageFinance: false,
      manageBlogs: true,
      manageConfig: false,
      manageInventory: true,
      manageSuppliers: false,
    },
    status: 'Active',
    lastLogin: '2026-04-11 14:22',
  },
  {
    id: 'ADM003',
    fullName: 'Lê Thị C',
    email: 'lec@aether.com',
    role: 'Editor',
    permissions: {
      manageProducts: false,
      manageOrders: false,
      manageUsers: false,
      manageFinance: false,
      manageBlogs: true,
      manageConfig: false,
      manageInventory: false,
      manageSuppliers: false,
    },
    status: 'Inactive',
    lastLogin: '2026-04-05 09:10',
  },
]

const PERMISSION_LABELS = {
  manageProducts: 'Quản lý sản phẩm',
  manageOrders: 'Quản lý đơn hàng',
  manageUsers: 'Quản lý người dùng',
  manageFinance: 'Quản lý thu chi',
  manageBlogs: 'Quản lý bài viết',
  manageConfig: 'Quản lý cấu hình',
  manageInventory: 'Quản lý kho',
  manageSuppliers: 'Quản lý nhà cung cấp',
}

function AccountConfig() {
  const [adminAccounts, setAdminAccounts] = useState(INITIAL_ADMIN_ACCOUNTS)
  const [toast, setToast] = useState(null)
  const [permModal, setPermModal] = useState({ open: false, admin: null })

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleTogglePermission = (adminId, permKey) => {
    setAdminAccounts(prev => prev.map(a => {
      if (a.id === adminId) {
        return { ...a, permissions: { ...a.permissions, [permKey]: !a.permissions[permKey] } }
      }
      return a
    }))
  }

  const handleSavePermissions = () => {
    setPermModal({ open: false, admin: null })
    showToast('Đã cập nhật quyền truy cập!')
  }

  const handleToggleAdminStatus = (id) => {
    setAdminAccounts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' }
      }
      return a
    }))
    showToast('Đã cập nhật trạng thái tài khoản!')
  }

  return (
    <div className="pm">
      <div className="pm-page-header">
        <div className="pm-page-header__left">
          <h1>Quản lý tài khoản Admin</h1>
          <p>Phân quyền và quản lý tài khoản quản trị viên</p>
        </div>
        <div className="pm-page-header__stats">
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{adminAccounts.filter(a => a.status === 'Active').length}</div>
            <div className="pm-stat-card__label">Admin hoạt động</div>
          </div>
          <div className="pm-stat-card">
            <div className="pm-stat-card__value">{adminAccounts.length}</div>
            <div className="pm-stat-card__label">Tổng tài khoản</div>
          </div>
        </div>
      </div>

      <div className="cfg-section">
        <div className="pm-table-wrap">
          <div className="pm-table-scroll">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Quyền</th>
                  <th>Đăng nhập lần cuối</th>
                  <th>Trạng thái</th>
                  <th style={{ width: '100px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {adminAccounts.map(admin => (
                  <tr key={admin.id}>
                    <td>{admin.id}</td>
                    <td><span className="pm-table__product-name">{admin.fullName}</span></td>
                    <td>{admin.email}</td>
                    <td>
                      <span className="pm-table__type-badge" style={
                        admin.role === 'Super Admin' ? { background: '#e3f2fd', color: '#1565c0' } :
                          admin.role === 'Moderator' ? { background: '#fff3e0', color: '#e65100' } :
                            { background: '#f3e5f5', color: '#7b1fa2' }
                      }>
                        {admin.role}
                      </span>
                    </td>
                    <td>
                      <div className="cfg-perm-badges">
                        {Object.entries(admin.permissions).filter(([, v]) => v).length} / {Object.keys(admin.permissions).length}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#888' }}>{admin.lastLogin}</td>
                    <td>
                      <span
                        className="pm-table__type-badge"
                        style={admin.status === 'Active' ? { background: '#e8f5e9', color: '#4caf50', cursor: 'pointer' } : { background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                        onClick={() => handleToggleAdminStatus(admin.id)}
                        role="button"
                        tabIndex={0}
                        title="Click để đổi trạng thái"
                        onKeyDown={() => { }}
                        aria-label="Toggle status"
                      >
                        {admin.status === 'Active' ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td>
                      <div className="pm-table__actions">
                        <button
                          className="pm-table__action-btn"
                          title="Phân quyền"
                          onClick={() => setPermModal({ open: true, admin: { ...admin } })}
                        >
                          <FiShield size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permission descriptions */}
        <div className="cfg-perm-legend">
          <h3 className="cfg-perm-legend__title">Danh sách quyền hệ thống</h3>
          <div className="cfg-perm-legend__grid">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <div key={key} className="cfg-perm-legend__item">
                <FiShield size={14} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== PERMISSION MODAL ==================== */}
      {permModal.open && permModal.admin && (
        <div className="pm-modal-overlay" onClick={() => setPermModal({ open: false, admin: null })}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h2 className="pm-modal__title"><FiShield size={18} /> Phân quyền — {permModal.admin.fullName}</h2>
              <button className="pm-modal__close" onClick={() => setPermModal({ open: false, admin: null })}><FiX size={18} /></button>
            </div>
            <div className="pm-modal__body">
              <div className="cfg-perm-info">
                <div className="cfg-perm-info__row">
                  <span className="cfg-perm-info__label">Tài khoản:</span>
                  <span>{permModal.admin.email}</span>
                </div>
                <div className="cfg-perm-info__row">
                  <span className="cfg-perm-info__label">Vai trò:</span>
                  <span className="pm-table__type-badge" style={
                    permModal.admin.role === 'Super Admin' ? { background: '#e3f2fd', color: '#1565c0' } :
                      permModal.admin.role === 'Moderator' ? { background: '#fff3e0', color: '#e65100' } :
                        { background: '#f3e5f5', color: '#7b1fa2' }
                  }>{permModal.admin.role}</span>
                </div>
              </div>

              <div className="cfg-perm-list">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                  const currentAdmin = adminAccounts.find(a => a.id === permModal.admin.id)
                  const isEnabled = currentAdmin?.permissions[key]
                  return (
                    <div key={key} className="cfg-perm-item">
                      <div className="cfg-perm-item__info">
                        <FiShield size={14} className="cfg-perm-item__icon" />
                        <span className="cfg-perm-item__label">{label}</span>
                      </div>
                      <button
                        className={`cfg-toggle-btn ${isEnabled ? 'cfg-toggle-btn--on' : 'cfg-toggle-btn--off'}`}
                        onClick={() => handleTogglePermission(permModal.admin.id, key)}
                      >
                        {isEnabled ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                        <span>{isEnabled ? 'Bật' : 'Tắt'}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="pm-modal__footer">
              <button className="pm-btn" onClick={() => setPermModal({ open: false, admin: null })}>Đóng</button>
              <button className="pm-btn pm-btn--primary" onClick={handleSavePermissions}>
                <FiSave size={16} /> Lưu thay đổi
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

export default AccountConfig
