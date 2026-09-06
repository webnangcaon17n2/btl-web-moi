const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * @route   GET /api/experts
 * @desc    Lấy danh sách các chuyên gia
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const sql = 'SELECT * FROM ChuyenGia ORDER BY id ASC';
        const experts = await query(sql);
        res.json({
            success: true,
            data: experts.recordset
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách chuyên gia.'
        });
    }
});

/**
 * @route   POST /api/experts
 * @desc    Thêm chuyên gia mới
 */
router.post('/', async (req, res) => {
    const { ho_ten, vai_tro, hinh_anh, mo_ta, kinh_nghiem, chuyen_mon, email, social_fb, social_ig } = req.body;
    try {
        const sql = `
            INSERT INTO ChuyenGia (ho_ten, vai_tro, hinh_anh, mo_ta, kinh_nghiem, chuyen_mon, email, social_fb, social_ig) 
            VALUES (@ho_ten, @vai_tro, @hinh_anh, @mo_ta, @kinh_nghiem, @chuyen_mon, @email, @social_fb, @social_ig)
        `;
        await query(sql, { ho_ten, vai_tro, hinh_anh, mo_ta, kinh_nghiem, chuyen_mon, email, social_fb, social_ig });
        res.json({ success: true, message: 'Thêm chuyên gia thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /api/experts/:id
 * @desc    Cập nhật thông tin chuyên gia
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { ho_ten, vai_tro, hinh_anh, mo_ta, kinh_nghiem, chuyen_mon, email, social_fb, social_ig } = req.body;
    try {
        const sql = `
            UPDATE ChuyenGia SET 
                ho_ten = @ho_ten, vai_tro = @vai_tro, hinh_anh = @hinh_anh, mo_ta = @mo_ta, 
                kinh_nghiem = @kinh_nghiem, chuyen_mon = @chuyen_mon, email = @email, 
                social_fb = @social_fb, social_ig = @social_ig 
            WHERE id = @id
        `;
        await query(sql, { id, ho_ten, vai_tro, hinh_anh, mo_ta, kinh_nghiem, chuyen_mon, email, social_fb, social_ig });
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /api/experts/:id
 * @desc    Xóa chuyên gia
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sql = 'DELETE FROM ChuyenGia WHERE id = @id';
        await query(sql, { id });
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
