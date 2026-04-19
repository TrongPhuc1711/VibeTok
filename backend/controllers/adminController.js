import { AdminModel } from '../models/adminModel.js';
import bcrypt from 'bcryptjs';

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
        const ok = await AdminModel.hideVideo(req.params.id);
        if (!ok) return res.status(404).json({ message: 'Video không tồn tại' });
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
        const { mat_khau_moi } = req.body;
        const userId = req.params.id;

        if (!mat_khau_moi) {
            return res.status(400).json({ message: 'Vui lòng nhập mật khẩu mới!' });
        }

        if (mat_khau_moi.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 8 ký tự!' });
        }

        // Không cho đổi mật khẩu của admin khác
        const ok = await AdminModel.resetUserPassword(userId, mat_khau_moi);
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
        const { title, artist, duration, audioUrl, cover, trending } = req.body;
        if (!title || !artist) {
            return res.status(400).json({ message: 'Tên bài hát và nghệ sĩ là bắt buộc!' });
        }
        const id = await AdminModel.createMusic({ title, artist, duration, audioUrl, cover, trending });
        res.status(201).json({ message: 'Đã thêm bài hát!', id });
    } catch (e) {
        console.error('Admin createMusic error:', e);
        res.status(500).json({ message: 'Lỗi thêm bài hát', error: e.message });
    }
};

// PATCH /api/admin/music/:id
export const updateMusic = async (req, res) => {
    try {
        const ok = await AdminModel.updateMusic(req.params.id, req.body);
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
