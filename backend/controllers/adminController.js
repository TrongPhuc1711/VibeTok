import os from 'os';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import redis from '../config/redis.js';
import { AdminModel } from '../models/adminModel.js';
import { readSettingsFile, writeSettingsFile } from '../utils/systemSettingsHelper.js';
import { triggerNotification } from './notificationController.js';
import { syncTrendingMusicFromAudius } from '../services/audiusSyncService.js';


// GET /api/admin/stats
export const getStats = async (req, res) => {
    try {
        const stats = await AdminModel.getOverviewStats();
        res.json({ stats });
    } catch (e) {
        console.error('Admin getStats error:', e);
        res.status(500).json({ message: 'Lỗi lấy thống kê', error: e.message });
    }
};

// GET /api/admin/user-growth?days=12
export const getUserGrowth = async (req, res) => {
    try {
        const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 12));
        const data = await AdminModel.getUserGrowth(days);
        res.json({ data });
    } catch (e) {
        console.error('Admin getUserGrowth error:', e);
        res.status(500).json({ message: 'Lỗi lấy user growth', error: e.message });
    }
};

// GET /api/admin/content-distribution
export const getContentDistribution = async (req, res) => {
    try {
        const data = await AdminModel.getContentDistribution();
        res.json({ data });
    } catch (e) {
        console.error('Admin getContentDistribution error:', e);
        res.status(500).json({ message: 'Lỗi lấy phân loại nội dung', error: e.message });
    }
};

// GET /api/admin/top-creators?limit=5
export const getTopCreators = async (req, res) => {
    try {
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 5));
        const data = await AdminModel.getTopCreators(limit);
        res.json({ data });
    } catch (e) {
        console.error('Admin getTopCreators error:', e);
        res.status(500).json({ message: 'Lỗi lấy top creators', error: e.message });
    }
};

// GET /api/admin/users?filter=all&search=&page=1&limit=10
export const getUsers = async (req, res) => {
    try {
        const { filter = 'all', search = '', page = 1, limit = 10 } = req.query;
        const result = await AdminModel.getUsers({
            filter, search,
            page: Math.max(1, parseInt(page)),
            limit: Math.min(50, Math.max(1, parseInt(limit))),
        });
        res.json(result);
    } catch (e) {
        console.error('Admin getUsers error:', e);
        res.status(500).json({ message: 'Lỗi lấy danh sách users', error: e.message });
    }
};

// GET /api/admin/user-counts
export const getUserCounts = async (req, res) => {
    try {
        const counts = await AdminModel.getUserCounts();
        res.json({ counts });
    } catch (e) {
        console.error('Admin getUserCounts error:', e);
        res.status(500).json({ message: 'Lỗi lấy user counts', error: e.message });
    }
};

// PATCH /api/admin/users/:id/ban
export const banUser = async (req, res) => {
    try {
        // Không cho ban chính mình
        if (String(req.params.id) === String(req.user.id)) {
            return res.status(400).json({ message: 'Không thể ban chính mình!' });
        }
        const ok = await AdminModel.banUser(req.params.id);
        if (!ok) return res.status(404).json({ message: 'Người dùng không tồn tại hoặc là admin' });
        res.json({ message: 'Đã ban người dùng' });
    } catch (e) {
        console.error('Admin banUser error:', e);
        res.status(500).json({ message: 'Lỗi ban user', error: e.message });
    }
};

// PATCH /api/admin/users/:id/unban
export const unbanUser = async (req, res) => {
    try {
        const ok = await AdminModel.unbanUser(req.params.id);
        if (!ok) return res.status(404).json({ message: 'Người dùng không tồn tại' });
        res.json({ message: 'Đã unban người dùng' });
    } catch (e) {
        console.error('Admin unbanUser error:', e);
        res.status(500).json({ message: 'Lỗi unban user', error: e.message });
    }
};

