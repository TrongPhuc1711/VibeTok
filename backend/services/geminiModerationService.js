import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';

let aiClient = null;

function getAIClient() {
    if (!aiClient && GEMINI_API_KEY) {
        aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
    return aiClient;
}

// ── Prompt kiểm duyệt ──
const MODERATION_PROMPT = `Bạn là hệ thống kiểm duyệt nội dung cho mạng xã hội video ngắn (tương tự TikTok).
Phân tích nội dung media được cung cấp và đánh giá theo các tiêu chí sau:

1. **sexual**: Nội dung khiêu dâm, khỏa thân, gợi dục
2. **violence**: Bạo lực, máu me, vũ khí nguy hiểm, giết chóc
3. **self-harm**: Tự hại, tự tử, nội dung khuyến khích tự gây thương tích
4. **drugs**: Ma túy, chất cấm, sử dụng chất kích thích bất hợp pháp
5. **hate_speech**: Phát ngôn thù ghét, phân biệt chủng tộc, tôn giáo
6. **child_safety**: Nội dung nguy hại cho trẻ em

Trả lời CHÍNH XÁC theo format JSON sau (không thêm bất kỳ text nào khác):
{
  "safe": true/false,
  "categories": ["tên_danh_mục_vi_phạm"],
  "confidence": 0-100,
  "reason": "Mô tả ngắn gọn bằng tiếng Việt lý do vi phạm (nếu có)"
}

Quy tắc:
- Nếu nội dung AN TOÀN: {"safe": true, "categories": [], "confidence": 95, "reason": "Nội dung an toàn"}
- Nếu nội dung VI PHẠM: liệt kê tất cả categories vi phạm, confidence là độ tin cậy của bạn
- Chỉ đánh dấu vi phạm khi THỰC SỰ có nội dung không phù hợp, tránh false positive
- Nội dung thể thao, nghệ thuật, giáo dục có thể chứa hình ảnh nhạy cảm nhưng KHÔNG vi phạm`;

// ── Safety Settings cho Gemini ──
const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];
// BLOCK_NONE: Cho phép Gemini phân tích nội dung thay vì bị chặn bởi safety filter
// Hệ thống sẽ tự đánh giá dựa trên kết quả trả về

/**
 * Tải file từ URL về thư mục tạm
 * @param {string} url - URL file cần tải
 * @returns {Promise<{filePath: string, mimeType: string}>}
 */
async function downloadToTemp(url) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    const ext = contentType.includes('mp4') ? '.mp4'
        : contentType.includes('webm') ? '.webm'
        : contentType.includes('mov') ? '.mov'
        : contentType.includes('png') ? '.png'
        : contentType.includes('webp') ? '.webp'
        : '.jpg';

    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `vibetok_mod_${Date.now()}${ext}`);
    fs.writeFileSync(filePath, Buffer.from(response.data));

    return { filePath, mimeType: contentType };
}

/**
 * Dọn dẹp file tạm
 */
function cleanupTempFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (e) {
        console.warn('[GeminiMod] Lỗi xóa file tạm:', e.message);
    }
}

/**
 * Parse kết quả JSON từ Gemini response
 */
function parseGeminiResponse(responseText) {
    try {
        // Loại bỏ markdown code block nếu có
        let cleaned = responseText.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.slice(7);
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();

        const result = JSON.parse(cleaned);

        return {
            safe: Boolean(result.safe),
            categories: Array.isArray(result.categories) ? result.categories : [],
            confidence: Number(result.confidence) || 0,
            reason: result.reason || (result.safe ? 'Nội dung an toàn' : 'Vi phạm chính sách cộng đồng'),
        };
    } catch (e) {
        console.error('[GeminiMod] Lỗi parse response:', e.message, 'Raw:', responseText);
        // Nếu parse lỗi, kiểm tra xem response có chứa từ khóa nguy hiểm không
        const lower = responseText.toLowerCase();
        if (lower.includes('"safe": false') || lower.includes('"safe":false')) {
            return {
                safe: false,
                categories: ['unknown'],
                confidence: 50,
                reason: 'Nội dung bị nghi ngờ vi phạm (lỗi phân tích chi tiết)',
            };
        }
        return {
            safe: true,
            categories: [],
            confidence: 50,
            reason: 'Không thể phân tích chi tiết — đã cho phép tạm thời',
        };
    }
}

/**
 * Kiểm duyệt một ảnh bằng Gemini (inline data — dưới 20MB)
 */
async function moderateImageWithGemini(imageUrl) {
    const client = getAIClient();
    if (!client) throw new Error('Gemini AI client chưa được khởi tạo');

    let tempFile = null;
    try {
        console.log(`[GeminiMod] Kiểm duyệt ảnh: ${imageUrl}`);

        // Download ảnh
        const { filePath, mimeType } = await downloadToTemp(imageUrl);
        tempFile = filePath;

        // Đọc file thành base64 cho inline data
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');

        const response = await client.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: MODERATION_PROMPT },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
            config: {
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const responseText = response.text || '';
        console.log(`[GeminiMod] Gemini response (ảnh):`, responseText.slice(0, 300));

        return parseGeminiResponse(responseText);
    } finally {
        cleanupTempFile(tempFile);
    }
}

