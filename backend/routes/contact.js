const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/contact
 * @desc    Nhận thông tin liên hệ từ khách hàng
 * @access  Public
 */
router.post('/', async (req, res) => {
    const { ho_ten, email, tin_nhan } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào (Validation)
    if (!ho_ten || !email || !tin_nhan) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng điền đầy đủ các trường: Họ tên, Email và Tin nhắn.'
        });
    }

    // Kiểm tra định dạng email bằng regex đơn giản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Định dạng email không hợp lệ.'
        });
    }

    try {
        // 2. Lưu vào cơ sở dữ liệu (Bảng Phản hồi trải nghiệm người dùng)
        const sql = `
            INSERT INTO PhanHoiKhachHang (ho_ten, email, tin_nhan, so_sao, ngay_gui, trang_thai)
            VALUES (@ho_ten, @email, @tin_nhan, @so_sao, GETUTCDATE(), N'Chờ phản hồi')
        `;

        await query(sql, { ho_ten, email, tin_nhan, so_sao: req.body.so_sao || 5 });

        // 3. Trả về phản hồi thành công
        res.status(201).json({
            success: true,
            message: 'Gửi đánh giá thành công! Cảm ơn bạn đã chia sẻ trải nghiệm với Aether.'
        });
    } catch (error) {
        console.error('Lỗi khi lưu thông tin liên hệ:', error);
        res.status(500).json({
            success: false,
            message: 'Đã có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.'
        });
    }
});

/**
 * @route   GET /api/contact/admin
 * @desc    Lấy tất cả phản hồi khách hàng (Dành cho Admin)
 */
router.get('/admin', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await query('SELECT * FROM PhanHoiKhachHang ORDER BY ngay_gui DESC');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /api/contact/:id/respond
 * @desc    Admin phản hồi lại khách hàng
 */
router.post('/:id/respond', verifyToken, requireAdmin, async (req, res) => {
    const { phan_hoi_admin } = req.body;
    const { id } = req.params;

    if (!phan_hoi_admin) {
        return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' });
    }

    try {
        await query(`
            UPDATE PhanHoiKhachHang 
            SET phan_hoi_admin = @phan_hoi_admin, 
                trang_thai = N'Đã phản hồi',
                ngay_phan_hoi = GETUTCDATE()
            WHERE id = @id
        `, { phan_hoi_admin, id });

        // --- GỬI THÔNG BÁO CHO NGƯỜI DÙNG NẾU HỌ CÓ TÀI KHOẢN ---
        const feedback = await query('SELECT email FROM PhanHoiKhachHang WHERE id = @id', { id });
        if (feedback.recordset.length > 0) {
            const userEmail = feedback.recordset[0].email;
            const user = await query('SELECT id FROM NguoiDung WHERE email = @userEmail', { userEmail });
            
            if (user.recordset.length > 0) {
                await query(`
                    INSERT INTO ThongBao (id_nguoi_dung, tieu_de, noi_dung, loai, ngay_tao)
                    VALUES (@userId, N'Admin đã phản hồi', N'Chúng tôi đã trả lời tin nhắn của bạn. Click để xem chi tiết.', @loai, GETUTCDATE())
                `, { userId: user.recordset[0].id, loai: `PhanHoi:${id}` });
            }
        }

        res.json({ success: true, message: 'Đã gửi phản hồi thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/contact/feedback/:id
 * @desc    Lấy chi tiết phản hồi theo ID cho người dùng hiện tại
 */
router.get('/feedback/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Lấy email của user hiện tại
        const userEmail = req.user.email;
        
        // Chỉ cho phép lấy nếu email trong phản hồi trùng với email user đang đăng nhập
        const result = await query('SELECT * FROM PhanHoiKhachHang WHERE id = @id AND email = @email', { id, email: userEmail });
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phản hồi hoặc bạn không có quyền xem' });
        }
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/contact/testimonials
 * @desc    Lấy các đánh giá tiêu biểu cho trang chủ
 */
router.get('/testimonials', async (req, res) => {
    try {
        const result = await query('SELECT TOP 3 ho_ten, tin_nhan, so_sao, ngay_gui FROM PhanHoiKhachHang ORDER BY ngay_gui DESC');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/contact/all-testimonials
 * @desc    Lấy tất cả đánh giá cho trang Review
 */
router.get('/all-testimonials', async (req, res) => {
    try {
        const result = await query('SELECT ho_ten, tin_nhan, so_sao, ngay_gui FROM PhanHoiKhachHang ORDER BY ngay_gui DESC');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
