import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || null;

const redis = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    tls: redisHost !== '127.0.0.1' && redisHost !== 'localhost' ? {} : undefined,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('connect', () => {
    console.log('[Redis] Đã kết nối thành công!');
});

redis.on('error', (err) => {
    console.error('[Redis] Lỗi kết nối:', err);
});

export default redis;
