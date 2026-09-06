const { query } = require('./db');

async function getAdmin() {
  try {
    const result = await query(`SELECT id, email, vai_tro FROM NguoiDung WHERE vai_tro IN (N'Admin', N'Admin Tổng')`);
    console.log(result);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

getAdmin();
