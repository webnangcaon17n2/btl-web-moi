const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('./db');
require('dotenv').config();

async function testChat() {
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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const strictModel = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: systemContext,
      generationConfig: { temperature: 0.2 }
    });

    const chat = strictModel.startChat({ history: [] });
    const result = await chat.sendMessage('Shop có bán sen đá không?');
    const response = await result.response;
    console.log('✅ Phản hồi thành công từ Gemini 3.6 Flash:');
    console.log(response.text());
  } catch (err) {
    console.error('LỖI CHATBOT:', err);
  } finally {
    process.exit(0);
  }
}

testChat();
