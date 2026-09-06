/* 
   ===========================================================
   FILE: FullProjectDatabase.sql
   MÔ TẢ: File khởi tạo toàn bộ Cơ sở dữ liệu cho dự án Aether Plant Shop.
   DỰA TRÊN: Kết quả quét toàn bộ mã nguồn backend (routes & db logic).
   HỆ QUẢN TRỊ: SQL Server (MSSQL).
   ===========================================================
*/

-- 1. TẠO DATABASE NẾU CHƯA CÓ
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AetherPlant')
BEGIN
    CREATE DATABASE AetherPlant;
END
GO

USE AetherPlant;
GO


-- 2. XOÁ CÁC BẢNG CŨ (Để đảm bảo tính nhất quán khi chạy lại script)
-- Thứ tự xoá quan trọng để tránh lỗi Foreign Key
IF OBJECT_ID('ChiTietDonHang', 'U') IS NOT NULL DROP TABLE ChiTietDonHang;
IF OBJECT_ID('DanhGia', 'U') IS NOT NULL DROP TABLE DanhGia;
IF OBJECT_ID('BaiViet', 'U') IS NOT NULL DROP TABLE BaiViet;
IF OBJECT_ID('ThongBao', 'U') IS NOT NULL DROP TABLE ThongBao;
IF OBJECT_ID('PhanHoiKhachHang', 'U') IS NOT NULL DROP TABLE PhanHoiKhachHang;
IF OBJECT_ID('LienHe', 'U') IS NOT NULL DROP TABLE LienHe;
IF OBJECT_ID('DonHang', 'U') IS NOT NULL DROP TABLE DonHang;
IF OBJECT_ID('AnhSanPham', 'U') IS NOT NULL DROP TABLE AnhSanPham;
IF OBJECT_ID('SanPham', 'U') IS NOT NULL DROP TABLE SanPham;
IF OBJECT_ID('DanhMucBlog', 'U') IS NOT NULL DROP TABLE DanhMucBlog;
IF OBJECT_ID('DanhMuc', 'U') IS NOT NULL DROP TABLE DanhMuc;
IF OBJECT_ID('DiaChiNguoiDung', 'U') IS NOT NULL DROP TABLE DiaChiNguoiDung;
IF OBJECT_ID('NguoiDung', 'U') IS NOT NULL DROP TABLE NguoiDung;
IF OBJECT_ID('Vouchers', 'U') IS NOT NULL DROP TABLE Vouchers;
IF OBJECT_ID('ChuyenGia', 'U') IS NOT NULL DROP TABLE ChuyenGia;
IF OBJECT_ID('TaiKhoanThuHuong', 'U') IS NOT NULL DROP TABLE TaiKhoanThuHuong;
IF OBJECT_ID('ThuChi', 'U') IS NOT NULL DROP TABLE ThuChi;
GO

-- 3. ĐỊNH NGHĨA CÁC BẢNG VỚI ĐẦY ĐỦ CÁC TRƯỜNG TRONG DỰ ÁN

-- [Bảng 1] NguoiDung: Quản lý khách hàng và nhân viên/admin
CREATE TABLE NguoiDung (
    id              INT PRIMARY KEY IDENTITY(1,1),
    email           NVARCHAR(255) UNIQUE NOT NULL,
    mat_khau_hash   NVARCHAR(255) NOT NULL,
    ho_ten          NVARCHAR(255) NOT NULL,
    so_dien_thoai   NVARCHAR(20),
    vai_tro         NVARCHAR(50)  DEFAULT N'Khách hàng', -- 'Khách hàng', 'Admin', 'Admin Tổng'
    la_admin        BIT           DEFAULT 0,              -- 1 = Admin, 0 = Khách hàng
    anh_dai_dien    NVARCHAR(500),
    dang_hoat_dong  BIT           DEFAULT 1,
    -- Thông tin hồ sơ cá nhân
    dia_chi         NVARCHAR(500),                        -- Địa chỉ nhận hàng mặc định
    so_cccd         NVARCHAR(20),                         -- Số căn cước công dân
    ngay_sinh       DATE,                                 -- Ngày sinh
    gioi_tinh       NVARCHAR(10),                         -- 'Nam', 'Nữ'
    que_quan        NVARCHAR(500),                        -- Nguyên quán
    ngay_tao        DATETIME      DEFAULT GETDATE()
);

-- [Bảng 2] DiaChiNguoiDung: Danh bạ địa chỉ giao hàng của người dùng
CREATE TABLE DiaChiNguoiDung (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT FOREIGN KEY REFERENCES NguoiDung(id) ON DELETE CASCADE,
    ho_ten NVARCHAR(255) NOT NULL,
    so_dien_thoai NVARCHAR(20) NOT NULL,
    dia_chi NVARCHAR(500) NOT NULL,
    is_default BIT DEFAULT 0,
    ngay_tao DATETIME DEFAULT GETDATE()
);

-- [Bảng 3] DanhMuc: Phân loại sản phẩm
CREATE TABLE DanhMuc (
    id INT PRIMARY KEY IDENTITY(1,1),
    ten_danh_muc NVARCHAR(255) NOT NULL,
    duong_dan_seo NVARCHAR(255) UNIQUE NOT NULL
);

