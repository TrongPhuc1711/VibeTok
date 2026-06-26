import axios from 'axios';
import FormData from 'form-data';
import 'dotenv/config';

const IMAGGA_API_URL = 'https://api.imagga.com/v2';
const IMAGGA_API_KEY = process.env.IMAGGA_API_KEY || '';
const IMAGGA_API_SECRET = process.env.IMAGGA_API_SECRET || '';

// NGƯỠNG KIỂM DUYỆT

// Ngưỡng NSFW 
const EXPLICIT_THRESHOLD = 50;   // explicit >= 50% → reject
const SUGGESTIVE_THRESHOLD = 55; // suggestive >= 55% → reject

// Ngưỡng confidence 
// Tags đơn lẻ cần 
const VIOLENCE_TAG_THRESHOLD = 30;
// Tổ hợp nguy hiểm 
const COMBO_TAG_THRESHOLD = 10;

// Tags RẤT NGUY HIỂM — rõ ràng, không mơ hồ → reject ở ngưỡng thấp (>= 10%)
const HIGH_DANGER_TAGS = [
    'suicide', 'suicidal', 'noose', 'gallows',
    'murder', 'corpse', 'cadaver',
    'gore', 'gory', 'gruesome', 'decapitation',
    'dismember', 'mutilation', 'mutilated',
    'torture', 'heroin', 'cocaine', 'meth', 'methamphetamine',
];

// Bạo lực, vũ khí, máu me (chỉ giữ từ rõ ràng, loại bỏ từ mơ hồ như blade/cut/slash)
const VIOLENCE_TAGS = [
    'blood', 'bloody', 'bleeding', 'bloodstain', 'bloodied',
    'violence', 'violent', 'assault',
    'gore', 'gory', 'gruesome', 'brutal', 'brutality',
    'wound', 'wounded',
    'murder', 'killing', 'corpse', 'cadaver',
    'weapon', 'gun', 'pistol', 'rifle', 'firearm', 'shotgun', 'revolver',
    'knife', 'dagger', 'machete',
    'bullet', 'ammunition', 'gunshot',
    'bomb', 'grenade',
    'torture', 'cruelty',
    'stabbing', 'stabbed',
    'decapitation', 'dismember', 'mutilation', 'mutilated',
];

// Tự hại, tự tử 
const SELF_HARM_TAGS = [
    'suicide', 'suicidal', 'self-harm', 'selfharm',
    'hanging', 'hanged', 'noose', 'gallows',
    'suffocation', 'asphyxiation',
    'overdose',
    'drowning',
];

// Ma túy, chất cấm 
const DRUG_TAGS = [
    'narcotics', 'cocaine', 'heroin', 'meth', 'methamphetamine',
    'marijuana', 'cannabis',
    'syringe',
    'bong',
];

// Kết hợp từ khóa nguy hiểm 
const DANGEROUS_COMBINATIONS = [
    { tags: ['rope', 'silhouette'], category: 'self-harm', label: 'Nghi ngờ tự tử (treo cổ)' },
    { tags: ['rope', 'hanging'], category: 'self-harm', label: 'Nghi ngờ tự tử (treo cổ)' },
    { tags: ['rope', 'shadow'], category: 'self-harm', label: 'Nghi ngờ tự tử (treo cổ)' },
    { tags: ['noose', 'person'], category: 'self-harm', label: 'Nghi ngờ tự tử (treo cổ)' },
    { tags: ['noose', 'silhouette'], category: 'self-harm', label: 'Nghi ngờ tự tử (treo cổ)' },
    { tags: ['shadow', 'hanging'], category: 'self-harm', label: 'Nghi ngờ tự tử (treo cổ)' },
    { tags: ['silhouette', 'hanging'], category: 'self-harm', label: 'Nghi ngờ tự tử (treo cổ)' },
    { tags: ['knife', 'blood'], category: 'violence', label: 'Bạo lực (đâm chém)' },
    { tags: ['knife', 'wound'], category: 'violence', label: 'Bạo lực (đâm chém)' },
    { tags: ['gun', 'blood'], category: 'violence', label: 'Bạo lực (bắn súng)' },
    { tags: ['razor', 'wrist'], category: 'self-harm', label: 'Nghi ngờ tự hại (cắt tay)' },
    { tags: ['razor', 'blood'], category: 'self-harm', label: 'Nghi ngờ tự hại' },
    { tags: ['rope', 'person'], category: 'self-harm', label: 'Nghi ngờ tự tử' },
];



