const express = require('express')
const router = express.Router()
const { sql, getPool, query } = require('../db')
const { verifyToken } = require('../middleware/authMiddleware')
const { PayOS } = require("@payos/node");

// Khởi tạo PayOS an toàn (Bản 2.x dùng Object)
let payos = null;
try {
  if (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) {
    payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID,
      apiKey: process.env.PAYOS_API_KEY,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY
    });
    console.log("✅ PayOS v2 đã được khởi tạo.");
  } else {
    console.warn("⚠️ Cảnh báo: Thiếu cấu hình PayOS trong .env");
  }
} catch (err) {
  console.error("❌ Lỗi khởi tạo PayOS:", err.message);
}

// ─────────────────────────────────────────────────
// 1. [ADMIN] GET /api/don-hang - Lấy tất cả đơn hàng
// ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        d.*, 
        n.ho_ten AS ten_khach, 
        n.email,
        n.so_dien_thoai,
        (
          SELECT STRING_AGG(s.ten_san_pham, ', ')
          FROM ChiTietDonHang c
          INNER JOIN SanPham s ON c.id_san_pham = s.id
          WHERE c.id_don_hang = d.id
        ) AS ten_san_pham_list
      FROM DonHang d
      INNER JOIN NguoiDung n ON d.id_nguoi_dung = n.id
      ORDER BY d.ngay_dat DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách đơn hàng' })
  }
})

// ─────────────────────────────────────────────────
// 2. GET /api/don-hang/my-orders - Xem lịch sử đơn hàng của tôi
// ─────────────────────────────────────────────────
router.get('/my-orders', verifyToken, async (req, res) => {
  const userId = req.user.id
  try {
    const result = await query(`
      SELECT * FROM DonHang 
      WHERE id_nguoi_dung = @userId 
      ORDER BY ngay_dat DESC
    `, { userId })

    let orders = result.recordset;

    res.json(orders)
  } catch (err) {
    console.error('Fetch My Orders Error:', err)
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng' })
  }
})

