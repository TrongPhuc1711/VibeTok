import { Queue, Worker } from 'bullmq';
import { moderateWithGemini, moderateSlideshowWithGemini, isGeminiAvailable } from './geminiModerationService.js';
import { moderateVideo as moderateWithImagga, moderateSlideshow as moderateSlideshowWithImagga } from './moderationService.js';
import { VideoModel } from '../models/videoModel.js';
import { getIO } from '../utils/socket.js';
import cloudinary from '../config/cloudinary.js';
import 'dotenv/config';

// ── Redis connection config (reuse từ config/redis.js) ──
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const redisConnection = {
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    tls: redisHost !== '127.0.0.1' && redisHost !== 'localhost' ? {} : undefined,
};

// ── Queue definition ──
const QUEUE_NAME = 'video-moderation';

const moderationQueue = new Queue(QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: { count: 100 },  // Giữ lại 100 job gần nhất
        removeOnFail: { count: 50 },
    },
});

/**
 * Thêm job kiểm duyệt vào hàng đợi
 * @param {Object} data - Thông tin video cần kiểm duyệt
 * @param {number} data.videoId - ID video trong DB
 * @param {number} data.userId - ID người upload
 * @param {string} data.videoUrl - URL video trên Cloudinary
 * @param {string} data.thumbnailUrl - URL thumbnail
 * @param {boolean} data.isSlideshow - Có phải slideshow không
 * @param {string[]} data.slideshowUrls - Danh sách URL ảnh (nếu slideshow)
 */
export async function addModerationJob(data) {
    const job = await moderationQueue.add('moderate', data, {
        priority: 1,
    });
    console.log(`[ModerationQueue] Đã thêm job #${job.id} cho video #${data.videoId}`);
    return job;
}

/**
 * Trích xuất Cloudinary public_id từ URL
 * Ví dụ: https://res.cloudinary.com/xxx/video/upload/v123/vibetok/videos/abc.mp4
 * → vibetok/videos/abc
 */
function extractPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return null;
        let afterUpload = url.substring(uploadIndex + 8); // skip '/upload/'
        // Bỏ version prefix (v1234567890/)
        afterUpload = afterUpload.replace(/^v\d+\//, '');
        // Bỏ transformations (c_fill,w_300,...)
        afterUpload = afterUpload.replace(/^[a-z]_[^/]+\//, '');
        // Bỏ extension
        const dotIndex = afterUpload.lastIndexOf('.');
        if (dotIndex > -1) afterUpload = afterUpload.substring(0, dotIndex);
        return afterUpload;
    } catch {
        return null;
    }
}

/**
 * Xóa file trên Cloudinary
 */
