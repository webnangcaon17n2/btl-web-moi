const bcrypt = require('bcrypt')
const { query } = require('./db')

async function resetAdminPasswords() {
  const hash = await bcrypt.hash('admin123', 10)
  console.log('Generated hash:', hash)

  await query(
    `UPDATE NguoiDung SET mat_khau_hash = @h WHERE vai_tro IN (N'Admin', N'Admin Tổng')`,
    { h: hash }
  )
  console.log('✅ Đã cập nhật mật khẩu admin thành công!')

  // Xác minh lại
  const verify = await bcrypt.compare('admin123', hash)
  console.log('Verify bcrypt:', verify)

  process.exit(0)
}

resetAdminPasswords().catch(e => { console.error(e); process.exit(1) })