// ─────────────────────────────────────────────────
// 2. [USER] POST /api/don-hang/checkout
// Xử lý thanh toán đơn hàng với Transaction
// ─────────────────────────────────────────────────
router.post('/checkout', verifyToken, async (req, res) => {
  const { cartItems, totalAmount, dia_chi, phuong_thuc_thanh_toan } = req.body
  const userId = req.user.id

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống!' })
  }

  if (!dia_chi) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ giao hàng!' })
  }

  const pool = await getPool()
  const transaction = new sql.Transaction(pool)

  try {
    await transaction.begin()

    const orderRequest = new sql.Request(transaction)
    orderRequest.input('userId', sql.Int, userId)
    orderRequest.input('totalAmount', sql.Decimal(18, 2), totalAmount)
    orderRequest.input('address', sql.NVarChar(500), dia_chi)
    orderRequest.input('paymentMethod', sql.NVarChar(50), phuong_thuc_thanh_toan || 'COD')

    // Nếu là chuyển khoản thì để 'Chờ thanh toán', nếu là COD thì để 'Chờ xác nhận'
    const initialStatus = phuong_thuc_thanh_toan === 'Chuyển khoản' ? 'Chờ thanh toán' : 'Chờ xác nhận';
    orderRequest.input('status', sql.NVarChar(50), initialStatus);

    const orderResult = await orderRequest.query(`
      INSERT INTO DonHang (id_nguoi_dung, tong_tien_hang, dia_chi_giao_hang, phuong_thuc_thanh_toan, trang_thai_don_hang, ngay_dat)
      OUTPUT INSERTED.id
      VALUES (@userId, @totalAmount, @address, @paymentMethod, @status, GETUTCDATE())
    `);

    const orderId = orderResult.recordset[0].id;

    for (const item of cartItems) {
      // ── Kiểm tra & trừ tồn kho (dùng WITH (UPDLOCK) để tránh race condition) ──
      const stockRequest = new sql.Request(transaction)
      stockRequest.input('productId', sql.Int, item.id)
      stockRequest.input('quantity', sql.Int, item.quantity)

      const stockResult = await stockRequest.query(`
        SELECT ten_san_pham, so_luong_kho
        FROM SanPham WITH (UPDLOCK)
        WHERE id = @productId
      `)

      if (stockResult.recordset.length === 0) {
        await transaction.rollback()
        return res.status(400).json({ success: false, message: `Sản phẩm ID ${item.id} không tồn tại!` })
      }

      const { ten_san_pham, so_luong_kho } = stockResult.recordset[0]
      if (so_luong_kho < item.quantity) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${ten_san_pham}" không đủ hàng! Tồn kho: ${so_luong_kho}, bạn đặt: ${item.quantity}.`
        })
      }

      // Trừ tồn kho
      const deductRequest = new sql.Request(transaction)
      deductRequest.input('productId', sql.Int, item.id)
      deductRequest.input('quantity', sql.Int, item.quantity)
      await deductRequest.query(`
        UPDATE SanPham SET so_luong_kho = so_luong_kho - @quantity WHERE id = @productId
      `)

      // Insert chi tiết đơn hàng
      const itemRequest = new sql.Request(transaction)
      itemRequest.input('orderId', sql.Int, orderId)
      itemRequest.input('productId', sql.Int, item.id)
      itemRequest.input('quantity', sql.Int, item.quantity)
      itemRequest.input('price', sql.Decimal(18, 2), item.gia_ban)

      await itemRequest.query(`
        INSERT INTO ChiTietDonHang (id_don_hang, id_san_pham, so_luong, gia_don_vi)
        VALUES (@orderId, @productId, @quantity, @price)
      `)
    }

    await transaction.commit()

    // --- THÊM THÔNG BÁO TỚI NGƯỜI DÙNG ---
    try {
      const laCK = phuong_thuc_thanh_toan === 'Chuyển khoản'
      const tieuDe = laCK ? `Đơn hàng #${orderId} đang chờ thanh toán` : `Đặt hàng thành công`
      const noiDungCheckout = laCK
        ? `Đơn hàng #${orderId} đã được tạo. Vui lòng hoàn tất thanh toán chuyển khoản để chúng tôi xử lý.`
        : `Đơn hàng #${orderId} của bạn đã được đặt thành công. Phương thức: ${phuong_thuc_thanh_toan || 'COD'}. Chúng tôi sẽ xử lý sớm nhất!`
      await query(`
        INSERT INTO ThongBao (id_nguoi_dung, tieu_de, noi_dung, loai, ngay_tao)
        VALUES (@userId, @tieuDe, @noiDung, 'DonHang', GETUTCDATE())
      `, { userId, tieuDe, noiDung: noiDungCheckout })
    } catch (notifErr) {
      console.error('Lỗi tạo thông báo checkout:', notifErr)
    }

    // --- GHI THU VÀO TU CHI (chỉ khi COD - thanh toán ngay) ---
    if (phuong_thuc_thanh_toan !== 'Chuyển khoản') {
      try {
        const maThu = 'TN' + String(Date.now()).slice(-6) + orderId
        const moTaThu = `Đơn hàng #${orderId} - ${cartItems.map(i => i.ten_san_pham).join(', ')}`
        await query(`
          INSERT INTO ThuChi (ma_giao_dich, loai, danh_muc, mo_ta, so_tien, ngay_giao_dich)
          VALUES (@ma, N'Thu', N'Bán hàng', @moTa, @soTien, CAST(GETUTCDATE() AS DATE))
        `, { ma: maThu, moTa: moTaThu, soTien: totalAmount })
      } catch (thuChiErr) {
        console.error('Lỗi ghi thu chi COD:', thuChiErr)
      }
    }

    // 5. Nếu là chuyển khoản -> Tạo link PayOS
    if (phuong_thuc_thanh_toan === 'Chuyển khoản') {
      if (!payos) {
        return res.status(201).json({
          success: true,
          message: 'Đơn hàng đã tạo nhưng PayOS chưa cấu hình. Vui lòng thanh toán thủ công.',
          orderId
        });
      }

      try {
        const orderCode = Number(orderId.toString() + Date.now().toString().slice(-6));
        
        const body = {
          orderCode: orderCode,
          amount: Number(totalAmount),
          description: `AetherOrder ${orderId}`,
          items: cartItems.map(item => ({
            name: item.ten_san_pham,
            quantity: item.quantity,
            price: Number(item.gia_ban)
          })),
          returnUrl: `http://localhost:5173/my-orders`,
          cancelUrl: `http://localhost:5173/checkout`,
          expiredAt: Math.floor(Date.now() / 1000) + 600
        };

        const paymentLinkResponse = await payos.paymentRequests.create(body);

        // Lưu cả mã, link và QR code vào DB
        await query("UPDATE DonHang SET PayOSOrderCode = @code, PayOSCheckoutUrl = @url, PayOSQrCode = @qrCode WHERE id = @id", { 
          code: paymentLinkResponse.orderCode, 
          url: paymentLinkResponse.checkoutUrl,
          qrCode: paymentLinkResponse.qrCode || '',
          id: orderId 
        });

        return res.status(201).json({
          success: true,
          message: 'Đang chuyển hướng thanh toán...',
          orderId: orderId,
          checkoutUrl: paymentLinkResponse.checkoutUrl
        });
      } catch (payosError) {
        console.error('❌ Lỗi PayOS Checkout:', payosError);
        return res.status(201).json({
          success: true,
          message: 'Lỗi PayOS: ' + payosError.message,
          orderId
        });
      }
    }

    // Nếu là COD
    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công!',
      orderId
    })

  } catch (err) {
    if (transaction) await transaction.rollback()
    console.error('[Checkout Error]:', err.message)
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xử lý thanh toán!',
      detail: err.message
    })
  }
})