const authConfig = {
    auth: {
        username: IMAGGA_API_KEY,
        password: IMAGGA_API_SECRET,
    },
    timeout: 30000,
};

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
 * Lấy upload_id cho ảnh (download → upload lên Imagga)
 * Trả về upload_id, cần gọi cleanup sau khi dùng xong
 */
async function getUploadId(imageUrl) {
    const { buffer, contentType } = await fetchImageBuffer(imageUrl);
    const uploadId = await uploadImageToImagga(buffer, contentType);
    if (!uploadId) {
        throw new Error('Không nhận được upload_id từ Imagga');
    }
    console.log(`[Moderation] Đã upload ảnh, upload_id: ${uploadId}`);
    return uploadId;
}

/**
 * Xóa ảnh đã upload khỏi Imagga (fire-and-forget)
 */
function cleanupUpload(uploadId) {
    if (uploadId) {
        axios.delete(`${IMAGGA_API_URL}/uploads/${uploadId}`, authConfig).catch(() => { });
    }
}



/**
 * Kiểm duyệt NSFW bằng Imagga adult_content categorizer
 * Thử URL trực tiếp trước, nếu lỗi thì dùng upload_id
 * @returns {{ scores: object, uploadId: string|null }} scores + uploadId (nếu đã upload)
 */
async function checkNSFW(imageUrl) {
    let uploadId = null;
    try {
        const response = await axios.get(`${IMAGGA_API_URL}/categories/adult_content`, {
            params: { image_url: imageUrl },
            ...authConfig,
        });

        if (response.data?.result?.categories?.length > 0) {
            return {
                scores: parseNSFWCategories(response.data.result.categories),
                uploadId: null,
            };
        }
    } catch (urlError) {
        console.log(`[Moderation] URL mode thất bại (${urlError.response?.status || urlError.message}), chuyển sang upload mode...`);
    }

    uploadId = await getUploadId(imageUrl);

    const response = await axios.get(`${IMAGGA_API_URL}/categories/adult_content`, {
        params: { image_upload_id: uploadId },
        ...authConfig,
    });

    return {
        scores: parseNSFWCategories(response.data?.result?.categories || []),
        uploadId,
    };
}

/**
 * Parse danh sách NSFW categories từ Imagga response
 */
function parseNSFWCategories(categories) {
    const scores = { safe: 0, suggestive: 0, explicit: 0 };
    for (const cat of categories) {
        let name = '';
        if (typeof cat.name === 'string') {
            name = cat.name;
        } else if (cat.name && typeof cat.name === 'object') {
            name = cat.name.en || '';
        }

        name = name.toLowerCase().trim();
        if (name === 'nsfw') name = 'explicit';

        if (name in scores) {
            scores[name] = cat.confidence || 0;
        }
    }
    return scores;
}

/**
 * Phân tích kết quả NSFW và quyết định safe/unsafe
 */
function analyzeNSFWScores(scores) {
    const { safe, suggestive, explicit: explicitScore } = scores;
    console.log(`[Moderation] NSFW Scores — safe: ${safe.toFixed(1)}%, suggestive: ${suggestive.toFixed(1)}%, explicit: ${explicitScore.toFixed(1)}%`);

    if (explicitScore >= EXPLICIT_THRESHOLD) {
        return {
            safe: false,
            reason: `Nội dung bị từ chối: Chứa nội dung khiêu dâm/khỏa thân (độ tin cậy: ${explicitScore.toFixed(1)}%)`,
            categories: ['sexual'],
        };
    }

    if (suggestive >= SUGGESTIVE_THRESHOLD) {
        return {
            safe: false,
            reason: `Nội dung bị từ chối: Chứa nội dung gợi dục không phù hợp (độ tin cậy: ${suggestive.toFixed(1)}%)`,
            categories: ['sexual'],
        };
    }

    return null; // Qua tầng 1
}



