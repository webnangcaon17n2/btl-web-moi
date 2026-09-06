const express = require('express')
const router = express.Router()
const { query } = require('../db')

// GET /api/danh-muc - Lấy danh sách danh mục và số lượng sản phẩm mỗi loại
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        d.id, 
        d.ten_danh_muc, 
        d.duong_dan_seo,
        COUNT(s.id) AS so_luong_sp
      FROM DanhMuc d
      LEFT JOIN SanPham s ON d.id = s.id_danh_muc
      GROUP BY d.id, d.ten_danh_muc, d.duong_dan_seo
      ORDER BY d.id ASC
    `)
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Lỗi lấy danh sách danh mục' })
  }
})

module.exports = router