// ─────────────────────────────────────────────────
// 3. [ADMIN] PUT /api/don-hang/:id/status - Cập nhật trạng thái
// ─────────────────────────────────────────────────
router.put('/:id/status', async (req, res) => {
  const { status } = req.body
  const id = req.params.id
  console.log(`[Admin] Cập nhật trạng thái đơn hàng ${id} thành: ${status}`)

  try {
    const result = await query(`
      UPDATE DonHang SET trang_thai_don_hang = @status WHERE id = @id
    `, { status, id })

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })
    }

    // --- THÊM THÔNG BÁO CẬP NHẬT TRẠNG THÁI ---
    try {
      const orderInfo = await query("SELECT id_nguoi_dung FROM DonHang WHERE id = @id", { id })
      if (orderInfo.recordset.length > 0) {
        const userId = orderInfo.recordset[0].id_nguoi_dung
        const tieuDeStatus = `Cập nhật đơn hàng #${id}`
        const noiDungStatus = `Đơn hàng #${id} của bạn đã được cập nhật sang trạng thái: "${status}".`
        await query(`
          INSERT INTO ThongBao (id_nguoi_dung, tieu_de, noi_dung, loai, ngay_tao)
          VALUES (@userId, @tieuDe, @noiDung, 'DonHang', GETUTCDATE())
        `, { userId, tieuDe: tieuDeStatus, noiDung: noiDungStatus })
      }
    } catch (notifErr) {
      console.error('Lỗi tạo thông báo cập nhật status:', notifErr)
    }


    res.json({ success: true, message: 'Cập nhật trạng thái thành công' })
  } catch (err) {
    console.error('[Update Status Error]:', err.message)
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái đơn hàng: ' + err.message })
  }
})

