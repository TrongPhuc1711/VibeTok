import redis from '../config/redis.js';

// In-Memory cache hỗ trợ lưu từ khóa khi Redis offline trên máy local
const memorySearchMap = new Map();

/**
 * Ghi nhận từ khóa tìm kiếm vào Redis Sorted Set và In-Memory Map
 * @param {string} query 
 */
export const recordSearchQuery = async (query) => {
    try {
        if (!query || typeof query !== 'string') return;
        const clean = query.trim().slice(0, 80);
        if (clean.length < 2) return;

        const key = clean.toLowerCase();

        // 1. Luôn cập nhật vào In-Memory Map
        const currentCount = memorySearchMap.get(key) || 0;
        memorySearchMap.set(key, currentCount + 1);

        // 2. Nếu Redis hoạt động, lưu vào Redis Sorted Set
        if (redis && (redis.status === 'ready' || redis.status === 'connect')) {
            await redis.zincrby('admin:trending_searches', 1, key);
        }
    } catch (err) {
        console.error('[SearchHelper] Record search error:', err.message);
    }
};

/**
 * Lấy danh sách từ khóa tìm kiếm được ghi nhận
 * @param {number} limit 
 */
export const getRecordedSearchQueries = async (limit = 5) => {
    const results = [];

    // Ưu tiên đọc từ Redis nếu có kết nối
    try {
        if (redis && (redis.status === 'ready' || redis.status === 'connect')) {
            const raw = await redis.zrevrange('admin:trending_searches', 0, limit - 1, 'WITHSCORES');
            for (let i = 0; i < raw.length; i += 2) {
                const keyword = raw[i];
                const count = Number(raw[i + 1]) || 0;
                if (keyword) {
                    results.push({
                        name: keyword.startsWith('#') ? keyword : `#${keyword}`,
                        rawName: keyword,
                        count,
                        type: 'search',
                    });
                }
            }
        }
    } catch (e) {
        console.error('[SearchHelper] Redis read error:', e.message);
    }

    // Nếu Redis không có hoặc chưa có dữ liệu, lấy từ In-Memory Map
    if (results.length === 0 && memorySearchMap.size > 0) {
        const sorted = Array.from(memorySearchMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

        for (const [kw, count] of sorted) {
            results.push({
                name: kw.startsWith('#') ? kw : `#${kw}`,
                rawName: kw,
                count,
                type: 'search',
            });
        }
    }

    return results;
};
