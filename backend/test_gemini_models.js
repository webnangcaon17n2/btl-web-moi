const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function testModels() {
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro'];
  for (const m of models) {
    try {
      console.log(`Thử model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent('Hello');
      console.log(`✅ Model ${m} thành công! Response:`, res.response.text().slice(0, 50));
      break;
    } catch (err) {
      console.log(`❌ Model ${m} lỗi:`, err.message);
    }
  }
}

testModels();