// PATCH /api/admin/users/:id/temp-ban
export const tempBanUser = async (req, res) => {
    try {
        const { duration, reason } = req.body;
        if (!duration || ![30, 60, 360, 1440].includes(Number(duration))) {
            return res.status(400).json({ message: 'Thời gian vô hiệu hóa không hợp lệ! (30, 60, 360, 1440 phút)' });
        }
        // Không cho ban chính mình
        if (String(req.params.id) === String(req.user.id)) {
            return res.status(400).json({ message: 'Không thể vô hiệu hóa chính mình!' });
        }
        const ok = await AdminModel.tempBanUser(req.params.id, Number(duration), reason || null);
        if (!ok) return res.status(404).json({ message: 'Người dùng không tồn tại hoặc là admin' });

        const durationLabels = { 30: '30 phút', 60: '1 giờ', 360: '6 giờ', 1440: '24 giờ' };
        const label = durationLabels[Number(duration)] || `${duration} phút`;

        res.json({ message: `Đã vô hiệu hóa tài khoản trong ${label}` });
    } catch (e) {
        console.error('Admin tempBanUser error:', e);
        res.status(500).json({ message: 'Lỗi vô hiệu hóa tạm thời', error: e.message });
    }
};

// GET /api/admin/videos?status=all&search=&page=1&limit=12
export const getVideos = async (req, res) => {
    try {
        const { status = 'all', search = '', page = 1, limit = 12 } = req.query;
        const result = await AdminModel.getVideos({
            status, search,
            page: Math.max(1, parseInt(page)),
            limit: Math.min(50, Math.max(1, parseInt(limit))),
        });
        res.json(result);
    } catch (e) {
        console.error('Admin getVideos error:', e);
        res.status(500).json({ message: 'Lỗi lấy danh sách videos', error: e.message });
    }
};

// GET /api/admin/video-counts
export const getVideoCounts = async (req, res) => {
    try {
        const counts = await AdminModel.getVideoCounts();
        res.json({ counts });
    } catch (e) {
        console.error('Admin getVideoCounts error:', e);
        res.status(500).json({ message: 'Lỗi lấy video counts', error: e.message });
    }
};

// PATCH /api/admin/videos/:id/hide
export const hideVideo = async (req, res) => {
    try {
        const reason = req.body.reason || null;
        const ok = await AdminModel.hideVideo(req.params.id, reason);
        if (!ok) return res.status(404).json({ message: 'Video không tồn tại' });

        try {
            const [rows] = await pool.query('SELECT user_id FROM videos WHERE id = ?', [req.params.id]);
            if (rows[0]?.user_id) {
                const sender = { id: req.user.id, username: 'admin', fullName: 'Quản trị viên' };
                await triggerNotification(rows[0].user_id, sender, 'video_rejected', req.params.id);
            }
        } catch (notifErr) {
            console.error('Lỗi gửi thông báo ẩn video:', notifErr.message);
        }

        res.json({ message: 'Đã ẩn video' });
    } catch (e) {
        console.error('Admin hideVideo error:', e);
        res.status(500).json({ message: 'Lỗi ẩn video', error: e.message });
    }
};

// PATCH /api/admin/videos/:id/restore
export const restoreVideo = async (req, res) => {
    try {
        const ok = await AdminModel.restoreVideo(req.params.id);
        if (!ok) return res.status(404).json({ message: 'Video không tồn tại' });
        res.json({ message: 'Đã khôi phục video' });
    } catch (e) {
        console.error('Admin restoreVideo error:', e);
        res.status(500).json({ message: 'Lỗi khôi phục video', error: e.message });
    }
};

// PATCH /api/admin/videos/:id/approve — duyệt lại video bị kiểm duyệt tự động từ chối
export const approveVideo = async (req, res) => {
    try {
        const ok = await AdminModel.approveVideo(req.params.id);
        if (!ok) return res.status(404).json({ message: 'Video không tồn tại' });

        try {
            const [rows] = await pool.query('SELECT user_id FROM videos WHERE id = ?', [req.params.id]);
            if (rows[0]?.user_id) {
                const sender = { id: req.user.id, username: 'admin', fullName: 'Quản trị viên' };
                await triggerNotification(rows[0].user_id, sender, 'video_approved', req.params.id);
            }
        } catch (notifErr) {
            console.error('Lỗi gửi thông báo duyệt video:', notifErr.message);
        }

        res.json({ message: 'Đã duyệt video thành công' });
    } catch (e) {
        console.error('Admin approveVideo error:', e);
        res.status(500).json({ message: 'Lỗi duyệt video', error: e.message });
    }
};

