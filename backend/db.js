const sql = require('mssql')
require('dotenv').config()

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'AetherPlantShop',
  user: process.env.DB_USER || 'saaa',
  password: process.env.DB_PASSWORD,
  options: {
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
}

if (process.env.DB_PORT) {
  config.port = parseInt(process.env.DB_PORT, 10)
}

let pool = null

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config)
    console.log('✅ Kết nối SQL Server thành công:', process.env.DB_NAME)
  }
  return pool
}

async function query(sqlString, params = {}) {
  const p = await getPool()
  const request = p.request()
  for (const [key, value] of Object.entries(params)) {
    // Tự động convert string số nguyên → Number để mssql map đúng kiểu INT
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      request.input(key, parseInt(value, 10))
    } else {
      request.input(key, value)
    }
  }
  return request.query(sqlString)
}

module.exports = { sql, getPool, query }
