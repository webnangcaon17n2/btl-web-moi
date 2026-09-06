const { query } = require('./db');

async function testUsers() {
  const res = await query(`SELECT TOP 5 id, email, ho_ten, vai_tro, dang_hoat_dong FROM NguoiDung`);
  console.log(JSON.stringify(res.recordset, null, 2));
  process.exit(0);
}
testUsers();