// GET /api/admin/views-per-day?days=7
export const getViewsPerDay = async (req, res) => {
    try {
        const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 7));
        const data = await AdminModel.getViewsPerDay(days);
        res.json({ data });
    } catch (e) {
        console.error('Admin getViewsPerDay error:', e);
        res.status(500).json({ message: 'Lỗi lấy views per day', error: e.message });
    }
};

// GET /api/admin/sidebar-counts
export const getSidebarCounts = async (req, res) => {
    try {
        const counts = await AdminModel.getSidebarCounts();
        res.json({ counts });
    } catch (e) {
        console.error('Admin getSidebarCounts error:', e);
        res.status(500).json({ message: 'Lỗi lấy sidebar counts', error: e.message });
    }
};

// PATCH /api/admin/users/:id/reset-password
export const resetUserPassword = async (req, res) => {
    try {
        const new_password = req.body.new_password || req.body.mat_khau_moi;
        const userId = req.params.id;

        if (!new_password) {
            return res.status(400).json({ message: 'Vui lòng nhập mật khẩu mới!' });
        }

        if (new_password.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 8 ký tự!' });
        }

        // Không cho đổi mật khẩu của admin khác
        const ok = await AdminModel.resetUserPassword(userId, new_password);
        if (!ok) {
            return res.status(404).json({ message: 'Người dùng không tồn tại hoặc là admin' });
        }

        res.json({ message: 'Đã đổi mật khẩu thành công!' });
    } catch (e) {
        console.error('Admin resetUserPassword error:', e);
        res.status(500).json({ message: 'Lỗi đổi mật khẩu', error: e.message });
    }
};

//MUSIC 

// GET /api/admin/music?filter=all&search=&page=1&limit=10
export const getMusic = async (req, res) => {
    try {
        const { filter = 'all', search = '', page = 1, limit = 10 } = req.query;
        const result = await AdminModel.getMusic({
            filter, search,
            page: Math.max(1, parseInt(page)),
            limit: Math.min(50, Math.max(1, parseInt(limit))),
        });
        res.json(result);
    } catch (e) {
        console.error('Admin getMusic error:', e);
        res.status(500).json({ message: 'Lỗi lấy danh sách nhạc', error: e.message });
    }
};

// GET /api/admin/music-counts
export const getMusicCounts = async (req, res) => {
    try {
        const counts = await AdminModel.getMusicCounts();
        res.json({ counts });
    } catch (e) {
        console.error('Admin getMusicCounts error:', e);
        res.status(500).json({ message: 'Lỗi lấy music counts', error: e.message });
    }
};

// POST /api/admin/music
export const createMusic = async (req, res) => {
    try {
        const { title, artist, duration, trending } = req.body;

        const audioUrl = req.files?.audio?.[0]?.path;
        const cover = req.files?.cover?.[0]?.path || '';

        if (!title || !artist) {
            return res.status(400).json({ message: 'Tên bài hát và nghệ sĩ là bắt buộc!' });
        }
        if (!audioUrl) {
            return res.status(400).json({ message: 'File âm thanh là bắt buộc!' });
        }

        const id = await AdminModel.createMusic({
            title,
            artist,
            duration: Number(duration) || 0,
            audioUrl,
            cover,
            trending: trending === 'true'
        });

        res.status(201).json({ message: 'Đã thêm bài hát!', id });
    } catch (e) {
        console.error('Admin createMusic error:', e);
        res.status(500).json({ message: 'Lỗi thêm bài hát', error: e.message });
    }
};

// PATCH /api/admin/music/:id
export const updateMusic = async (req, res) => {
    try {
        const updates = { ...req.body };

        if (updates.trending !== undefined) {
            updates.trending = updates.trending === 'true';
        }
        if (req.files?.audio?.[0]?.path) {
            updates.audioUrl = req.files.audio[0].path;
        }
        if (req.files?.cover?.[0]?.path) {
            updates.cover = req.files.cover[0].path;
        }

        const ok = await AdminModel.updateMusic(req.params.id, updates);
        if (!ok) return res.status(404).json({ message: 'Bài hát không tồn tại' });
        res.json({ message: 'Đã cập nhật bài hát!' });
    } catch (e) {
        console.error('Admin updateMusic error:', e);
        res.status(500).json({ message: 'Lỗi cập nhật bài hát', error: e.message });
    }
};

