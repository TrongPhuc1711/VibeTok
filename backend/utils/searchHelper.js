import redis from '../config/redis.js';

/**
 * Ghi nhận từ khóa tìm kiếm vào Redis Sorted Set
 * Dùng cho Leaderboard "Top từ khóa tìm kiếm" trên Admin Dashboard
 * @param {string} query 
 */
export const recordSearchQuery = async (query) => {
    try {
        if (!query || typeof query !== 'string') return;
        const clean = query.trim().slice(0, 80);
        // Bỏ qua chuỗi quá ngắn (< 2 ký tự)
        if (clean.length < 2) return;

        // Lưu vào Redis Sorted Set: Tự động cộng điểm 1 cho mỗi lần search
        if (redis && (redis.status === 'ready' || redis.status === 'connect')) {
            await redis.zincrby('admin:trending_searches', 1, clean.toLowerCase());
        }
    } catch (err) {
        // Safe catch: Không làm gián đoạn API tìm kiếm chính nếu Redis gặp sự cố
        console.error('[SearchHelper] Record search error:', err.message);
    }
};
