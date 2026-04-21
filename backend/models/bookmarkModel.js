import pool from '../config/db.js';

export const BookmarkModel = {
    async toggle(userId, videoId) {
        const [existing] = await pool.query(
            'SELECT id FROM bookmarks WHERE ma_nguoi_dung = ? AND ma_video = ?',
            [userId, videoId]
        );
        if (existing.length > 0) {
            await pool.query(
                'DELETE FROM bookmarks WHERE ma_nguoi_dung = ? AND ma_video = ?',
                [userId, videoId]
            );
            return false; // removed
        }
        await pool.query(
            'INSERT INTO bookmarks (ma_nguoi_dung, ma_video) VALUES (?, ?)',
            [userId, videoId]
        );
        return true; // added
    },

    async isBookmarked(userId, videoId) {
        const [rows] = await pool.query(
            'SELECT id FROM bookmarks WHERE ma_nguoi_dung = ? AND ma_video = ?',
            [userId, videoId]
        );
        return rows.length > 0;
    },

    async getByUser(userId, { page = 1, limit = 12 } = {}) {
        const offset = (page - 1) * limit;
        const [rows] = await pool.query(
            `SELECT v.*, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien, u.vai_tro,
              b.ngay_tao as bookmarked_at
       FROM bookmarks b
       JOIN videos v ON b.ma_video = v.id
       JOIN users u ON v.ma_nguoi_dung = u.id
       WHERE b.ma_nguoi_dung = ? AND v.hoat_dong = 1
       ORDER BY b.ngay_tao DESC
       LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) AS total FROM bookmarks WHERE ma_nguoi_dung = ?',
            [userId]
        );
        return { rows, total };
    },

    async getBookmarkedIds(userId, videoIds) {
        if (!videoIds.length) return new Set();
        const [rows] = await pool.query(
            'SELECT ma_video FROM bookmarks WHERE ma_nguoi_dung = ? AND ma_video IN (?)',
            [userId, videoIds]
        );
        return new Set(rows.map(r => String(r.ma_video)));
    },
};