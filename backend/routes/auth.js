const express = require('express')
const router  = express.Router()
const bcrypt  = require('bcrypt')
const jwt     = require('jsonwebtoken')
const { query } = require('../db')

const SALT_ROUNDS = 10
const JWT_SECRET  = process.env.JWT_SECRET || 'aether_secret_key_change_in_prod'
const JWT_EXPIRES = '24h'

// ─────────────────────────────────────────────────
// POST /api/auth/register  – Đăng ký tài khoản mới
// ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, mat_khau, ho_ten, so_dien_thoai } = req.body

  // 1. Validate đầu vào
  if (!email || !mat_khau || !ho_ten) {
    return res.status(400).json({
      success: false,
      message: 'Email, mật khẩu và họ tên là bắt buộc!'
    })
  }

  if (mat_khau.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu phải có ít nhất 6 ký tự!'
    })
  }

  try {
    // 2. Kiểm tra email đã tồn tại chưa
    const existCheck = await query(
      `SELECT id FROM NguoiDung WHERE email = @email`,
      { email }
    )

    if (existCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký. Vui lòng dùng email khác!'
      })
    }

    // 3. Hash mật khẩu bằng bcrypt
    const mat_khau_hash = await bcrypt.hash(mat_khau, SALT_ROUNDS)

    // 4. Lưu user mới vào database
    const insertResult = await query(
      `INSERT INTO NguoiDung (email, mat_khau_hash, ho_ten, so_dien_thoai)
       OUTPUT INSERTED.id, INSERTED.email, INSERTED.ho_ten, INSERTED.vai_tro
       VALUES (@email, @mat_khau_hash, @ho_ten, @so_dien_thoai)`,
      {
        email,
        mat_khau_hash,
        ho_ten,
        so_dien_thoai: so_dien_thoai || null
      }
    )

    const newUser = insertResult.recordset[0]

    // 5. Tạo JWT token ngay sau khi đăng ký (tự động đăng nhập)
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, vai_tro: newUser.vai_tro },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    )

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      token,
      user: {
        id:      newUser.id,
        email:   newUser.email,
        ho_ten:  newUser.ho_ten,
        vai_tro: newUser.vai_tro
      }
    })

  } catch (err) {
    console.error('[Auth/Register] Error:', err.message)
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng ký!',
      detail:  err.message
    })
  }
})

// ─────────────────────────────────────────────────
// POST /api/auth/login  – Đăng nhập chung
// (Dùng cho cả khách hàng và Admin)
// ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, mat_khau } = req.body

  // 1. Validate đầu vào
  if (!email || !mat_khau) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập email và mật khẩu!'
    })
  }

  try {
    // 2. Tìm user theo email (kèm trạng thái hoạt động)
    const result = await query(
      `SELECT id, email, ho_ten, mat_khau_hash, vai_tro, anh_dai_dien, dang_hoat_dong
       FROM NguoiDung
       WHERE email = @email`,
      { email }
    )

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng!'
      })
    }

    const user = result.recordset[0]

    // 3. Kiểm tra tài khoản bị khóa
    if (!user.dang_hoat_dong) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ!'
      })
    }

    // 4. So sánh mật khẩu nhập vào với hash trong DB
    const isMatch = await bcrypt.compare(mat_khau, user.mat_khau_hash)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng!'
      })
    }

    // 5. Kiểm tra quyền Admin để báo lời chào phù hợp
    const VAI_TRO_ADMIN = ['Admin', 'Admin Tổng']
    const laAdmin = VAI_TRO_ADMIN.includes(user.vai_tro)

    // 6. Tạo JWT token (Thời hạn 24h)
    const token = jwt.sign(
      { id: user.id, email: user.email, vai_tro: user.vai_tro },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    )

    return res.status(200).json({
      success: true,
      message: laAdmin ? `Chào mừng Admin ${user.ho_ten}!` : 'Đăng nhập thành công!',
      token,
      user: {
        id:          user.id,
        email:       user.email,
        ho_ten:      user.ho_ten,
        vai_tro:     user.vai_tro,
        anh_dai_dien: user.anh_dai_dien,
        la_admin:    laAdmin // Flag để frontend dễ dàng điều hướng
      }
    })

  } catch (err) {
    console.error('[Auth/Login] Error:', err.message)
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng nhập!',
      detail:  err.message
    })
  }
})

// ─────────────────────────────────────────────────
// GET /api/auth/me  – Lấy thông tin user từ token
// ─────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập. Vui lòng cung cấp token!'
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    const result = await query(
      `SELECT id, email, ho_ten, vai_tro, anh_dai_dien, so_dien_thoai, ngay_tao
       FROM NguoiDung WHERE id = @id AND dang_hoat_dong = 1`,
      { id: decoded.id }
    )

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' })
    }

    const user = result.recordset[0]
    const VAI_TRO_ADMIN = ['Admin', 'Admin Tổng']

    return res.json({ 
      success: true, 
      user: {
        ...user,
        la_admin: VAI_TRO_ADMIN.includes(user.vai_tro)
      }
    })

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn!'
    })
  }
})

module.exports = router