/**
 * Kiểm duyệt video bằng Gemini (File API — cho file lớn)
 */
async function moderateVideoWithGemini(videoUrl) {
    const client = getAIClient();
    if (!client) throw new Error('Gemini AI client chưa được khởi tạo');

    let tempFile = null;
    try {
        console.log(`[GeminiMod] Kiểm duyệt video: ${videoUrl}`);

        // Download video về temp
        const { filePath, mimeType } = await downloadToTemp(videoUrl);
        tempFile = filePath;

        // Upload lên Gemini File API
        console.log('[GeminiMod] Uploading video to Gemini File API...');
        const uploadResult = await client.files.upload({
            file: filePath,
            config: {
                mimeType: mimeType,
            },
        });

        // Chờ file xử lý xong
        let file = uploadResult;
        let attempts = 0;
        const maxAttempts = 30; // 60 giây max

        while (file.state === 'PROCESSING' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            file = await client.files.get({ name: file.name });
            attempts++;
            console.log(`[GeminiMod] File state: ${file.state} (attempt ${attempts})`);
        }

        if (file.state === 'FAILED') {
            throw new Error('Gemini không thể xử lý video');
        }

        if (file.state === 'PROCESSING') {
            throw new Error('Video quá lâu để xử lý');
        }

        // Gọi generateContent với file đã upload
        const response = await client.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: MODERATION_PROMPT },
                        {
                            fileData: {
                                fileUri: file.uri,
                                mimeType: file.mimeType,
                            },
                        },
                    ],
                },
            ],
            config: {
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const responseText = response.text || '';
        console.log(`[GeminiMod] Gemini response (video):`, responseText.slice(0, 300));

        // Cleanup file trên Gemini (fire-and-forget)
        client.files.delete({ name: file.name }).catch(() => {});

        return parseGeminiResponse(responseText);
    } finally {
        cleanupTempFile(tempFile);
    }
}

/**
 * Kiểm duyệt nội dung chính — entry point
 * Tự phát hiện loại media (video/ảnh) và gọi hàm tương ứng
 *
 * @param {string} videoUrl - URL video/ảnh trên Cloudinary
 * @param {string} thumbnailUrl - URL thumbnail (optional)
 * @returns {{ safe: boolean, reason: string, categories: string[] }}
 */
export async function moderateWithGemini(videoUrl, thumbnailUrl) {
    if (!GEMINI_API_KEY) {
        console.warn('[GeminiMod] GEMINI_API_KEY chưa được cấu hình');
        return null; // Signal caller to use fallback
    }

    try {
        console.log('[GeminiMod] ========== BẮT ĐẦU KIỂM DUYỆT GEMINI ==========');

        const isVideo = videoUrl && /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)(\?|$)/i.test(videoUrl);

        if (isVideo) {
            // Kiểm duyệt video trực tiếp — Gemini phân tích toàn bộ video
            const result = await moderateVideoWithGemini(videoUrl);
            console.log(`[GeminiMod] Kết quả video:`, result);
            return result;
        } else {
            // Kiểm duyệt ảnh
            const imageUrl = thumbnailUrl || videoUrl;
            const result = await moderateImageWithGemini(imageUrl);
            console.log(`[GeminiMod] Kết quả ảnh:`, result);
            return result;
        }
    } catch (error) {
        console.error('[GeminiMod] Lỗi kiểm duyệt Gemini:', error.message);
        return null; // Signal caller to use fallback
    }
}

/**
 * Kiểm duyệt slideshow (nhiều ảnh) bằng Gemini
 * @param {string[]} imageUrls - Danh sách URL ảnh
 * @returns {{ safe: boolean, reason: string, categories: string[] }}
 */
export async function moderateSlideshowWithGemini(imageUrls) {
    if (!GEMINI_API_KEY || !imageUrls?.length) {
        return null;
    }

    try {
        console.log(`[GeminiMod] Kiểm duyệt slideshow: ${imageUrls.length} ảnh`);

        // Kiểm tra tối đa 5 ảnh
        const urlsToCheck = imageUrls.slice(0, 5);

        for (const url of urlsToCheck) {
            const result = await moderateImageWithGemini(url);
            if (result && !result.safe) {
                console.log(`[GeminiMod] ❌ Slideshow REJECTED tại: ${url}`);
                return result;
            }
        }

        return { safe: true, reason: 'Nội dung an toàn', categories: [] };
    } catch (error) {
        console.error('[GeminiMod] Lỗi kiểm duyệt slideshow Gemini:', error.message);
        return null;
    }
}

/**
 * Kiểm tra Gemini API có sẵn dùng không
 */
export function isGeminiAvailable() {
    return Boolean(GEMINI_API_KEY);
}