/**
 * Lấy tags từ Imagga Tags API
 * @param {string|null} imageUrl - URL ảnh (thử trước)
 * @param {string|null} uploadId - Upload ID (dùng nếu URL thất bại)
 * @returns {Array<{tag: string, confidence: number}>} Danh sách tags
 */
async function getImageTags(imageUrl, uploadId) {
    if (imageUrl) {
        try {
            const response = await axios.get(`${IMAGGA_API_URL}/tags`, {
                params: { image_url: imageUrl, threshold: 5, language: 'en' },
                ...authConfig,
            });

            if (response.data?.result?.tags?.length > 0) {
                return parseTags(response.data.result.tags);
            }
        } catch (urlError) {
            console.log(`[Moderation] Tags URL mode thất bại (${urlError.response?.status || urlError.message})`);
        }
    }

    let needCleanup = false;
    if (!uploadId && imageUrl) {
        uploadId = await getUploadId(imageUrl);
        needCleanup = true;
    }

    if (!uploadId) {
        return [];
    }

    try {
        const response = await axios.get(`${IMAGGA_API_URL}/tags`, {
            params: { image_upload_id: uploadId, threshold: 5, language: 'en' },
            ...authConfig,
        });

        return parseTags(response.data?.result?.tags || []);
    } finally {
        if (needCleanup) {
            cleanupUpload(uploadId);
        }
    }
}

/**
 * Parse tags từ Imagga response
 */
function parseTags(tags) {
    return tags.map(t => {
        let tagName = '';
        if (typeof t.tag === 'string') {
            tagName = t.tag;
        } else if (t.tag && typeof t.tag === 'object') {
            tagName = t.tag.en || '';
        }
        return {
            tag: tagName.toLowerCase().trim(),
            confidence: t.confidence || 0,
        };
    });
}

/**
 * Kiểm tra xem tag có nằm trong danh sách nguy hiểm không
 */
function findDangerousTags(tags, dangerousList) {
    return tags.filter(t => {
        // Kiểm tra exact match hoặc partial match
        return dangerousList.some(keyword => {
            return t.tag === keyword || t.tag.includes(keyword) || keyword.includes(t.tag);
        });
    });
}

/**
 * Kiểm tra tổ hợp từ khóa nguy hiểm
 * Ví dụ: "rope" + "silhouette" cùng xuất hiện → rất nguy hiểm
 */
function checkDangerousCombinations(tags) {
    const tagNames = tags.map(t => t.tag);

    for (const combo of DANGEROUS_COMBINATIONS) {
        const allPresent = combo.tags.every(keyword =>
            tagNames.some(tag => tag === keyword || tag.includes(keyword))
        );

        if (allPresent) {
            return {
                found: true,
                combo,
                matchedTags: tags.filter(t => combo.tags.some(k => t.tag.includes(k))),
            };
        }
    }

    return { found: false };
}

/**
 * Phân tích tags và quyết định safe/unsafe
 */
