import cron from 'node-cron';
import redis from '../config/redis.js';
import pool from '../config/db.js';

export function initCronJobs() {
    cron.schedule('*/5 * * * * *', async () => {
        // 1. Đồng bộ lượt xem (dirty views)
        try {
            const videoIds = await redis.smembers('video:dirty_views');
            if (videoIds && videoIds.length > 0) {
                for (const videoId of videoIds) {
                    const key = `video:${videoId}:views`;
                    const views = await redis.get(key);
                    if (views !== null) {
                        await pool.query('UPDATE videos SET views_count = ? WHERE id = ?', [Number(views), videoId]);
                    }
                    await redis.srem('video:dirty_views', videoId);
                }
            }
        } catch (error) {
            console.error('[Cron Views] Lỗi đồng bộ lượt xem:', error);
        }

        // 2. Đồng bộ lượt thích (dirty likes)
        try {
            const dirtyLikeVideoIds = await redis.smembers('video:dirty_likes');
            if (dirtyLikeVideoIds && dirtyLikeVideoIds.length > 0) {
                for (const videoId of dirtyLikeVideoIds) {
                    const key = `video:${videoId}:likes_count`;
                    const likes = await redis.get(key);
                    if (likes !== null) {
                        const likesCount = Math.max(0, Number(likes));
                        // Cập nhật tổng số lượt like của video vào MySQL
                        await pool.query('UPDATE videos SET likes_count = ? WHERE id = ?', [likesCount, videoId]);

                        // Cập nhật lại total_likes của tác giả video
                        await pool.query(
                            `UPDATE users u 
                             JOIN videos v ON v.user_id = u.id 
                             SET u.total_likes = (SELECT COALESCE(SUM(likes_count), 0) FROM videos WHERE user_id = u.id AND is_active = 1)
                             WHERE v.id = ?`,
                            [videoId]
                        );
                    }
                    await redis.srem('video:dirty_likes', videoId);
                }
            }
        } catch (error) {
            console.error('[Cron Likes] Lỗi đồng bộ lượt thích:', error);
        }
    });

    console.log('[Cron Service] Đã khởi tạo cron job đồng bộ lượt xem & lượt thích từ Redis sang MySQL (mỗi 5 giây).');
}

