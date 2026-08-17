import pool from '../config/db.js';

export const BookmarkModel = {
    async toggle(userId, videoId) {
        const [existing] = await pool.query(
            'SELECT id FROM bookmarks WHERE user_id = ? AND video_id = ?',
            [userId, videoId]
        );
        if (existing.length > 0) {
            await pool.query(
                'DELETE FROM bookmarks WHERE user_id = ? AND video_id = ?',
                [userId, videoId]
            );
            await pool.query(
                'UPDATE videos SET bookmark_count = GREATEST(0, bookmark_count - 1) WHERE id = ?',
                [videoId]
            );
            return false; // removed
        }
        await pool.query(
            'INSERT INTO bookmarks (user_id, video_id) VALUES (?, ?)',
            [userId, videoId]
        );
        await pool.query(
            'UPDATE videos SET bookmark_count = bookmark_count + 1 WHERE id = ?',
            [videoId]
        );
        return true; // added
    },

    async isBookmarked(userId, videoId) {
        const [rows] = await pool.query(
            'SELECT id FROM bookmarks WHERE user_id = ? AND video_id = ?',
            [userId, videoId]
        );
        return rows.length > 0;
    },

    async getByUser(userId, { page = 1, limit = 12 } = {}) {
        const offset = (page - 1) * limit;
        const [rows] = await pool.query(
            `SELECT v.*,
              u.id AS user_id, u.username, u.display_name, u.avatar_url, u.role,
              m.id AS music_id, m.title AS music_title, m.artist AS music_artist, m.audio_url, m.cover_url,
              b.created_at as bookmarked_at
       FROM bookmarks b
       JOIN videos v ON b.video_id = v.id
       JOIN users u ON v.user_id = u.id
       LEFT JOIN music m ON v.music_id = m.id
       WHERE b.user_id = ? AND v.is_active = 1
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) AS total FROM bookmarks WHERE user_id = ?',
            [userId]
        );
        return { rows, total };
    },

    async getBookmarkedIds(userId, videoIds) {
        if (!videoIds.length) return new Set();
        const [rows] = await pool.query(
            'SELECT video_id FROM bookmarks WHERE user_id = ? AND video_id IN (?)',
            [userId, videoIds]
        );
        return new Set(rows.map(r => String(r.video_id)));
    },
};