function analyzeTagsForDanger(tags) {
    console.log(`[Moderation] Tags phát hiện (${tags.length}):`, tags.slice(0, 25).map(t => `${t.tag}(${t.confidence.toFixed(1)}%)`).join(', '));

    // 1. Kiểm tra HIGH_DANGER_TAGS — từ rõ ràng nguy hiểm, ngưỡng rất thấp (>= 10%)
    const highDangerFound = findDangerousTags(tags, HIGH_DANGER_TAGS).filter(t => t.confidence >= 10);
    if (highDangerFound.length > 0) {
        const topTag = highDangerFound.sort((a, b) => b.confidence - a.confidence)[0];
        console.log(`[Moderation] 🚨 Phát hiện NỘI DUNG CỰC KỲ NGUY HIỂM:`, highDangerFound.map(t => `${t.tag}(${t.confidence.toFixed(1)}%)`).join(', '));
        return {
            safe: false,
            reason: `Nội dung bị từ chối: Chứa nội dung cực kỳ nguy hiểm (${topTag.tag}: ${topTag.confidence.toFixed(1)}%)`,
            categories: ['violence', 'self-harm'],
        };
    }

    // 2. Kiểm tra tổ hợp nguy hiểm (ngưỡng thấp vì kết hợp = rõ ràng hơn)
    const comboResult = checkDangerousCombinations(tags.filter(t => t.confidence >= COMBO_TAG_THRESHOLD));
    if (comboResult.found) {
        const comboTags = comboResult.matchedTags.map(t => `${t.tag}(${t.confidence.toFixed(1)}%)`).join(' + ');
        console.log(`[Moderation] ⚠️ Phát hiện TỔ HỢP NGUY HIỂM: ${comboResult.combo.label} → ${comboTags}`);
        return {
            safe: false,
            reason: `Nội dung bị từ chối: ${comboResult.combo.label} (${comboResult.combo.tags.join(' + ')})`,
            categories: [comboResult.combo.category],
        };
    }

    // 3. Kiểm tra tags bạo lực (ngưỡng cao hơn vì từ đơn lẻ)
    const violentTags = findDangerousTags(tags, VIOLENCE_TAGS).filter(t => t.confidence >= VIOLENCE_TAG_THRESHOLD);
    if (violentTags.length > 0) {
        const topTag = violentTags.sort((a, b) => b.confidence - a.confidence)[0];
        console.log(`[Moderation] ⚠️ Phát hiện BẠO LỰC:`, violentTags.map(t => `${t.tag}(${t.confidence.toFixed(1)}%)`).join(', '));
        return {
            safe: false,
            reason: `Nội dung bị từ chối: Chứa nội dung bạo lực/máu me (${topTag.tag}: ${topTag.confidence.toFixed(1)}%)`,
            categories: ['violence'],
        };
    }

    // 4. Kiểm tra tags tự hại
    const selfHarmTags = findDangerousTags(tags, SELF_HARM_TAGS).filter(t => t.confidence >= VIOLENCE_TAG_THRESHOLD);
    if (selfHarmTags.length > 0) {
        const topTag = selfHarmTags.sort((a, b) => b.confidence - a.confidence)[0];
        console.log(`[Moderation] ⚠️ Phát hiện TỰ HẠI:`, selfHarmTags.map(t => `${t.tag}(${t.confidence.toFixed(1)}%)`).join(', '));
        return {
            safe: false,
            reason: `Nội dung bị từ chối: Chứa nội dung tự hại/nguy hiểm (${topTag.tag}: ${topTag.confidence.toFixed(1)}%)`,
            categories: ['self-harm'],
        };
    }

    // 5. Kiểm tra tags ma túy
    const drugTags = findDangerousTags(tags, DRUG_TAGS).filter(t => t.confidence >= VIOLENCE_TAG_THRESHOLD);
    if (drugTags.length > 0) {
        const topTag = drugTags.sort((a, b) => b.confidence - a.confidence)[0];
        console.log(`[Moderation] ⚠️ Phát hiện MA TÚY:`, drugTags.map(t => `${t.tag}(${t.confidence.toFixed(1)}%)`).join(', '));
        return {
            safe: false,
            reason: `Nội dung bị từ chối: Chứa nội dung liên quan đến chất cấm (${topTag.tag}: ${topTag.confidence.toFixed(1)}%)`,
            categories: ['drugs'],
        };
    }

    return null;
}

// EXPORT: Kiểm duyệt chính
// TRÍCH XUẤT FRAME TỪ VIDEO (Cloudinary)


/**
 * Số lượng frame tối đa trích xuất từ video để kiểm duyệt
 */
const MAX_VIDEO_FRAMES = 4;

/**
 
 * @param {string} videoUrl - URL video trên Cloudinary
 * @returns {string[]} Danh sách URL ảnh (frame) trích xuất từ video
 */
function extractVideoFrames(videoUrl) {
    // Chỉ áp dụng cho URL Cloudinary
    if (!videoUrl || !videoUrl.includes('cloudinary.com')) {
        return [];
    }

    const offsets = ['0', '25p', '50p', '75p'];
    const frames = [];

    for (const offset of offsets.slice(0, MAX_VIDEO_FRAMES)) {
        try {

            const frameUrl = videoUrl
                .replace('/upload/', `/upload/so_${offset}/`)
                .replace(/\.[^.]+$/, '.jpg');
            frames.push(frameUrl);
        } catch (e) {
        }
    }

    return frames;
}

