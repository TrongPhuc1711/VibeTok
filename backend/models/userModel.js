import pool from '../config/db.js';

// Chuyển đổi từ DB fields → frontend fields
export const normalizeUser = (u) => {
    if (!u) return null;
    const fullName = u.display_name || '';
    const initials = fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';
    return {
        id: String(u.id),
        username: u.username,
        fullName: fullName,
        email: u.email,
        anh_dai_dien: u.avatar_url,
        vai_tro: u.role,
        initials,
        bio: u.bio || '',
        location: u.location || '',
        so_dien_thoai: u.phone_number || '',
        isCreator: u.role === 'creator' || u.role === 'admin',
        followers: Number(u.followers) || 0,
        following: Number(u.following) || 0,
        likes: Number(u.total_likes) || 0,
        videos: Number(u.total_videos) || 0,
        phone: u.phone_number || null,
        isPhoneVerified: Boolean(u.is_phone_verified),
        createdAt: u.created_at,
    };
};

export const UserModel = {
    // Tìm user theo username
    async findByUsername(username) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE username = ? AND is_active = 1',
            [username]
        );
        return rows[0] || null;
    },

    // Tìm user theo id
    async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE id = ? AND is_active = 1',
            [id]
        );
        return rows[0] || null;
    },

    // Tìm các user có số điện thoại thuộc danh sách truyền vào và loại trừ chính user hiện tại
    async findUsersByPhones(phones, currentUserId) {
        if (!phones || phones.length === 0) return [];
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE phone_number IN (?) AND id != ? AND is_active = 1 AND role != 'admin'",
            [phones, currentUserId]
        );
        return rows;
    },

    // Cập nhật số điện thoại và đánh dấu đã xác thực
    async updatePhone(userId, phone) {
        await pool.query(
            'UPDATE users SET phone_number = ?, is_phone_verified = 1 WHERE id = ?',
            [phone, userId]
        );
        return this.findById(userId);
    },

    // currentUserRole: vai trò của người đang đăng nhập ('admin', 'creator', 'user', null)
    async getSuggestions(currentUserId, limit = 50, currentUserRole = null) {
        // Admin có thể thấy tất cả user
        // User thường và chưa đăng nhập không thấy admin
        const hideAdmins = currentUserRole !== 'admin';

        let query, params;
        if (hideAdmins) {
            query = `SELECT * FROM users 
                     WHERE is_active = 1 AND id != ? AND role != 'admin'
                     ORDER BY followers DESC
                     LIMIT ?`;
            params = [currentUserId || 0, limit];
        } else {
            query = `SELECT * FROM users 
                     WHERE is_active = 1 AND id != ?
                     ORDER BY followers DESC
                     LIMIT ?`;
            params = [currentUserId || 0, limit];
        }

        let followingSet = new Set();
        if (currentUserId) {
            const [fRows] = await pool.query(
                'SELECT following_id FROM follows WHERE follower_id = ?',
                [currentUserId]
            );
            followingSet = new Set(fRows.map(r => r.following_id));
        }

        const [rows] = await pool.query(query, params);
        return rows
            .filter(u => !followingSet.has(u.id))
            .map(u => ({ ...u, isFollowing: false }));
    },

    // Tìm kiếm user theo tên hoặc username
    async search(q, limit = 10, currentUserRole = null) {
        const hideAdmins = currentUserRole !== 'admin';
        const like = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;

        const adminFilter = hideAdmins ? "AND role != 'admin'" : '';

        const [rows] = await pool.query(
            `SELECT * FROM users 
             WHERE is_active = 1 
               AND (username LIKE ? OR display_name LIKE ?)
               ${adminFilter}
             ORDER BY followers DESC
             LIMIT ?`,
            [like, like, limit]
        );
        return rows;
    },

    // Cập nhật profile
    async updateProfile(userId, updates = {}) {
        const fields = [];
        const values = [];

        if (updates.display_name !== undefined) {
            fields.push('display_name = ?');
            values.push(updates.display_name);
        }
        if (updates.bio !== undefined) {
            fields.push('bio = ?');
            values.push(updates.bio);
        }
        if (updates.location !== undefined) {
            fields.push('location = ?');
            values.push(updates.location);
        }

        if (fields.length > 0) {
            values.push(userId);
            await pool.query(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
        }
        return this.findById(userId);
    },

    // Cập nhật ảnh đại diện
    async updateAvatar(userId, avatar_url) {
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, userId]);
    },

    // Tăng/giảm số video
    async incrementVideoCount(userId, delta = 1) {
        await pool.query(
            'UPDATE users SET total_videos = GREATEST(0, total_videos + ?) WHERE id = ?',
            [delta, userId]
        );
    },

    // Tìm user theo danh sách số điện thoại (dùng cho đồng bộ danh bạ Google)
    async findByPhoneNumbers(currentUserId, phoneList) {
        if (!phoneList || phoneList.length === 0) return [];

        // Lấy danh sách ID đã follow để loại trừ
        const excludeIds = [currentUserId];
        if (currentUserId) {
            const [followRows] = await pool.query(
                'SELECT following_id FROM follows WHERE follower_id = ?',
                [currentUserId]
            );
            followRows.forEach(r => excludeIds.push(r.following_id));
        }

        const [rows] = await pool.query(
            `SELECT * FROM users 
             WHERE is_active = 1 
               AND phone_number IN (?) 
               AND id NOT IN (?)
               AND role != 'admin'
             LIMIT 50`,
            [phoneList, excludeIds]
        );
        return rows;
    },


    // Tìm user theo danh sách email (dùng cho đồng bộ danh bạ Google)
    async findByEmails(currentUserId, emailList) {
        if (!emailList || emailList.length === 0) return [];

        // Lấy danh sách ID đã follow để loại trừ
        const excludeIds = [currentUserId];
        if (currentUserId) {
            const [followRows] = await pool.query(
                'SELECT following_id FROM follows WHERE follower_id = ?',
                [currentUserId]
            );
            followRows.forEach(r => excludeIds.push(r.following_id));
        }

        const [rows] = await pool.query(
            `SELECT * FROM users 
             WHERE is_active = 1 
               AND email IN (?) 
               AND id NOT IN (?)
               AND role != 'admin'
             LIMIT 50`,
            [emailList, excludeIds]
        );
        return rows;
    },

    // Cập nhật số điện thoại (chuẩn E.164)
    async updatePhone(userId, phoneNumber) {
        await pool.query(
            'UPDATE users SET phone_number = ? WHERE id = ?',
            [phoneNumber || null, userId]
        );
    },
};