async function deleteFromCloudinary(url, resourceType = 'video') {
    const publicId = extractPublicId(url);
    if (!publicId) return;

    try {
        console.log(`[ModerationQueue] Xóa Cloudinary: ${publicId} (${resourceType})`);
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (e) {
        console.warn(`[ModerationQueue] Lỗi xóa Cloudinary ${publicId}:`, e.message);
    }
}

/**
 * Gửi thông báo kiểm duyệt qua Socket.io
 */
function emitModerationResult(userId, data) {
    const io = getIO();
    if (io) {
        io.to(`user_${userId}`).emit('video_moderation_result', data);
        console.log(`[ModerationQueue] Đã emit kết quả cho user #${userId}`);
    }
}

/**
 * Xử lý kiểm duyệt chính
 * Ưu tiên Gemini AI → Fallback Imagga → Auto-approve
 */
async function processModeration(jobData) {
    const { videoId, userId, videoUrl, thumbnailUrl, isSlideshow, slideshowUrls } = jobData;

    console.log(`[ModerationQueue] ========== XỬ LÝ VIDEO #${videoId} ==========`);

    let result = null;

    // ── Tầng 1: Gemini AI ──
    if (isGeminiAvailable()) {
        try {
            if (isSlideshow && slideshowUrls?.length > 0) {
                result = await moderateSlideshowWithGemini(slideshowUrls);
            } else {
                result = await moderateWithGemini(videoUrl, thumbnailUrl);
            }
        } catch (e) {
            console.error(`[ModerationQueue] Gemini lỗi cho video #${videoId}:`, e.message);
            result = null;
        }
    }

    // ── Tầng 2: Fallback Imagga ──
    if (!result) {
        console.log(`[ModerationQueue] Gemini không khả dụng, thử Imagga...`);
        try {
            if (isSlideshow && slideshowUrls?.length > 0) {
                result = await moderateSlideshowWithImagga(slideshowUrls);
            } else {
                result = await moderateWithImagga(videoUrl, thumbnailUrl);
            }
        } catch (e) {
            console.error(`[ModerationQueue] Imagga cũng lỗi cho video #${videoId}:`, e.message);
            result = null;
        }
    }

    // ── Tầng 3: Auto-approve nếu cả 2 đều lỗi ──
    if (!result) {
        console.warn(`[ModerationQueue] Cả Gemini và Imagga đều lỗi — auto-approve video #${videoId}`);
        result = {
            safe: true,
            reason: 'Kiểm duyệt tạm thời không khả dụng — sẽ được review sau',
            categories: [],
        };
    }

    return result;
}

/**
 * Khởi tạo Worker xử lý hàng đợi kiểm duyệt
 */
export function initModerationWorker() {
    const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
            const { videoId, userId, videoUrl, thumbnailUrl, isSlideshow, slideshowUrls } = job.data;

            console.log(`[ModerationWorker] Bắt đầu xử lý job #${job.id} (video #${videoId})`);

            const result = await processModeration(job.data);

            const isRejected = !result.safe;

            // Cập nhật trạng thái trong DB
            await VideoModel.updateModerationStatus(
                videoId,
                isRejected ? 'rejected' : 'approved',
                isRejected ? result.reason : null,
            );

            // Nếu bị từ chối → xóa file trên Cloudinary
            if (isRejected) {
                console.log(`[ModerationWorker] ❌ Video #${videoId} bị từ chối: ${result.reason}`);

                if (isSlideshow && slideshowUrls?.length > 0) {
                    // Xóa tất cả ảnh slideshow
                    for (const url of slideshowUrls) {
                        await deleteFromCloudinary(url, 'image');
                    }
                } else {
                    // Xóa video
                    await deleteFromCloudinary(videoUrl, 'video');
                    // Xóa thumbnail nếu khác video
                    if (thumbnailUrl && thumbnailUrl !== videoUrl) {
                        await deleteFromCloudinary(thumbnailUrl, 'image');
                    }
                }
            } else {
                console.log(`[ModerationWorker] ✅ Video #${videoId} được phê duyệt`);
            }

            // Gửi thông báo Socket.io
            emitModerationResult(userId, {
                videoId: String(videoId),
                status: isRejected ? 'rejected' : 'approved',
                reason: result.reason || null,
                categories: result.categories || [],
            });

            return { videoId, status: isRejected ? 'rejected' : 'approved' };
        },
        {
            connection: redisConnection,
            concurrency: 2, // Xử lý tối đa 2 job đồng thời
            limiter: {
                max: 10,
                duration: 60000, // Tối đa 10 job/phút (tránh rate limit API)
            },
        },
    );

    worker.on('completed', (job, result) => {
        console.log(`[ModerationWorker] ✓ Job #${job.id} hoàn tất:`, result);
    });

    worker.on('failed', (job, err) => {
        console.error(`[ModerationWorker] ✗ Job #${job?.id} thất bại:`, err.message);

        // Nếu job fail hết retries → auto-approve để không block user
        if (job && job.attemptsMade >= (job.opts?.attempts || 2)) {
            const { videoId, userId } = job.data;
            console.warn(`[ModerationWorker] Job #${job.id} hết retry — auto-approve video #${videoId}`);

            VideoModel.updateModerationStatus(videoId, 'approved', null).catch(() => {});
            emitModerationResult(userId, {
                videoId: String(videoId),
                status: 'approved',
                reason: 'Kiểm duyệt tạm thời không khả dụng — đã cho phép tạm thời',
                categories: [],
            });
        }
    });

    worker.on('error', (err) => {
        console.error('[ModerationWorker] Worker error:', err.message);
    });

    console.log('[ModerationQueue] ✓ Worker đã khởi tạo — đang lắng nghe job kiểm duyệt');
    return worker;
}