/**
 * Kiểm duyệt 1 ảnh qua cả 2 tầng (NSFW + Tags)
 * @param {string} imageUrl - URL ảnh cần kiểm tra
 * @param {string} label - Nhãn hiển thị trong log (vd: "Thumbnail", "Frame@25%")
 * @returns {{ safe: boolean, reason: string, categories: string[] } | null} - null = an toàn
 */
async function moderateOneImage(imageUrl, label = 'Image') {
    let uploadId = null;

    try {
        console.log(`[Moderation] --- Kiểm duyệt ${label}: ${imageUrl} ---`);

        // Tầng 1: NSFW
        const nsfwResult = await checkNSFW(imageUrl);
        uploadId = nsfwResult.uploadId;

        const nsfwDecision = analyzeNSFWScores(nsfwResult.scores);
        if (nsfwDecision) {
            console.log(`[Moderation] ❌ REJECT ${label} (NSFW): ${nsfwDecision.reason}`);
            return nsfwDecision;
        }

        // Tầng 2: Tags (bạo lực, tự hại, ma túy)
        const tags = await getImageTags(imageUrl, uploadId);
        const tagDecision = analyzeTagsForDanger(tags);
        if (tagDecision) {
            console.log(`[Moderation] ❌ REJECT ${label} (Tags): ${tagDecision.reason}`);
            return tagDecision;
        }

        return null;
    } finally {
        cleanupUpload(uploadId);
    }
}

// EXPORT: Kiểm duyệt chính
/**
 * @param {string} videoUrl - URL video/ảnh trên Cloudinary
 * @param {string} thumbnailUrl - URL thumbnail trên Cloudinary 
 * @returns {{ safe: boolean, reason: string, categories: string[] }}
 */
export async function moderateVideo(videoUrl, thumbnailUrl) {
    if (!IMAGGA_API_KEY || !IMAGGA_API_SECRET) {
        console.warn('[Moderation] IMAGGA_API_KEY/SECRET chưa được cấu hình - bỏ qua kiểm duyệt');
        return { safe: true, reason: 'Kiểm duyệt bị bỏ qua (chưa cấu hình API key)', categories: [] };
    }

    try {
        console.log('[Moderation] ========== BẮT ĐẦU KIỂM DUYỆT ==========');

        // Xác định danh sách ảnh cần kiểm tra
        const imagesToCheck = [];

        // Kiểm tra xem videoUrl có phải là video không (có extension video)
        const isVideo = videoUrl && /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)(\?|$)/i.test(videoUrl);

        if (isVideo) {
            // VIDEO: trích xuất nhiều frame từ Cloudinary
            const frames = extractVideoFrames(videoUrl);
            console.log(`[Moderation] Video detected — trích xuất ${frames.length} frames`);

            // Thêm thumbnail (nếu có và khác các frame)
            if (thumbnailUrl) {
                imagesToCheck.push({ url: thumbnailUrl, label: 'Thumbnail' });
            }

            // Thêm các frame trích xuất
            frames.forEach((frameUrl, i) => {
                const pct = ['0%', '25%', '50%', '75%'][i] || `${i}`;
                imagesToCheck.push({ url: frameUrl, label: `Frame@${pct}` });
            });
        } else {
            // ẢNH: chỉ kiểm tra 1 URL
            const imageUrl = thumbnailUrl || videoUrl;
            imagesToCheck.push({ url: imageUrl, label: 'Image' });
        }

        console.log(`[Moderation] Tổng số ảnh cần kiểm tra: ${imagesToCheck.length}`);

        // Kiểm tra từng ảnh — dừng ngay khi phát hiện vi phạm
        for (const { url, label } of imagesToCheck) {
            try {
                const decision = await moderateOneImage(url, label);
                if (decision) {
                    console.log(`[Moderation] ========== KẾT QUẢ: BỊ TỪ CHỐI (${label}) ==========`);
                    return decision;
                }
                console.log(`[Moderation] ${label} OK`);
            } catch (frameError) {
                console.warn(`[Moderation] Lỗi kiểm tra ${label}:`, frameError.response?.data || frameError.message);
            }
        }

        console.log('[Moderation] ========== KẾT QUẢ: AN TOÀN ==========');
        return { safe: true, reason: 'Nội dung an toàn', categories: [] };

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
                // Dùng moderateVideo cho từng ảnh (đã bao gồm cả 2 tầng)
                const result = await moderateVideo(url);

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