// [NEW] GET /api/don-hang/vouchers - Lấy danh sách voucher khả dụng
router.get('/vouchers', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM Vouchers 
      WHERE ngay_bat_dau <= GETDATE() 
      AND ngay_ket_thuc >= GETDATE()
      AND trang_thai = 1
      AND so_luong > 0
      ORDER BY gia_tri DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách voucher' })
  }
})

// [NEW] GET /api/don-hang/checkout-data - Chuẩn bị dữ liệu thanh toán
router.get('/checkout-data', async (req, res) => {
  const userId = req.query.userId || 1;
  try {
    const userRes = await query(
      `SELECT ho_ten, so_dien_thoai, dia_chi, so_cccd, ngay_sinh, gioi_tinh, que_quan
       FROM NguoiDung WHERE id = @userId`,
      { userId }
    )
    const voucherRes = await query(`
      SELECT * FROM Vouchers 
      WHERE ngay_ket_thuc >= GETDATE() AND trang_thai = 1
    `).catch(() => ({ recordset: [] }))

    res.json({
      user: userRes.recordset[0],
      vouchers: voucherRes.recordset,
      shippingFee: 15000,
      deliveryDate: "3-5 ngày làm việc"
    })
  } catch (err) {
    console.error('Lỗi checkout-data:', err.message)
    res.status(500).json({ error: 'Lỗi lấy dữ liệu checkout', detail: err.message })
  }
})

// Kiểm tra mã giảm giá
router.get('/check-voucher', async (req, res) => {
    const { code, totalAmount } = req.query;
    try {
        const result = await query(`
            SELECT * FROM Vouchers 
            WHERE ma_voucher = @code 
            AND ngay_bat_dau <= GETDATE() 
            AND ngay_ket_thuc >= GETDATE()
            AND trang_thai = 1
        `, { code });

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Mã giảm giá không tồn tại hoặc đã hết hạn!' });
        }

        const voucher = result.recordset[0];

        if (totalAmount < voucher.gia_tri_don_hang_toi_thieu) {
            return res.status(400).json({ 
                message: `Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucher.gia_tri_don_hang_toi_thieu)}đ mới được áp dụng mã này!` 
            });
        }

        if (voucher.so_luong <= 0) {
            return res.status(400).json({ message: 'Mã giảm giá này đã hết lượt sử dụng!' });
        }

        res.json(voucher);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server: ' + err.message });
    }
});