-- [Bảng 4] SanPham: Thông tin chi tiết sản phẩm
CREATE TABLE SanPham (
    id INT PRIMARY KEY IDENTITY(1,1),
    ten_san_pham NVARCHAR(255) NOT NULL,
    duong_dan_seo NVARCHAR(255) UNIQUE NOT NULL,
    ma_sku NVARCHAR(50) UNIQUE NOT NULL,
    id_danh_muc INT FOREIGN KEY REFERENCES DanhMuc(id),
    gia_ban DECIMAL(18,2) NOT NULL,
    gia_cu DECIMAL(18,2),
    gia_nhap DECIMAL(18,2) DEFAULT 0,
    so_luong_kho INT DEFAULT 0,
    so_luong_toi_thieu INT DEFAULT 5,
    trang_thai NVARCHAR(50) DEFAULT N'Đang bán', -- 'Đang bán', 'Hết hàng', 'Ẩn'
    nhan_san_pham NVARCHAR(50), -- 'Bán chạy', 'Mới', 'Giảm giá'
    chat_lieu_chau NVARCHAR(100),
    don_vi NVARCHAR(50) DEFAULT N'Chậu',
    mo_ta NVARCHAR(MAX),
    huong_dan_cham_soc NVARCHAR(MAX),
    diem_danh_gia_tb FLOAT DEFAULT 0,
    tong_luot_danh_gia INT DEFAULT 0,
    ngay_nhap_cuoi DATETIME, -- Dùng cho quản lý kho
    ngay_tao DATETIME DEFAULT GETDATE(),
    ngay_cap_nhat DATETIME DEFAULT GETDATE()
);

-- [Bảng 5] AnhSanPham: Hình ảnh chi tiết cho từng sản phẩm
CREATE TABLE AnhSanPham (
    id INT PRIMARY KEY IDENTITY(1,1),
    id_san_pham INT FOREIGN KEY REFERENCES SanPham(id) ON DELETE CASCADE,
    duong_dan_anh NVARCHAR(500) NOT NULL,
    la_anh_chinh BIT DEFAULT 0
);

-- [Bảng 6] DonHang: Thông tin đơn đặt hàng
CREATE TABLE DonHang (
    id INT PRIMARY KEY IDENTITY(1,1),
    id_nguoi_dung INT FOREIGN KEY REFERENCES NguoiDung(id),
    tong_tien_hang DECIMAL(18,2) NOT NULL,
    dia_chi_giao_hang NVARCHAR(500) NOT NULL,
    phuong_thuc_thanh_toan NVARCHAR(50) DEFAULT 'COD', -- 'COD', 'VietQR', 'Chuyển khoản'
    trang_thai_don_hang NVARCHAR(50) DEFAULT N'Chờ xác nhận',
    PayOSOrderCode BIGINT,
    PayOSCheckoutUrl NVARCHAR(500),
    PayOSQrCode NVARCHAR(MAX),
    PaymentStatus VARCHAR(50),
    PaymentDate DATETIME,
    ngay_dat DATETIME DEFAULT GETDATE()
);

-- [Bảng 7] ChiTietDonHang: Sản phẩm trong mỗi đơn hàng
CREATE TABLE ChiTietDonHang (
    id INT PRIMARY KEY IDENTITY(1,1),
    id_don_hang INT FOREIGN KEY REFERENCES DonHang(id) ON DELETE CASCADE,
    id_san_pham INT FOREIGN KEY REFERENCES SanPham(id),
    so_luong INT NOT NULL,
    gia_don_vi DECIMAL(18,2) NOT NULL
);

-- [Bảng 8] DanhMucBlog: Phân loại bài viết
CREATE TABLE DanhMucBlog (
    id INT PRIMARY KEY IDENTITY(1,1),
    ten NVARCHAR(255) NOT NULL
);

-- [Bảng 9] BaiViet: Tin tức, hướng dẫn chăm sóc cây
CREATE TABLE BaiViet (
    id INT PRIMARY KEY IDENTITY(1,1),
    ma_bai_viet NVARCHAR(50) UNIQUE,
    tieu_de NVARCHAR(500) NOT NULL,
    duong_dan_seo NVARCHAR(500) UNIQUE NOT NULL,
    id_danh_muc INT FOREIGN KEY REFERENCES DanhMucBlog(id),
    id_tac_gia INT FOREIGN KEY REFERENCES NguoiDung(id),
    tom_tat NVARCHAR(MAX),
    noi_dung NVARCHAR(MAX),
    anh_bia NVARCHAR(500),
    trang_thai NVARCHAR(50) DEFAULT N'Bản nháp', -- 'Bản nháp', 'Đã xuất bản'
    ngay_tao DATETIME DEFAULT GETDATE(),
    ngay_cap_nhat DATETIME DEFAULT GETDATE()
);

-- [Bảng 10] DanhGia: Đánh giá sản phẩm từ khách hàng
CREATE TABLE DanhGia (
    id INT PRIMARY KEY IDENTITY(1,1),
    id_san_pham INT FOREIGN KEY REFERENCES SanPham(id) ON DELETE CASCADE,
    id_nguoi_dung INT FOREIGN KEY REFERENCES NguoiDung(id),
    so_sao INT CHECK (so_sao BETWEEN 1 AND 5),
    noi_dung NVARCHAR(MAX),
    ngay_viet DATETIME DEFAULT GETDATE()
);

-- [Bảng 11] PhanHoiKhachHang: Liên hệ/Feedback từ khách hàng
CREATE TABLE PhanHoiKhachHang (
    id INT PRIMARY KEY IDENTITY(1,1),
    ho_ten NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    tin_nhan NVARCHAR(MAX) NOT NULL,
    so_sao INT DEFAULT 5,
    ngay_gui DATETIME DEFAULT GETDATE(),
    trang_thai NVARCHAR(50) DEFAULT N'Chờ phản hồi',
    phan_hoi_admin NVARCHAR(MAX),
    ngay_phan_hoi DATETIME
);

-- [Bảng 12] ThongBao: Thông báo gửi đến người dùng
CREATE TABLE ThongBao (
    id INT PRIMARY KEY IDENTITY(1,1),
    id_nguoi_dung INT FOREIGN KEY REFERENCES NguoiDung(id) ON DELETE CASCADE,
    tieu_de NVARCHAR(255) NOT NULL,
    noi_dung NVARCHAR(MAX) NOT NULL,
    loai NVARCHAR(50) DEFAULT 'HeThong', -- 'DonHang', 'HeThong', 'KhuyenMai'
    da_doc BIT DEFAULT 0,
    ngay_tao DATETIME DEFAULT GETDATE()
);

