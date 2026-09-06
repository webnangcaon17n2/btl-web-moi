const jwt = require('jsonwebtoken');

const BASE_URL = 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'aether_secret_key_change_in_prod';

const adminToken = jwt.sign({ id: 1, email: 'admin@aether.com', vai_tro: 'Admin Tổng' }, JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: 3, email: 'khachhang@gmail.com', vai_tro: 'Khách hàng' }, JWT_SECRET, { expiresIn: '1h' });

const results = [];

async function callApi(name, path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { 
    method, 
    headers,
    signal: AbortSignal.timeout(8000)
  };
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    opts.body = JSON.stringify(body);
  }

  const start = Date.now();
  try {
    process.stdout.write(`Đang test: ${method} ${path} ... `);
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const duration = Date.now() - start;
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    const passed = res.status >= 200 && res.status < 300;
    const isExpected401 = res.status === 401 && name.includes('expect 401');
    const isExpected404 = res.status === 404 && name.includes('expect 404');
    const ok = passed || isExpected401 || isExpected404;

    const summary = {
      name,
      endpoint: `${method} ${path}`,
      status: res.status,
      passed: ok,
      duration: `${duration}ms`,
      sample: typeof data === 'object' ? JSON.stringify(data).slice(0, 100) : String(data).slice(0, 100),
      errorDetail: ok ? null : (typeof data === 'object' ? JSON.stringify(data) : data)
    };
    results.push(summary);

    if (ok) {
      console.log(`✅ [${res.status}] (${duration}ms)`);
    } else {
      console.log(`❌ [${res.status}] (${duration}ms) - Lỗi: ${summary.errorDetail}`);
    }
    return { ok, status: res.status, data };
  } catch (err) {
    const duration = Date.now() - start;
    const summary = {
      name,
      endpoint: `${method} ${path}`,
      status: 'ERR',
      passed: false,
      duration: `${duration}ms`,
      sample: null,
      errorDetail: err.message
    };
    results.push(summary);
    console.log(`❌ [TIMEOUT/ERROR] (${duration}ms) - ${err.message}`);
    return { ok: false, status: 'ERR', error: err.message };
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM TRA TOÀN BỘ CÁC API CỦA HỆ THỐNG');
  console.log('====================================================\n');

  // 1. Health check
  await callApi('Health Check & DB Status', '/');

  // 2. Auth API
  await callApi('Auth: Get Profile (Me - User)', '/api/auth/me', 'GET', null, userToken);
  await callApi('Auth: Get Profile (Me - Admin)', '/api/auth/me', 'GET', null, adminToken);
  await callApi('Auth: Get Profile (No token - expect 401)', '/api/auth/me');

  // 3. Products (SanPham)
  await callApi('Products: List Public', '/api/san-pham');
  await callApi('Products: List Admin', '/api/san-pham?admin=1');
  await callApi('Products: Top Rated', '/api/san-pham/top-rated');
  await callApi('Products: Search Trending', '/api/san-pham/search');
  await callApi('Products: Search Query', '/api/san-pham/search?q=sen');
  await callApi('Products: Detail Product ID 1', '/api/san-pham/1');

  // 4. Categories (DanhMuc)
  await callApi('Categories: List with Count', '/api/danh-muc');

  // 5. Orders (DonHang)
  await callApi('Orders: List All (Admin)', '/api/don-hang');
  await callApi('Orders: My Orders (User)', '/api/don-hang/my-orders', 'GET', null, userToken);
  await callApi('Orders: Available Vouchers', '/api/don-hang/vouchers');
  await callApi('Orders: Checkout Data', '/api/don-hang/checkout-data?userId=3');
  await callApi('Orders: Bank Info', '/api/don-hang/bank-info');
  await callApi('Orders: Check Voucher (expect 404)', '/api/don-hang/check-voucher?code=NONEXISTENT&totalAmount=100000');
  await callApi('Orders: Check Status of Order 1', '/api/don-hang/status/1');

  // 6. Users (NguoiDung)
  await callApi('Users: List All Users (Admin)', '/api/nguoi-dung');
  await callApi('Users: User Profile ID 3', '/api/nguoi-dung/profile/3');
  await callApi('Users: User Addresses', '/api/nguoi-dung/addresses?userId=3');

  // 7. Reviews (DanhGia)
  await callApi('Reviews: List All (Admin)', '/api/danh-gia');
  await callApi('Reviews: Product Reviews (ID 1)', '/api/danh-gia/1');

  // 8. Blog Posts (BaiViet)
  await callApi('Blog: Published Posts', '/api/bai-viet');
  await callApi('Blog: All Posts (Admin)', '/api/bai-viet/all');

  // 9. Inventory (Kho)
  await callApi('Inventory: Stock List', '/api/kho');

  // 10. Statistics (ThongKe)
  await callApi('Statistics: Dashboard Summary', '/api/thong-ke');

  // 11. Contact & Reviews/Feedback
  await callApi('Contact: Testimonials (Home)', '/api/contact/testimonials');
  await callApi('Contact: All Testimonials (Review Page)', '/api/contact/all-testimonials');
  await callApi('Contact: Admin Feedbacks', '/api/contact/admin', 'GET', null, adminToken);

  // 12. Experts (ChuyenGia)
  await callApi('Experts: List All Experts', '/api/experts');

  // 13. Notifications
  await callApi('Notifications: Admin Live Notifications', '/api/notifications/admin', 'GET', null, adminToken);
  await callApi('Notifications: User Notifications', '/api/notifications', 'GET', null, userToken);

  // 14. Cash Flow (ThuChi)
  await callApi('ThuChi: List Transactions', '/api/thu-chi');

  // 15. Chatbot
  await callApi('Chatbot: Ask product recommendation', '/api/chatbot/chat', 'POST', {
    message: 'Shop có bán sen đá không?',
    history: []
  });

  // Summary
  console.log('\n====================================================');
  console.log('📊 TỔNG KẾT KIỂM TRA');
  console.log('====================================================');
  const pass = results.filter(r => r.passed).length;
  const fail = results.filter(r => !r.passed).length;
  console.log(`Kết quả: ${pass}/${results.length} API hoạt động bình thường.`);
  if (fail > 0) {
    console.log(`Có ${fail} API gặp lỗi hoặc cần điều chỉnh:`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(` - ${r.endpoint}: ${r.errorDetail}`);
    });
  } else {
    console.log('Tất cả API đều hoạt động hoàn hảo!');
  }
  process.exit(0);
}

runTests();
