import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || null;

const redis = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    tls: redisHost !== '127.0.0.1' && redisHost !== 'localhost' ? {} : undefined,
    keepAlive: 30000,
    connectTimeout: 10000,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
    }
});

redis.on('connect', () => {
    console.log('[Redis] Đã kết nối thành công!');
});

redis.on('error', (err) => {
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        console.warn(`[Redis] Gián đoạn kết nối (${err.code}): Đang tự động kết nối lại...`);
    } else {
        console.error('[Redis] Lỗi kết nối:', err.message || err);
    }
});

export default redis;