-- [Bảng 13] Vouchers: Mã giảm giá
CREATE TABLE Vouchers (
    id INT PRIMARY KEY IDENTITY(1,1),
    ma_voucher NVARCHAR(50) UNIQUE NOT NULL,
    mo_ta NVARCHAR(255),
    loai_giam_gia NVARCHAR(50) DEFAULT 'PhanTram', -- 'PhanTram', 'TienMat'
    gia_tri DECIMAL(18,2) NOT NULL,
    gia_tri_don_hang_toi_thieu DECIMAL(18,2) DEFAULT 0,
    giam_toi_da DECIMAL(18,2),
    so_luong INT DEFAULT 0,
    ngay_bat_dau DATETIME DEFAULT GETDATE(),
    ngay_ket_thuc DATETIME,
    trang_thai BIT DEFAULT 1
);

-- [Bảng 14] ChuyenGia: Danh sách chuyên gia
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

-- [Bảng 15] TaiKhoanThuHuong: Tài khoản ngân hàng nhận tiền
CREATE TABLE TaiKhoanThuHuong (
    id INT PRIMARY KEY IDENTITY(1,1),
    ten_ngan_hang NVARCHAR(255) NOT NULL,
    so_tai_khoan NVARCHAR(50) NOT NULL,
    chu_tai_khoan NVARCHAR(255) NOT NULL,
    is_mac_dinh BIT DEFAULT 0,
    trang_thai BIT DEFAULT 1
);

-- [Bảng 16] ThuChi: Quản lý thu chi của cửa hàng
CREATE TABLE ThuChi (
    id INT PRIMARY KEY IDENTITY(1,1),
    ma_giao_dich NVARCHAR(50) UNIQUE NOT NULL,
    loai NVARCHAR(50) NOT NULL, -- 'Thu', 'Chi'
    danh_muc NVARCHAR(100) DEFAULT N'Khác',
    mo_ta NVARCHAR(255) NOT NULL,
    so_tien DECIMAL(18,2) NOT NULL,
    ngay_giao_dich DATE NOT NULL,
    ghi_chu NVARCHAR(MAX),
    ngay_tao DATETIME DEFAULT GETDATE()
);
GO

-- 4. CHÈN DỮ LIỆU MẪU ĐẦY ĐỦ

-- Chèn Danh mục sản phẩm
SET IDENTITY_INSERT DanhMuc ON;
INSERT INTO DanhMuc (id, ten_danh_muc, duong_dan_seo) VALUES 
(1, N'Cây Trong Nhà',      'cay-trong-nha'),
(2, N'Cây Ngoài Trời',     'cay-ngoai-troi'),
(3, N'Sen Đá & Xương Rồng', 'sen-da-xuong-rong'),
(4, N'Chăm Sóc Cây',       'cham-soc-cay'),
(5, N'Chậu & Bình Hoa',    'chau-binh-hoa'),
(6, N'Hạt Giống & Củ',     'hat-giong-cu');
SET IDENTITY_INSERT DanhMuc OFF;

