import pool from '../../config/db.js';
import redis from '../../config/redis.js';

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
            // 1. Ghi bản ghi mối quan hệ vào MySQL (Đảm bảo dữ liệu cá nhân lâu dài)
            await pool.query(
                'INSERT INTO likes (user_id, video_id) VALUES (?, ?)',
                [userId, videoId]
            );

            // 2. Cập nhật Redis Caching & Counter (Fast Path)
            try {
                const setKey = `video:${videoId}:likes`;
                const countKey = `video:${videoId}:likes_count`;

                await redis.sadd(setKey, String(userId));

                // Khởi tạo hoặc tăng count trên Redis
                const exists = await redis.exists(countKey);
                if (!exists) {
                    const [rows] = await pool.query('SELECT likes_count FROM videos WHERE id = ?', [videoId]);
                    const dbLikes = (rows[0]?.likes_count || 0) + 1;
                    await redis.set(countKey, dbLikes);
                } else {
                    await redis.incr(countKey);
                }

                // Đánh dấu video cần sync count xuống MySQL
                await redis.sadd('video:dirty_likes', String(videoId));
            } catch (redisErr) {
                console.error('[Redis Like Error] Cập nhật Redis thất bại, fallback MySQL:', redisErr);
                // Fallback: Cập nhật trực tiếp MySQL nếu Redis có sự cố
                await pool.query('UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?', [videoId]);
                await pool.query(
                    `UPDATE users u JOIN videos v ON v.user_id = u.id 
                     SET u.total_likes = u.total_likes + 1 WHERE v.id = ?`,
                    [videoId]
                );
            }

            return true;
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') return false;
            throw e;
        }
    },

    async unlike(userId, videoId) {
        // 1. Xóa bản ghi trong MySQL
        const [result] = await pool.query(
            'DELETE FROM likes WHERE user_id = ? AND video_id = ?',
            [userId, videoId]
        );

        if (result.affectedRows > 0) {
            // 2. Cập nhật Redis Caching & Counter
            try {
                const setKey = `video:${videoId}:likes`;
                const countKey = `video:${videoId}:likes_count`;

                await redis.srem(setKey, String(userId));

                const exists = await redis.exists(countKey);
                if (exists) {
                    const current = await redis.decr(countKey);
                    if (current < 0) await redis.set(countKey, 0);
                } else {
                    const [rows] = await pool.query('SELECT likes_count FROM videos WHERE id = ?', [videoId]);
                    const dbLikes = Math.max(0, (rows[0]?.likes_count || 0) - 1);
                    await redis.set(countKey, dbLikes);
                }

                await redis.sadd('video:dirty_likes', String(videoId));
            } catch (redisErr) {
                console.error('[Redis Unlike Error] Fallback MySQL:', redisErr);
                await pool.query('UPDATE videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [videoId]);
                await pool.query(
                    `UPDATE users u JOIN videos v ON v.user_id = u.id 
                     SET u.total_likes = GREATEST(0, u.total_likes - 1) WHERE v.id = ?`,
                    [videoId]
                );
            }
        }
        return result.affectedRows > 0;
    },

    async isLiked(userId, videoId) {
        if (!userId || !videoId) return false;
        try {
            const setKey = `video:${videoId}:likes`;
            const isMember = await redis.sismember(setKey, String(userId));
            if (isMember === 1) return true;

            // Nếu Redis Set tồn tại mà return 0 -> chắc chắn chưa like
            const exists = await redis.exists(setKey);
            if (exists) return false;
        } catch (redisErr) {
            console.error('[Redis isLiked Error] Fallback MySQL:', redisErr);
        }

        // Fallback kiểm tra từ MySQL nếu Redis chưa cache set này
        const [rows] = await pool.query(
            'SELECT id FROM likes WHERE user_id = ? AND video_id = ?',
            [userId, videoId]
        );
        return rows.length > 0;
    },
};