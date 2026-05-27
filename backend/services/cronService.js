import cron from 'node-cron';
import redis from '../config/redis.js';
import pool from '../config/db.js';

export function initCronJobs() {
    // Định nghĩa cron job chạy mỗi 2 phút (*/2 * * * *) để đồng bộ lượt xem từ Redis sang MySQL
    cron.schedule('*/2 * * * *', async () => {
        console.log('[Cron Views] Bắt đầu đồng bộ lượt xem từ Redis sang MySQL...');
        try {
            // Lấy tất cả mã video có sự thay đổi lượt xem (dirty views)
            const videoIds = await redis.smembers('video:dirty_views');
            if (!videoIds || videoIds.length === 0) {
                console.log('[Cron Views] Không có video nào cần đồng bộ lượt xem.');
                return;
            }

            console.log(`[Cron Views] Đang đồng bộ lượt xem cho ${videoIds.length} video...`);

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

            console.log(`[Cron Views] Đồng bộ lượt xem thành công cho ${videoIds.length} video.`);
        } catch (error) {
            console.error('[Cron Views] Lỗi đồng bộ lượt xem:', error);
        }
    });

    console.log('[Cron Service] Đã khởi tạo cron job đồng bộ lượt xem (mỗi 2 phút).');
}
