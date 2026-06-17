import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MODERATION_PROMPT = `Bạn là hệ thống kiểm duyệt nội dung video. Phân tích hình ảnh/video này và đánh giá xem nó có chứa nội dung vi phạm không.

Các tiêu chí vi phạm:
1. **violence** - Bạo lực, đánh nhau, gây thương tích, máu me
2. **sexual** - Khiêu dâm, khỏa thân, nội dung tình dục
3. **drugs** - Ma túy, chất cấm, sử dụng chất kích thích bất hợp pháp
4. **weapons** - Vũ khí nguy hiểm (súng, dao) được sử dụng đe dọa
5. **self_harm** - Tự gây thương tích, tự tử
6. **gore** - Nội dung ghê rợn, kinh dị máu me
7. **hate_speech** - Biểu tượng/nội dung thù ghét, phân biệt chủng tộc
8. **child_safety** - Nội dung nguy hại đến trẻ em

Trả lời CHÍNH XÁC theo format JSON sau (không thêm markdown, không thêm text khác):
{
  "safe": true/false,
  "categories": ["danh_sach_vi_pham_neu_co"],
  "reason": "Mô tả lý do bằng tiếng Việt (nếu safe=true thì ghi 'Nội dung an toàn')"
}

Lưu ý:
- Chỉ đánh giá là unsafe khi NỘI DUNG RÕ RÀNG vi phạm
- Nội dung thể thao, võ thuật, game không tính là bạo lực
- Thời trang, đồ bơi bình thường không tính là khiêu dâm
- Nếu không chắc chắn, hãy đánh giá là safe`;

/**
 * Tải ảnh từ URL và convert sang base64
 */
async function fetchImageAsBase64(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Không thể tải ảnh: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return { base64, contentType };
}

/**
 * Phân tích nội dung video/ảnh bằng Gemini API
 * @param {string} videoUrl - URL video trên Cloudinary
 * @param {string} thumbnailUrl - URL thumbnail trên Cloudinary
 * @returns {{ safe: boolean, reason: string, categories: string[] }}
 */
export async function moderateVideo(videoUrl, thumbnailUrl) {
    // Nếu không có API key, bỏ qua kiểm duyệt (cho phép upload)
    if (!process.env.GEMINI_API_KEY) {
        console.warn('[Moderation] GEMINI_API_KEY chưa được cấu hình - bỏ qua kiểm duyệt');
        return { safe: true, reason: 'Kiểm duyệt bị bỏ qua (chưa cấu hình API key)', categories: [] };
    }

    try {
        // Ưu tiên dùng thumbnail (nhẹ hơn, nhanh hơn)
        const imageUrl = thumbnailUrl || videoUrl;
        console.log('[Moderation] Đang phân tích:', imageUrl);

        const { base64, contentType } = await fetchImageAsBase64(imageUrl);

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent([
            MODERATION_PROMPT,
            {
                inlineData: {
                    mimeType: contentType,
                    data: base64,
                },
            },
        ]);

        const responseText = result.response.text().trim();
        console.log('[Moderation] Gemini response:', responseText);

        // Parse JSON từ response (loại bỏ markdown code block nếu có)
        const jsonStr = responseText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        const parsed = JSON.parse(jsonStr);

        return {
            safe: Boolean(parsed.safe),
            reason: parsed.reason || (parsed.safe ? 'Nội dung an toàn' : 'Nội dung vi phạm chính sách cộng đồng'),
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        };
    } catch (error) {
        console.error('[Moderation] Lỗi kiểm duyệt:', error.message);

        // Nếu Gemini lỗi, cho phép upload (không block user vì lỗi hệ thống)
        // Có thể đánh dấu pending để admin review sau
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
    if (!process.env.GEMINI_API_KEY || !imageUrls?.length) {
        return { safe: true, reason: 'Bỏ qua kiểm duyệt', categories: [] };
    }

    try {
        // Kiểm tra tối đa 5 ảnh đầu tiên (tránh quá nhiều request)
        const urlsToCheck = imageUrls.slice(0, 5);
        const imageParts = [];

        for (const url of urlsToCheck) {
            try {
                const { base64, contentType } = await fetchImageAsBase64(url);
                imageParts.push({
                    inlineData: {
                        mimeType: contentType,
                        data: base64,
                    },
                });
            } catch (e) {
                console.warn(`[Moderation] Bỏ qua ảnh lỗi: ${url}`, e.message);
            }
        }

        if (imageParts.length === 0) {
            return { safe: true, reason: 'Không có ảnh để kiểm tra', categories: [] };
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent([
            MODERATION_PROMPT + '\n\nĐây là slideshow gồm nhiều ảnh. Hãy đánh giá TOÀN BỘ các ảnh.',
            ...imageParts,
        ]);

        const responseText = result.response.text().trim();
        console.log('[Moderation] Gemini slideshow response:', responseText);

        const jsonStr = responseText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        const parsed = JSON.parse(jsonStr);

        return {
            safe: Boolean(parsed.safe),
            reason: parsed.reason || 'Nội dung vi phạm chính sách cộng đồng',
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        };
    } catch (error) {
        console.error('[Moderation] Lỗi kiểm duyệt slideshow:', error.message);
        return { safe: true, reason: 'Kiểm duyệt tạm thời không khả dụng', categories: [] };
    }
}
