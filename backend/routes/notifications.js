const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/notifications/admin
 * @desc    Tổng hợp các thông báo live cho Quản trị viên từ cơ sở dữ liệu
 * @access  Private (Admin Only)
 */
router.get('/admin', verifyToken, requireAdmin, async (req, res) => {
    try {
        // 1. Quét Đơn hàng mới (Chờ xác nhận, Chờ thanh toán)
        const ordersRes = await query(`
            SELECT id, ngay_dat, trang_thai_don_hang 
            FROM DonHang 
            WHERE trang_thai_don_hang IN (N'Chờ xác nhận', N'Chờ thanh toán')
            ORDER BY ngay_dat DESC
        `);

        // 2. Quét Sản phẩm sắp hết hàng (so_luong_kho <= so_luong_toi_thieu)
        const stockRes = await query(`
            SELECT id, ten_san_pham, so_luong_kho 
            FROM SanPham 
            WHERE so_luong_kho <= so_luong_toi_thieu 
            ORDER BY so_luong_kho ASC
        `);

        // 3. Quét Phản hồi khách hàng (Chờ phản hồi)
        const feedbackRes = await query(`
            SELECT id, ho_ten, ngay_gui 
            FROM PhanHoiKhachHang 
            WHERE trang_thai = N'Chờ phản hồi' 
            ORDER BY ngay_gui DESC
        `);

        // 4. Quét Đánh giá sản phẩm mới nhất (Top 5 đánh giá mới nhất)
        const reviewsRes = await query(`
            SELECT TOP 5 dg.id, dg.so_sao, nd.ho_ten, sp.ten_san_pham, dg.ngay_viet 
            FROM DanhGia dg
            INNER JOIN NguoiDung nd ON dg.id_nguoi_dung = nd.id
            INNER JOIN SanPham sp ON dg.id_san_pham = sp.id
            ORDER BY dg.ngay_viet DESC
        `);

        // --- MAP VÀ ĐỊNH DẠNG DỮ LIỆU ĐỒNG NHẤT ---
        const orderNotifications = ordersRes.recordset.map(item => ({
            id: `order-${item.id}`,
            type: 'order',
            text: `Đơn hàng mới #${item.id} cần xác nhận`,
            time: item.ngay_dat,
            unread: true,
            link: '/admin/orders'
        }));

        const stockNotifications = stockRes.recordset.map(item => ({
            id: `stock-${item.id}`,
            type: 'stock',
            text: `Sản phẩm "${item.ten_san_pham}" sắp hết hàng (còn ${item.so_luong_kho})`,
            time: new Date(),
            unread: true,
            link: '/admin/inventory'
        }));

        const feedbackNotifications = feedbackRes.recordset.map(item => ({
            id: `feedback-${item.id}`,
            type: 'feedback',
            text: `Phản hồi mới từ ${item.ho_ten} cần trả lời`,
            time: item.ngay_gui,
            unread: true,
            link: '/admin/feedbacks'
        }));

        const reviewNotifications = reviewsRes.recordset.map(item => {
            const isRecent = (new Date() - new Date(item.ngay_viet)) < 48 * 60 * 60 * 1000;
            return {
                id: `review-${item.id}`,
                type: 'review',
                text: `Đánh giá ${item.so_sao} sao từ ${item.ho_ten} cho "${item.ten_san_pham}"`,
                time: item.ngay_viet,
                unread: isRecent,
                link: '/admin/reviews'
            };
        });

        // Ghép tất cả các loại thông báo lại
        let allNotifications = [
            ...orderNotifications,
            ...stockNotifications,
            ...feedbackNotifications,
            ...reviewNotifications
        ];

        // Sắp xếp theo thứ tự thời gian giảm dần
        allNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        // Trả về Top 15 thông báo nổi bật nhất
        res.json({
            success: true,
            data: allNotifications.slice(0, 15)
        });

    } catch (error) {
        console.error('❌ Lỗi lấy thông báo admin:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/notifications
 * @desc    Lấy danh sách thông báo của người dùng hiện tại
 * @access  Private
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const sql = `
            SELECT * FROM ThongBao 
            WHERE id_nguoi_dung = @id_user 
            ORDER BY ngay_tao DESC
        `;
        const result = await query(sql, { id_user: req.user.id });
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Đánh dấu tất cả thông báo là đã đọc
 */
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        const sql = 'UPDATE ThongBao SET da_doc = 1 WHERE id_nguoi_dung = @id_user';
        await query(sql, { id_user: req.user.id });
        res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Đánh dấu một thông báo là đã đọc
 */
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const sql = 'UPDATE ThongBao SET da_doc = 1 WHERE id = @id AND id_nguoi_dung = @id_user';
        await query(sql, { id: req.params.id, id_user: req.user.id });
        res.json({ success: true, message: 'Đã đọc thông báo' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
