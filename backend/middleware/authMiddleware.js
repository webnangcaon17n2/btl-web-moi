const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'aether_secret_key_change_in_prod'

// ─────────────────────────────────────────────────────────
// Middleware: Xác thực token JWT (bắt buộc đăng nhập)
// Dùng cho bất kỳ route nào cần user đăng nhập
// ─────────────────────────────────────────────────────────
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập. Vui lòng cung cấp token!'
    })
  }

  try {
    console.log('--- Verifying Token ---')
    console.log('Token:', token ? (token.substring(0, 10) + '...') : 'None')
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded // { id, email, vai_tro }
    console.log('Decoded User:', decoded.email)
    next()
  } catch (err) {
    console.error('JWT Verify Error:', err.message)
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại!'
    })
  }
}

// ─────────────────────────────────────────────────────────
// Middleware: Chỉ cho phép Admin (Admin hoặc Admin Tổng)
// Dùng SAU verifyToken
// ─────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const VAI_TRO_ADMIN = ['Admin', 'Admin Tổng']

  if (!req.user || !VAI_TRO_ADMIN.includes(req.user.vai_tro)) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập. Chỉ Admin mới được phép!'
    })
  }
  next()
}

// ─────────────────────────────────────────────────────────
// Middleware: Chỉ cho phép Admin Tổng (Superadmin)
// Dùng SAU verifyToken
// ─────────────────────────────────────────────────────────
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.vai_tro !== 'Admin Tổng') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền. Chỉ Admin Tổng mới được thực hiện thao tác này!'
    })
  }
  next()
}

module.exports = { verifyToken, requireAdmin, requireSuperAdmin }
