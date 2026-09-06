const express = require('express')
const router = express.Router()
const { query, sql } = require('../db')

// GET /api/san-pham - Lấy tất cả sản phẩm (bao gồm mọi trạng thái cho Admin)
router.get('/', async (req, res) => {
  const { admin } = req.query // /api/san-pham?admin=1 để lấy cả ẩn/hết hàng
  try {
    const whereClause = admin ? '' : `WHERE s.trang_thai NOT IN (N'Ẩn', N'Hết hàng')`
    const result = await query(`
      SELECT 
        s.id, s.ten_san_pham, s.duong_dan_seo, s.ma_sku,
        s.chat_lieu_chau, s.don_vi, s.nhan_san_pham,
        s.gia_ban, s.gia_cu, s.gia_nhap,
        s.so_luong_kho, s.so_luong_toi_thieu, s.trang_thai,
        s.diem_danh_gia_tb, s.tong_luot_danh_gia,
        s.mo_ta, s.huong_dan_cham_soc,
        s.ngay_tao, s.ngay_cap_nhat,
        d.ten_danh_muc AS category,
        (SELECT TOP 1 duong_dan_anh FROM AnhSanPham 
         WHERE id_san_pham = s.id AND la_anh_chinh = 1) AS anh_bia,
        (SELECT ISNULL(SUM(ct.so_luong), 0) 
         FROM ChiTietDonHang ct
         JOIN DonHang dh ON ct.id_don_hang = dh.id
         WHERE ct.id_san_pham = s.id AND dh.trang_thai_don_hang = N'Đã giao') AS da_ban
      FROM SanPham s
      LEFT JOIN DanhMuc d ON s.id_danh_muc = d.id
      ${whereClause}
      ORDER BY s.id DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Lỗi lấy danh sách sản phẩm' })
  }
})

// GET /api/san-pham/top-rated - Lấy 2 sản phẩm có đánh giá cao nhất
router.get('/top-rated', async (req, res) => {
  try {
    const result = await query(`
      SELECT TOP 2
        s.id, s.ten_san_pham, s.duong_dan_seo, s.gia_ban, s.diem_danh_gia_tb,
        (SELECT TOP 1 duong_dan_anh FROM AnhSanPham 
         WHERE id_san_pham = s.id AND la_anh_chinh = 1) AS anh_bia
      FROM SanPham s
      WHERE s.trang_thai NOT IN (N'Ẩn', N'Hết hàng')
      ORDER BY s.diem_danh_gia_tb DESC, s.tong_luot_danh_gia DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Lỗi lấy sản phẩm nổi bật' })
  }
})

// GET /api/san-pham/search - Tìm kiếm sản phẩm thông minh (BigData)
// Hàm loại bỏ dấu tiếng Việt để so khớp không dấu
function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Hàm tính khoảng cách Levenshtein giữa 2 từ để phát hiện lỗi gõ sai (typo)
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // thay thế
          matrix[i][j - 1] + 1,     // thêm
          matrix[i - 1][j] + 1      // xoá
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Tính điểm trùng khớp thông minh (Higher score = Better match)
function calculateMatchScore(productName, categoryName, queryText) {
  const cleanName = removeVietnameseTones(productName);
  const cleanCategory = removeVietnameseTones(categoryName || '');
  const cleanQuery = removeVietnameseTones(queryText);

  // 1. Khớp hoàn toàn tên sản phẩm
  if (cleanName === cleanQuery) return 100;

  // 2. Khớp bắt đầu bằng tên sản phẩm
  if (cleanName.startsWith(cleanQuery)) return 90 - (cleanName.length - cleanQuery.length);

  // 3. Khớp chuỗi con trong tên sản phẩm
  if (cleanName.includes(cleanQuery)) return 80 - (cleanName.indexOf(cleanQuery) * 0.5);

  // 4. Khớp tên danh mục
  if (cleanCategory === cleanQuery) return 70;
  if (cleanCategory.includes(cleanQuery)) return 60;

  // 5. Khớp từng từ (Token matching) + Levenshtein từng từ (Cho phép gõ sai)
  const nameWords = cleanName.split(' ');
  const queryWords = cleanQuery.split(' ');
  
  let matchCount = 0;
  let fuzzyMatchCount = 0;
  
  for (const qWord of queryWords) {
    if (!qWord) continue;
    
    let foundExact = false;
    let foundFuzzy = false;
    
    for (const nWord of nameWords) {
      if (!nWord) continue;
      if (nWord === qWord) {
        foundExact = true;
        break;
      }
      
      // Tính Levenshtein giữa các từ
      const dist = levenshteinDistance(qWord, nWord);
      // Nếu từ ngắn (>=3 ký tự) sai khác 1 ký tự, hoặc từ dài (>=5 ký tự) sai khác <= 2 ký tự
      if ((qWord.length >= 3 && dist <= 1) || (qWord.length >= 5 && dist <= 2)) {
        foundFuzzy = true;
      }
    }
    
    if (foundExact) {
      matchCount++;
    } else if (foundFuzzy) {
      fuzzyMatchCount++;
    }
  }
  
  const totalQueryWords = queryWords.filter(Boolean).length;
  if (totalQueryWords === 0) return 0;

  const matchRatio = (matchCount + fuzzyMatchCount * 0.7) / totalQueryWords;
  if (matchRatio >= 0.5) {
    return 50 * matchRatio;
  }

  // 6. Tính Levenshtein toàn cục cho từ khóa ngắn
  const globalDist = levenshteinDistance(cleanQuery, cleanName);
  if (globalDist <= 2) {
    return 40 - globalDist * 5;
  }
  
  return 0;
}

router.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    // Nếu không có từ khoá, trả về gợi ý sản phẩm hot/mới nhất làm Trending
    if (!q || q.trim() === '') {
      const trending = await query(`
        SELECT TOP 8 s.id, s.ten_san_pham, s.gia_ban, s.gia_cu, s.duong_dan_seo,
          d.ten_danh_muc AS category,
          (SELECT TOP 1 duong_dan_anh FROM AnhSanPham WHERE id_san_pham = s.id AND la_anh_chinh = 1) AS anh_bia
        FROM SanPham s 
        LEFT JOIN DanhMuc d ON s.id_danh_muc = d.id
        WHERE s.trang_thai NOT IN (N'Ẩn') 
        ORDER BY s.diem_danh_gia_tb DESC, s.id DESC
      `);
      
      const formattedTrending = trending.recordset.map(p => ({
        ...p,
        categoryPath: p.category ? `${p.category} > ${p.ten_san_pham}` : p.ten_san_pham
      }));
      return res.json(formattedTrending);
    }

    const cleanQ = q.trim();
    
    // Bước 1: Thử truy vấn tối ưu từ Database bằng LIKE
    const result = await query(`
      SELECT TOP 100 s.id, s.ten_san_pham, s.gia_ban, s.gia_cu, s.duong_dan_seo,
        d.ten_danh_muc AS category,
        (SELECT TOP 1 duong_dan_anh FROM AnhSanPham WHERE id_san_pham = s.id AND la_anh_chinh = 1) AS anh_bia
      FROM SanPham s
      LEFT JOIN DanhMuc d ON s.id_danh_muc = d.id
      WHERE s.trang_thai NOT IN (N'Ẩn')
        AND (s.ten_san_pham LIKE @likeQ OR d.ten_danh_muc LIKE @likeQ OR s.ma_sku LIKE @likeQ)
    `, { likeQ: `%${cleanQ}%` });
    
    let dbProducts = result.recordset;

    // Bước 2: Dự phòng (Fallback) - Nếu kết quả ít (< 6), tải thêm các sản phẩm đang bán khác 
    // để so khớp Fuzzy bằng Levenshtein (hỗ trợ trường hợp người dùng gõ sai chính tả trầm trọng)
    if (dbProducts.length < 6) {
      const fallbackResult = await query(`
        SELECT TOP 200 s.id, s.ten_san_pham, s.gia_ban, s.gia_cu, s.duong_dan_seo,
          d.ten_danh_muc AS category,
          (SELECT TOP 1 duong_dan_anh FROM AnhSanPham WHERE id_san_pham = s.id AND la_anh_chinh = 1) AS anh_bia
        FROM SanPham s
        LEFT JOIN DanhMuc d ON s.id_danh_muc = d.id
        WHERE s.trang_thai NOT IN (N'Ẩn')
      `);
      
      const existingIds = new Set(dbProducts.map(p => p.id));
      for (const p of fallbackResult.recordset) {
        if (!existingIds.has(p.id)) {
          dbProducts.push(p);
        }
      }
    }

    // Bước 3: So khớp và xếp hạng ở NodeJS Backend dùng Fuzzy & Levenshtein
    const scoredProducts = dbProducts
      .map(p => {
        const score = calculateMatchScore(p.ten_san_pham, p.category, cleanQ);
        return {
          ...p,
          score,
          categoryPath: p.category ? `${p.category} > ${p.ten_san_pham}` : p.ten_san_pham
        };
      })
      .filter(p => p.score > 0) // Chỉ giữ các sản phẩm khớp ở một mức độ nào đó
      .sort((a, b) => b.score - a.score); // Sắp xếp độ khớp giảm dần

    // Trả về Top 10 kết quả tốt nhất
    res.json(scoredProducts.slice(0, 10));
  } catch (err) {
    console.error('[BigData Advanced Search Error]:', err.message);
    res.status(500).json({ error: 'Lỗi tìm kiếm nâng cao' });
  }
})

