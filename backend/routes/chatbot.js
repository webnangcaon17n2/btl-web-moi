const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('../db');
require('dotenv').config();

const modelName = "gemini-3.6-flash";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/chat', async (req, res) => {
  const { message, history } = req.body;

  try {
    const productsResult = await query(`
      SELECT s.ten_san_pham, s.gia_ban, d.ten_danh_muc 
      FROM SanPham s 
      JOIN DanhMuc d ON s.id_danh_muc = d.id 
      WHERE s.trang_thai NOT IN (N'Ẩn', N'Hết hàng')
    `);

    const productList = productsResult.recordset.map(p =>
      `- ${p.ten_san_pham} (Loại: ${p.ten_danh_muc}, Giá: ${p.gia_ban.toLocaleString()}đ)`
    ).join('\n');

    const systemContext = `Bạn là nhân viên tư vấn ảo độc quyền của Aether Plant Shop. Chỉ trả lời trong phạm vi 80 chữ.

Danh sách sản phẩm:
${productList}

QUY TẮC BẮT BUỘC:
1. CHỈ tư vấn về cây có trong danh sách trên. Không có thì báo chưa có và gợi ý cây tương tự trong danh sách.
2. TUYỆT ĐỐI KHÔNG trả lời câu hỏi ngoài lề (địa danh, trường học, thời tiết, toán, code, xã hội...).
3. Nếu khách hỏi ngoài lề, PHẢI trả lời duy nhất câu sau: "Xin lỗi, em là trợ lý ảo của Aether Plant Shop nên chỉ có thể giúp anh/chị tư vấn về các sản phẩm cây cảnh của shop thôi ạ. Anh/chị có cần em hỗ trợ tìm loại cây nào không?"
4. Trả lời thân thiện, ngắn gọn bằng tiếng Việt.`;

    const strictModel = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemContext,
      generationConfig: { temperature: 0.0 }
    });

    let validHistory = [];
    if (history && Array.isArray(history)) {
      history.forEach((item, index) => {
        if (index % 2 === 0 && item.role === 'user') validHistory.push(item);
        if (index % 2 === 1 && item.role === 'model') validHistory.push(item);
      });
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
        validHistory.pop();
      }
    }

    const chat = strictModel.startChat({ history: validHistory });
    const result = await chat.sendMessage(message);
    const response = await result.response;

    res.json({ text: response.text() });
  } catch (error) {
    console.error('SERVER Gemini Error:', error.message);
    res.status(500).json({ error: 'Chatbot đang bận một chút!' });
  }
});

module.exports = router;