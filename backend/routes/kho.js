const express = require('express')
const router = express.Router()
const { query } = require('../db')

// GET /api/kho - Lấy tồn kho (Admin InventoryManager)
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT s.id AS ProductID, s.ma_sku, s.ten_san_pham AS Name,
             d.ten_danh_muc AS Category, s.don_vi AS Unit,
             s.so_luong_kho AS Stock, s.so_luong_toi_thieu AS MinStock,
             s.gia_nhap AS ImportPrice, s.gia_ban AS SellPrice,
             s.ngay_nhap_cuoi AS LastImport, s.trang_thai
      FROM SanPham s
      LEFT JOIN DanhMuc d ON s.id_danh_muc = d.id
      ORDER BY s.so_luong_kho ASC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy dữ liệu kho' })
  }
})

// PATCH /api/kho/:id - Cập nhật tồn kho
router.patch('/:id', async (req, res) => {
  const { so_luong_kho } = req.body
  try {
    await query(`
      UPDATE SanPham SET so_luong_kho=@so_luong_kho, ngay_nhap_cuoi=GETDATE() WHERE id=@id
    `, { so_luong_kho, id: req.params.id })
    res.json({ message: 'Cập nhật tồn kho thành công!' })
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật kho' })
  }
})

module.exports = router