// DELETE /api/admin/music/:id
export const deleteMusic = async (req, res) => {
    try {
        const ok = await AdminModel.deleteMusic(req.params.id);
        if (!ok) return res.status(404).json({ message: 'Bài hát không tồn tại' });
        res.json({ message: 'Đã xóa bài hát!' });
    } catch (e) {
        console.error('Admin deleteMusic error:', e);
        res.status(500).json({ message: 'Lỗi xóa bài hát', error: e.message });
    }
};

// PATCH /api/admin/music/:id/trending
export const toggleMusicTrending = async (req, res) => {
    try {
        const result = await AdminModel.toggleMusicTrending(req.params.id);
        if (result === null) return res.status(404).json({ message: 'Bài hát không tồn tại' });
        res.json({ message: result ? 'Đã đánh dấu thịnh hành' : 'Đã bỏ thịnh hành', trending: result });
    } catch (e) {
        console.error('Admin toggleMusicTrending error:', e);
        res.status(500).json({ message: 'Lỗi toggle trending', error: e.message });
    }
};

// ── REPORTS MANAGEMENT FOR ADMIN ──
import {
    getReportsForAdmin,
    getReportCounts as getReportCountsModel,
    updateReportStatus as updateReportStatusModel,
    deleteReport as deleteReportModel,
} from '../models/reportModel.js';

// GET /api/admin/reports
export const getAdminReports = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const status = req.query.status || 'all';
        const search = req.query.search || '';

        const data = await getReportsForAdmin({ status, search, page, limit });
        res.json(data);
    } catch (e) {
        console.error('Admin getAdminReports error:', e);
        res.status(500).json({ message: 'Lỗi tải danh sách báo cáo', error: e.message });
    }
};

// GET /api/admin/report-counts
export const getAdminReportCounts = async (req, res) => {
    try {
        const counts = await getReportCountsModel();
        res.json(counts);
    } catch (e) {
        console.error('Admin getAdminReportCounts error:', e);
        res.status(500).json({ message: 'Lỗi thống kê báo cáo', error: e.message });
    }
};

// PATCH /api/admin/reports/:id/status
export const updateAdminReportStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'reviewed', 'resolved'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }
        await updateReportStatusModel(req.params.id, status);
        res.json({ message: 'Đã cập nhật trạng thái báo cáo!' });
    } catch (e) {
        console.error('Admin updateAdminReportStatus error:', e);
        res.status(500).json({ message: 'Lỗi cập nhật báo cáo', error: e.message });
    }
};

// DELETE /api/admin/reports/:id
export const deleteAdminReport = async (req, res) => {
    try {
        await deleteReportModel(req.params.id);
        res.json({ message: 'Đã xóa báo cáo!' });
    } catch (e) {
        console.error('Admin deleteAdminReport error:', e);
        res.status(500).json({ message: 'Lỗi xóa báo cáo', error: e.message });
    }
};

// ==========================================
// SYSTEM SETTINGS & SYSTEM OPERATIONS
// ==========================================

// GET /api/admin/settings
export const getSettings = async (req, res) => {
    try {
        const settings = await readSettingsFile();
        res.json({ success: true, settings });
    } catch (e) {
        console.error('Admin getSettings error:', e);
        res.status(500).json({ message: 'Lỗi đọc cấu hình hệ thống', error: e.message });
    }
};

// PUT /api/admin/settings
export const updateSettings = async (req, res) => {
    try {
        const current = await readSettingsFile();
        const updated = {
            ...current,
            ...req.body,
            general: { ...current.general, ...(req.body.general || {}) },
            upload: { ...current.upload, ...(req.body.upload || {}) },
            moderation: { ...current.moderation, ...(req.body.moderation || {}) },
            security: { ...current.security, ...(req.body.security || {}) },
        };
        await writeSettingsFile(updated);
        res.json({ success: true, message: 'Đã lưu cấu hình hệ thống thành công!', settings: updated });
    } catch (e) {
        console.error('Admin updateSettings error:', e);
        res.status(500).json({ message: 'Lỗi lưu cấu hình hệ thống', error: e.message });
    }
};

