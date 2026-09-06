const express = require('express')
const router = express.Router()
const { query } = require('../db')

// GET /api/nguoi-dung - Lấy danh sách user (Admin) kèm số đơn hàng và tổng chi
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        n.id, n.email, n.ho_ten, n.so_dien_thoai, n.vai_tro, n.dang_hoat_dong, n.ngay_tao,
        COUNT(d.id) AS so_don_hang,
        ISNULL(SUM(d.tong_tien_hang), 0) AS tong_chi_tieu
      FROM NguoiDung n
      LEFT JOIN DonHang d ON d.id_nguoi_dung = n.id
      GROUP BY n.id, n.email, n.ho_ten, n.so_dien_thoai, n.vai_tro, n.dang_hoat_dong, n.ngay_tao
      ORDER BY n.ngay_tao DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách người dùng' })
  }
})

// POST /api/nguoi-dung/dang-ky - Đăng ký
router.post('/dang-ky', async (req, res) => {
  const { email, mat_khau_hash, ho_ten, so_dien_thoai } = req.body
  try {
    await query(`
      INSERT INTO NguoiDung (email, mat_khau_hash, ho_ten, so_dien_thoai)
      VALUES (@email, @mat_khau_hash, @ho_ten, @so_dien_thoai)
    `, { email, mat_khau_hash, ho_ten, so_dien_thoai: so_dien_thoai || null })
    res.status(201).json({ message: 'Đăng ký thành công!' })
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email đã tồn tại!' })
    res.status(500).json({ error: 'Lỗi đăng ký' })
  }
})

// POST /api/nguoi-dung/dang-nhap - Đăng nhập
router.post('/dang-nhap', async (req, res) => {
  const { email, mat_khau_hash } = req.body
  try {
    const result = await query(`
      SELECT id, email, ho_ten, vai_tro, anh_dai_dien 
      FROM NguoiDung 
      WHERE email=@email AND mat_khau_hash=@mat_khau_hash AND dang_hoat_dong=1
    `, { email, mat_khau_hash })
    if (!result.recordset.length) return res.status(401).json({ error: 'Sai email hoặc mật khẩu!' })
    res.json({ message: 'Đăng nhập thành công!', user: result.recordset[0] })
  } catch (err) {
    res.status(500).json({ error: 'Lỗi đăng nhập' })
  }
})

// GET /api/nguoi-dung/profile/:id - Lấy hồ sơ cá nhân
router.get('/profile/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, ho_ten, so_dien_thoai, dia_chi, anh_dai_dien, so_cccd, ngay_sinh, gioi_tinh, que_quan 
      FROM NguoiDung WHERE id = @id
    `, { id: req.params.id })
    if (!result.recordset.length) return res.status(404).json({ error: 'Không tìm thấy người dùng' })
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy hồ sơ' })
  }
})

// PUT /api/nguoi-dung/profile/:id - Cập nhật hồ sơ
router.put('/profile/:id', async (req, res) => {
  const { ho_ten, so_dien_thoai, dia_chi, anh_dai_dien, so_cccd, ngay_sinh, gioi_tinh, que_quan } = req.body
  try {
    // Không lưu Base64 vào DB (quá lớn), chỉ lưu nếu là URL
    const anhToSave = (anh_dai_dien && !anh_dai_dien.startsWith('data:')) ? anh_dai_dien : null

    await query(`
      UPDATE NguoiDung SET
        ho_ten         = CASE WHEN @ho_ten IS NOT NULL THEN @ho_ten ELSE ho_ten END,
        so_dien_thoai  = CASE WHEN @so_dien_thoai IS NOT NULL THEN @so_dien_thoai ELSE so_dien_thoai END,
        dia_chi        = CASE WHEN @dia_chi IS NOT NULL THEN @dia_chi ELSE dia_chi END,
        anh_dai_dien   = CASE WHEN @anh_dai_dien IS NOT NULL THEN @anh_dai_dien ELSE anh_dai_dien END,
        so_cccd        = CASE WHEN @so_cccd IS NOT NULL THEN @so_cccd ELSE so_cccd END,
        ngay_sinh      = CASE WHEN @ngay_sinh IS NOT NULL THEN @ngay_sinh ELSE ngay_sinh END,
        gioi_tinh      = CASE WHEN @gioi_tinh IS NOT NULL THEN @gioi_tinh ELSE gioi_tinh END,
        que_quan       = CASE WHEN @que_quan IS NOT NULL THEN @que_quan ELSE que_quan END
      WHERE id = @id
    `, {
      id: req.params.id,
      ho_ten:         ho_ten          ? ho_ten.trim()          : null,
      so_dien_thoai:  so_dien_thoai   ? so_dien_thoai.replace(/\s/g, '') : null,
      dia_chi:        dia_chi         ? dia_chi.trim()         : null,
      anh_dai_dien:   anhToSave,
      so_cccd:        so_cccd         ? so_cccd.trim()         : null,
      ngay_sinh:      ngay_sinh       ? ngay_sinh              : null,
      gioi_tinh:      gioi_tinh       ? gioi_tinh              : null,
      que_quan:       que_quan        ? que_quan.trim()        : null,
    })
    res.json({ message: 'Cập nhật hồ sơ thành công!' })
  } catch (err) {
    console.error('Lỗi cập nhật hồ sơ:', err)
    res.status(500).json({ error: 'Lỗi cập nhật hồ sơ: ' + err.message })
  }
})

// GET /api/nguoi-dung/addresses - Lấy danh sách địa chỉ của user
router.get('/addresses', async (req, res) => {
  const userId = req.query.userId || 1;
  try {
    const result = await query(`
      SELECT * FROM DiaChiNguoiDung WHERE user_id = @userId
    `, { userId })
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách địa chỉ' })
  }
})

// POST /api/nguoi-dung/addresses - Thêm địa chỉ mới
router.post('/addresses', async (req, res) => {
    const { ho_ten, so_dien_thoai, dia_chi, userId } = req.body;
    const uId = userId || 1;
    try {
        const result = await query(`
            INSERT INTO DiaChiNguoiDung (user_id, ho_ten, so_dien_thoai, dia_chi, is_default)
            OUTPUT INSERTED.*
            VALUES (@uId, @ho_ten, @so_dien_thoai, @dia_chi, 0)
        `, { uId, ho_ten, so_dien_thoai, dia_chi });
        
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi lưu địa chỉ: ' + err.message });
    }
});

// Cập nhật địa chỉ
router.put('/addresses/:id', async (req, res) => {
    const { ho_ten, so_dien_thoai, dia_chi } = req.body;
    try {
        await query(`
            UPDATE DiaChiNguoiDung SET
                ho_ten = @ho_ten,
                so_dien_thoai = @so_dien_thoai,
                dia_chi = @dia_chi
            WHERE id = @id
        `, { id: req.params.id, ho_ten, so_dien_thoai, dia_chi });
        res.json({ message: 'Cập nhật thành công!' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi cập nhật địa chỉ' });
    }
});

// Xóa địa chỉ
router.delete('/addresses/:id', async (req, res) => {
    try {
        await query(`DELETE FROM DiaChiNguoiDung WHERE id = @id`, { id: req.params.id });
        res.json({ message: 'Xóa thành công!' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi xóa địa chỉ' });
    }
});

module.exports = router;
