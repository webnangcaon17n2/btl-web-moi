const { query } = require('./db');

async function migrate() {
  try {
    // Thêm cột dia_chi
    await query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NguoiDung') AND name = 'dia_chi')
        ALTER TABLE NguoiDung ADD dia_chi NVARCHAR(500)
    `);
    console.log('+ dia_chi OK');

    // Thêm cột so_cccd
    await query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NguoiDung') AND name = 'so_cccd')
        ALTER TABLE NguoiDung ADD so_cccd NVARCHAR(20)
    `);
    console.log('+ so_cccd OK');

    // Thêm cột ngay_sinh
    await query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NguoiDung') AND name = 'ngay_sinh')
        ALTER TABLE NguoiDung ADD ngay_sinh DATE
    `);
    console.log('+ ngay_sinh OK');

    // Thêm cột gioi_tinh
    await query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NguoiDung') AND name = 'gioi_tinh')
        ALTER TABLE NguoiDung ADD gioi_tinh NVARCHAR(10)
    `);
    console.log('+ gioi_tinh OK');

    // Thêm cột que_quan
    await query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NguoiDung') AND name = 'que_quan')
        ALTER TABLE NguoiDung ADD que_quan NVARCHAR(500)
    `);
    console.log('+ que_quan OK');

    // Thêm cột la_admin (cần cho AuthContext)
    await query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NguoiDung') AND name = 'la_admin')
        ALTER TABLE NguoiDung ADD la_admin BIT DEFAULT 0
    `);
    console.log('+ la_admin OK');

    console.log('\n=== XONG! Tat ca cac cot da duoc them vao bang NguoiDung ===');
  } catch (err) {
    console.error('LOI:', err.message);
  }
  process.exit(0);
}

migrate();
