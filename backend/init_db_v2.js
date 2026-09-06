const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function initDB() {
    try {
        let pool = await sql.connect(config);
        console.log('Connected to SQL Server');

        const ddl = `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DiaChiNguoiDung')
        BEGIN
            CREATE TABLE DiaChiNguoiDung (
                id INT PRIMARY KEY IDENTITY(1,1),
                user_id INT FOREIGN KEY REFERENCES NguoiDung(id),
                ho_ten NVARCHAR(255),
                so_dien_thoai VARCHAR(20),
                dia_chi NVARCHAR(MAX),
                is_default BIT DEFAULT 0
            );
        END

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Vouchers')
        BEGIN
            CREATE TABLE Vouchers (
                id INT PRIMARY KEY IDENTITY(1,1),
                ma_voucher VARCHAR(50) UNIQUE,
                gia_tri_giam DECIMAL(18,2),
                ngay_het_han DATETIME,
                so_luong INT
            );
        END

        -- Đồng bộ địa chỉ hiện tại vào bảng mới cho tất cả người dùng
        INSERT INTO DiaChiNguoiDung (user_id, ho_ten, so_dien_thoai, dia_chi, is_default)
        SELECT id, ho_ten, so_dien_thoai, dia_chi, 1 
        FROM NguoiDung 
        WHERE dia_chi IS NOT NULL AND dia_chi <> ''
        AND id NOT IN (SELECT user_id FROM DiaChiNguoiDung);
        `;

        await pool.request().query(ddl);
        console.log('Database initialized successfully (DiaChiNguoiDung & Vouchers)');
        process.exit(0);
    } catch (err) {
        console.error('Database Init Error:', err);
        process.exit(1);
    }
}

initDB();
