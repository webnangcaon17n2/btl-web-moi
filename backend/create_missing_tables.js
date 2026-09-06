const { query } = require('./db');

async function createMissingTables() {
  try {
    // 1. Tạo bảng PhanHoiKhachHang
    await query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PhanHoiKhachHang')
      BEGIN
        CREATE TABLE PhanHoiKhachHang (
            id INT PRIMARY KEY IDENTITY(1,1),
            ho_ten NVARCHAR(255) NOT NULL,
            email NVARCHAR(255) NOT NULL,
            tin_nhan NVARCHAR(MAX) NOT NULL,
            ngay_gui DATETIME DEFAULT GETUTCDATE(),
            trang_thai NVARCHAR(50) DEFAULT N'Chờ phản hồi',
            phan_hoi_admin NVARCHAR(MAX),
            ngay_phan_hoi DATETIME
        );
        PRINT 'Created PhanHoiKhachHang table';
      END
      ELSE
        PRINT 'PhanHoiKhachHang table already exists';
    `);
    
    // 2. Tạo bảng Vouchers
    await query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Vouchers')
      BEGIN
        CREATE TABLE Vouchers (
            id INT PRIMARY KEY IDENTITY(1,1),
            ma_voucher NVARCHAR(50) UNIQUE NOT NULL,
            mo_ta NVARCHAR(255),
            loai_giam_gia NVARCHAR(50) DEFAULT 'PhanTram', -- 'PhanTram', 'TienMat'
            gia_tri DECIMAL(18,2) NOT NULL,
            gia_tri_don_hang_toi_thieu DECIMAL(18,2) DEFAULT 0,
            giam_toi_da DECIMAL(18,2),
            so_luong INT DEFAULT 0,
            ngay_bat_dau DATETIME DEFAULT GETUTCDATE(),
            ngay_ket_thuc DATETIME,
            trang_thai BIT DEFAULT 1
        );
        PRINT 'Created Vouchers table';
      END
      ELSE
        PRINT 'Vouchers table already exists';
    `);

    // 3. Tạo bảng TaiKhoanThuHuong
    await query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TaiKhoanThuHuong')
      BEGIN
        CREATE TABLE TaiKhoanThuHuong (
            id INT PRIMARY KEY IDENTITY(1,1),
            ten_ngan_hang NVARCHAR(255) NOT NULL,
            so_tai_khoan NVARCHAR(50) NOT NULL,
            chu_tai_khoan NVARCHAR(255) NOT NULL,
            is_mac_dinh BIT DEFAULT 0,
            trang_thai BIT DEFAULT 1
        );
        PRINT 'Created TaiKhoanThuHuong table';
      END
      ELSE
        PRINT 'TaiKhoanThuHuong table already exists';
    `);

    // 4. Tạo bảng DiaChiNguoiDung
    await query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DiaChiNguoiDung')
      BEGIN
        CREATE TABLE DiaChiNguoiDung (
            id INT PRIMARY KEY IDENTITY(1,1),
            user_id INT FOREIGN KEY REFERENCES NguoiDung(id) ON DELETE CASCADE,
            ho_ten NVARCHAR(255) NOT NULL,
            so_dien_thoai NVARCHAR(20) NOT NULL,
            dia_chi NVARCHAR(500) NOT NULL,
            is_default BIT DEFAULT 0,
            ngay_tao DATETIME DEFAULT GETUTCDATE()
        );
        PRINT 'Created DiaChiNguoiDung table';
      END
      ELSE
        PRINT 'DiaChiNguoiDung table already exists';
    `);

    // 5. Tạo bảng ChuyenGia
    await query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ChuyenGia')
      BEGIN
        CREATE TABLE ChuyenGia (
            id INT PRIMARY KEY IDENTITY(1,1),
            ho_ten NVARCHAR(255) NOT NULL,
            vai_tro NVARCHAR(100),
            hinh_anh NVARCHAR(500),
            mo_ta NVARCHAR(MAX),
            kinh_nghiem NVARCHAR(100),
            chuyen_mon NVARCHAR(255),
            email NVARCHAR(255),
            social_fb NVARCHAR(255),
            social_ig NVARCHAR(255)
        );
        PRINT 'Created ChuyenGia table';
      END
      ELSE
        PRINT 'ChuyenGia table already exists';
    `);

    console.log('All missing tables created/verified successfully!');
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}

createMissingTables();
