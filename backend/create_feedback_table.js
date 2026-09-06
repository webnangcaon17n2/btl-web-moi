const { query } = require('./db');

async function createFeedbackTable() {
    try {
        console.log('Đang tạo bảng PhanHoiKhachHang...');
        await query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PhanHoiKhachHang')
            BEGIN
                CREATE TABLE PhanHoiKhachHang (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    ho_ten NVARCHAR(255) NOT NULL,
                    email NVARCHAR(255) NOT NULL,
                    tin_nhan NVARCHAR(MAX) NOT NULL,
                    ngay_gui DATETIME DEFAULT GETDATE(),
                    trang_thai NVARCHAR(50) DEFAULT N'Chờ phản hồi',
                    phan_hoi_admin NVARCHAR(MAX)
                );
                PRINT 'Đã tạo bảng PhanHoiKhachHang';
            END
        `);
        console.log('Xử lý hoàn tất!');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error);
        process.exit(1);
    }
}

createFeedbackTable();
