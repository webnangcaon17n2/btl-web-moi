require('dotenv').config({ path: __dirname + '/.env' });
const bcrypt = require('bcrypt');
const { query } = require('./db');

async function test() {
  try {
    const users = await query('SELECT email, mat_khau_hash FROM NguoiDung');
    const commonPasses = ['123456', 'admin123', 'admin', '12345678', 'password', 'aether123', '123456a@', 'Admin@123', 'User@123'];
    for (const u of users.recordset) {
      let matched = false;
      for (const p of commonPasses) {
        if (u.mat_khau_hash && await bcrypt.compare(p, u.mat_khau_hash)) {
          console.log('Match found:', u.email, '->', p);
          matched = true;
          break;
        }
      }
      if (!matched) {
        console.log('No common password match for:', u.email);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}
test();
