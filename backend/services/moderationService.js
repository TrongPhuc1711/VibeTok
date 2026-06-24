import axios from 'axios';
import FormData from 'form-data';
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
 * Tải ảnh từ URL về dưới dạng Buffer
 */
async function fetchImageBuffer(imageUrl) {
    const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
    });
    const contentType = response.headers['content-type'] || 'image/jpeg';
    return { buffer: Buffer.from(response.data), contentType };
}

/**
 * Upload ảnh lên Imagga để lấy upload_id
 * Dùng khi gửi URL trực tiếp bị lỗi (Imagga không fetch được URL)
 */
async function uploadImageToImagga(imageBuffer, contentType) {
    const form = new FormData();
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    form.append('image', imageBuffer, { filename: `image.${ext}`, contentType });

    const response = await axios.post(`${IMAGGA_API_URL}/uploads`, form, {
        headers: form.getHeaders(),
        auth: {
            username: IMAGGA_API_KEY,
            password: IMAGGA_API_SECRET,
        },
        timeout: 30000,
    });

    return response.data?.result?.upload_id;
}

/**
 * Kiểm duyệt nội dung ảnh bằng Imagga NSFW API
 * Thử gửi URL trước, nếu lỗi 400 thì upload ảnh trực tiếp
 */
async function checkImageNSFW(imageUrl) {
    const authConfig = {
        auth: {
            username: IMAGGA_API_KEY,
            password: IMAGGA_API_SECRET,
        },
        timeout: 30000,
    };

    // Cách 1: Gửi URL trực tiếp
    try {
        const response = await axios.get(`${IMAGGA_API_URL}/categories/adult_content`, {
            params: { image_url: imageUrl },
            ...authConfig,
        });

        if (response.data?.result?.categories?.length > 0) {
            return parseCategories(response.data.result.categories);
        }
    } catch (urlError) {
        console.log(`[Moderation] URL mode thất bại (${urlError.response?.status || urlError.message}), chuyển sang upload mode...`);
    }

    // Cách 2: Tải ảnh về → upload lên Imagga → check bằng upload_id
    const { buffer, contentType } = await fetchImageBuffer(imageUrl);
    const uploadId = await uploadImageToImagga(buffer, contentType);

    if (!uploadId) {
        throw new Error('Không nhận được upload_id từ Imagga');
    }

    console.log(`[Moderation] Đã upload ảnh, upload_id: ${uploadId}`);

    const response = await axios.get(`${IMAGGA_API_URL}/categories/adult_content`, {
        params: { image_upload_id: uploadId },
        ...authConfig,
    });

    // Xóa ảnh đã upload (fire-and-forget, tiết kiệm storage)
    axios.delete(`${IMAGGA_API_URL}/uploads/${uploadId}`, authConfig).catch(() => {});

    return parseCategories(response.data?.result?.categories || []);
}

/**
 * Parse danh sách categories từ Imagga response
 */
function parseCategories(categories) {
    const scores = { safe: 0, suggestive: 0, explicit: 0 };
    for (const cat of categories) {
        let name = '';
        if (typeof cat.name === 'string') {
            name = cat.name;
        } else if (cat.name && typeof cat.name === 'object') {
            name = cat.name.en || '';
        }
        
        name = name.toLowerCase().trim();
        if (name === 'nsfw') name = 'explicit'; // Fallback support for older configurations

        if (name in scores) {
            scores[name] = cat.confidence || 0;
        }
    }
    return scores;
}

/**
 * Phân tích kết quả NSFW scores và quyết định safe/unsafe
 */
function analyzeScores(scores) {
    const { safe, suggestive, explicit: explicitScore } = scores;

    console.log(`[Moderation] Scores — safe: ${safe.toFixed(1)}%, suggestive: ${suggestive.toFixed(1)}%, explicit: ${explicitScore.toFixed(1)}%`);

    if (explicitScore >= EXPLICIT_THRESHOLD) {
        return {
            safe: false,
            reason: `Video bị từ chối: Nội dung khiêu dâm/khỏa thân (độ tin cậy: ${explicitScore.toFixed(1)}%)`,
            categories: ['sexual'],
        };
    }

    if (suggestive >= SUGGESTIVE_THRESHOLD) {
        return {
            safe: false,
            reason: `Video bị từ chối: Nội dung gợi dục không phù hợp (độ tin cậy: ${suggestive.toFixed(1)}%)`,
            categories: ['sexual'],
        };
    }

    return { safe: true, reason: 'Nội dung an toàn', categories: [] };
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
        const imageUrl = thumbnailUrl || videoUrl;
        console.log('[Moderation] Đang kiểm duyệt:', imageUrl);

        const scores = await checkImageNSFW(imageUrl);
        return analyzeScores(scores);
    } catch (error) {
        console.error('[Moderation] Lỗi kiểm duyệt:', error.response?.data || error.message);
        return {
            safe: true,
            reason: 'Kiểm duyệt tạm thời không khả dụng - sẽ được review sau',
            categories: [],
        };
    }
}

/**
 * Kiểm duyệt slideshow (nhiều ảnh)
 * @param {string[]} imageUrls - Danh sách URL ảnh
 * @returns {{ safe: boolean, reason: string, categories: string[] }}
 */
export async function moderateSlideshow(imageUrls) {
    if (!IMAGGA_API_KEY || !IMAGGA_API_SECRET || !imageUrls?.length) {
        return { safe: true, reason: 'Bỏ qua kiểm duyệt', categories: [] };
    }

    try {
        const urlsToCheck = imageUrls.slice(0, 5);

        for (const url of urlsToCheck) {
            try {
                console.log('[Moderation] Kiểm duyệt slideshow ảnh:', url);
                const scores = await checkImageNSFW(url);
                const result = analyzeScores(scores);

                if (!result.safe) {
                    return result;
                }
            } catch (e) {
                console.error(`[Moderation] Lỗi kiểm duyệt ảnh: ${url}`, e.response?.data || e.message);
            }
        }

        return { safe: true, reason: 'Nội dung an toàn', categories: [] };
    } catch (error) {
        console.error('[Moderation] Lỗi kiểm duyệt slideshow:', error.message);
        return { safe: true, reason: 'Kiểm duyệt tạm thời không khả dụng', categories: [] };
    }
}
