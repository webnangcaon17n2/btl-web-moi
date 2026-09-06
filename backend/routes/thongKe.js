const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /api/thong-ke
router.get('/', async (req, res) => {
  try {
    const [
      totalProductsResult,
      monthlyOrdersResult,
      monthlyRevenueResult,
      totalUsersResult,
      recentOrdersResult,
      topProductsResult,
      inventoryStatsResult,
      monthlyChartResult
    ] = await Promise.all([
      // 1. Tổng sản phẩm
      query(`SELECT COUNT(*) as count FROM SanPham`),
      
      // 2. Đơn hàng tháng
      query(`SELECT COUNT(*) as count FROM DonHang WHERE MONTH(ngay_dat) = MONTH(GETDATE()) AND YEAR(ngay_dat) = YEAR(GETDATE())`),
      
      // 3. Doanh thu tháng
      query(`SELECT ISNULL(SUM(tong_tien_hang), 0) as total FROM DonHang WHERE trang_thai_don_hang != N'Đã hủy' AND MONTH(ngay_dat) = MONTH(GETDATE()) AND YEAR(ngay_dat) = YEAR(GETDATE())`),
      
      // 4. Người dùng
      query(`SELECT COUNT(*) as count FROM NguoiDung WHERE vai_tro != 'admin'`),
      
      // 5. Đơn hàng gần đây
      query(`
        SELECT TOP 5 d.id, n.ho_ten as customer, d.tong_tien_hang as total, d.trang_thai_don_hang as status 
        FROM DonHang d 
        JOIN NguoiDung n ON d.id_nguoi_dung = n.id 
        ORDER BY d.ngay_dat DESC
      `),
      
      // 6. Sản phẩm bán chạy
      query(`
        SELECT TOP 5 s.ten_san_pham as name, SUM(c.so_luong) as sold, SUM(c.so_luong * c.gia_don_vi) as revenue 
        FROM ChiTietDonHang c 
        JOIN SanPham s ON c.id_san_pham = s.id 
        GROUP BY s.id, s.ten_san_pham 
        ORDER BY sold DESC
      `),
      
      // 7. Tình trạng kho (tổng tồn kho, sắp hết hàng < 10)
      query(`
        SELECT ISNULL(SUM(so_luong_kho), 0) as totalInventory, 
               COUNT(CASE WHEN so_luong_kho < 10 THEN 1 END) as lowStock 
        FROM SanPham
      `),
      
      // 8. Dữ liệu biểu đồ 4 tháng gần nhất
      query(`
        WITH Last4Months AS (
            SELECT TOP 4
                MONTH(DATEADD(MONTH, -number, GETDATE())) AS Thang,
                YEAR(DATEADD(MONTH, -number, GETDATE())) AS Nam,
                DATEADD(MONTH, -number, GETDATE()) AS NgayGoc
            FROM master.dbo.spt_values
            WHERE type = 'P' AND number <= 3
            ORDER BY number
        )
        SELECT 
            CONCAT('T', m.Thang) as month,
            ISNULL(SUM(d.tong_tien_hang), 0) / 1000000.0 as revenue,
            ISNULL(SUM(d.tong_tien_hang), 0) * 0.7 / 1000000.0 as expense
        FROM Last4Months m
        LEFT JOIN DonHang d ON MONTH(d.ngay_dat) = m.Thang AND YEAR(d.ngay_dat) = m.Nam AND d.trang_thai_don_hang != N'Đã hủy'
        GROUP BY m.Thang, m.Nam, m.NgayGoc
        ORDER BY m.NgayGoc ASC
      `)
    ]);

    const data = {
      totalProducts: totalProductsResult.recordset[0].count,
      monthlyOrders: monthlyOrdersResult.recordset[0].count,
      monthlyRevenue: monthlyRevenueResult.recordset[0].total,
      totalUsers: totalUsersResult.recordset[0].count,
      recentOrders: recentOrdersResult.recordset.map(o => ({
        id: `DH${String(o.id).padStart(3, '0')}`,
        customer: o.customer,
        total: o.total,
        status: o.status,
        statusColor: getStatusColor(o.status)
      })),
      topProducts: topProductsResult.recordset.map(p => ({
        name: p.name,
        sold: p.sold,
        revenue: p.revenue
      })),
      inventoryStats: {
        totalInventory: inventoryStatsResult.recordset[0].totalInventory,
        lowStock: inventoryStatsResult.recordset[0].lowStock
      },
      monthlyChart: monthlyChartResult.recordset
    };

    res.json(data);
  } catch (error) {
    console.error("Lỗi lấy thống kê:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi lấy dữ liệu thống kê" });
  }
});

function getStatusColor(status) {
  switch (status) {
    case 'Chờ xác nhận': return '#e65100';
    case 'Đang xử lý': return '#1565c0';
    case 'Đang giao': return '#7b1fa2';
    case 'Đã giao': return '#4caf50';
    case 'Đã hủy': return '#d32f2f';
    default: return '#757575';
  }
}

module.exports = router;