// GET /api/san-pham/:id - Lấy 1 sản phẩm
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*, d.ten_danh_muc AS category,
        (SELECT TOP 1 duong_dan_anh FROM AnhSanPham WHERE id_san_pham = s.id AND la_anh_chinh = 1) AS anh_bia
      FROM SanPham s
      LEFT JOIN DanhMuc d ON s.id_danh_muc = d.id
      WHERE s.id = @id
    `, { id: req.params.id })
    if (!result.recordset.length) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy sản phẩm' })
  }
})

// POST /api/san-pham - Thêm sản phẩm mới
router.post('/', async (req, res) => {
  const {
    ten_san_pham, ma_sku, id_danh_muc,
    gia_ban, gia_cu, gia_nhap,
    chat_lieu_chau, don_vi, nhan_san_pham,
    so_luong_kho, so_luong_toi_thieu, mo_ta,
    anh_bia  // URL ảnh (nếu có)
  } = req.body

  if (!ten_san_pham || gia_ban === undefined || gia_ban === null) {
    return res.status(400).json({ error: 'Tên sản phẩm và giá bán là bắt buộc!' })
  }

  // Tự tạo slug SEO từ tên + timestamp để tránh trùng
  const slug = ten_san_pham
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-') + '-' + Date.now()

  // Tự tạo SKU nếu không truyền lên
  const sku = ma_sku || 'SP' + Date.now()

  try {
    const result = await query(`
      INSERT INTO SanPham 
        (ten_san_pham, duong_dan_seo, ma_sku, id_danh_muc,
         gia_ban, gia_cu, gia_nhap,
         chat_lieu_chau, don_vi, nhan_san_pham,
         so_luong_kho, so_luong_toi_thieu, mo_ta, trang_thai)
      OUTPUT INSERTED.id
      VALUES 
        (@ten_san_pham, @slug, @sku, @id_danh_muc,
         @gia_ban, @gia_cu, @gia_nhap,
         @chat_lieu_chau, @don_vi, @nhan_san_pham,
         @so_luong_kho, @so_luong_toi_thieu, @mo_ta, N'Đang bán')
    `, {
      ten_san_pham,
      slug,
      sku,
      id_danh_muc: id_danh_muc ? parseInt(id_danh_muc) : null,
      gia_ban: Number(gia_ban),
      gia_cu: gia_cu ? Number(gia_cu) : null,
      gia_nhap: gia_nhap ? Number(gia_nhap) : 0,
      chat_lieu_chau: chat_lieu_chau || null,
      don_vi: don_vi || 'Chậu',
      nhan_san_pham: nhan_san_pham || null,
      so_luong_kho: parseInt(so_luong_kho) || 0,
      so_luong_toi_thieu: parseInt(so_luong_toi_thieu) || 5,
      mo_ta: mo_ta || '',
    })

    const newId = result.recordset[0].id

    // Nếu có ảnh bìa → INSERT vào AnhSanPham
    if (anh_bia) {
      await query(`
        INSERT INTO AnhSanPham (id_san_pham, duong_dan_anh, la_anh_chinh)
        VALUES (@id, @url, 1)
      `, { id: newId, url: anh_bia })
    }

    res.status(201).json({ message: 'Thêm sản phẩm thành công!', id: newId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Lỗi thêm sản phẩm' })
  }
})

// PUT /api/san-pham/:id - Cập nhật sản phẩm
router.put('/:id', async (req, res) => {
  const {
    ten_san_pham, gia_ban, gia_cu, gia_nhap,
    so_luong_kho, so_luong_toi_thieu,
    trang_thai, nhan_san_pham,
    chat_lieu_chau, don_vi, mo_ta,
    anh_bia  // URL ảnh mới (nếu muốn cập nhật)
  } = req.body

  try {
    await query(`
      UPDATE SanPham SET
        ten_san_pham     = ISNULL(@ten_san_pham, ten_san_pham),
        gia_ban          = ISNULL(@gia_ban, gia_ban),
        gia_cu           = @gia_cu,
        gia_nhap         = ISNULL(@gia_nhap, gia_nhap),
        so_luong_kho     = ISNULL(@so_luong_kho, so_luong_kho),
        so_luong_toi_thieu = ISNULL(@so_luong_toi_thieu, so_luong_toi_thieu),
        trang_thai       = ISNULL(@trang_thai, trang_thai),
        nhan_san_pham    = @nhan_san_pham,
        chat_lieu_chau   = ISNULL(@chat_lieu_chau, chat_lieu_chau),
        don_vi           = ISNULL(@don_vi, don_vi),
        mo_ta            = ISNULL(@mo_ta, mo_ta),
        ngay_cap_nhat    = GETDATE()
      WHERE id = @id
    `, {
      ten_san_pham: ten_san_pham || null,
      gia_ban: gia_ban !== undefined ? Number(gia_ban) : null,
      gia_cu: gia_cu ? Number(gia_cu) : null,
      gia_nhap: gia_nhap ? Number(gia_nhap) : null,
      so_luong_kho: so_luong_kho !== undefined ? parseInt(so_luong_kho) : null,
      so_luong_toi_thieu: so_luong_toi_thieu ? parseInt(so_luong_toi_thieu) : null,
      trang_thai: trang_thai || null,
      nhan_san_pham: nhan_san_pham || null,
      chat_lieu_chau: chat_lieu_chau || null,
      don_vi: don_vi || null,
      mo_ta: mo_ta || null,
      id: parseInt(req.params.id),
    })

    // Cập nhật ảnh nếu có truyền URL mới
    if (anh_bia) {
      // Xoá ảnh chính cũ, thêm ảnh mới
      await query(`
        UPDATE AnhSanPham SET la_anh_chinh = 0 WHERE id_san_pham = @id
      `, { id: req.params.id })
      await query(`
        IF EXISTS (SELECT 1 FROM AnhSanPham WHERE id_san_pham = @id AND duong_dan_anh = @url)
          UPDATE AnhSanPham SET la_anh_chinh = 1 WHERE id_san_pham = @id AND duong_dan_anh = @url
        ELSE
          INSERT INTO AnhSanPham (id_san_pham, duong_dan_anh, la_anh_chinh) VALUES (@id, @url, 1)
      `, { id: req.params.id, url: anh_bia })
    }

    res.json({ message: 'Cập nhật thành công!' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Lỗi cập nhật sản phẩm' })
  }
})

// DELETE /api/san-pham/:id - Xóa sản phẩm
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    // Xóa ảnh trước (tránh lỗi foreign key nếu không có CASCADE)
    await query(`DELETE FROM AnhSanPham WHERE id_san_pham = @id`, { id })

    // Xóa sản phẩm
    const result = await query(`DELETE FROM SanPham WHERE id = @id`, { id })

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm để xóa' })
    }
    res.json({ message: 'Đã xóa sản phẩm!' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Lỗi xóa sản phẩm' })
  }
})



module.exports = router
