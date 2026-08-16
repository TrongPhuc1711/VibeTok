import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_PATH = path.join(__dirname, '../config/systemSettings.json');

const DEFAULT_SETTINGS = {
    general: {
        appName: "VibeTok",
        tagline: "Nền tảng chia sẻ video ngắn sáng tạo",
        supportEmail: "support@vibetok.com",
        maintenanceMode: false,
        maintenanceMessage: "Hệ thống VibeTok đang được nâng cấp định kỳ. Chúng tôi sẽ trở lại trong ít phút!"
    },
    upload: {
        maxVideoSizeMB: 100,
        maxVideoDurationSec: 180,
        allowedFormats: ["mp4", "webm", "mov"]
    },
    moderation: {
        geminiAiEnabled: true,
        autoHideOnViolation: true,
        reportThreshold: 5,
        bannedKeywords: ["lừa đảo", "hack pass", "chửi bới", "bán nick", "cờ bạc"]
    },
    security: {
        allowRegistration: true,
        requireEmailVerification: false
    }
};

/**
 * Đọc cài đặt hệ thống từ file JSON
 */
export async function readSettingsFile() {
    try {
        const data = await fs.readFile(SETTINGS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return DEFAULT_SETTINGS;
    }
}

/**
 * Lưu cài đặt hệ thống vào file JSON
 */
export async function writeSettingsFile(settings) {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

/**
 * Kiểm tra xem đoạn văn bản (caption/bình luận) có chứa từ cấm không
 * @param {string} text 
 * @returns {Promise<{ hasBanned: boolean, matchedKeyword: string | null }>}
 */
export async function checkBannedKeywords(text) {
    if (!text || typeof text !== 'string') {
        return { hasBanned: false, matchedKeyword: null };
    }

    try {
        const settings = await readSettingsFile();
        const keywords = settings?.moderation?.bannedKeywords || [];

        if (!Array.isArray(keywords) || keywords.length === 0) {
            return { hasBanned: false, matchedKeyword: null };
        }

        const normalizedText = text.toLowerCase();

        for (const rawKw of keywords) {
            if (!rawKw) continue;
            const kw = String(rawKw).trim().toLowerCase();
            if (kw && normalizedText.includes(kw)) {
                return { hasBanned: true, matchedKeyword: rawKw };
            }
        }

        return { hasBanned: false, matchedKeyword: null };
    } catch (err) {
        console.error('Lỗi kiểm tra từ cấm:', err);
        return { hasBanned: false, matchedKeyword: null };
    }
}