// GET /api/admin/system/health
export const getSystemHealth = async (req, res) => {
    try {
        // 1. MySQL Status
        let dbStatus = 'connected';
        let dbLatency = 0;
        try {
            const start = Date.now();
            await pool.query('SELECT 1');
            dbLatency = Date.now() - start;
        } catch (dbErr) {
            dbStatus = 'disconnected';
        }

        // 2. Redis Status
        let redisStatus = 'connected';
        let redisKeysCount = 0;
        try {
            const pong = await redis.ping();
            if (pong !== 'PONG') redisStatus = 'error';
            const info = await redis.dbsize();
            redisKeysCount = Number(info) || 0;
        } catch (rErr) {
            redisStatus = 'disconnected';
        }

        // 3. Gemini API Status
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const geminiStatus = geminiApiKey && geminiApiKey.length > 10 ? 'configured' : 'missing';

        // 4. Server metrics
        const mem = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const uptimeSeconds = Math.floor(process.uptime());

        res.json({
            success: true,
            health: {
                nodeVersion: process.version,
                platform: `${os.type()} (${os.arch()})`,
                uptime: uptimeSeconds,
                database: {
                    status: dbStatus,
                    latencyMs: dbLatency,
                    databaseName: process.env.DB_NAME || 'defaultdb'
                },
                redis: {
                    status: redisStatus,
                    keysCount: redisKeysCount
                },
                geminiAi: {
                    status: geminiStatus,
                    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash'
                },
                memory: {
                    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
                    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
                    rssMB: Math.round(mem.rss / 1024 / 1024),
                    systemFreeMB: Math.round(freeMem / 1024 / 1024),
                    systemTotalMB: Math.round(totalMem / 1024 / 1024)
                }
            }
        });
    } catch (e) {
        console.error('Admin getSystemHealth error:', e);
        res.status(500).json({ message: 'Lỗi kiểm tra trạng thái hệ thống', error: e.message });
    }
};

// POST /api/admin/system/sync-audius
export const triggerAudiusSync = async (req, res) => {
    try {
        const result = await syncTrendingMusicFromAudius();
        if (result.success) {
            res.json({ success: true, message: `Đồng bộ hoàn tất! Đã thêm ${result.added || 0} bài hát mới từ Audius.`, added: result.added });
        } else {
            res.status(500).json({ success: false, message: `Lỗi đồng bộ: ${result.error}` });
        }
    } catch (e) {
        console.error('Admin triggerAudiusSync error:', e);
        res.status(500).json({ message: 'Lỗi thực hiện đồng bộ nhạc Audius', error: e.message });
    }
};

// POST /api/admin/system/flush-cache
export const triggerFlushCache = async (req, res) => {
    try {
        const streamKeys = await redis.keys('feed:*');
        const trendingKeys = await redis.keys('trending:*');
        const allKeys = [...streamKeys, ...trendingKeys];
        
        if (allKeys.length > 0) {
            await redis.del(...allKeys);
        }

        res.json({ success: true, message: `Đã dọn dẹp ${allKeys.length} cache keys hệ thống thành công!` });
    } catch (e) {
        console.error('Admin triggerFlushCache error:', e);
        res.status(500).json({ message: 'Lỗi dọn dẹp Redis cache', error: e.message });
    }
};

// PATCH /api/admin/profile
export const updateAdminProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { display_name, bio, avatar_url } = req.body;

        const updates = [];
        const values = [];

        if (display_name !== undefined) {
            updates.push('display_name = ?');
            values.push(display_name.trim());
        }
        if (bio !== undefined) {
            updates.push('bio = ?');
            values.push(bio.trim());
        }
        if (avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            values.push(avatar_url.trim());
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Không có dữ liệu cập nhật' });
        }

        values.push(userId);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        const [rows] = await pool.query('SELECT id, username, display_name, email, avatar_url, role, bio FROM users WHERE id = ?', [userId]);
        res.json({ success: true, message: 'Cập nhật thông tin thành công!', user: rows[0] });
    } catch (e) {
        console.error('Admin updateAdminProfile error:', e);
        res.status(500).json({ message: 'Lỗi cập nhật hồ sơ admin', error: e.message });
    }
};

// POST /api/admin/change-password
export const changeAdminPassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu cũ và mới!' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có tối thiểu 8 ký tự!' });
        }

        const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (!rows.length) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (e) {
        console.error('Admin changeAdminPassword error:', e);
        res.status(500).json({ message: 'Lỗi đổi mật khẩu admin', error: e.message });
    }
};

