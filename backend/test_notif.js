const { query } = require('./db');

async function test() {
  try {
    // 1. Kiểm tra bảng ThongBao tồn tại và cấu trúc
    console.log('=== Checking ThongBao table ===');
    const cols = await query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ThongBao'
    `);
    console.log('Columns:', cols.recordset.map(c => c.COLUMN_NAME));

    // 2. Xem records hiện tại
    const existing = await query('SELECT TOP 5 * FROM ThongBao ORDER BY ngay_tao DESC');
    console.log('Existing records:', existing.recordset.length);
    console.log(JSON.stringify(existing.recordset, null, 2));

    // 3. Thử insert
    console.log('\n=== Testing INSERT ===');
    const ins = await query(
      `INSERT INTO ThongBao (id_nguoi_dung, tieu_de, noi_dung, loai, ngay_tao)
       VALUES (@userId, @tieuDe, @noiDung, 'DonHang', GETUTCDATE())`,
      { userId: 1, tieuDe: 'Test thong bao', noiDung: 'Noi dung test tu script' }
    );
    console.log('Insert rowsAffected:', ins.rowsAffected);

    // 4. Lấy lại để xác nhận
    const check = await query('SELECT TOP 1 * FROM ThongBao ORDER BY ngay_tao DESC');
    console.log('Latest record after insert:', JSON.stringify(check.recordset[0], null, 2));

    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

test();
