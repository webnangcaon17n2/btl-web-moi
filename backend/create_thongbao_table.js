const { query } = require('./db');

async function createThongBao() {
  try {
    // Liệt kê tất cả bảng đang có
    const tables = await query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      ORDER BY TABLE_NAME
    `);
    console.log('All tables:', tables.recordset.map(t => t.TABLE_NAME));

    // Tạo bảng ThongBao nếu chưa có
    await query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ThongBao')
      BEGIN
        CREATE TABLE ThongBao (
          id          INT IDENTITY(1,1) PRIMARY KEY,
          id_nguoi_dung INT NOT NULL,
          tieu_de     NVARCHAR(255) NOT NULL,
          noi_dung    NVARCHAR(MAX) NOT NULL,
          loai        NVARCHAR(50) DEFAULT 'DonHang',
          da_doc      BIT DEFAULT 0,
          ngay_tao    DATETIME DEFAULT GETUTCDATE(),
          FOREIGN KEY (id_nguoi_dung) REFERENCES NguoiDung(id) ON DELETE CASCADE
        )
        PRINT 'Created ThongBao table'
      END
      ELSE
        PRINT 'ThongBao table already exists'
    `);
    console.log('ThongBao table created/verified OK');

    // Test insert
    const ins = await query(
      `INSERT INTO ThongBao (id_nguoi_dung, tieu_de, noi_dung, loai, ngay_tao)
       VALUES (@userId, @tieuDe, @noiDung, 'DonHang', GETUTCDATE())`,
      { userId: 1, tieuDe: 'Đặt hàng thành công', noiDung: 'Đơn hàng #TEST của bạn đã được đặt thành công. Phương thức: COD.' }
    );
    console.log('Test insert OK, rows:', ins.rowsAffected);
    
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}

createThongBao();
