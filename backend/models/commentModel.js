import pool from '../config/db.js';

export const normalizeComment = (c) => {
    if (!c) return null;
    const fullName = c.ten_hien_thi || '';
    return {
        id:        String(c.id),
        videoId:   String(c.ma_video),
        userId:    String(c.ma_nguoi_dung),
        parentId:  c.ma_binh_luan_goc ? String(c.ma_binh_luan_goc) : null,
        content:   c.noi_dung,
        likes:     Number(c.luot_thich)   || 0,
        replies:   Number(c.luot_tra_loi) || 0,
        createdAt: c.ngay_tao,
        username:  c.ten_dang_nhap || 'user',
        fullName,
        initials: fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U',
        anh_dai_dien: c.anh_dai_dien || null,
    };
};

export const CommentModel = {
    // Lấy comments theo videoId (không phải reply)
    async getByVideoId(videoId, { page = 1, limit = 20 } = {}) {
        const offset = (page - 1) * limit;
        const [rows] = await pool.query(
            `SELECT c.*, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien
             FROM comments c
             LEFT JOIN users u ON c.ma_nguoi_dung = u.id
             WHERE c.ma_video = ? AND c.ma_binh_luan_goc IS NULL AND c.hoat_dong = 1
             ORDER BY c.ngay_tao DESC
             LIMIT ? OFFSET ?`,
            [videoId, limit, offset]
        );
        return rows.map(normalizeComment);
    },

    // Tạo comment
    async create({ videoId, userId, content, parentId = null }) {
        const [result] = await pool.query(
            'INSERT INTO comments (ma_video, ma_nguoi_dung, ma_binh_luan_goc, noi_dung) VALUES (?, ?, ?, ?)',
            [videoId, userId, parentId, content]
        );
        // Nếu là reply thì tăng luot_tra_loi của comment gốc
        if (parentId) {
            await pool.query(
                'UPDATE comments SET luot_tra_loi = luot_tra_loi + 1 WHERE id = ?',
                [parentId]
            );
        }
        const [rows] = await pool.query(
            `SELECT c.*, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien
             FROM comments c
             LEFT JOIN users u ON c.ma_nguoi_dung = u.id
             WHERE c.id = ?`,
            [result.insertId]
        );
        return normalizeComment(rows[0]);
    },

    // Xóa comment
    async softDelete(commentId, userId) {
        const [result] = await pool.query(
            'UPDATE comments SET hoat_dong = 0 WHERE id = ? AND ma_nguoi_dung = ?',
            [commentId, userId]
        );
        return result.affectedRows > 0;
    },
};