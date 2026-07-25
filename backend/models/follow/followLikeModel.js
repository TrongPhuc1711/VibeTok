import pool from '../../config/db.js';

// Follow 
export const FollowModel = {
    async follow(followerId, followingId) {
        try {
            await pool.query(
                'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
                [followerId, followingId]
            );
            await pool.query('UPDATE users SET followers = followers + 1 WHERE id = ?', [followingId]);
            await pool.query('UPDATE users SET `following` = `following` + 1 WHERE id = ?', [followerId]);
            return true;
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') return false;
            throw e;
        }
    },

    async unfollow(followerId, followingId) {
        const [result] = await pool.query(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );
        if (result.affectedRows > 0) {
            await pool.query('UPDATE users SET followers = GREATEST(0, followers - 1) WHERE id = ?', [followingId]);
            await pool.query('UPDATE users SET `following` = GREATEST(0, `following` - 1) WHERE id = ?', [followerId]);
        }
        return result.affectedRows > 0;
    },

    async isFollowing(followerId, followingId) {
        const [rows] = await pool.query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );
        return rows.length > 0;
    },

    // Lấy mảng id mà followerId đang follow (dùng để batch-check isFollowing)
    async getFollowingIds(followerId) {
        if (!followerId) return [];
        const [rows] = await pool.query(
            'SELECT following_id FROM follows WHERE follower_id = ?',
            [followerId]
        );
        return rows.map(r => r.following_id);
    },
};

// Like 
export const LikeModel = {
    async like(userId, videoId) {
        try {
            await pool.query(
                'INSERT INTO likes (user_id, video_id) VALUES (?, ?)',
                [userId, videoId]
            );
            await pool.query('UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?', [videoId]);
            await pool.query(
                `UPDATE users u 
                 JOIN videos v ON v.user_id = u.id 
                 SET u.total_likes = u.total_likes + 1 
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
            'DELETE FROM likes WHERE user_id = ? AND video_id = ?',
            [userId, videoId]
        );
        if (result.affectedRows > 0) {
            await pool.query('UPDATE videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [videoId]);
            await pool.query(
                `UPDATE users u 
                 JOIN videos v ON v.user_id = u.id 
                 SET u.total_likes = GREATEST(0, u.total_likes - 1) 
                 WHERE v.id = ?`,
                [videoId]
            );
        }
        return result.affectedRows > 0;
    },

    async isLiked(userId, videoId) {
        const [rows] = await pool.query(
            'SELECT id FROM likes WHERE user_id = ? AND video_id = ?',
            [userId, videoId]
        );
        return rows.length > 0;
    },
};