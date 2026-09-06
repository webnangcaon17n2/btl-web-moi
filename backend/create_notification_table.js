const { query } = require('./db');

async function createNotificationTable() {
    try {
        console.log('Đang tạo bảng ThongBao...');
        await query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ThongBao')
            BEGIN
                CREATE TABLE ThongBao (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    id_nguoi_dung INT FOREIGN KEY REFERENCES NguoiDung(id),
                    tieu_de NVARCHAR(255) NOT NULL,
                    noi_dung NVARCHAR(MAX) NOT NULL,
                    loai NVARCHAR(50), -- 'DonHang', 'KhuyenMai', 'HeThong'
                    da_doc BIT DEFAULT 0,
                    ngay_tao DATETIME DEFAULT GETDATE()
                );
                PRINT 'Đã tạo bảng ThongBao';
            END
        `);
        console.log('Xử lý hoàn tất!');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error);
        process.exit(1);
    }
}

createNotificationTable();