// [NEW] GET /api/don-hang/bank-info - Lấy thông tin tài khoản ngân hàng Mặc định của Admin
router.get('/bank-info', async (req, res) => {
  try {
    const result = await query('SELECT TOP 1 * FROM TaiKhoanThuHuong WHERE is_mac_dinh = 1 AND trang_thai = 1');
    if (result.recordset.length === 0) {
      // Nếu không có cái nào mặc định, lấy đại cái nào đang bật
      const fallback = await query('SELECT TOP 1 * FROM TaiKhoanThuHuong WHERE trang_thai = 1');
      if (fallback.recordset.length === 0) {
        return res.status(404).json({ error: 'Chưa cấu hình tài khoản thụ hưởng' });
      }
      return res.json(fallback.recordset[0]);
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy thông tin ngân hàng' });
  }
});

// [NEW] GET /api/don-hang/status/:id - Kiểm tra trạng thái đơn hàng (Dùng cho Polling thanh toán)
router.get('/status/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Kiểm tra trong DB trước
    let result = await query("SELECT trang_thai_don_hang as trang_thai, PaymentStatus as status, PayOSOrderCode FROM DonHang WHERE id = @id", { id });
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    let order = result.recordset[0];
    console.log(`📊 Đang kiểm tra đơn #${id}: Trạng thái DB = ${order.trang_thai}, Code = ${order.PayOSOrderCode}`);

    // 2. Nếu trong DB vẫn là "Chờ thanh toán", hãy hỏi trực tiếp PayOS cho chắc
    if (order.trang_thai === 'Chờ thanh toán' && payos && order.PayOSOrderCode) {
      try {
        console.log(`🔍 Đang hỏi PayOS cho đơn #${id} với mã code: ${order.PayOSOrderCode}`);
        const paymentInfo = await payos.paymentRequests.get(order.PayOSOrderCode);
        console.log(`📡 Phản hồi từ PayOS cho đơn #${id}:`, paymentInfo.status);
        
        if (paymentInfo.status === 'PAID' || paymentInfo.status === 'paid') {
          console.log(`💰 Xác nhận thanh toán THÀNH CÔNG cho đơn #${id}. Đang cập nhật DB...`);
          await query(
            `UPDATE DonHang SET 
              trang_thai_don_hang = N'Chờ xác nhận', 
              PaymentStatus = 'Paid', 
              PaymentDate = GETUTCDATE() 
             WHERE id = @id`, 
            { id }
          );
          order.trang_thai = 'Chờ xác nhận';
          order.status = 'Paid';
          // Gửi thông báo thanh toán thành công
          try {
            const orderInfo = await query('SELECT id_nguoi_dung, tong_tien_hang FROM DonHang WHERE id = @id', { id })
            if (orderInfo.recordset.length > 0) {
              const uid = orderInfo.recordset[0].id_nguoi_dung
              const tongTien = orderInfo.recordset[0].tong_tien_hang
              await query(`
                INSERT INTO ThongBao (id_nguoi_dung, tieu_de, noi_dung, loai, ngay_tao)
                VALUES (@uid, N'Đặt hàng thành công', @msg, 'DonHang', GETUTCDATE())
              `, { uid, msg: `Thanh toán đơn hàng #${id} đã được xác nhận. Chúng tôi sẽ xử lý và giao hàng sớm nhất!` })
              // Ghi thu vào ThuChi khi CK xác nhận qua polling
              const maThu = 'TN' + String(Date.now()).slice(-6) + id
              await query(`
                INSERT INTO ThuChi (ma_giao_dich, loai, danh_muc, mo_ta, so_tien, ngay_giao_dich)
                VALUES (@ma, N'Thu', N'Bán hàng', @moTa, @soTien, CAST(GETUTCDATE() AS DATE))
              `, { ma: maThu, moTa: `Đơn hàng #${id} (Chuyển khoản)`, soTien: tongTien })
            }
          } catch (nErr) { console.error('Lỗi thông báo thanh toán:', nErr) }
        }
      } catch (payosErr) {
        console.error(`❌ Lỗi khi hỏi PayOS cho đơn #${id}:`, payosErr.message);
      }
    }

    res.json(order);
  } catch (err) {
    console.error("Lỗi kiểm tra trạng thái:", err);
    res.status(500).json({ error: 'Lỗi kiểm tra trạng thái đơn hàng' });
  }
});