-- Chèn Người dùng (Mặc định có 1 Admin và 1 Khách mẫu)
-- Mật khẩu hash của 'admin123'
INSERT INTO NguoiDung (email, mat_khau_hash, ho_ten, vai_tro, la_admin, dia_chi) VALUES 
('admin@aether.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Quản trị viên', N'Admin Tổng', 1, N'Hệ Thống Aether'),
('admin@aether.vn', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Quản trị viên', N'Admin Tổng', 1, N'Hệ Thống Aether'),
('khachhang@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Nguyễn Văn Khách', N'Khách hàng', 0, N'789 Đường Láng, Đống Đa, Hà Nội');

-- Chèn thêm 15 tài khoản khách hàng thực tế để phục vụ tạo lịch sử đơn hàng
INSERT INTO NguoiDung (email, mat_khau_hash, ho_ten, so_dien_thoai, vai_tro, la_admin, dia_chi) VALUES
('nguyenthanhphong@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Nguyễn Thanh Phong', '0912345678', N'Khách hàng', 0, N'123 Đường Láng, Đống Đa, Hà Nội'),
('phamlananh@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Phạm Lan Anh', '0923456789', N'Khách hàng', 0, N'456 Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh'),
('tranminhduc@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Trần Minh Đức', '0934567890', N'Khách hàng', 0, N'789 Nguyễn Văn Linh, Hải Châu, Đà Nẵng'),
('lethuytrang@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Lê Thủy Trang', '0945678901', N'Khách hàng', 0, N'12 Lê Lợi, Ngô Quyền, Hải Phòng'),
('hoangquanghuy@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Hoàng Quang Huy', '0956789012', N'Khách hàng', 0, N'34 Hùng Vương, Ninh Kiều, Cần Thơ'),
('vubichphuong@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Vũ Bích Phương', '0967890123', N'Khách hàng', 0, N'56 Quang Trung, Vinh, Nghệ An'),
('nguyentiendung@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Nguyễn Tiến Dũng', '0978901234', N'Khách hàng', 0, N'78 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh'),
('dohanhyen@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Đỗ Hoàng Yến', '0989012345', N'Khách hàng', 0, N'90 Trần Phú, Nha Trang, Khánh Hòa'),
('phanmanhcuong@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Phan Mạnh Cường', '0990123456', N'Khách hàng', 0, N'12 Điện Biên Phủ, Thanh Khê, Đà Nẵng'),
('trinhkhanhly@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Trịnh Khánh Ly', '0901234567', N'Khách hàng', 0, N'345 Bạch Đằng, Bình Thạnh, TP. Hồ Chí Minh'),
('ngoquocbao@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Ngô Quốc Bảo', '0911122233', N'Khách hàng', 0, N'78 Lê Hồng Phong, Vũng Tàu, Bà Rịa - Vũng Tàu'),
('buihongnhung@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Bùi Hồng Nhung', '0922233344', N'Khách hàng', 0, N'90 Kim Mã, Ba Đình, Hà Nội'),
('dangtuananh@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Đặng Tuấn Anh', '0933344455', N'Khách hàng', 0, N'12 Nguyễn Trãi, Thanh Xuân, Hà Nội'),
('nguyenthuha@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Nguyễn Thu Hà', '0944455566', N'Khách hàng', 0, N'56 Bà Triệu, Hoàn Kiếm, Hà Nội'),
('leduykhang@gmail.com', '$2b$10$JOBpcuUG628HGrkCENcMjOU48WqDoalNIT2uPCvLJ4tWawRjuezei', N'Lê Duy Khang', '0955566677', N'Khách hàng', 0, N'78 Hai Bà Trưng, Quận 3, TP. Hồ Chí Minh');

-- Chèn Danh mục Blog
INSERT INTO DanhMucBlog (ten) VALUES (N'Hướng dẫn chăm sóc'), (N'Xu hướng trang trí'), (N'Kiến thức cây cảnh');

-- ─── BẮT ĐẦU THUẬT TOÁN SINH 200 SẢN PHẨM ĐA DẠNG ───
DECLARE @Prefixes TABLE (Prefix NVARCHAR(100), CategoryId INT, DonVi NVARCHAR(50), Material NVARCHAR(100), MotaTemplate NVARCHAR(500), BasePrice DECIMAL(18,2));
INSERT INTO @Prefixes VALUES
(N'Sen Đá', 3, N'Chậu', N'Chậu đất nung', N'Cây sen đá nhỏ xinh, rất thích hợp trang trí bàn làm việc hoặc làm quà tặng.', 40000),
(N'Xương Rồng', 3, N'Chậu', N'Chậu gốm', N'Cây xương rồng có hình dáng độc đáo, sức sống bền bỉ, dễ chăm sóc.', 50000),
(N'Kim Ngân', 1, N'Chậu', N'Chậu sứ', N'Cây kim ngân phong thủy giúp thu hút tiền tài và may mắn cho gia chủ.', 120000),
(N'Kim Tiền', 1, N'Chậu', N'Chậu sứ trắng', N'Cây kim tiền lá xanh bóng mượt, thân vươn cao tràn đầy năng lượng tài lộc.', 150000),
(N'Bàng Singapore', 1, N'Chậu', N'Chậu xi măng', N'Cây bàng Singapore dáng cao hiện đại, lá to tròn mang phong cách châu Âu.', 280000),
(N'Lan Ý', 1, N'Chậu', N'Chậu sứ', N'Cây lan ý lọc không khí cực tốt, hoa trắng thanh tao sang trọng.', 110000),
(N'Trầu Bà', 1, N'Chậu', N'Chậu nhựa treo', N'Cây trầu bà xanh mát, lọc khí độc hại trong nhà và nơi công sở.', 80000),
(N'Lưỡi Hổ', 1, N'Chậu', N'Chậu xi măng', N'Cây lưỡi hổ có khả năng cung cấp oxy ban đêm, thích hợp đặt phòng ngủ.', 130000),
(N'Hoa Hồng', 2, N'Cây', N'Chậu nhựa cứng', N'Hoa hồng leo rực rỡ sắc màu, hương thơm dịu nhẹ thu hút mọi ánh nhìn.', 160000),
(N'Hoa Nhài', 2, N'Cây', N'Chậu đất', N'Cây hoa nhài ta hoa trắng tinh khôi, thơm ngát tốt cho sức khỏe và phong thủy.', 90000),
(N'Cau Cảnh', 2, N'Cây', N'Chậu lớn', N'Cây cau cảnh dáng cao khỏe khoắn, chịu nắng gió tốt, làm mát không gian sân vườn.', 350000),
(N'Trúc Nhật', 2, N'Cây', N'Chậu xi măng', N'Trúc Nhật thanh mảnh mang nét đẹp yên bình, tĩnh lặng cho vườn nhà.', 180000),
(N'Thiết Mộc Lan', 1, N'Chậu', N'Chậu gốm lớn', N'Thiết mộc lan ghép gốc to khỏe, mang ý nghĩa phát tài phát lộc dồi dào.', 420000),
(N'Vạn Niên Thanh', 1, N'Chậu', N'Chậu sứ', N'Vạn niên thanh leo cột xanh tốt quanh năm, mang lại không gian thư thái dễ chịu.', 220000),
(N'Cây Hạnh Phúc', 1, N'Chậu', N'Chậu sứ trắng', N'Cây hạnh phúc tán lá xanh mượt, tượng trưng cho sự gắn kết và bình an gia đình.', 250000),
(N'Ngọc Ngân', 1, N'Chậu', N'Chậu sứ', N'Cây ngọc ngân lá đốm cẩm thạch cực đẹp, tượng trưng cho tình yêu thuần khiết.', 110000),
(N'Hồng Môn', 1, N'Chậu', N'Chậu sứ', N'Cây hồng môn hoa đỏ rực rỡ, thích hợp làm quà tặng khai trương, chúc mừng.', 140000),
(N'Phú Quý', 1, N'Chậu', N'Chậu sứ', N'Cây phú quý thân hồng lá đỏ viền xanh mang ý nghĩa giàu sang thịnh vượng.', 110000),
(N'Đại Phú Gia', 1, N'Chậu', N'Chậu lớn', N'Đại phú gia lá to bóng mượt, mang lại sự sang trọng bề thế cho phòng khách.', 450000),
(N'Trầu Bà Nam Mỹ', 1, N'Chậu', N'Chậu đá mài', N'Cây Monstera Nam Mỹ lá xẻ độc đáo, thời thượng cho phong cách Urban Jungle.', 380000),
(N'Dây Thường Xuân', 1, N'Chậu', N'Chậu treo', N'Dây thường xuân leo rủ mềm mại, lọc bụi bẩn và các chất độc hại trong nhà.', 75000),
(N'Cây Tùng Bồng Lai', 3, N'Chậu', N'Chậu gốm nhỏ', N'Cây tùng bồng lai bonsai dáng mini cực đẹp, biểu trưng cho sự kiên cường.', 190000),
(N'Cây Ngũ Gia Bì', 1, N'Chậu', N'Chậu sứ', N'Cây ngũ gia bì xanh tốt, có khả năng đuổi muỗi tự nhiên rất hiệu quả.', 140000),
(N'Cây Phát Tài', 1, N'Chậu', N'Chậu sứ trắng', N'Cây phát tài búp sen nhỏ xinh thích hợp để bàn làm việc, cầu chúc tài lộc.', 95000),
(N'Hạt Giống Cải Xoăn', 6, N'Gói', N'Túi zip', N'Hạt giống cải xoăn Kale chất lượng cao, tỉ lệ nảy mầm >90%, chuẩn rau sạch.', 25000),
(N'Hạt Giống Cà Chua', 6, N'Gói', N'Túi zip', N'Hạt giống cà chua bi quả ngọt mọng nước, dễ trồng tại ban công chung cư.', 20000),
(N'Chậu Gốm Sứ', 5, N'Chiếc', N'Đất sét nung', N'Chậu gốm sứ tráng men cao cấp, kiểu dáng hiện đại giúp nâng tầm vẻ đẹp của cây.', 65000),
(N'Chậu Đất Nung', 5, N'Chiếc', N'Đất nung', N'Chậu đất nung mộc mạc thoáng khí, hút nước tốt giúp bảo vệ rễ cây tối đa.', 35000),
(N'Bình Thủy Tinh', 5, N'Chiếc', N'Thủy tinh', N'Bình thủy tinh nuôi cây thủy sinh cực đẹp, trong suốt sang trọng.', 55000),
(N'Đất Sạch Hữu Cơ', 4, N'Bao', N'Bao tải', N'Đất sạch hữu cơ đã trộn sẵn xơ dừa, phân bò, đầy đủ dinh dưỡng cho cây phát triển.', 45000);

DECLARE @Modifiers TABLE (Modifier NVARCHAR(100), PriceFactor DECIMAL(18,2), SlugSuffix VARCHAR(100), SkuSuffix VARCHAR(50));
INSERT INTO @Modifiers VALUES
(N'Thái', 1.2, 'thai', 'TH'),
(N'Mỹ', 1.5, 'my', 'US'),
(N'Nhật', 1.8, 'nhat', 'JP'),
(N'Đại', 2.0, 'dai', 'BIG'),
(N'Mini', 0.6, 'mini', 'MINI'),
(N'Cẩm Thạch', 1.4, 'cam-thach', 'CT'),
(N'Lộc Phát', 1.3, 'loc-phat', 'LP'),
(N'May Mắn', 1.15, 'may-man', 'MM'),
(N'Phong Thủy', 1.25, 'phong-thuy', 'PT'),
(N'Đế Vương', 1.7, 'de-vuong', 'DV'),
(N'Bonsai', 2.2, 'bonsai', 'BS'),
(N'Cổ Cực Đẹp', 2.5, 'co-dep', 'CO'),
(N'Hà Lan', 1.6, 'ha-lan', 'NL'),
(N'Đài Loan', 1.1, 'dai-loan', 'TW'),
(N'Đặc Biệt', 1.35, 'dac-biet', 'DB');

-- Chèn vào SanPham
WITH Combined AS (
    SELECT 
        p.Prefix + ' ' + m.Modifier AS ten,
        LOWER(p.Prefix + '-' + m.SlugSuffix) AS slug,
        p.Prefix + '-' + m.SkuSuffix AS sku,
        p.CategoryId AS dm_id,
        CAST(p.BasePrice * m.PriceFactor AS DECIMAL(18,2)) AS gia,
        p.Material AS chau,
        p.MotaTemplate + ' ' + N'Sản phẩm thuộc dòng ' + m.Modifier + N' rất được yêu thích hiện nay.' AS mota,
        N'Tưới nước vừa đủ, phơi nắng sáng nhẹ 1-2 lần mỗi tuần để cây phát triển tốt nhất.' AS cham,
        p.DonVi AS donvi,
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) as row_num
    FROM @Prefixes p
    CROSS JOIN @Modifiers m
)
INSERT INTO SanPham (ten_san_pham, duong_dan_seo, ma_sku, id_danh_muc, gia_ban, gia_nhap, so_luong_kho, so_luong_toi_thieu, nhan_san_pham, chat_lieu_chau, mo_ta, huong_dan_cham_soc, don_vi, trang_thai)
SELECT 
    ten, 
    -- Format slug không dấu đơn giản
    LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(slug, ' ', '-'), N'á', 'a'), N'ố', 'o'), N'à', 'a'), N'ế', 'e'), N'ả', 'a'), N'í', 'i'), N'ý', 'y'), N'ô', 'o'), N'đ', 'd')) + '-' + CAST(row_num AS VARCHAR(10)),
    sku + '-' + CAST(row_num AS VARCHAR(10)),
    dm_id, 
    gia, 
    CAST(gia * 0.55 AS DECIMAL(18,2)), 
    -- Sinh tồn kho ngẫu nhiên (Một số ít sản phẩm sắp hết hàng để trigger cảnh báo)
    CASE WHEN row_num % 15 = 0 THEN 2 WHEN row_num % 15 = 1 THEN 3 ELSE CAST(10 + (row_num % 120) AS INT) END, 
    5, 
    CASE WHEN row_num % 3 = 0 THEN N'Bán chạy' WHEN row_num % 3 = 1 THEN N'Mới' ELSE N'Giảm giá' END,
    chau, 
    mota, 
    cham, 
    donvi, 
    N'Đang bán'
