const { query } = require('./db');
async function test() {
  try {
    const r = await query("SELECT id FROM NguoiDung WHERE email='phongdz2005@gmail.com'");
    const userId = r.recordset[0].id;
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: userId, role: 'Khách hàng', email: 'phongdz2005@gmail.com' }, 'aether_secret_key_change_in_prod');
    console.log('Sending request to my-orders with userId:', userId);
    const start = Date.now();
    const res = await fetch('http://localhost:5000/api/don-hang/my-orders', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Status:', res.status, 'Time:', Date.now() - start, 'ms');
    const text = await res.text();
    console.log('Data starts with:', text.substring(0, 100));
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}
test();
