const { getPool, query } = require('./db');

async function testConnection() {
  console.log('--- ĐANG KIỂM TRA KẾT NỐI DATABASE ---');
  console.log('Cấu hình từ .env:');
  console.log('DB_SERVER:', process.env.DB_SERVER);
  console.log('DB_INSTANCE:', process.env.DB_INSTANCE);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USER:', process.env.DB_USER);

  try {
    const pool = await getPool();
    console.log(' Kết nối Pool thành công!');
    
    // Check tables
    const tablesRes = await query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log(`Tìm thấy ${tablesRes.recordset.length} bảng trong database:`);
    tablesRes.recordset.forEach(t => console.log(' - ' + t.TABLE_NAME));

    // Check counts of major tables
    const checkTables = ['NguoiDung', 'SanPham', 'DanhMuc', 'DonHang', 'ChiTietDonHang', 'DanhGia', 'BaiViet', 'Kho', 'ThongKe', 'ThuChi', 'ThongBao', 'Experts'];
    for (const tbl of checkTables) {
      try {
        const countRes = await query(`SELECT COUNT(*) as cnt FROM [${tbl}]`);
        console.log(` ✅ Bảng [${tbl}]: ${countRes.recordset[0].cnt} dòng`);
      } catch (err) {
        console.log(` ⚠️ Bảng [${tbl}] KHÔNG TỒN TẠI hoặc LỖI: ${err.message}`);
      }
    }

  } catch (err) {
    console.error('❌ LỖI KẾT NỐI DATABASE:', err);
  } finally {
    process.exit(0);
  }
}

testConnection();