FROM Combined
WHERE row_num <= 200;

-- Phân phối ảnh chính cực đẹp cho 200 sản phẩm dựa trên Modulo 8 của ID sản phẩm
DECLARE @Images TABLE (id INT IDENTITY(1,1), url NVARCHAR(500));
INSERT INTO @Images VALUES
('https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800'), -- Monstera
('https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=800'), -- Zanzibar Gem
('https://images.unsplash.com/photo-1599598477150-13f898305f0a?w=800'), -- Snake Plant
('https://images.unsplash.com/photo-1597055181300-e3633a917e3c?w=800'), -- Fiddle Leaf Fig
('https://images.unsplash.com/photo-1593691509543-c55fb32e7355?w=800'), -- Peace Lily
('https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800'), -- Bougainvillea
('https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=800'), -- Succulent
('https://images.unsplash.com/photo-1551893665-f843f600794e?w=800'); -- Golden Barrel Cactus

INSERT INTO AnhSanPham (id_san_pham, duong_dan_anh, la_anh_chinh)
SELECT 
    s.id,
    img.url,
    1
FROM SanPham s
JOIN (
    SELECT url, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) as img_num
    FROM @Images
) img ON ((s.id % 8) + 1) = img.img_num;

-- Chèn Tài khoản thụ hưởng mẫu (Hỗ trợ PayOS / VietQR)
INSERT INTO TaiKhoanThuHuong (ten_ngan_hang, so_tai_khoan, chu_tai_khoan, is_mac_dinh, trang_thai) VALUES 
(N'MB Bank', '0366448294', N'Aether Shop', 1, 1);

