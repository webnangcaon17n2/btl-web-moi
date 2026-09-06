const express = require('express')
const router = express.Router()
const { query } = require('../db')

// GET /api/danh-gia - Lấy tất cả đánh giá (Admin)
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT dg.id, dg.so_sao, dg.noi_dung, dg.ngay_viet,
             n.ho_ten AS ten_khach, n.vai_tro,
             sp.ten_san_pham
      FROM DanhGia dg
      INNER JOIN NguoiDung n ON dg.id_nguoi_dung = n.id
      INNER JOIN SanPham sp ON dg.id_san_pham = sp.id
      ORDER BY dg.ngay_viet DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy đánh giá' })
  }
})

// DELETE /api/danh-gia/:id - Xóa đánh giá (Admin)
router.delete('/:id', async (req, res) => {
  try {
    await query(`DELETE FROM DanhGia WHERE id = @id`, { id: req.params.id })
    res.json({ message: 'Đã xóa đánh giá!' })
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa đánh giá' })
  }
})

// GET /api/danh-gia/:id_san_pham - Lấy đánh giá của 1 sản phẩm
router.get('/:id_san_pham', async (req, res) => {
  try {
    const result = await query(`
      SELECT dg.*, n.ho_ten, n.anh_dai_dien
      FROM DanhGia dg
      INNER JOIN NguoiDung n ON dg.id_nguoi_dung = n.id
      WHERE dg.id_san_pham = @id
      ORDER BY dg.ngay_viet DESC
    `, { id: req.params.id_san_pham })
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy đánh giá' })
  }
})

// POST /api/danh-gia - Gửi đánh giá
router.post('/', async (req, res) => {
  const { id_san_pham, id_nguoi_dung, so_sao, noi_dung } = req.body
  try {
    await query(`
      INSERT INTO DanhGia (id_san_pham, id_nguoi_dung, so_sao, noi_dung)
      VALUES (@id_san_pham, @id_nguoi_dung, @so_sao, @noi_dung)
    `, { id_san_pham, id_nguoi_dung, so_sao, noi_dung: noi_dung || '' })

    // Cập nhật điểm trung bình
    await query(`
      UPDATE SanPham SET
        diem_danh_gia_tb = (SELECT AVG(CAST(so_sao AS FLOAT)) FROM DanhGia WHERE id_san_pham = @id),
        tong_luot_danh_gia = (SELECT COUNT(*) FROM DanhGia WHERE id_san_pham = @id)
      WHERE id = @id
    `, { id: id_san_pham })
    res.status(201).json({ message: 'Cảm ơn bạn đã đánh giá!' })
  } catch (err) {
    res.status(500).json({ error: 'Lỗi gửi đánh giá' })
  }
})

module.exports = router
