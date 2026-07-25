import pool from '../config/db.js';

export const socialAuthModel = {
    // 1. Tìm liên kết social theo provider và uid
    async findByProvider(provider, provider_uid) {
        const [rows] = await pool.query(
            'SELECT * FROM user_auth_providers WHERE provider = ? AND provider_uid = ?',
            [provider, String(provider_uid)]
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
    async linkProvider(userId, provider, provider_uid) {
        await pool.query(
            'INSERT INTO user_auth_providers (user_id, provider, provider_uid) VALUES (?, ?, ?)',
            [userId, provider, String(provider_uid)]
        );
    },

    // 4. Mới hoàn toàn: Tạo thư mục User (không cần password)
    async createUser({ email, name, picture }) {
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        
        // Trả về insertId sau khi tạo
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password, display_name, avatar_url) VALUES (?, ?, NULL, ?, ?)',
            [username, email.toLowerCase(), name, picture || null]
        );
        
        return result.insertId;
    }
};
