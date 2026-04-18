import pool from '../config/db.js';

// Chuyển đổi từ DB fields → frontend fields
export const normalizeUser = (u) => {
    if (!u) return null;
    const fullName = u.ten_hien_thi || '';
    const initials = fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';
    return {
        id:         String(u.id),
        username:   u.ten_dang_nhap,
        fullName:   fullName,
        email:      u.email,
        anh_dai_dien: u.anh_dai_dien,
        vai_tro:    u.vai_tro,
        initials,
        bio:        u.tieu_su || '',
        location:   u.vi_tri || '',
        isCreator:  u.vai_tro === 'creator' || u.vai_tro === 'admin',
        followers:  Number(u.so_nguoi_theo_doi)     || 0,
        following:  Number(u.so_nguoi_dang_theo_doi) || 0,
        likes:      Number(u.tong_luot_thich)        || 0,
        videos:     Number(u.tong_so_video)          || 0,
        createdAt:  u.ngay_tao,
    };
};

export const UserModel = {
    // Tìm user theo username
    async findByUsername(username) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE ten_dang_nhap = ? AND hoat_dong = 1',
            [username]
        );
        return rows[0] || null;
    },

    // Tìm user theo id
    async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE id = ? AND hoat_dong = 1',
            [id]
        );
        return rows[0] || null;
    },

    // currentUserRole: vai trò của người đang đăng nhập ('admin', 'creator', 'user', null)
    async getSuggestions(currentUserId, limit = 5, currentUserRole = null) {
        // Admin có thể thấy tất cả user
        // User thường và chưa đăng nhập không thấy admin
        const hideAdmins = currentUserRole !== 'admin';

        let query, params;
        if (hideAdmins) {
            query = `SELECT * FROM users 
                     WHERE hoat_dong = 1 AND id != ? AND vai_tro != 'admin'
                     ORDER BY so_nguoi_theo_doi DESC
                     LIMIT ?`;
            params = [currentUserId || 0, limit];
        } else {
            query = `SELECT * FROM users 
                     WHERE hoat_dong = 1 AND id != ?
                     ORDER BY so_nguoi_theo_doi DESC
                     LIMIT ?`;
            params = [currentUserId || 0, limit];
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Tìm kiếm user theo tên hoặc username
    async search(q, limit = 10, currentUserRole = null) {
        const hideAdmins = currentUserRole !== 'admin';
        const like = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    
        const adminFilter = hideAdmins ? "AND vai_tro != 'admin'" : '';
    
        const [rows] = await pool.query(
            `SELECT * FROM users 
             WHERE hoat_dong = 1 
               AND (ten_dang_nhap LIKE ? OR ten_hien_thi LIKE ?)
               ${adminFilter}
             ORDER BY so_nguoi_theo_doi DESC
             LIMIT ?`,
            [like, like, limit]
        );
        return rows;
    },

    // Cập nhật profile
    async updateProfile(userId, updates = {}) {
        const fields = [];
        const values = [];

        if (updates.ten_hien_thi !== undefined) {
            fields.push('ten_hien_thi = ?');
            values.push(updates.ten_hien_thi);
        }
        if (updates.tieu_su !== undefined) {
            fields.push('tieu_su = ?');
            values.push(updates.tieu_su);
        }
        if (updates.vi_tri !== undefined) {
            fields.push('vi_tri = ?');
            values.push(updates.vi_tri);
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
    async updateAvatar(userId, anh_dai_dien) {
        await pool.query('UPDATE users SET anh_dai_dien = ? WHERE id = ?', [anh_dai_dien, userId]);
    },

    // Tăng/giảm số video
    async incrementVideoCount(userId, delta = 1) {
        await pool.query(
            'UPDATE users SET tong_so_video = GREATEST(0, tong_so_video + ?) WHERE id = ?',
            [delta, userId]
        );
    },
};