import pool from '../../config/db.js';

// Follow 
export const FollowModel = {
    async follow(followerId, followingId) {
        try {
            await pool.query(
                'INSERT INTO follows (ma_nguoi_theo_doi, ma_nguoi_duoc_theo_doi) VALUES (?, ?)',
                [followerId, followingId]
            );
            await pool.query('UPDATE users SET so_nguoi_theo_doi = so_nguoi_theo_doi + 1 WHERE id = ?', [followingId]);
            await pool.query('UPDATE users SET so_nguoi_dang_theo_doi = so_nguoi_dang_theo_doi + 1 WHERE id = ?', [followerId]);
            return true;
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') return false;
            throw e;
        }
    },

    async unfollow(followerId, followingId) {
        const [result] = await pool.query(
            'DELETE FROM follows WHERE ma_nguoi_theo_doi = ? AND ma_nguoi_duoc_theo_doi = ?',
            [followerId, followingId]
        );
        if (result.affectedRows > 0) {
            await pool.query('UPDATE users SET so_nguoi_theo_doi = GREATEST(0, so_nguoi_theo_doi - 1) WHERE id = ?', [followingId]);
            await pool.query('UPDATE users SET so_nguoi_dang_theo_doi = GREATEST(0, so_nguoi_dang_theo_doi - 1) WHERE id = ?', [followerId]);
        }
        return result.affectedRows > 0;
    },

    async isFollowing(followerId, followingId) {
        const [rows] = await pool.query(
            'SELECT id FROM follows WHERE ma_nguoi_theo_doi = ? AND ma_nguoi_duoc_theo_doi = ?',
            [followerId, followingId]
        );
        return rows.length > 0;
    },

    // Lấy mảng id mà followerId đang follow (dùng để batch-check isFollowing)
    async getFollowingIds(followerId) {
        if (!followerId) return [];
        const [rows] = await pool.query(
            'SELECT ma_nguoi_duoc_theo_doi FROM follows WHERE ma_nguoi_theo_doi = ?',
            [followerId]
        );
        return rows.map(r => r.ma_nguoi_duoc_theo_doi);
    },
};

// Like 
export const LikeModel = {
    async like(userId, videoId) {
        try {
            await pool.query(
                'INSERT INTO likes (ma_nguoi_dung, ma_video) VALUES (?, ?)',
                [userId, videoId]
            );
            await pool.query('UPDATE videos SET luot_thich = luot_thich + 1 WHERE id = ?', [videoId]);
            await pool.query(
                `UPDATE users u 
                 JOIN videos v ON v.ma_nguoi_dung = u.id 
                 SET u.tong_luot_thich = u.tong_luot_thich + 1 
                 WHERE v.id = ?`,
                [videoId]
            );
            return true;
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') return false;
            throw e;
        }
    },

    async unlike(userId, videoId) {
        const [result] = await pool.query(
            'DELETE FROM likes WHERE ma_nguoi_dung = ? AND ma_video = ?',
            [userId, videoId]
        );
        if (result.affectedRows > 0) {
            await pool.query('UPDATE videos SET luot_thich = GREATEST(0, luot_thich - 1) WHERE id = ?', [videoId]);
            await pool.query(
                `UPDATE users u 
                 JOIN videos v ON v.ma_nguoi_dung = u.id 
                 SET u.tong_luot_thich = GREATEST(0, u.tong_luot_thich - 1) 
                 WHERE v.id = ?`,
                [videoId]
            );
        }
        return result.affectedRows > 0;
    },

    async isLiked(userId, videoId) {
        const [rows] = await pool.query(
            'SELECT id FROM likes WHERE ma_nguoi_dung = ? AND ma_video = ?',
            [userId, videoId]
        );
        return rows.length > 0;
    },
};