import pool from '../config/db.js';

export const socialAuthModel = {
    // 1. Tìm liên kết social theo provider và uid
    async findByProvider(nha_cung_cap, uid_nha_cung_cap) {
        const [rows] = await pool.query(
            'SELECT * FROM user_auth_providers WHERE nha_cung_cap = ? AND uid_nha_cung_cap = ?',
            [nha_cung_cap, String(uid_nha_cung_cap)]
        );
        return rows[0] || null;
    },

    // 2. Tìm điểm chung: user bằng email
    async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email.toLowerCase()]
        );
        return rows[0] || null;
    },

    // 3. Liên kết account (Thêm vào user_auth_providers)
    async linkProvider(userId, nha_cung_cap, uid_nha_cung_cap) {
        await pool.query(
            'INSERT INTO user_auth_providers (ma_nguoi_dung, nha_cung_cap, uid_nha_cung_cap) VALUES (?, ?, ?)',
            [userId, nha_cung_cap, String(uid_nha_cung_cap)]
        );
    },

    // 4. Mới hoàn toàn: Tạo thư mục User (không cần password)
    async createUser({ email, name, picture }) {
        const ten_dang_nhap = email.split('@')[0] + Math.floor(Math.random() * 1000);
        
        // Trả về insertId sau khi tạo
        const [result] = await pool.query(
            'INSERT INTO users (ten_dang_nhap, email, mat_khau, ten_hien_thi, anh_dai_dien) VALUES (?, ?, NULL, ?, ?)',
            [ten_dang_nhap, email.toLowerCase(), name, picture || null]
        );
        
        return result.insertId;
    }
};
