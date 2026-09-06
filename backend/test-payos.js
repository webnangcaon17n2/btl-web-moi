require('dotenv').config();
const { PayOS } = require('@payos/node');
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY
});

async function test() {
  try {
    const res = await payos.paymentRequests.get(568334);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
