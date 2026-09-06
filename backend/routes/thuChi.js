
const express = require('express')
const router = express.Router()
const { query } = require('../db')

// GET /api/thu-chi - Lấy tất cả giao dịch
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, ma_giao_dich, loai, danh_muc, mo_ta, so_tien, ngay_giao_dich, ghi_chu, ngay_tao
      FROM ThuChi
      ORDER BY ngay_giao_dich DESC, ngay_tao DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    console.error('Lỗi lấy thu chi:', err)
    res.status(500).json({ error: 'Lỗi lấy danh sách thu chi' })
  }
})

// POST /api/thu-chi - Thêm giao dịch mới
router.post('/', async (req, res) => {
  const { loai, danh_muc, mo_ta, so_tien, ngay_giao_dich, ghi_chu } = req.body
  if (!mo_ta || !so_tien || !loai) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' })
  }
  try {
    const prefix = loai === 'Thu' ? 'TN' : 'TC'
    const ma = prefix + String(Date.now()).slice(-6) + Math.random().toString(36).slice(-2).toUpperCase()
    const result = await query(`
      INSERT INTO ThuChi (ma_giao_dich, loai, danh_muc, mo_ta, so_tien, ngay_giao_dich, ghi_chu)
      OUTPUT INSERTED.*
      VALUES (@ma, @loai, @danh_muc, @mo_ta, @so_tien, @ngay, @ghi_chu)
    `, {
      ma,
      loai,
      danh_muc: danh_muc || 'Khác',
      mo_ta,
      so_tien: Number(so_tien),
      ngay: ngay_giao_dich || new Date().toISOString().split('T')[0],
      ghi_chu: ghi_chu || ''
    })
    res.status(201).json(result.recordset[0])
  } catch (err) {
    console.error('Lỗi thêm thu chi:', err)
    res.status(500).json({ error: 'Lỗi thêm giao dịch' })
  }
})

// PUT /api/thu-chi/:id - Cập nhật giao dịch
router.put('/:id', async (req, res) => {
  const { loai, danh_muc, mo_ta, so_tien, ngay_giao_dich, ghi_chu } = req.body
  try {
    await query(`
      UPDATE ThuChi SET
        loai = @loai,
        danh_muc = @danh_muc,
        mo_ta = @mo_ta,
        so_tien = @so_tien,
        ngay_giao_dich = @ngay,
        ghi_chu = @ghi_chu
      WHERE id = @id
    `, {
      id: req.params.id,
      loai,
      danh_muc: danh_muc || 'Khác',
      mo_ta,
      so_tien: Number(so_tien),
      ngay: ngay_giao_dich,
      ghi_chu: ghi_chu || ''
    })
    res.json({ message: 'Cập nhật thành công' })
  } catch (err) {
    console.error('Lỗi sửa thu chi:', err)
    res.status(500).json({ error: 'Lỗi cập nhật giao dịch' })
  }
})

// DELETE /api/thu-chi/:id - Xóa giao dịch
router.delete('/:id', async (req, res) => {
  try {
    await query(`DELETE FROM ThuChi WHERE id = @id`, { id: req.params.id })
    res.json({ message: 'Đã xóa giao dịch' })
  } catch (err) {
    console.error('Lỗi xóa thu chi:', err)
    res.status(500).json({ error: 'Lỗi xóa giao dịch' })
  }
})

module.exports = router
