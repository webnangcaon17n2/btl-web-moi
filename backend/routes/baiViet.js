const express = require('express')
const router = express.Router()
const { query } = require('../db')

// GET /api/bai-viet - Lấy tất cả bài viết đã xuất bản
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT bv.id, bv.ma_bai_viet, bv.tieu_de, bv.duong_dan_seo, 
             bv.tom_tat, bv.anh_bia, bv.trang_thai, bv.ngay_tao,
             dB.ten AS danh_muc, n.ho_ten AS tac_gia
      FROM BaiViet bv
      LEFT JOIN DanhMucBlog dB ON bv.id_danh_muc = dB.id
      LEFT JOIN NguoiDung n ON bv.id_tac_gia = n.id
      WHERE bv.trang_thai = N'Đã xuất bản'
      ORDER BY bv.ngay_tao DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy bài viết' })
  }
})

// GET /api/bai-viet/all - Lấy tất cả (Admin - bao gồm cả nháp)
router.get('/all', async (req, res) => {
  try {
    const result = await query(`
      SELECT bv.*, dB.ten AS danh_muc, n.ho_ten AS tac_gia
      FROM BaiViet bv
      LEFT JOIN DanhMucBlog dB ON bv.id_danh_muc = dB.id
      LEFT JOIN NguoiDung n ON bv.id_tac_gia = n.id
      ORDER BY bv.ngay_tao DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy bài viết' })
  }
})

// POST /api/bai-viet - Tạo bài viết mới (Admin)
router.post('/', async (req, res) => {
  const { ma_bai_viet, tieu_de, duong_dan_seo, id_danh_muc, id_tac_gia, tom_tat, noi_dung, anh_bia, trang_thai } = req.body
  try {
    await query(`
      INSERT INTO BaiViet (ma_bai_viet, tieu_de, duong_dan_seo, id_danh_muc, id_tac_gia, tom_tat, noi_dung, anh_bia, trang_thai)
      VALUES (@ma_bai_viet, @tieu_de, @duong_dan_seo, @id_danh_muc, @id_tac_gia, @tom_tat, @noi_dung, @anh_bia, @trang_thai)
    `, { ma_bai_viet, tieu_de, duong_dan_seo, id_danh_muc: id_danh_muc || null, id_tac_gia: id_tac_gia || null, tom_tat: tom_tat || '', noi_dung: noi_dung || '', anh_bia: anh_bia || '', trang_thai: trang_thai || 'Bản nháp' })
    res.status(201).json({ message: 'Đã tạo bài viết!' })
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo bài viết' })
  }
})

// PUT /api/bai-viet/:id - Cập nhật bài viết
router.put('/:id', async (req, res) => {
  const { tieu_de, tom_tat, noi_dung, anh_bia, trang_thai } = req.body
  try {
    await query(`
      UPDATE BaiViet SET tieu_de=@tieu_de, tom_tat=@tom_tat, noi_dung=@noi_dung, 
        anh_bia=@anh_bia, trang_thai=@trang_thai, ngay_cap_nhat=GETDATE()
      WHERE id=@id
    `, { tieu_de, tom_tat, noi_dung, anh_bia, trang_thai, id: req.params.id })
    res.json({ message: 'Cập nhật bài viết thành công!' })
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật bài viết' })
  }
})

module.exports = router
