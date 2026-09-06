const { query } = require('./db');

async function seedData() {
    try {
        console.log('Đang cập nhật dữ liệu mẫu cho chuyên gia...');
        
        // Cập nhật Lê Minh Trí (Hoàng Tùng Dương - dựa trên ảnh/tên người dùng đã sửa)
        // Chú ý: Ở đây tôi sẽ update dựa trên ID 1, 2, 3
        await query(`
            UPDATE ChuyenGia SET 
                kinh_nghiem = N'15 Năm', 
                chuyen_mon = N'Thực vật học & Thiết kế cảnh quan',
                email = 'duong.hoang@aether.com',
                social_fb = 'https://facebook.com/aether',
                mo_ta = N'Chuyên gia với hơn 15 năm kinh nghiệm trong ngành thực vật học, từng tham gia nhiều dự án phủ xanh đô thị lớn.'
            WHERE id = 1
        `);

        await query(`
            UPDATE ChuyenGia SET 
                kinh_nghiem = N'8 Năm', 
                chuyen_mon = N'Thiết kế không gian xanh',
                email = 'phong.nguyen@aether.com',
                social_fb = 'https://facebook.com/aether',
                mo_ta = N'Nhà thiết kế sáng tạo với niềm đam mê kết hợp nghệ thuật hiện đại vào không gian sống tự nhiên.'
            WHERE id = 2
        `);

        await query(`
            UPDATE ChuyenGia SET 
                kinh_nghiem = N'12 Năm', 
                chuyen_mon = N'Chăm sóc thực vật quý hiếm',
                email = 'tiep.nguyen@aether.com',
                social_fb = 'https://facebook.com/aether',
                mo_ta = N'Chuyên gia hàng đầu về kỹ thuật nhân giống và bảo tồn các loài thực vật cảnh quý hiếm.'
            WHERE id = 3
        `);

        console.log('Cập nhật dữ liệu thành công!');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi khi cập nhật dữ liệu:', error);
        process.exit(1);
    }
}

seedData();
