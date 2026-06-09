import cron from 'node-cron';
import redis from '../config/redis.js';
import pool from '../config/db.js';

export function initCronJobs() {
    cron.schedule('*/5 * * * * *', async () => {
        try {
            // Lấy tất cả mã video có sự thay đổi lượt xem (dirty views)
            const videoIds = await redis.smembers('video:dirty_views');
            if (!videoIds || videoIds.length === 0) {
                return;
            }

            for (const videoId of videoIds) {
                const key = `video:${videoId}:views`;
                const views = await redis.get(key);
                if (views !== null) {
                    // Cập nhật số lượt xem mới vào MySQL
                    await pool.query('UPDATE videos SET luot_xem = ? WHERE id = ?', [Number(views), videoId]);
                }
                // Xóa videoId khỏi danh sách dirty views sau khi đã đồng bộ thành công
                await redis.srem('video:dirty_views', videoId);
            }

        } catch (error) {
            console.error('[Cron Views] Lỗi đồng bộ lượt xem:', error);
        }
    });

    console.log('[Cron Service] Đã khởi tạo cron job đồng bộ lượt xem (mỗi 5 giây).');
}
