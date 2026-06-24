import axios from 'axios';
import 'dotenv/config';

const IMAGGA_API_URL = 'https://api.imagga.com/v2';
const IMAGGA_API_KEY = process.env.IMAGGA_API_KEY || '';
const IMAGGA_API_SECRET = process.env.IMAGGA_API_SECRET || '';

// Ngưỡng confidence để reject (0-100)
// - explicit >= 50 → reject ngay (nội dung khiêu dâm rõ ràng)
// - suggestive >= 55 → reject (nội dung gợi dục: lingerie, đồ lót, bán khỏa thân)
const EXPLICIT_THRESHOLD = 50;
const SUGGESTIVE_THRESHOLD = 55;

/**
 * Kiểm duyệt nội dung ảnh bằng Imagga NSFW API
 * Gọi endpoint /v2/categories/nsfw_beta với URL ảnh
 * Trả về: { safe, suggestive, explicit } với confidence score 0-100
 */
async function checkImageNSFW(imageUrl) {
    const response = await axios.get(`${IMAGGA_API_URL}/categories/nsfw_beta`, {
        params: { image_url: imageUrl },
        auth: {
            username: IMAGGA_API_KEY,
            password: IMAGGA_API_SECRET,
        },
        timeout: 30000,
    });

    const categories = response.data?.result?.categories || [];

    // Parse confidence scores cho từng category
    const scores = { safe: 0, suggestive: 0, explicit: 0 };
    for (const cat of categories) {
        const name = (cat.name || '').toLowerCase().trim();
        if (name in scores) {
            scores[name] = cat.confidence || 0;
        }
    }

    return scores;
}

/**
 * Phân tích kết quả NSFW scores và quyết định safe/unsafe
 * @param {{ safe: number, suggestive: number, explicit: number }} scores
 * @returns {{ safe: boolean, reason: string, categories: string[] }}
 */
function analyzeScores(scores) {
    const { safe, suggestive, explicit: explicitScore } = scores;

    console.log(`[Moderation] Scores — safe: ${safe.toFixed(1)}%, suggestive: ${suggestive.toFixed(1)}%, explicit: ${explicitScore.toFixed(1)}%`);

    // Nội dung explicit (khiêu dâm rõ ràng)
    if (explicitScore >= EXPLICIT_THRESHOLD) {
        return {
            safe: false,
            reason: `Video bị từ chối: Nội dung khiêu dâm/khỏa thân (độ tin cậy: ${explicitScore.toFixed(1)}%)`,
            categories: ['sexual'],
        };
    }

    // Nội dung suggestive (gợi dục) với ngưỡng cao hơn
    if (suggestive >= SUGGESTIVE_THRESHOLD) {
        return {
            safe: false,
            reason: `Video bị từ chối: Nội dung gợi dục không phù hợp (độ tin cậy: ${suggestive.toFixed(1)}%)`,
            categories: ['sexual'],
        };
    }

    return {
        safe: true,
        reason: 'Nội dung an toàn',
        categories: [],
    };
}

/**
 * Kiểm duyệt nội dung video/ảnh bằng Imagga API
 * @param {string} videoUrl - URL video trên Cloudinary
 * @param {string} thumbnailUrl - URL thumbnail trên Cloudinary
 * @returns {{ safe: boolean, reason: string, categories: string[] }}
 */
export async function moderateVideo(videoUrl, thumbnailUrl) {
    if (!IMAGGA_API_KEY || !IMAGGA_API_SECRET) {
        console.warn('[Moderation] IMAGGA_API_KEY/SECRET chưa được cấu hình - bỏ qua kiểm duyệt');
        return { safe: true, reason: 'Kiểm duyệt bị bỏ qua (chưa cấu hình API key)', categories: [] };
    }

    try {
        // Ưu tiên dùng thumbnail (nhẹ hơn, nhanh hơn)
        const imageUrl = thumbnailUrl || videoUrl;
        console.log('[Moderation] Đang kiểm duyệt:', imageUrl);

        const scores = await checkImageNSFW(imageUrl);
        return analyzeScores(scores);
    } catch (error) {
        console.error('[Moderation] Lỗi kiểm duyệt:', error.response?.data || error.message);

        // Nếu API lỗi, cho phép upload (không block user vì lỗi hệ thống)
        return {
            safe: true,
            reason: 'Kiểm duyệt tạm thời không khả dụng - sẽ được review sau',
            categories: [],
        };
    }
}

/**
 * Kiểm duyệt slideshow (nhiều ảnh)
 * Kiểm tra từng ảnh, nếu bất kỳ ảnh nào vi phạm thì reject toàn bộ
 * @param {string[]} imageUrls - Danh sách URL ảnh
 * @returns {{ safe: boolean, reason: string, categories: string[] }}
 */
export async function moderateSlideshow(imageUrls) {
    if (!IMAGGA_API_KEY || !IMAGGA_API_SECRET || !imageUrls?.length) {
        return { safe: true, reason: 'Bỏ qua kiểm duyệt', categories: [] };
    }

    try {
        // Kiểm tra tối đa 5 ảnh đầu tiên (tiết kiệm credits)
        const urlsToCheck = imageUrls.slice(0, 5);

        for (const url of urlsToCheck) {
            try {
                console.log('[Moderation] Kiểm duyệt slideshow ảnh:', url);
                const scores = await checkImageNSFW(url);
                const result = analyzeScores(scores);

                if (!result.safe) {
                    // Một ảnh vi phạm → reject toàn bộ slideshow
                    return result;
                }
            } catch (e) {
                console.warn(`[Moderation] Bỏ qua ảnh lỗi: ${url}`, e.message);
            }
        }

        return { safe: true, reason: 'Nội dung an toàn', categories: [] };
    } catch (error) {
        console.error('[Moderation] Lỗi kiểm duyệt slideshow:', error.message);
        return { safe: true, reason: 'Kiểm duyệt tạm thời không khả dụng', categories: [] };
    }
}