-- Chèn Chuyên gia tư vấn mẫu
INSERT INTO ChuyenGia (ho_ten, vai_tro, hinh_anh, mo_ta, kinh_nghiem, chuyen_mon, email, social_fb) VALUES 
(N'TS. Nguyễn Văn Thảo', N'Chuyên gia Thực vật học', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', N'Hơn 15 năm nghiên cứu về các loài cây nhiệt đới và hệ sinh thái đô thị.', N'15 Năm', N'Thực vật học, Hệ sinh thái', 'thao.nguyen@aether.vn', 'fb.com/drthao.plant'),
(N'ThS. Lê Thị Mai', N'Nghệ nhân Bonsai', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', N'Chuyên gia về nghệ thuật Bonsai Nhật Bản và tạo dáng cây cảnh nghệ thuật.', N'10 Năm', N'Bonsai, Cây cảnh nghệ thuật', 'mai.le@aether.vn', 'fb.com/maibonsai'),
(N'KTS. Trần Hoàng Nam', N'Kiến trúc sư Cảnh quan', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', N'Thiết kế giải pháp không gian xanh cho căn hộ chung cư và văn phòng hiện đại.', N'8 Năm', N'Thiết kế cảnh quan, Urban Jungle', 'nam.tran@aether.vn', 'fb.com/namlandscape');


-- ─── TỰ ĐỘNG SINH HƠN 60 ĐƠN HÀNG + DÒNG TIỀN TRONG 30 NGÀY QUA ───
DECLARE @i INT = 1;
DECLARE @CustomerId INT;
DECLARE @OrderDate DATETIME;
DECLARE @DaysAgo INT;
DECLARE @OrderStatus NVARCHAR(50);
DECLARE @PaymentMethod NVARCHAR(50);
DECLARE @Address NVARCHAR(500);
DECLARE @OrderTotal DECIMAL(18,2);
DECLARE @OrderId INT;
DECLARE @RandomProductCount INT;
DECLARE @j INT;
DECLARE @RandomProductId INT;
DECLARE @ProductPrice DECIMAL(18,2);
DECLARE @Qty INT;
DECLARE @TransactionCode NVARCHAR(50);

WHILE @i <= 65
BEGIN
    -- 1. Lấy ngẫu nhiên 1 khách hàng mẫu
    SELECT TOP 1 @CustomerId = id, @Address = dia_chi FROM NguoiDung WHERE la_admin = 0 ORDER BY NEWID();

    -- 2. Sinh ngày đặt hàng phân bổ đều từ 30 ngày trước đến nay
    SET @DaysAgo = @i % 30; 
    SET @OrderDate = DATEADD(MINUTE, -CAST(RAND() * 1440 AS INT), DATEADD(DAY, -@DaysAgo, GETDATE()));

    -- 3. Trạng thái đơn hàng (Đơn hàng cũ đã giao thành công, đơn hàng mới nhất đang chờ xử lý/xác nhận)
    IF @DaysAgo = 0
    BEGIN
        SET @OrderStatus = CASE WHEN @i % 3 = 0 THEN N'Chờ xác nhận' WHEN @i % 3 = 1 THEN N'Chờ thanh toán' ELSE N'Đang xử lý' END;
    END
    ELSE IF @DaysAgo < 3
    BEGIN
        SET @OrderStatus = CASE WHEN @i % 2 = 0 THEN N'Đang giao' ELSE N'Đã giao' END;
    END
    ELSE
    BEGIN
        SET @OrderStatus = N'Đã giao';
    END

    -- 4. Phương thức thanh toán
    SET @PaymentMethod = CASE WHEN @i % 3 = 0 THEN 'VietQR' WHEN @i % 3 = 1 THEN 'Chuyển khoản' ELSE 'COD' END;

    -- 5. Tạo đơn hàng
    INSERT INTO DonHang (id_nguoi_dung, tong_tien_hang, dia_chi_giao_hang, phuong_thuc_thanh_toan, trang_thai_don_hang, ngay_dat)
    VALUES (@CustomerId, 0, @Address, @PaymentMethod, @OrderStatus, @OrderDate);

    SET @OrderId = SCOPE_IDENTITY();

    -- 6. Sinh từ 1 đến 3 sản phẩm chi tiết cho mỗi đơn hàng
    SET @RandomProductCount = CAST(1 + (RAND() * 3) AS INT);
    SET @j = 1;
    SET @OrderTotal = 0;

    WHILE @j <= @RandomProductCount
    BEGIN
        -- Chọn 1 sản phẩm ngẫu nhiên trong danh sách 200 cây
        SELECT TOP 1 @RandomProductId = id, @ProductPrice = gia_ban FROM SanPham ORDER BY NEWID();
        
        -- Đảm bảo không trùng lặp sản phẩm trong cùng đơn hàng
        IF NOT EXISTS (SELECT 1 FROM ChiTietDonHang WHERE id_don_hang = @OrderId AND id_san_pham = @RandomProductId)
        BEGIN
            SET @Qty = CAST(1 + (RAND() * 2) AS INT);
            INSERT INTO ChiTietDonHang (id_don_hang, id_san_pham, so_luong, gia_don_vi)
            VALUES (@OrderId, @RandomProductId, @Qty, @ProductPrice);
            
            SET @OrderTotal = @OrderTotal + (@Qty * @ProductPrice);
        END
        SET @j = @j + 1;
    END

    -- 7. Cập nhật lại tổng tiền cho đơn hàng
    UPDATE DonHang SET tong_tien_hang = @OrderTotal WHERE id = @OrderId;

    -- 8. Tự động sinh giao dịch THU trong ThuChi đối với đơn hàng Đã thanh toán hoặc Đã giao thành công
    IF @OrderStatus = N'Đã giao' OR @PaymentMethod = 'VietQR' OR @PaymentMethod = 'Chuyển khoản'
    BEGIN
        SET @TransactionCode = 'TN' + RIGHT('000000' + CAST(@OrderId AS VARCHAR(10)), 6) + 'O';
        INSERT INTO ThuChi (ma_giao_dich, loai, danh_muc, mo_ta, so_tien, ngay_giao_dich, ngay_tao)
        VALUES (@TransactionCode, 'Thu', N'Bán hàng', N'Thanh toán đơn hàng #' + CAST(@OrderId AS NVARCHAR), @OrderTotal, CAST(@OrderDate AS DATE), @OrderDate);
    END

    -- 9. Sinh thông báo lịch sử đơn hàng cho khách hàng
    INSERT INTO ThongBao (id_nguoi_dung, tieu_de, noi_dung, loai, da_doc, ngay_tao)
    VALUES (@CustomerId, N'Cập nhật đơn hàng #' + CAST(@OrderId AS NVARCHAR), N'Đơn hàng của bạn đã chuyển sang trạng thái: ' + @OrderStatus, 'DonHang', 1, @OrderDate);

    SET @i = @i + 1;
END;

-- ─── CHÈN THÊM CÁC KHOẢN CHI TIÊU CỬA HÀNG (CHI) ───
INSERT INTO ThuChi (ma_giao_dich, loai, danh_muc, mo_ta, so_tien, ngay_giao_dich) VALUES
('TC000001', 'Chi', N'Mặt bằng', N'Thanh toán tiền thuê mặt bằng tháng 4', 15000000, '2026-04-28'),
('TC000002', 'Chi', N'Lương nhân viên', N'Trả lương nhân viên tháng 4 (3 nhân viên)', 22500000, '2026-04-30'),
('TC000003', 'Chi', N'Nhập hàng', N'Nhập lô cây Monstera cát từ nhà vườn Đà Lạt', 8000000, '2026-05-02'),
('TC000004', 'Chi', N'Nhập hàng', N'Nhập chậu gốm sứ Bát Tràng tráng men', 4500000, '2026-05-05'),
('TC000005', 'Chi', N'Vận chuyển', N'Chi phí gửi xe vận chuyển cây từ nhà vườn', 1200000, '2026-05-06'),
('TC000006', 'Chi', N'Quảng cáo', N'Chạy quảng cáo Facebook Ads tuần 1 tháng 5', 3000000, '2026-05-07'),
('TC000007', 'Chi', N'Khác', N'Mua dụng cụ làm vườn, đất hữu cơ và phân bón', 1500000, '2026-05-10'),
('TC000008', 'Chi', N'Nhập hàng', N'Nhập lô sen đá & xương rồng vỉ từ nhà vườn', 3500000, '2026-05-12'),
('TC000009', 'Chi', N'Vận chuyển', N'Thanh toán phí COD giao hàng chậm đối tác GHTK', 2100000, '2026-05-15'),
('TC000010', 'Chi', N'Quảng cáo', N'Chạy quảng cáo Google Ads tuần 2 tháng 5', 2500000, '2026-05-16');


-- ─── CHÈN ĐÁNH GIÁ SẢN PHẨM THỰC TẾ (4-5 SAO) ───
DECLARE @ReviewText TABLE (txt NVARCHAR(500));
INSERT INTO @ReviewText VALUES
(N'Cây nhận được cực kỳ tươi tốt, lá xanh mướt không tì vết. Đóng gói rất kỹ càng luôn!'),
(N'Giao hàng nhanh khủng khiếp, chiều hôm trước đặt sáng hôm sau nhận được rồi. Cây siêu đẹp!'),
(N'Rất hài lòng với dịch vụ tư vấn của shop. Cây khỏe, dễ chăm, đã ra chồi mới.'),
(N'Chậu gốm đẹp xuất sắc, cây sen đá cũng rất mập mạp đáng yêu. Sẽ ủng hộ shop dài dài.'),
(N'Đáng đồng tiền bát gạo! Cây lưỡi hổ cao, dáng đẹp, đặt phòng ngủ cực kỳ sang xịn mịn.'),
(N'Cây có vài lá hơi dập nhẹ do vận chuyển nhưng shop hỗ trợ bù phân bón rất nhiệt tình. Cho 5 sao!'),
(N'Nhà tôi trồng được 2 tuần rồi, cây bàng phát triển rất tốt, lá to tròn căng tràn sức sống.'),
(N'Hạt giống tỉ lệ nảy mầm cao lắm, mình gieo 3 ngày đã thấy nhú mầm xanh rồi. Cảm ơn shop!'),
(N'Sản phẩm đẹp y hình, giá cả hợp lý so với chất lượng. Ship hàng nhanh, đóng gói cẩn thận.'),
(N'Cây xinh xỉu luôn á mọi người! Căn phòng sáng bừng hẳn lên từ khi có chậu cây này.');

DECLARE @k INT = 1;
DECLARE @ReviewProductId INT;
DECLARE @ReviewCustomerId INT;
DECLARE @ReviewStars INT;
DECLARE @ReviewMsg NVARCHAR(500);
DECLARE @ReviewDate DATETIME;

WHILE @k <= 45
BEGIN
    -- Lấy ngẫu nhiên sản phẩm và người dùng để đánh giá
    SELECT TOP 1 @ReviewProductId = id FROM SanPham ORDER BY NEWID();
    SELECT TOP 1 @ReviewCustomerId = id FROM NguoiDung WHERE la_admin = 0 ORDER BY NEWID();
    
    SET @ReviewStars = CASE WHEN @k % 8 = 0 THEN 4 ELSE 5 END; 
    SELECT TOP 1 @ReviewMsg = txt FROM @ReviewText ORDER BY NEWID();
    SET @ReviewDate = DATEADD(DAY, -CAST(RAND() * 25 AS INT), GETDATE()); 

    -- Đảm bảo mỗi khách hàng chỉ đánh giá 1 sản phẩm 1 lần
    IF NOT EXISTS (SELECT 1 FROM DanhGia WHERE id_san_pham = @ReviewProductId AND id_nguoi_dung = @ReviewCustomerId)
    BEGIN
        INSERT INTO DanhGia (id_san_pham, id_nguoi_dung, so_sao, noi_dung, ngay_viet)
        VALUES (@ReviewProductId, @ReviewCustomerId, @ReviewStars, @ReviewMsg, @ReviewDate);
    END

    SET @k = @k + 1;
END;

-- Cập nhật lại điểm đánh giá trung bình cho bảng sản phẩm dựa trên các đánh giá vừa sinh
WITH ReviewStats AS (
    SELECT id_san_pham, COUNT(*) AS count_val, AVG(CAST(so_sao AS FLOAT)) AS avg_val
    FROM DanhGia
    GROUP BY id_san_pham
)
UPDATE s
SET s.diem_danh_gia_tb = ROUND(r.avg_val, 1),
    s.tong_luot_danh_gia = r.count_val
FROM SanPham s
INNER JOIN ReviewStats r ON s.id = r.id_san_pham;


-- ─── CHÈN FEEDBACK PHẢN HỒI KHÁCH HÀNG LIVE ───
INSERT INTO PhanHoiKhachHang (ho_ten, email, tin_nhan, so_sao, ngay_gui, trang_thai, phan_hoi_admin, ngay_phan_hoi) VALUES
(N'Trần Thu Hà', 'thuha@gmail.com', N'Cây hạnh phúc nhà mình có vài lá bị rụng màu vàng, nhờ shop tư vấn giúp cách chăm sóc ạ!', 5, '2026-05-18', N'Đã phản hồi', N'Chào Hà, đây là hiện tượng bình thường khi cây thích nghi môi trường mới. Hà nên hạn chế tưới nước và để cây nơi thoáng mát nhé.', '2026-05-19'),
(N'Lê Minh Hoàng', 'hoang.le@gmail.com', N'Shop có bán sỉ chậu đất nung số lượng lớn không? Chiết khấu bao nhiêu %?', 5, '2026-05-20', N'Đã phản hồi', N'Dạ shop có bán sỉ chiết khấu lên đến 30% cho đơn từ 50 chậu ạ. Shop đã gửi email chi tiết cho anh nhé.', '2026-05-20'),
(N'Phạm Ngọc Mai', 'ngocmai@gmail.com', N'Em muốn mua tặng sinh nhật bạn, shop có nhận viết thiệp hộ và đóng gói quà không ạ?', 5, '2026-05-24', N'Chờ phản hồi', NULL, NULL),
(N'Nguyễn Duy Bách', 'duybach@gmail.com', N'Giao hàng nhanh cây đẹp, cảm ơn shop!', 5, '2026-05-24', N'Chờ phản hồi', NULL, NULL),
(N'Vũ Hải Đăng', 'haidang@gmail.com', N'Hạt giống rau cải mình mua gieo mãi không thấy lên shop ơi...', 3, '2026-05-24', N'Chờ phản hồi', NULL, NULL);

GO

-- 5. KIỂM TRA SAU KHI CHÈN
SELECT 'Bảng' AS [Đối tượng], 'Số lượng' AS [Kết quả]
UNION ALL SELECT N'Người dùng', CAST(COUNT(*) AS NVARCHAR) FROM NguoiDung
UNION ALL SELECT N'Danh mục SP', CAST(COUNT(*) AS NVARCHAR) FROM DanhMuc
UNION ALL SELECT N'Sản phẩm', CAST(COUNT(*) AS NVARCHAR) FROM SanPham
UNION ALL SELECT N'Bài viết Blog', CAST(COUNT(*) AS NVARCHAR) FROM BaiViet
UNION ALL SELECT N'Chuyên gia', CAST(COUNT(*) AS NVARCHAR) FROM ChuyenGia
UNION ALL SELECT N'Đơn hàng', CAST(COUNT(*) AS NVARCHAR) FROM DonHang
UNION ALL SELECT N'Đánh giá SP', CAST(COUNT(*) AS NVARCHAR) FROM DanhGia
UNION ALL SELECT N'Giao dịch Thu Chi', CAST(COUNT(*) AS NVARCHAR) FROM ThuChi;
GO