// [NEW] POST /api/don-hang/create-payment-link - Tạo link thanh toán PayOS
router.post('/create-payment-link', async (req, res) => {
  const { orderId } = req.body;

  try {
    // 1. Lấy thông tin đơn hàng từ DB
    const result = await query("SELECT * FROM DonHang WHERE id = @id", { id: orderId });
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const order = result.recordset[0];
    const totalAmount = order.tong_tien_hang || order.tong_tien;

    // NẾU ĐÃ CÓ LINK TRONG DB THÌ LẤY LẠI TỪ PAYOS
    if (order.PayOSOrderCode) {
      console.log(`♻️ Dùng lại link cũ cho đơn #${orderId}`);
      try {
        const paymentInfo = await payos.paymentRequests.get(order.PayOSOrderCode);
        // Gắn thêm qrCode từ DB vì paymentRequests.get không trả về qrCode
        paymentInfo.qrCode = order.PayOSQrCode || '';
        return res.json(paymentInfo);
      } catch (e) {
        console.error("Lỗi lấy lại link PayOS:", e);
        // Nếu lỗi (ví dụ hết hạn), tạo mới bỏ qua
      }
    }

    // Nếu chưa có, tạo mới
    const orderCode = Number(orderId.toString() + Date.now().toString().slice(-6));
    const body = {
      orderCode: Number(orderCode), 
      amount: Math.round(totalAmount),
      description: `Thanh toan don hang #${orderId}`,
      items: [], 
      returnUrl: `http://localhost:5173/my-orders`,
      cancelUrl: `http://localhost:5173/checkout`,
      expiredAt: Math.floor(Date.now() / 1000) + 600
    };

    // 5. Gọi PayOS tạo link
    const paymentLinkResponse = await payos.paymentRequests.create(body);

    // Cập nhật vào DB
    await query("UPDATE DonHang SET PayOSOrderCode = @code, PayOSCheckoutUrl = @url, PayOSQrCode = @qrCode WHERE id = @id", { 
      code: paymentLinkResponse.orderCode, 
      url: paymentLinkResponse.checkoutUrl,
      qrCode: paymentLinkResponse.qrCode || '',
      id: orderId 
    });

    return res.json(paymentLinkResponse);
  } catch (err) {
    console.error("Lỗi tạo link PayOS:", err);
    res.status(500).json({ error: "Không thể tạo link thanh toán" });
  }
});

// [NEW] POST /api/don-hang/payment-webhook - Nhận thông báo từ PayOS
router.post('/payment-webhook', async (req, res) => {
  try {
    const webhookData = payos.webhooks.verify(req.body);

    if (webhookData.description === 'success' || req.body.code === '00') {
      const payosOrderCode = webhookData.orderCode;

      await query(
        `UPDATE DonHang SET 
          trang_thai_don_hang = N'Chờ xác nhận', 
          PaymentStatus = 'Paid', 
          PaymentDate = GETUTCDATE() 
         WHERE PayOSOrderCode = @payosOrderCode`, 
        { payosOrderCode }
      );
      
      console.log(`✅ Đã nhận thanh toán PayOS cho mã code #${payosOrderCode}`);

      // Gửi thông báo thanh toán thành công qua webhook
      try {
        const orderInfo = await query('SELECT id, id_nguoi_dung, tong_tien_hang FROM DonHang WHERE PayOSOrderCode = @payosOrderCode', { payosOrderCode })
        if (orderInfo.recordset.length > 0) {
          const { id: oid, id_nguoi_dung: uid, tong_tien_hang: tongTien } = orderInfo.recordset[0]
          await query(`
            INSERT INTO ThongBao (id_nguoi_dung, tieu_de, noi_dung, loai, ngay_tao)
            VALUES (@uid, N'Đặt hàng thành công', @msg, 'DonHang', GETUTCDATE())
          `, { uid, msg: `Thanh toán đơn hàng #${oid} đã được xác nhận. Chúng tôi sẽ xử lý và giao hàng sớm nhất!` })
          // Ghi thu vào ThuChi khi webhook xác nhận
          const maThu = 'TN' + String(Date.now()).slice(-6) + oid
          await query(`
            INSERT INTO ThuChi (ma_giao_dich, loai, danh_muc, mo_ta, so_tien, ngay_giao_dich)
            VALUES (@ma, N'Thu', N'Bán hàng', @moTa, @soTien, CAST(GETUTCDATE() AS DATE))
          `, { ma: maThu, moTa: `Đơn hàng #${oid} (Chuyển khoản)`, soTien: tongTien })
        }
      } catch (nErr) { console.error('Lỗi thông báo webhook:', nErr) }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi Webhook PayOS:", err);
    res.status(500).json({ error: "Webhook verification failed" });
  }
});

router.post('/payment-failed/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query("UPDATE DonHang SET trang_thai_don_hang = N'Thanh toán thất bại', PaymentStatus = 'Failed' WHERE id = @id", { id });
    res.json({ message: 'Đã cập nhật trạng thái thanh toán thất bại' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái thất bại' });
  }
});

module.exports = router;
